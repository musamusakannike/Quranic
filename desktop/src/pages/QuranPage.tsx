import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Search } from "lucide-react";
import { getAllChapters, normalizeSearchText } from "../lib/quran";
import { useI18n } from "../hooks/useI18n";
import { EmptyState, SegmentedControl } from "../components/ui";

type RevFilter = "all" | "Mecca" | "Madina";

export const QuranPage: React.FC = () => {
  const { dict, fmt, num } = useI18n();
  const navigate = useNavigate();
  const parentRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [revFilter, setRevFilter] = useState<RevFilter>("all");

  const allChapters = useMemo(() => getAllChapters(), []);

  const filtered = useMemo(() => {
    const q = normalizeSearchText(query);
    return allChapters.filter((ch) => {
      if (revFilter !== "all" && ch.revelation !== revFilter) return false;
      if (!q) return true;
      return (
        String(ch.number) === q ||
        normalizeSearchText(ch.name).includes(q) ||
        normalizeSearchText(ch.englishname).includes(q) ||
        normalizeSearchText(ch.arabicname).includes(q)
      );
    });
  }, [allChapters, query, revFilter]);

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 10,
  });

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-5">
        <div className="mx-auto max-w-[820px]">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h1 className="text-[22px] font-bold tracking-tight">
                {dict.quran.title}
              </h1>
              <p className="text-[13px] text-[var(--color-text-muted)]">
                {dict.quran.subtitle}
              </p>
            </div>
            <SegmentedControl
              ariaLabel="Filter by revelation"
              value={revFilter}
              onChange={setRevFilter}
              options={[
                { value: "all", label: dict.quran.revelationAll },
                { value: "Mecca", label: dict.quran.revelationMecca },
                { value: "Madina", label: dict.quran.revelationMadina },
              ]}
            />
          </div>

          <div className="relative mt-4">
            <Search
              size={15}
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={dict.quran.searchPlaceholder}
              aria-label={dict.quran.searchPlaceholder}
              className="h-9 w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg)] ps-9 pe-3 text-[14px]"
            />
          </div>
        </div>
      </div>

      {/* Virtualized Surah List */}
      <div ref={parentRef} className="flex-1 overflow-y-auto px-8">
        <div className="mx-auto max-w-[820px] py-2">
          {filtered.length === 0 ? (
            <EmptyState title={dict.quran.noSurahsFound} />
          ) : (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                position: "relative",
                width: "100%",
              }}
            >
              {virtualizer.getVirtualItems().map((vRow) => {
                const ch = filtered[vRow.index]!;
                return (
                  <button
                    key={ch.number}
                    type="button"
                    onClick={() => navigate(`/quran/${ch.number}`)}
                    style={{
                      position: "absolute",
                      top: 0,
                      insetInlineStart: 0,
                      width: "100%",
                      height: `${vRow.size}px`,
                      transform: `translateY(${vRow.start}px)`,
                    }}
                    className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] px-3 text-start hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="w-8 text-center text-[13px] font-medium tabular-nums text-[var(--color-text-muted)]">
                        {num(ch.number)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[15px] font-semibold text-[var(--color-text)] truncate">
                            {ch.name}
                          </span>
                          <span className="text-[13px] text-[var(--color-text-muted)] truncate">
                            {ch.englishname}
                          </span>
                        </div>
                        <div className="text-[12px] text-[var(--color-text-muted)]">
                          {ch.revelation === "Mecca"
                            ? dict.quran.revelationMecca
                            : dict.quran.revelationMadina}{" "}
                          · {fmt(dict.quran.versesCount, { count: num(ch.versesCount) })} ·{" "}
                          {fmt(dict.quran.juzRange, { range: ch.juzRange })}
                        </div>
                      </div>
                    </div>

                    <span
                      dir="rtl"
                      className="font-quran shrink-0 text-[22px] text-[var(--color-text)]"
                    >
                      {ch.arabicname}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
