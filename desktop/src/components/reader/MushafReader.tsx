import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Columns2, Square, WifiOff } from "lucide-react";
import {
  prefetchMushafPages,
  resolveMushafPageSrc,
  TOTAL_MUSHAF_PAGES,
} from "../../lib/mushaf";
import { getPageInfo } from "../../lib/quran";
import { useI18n } from "../../hooks/useI18n";
import { Button, EmptyState, Skeleton } from "../ui";

interface MushafReaderProps {
  page: number;
  onChangePage: (page: number) => void;
  onSwitchToList: () => void;
}

export const MushafReader: React.FC<MushafReaderProps> = ({
  page,
  onChangePage,
  onSwitchToList,
}) => {
  const { dict, fmt, num, isRTL } = useI18n();
  const [spread, setSpread] = useState(false);
  const [jumpInput, setJumpInput] = useState(String(page));
  const [primarySrc, setPrimarySrc] = useState<string | null>(null);
  const [secondarySrc, setSecondarySrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setJumpInput(String(page));
  }, [page]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);

    const loadPages = async () => {
      try {
        const src1 = await resolveMushafPageSrc(page);
        let src2: string | null = null;
        if (spread && page + 1 <= TOTAL_MUSHAF_PAGES) {
          src2 = await resolveMushafPageSrc(page + 1).catch(() => null);
        }
        if (!cancelled) {
          setPrimarySrc(src1);
          setSecondarySrc(src2);
          setLoading(false);
        }
        prefetchMushafPages(page);
      } catch {
        if (!cancelled) {
          setFailed(true);
          setLoading(false);
        }
      }
    };

    void loadPages();
    return () => {
      cancelled = true;
    };
  }, [page, spread]);

  const step = spread ? 2 : 1;
  const goNext = () => onChangePage(Math.min(TOTAL_MUSHAF_PAGES, page + step));
  const goPrev = () => onChangePage(Math.max(1, page - step));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      // In Arabic Mushaf, next page is to the left (RTL book reading order)
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, spread]);

  const info = getPageInfo(page);

  return (
    <div className="flex flex-1 flex-col items-center justify-between overflow-y-auto px-6 py-5">
      {/* Top Mushaf bar */}
      <div className="flex w-full max-w-4xl items-center justify-between gap-3 pb-3">
        <div className="text-[13px] text-[var(--color-text-muted)]">
          {info ? (
            <>
              <span className="font-medium text-[var(--color-text)]">
                {info.chapterName}
              </span>{" "}
              · {fmt(dict.reader.juz, { n: num(info.juz) })} ·{" "}
              {fmt(dict.reader.page, { n: num(page) })}
            </>
          ) : (
            fmt(dict.reader.page, { n: num(page) })
          )}
        </div>

        <div className="flex items-center gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const parsed = Number(jumpInput);
              if (parsed >= 1 && parsed <= TOTAL_MUSHAF_PAGES) {
                onChangePage(parsed);
              }
            }}
            className="flex items-center gap-1.5"
          >
            <input
              type="number"
              min={1}
              max={TOTAL_MUSHAF_PAGES}
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              aria-label={dict.reader.page}
              className="h-8 w-20 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-center text-[13px] tabular-nums"
            />
            <span className="text-[12px] text-[var(--color-text-muted)]">
              / {num(TOTAL_MUSHAF_PAGES)}
            </span>
          </form>

          <Button
            variant="subtle"
            size="sm"
            onClick={() => setSpread((s) => !s)}
            aria-label={spread ? dict.reader.singlePage : dict.reader.twoPageSpread}
          >
            {spread ? <Square size={15} /> : <Columns2 size={15} />}
            <span className="hidden sm:inline">
              {spread ? dict.reader.singlePage : dict.reader.twoPageSpread}
            </span>
          </Button>
        </div>
      </div>

      {/* Page canvas — capped at ~1.4x (640px wide) so 456x672 scans stay crisp */}
      <div className="flex flex-1 items-center justify-center py-2">
        {loading ? (
          <Skeleton className="h-[640px] w-[440px]" />
        ) : failed || !primarySrc ? (
          <EmptyState
            icon={<WifiOff size={28} strokeWidth={1.75} />}
            title={dict.reader.mushafOfflineTitle}
            description={dict.reader.mushafOfflineDesc}
            action={
              <Button variant="primary" onClick={onSwitchToList}>
                {dict.reader.switchToList}
              </Button>
            }
          />
        ) : (
          <div
            dir="rtl"
            className="flex items-center justify-center gap-3 rounded-[10px] border border-[var(--color-border)] bg-[#f7f4ec] p-4"
          >
            <img
              src={primarySrc}
              alt={`Mushaf page ${page}`}
              onError={() => setFailed(true)}
              style={{ maxWidth: spread ? "460px" : "640px", maxHeight: "70vh" }}
              className="block h-auto w-auto object-contain select-none"
            />
            {spread && secondarySrc && (
              <img
                src={secondarySrc}
                alt={`Mushaf page ${page + 1}`}
                style={{ maxWidth: "460px", maxHeight: "70vh" }}
                className="block h-auto w-auto object-contain select-none border-e border-black/10 pe-3"
              />
            )}
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="flex items-center gap-3 pt-3">
        <Button
          variant="subtle"
          size="sm"
          onClick={goPrev}
          disabled={page <= 1}
          aria-label={dict.reader.prevPage}
        >
          {isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {dict.reader.prevPage}
        </Button>
        <span className="text-[13px] tabular-nums text-[var(--color-text-muted)]">
          {spread && page + 1 <= TOTAL_MUSHAF_PAGES
            ? `${num(page)}–${num(page + 1)}`
            : num(page)}
        </span>
        <Button
          variant="subtle"
          size="sm"
          onClick={goNext}
          disabled={page >= TOTAL_MUSHAF_PAGES}
          aria-label={dict.reader.nextPage}
        >
          {dict.reader.nextPage}
          {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </Button>
      </div>
    </div>
  );
};
