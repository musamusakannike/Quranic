import React, { useEffect, useMemo, useState } from "react";
import { RotateCcw, Check, Search } from "lucide-react";
import adhkaarRaw from "../data/adhkaar.json";
import hisnRaw from "../data/hisnulmuslim.json";
import { useAdhkaarStore } from "../stores/adhkaarStore";
import { useI18n } from "../hooks/useI18n";
import { Button, SegmentedControl } from "../components/ui";

interface DhikrItem {
  title: string;
  arabic: string;
  transliteration?: string;
  translation?: string;
  count: number;
  evidence?: string;
}

interface HisnItem {
  title: string;
  reference: string;
  arabic: string;
  english: string;
}

type CategoryKey =
  | "morning"
  | "evening"
  | "after_solah"
  | "forty_robbanas"
  | "hisn";

const ADHKAAR = adhkaarRaw as Record<
  Exclude<CategoryKey, "hisn">,
  DhikrItem[]
>;
const HISN = hisnRaw as HisnItem[];

export const AdhkaarPage: React.FC = () => {
  const { dict, fmt, num } = useI18n();
  const counts = useAdhkaarStore((s) => s.counts);
  const increment = useAdhkaarStore((s) => s.increment);
  const decrement = useAdhkaarStore((s) => s.decrement);
  const resetItem = useAdhkaarStore((s) => s.resetItem);
  const resetAllToday = useAdhkaarStore((s) => s.resetAllToday);

  const [category, setCategory] = useState<CategoryKey>("morning");
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [hisnQuery, setHisnQuery] = useState("");

  const items = useMemo<(DhikrItem & { id: string })[]>(() => {
    if (category === "hisn") {
      const q = hisnQuery.trim().toLowerCase();
      return HISN.filter(
        (h) =>
          !q ||
          h.title.toLowerCase().includes(q) ||
          h.english.toLowerCase().includes(q) ||
          h.arabic.includes(q),
      )
        .slice(0, 100)
        .map((h, i) => ({
          id: `hisn-${i}`,
          title: h.title,
          arabic: h.arabic.trim(),
          translation: h.english.trim(),
          count: 1,
          evidence: h.reference,
        }));
    }
    return (ADHKAAR[category] ?? []).map((item, i) => ({
      ...item,
      id: `${category}-${i}`,
    }));
  }, [category, hisnQuery]);

  useEffect(() => {
    setFocusedIndex(0);
  }, [category]);

  // Keyboard shortcuts: Space/Enter increment, Backspace undo, R reset
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const focused = items[focusedIndex];
      if (!focused) return;

      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        increment(focused.id, focused.count);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        decrement(focused.id);
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        resetItem(focused.id);
      } else if (e.key === "ArrowDown" || e.key.toLowerCase() === "j") {
        e.preventDefault();
        setFocusedIndex((i) => Math.min(items.length - 1, i + 1));
      } else if (e.key === "ArrowUp" || e.key.toLowerCase() === "k") {
        e.preventDefault();
        setFocusedIndex((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [items, focusedIndex, increment, decrement, resetItem]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-5">
        <div className="mx-auto max-w-[760px] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-[22px] font-bold tracking-tight">
                {dict.adhkaar.title}
              </h1>
              <p className="text-[12px] text-[var(--color-text-muted)]">
                {dict.adhkaar.shortcutsHint}
              </p>
            </div>
            <Button variant="subtle" size="sm" onClick={resetAllToday}>
              <RotateCcw size={14} /> {dict.adhkaar.resetDay}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <SegmentedControl<CategoryKey>
              ariaLabel="Adhkaar category"
              value={category}
              onChange={setCategory}
              options={[
                { value: "morning", label: dict.adhkaar.morning },
                { value: "evening", label: dict.adhkaar.evening },
                { value: "after_solah", label: dict.adhkaar.afterSolah },
                { value: "forty_robbanas", label: dict.adhkaar.fortyRobbanas },
                { value: "hisn", label: dict.adhkaar.hisnulMuslim },
              ]}
            />
          </div>

          {category === "hisn" && (
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
              />
              <input
                type="text"
                value={hisnQuery}
                onChange={(e) => setHisnQuery(e.target.value)}
                placeholder={dict.adhkaar.searchHisn}
                className="h-9 w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg)] ps-9 pe-3 text-[13px]"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8">
        <div className="mx-auto max-w-[760px] divide-y divide-[var(--color-border)] pb-16">
          {items.map((item, idx) => {
            const current = counts[item.id] ?? 0;
            const done = current >= item.count;
            const focused = idx === focusedIndex;
            return (
              <div
                key={item.id}
                onClick={() => {
                  setFocusedIndex(idx);
                  increment(item.id, item.count);
                }}
                className={`py-6 px-3 transition-colors cursor-pointer select-none ${
                  focused ? "bg-[var(--color-primary-tint)]/55" : "hover:bg-[var(--color-surface-2)]/50"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[14px] font-semibold text-[var(--color-text)]">
                    {item.title}
                  </h2>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold tabular-nums ${
                        done
                          ? "bg-[var(--color-primary)] text-white"
                          : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                      }`}
                    >
                      {done && <Check size={12} />}
                      {fmt(dict.adhkaar.countProgress, {
                        current: num(current),
                        target: num(item.count),
                      })}
                    </span>
                    {current > 0 && (
                      <Button
                        variant="icon"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          resetItem(item.id);
                        }}
                        aria-label={dict.adhkaar.resetItem}
                        className="h-7 w-7"
                      >
                        <RotateCcw size={13} />
                      </Button>
                    )}
                  </div>
                </div>

                <p
                  dir="rtl"
                  className="font-quran mt-4 text-right text-[28px] leading-[2.1] text-[var(--color-text)]"
                >
                  {item.arabic}
                </p>

                {item.transliteration && (
                  <p className="mt-2.5 text-[13px] italic text-[var(--color-text-muted)]">
                    {item.transliteration}
                  </p>
                )}
                {item.translation && (
                  <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-text-muted)] whitespace-pre-line">
                    {item.translation}
                  </p>
                )}
                {item.evidence && (
                  <p className="mt-2 text-[12px] text-[var(--color-accent-text)]">
                    {item.evidence}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
