import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  CornerDownLeft,
  BookOpen,
  SunMoon,
  Languages,
  Settings,
  Home,
  Bookmark,
  Headphones,
  Clock,
  Compass,
  Sparkles,
  CalendarDays,
  Layers,
} from "lucide-react";
import { useI18n } from "../../hooks/useI18n";
import { useSettingsStore } from "../../stores/settingsStore";
import { getChapterMetadata, parseQuranReference } from "../../lib/quran";
import { searchQuranAsync, type WorkerSearchResult } from "../../lib/searchClient";
import { Kbd } from "../ui";

interface PaletteItem {
  id: string;
  group: "jump" | "nav" | "action" | "quran";
  title: string;
  subtitle?: string;
  arabic?: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

export const CommandPalette: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const { dict, fmt } = useI18n();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const resolvedTheme = useSettingsStore((s) => s.resolvedTheme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const translationPackId = useSettingsStore((s) => s.translationPackId);

  const [query, setQuery] = useState("");
  const [quranResults, setQuranResults] = useState<WorkerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setQuery("");
      setQuranResults([]);
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  // Debounced 200ms off-thread Quran search
  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setQuranResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    let cancelled = false;
    const timer = setTimeout(() => {
      void searchQuranAsync(trimmed, translationPackId, { limit: 100 }).then((res) => {
        if (!cancelled) {
          setQuranResults(res);
          setSearching(false);
        }
      });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query, translationPackId]);

  const items = useMemo<PaletteItem[]>(() => {
    const list: PaletteItem[] = [];
    const trimmed = query.trim();

    // 1. Smart reference jump ("2:255", "baqarah 255", "surah 36", "juz 30", "page 604")
    if (trimmed) {
      const ref = parseQuranReference(trimmed);
      if (ref) {
        list.push({
          id: `jump-${ref.type}-${ref.chapter}-${ref.verse ?? 0}`,
          group: "jump",
          title: ref.label,
          subtitle:
            ref.type === "page"
              ? `Mushaf page ${ref.page}`
              : ref.type === "juz"
                ? `Starts at ${ref.chapter}:${ref.verse}`
                : undefined,
          icon: <BookOpen size={16} strokeWidth={1.75} />,
          onSelect: () => {
            if (ref.type === "page" && ref.page) {
              useSettingsStore.getState().update({ readingMode: "mushaf" });
              navigate(`/quran/${ref.chapter}?page=${ref.page}`);
            } else {
              navigate(
                `/quran/${ref.chapter}${ref.verse ? `?verse=${ref.verse}` : ""}`,
              );
            }
            onClose();
          },
        });
      }
    }

    // 2. Navigation & Actions
    const navItems: PaletteItem[] = [
      {
        id: "nav-home",
        group: "nav",
        title: dict.nav.home,
        icon: <Home size={16} strokeWidth={1.75} />,
        onSelect: () => {
          navigate("/");
          onClose();
        },
      },
      {
        id: "nav-quran",
        group: "nav",
        title: dict.nav.quran,
        icon: <BookOpen size={16} strokeWidth={1.75} />,
        onSelect: () => {
          navigate("/quran");
          onClose();
        },
      },
      {
        id: "nav-bookmarks",
        group: "nav",
        title: dict.nav.bookmarks,
        icon: <Bookmark size={16} strokeWidth={1.75} />,
        onSelect: () => {
          navigate("/bookmarks");
          onClose();
        },
      },
      {
        id: "nav-audio",
        group: "nav",
        title: dict.nav.audio,
        icon: <Headphones size={16} strokeWidth={1.75} />,
        onSelect: () => {
          navigate("/audio");
          onClose();
        },
      },
      {
        id: "nav-prayer",
        group: "nav",
        title: dict.nav.prayerTimes,
        icon: <Clock size={16} strokeWidth={1.75} />,
        onSelect: () => {
          navigate("/prayer-times");
          onClose();
        },
      },
      {
        id: "nav-qiblah",
        group: "nav",
        title: dict.nav.qiblah,
        icon: <Compass size={16} strokeWidth={1.75} />,
        onSelect: () => {
          navigate("/qiblah");
          onClose();
        },
      },
      {
        id: "nav-adhkaar",
        group: "nav",
        title: dict.nav.adhkaar,
        icon: <Sparkles size={16} strokeWidth={1.75} />,
        onSelect: () => {
          navigate("/adhkaar");
          onClose();
        },
      },
      {
        id: "nav-hijri",
        group: "nav",
        title: dict.nav.hijri,
        icon: <CalendarDays size={16} strokeWidth={1.75} />,
        onSelect: () => {
          navigate("/hijri");
          onClose();
        },
      },
      {
        id: "nav-hifz",
        group: "nav",
        title: dict.nav.hifz,
        icon: <Layers size={16} strokeWidth={1.75} />,
        onSelect: () => {
          navigate("/hifz");
          onClose();
        },
      },
    ];

    const actionItems: PaletteItem[] = [
      {
        id: "act-theme",
        group: "action",
        title: dict.commandPalette.toggleTheme,
        icon: <SunMoon size={16} strokeWidth={1.75} />,
        onSelect: () => {
          setTheme(resolvedTheme === "dark" ? "light" : "dark");
          onClose();
        },
      },
      {
        id: "act-lang",
        group: "action",
        title: dict.commandPalette.toggleLanguage,
        icon: <Languages size={16} strokeWidth={1.75} />,
        onSelect: () => {
          setLanguage(language === "ar" ? "en" : "ar");
          onClose();
        },
      },
      {
        id: "act-settings",
        group: "action",
        title: dict.commandPalette.openSettings,
        icon: <Settings size={16} strokeWidth={1.75} />,
        onSelect: () => {
          navigate("/settings");
          onClose();
        },
      },
    ];

    const lower = trimmed.toLowerCase();
    for (const item of [...navItems, ...actionItems]) {
      if (!lower || item.title.toLowerCase().includes(lower)) {
        list.push(item);
      }
    }

    // 3. Quran search results
    for (const r of quranResults) {
      const ch = getChapterMetadata(r.chapter);
      list.push({
        id: `verse-${r.chapter}-${r.verse}`,
        group: "quran",
        title: `${ch?.name ?? `Surah ${r.chapter}`} ${r.chapter}:${r.verse}`,
        subtitle: r.translation ?? r.transliteration ?? undefined,
        arabic: r.text,
        icon: <BookOpen size={16} strokeWidth={1.75} />,
        onSelect: () => {
          navigate(`/quran/${r.chapter}?verse=${r.verse}`);
          onClose();
        },
      });
    }

    return list;
  }, [query, quranResults, dict, navigate, onClose, resolvedTheme, setTheme, language, setLanguage]);

  useEffect(() => {
    setActiveIndex(0);
  }, [items.length, query]);

  if (!open) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" && items[activeIndex]) {
      e.preventDefault();
      items[activeIndex].onSelect();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 pt-[12vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)]"
        style={{ boxShadow: "var(--shadow-popover)" }}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
          <Search size={18} strokeWidth={1.75} className="shrink-0 text-[var(--color-text-muted)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.commandPalette.placeholder}
            aria-label={dict.commandPalette.placeholder}
            className="w-full bg-transparent text-[15px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
          />
          {searching && (
            <span className="text-[12px] text-[var(--color-text-muted)] shrink-0">
              {dict.commandPalette.searching}
            </span>
          )}
        </div>

        <div className="max-h-[55vh] overflow-y-auto py-1.5 divide-y divide-[var(--color-border)]/40">
          {items.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-[var(--color-text-muted)]">
              {dict.commandPalette.noResults}
            </div>
          ) : (
            items.map((item, idx) => {
              const selected = idx === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={item.onSelect}
                  className={`flex w-full items-start gap-3 px-4 py-2.5 text-start transition-colors cursor-pointer ${
                    selected
                      ? "bg-[var(--color-primary-tint)] text-[var(--color-text)]"
                      : "text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
                  }`}
                >
                  <span className="mt-0.5 shrink-0 text-[var(--color-primary)]">
                    {item.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[14px] font-medium truncate">
                        {item.title}
                      </span>
                      {selected && (
                        <CornerDownLeft
                          size={14}
                          strokeWidth={1.75}
                          className="shrink-0 text-[var(--color-text-muted)]"
                        />
                      )}
                    </div>
                    {item.arabic && (
                      <div
                        dir="rtl"
                        className="font-quran mt-1 text-[20px] leading-relaxed text-[var(--color-text)] line-clamp-2"
                      >
                        {item.arabic}
                      </div>
                    )}
                    {item.subtitle && (
                      <div className="mt-0.5 text-[12px] text-[var(--color-text-muted)] line-clamp-1">
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2 text-[11px] text-[var(--color-text-muted)]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Kbd>↑↓</Kbd> {dict.commandPalette.hintNavigate}
            </span>
            <span className="flex items-center gap-1">
              <Kbd>↵</Kbd> {dict.commandPalette.hintSelect}
            </span>
            <span className="flex items-center gap-1">
              <Kbd>Esc</Kbd> {dict.commandPalette.hintClose}
            </span>
          </div>
          {quranResults.length >= 100 && (
            <span>{fmt(dict.commandPalette.resultCapNotice, { count: 100 })}</span>
          )}
        </div>
      </div>
    </div>
  );
};
