import React, { useEffect, useMemo, useState } from "react";
import { Play, Square, Eye, EyeOff, CheckCircle2, RotateCcw } from "lucide-react";
import { getAllChapters, getChapterVerses } from "../lib/quran";
import { useHifzStore, type MemorizationStatus } from "../stores/hifzStore";
import { useAudioStore } from "../stores/audioStore";
import { useI18n } from "../hooks/useI18n";
import { Button, SegmentedControl } from "../components/ui";

type HifzTab = "loop" | "reveal" | "progress";

export const HifzPage: React.FC = () => {
  const { dict, num } = useI18n();
  const chapters = useMemo(() => getAllChapters(), []);

  const progress = useHifzStore((s) => s.progress);
  const setVerseStatus = useHifzStore((s) => s.setVerseStatus);
  const markSurahStatus = useHifzStore((s) => s.markSurahStatus);
  const getSurahCounts = useHifzStore((s) => s.getSurahCounts);

  const loopConfig = useAudioStore((s) => s.loopConfig);
  const startLoop = useAudioStore((s) => s.startLoop);
  const stopLoop = useAudioStore((s) => s.stopLoop);

  const [tab, setTab] = useState<HifzTab>("loop");
  const [selectedSurah, setSelectedSurah] = useState(112); // Al-Ikhlas default
  const verses = useMemo(() => getChapterVerses(selectedSurah), [selectedSurah]);

  const [startVerse, setStartVerse] = useState(1);
  const [endVerse, setEndVerse] = useState(verses.length);
  const [repeatCount, setRepeatCount] = useState(3); // 0 = infinite

  // Hide & Reveal state
  const [revealIndex, setRevealIndex] = useState(1);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setStartVerse(1);
    setEndVerse(verses.length);
    setRevealIndex(1);
    setRevealed(false);
  }, [selectedSurah, verses.length]);

  // Keyboard shortcuts for Hide & Reveal: Space reveals, 1/2/3 set status
  useEffect(() => {
    if (tab !== "reveal") return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.key === " ") {
        e.preventDefault();
        setRevealed((r) => !r);
      } else if (e.key === "1") {
        setVerseStatus(selectedSurah, revealIndex, "not_started");
      } else if (e.key === "2") {
        setVerseStatus(selectedSurah, revealIndex, "learning");
      } else if (e.key === "3") {
        setVerseStatus(selectedSurah, revealIndex, "memorized");
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        setRevealIndex((v) => Math.min(verses.length, v + 1));
        setRevealed(false);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        setRevealIndex((v) => Math.max(1, v - 1));
        setRevealed(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tab, selectedSurah, revealIndex, verses.length, setVerseStatus]);

  const totals = useMemo(() => {
    let memorized = 0;
    let learning = 0;
    for (const val of Object.values(progress)) {
      if (val === "memorized") memorized++;
      else if (val === "learning") learning++;
    }
    return {
      memorized,
      learning,
      remaining: Math.max(0, 6236 - memorized - learning),
    };
  }, [progress]);
  const memPct = (totals.memorized / 6236) * 100;
  const learnPct = (totals.learning / 6236) * 100;

  const currentRevealStatus: MemorizationStatus =
    progress[`${selectedSurah}:${revealIndex}`] ?? "not_started";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-5">
        <div className="mx-auto max-w-[820px] flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight">
              {dict.hifz.title}
            </h1>
            <p className="text-[13px] text-[var(--color-text-muted)]">
              {dict.hifz.subtitle}
            </p>
          </div>
          <SegmentedControl<HifzTab>
            ariaLabel="Hifz mode"
            value={tab}
            onChange={setTab}
            options={[
              { value: "loop", label: dict.hifz.tabLoop },
              { value: "reveal", label: dict.hifz.tabHideReveal },
              { value: "progress", label: dict.hifz.tabProgress },
            ]}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="mx-auto max-w-[820px] space-y-6 pb-12">
          {/* Surah selector for Loop & Hide/Reveal */}
          {tab !== "progress" && (
            <div className="flex flex-wrap items-end gap-4 border-b border-[var(--color-border)] pb-5">
              <label className="space-y-1 flex-1 min-w-[200px]">
                <span className="text-[12px] font-medium text-[var(--color-text-muted)]">
                  {dict.hifz.selectSurah}
                </span>
                <select
                  value={selectedSurah}
                  onChange={(e) => setSelectedSurah(Number(e.target.value))}
                  className="h-9 w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[13px]"
                >
                  {chapters.map((ch) => (
                    <option key={ch.number} value={ch.number}>
                      {ch.number}. {ch.name} ({ch.arabicname})
                    </option>
                  ))}
                </select>
              </label>

              {tab === "loop" && (
                <>
                  <label className="space-y-1 w-24">
                    <span className="text-[12px] font-medium text-[var(--color-text-muted)]">
                      {dict.hifz.startVerse}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={verses.length}
                      value={startVerse}
                      onChange={(e) => {
                        const v = Math.max(1, Math.min(verses.length, Number(e.target.value) || 1));
                        setStartVerse(v);
                        if (v > endVerse) setEndVerse(v);
                      }}
                      className="h-9 w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-center text-[13px] tabular-nums"
                    />
                  </label>

                  <label className="space-y-1 w-24">
                    <span className="text-[12px] font-medium text-[var(--color-text-muted)]">
                      {dict.hifz.endVerse}
                    </span>
                    <input
                      type="number"
                      min={startVerse}
                      max={verses.length}
                      value={endVerse}
                      onChange={(e) =>
                        setEndVerse(
                          Math.max(startVerse, Math.min(verses.length, Number(e.target.value) || startVerse)),
                        )
                      }
                      className="h-9 w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-center text-[13px] tabular-nums"
                    />
                  </label>

                  <label className="space-y-1 w-28">
                    <span className="text-[12px] font-medium text-[var(--color-text-muted)]">
                      {dict.hifz.repeatCount}
                    </span>
                    <select
                      value={repeatCount}
                      onChange={(e) => setRepeatCount(Number(e.target.value))}
                      className="h-9 w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-[13px]"
                    >
                      <option value={1}>1×</option>
                      <option value={3}>3×</option>
                      <option value={5}>5×</option>
                      <option value={10}>10×</option>
                      <option value={0}>{dict.hifz.infinite}</option>
                    </select>
                  </label>

                  {loopConfig ? (
                    <Button variant="danger" onClick={stopLoop}>
                      <Square size={14} /> {dict.hifz.stopLoop}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() =>
                        startLoop(selectedSurah, startVerse, endVerse, repeatCount)
                      }
                    >
                      <Play size={14} /> {dict.hifz.startLoop}
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Tab 1: Loop Mode verse range picker */}
          {tab === "loop" && (
            <div>
              <p className="mb-3 text-[12px] text-[var(--color-text-muted)]">
                {dict.hifz.rangeHint}
              </p>
              <div className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
                {verses.map((text, idx) => {
                  const v = idx + 1;
                  const inRange = v >= startVerse && v <= endVerse;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={(e) => {
                        if (e.shiftKey) {
                          setStartVerse(Math.min(startVerse, v));
                          setEndVerse(Math.max(startVerse, v));
                        } else {
                          setStartVerse(v);
                          if (v > endVerse) setEndVerse(v);
                        }
                      }}
                      className={`flex w-full items-start gap-4 px-3 py-3.5 text-start transition-colors cursor-pointer ${
                        inRange
                          ? "bg-[var(--color-primary-tint)]"
                          : "hover:bg-[var(--color-surface-2)]"
                      }`}
                    >
                      <span className="w-8 pt-2 text-[12px] tabular-nums text-[var(--color-text-muted)]">
                        {num(v)}
                      </span>
                      <span
                        dir="rtl"
                        className="font-quran flex-1 text-right text-[26px] leading-[2.05]"
                      >
                        {text}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Hide & Reveal */}
          {tab === "reveal" && (
            <div className="space-y-6">
              <p className="text-[12px] text-[var(--color-text-muted)]">
                {dict.hifz.revealHint}
              </p>

              <div className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
                <div className="text-[13px] font-medium text-[var(--color-text-muted)]">
                  {num(selectedSurah)}:{num(revealIndex)} / {num(verses.length)}
                </div>

                <div
                  dir="rtl"
                  onClick={() => setRevealed((r) => !r)}
                  className={`font-quran mt-6 min-h-[120px] text-[34px] leading-[2.1] cursor-pointer transition-opacity select-none ${
                    revealed ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {verses[revealIndex - 1]}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <Button
                    variant="subtle"
                    onClick={() => setRevealed((r) => !r)}
                  >
                    {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
                    {revealed ? dict.hifz.hide : dict.hifz.reveal}
                  </Button>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-2 border-t border-[var(--color-border)] pt-5">
                  {(
                    [
                      ["not_started", dict.hifz.statusNotStarted],
                      ["learning", dict.hifz.statusLearning],
                      ["memorized", dict.hifz.statusMemorized],
                    ] as [MemorizationStatus, string][]
                  ).map(([st, label]) => (
                    <Button
                      key={st}
                      variant={currentRevealStatus === st ? "primary" : "subtle"}
                      size="sm"
                      onClick={() => setVerseStatus(selectedSurah, revealIndex, st)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="subtle"
                  size="sm"
                  disabled={revealIndex <= 1}
                  onClick={() => {
                    setRevealIndex((v) => Math.max(1, v - 1));
                    setRevealed(false);
                  }}
                >
                  {dict.reader.prevVerse}
                </Button>
                <Button
                  variant="subtle"
                  size="sm"
                  disabled={revealIndex >= verses.length}
                  onClick={() => {
                    setRevealIndex((v) => Math.min(verses.length, v + 1));
                    setRevealed(false);
                  }}
                >
                  {dict.reader.nextVerse}
                </Button>
              </div>
            </div>
          )}

          {/* Tab 3: Progress Tracker */}
          {tab === "progress" && (
            <div className="space-y-6">
              {/* Summary Bar */}
              <div className="space-y-3 border-b border-[var(--color-border)] pb-6">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-[12px] text-[var(--color-text-muted)]">
                      {dict.hifz.totalMemorized}
                    </div>
                    <div className="text-[24px] font-bold tabular-nums text-[var(--color-primary)]">
                      {num(totals.memorized)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] text-[var(--color-text-muted)]">
                      {dict.hifz.totalLearning}
                    </div>
                    <div className="text-[24px] font-bold tabular-nums text-[var(--color-accent-text)]">
                      {num(totals.learning)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] text-[var(--color-text-muted)]">
                      {dict.hifz.totalRemaining}
                    </div>
                    <div className="text-[24px] font-bold tabular-nums text-[var(--color-text-muted)]">
                      {num(totals.remaining)}
                    </div>
                  </div>
                </div>

                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                  <div
                    className="h-full bg-[var(--color-primary)]"
                    style={{ width: `${memPct}%` }}
                  />
                  <div
                    className="h-full bg-[var(--color-accent)]"
                    style={{ width: `${learnPct}%` }}
                  />
                </div>
                <div className="text-[12px] text-[var(--color-text-muted)]">
                  {memPct.toFixed(1)}% {dict.hifz.totalMemorized} · {dict.hifz.ofTotal}
                </div>
              </div>

              {/* Per-Surah Breakdown */}
              <div className="divide-y divide-[var(--color-border)]">
                {chapters.map((ch) => {
                  const sc = getSurahCounts(ch.number);
                  const pct = Math.round((sc.memorized / sc.total) * 100);
                  return (
                    <div
                      key={ch.number}
                      className="flex items-center justify-between gap-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[12px] tabular-nums text-[var(--color-text-muted)]">
                            {num(ch.number)}.
                          </span>
                          <span className="text-[14px] font-medium">{ch.name}</span>
                          <span className="text-[12px] text-[var(--color-text-muted)]">
                            {num(sc.memorized)} / {num(sc.total)} ({pct}%)
                          </span>
                        </div>
                        <div className="mt-1.5 h-1 w-full max-w-xs overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                          <div
                            className="h-full bg-[var(--color-primary)]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markSurahStatus(ch.number, "memorized")}
                          aria-label={dict.hifz.markSurahMemorized}
                        >
                          <CheckCircle2 size={14} />
                        </Button>
                        {(sc.memorized > 0 || sc.learning > 0) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markSurahStatus(ch.number, "not_started")}
                            aria-label={dict.hifz.resetSurah}
                          >
                            <RotateCcw size={14} />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
