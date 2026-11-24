import React, { useEffect, useMemo, useState } from "react";
import {
  Play,
  Download,
  Trash2,
  ListPlus,
  Search,
  X,
  Check,
  HardDrive,
} from "lucide-react";
import {
  buildChapterAudioUrl,
  fetchReciterCatalog,
  type ChapterReciter,
  type ReciterCatalog,
  type VerseReciter,
} from "../lib/audioApi";
import { getAllChapters } from "../lib/quran";
import {
  buildChapterTrack,
  useAudioStore,
  type ActiveReciter,
  type AudioMode,
} from "../stores/audioStore";
import { useDownloadsStore } from "../stores/downloadsStore";
import { useSettingsStore } from "../stores/settingsStore";
import { convertLocalFileSrc } from "../lib/tauri";
import { useI18n } from "../hooks/useI18n";
import {
  Button,
  EmptyState,
  ErrorState,
  SegmentedControl,
  Skeleton,
} from "../components/ui";

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let idx = 0;
  let val = bytes;
  while (val >= 1024 && idx < units.length - 1) {
    val /= 1024;
    idx++;
  }
  return `${val.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
}

export const AudioPage: React.FC = () => {
  const { dict, fmt, num } = useI18n();
  const showToast = useSettingsStore((s) => s.showToast);

  const activeReciter = useAudioStore((s) => s.activeReciter);
  const setActiveReciter = useAudioStore((s) => s.setActiveReciter);
  const playSurahFromVerse = useAudioStore((s) => s.playSurahFromVerse);
  const playTrack = useAudioStore((s) => s.playTrack);
  const addToQueue = useAudioStore((s) => s.addToQueue);

  const downloadsMap = useDownloadsStore((s) => s.items);
  const startDownload = useDownloadsStore((s) => s.startDownload);
  const cancelDownload = useDownloadsStore((s) => s.cancelDownload);
  const deleteDownload = useDownloadsStore((s) => s.deleteDownload);
  const totalBytes = useDownloadsStore((s) => s.getTotalBytes());

  const [tab, setTab] = useState<"reciters" | "downloads">("reciters");
  const [mode, setMode] = useState<AudioMode>("chapter");
  const [catalog, setCatalog] = useState<ReciterCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRiwayah, setSelectedRiwayah] = useState<number | "">("");
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [surahFilter, setSurahFilter] = useState("");

  const allChapters = useMemo(() => getAllChapters(), []);

  const loadCatalog = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReciterCatalog(force);
      setCatalog(data);
    } catch {
      setError(dict.common.networkError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredChapterReciters = useMemo<ChapterReciter[]>(() => {
    if (!catalog) return [];
    let list = catalog.chapterReciters.filter((r) => r.moshaf.length > 0);
    if (selectedRiwayah !== "") {
      const validIds = catalog.moshafs
        .filter((m) => m.moshaf_id === selectedRiwayah)
        .map((m) => m.id);
      list = list.filter((r) =>
        r.moshaf.some((m) => validIds.includes(m.moshaf_type)),
      );
    }
    if (selectedStyle) {
      list = list.filter((r) =>
        r.moshaf.some((m) => {
          const def = catalog.moshafs.find((d) => d.id === m.moshaf_type);
          const n = (def?.name ?? m.name).toLowerCase();
          if (selectedStyle === "murattal") return n.includes("murattal");
          if (selectedStyle === "mujawwad") return n.includes("mojawwad") || n.includes("mujawwad");
          if (selectedStyle === "teaching") return n.includes("mo'lim") || n.includes("molim");
          return true;
        }),
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q));
    }
    return list;
  }, [catalog, selectedRiwayah, selectedStyle, searchQuery]);

  const filteredVerseReciters = useMemo<VerseReciter[]>(() => {
    if (!catalog) return [];
    const q = searchQuery.trim().toLowerCase();
    return catalog.verseReciters.filter(
      (r) =>
        !q ||
        r.englishName.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q),
    );
  }, [catalog, searchQuery]);

  const filteredSurahs = useMemo(() => {
    const q = surahFilter.trim().toLowerCase();
    if (!q) return allChapters;
    return allChapters.filter(
      (c) =>
        String(c.number) === q ||
        c.name.toLowerCase().includes(q) ||
        c.arabicname.includes(q),
    );
  }, [allChapters, surahFilter]);

  const downloadsList = useMemo(
    () =>
      Object.values(downloadsMap).sort((a, b) => b.updatedAt - a.updatedAt),
    [downloadsMap],
  );
  const inProgressDownloads = downloadsList.filter(
    (d) => d.status === "downloading",
  );
  const completedDownloads = downloadsList.filter(
    (d) => d.status === "completed",
  );

  const selectReciter = (rec: ActiveReciter) => {
    setActiveReciter(rec);
    showToast(`${dict.audio.activeReciter}: ${rec.name}`, "info");
  };

  const handleDownloadSurah = (chapterNum: number, surahName: string) => {
    if (activeReciter.mode !== "chapter") {
      showToast("Switch to a Chapter reciter to download a full surah MP3.", "info");
      return;
    }
    const id = `${activeReciter.id}:${chapterNum}:full`;
    const url = buildChapterAudioUrl(activeReciter.server, chapterNum);
    void startDownload({
      id,
      reciterId: activeReciter.id,
      reciterName: activeReciter.name,
      chapter: chapterNum,
      surahName,
      url,
      relativePath: `downloads/${activeReciter.id}-${String(chapterNum).padStart(3, "0")}.mp3`,
    });
  };

  const handlePlayDownloaded = async (item: (typeof completedDownloads)[number]) => {
    const src = item.localPath
      ? await convertLocalFileSrc(item.localPath)
      : item.url;
    playTrack(
      {
        id: `local-${item.id}-${Date.now()}`,
        audioUrl: src,
        chapter: item.chapter,
        surahName: item.surahName,
        reciterId: item.reciterId,
        reciterName: item.reciterName,
        server: "",
        mode: "chapter",
      },
      [],
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight">
              {dict.audio.title}
            </h1>
            <p className="text-[13px] text-[var(--color-text-muted)]">
              {dict.audio.activeReciter}:{" "}
              <span className="font-medium text-[var(--color-primary)]">
                {activeReciter.name}
              </span>
            </p>
          </div>

          <SegmentedControl
            ariaLabel="Audio sections"
            value={tab}
            onChange={setTab}
            options={[
              { value: "reciters", label: dict.audio.tabReciters },
              {
                value: "downloads",
                label: `${dict.audio.tabDownloads} (${completedDownloads.length + inProgressDownloads.length})`,
              },
            ]}
          />
        </div>
      </div>

      {tab === "reciters" ? (
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left column: Reciter Browser */}
          <div className="flex min-h-0 flex-col border-e border-[var(--color-border)] lg:col-span-5 overflow-hidden">
            <div className="shrink-0 space-y-2.5 border-b border-[var(--color-border)] p-4">
              <SegmentedControl
                ariaLabel="Reciter type"
                value={mode}
                onChange={setMode}
                options={[
                  { value: "chapter", label: dict.audio.modeChapter },
                  { value: "verse_by_verse", label: dict.audio.modeVerse },
                ]}
              />

              <div className="relative">
                <Search
                  size={15}
                  className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={dict.audio.searchReciters}
                  aria-label={dict.audio.searchReciters}
                  className="h-9 w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg)] ps-9 pe-3 text-[13px]"
                />
              </div>

              {mode === "chapter" && catalog && (
                <div className="flex gap-2">
                  <select
                    aria-label={dict.audio.allRiwayat}
                    value={selectedRiwayah}
                    onChange={(e) =>
                      setSelectedRiwayah(e.target.value ? Number(e.target.value) : "")
                    }
                    className="h-8 flex-1 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg)] px-2 text-[12px]"
                  >
                    <option value="">{dict.audio.allRiwayat}</option>
                    {catalog.riwayat.map((rw) => (
                      <option key={rw.id} value={rw.id}>
                        {rw.name}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label={dict.audio.allStyles}
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    className="h-8 flex-1 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg)] px-2 text-[12px]"
                  >
                    <option value="">{dict.audio.allStyles}</option>
                    <option value="murattal">{dict.audio.styleMurattal}</option>
                    <option value="mujawwad">{dict.audio.styleMujawwad}</option>
                    <option value="teaching">{dict.audio.styleTeaching}</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-border)]">
              {loading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : error ? (
                <ErrorState
                  message={error}
                  onRetry={() => void loadCatalog(true)}
                  retryLabel={dict.common.retry}
                />
              ) : mode === "chapter" ? (
                filteredChapterReciters.map((r) => {
                  const m = r.moshaf[0]!;
                  const recId = `mp3q-${r.id}-${m.id}`;
                  const active = activeReciter.id === recId;
                  return (
                    <button
                      key={recId}
                      type="button"
                      onClick={() =>
                        selectReciter({
                          id: recId,
                          name: r.name,
                          server: m.server,
                          mode: "chapter",
                          moshafName: m.name,
                        })
                      }
                      className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-start hover:bg-[var(--color-surface-2)] cursor-pointer ${
                        active ? "bg-[var(--color-primary-tint)]" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-medium">
                          {r.name}
                        </div>
                        <div className="truncate text-[12px] text-[var(--color-text-muted)]">
                          {m.name} · {fmt(dict.audio.surahsAvailable, { count: num(m.surah_total) })}
                        </div>
                      </div>
                      {active && (
                        <Check size={16} className="shrink-0 text-[var(--color-primary)]" />
                      )}
                    </button>
                  );
                })
              ) : (
                filteredVerseReciters.map((r) => {
                  const active = activeReciter.id === r.identifier;
                  return (
                    <button
                      key={r.identifier}
                      type="button"
                      onClick={() =>
                        selectReciter({
                          id: r.identifier,
                          name: r.englishName,
                          server: r.server,
                          mode: "verse_by_verse",
                        })
                      }
                      className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-start hover:bg-[var(--color-surface-2)] cursor-pointer ${
                        active ? "bg-[var(--color-primary-tint)]" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-medium">
                          {r.englishName}
                        </div>
                        <div className="truncate text-[12px] text-[var(--color-text-muted)]">
                          {r.name}
                        </div>
                      </div>
                      {active && (
                        <Check size={16} className="shrink-0 text-[var(--color-primary)]" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right column: Surahs for Active Reciter */}
          <div className="flex min-h-0 flex-col lg:col-span-7 overflow-hidden">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-3">
              <div className="min-w-0">
                <div className="truncate text-[15px] font-semibold">
                  {activeReciter.name}
                </div>
                <div className="text-[12px] text-[var(--color-text-muted)]">
                  {activeReciter.mode === "verse_by_verse"
                    ? dict.audio.modeVerse
                    : activeReciter.moshafName ?? dict.audio.modeChapter}
                </div>
              </div>
              <input
                type="text"
                value={surahFilter}
                onChange={(e) => setSurahFilter(e.target.value)}
                placeholder={dict.quran.searchPlaceholder}
                className="h-8 w-52 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 text-[13px]"
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-border)] px-5">
              {filteredSurahs.map((ch) => {
                const dlId = `${activeReciter.id}:${ch.number}:full`;
                const dl = downloadsMap[dlId];
                return (
                  <div
                    key={ch.number}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 text-center text-[12px] tabular-nums text-[var(--color-text-muted)]">
                        {num(ch.number)}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-medium">
                          {ch.name}
                        </div>
                        <div className="text-[12px] text-[var(--color-text-muted)]">
                          {ch.arabicname} · {fmt(dict.quran.versesCount, { count: num(ch.versesCount) })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => playSurahFromVerse(ch.number, 1)}
                        aria-label={`${dict.audio.playSurah} ${ch.name}`}
                      >
                        <Play size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (activeReciter.mode === "chapter") {
                            addToQueue(buildChapterTrack(activeReciter, ch.number));
                            showToast(`${dict.audio.addToQueue}: ${ch.name}`, "info");
                          }
                        }}
                        aria-label={dict.audio.addToQueue}
                      >
                        <ListPlus size={14} />
                      </Button>
                      {activeReciter.mode === "chapter" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={dl?.status === "downloading"}
                          onClick={() => handleDownloadSurah(ch.number, ch.name)}
                          aria-label={dict.audio.download}
                        >
                          {dl?.status === "completed" ? (
                            <Check size={14} className="text-[var(--color-success)]" />
                          ) : dl?.status === "downloading" ? (
                            <span className="text-[11px] tabular-nums">
                              {Math.round(dl.progress * 100)}%
                            </span>
                          ) : (
                            <Download size={14} />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Downloads Tab */
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[760px] px-8 py-6 space-y-6">
            <div className="flex items-center justify-between text-[13px] text-[var(--color-text-muted)] border-b border-[var(--color-border)] pb-3">
              <span className="flex items-center gap-2">
                <HardDrive size={15} />
                {fmt(dict.audio.totalDiskUsage, { size: formatBytes(totalBytes) })}
              </span>
            </div>

            {inProgressDownloads.length > 0 && (
              <section>
                <h2 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                  {dict.audio.inProgress}
                </h2>
                <div className="divide-y divide-[var(--color-border)]">
                  {inProgressDownloads.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-medium truncate">
                          {item.surahName} — {item.reciterName}
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                            <div
                              className="h-full bg-[var(--color-primary)] transition-all"
                              style={{ width: `${Math.round(item.progress * 100)}%` }}
                            />
                          </div>
                          <span className="text-[12px] tabular-nums text-[var(--color-text-muted)]">
                            {Math.round(item.progress * 100)}%
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void cancelDownload(item.id)}
                        aria-label={dict.audio.cancelDownload}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {completedDownloads.length === 0 && inProgressDownloads.length === 0 ? (
              <EmptyState
                icon={<Download size={28} strokeWidth={1.75} />}
                title={dict.audio.downloadsEmptyTitle}
                description={dict.audio.downloadsEmptyDesc}
              />
            ) : (
              completedDownloads.length > 0 && (
                <section>
                  <h2 className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                    {dict.audio.completed}
                  </h2>
                  <div className="divide-y divide-[var(--color-border)]">
                    {completedDownloads.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 py-3"
                      >
                        <div className="min-w-0">
                          <div className="text-[14px] font-medium truncate">
                            {item.surahName}
                          </div>
                          <div className="text-[12px] text-[var(--color-text-muted)]">
                            {item.reciterName} · {formatBytes(item.bytes)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="subtle"
                            size="sm"
                            onClick={() => void handlePlayDownloaded(item)}
                          >
                            <Play size={14} /> {dict.common.play}
                          </Button>
                          <Button
                            variant="icon"
                            size="sm"
                            onClick={() => void deleteDownload(item.id)}
                            aria-label={dict.audio.deleteDownload}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};
