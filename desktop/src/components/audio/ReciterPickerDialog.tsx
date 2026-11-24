import React, { useEffect, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import {
  fetchReciterCatalog,
  type ReciterCatalog,
} from "../../lib/audioApi";
import { useAudioStore, type AudioMode } from "../../stores/audioStore";
import { useI18n } from "../../hooks/useI18n";
import { Dialog, ErrorState, SegmentedControl, Skeleton } from "../ui";

export const ReciterPickerDialog: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const { dict } = useI18n();
  const activeReciter = useAudioStore((s) => s.activeReciter);
  const setActiveReciter = useAudioStore((s) => s.setActiveReciter);

  const [mode, setMode] = useState<AudioMode>(activeReciter.mode);
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<ReciterCatalog | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (force = false) => {
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
    if (open && !catalog && !loading) {
      void load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filteredVerse = useMemo(() => {
    if (!catalog) return [];
    const q = query.trim().toLowerCase();
    return catalog.verseReciters.filter(
      (r) =>
        !q ||
        r.englishName.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q),
    );
  }, [catalog, query]);

  const filteredChapter = useMemo(() => {
    if (!catalog) return [];
    const q = query.trim().toLowerCase();
    return catalog.chapterReciters
      .filter((r) => r.moshaf.length > 0)
      .filter((r) => !q || r.name.toLowerCase().includes(q))
      .slice(0, 120);
  }, [catalog, query]);

  return (
    <Dialog open={open} onClose={onClose} title={dict.audio.selectReciter} maxWidth="max-w-xl">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SegmentedControl
            ariaLabel="Reciter mode"
            value={mode}
            onChange={setMode}
            options={[
              { value: "verse_by_verse", label: dict.audio.modeVerse },
              { value: "chapter", label: dict.audio.modeChapter },
            ]}
          />
        </div>

        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.audio.searchReciters}
            className="h-9 w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg)] ps-9 pe-3 text-[14px]"
          />
        </div>

        {loading ? (
          <div className="space-y-2 py-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={() => void load(true)}
            retryLabel={dict.common.retry}
          />
        ) : (
          <div className="max-h-80 overflow-y-auto divide-y divide-[var(--color-border)] rounded-[8px] border border-[var(--color-border)]">
            {mode === "verse_by_verse"
              ? filteredVerse.map((r) => {
                  const selected =
                    activeReciter.mode === "verse_by_verse" &&
                    activeReciter.id === r.identifier;
                  return (
                    <button
                      key={r.identifier}
                      type="button"
                      onClick={() => {
                        setActiveReciter({
                          id: r.identifier,
                          name: r.englishName,
                          server: r.server,
                          mode: "verse_by_verse",
                        });
                        onClose();
                      }}
                      className={`flex w-full items-center justify-between px-3.5 py-2.5 text-start cursor-pointer hover:bg-[var(--color-surface-2)] ${
                        selected ? "bg-[var(--color-primary-tint)]" : ""
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
                      {selected && (
                        <Check size={16} className="shrink-0 text-[var(--color-primary)]" />
                      )}
                    </button>
                  );
                })
              : filteredChapter.map((r) => {
                  const m = r.moshaf[0]!;
                  const recId = `mp3q-${r.id}-${m.id}`;
                  const selected =
                    activeReciter.mode === "chapter" && activeReciter.id === recId;
                  return (
                    <button
                      key={recId}
                      type="button"
                      onClick={() => {
                        setActiveReciter({
                          id: recId,
                          name: r.name,
                          server: m.server,
                          mode: "chapter",
                          moshafName: m.name,
                        });
                        onClose();
                      }}
                      className={`flex w-full items-center justify-between px-3.5 py-2.5 text-start cursor-pointer hover:bg-[var(--color-surface-2)] ${
                        selected ? "bg-[var(--color-primary-tint)]" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-medium">{r.name}</div>
                        <div className="truncate text-[12px] text-[var(--color-text-muted)]">
                          {m.name}
                        </div>
                      </div>
                      {selected && (
                        <Check size={16} className="shrink-0 text-[var(--color-primary)]" />
                      )}
                    </button>
                  );
                })}
          </div>
        )}
      </div>
    </Dialog>
  );
};
