import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Bookmark, Trash2, ArrowUpRight } from "lucide-react";
import { useReadingStore } from "../stores/readingStore";
import { useSettingsStore } from "../stores/settingsStore";
import { getChapterMetadata, getVerseText } from "../lib/quran";
import { loadTranslationPack, type TranslationData } from "../data/translations";
import { useI18n } from "../hooks/useI18n";
import { Button, EmptyState } from "../components/ui";

export const BookmarksPage: React.FC = () => {
  const { dict, fmt, num } = useI18n();
  const navigate = useNavigate();

  const bookmarks = useReadingStore((s) => s.bookmarks);
  const removeBookmark = useReadingStore((s) => s.removeBookmark);
  const translationPackId = useSettingsStore((s) => s.translationPackId);

  const [translationData, setTranslationData] = useState<TranslationData | null>(null);

  useEffect(() => {
    void loadTranslationPack(translationPackId).then(setTranslationData);
  }, [translationPackId]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[760px] px-8 py-8">
        <header className="border-b border-[var(--color-border)] pb-5">
          <h1 className="text-[22px] font-bold tracking-tight">
            {dict.bookmarks.title}
          </h1>
          <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
            {fmt(dict.bookmarks.subtitle, { count: num(bookmarks.length) })}
          </p>
        </header>

        {bookmarks.length === 0 ? (
          <EmptyState
            icon={<Bookmark size={28} strokeWidth={1.75} />}
            title={dict.bookmarks.emptyTitle}
            description={dict.bookmarks.emptyDesc}
            action={
              <Button variant="primary" onClick={() => navigate("/quran")}>
                {dict.home.openReader}
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {bookmarks.map((b) => {
              const meta = getChapterMetadata(b.chapter);
              const arabic = getVerseText(b.chapter, b.verse) ?? "";
              const trans = translationData?.[b.chapter]?.[b.verse];
              return (
                <div key={b.id} className="py-5">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/quran/${b.chapter}?verse=${b.verse}`)}
                      className="flex items-center gap-1.5 text-[14px] font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
                    >
                      <span>
                        {meta?.name} {num(b.chapter)}:{num(b.verse)}
                      </span>
                      <ArrowUpRight size={14} />
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBookmark(b.id)}
                      aria-label={dict.bookmarks.remove}
                    >
                      <Trash2 size={14} />
                      <span>{dict.bookmarks.remove}</span>
                    </Button>
                  </div>
                  <p
                    dir="rtl"
                    className="font-quran mt-3 text-right text-[26px] leading-[2.1] text-[var(--color-text)]"
                  >
                    {arabic}
                  </p>
                  {trans && (
                    <p
                      dir="ltr"
                      className="mt-2 text-left text-[14px] text-[var(--color-text-muted)]"
                    >
                      {trans}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
