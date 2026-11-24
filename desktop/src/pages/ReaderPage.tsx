import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Play,
  Pause,
  Bookmark,
  Copy,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  PanelRight,
  Headphones,
  Search,
  X,
} from "lucide-react";
import {
  getChapterMetadata,
  getChapterPages,
  getChapterVerses,
  getVerseMetadata,
  getVerseTransliteration,
  isSajdaVerse,
  normalizeSearchText,
} from "../lib/quran";
import { loadTranslationPack, type TranslationData } from "../data/translations";
import { toArabicIndic } from "../lib/i18n";
import { useI18n } from "../hooks/useI18n";
import { useSettingsStore, type ReadingMode } from "../stores/settingsStore";
import { useReadingStore } from "../stores/readingStore";
import { useAudioStore } from "../stores/audioStore";
import { copyTextToClipboard } from "../lib/tauri";
import { Button, Dialog, SegmentedControl, Toggle } from "../components/ui";
import { ReciterPickerDialog } from "../components/audio/ReciterPickerDialog";
import {
  ShareVerseDialog,
  type ShareVerseTarget,
} from "../components/reader/ShareVerseDialog";
import { MushafReader } from "../components/reader/MushafReader";

export const ReaderPage: React.FC = () => {
  const { surahId } = useParams<{ surahId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { dict, fmt, num, isRTL } = useI18n();

  const chapter = Math.max(1, Math.min(114, Number(surahId) || 1));
  const targetVerseParam = Number(searchParams.get("verse")) || null;
  const targetPageParam = Number(searchParams.get("page")) || null;

  const readingMode = useSettingsStore((s) => s.readingMode);
  const showTranslation = useSettingsStore((s) => s.showTranslation);
  const showTransliteration = useSettingsStore((s) => s.showTransliteration);
  const arabicFontSize = useSettingsStore((s) => s.arabicFontSize);
  const translationFontSize = useSettingsStore((s) => s.translationFontSize);
  const translationPackId = useSettingsStore((s) => s.translationPackId);
  const followAudio = useSettingsStore((s) => s.followAudio);
  const updateSettings = useSettingsStore((s) => s.update);
  const showToast = useSettingsStore((s) => s.showToast);

  const bookmarks = useReadingStore((s) => s.bookmarks);
  const toggleBookmark = useReadingStore((s) => s.toggleBookmark);
  const setLastRead = useReadingStore((s) => s.setLastRead);

  const activeReciter = useAudioStore((s) => s.activeReciter);
  const currentTrack = useAudioStore((s) => s.currentTrack);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const playSurahFromVerse = useAudioStore((s) => s.playSurahFromVerse);
  const togglePlayPause = useAudioStore((s) => s.togglePlayPause);

  const chapterMeta = useMemo(() => getChapterMetadata(chapter), [chapter]);
  const verses = useMemo(() => getChapterVerses(chapter), [chapter]);
  const chapterPages = useMemo(() => getChapterPages(chapter), [chapter]);

  const [translationData, setTranslationData] = useState<TranslationData | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<number>(targetVerseParam ?? 1);
  const [flashVerse, setFlashVerse] = useState<number | null>(targetVerseParam);
  const [mushafPage, setMushafPage] = useState<number>(
    targetPageParam ?? chapterPages[0] ?? 1,
  );
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [reciterPickerOpen, setReciterPickerOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<ShareVerseTarget | null>(null);
  const [inSurahSearchOpen, setInSurahSearchOpen] = useState(false);
  const [inSurahQuery, setInSurahQuery] = useState("");
  const [goToOpen, setGoToOpen] = useState(false);
  const [goToInput, setGoToInput] = useState("");

  const scrollParentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadTranslationPack(translationPackId).then(setTranslationData);
  }, [translationPackId]);

  // Reset selected verse / page when surah or query params change
  useEffect(() => {
    const v = targetVerseParam && targetVerseParam <= verses.length ? targetVerseParam : 1;
    setSelectedVerse(v);
    if (targetVerseParam) {
      setFlashVerse(targetVerseParam);
      const t = setTimeout(() => setFlashVerse(null), 1500);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [chapter, targetVerseParam, verses.length]);

  useEffect(() => {
    if (targetPageParam) {
      setMushafPage(targetPageParam);
    } else if (chapterPages[0]) {
      setMushafPage(chapterPages[0]);
    }
  }, [chapter, targetPageParam, chapterPages]);

  // Filter verses if in-surah search is active
  const visibleIndices = useMemo(() => {
    const q = normalizeSearchText(inSurahQuery);
    if (!inSurahSearchOpen || !q) {
      return verses.map((_, i) => i + 1);
    }
    const chTrans = translationData?.[chapter];
    const matches: number[] = [];
    for (let i = 0; i < verses.length; i++) {
      const vNum = i + 1;
      const ar = verses[i] ?? "";
      const tr = chTrans?.[vNum] ?? "";
      const tl = getVerseTransliteration(chapter, vNum) ?? "";
      if (
        normalizeSearchText(ar).includes(q) ||
        normalizeSearchText(tr).includes(q) ||
        normalizeSearchText(tl).includes(q)
      ) {
        matches.push(vNum);
      }
    }
    return matches;
  }, [inSurahSearchOpen, inSurahQuery, verses, translationData, chapter]);

  const virtualizer = useVirtualizer({
    count: visibleIndices.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => 148,
    overscan: 6,
  });

  // Scroll to target verse on deep link
  useEffect(() => {
    if (readingMode !== "list" || !targetVerseParam) return;
    const idx = visibleIndices.indexOf(targetVerseParam);
    if (idx >= 0) {
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(idx, { align: "center" });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter, targetVerseParam, readingMode]);

  // Auto-follow playing verse in verse-by-verse mode
  const playingVerse =
    currentTrack?.mode === "verse_by_verse" && currentTrack.chapter === chapter
      ? currentTrack.verse ?? null
      : null;

  useEffect(() => {
    if (!playingVerse || !followAudio) return;
    setSelectedVerse(playingVerse);
    if (readingMode === "list") {
      const idx = visibleIndices.indexOf(playingVerse);
      if (idx >= 0) {
        virtualizer.scrollToIndex(idx, { align: "center" });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playingVerse, followAudio, readingMode]);

  // Persist last-read across ALL reading modes (List, Focus, Mushaf)
  useEffect(() => {
    const vm = getVerseMetadata(chapter, selectedVerse);
    setLastRead({
      chapter,
      verse: selectedVerse,
      page: readingMode === "mushaf" ? mushafPage : vm?.page ?? chapterPages[0] ?? 1,
      juz: vm?.juz ?? 1,
      mode: readingMode,
    });
  }, [chapter, selectedVerse, mushafPage, readingMode, chapterPages, setLastRead]);

  const bookmarkedSet = useMemo(
    () => new Set(bookmarks.map((b) => b.id)),
    [bookmarks],
  );

  const handleCopyVerse = useCallback(
    async (verseNum: number) => {
      const ar = verses[verseNum - 1] ?? "";
      const tr = translationData?.[chapter]?.[verseNum];
      const ref = `${chapterMeta?.name ?? `Surah ${chapter}`} ${chapter}:${verseNum}`;
      const payload = tr ? `${ar}\n\n${tr}\n— ${ref}` : `${ar}\n— ${ref}`;
      await copyTextToClipboard(payload);
      showToast(dict.reader.verseCopied, "success");
    },
    [verses, translationData, chapter, chapterMeta, showToast, dict],
  );

  const handleToggleBookmark = useCallback(
    (verseNum: number) => {
      const added = toggleBookmark(chapter, verseNum);
      showToast(
        added ? dict.reader.bookmarkAdded : dict.reader.bookmarkRemoved,
        "info",
      );
    },
    [toggleBookmark, chapter, showToast, dict],
  );

  const openShareForVerse = useCallback(
    (verseNum: number) => {
      setShareTarget({
        chapter,
        verse: verseNum,
        surahName: chapterMeta?.name ?? `Surah ${chapter}`,
        surahArabicName: chapterMeta?.arabicname ?? "",
        arabicText: verses[verseNum - 1] ?? "",
        translationText: translationData?.[chapter]?.[verseNum] ?? null,
      });
    },
    [chapter, chapterMeta, verses, translationData],
  );

  // Reader keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setInSurahSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 10);
        return;
      }
      if (mod && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        updateSettings({ arabicFontSize: Math.min(64, arabicFontSize + 2) });
        return;
      }
      if (mod && e.key === "-") {
        e.preventDefault();
        updateSettings({ arabicFontSize: Math.max(24, arabicFontSize - 2) });
        return;
      }

      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (readingMode === "mushaf") return;

      const key = e.key.toLowerCase();
      if (key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedVerse((v) => {
          const next = Math.min(verses.length, v + 1);
          if (readingMode === "list") {
            const idx = visibleIndices.indexOf(next);
            if (idx >= 0) virtualizer.scrollToIndex(idx, { align: "auto" });
          }
          return next;
        });
      } else if (key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedVerse((v) => {
          const prev = Math.max(1, v - 1);
          if (readingMode === "list") {
            const idx = visibleIndices.indexOf(prev);
            if (idx >= 0) virtualizer.scrollToIndex(idx, { align: "auto" });
          }
          return prev;
        });
      } else if (e.key === "Enter") {
        e.preventDefault();
        playSurahFromVerse(chapter, selectedVerse);
      } else if (key === "b") {
        e.preventDefault();
        handleToggleBookmark(selectedVerse);
      } else if (key === "c" && !mod) {
        e.preventDefault();
        void handleCopyVerse(selectedVerse);
      } else if (key === "g") {
        e.preventDefault();
        setGoToInput(String(selectedVerse));
        setGoToOpen(true);
      } else if (e.key === "ArrowLeft") {
        if (readingMode === "focus") {
          setSelectedVerse((v) => (isRTL ? Math.min(verses.length, v + 1) : Math.max(1, v - 1)));
        } else if (chapter > 1) {
          navigate(`/quran/${chapter - 1}`);
        }
      } else if (e.key === "ArrowRight") {
        if (readingMode === "focus") {
          setSelectedVerse((v) => (isRTL ? Math.max(1, v - 1) : Math.min(verses.length, v + 1)));
        } else if (chapter < 114) {
          navigate(`/quran/${chapter + 1}`);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    arabicFontSize,
    chapter,
    handleCopyVerse,
    handleToggleBookmark,
    isRTL,
    navigate,
    playSurahFromVerse,
    readingMode,
    selectedVerse,
    updateSettings,
    verses.length,
    virtualizer,
    visibleIndices,
  ]);

  const isThisSurahPlaying = currentTrack?.chapter === chapter && isPlaying;
  const selectedMeta = getVerseMetadata(chapter, selectedVerse);
  const showBismillah = chapter !== 1 && chapter !== 9;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Sticky Reader Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5">
        <div className="flex items-center gap-2">
          <Button
            variant="icon"
            size="sm"
            disabled={chapter <= 1}
            onClick={() => navigate(`/quran/${chapter - 1}`)}
            aria-label={dict.reader.prevSurah}
          >
            {isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
          <span className="text-[14px] font-semibold">
            {num(chapter)}. {chapterMeta?.name}
          </span>
          <Button
            variant="icon"
            size="sm"
            disabled={chapter >= 114}
            onClick={() => navigate(`/quran/${chapter + 1}`)}
            aria-label={dict.reader.nextSurah}
          >
            {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </Button>
        </div>

        <SegmentedControl<ReadingMode>
          ariaLabel="Reading mode"
          value={readingMode}
          onChange={(mode) => updateSettings({ readingMode: mode })}
          options={[
            { value: "list", label: dict.reader.modeList },
            { value: "focus", label: dict.reader.modeFocus },
            { value: "mushaf", label: dict.reader.modeMushaf },
          ]}
        />

        <div className="flex items-center gap-1.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (isThisSurahPlaying) {
                togglePlayPause(false);
              } else {
                playSurahFromVerse(chapter, selectedVerse);
              }
            }}
          >
            {isThisSurahPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span className="hidden sm:inline">{dict.reader.playSurah}</span>
          </Button>

          <Button
            variant="subtle"
            size="sm"
            onClick={() => setReciterPickerOpen(true)}
            aria-label={dict.reader.changeReciter}
          >
            <Headphones size={14} />
            <span className="hidden md:inline max-w-[140px] truncate">
              {activeReciter.name}
            </span>
          </Button>

          <Button
            variant="icon"
            size="sm"
            onClick={() => {
              setInSurahSearchOpen((v) => !v);
              setTimeout(() => searchInputRef.current?.focus(), 10);
            }}
            aria-label={dict.reader.inSurahSearch}
          >
            <Search size={16} strokeWidth={1.75} />
          </Button>

          {readingMode !== "mushaf" && (
            <Button
              variant="icon"
              size="sm"
              onClick={() => setInspectorOpen((v) => !v)}
              aria-label={dict.reader.toggleInspector}
              className={inspectorOpen ? "!text-[var(--color-primary)]" : ""}
            >
              <PanelRight size={16} strokeWidth={1.75} />
            </Button>
          )}
        </div>
      </div>

      {/* Optional In-Surah Search Bar */}
      {inSurahSearchOpen && readingMode === "list" && (
        <div className="flex shrink-0 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-2">
          <Search size={14} className="text-[var(--color-text-muted)]" />
          <input
            ref={searchInputRef}
            type="text"
            value={inSurahQuery}
            onChange={(e) => setInSurahQuery(e.target.value)}
            placeholder={dict.reader.inSurahSearch}
            className="flex-1 bg-transparent text-[13px] focus:outline-none"
          />
          <span className="text-[12px] text-[var(--color-text-muted)] tabular-nums">
            {visibleIndices.length} / {verses.length}
          </span>
          <Button
            variant="icon"
            size="sm"
            onClick={() => {
              setInSurahSearchOpen(false);
              setInSurahQuery("");
            }}
            aria-label={dict.common.close}
          >
            <X size={14} />
          </Button>
        </div>
      )}

      {/* Main Content + Optional Right Inspector */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {readingMode === "mushaf" ? (
          <MushafReader
            page={mushafPage}
            onChangePage={setMushafPage}
            onSwitchToList={() => updateSettings({ readingMode: "list" })}
          />
        ) : readingMode === "focus" ? (
          /* Focus Mode: one verse centered */
          <div className="flex flex-1 flex-col items-center justify-between overflow-y-auto px-8 py-8">
            <div className="text-center">
              <div className="font-quran text-[30px] text-[var(--color-text)]">
                {chapterMeta?.arabicname}
              </div>
              <div className="text-[13px] text-[var(--color-text-muted)]">
                {chapterMeta?.name} · {num(selectedVerse)} / {num(verses.length)}
              </div>
            </div>

            <div className="my-auto w-full max-w-[740px] py-8 text-center">
              <p
                dir="rtl"
                className="font-quran text-center text-[var(--color-text)]"
                style={{ fontSize: `${Math.min(64, arabicFontSize + 6)}px` }}
              >
                {verses[selectedVerse - 1]}
                <span className="verse-end-badge">{toArabicIndic(selectedVerse)}</span>
              </p>

              {showTransliteration && (
                <p className="mt-5 text-[15px] italic text-[var(--color-text-muted)]">
                  {getVerseTransliteration(chapter, selectedVerse)}
                </p>
              )}

              {showTranslation && translationData?.[chapter]?.[selectedVerse] && (
                <p
                  className="mt-4 leading-relaxed text-[var(--color-text-muted)]"
                  style={{ fontSize: `${translationFontSize + 1}px` }}
                >
                  {translationData[chapter]?.[selectedVerse]}
                </p>
              )}

              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => playSurahFromVerse(chapter, selectedVerse)}
                >
                  <Play size={14} /> {dict.reader.playFromHere}
                </Button>
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => handleToggleBookmark(selectedVerse)}
                >
                  <Bookmark
                    size={14}
                    className={
                      bookmarkedSet.has(`${chapter}:${selectedVerse}`)
                        ? "fill-[var(--color-primary)] text-[var(--color-primary)]"
                        : ""
                    }
                  />
                  {dict.reader.bookmark}
                </Button>
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => void handleCopyVerse(selectedVerse)}
                >
                  <Copy size={14} /> {dict.reader.copyVerse}
                </Button>
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => openShareForVerse(selectedVerse)}
                >
                  <ImageIcon size={14} /> {dict.reader.shareCard}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="subtle"
                size="sm"
                disabled={selectedVerse <= 1}
                onClick={() => setSelectedVerse((v) => Math.max(1, v - 1))}
              >
                {isRTL ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
                {dict.reader.prevVerse}
              </Button>
              <span className="text-[13px] tabular-nums text-[var(--color-text-muted)]">
                {num(selectedVerse)} / {num(verses.length)}
              </span>
              <Button
                variant="subtle"
                size="sm"
                disabled={selectedVerse >= verses.length}
                onClick={() => setSelectedVerse((v) => Math.min(verses.length, v + 1))}
              >
                {dict.reader.nextVerse}
                {isRTL ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
              </Button>
            </div>
          </div>
        ) : (
          /* List Mode: virtualized hairline verse rows */
          <div ref={scrollParentRef} className="flex-1 overflow-y-auto px-6 md:px-10">
            <div className="mx-auto max-w-[760px] pb-16">
              {/* Surah Header */}
              <header className="border-b border-[var(--color-border)] py-8 text-center">
                <h1
                  dir="rtl"
                  className="font-quran text-[38px] leading-[1.7] text-[var(--color-text)]"
                >
                  {chapterMeta?.arabicname}
                </h1>
                <p className="mt-1 text-[18px] font-semibold text-[var(--color-text)]">
                  {chapterMeta?.name}{" "}
                  <span className="font-normal text-[var(--color-text-muted)]">
                    · {chapterMeta?.englishname}
                  </span>
                </p>
                <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
                  {chapterMeta?.revelation === "Mecca"
                    ? dict.quran.revelationMecca
                    : dict.quran.revelationMadina}{" "}
                  · {fmt(dict.quran.versesCount, { count: num(verses.length) })}
                </p>
                {showBismillah && (
                  <div
                    dir="rtl"
                    className="font-quran mt-5 text-[28px] text-[var(--color-primary)]"
                  >
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                  </div>
                )}
                {activeReciter.mode === "chapter" && (
                  <p className="mt-3 text-[12px] text-[var(--color-text-muted)]">
                    {dict.audio.chapterAudioNote}
                  </p>
                )}
              </header>

              {/* Virtualized Verses */}
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  position: "relative",
                  width: "100%",
                }}
              >
                {virtualizer.getVirtualItems().map((vRow) => {
                  const verseNum = visibleIndices[vRow.index]!;
                  const arabicText = verses[verseNum - 1] ?? "";
                  const translation = translationData?.[chapter]?.[verseNum] ?? null;
                  const transliteration = showTransliteration
                    ? getVerseTransliteration(chapter, verseNum)
                    : null;
                  const meta = getVerseMetadata(chapter, verseNum);
                  const sajda = isSajdaVerse(meta);
                  const isBookmarked = bookmarkedSet.has(`${chapter}:${verseNum}`);
                  const isSelected = selectedVerse === verseNum;
                  const isPlayingThis = playingVerse === verseNum;
                  const isFlashing = flashVerse === verseNum;

                  return (
                    <div
                      key={verseNum}
                      data-index={vRow.index}
                      ref={virtualizer.measureElement}
                      style={{
                        position: "absolute",
                        top: 0,
                        insetInlineStart: 0,
                        width: "100%",
                        transform: `translateY(${vRow.start}px)`,
                      }}
                      onClick={() => setSelectedVerse(verseNum)}
                      className={`group border-b border-[var(--color-border)] px-3 py-5 transition-colors ${
                        isFlashing ? "verse-flash" : ""
                      } ${
                        isPlayingThis
                          ? "bg-[var(--color-primary-tint)] border-s-2 border-s-[var(--color-accent)]"
                          : isSelected
                            ? "bg-[var(--color-primary-tint)]/60"
                            : "hover:bg-[var(--color-surface-2)]/50"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Number gutter */}
                        <div className="flex w-10 shrink-0 flex-col items-center gap-1.5 pt-2">
                          <span className="text-[12px] font-medium tabular-nums text-[var(--color-text-muted)]">
                            {num(chapter)}:{num(verseNum)}
                          </span>
                          {sajda && (
                            <span
                              title={dict.reader.sajda}
                              className="rounded-full bg-[var(--color-accent-tint)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-accent-text)]"
                            >
                              ۩
                            </span>
                          )}
                        </div>

                        {/* Verse content */}
                        <div className="min-w-0 flex-1">
                          <p
                            dir="rtl"
                            className="font-quran text-right text-[var(--color-text)]"
                            style={{ fontSize: `${arabicFontSize}px` }}
                          >
                            {arabicText}
                            <span className="verse-end-badge">
                              {toArabicIndic(verseNum)}
                            </span>
                          </p>

                          {transliteration && (
                            <p className="mt-2 text-[13px] italic text-[var(--color-text-muted)]">
                              {transliteration}
                            </p>
                          )}

                          {showTranslation && translation && (
                            <p
                              dir="ltr"
                              className="mt-2.5 text-left leading-relaxed text-[var(--color-text-muted)]"
                              style={{ fontSize: `${translationFontSize}px` }}
                            >
                              {translation}
                            </p>
                          )}

                          {/* Compact hover/focus action row */}
                          <div className="mt-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 data-[active=true]:opacity-100" data-active={isSelected || isPlayingThis}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                playSurahFromVerse(chapter, verseNum);
                              }}
                              aria-label={dict.reader.playFromHere}
                            >
                              <Play size={13} />
                              <span>{dict.common.play}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleBookmark(verseNum);
                              }}
                              aria-label={
                                isBookmarked
                                  ? dict.reader.removeBookmark
                                  : dict.reader.bookmark
                              }
                            >
                              <Bookmark
                                size={13}
                                className={
                                  isBookmarked
                                    ? "fill-[var(--color-primary)] text-[var(--color-primary)]"
                                    : ""
                                }
                              />
                              <span>{dict.reader.bookmark}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleCopyVerse(verseNum);
                              }}
                              aria-label={dict.reader.copyVerse}
                            >
                              <Copy size={13} />
                              <span>{dict.common.copy}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openShareForVerse(verseNum);
                              }}
                              aria-label={dict.reader.shareCard}
                            >
                              <ImageIcon size={13} />
                              <span>{dict.reader.shareCard}</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Optional Right Verse Inspector Panel (320px) */}
        {inspectorOpen && readingMode !== "mushaf" && (
          <aside
            aria-label={dict.reader.inspector}
            className="hidden lg:flex w-[320px] shrink-0 flex-col border-s border-[var(--color-border)] bg-[var(--color-surface)] p-5 overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <h2 className="text-[14px] font-semibold">
                {dict.reader.inspector}
              </h2>
              <Button
                variant="icon"
                size="sm"
                onClick={() => setInspectorOpen(false)}
                aria-label={dict.common.close}
              >
                <X size={15} />
              </Button>
            </div>

            <div className="mt-4 space-y-5">
              <div>
                <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {chapterMeta?.name} · {num(chapter)}:{num(selectedVerse)}
                </div>
                {selectedMeta && (
                  <dl className="mt-3 grid grid-cols-2 gap-y-2.5 text-[13px]">
                    <dt className="text-[var(--color-text-muted)]">Juz</dt>
                    <dd className="font-medium text-end tabular-nums">
                      {num(selectedMeta.juz)}
                    </dd>
                    <dt className="text-[var(--color-text-muted)]">Page</dt>
                    <dd className="font-medium text-end tabular-nums">
                      {num(selectedMeta.page)}
                    </dd>
                    <dt className="text-[var(--color-text-muted)]">Ruku</dt>
                    <dd className="font-medium text-end tabular-nums">
                      {num(selectedMeta.ruku)}
                    </dd>
                    <dt className="text-[var(--color-text-muted)]">Manzil</dt>
                    <dd className="font-medium text-end tabular-nums">
                      {num(selectedMeta.manzil)}
                    </dd>
                    {isSajdaVerse(selectedMeta) && (
                      <>
                        <dt className="text-[var(--color-accent-text)] font-medium">
                          {dict.reader.sajda}
                        </dt>
                        <dd className="text-end text-[var(--color-accent-text)] font-semibold">
                          ۩
                        </dd>
                      </>
                    )}
                  </dl>
                )}
              </div>

              <div className="space-y-2 border-t border-[var(--color-border)] pt-4">
                <Button
                  variant="primary"
                  className="w-full justify-start"
                  onClick={() => playSurahFromVerse(chapter, selectedVerse)}
                >
                  <Play size={15} /> {dict.reader.playFromHere}
                </Button>
                <Button
                  variant="subtle"
                  className="w-full justify-start"
                  onClick={() => handleToggleBookmark(selectedVerse)}
                >
                  <Bookmark size={15} />
                  {bookmarkedSet.has(`${chapter}:${selectedVerse}`)
                    ? dict.reader.removeBookmark
                    : dict.reader.bookmark}
                </Button>
                <Button
                  variant="subtle"
                  className="w-full justify-start"
                  onClick={() => void handleCopyVerse(selectedVerse)}
                >
                  <Copy size={15} /> {dict.reader.copyVerse}
                </Button>
                <Button
                  variant="subtle"
                  className="w-full justify-start"
                  onClick={() => openShareForVerse(selectedVerse)}
                >
                  <ImageIcon size={15} /> {dict.reader.shareCard}
                </Button>
              </div>

              <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-4">
                <span className="text-[13px]">{dict.reader.followAudio}</span>
                <Toggle
                  checked={followAudio}
                  onChange={(v) => updateSettings({ followAudio: v })}
                  ariaLabel={dict.reader.followAudio}
                />
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Go to verse dialog (G shortcut) */}
      <Dialog
        open={goToOpen}
        onClose={() => setGoToOpen(false)}
        title={dict.reader.goToVerse}
        maxWidth="max-w-xs"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const v = Number(goToInput);
            if (v >= 1 && v <= verses.length) {
              setSelectedVerse(v);
              const idx = visibleIndices.indexOf(v);
              if (readingMode === "list" && idx >= 0) {
                virtualizer.scrollToIndex(idx, { align: "center" });
              }
              setGoToOpen(false);
            }
          }}
          className="space-y-3"
        >
          <p className="text-[13px] text-[var(--color-text-muted)]">
            {fmt(dict.reader.jumpPrompt, { max: num(verses.length) })}
          </p>
          <input
            type="number"
            min={1}
            max={verses.length}
            autoFocus
            value={goToInput}
            onChange={(e) => setGoToInput(e.target.value)}
            className="h-9 w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-[14px]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setGoToOpen(false)}>
              {dict.common.cancel}
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {dict.common.done}
            </Button>
          </div>
        </form>
      </Dialog>

      <ReciterPickerDialog
        open={reciterPickerOpen}
        onClose={() => setReciterPickerOpen(false)}
      />
      <ShareVerseDialog target={shareTarget} onClose={() => setShareTarget(null)} />
    </div>
  );
};
