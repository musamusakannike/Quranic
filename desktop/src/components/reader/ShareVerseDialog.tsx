import React, { useEffect, useRef, useState } from "react";
import { Copy, Download } from "lucide-react";
import {
  copyVerseCardToClipboard,
  renderVerseCardToCanvas,
  saveVerseCardPng,
} from "../../lib/shareCard";
import { useI18n } from "../../hooks/useI18n";
import { useSettingsStore } from "../../stores/settingsStore";
import { Button, Dialog, SegmentedControl, Toggle } from "../ui";

export interface ShareVerseTarget {
  chapter: number;
  verse: number;
  surahName: string;
  surahArabicName: string;
  arabicText: string;
  translationText: string | null;
}

export const ShareVerseDialog: React.FC<{
  target: ShareVerseTarget | null;
  onClose: () => void;
}> = ({ target, onClose }) => {
  const { dict } = useI18n();
  const resolvedTheme = useSettingsStore((s) => s.resolvedTheme);
  const showToast = useSettingsStore((s) => s.showToast);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cardTheme, setCardTheme] = useState<"light" | "dark">(resolvedTheme);
  const [includeTranslation, setIncludeTranslation] = useState(true);

  useEffect(() => {
    if (!target || !canvasRef.current) return;
    renderVerseCardToCanvas(canvasRef.current, {
      ...target,
      theme: cardTheme,
      includeTranslation,
    });
  }, [target, cardTheme, includeTranslation]);

  if (!target) return null;

  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      await copyVerseCardToClipboard(canvasRef.current);
      showToast(dict.reader.imageCopied, "success");
    } catch {
      showToast(dict.common.errorGeneric, "error");
    }
  };

  const handleSavePng = async () => {
    if (!canvasRef.current) return;
    try {
      const saved = await saveVerseCardPng(
        canvasRef.current,
        target.chapter,
        target.verse,
      );
      if (saved) showToast(dict.reader.imageSaved, "success");
    } catch {
      showToast(dict.common.errorGeneric, "error");
    }
  };

  return (
    <Dialog open onClose={onClose} title={dict.reader.shareTitle} maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl
            ariaLabel="Card theme"
            value={cardTheme}
            onChange={setCardTheme}
            options={[
              { value: "light", label: dict.reader.cardThemeLight },
              { value: "dark", label: dict.reader.cardThemeDark },
            ]}
          />
          {target.translationText && (
            <label className="flex items-center gap-2 text-[13px] text-[var(--color-text-muted)]">
              <span>{dict.reader.includeTranslation}</span>
              <Toggle
                checked={includeTranslation}
                onChange={setIncludeTranslation}
                ariaLabel={dict.reader.includeTranslation}
              />
            </label>
          )}
        </div>

        <div className="overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2">
          <canvas
            ref={canvasRef}
            className="mx-auto block max-h-[420px] w-auto max-w-full rounded-[4px]"
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="subtle" onClick={() => void handleCopyImage()}>
            <Copy size={15} strokeWidth={1.75} />
            {dict.reader.copyImage}
          </Button>
          <Button variant="primary" onClick={() => void handleSavePng()}>
            <Download size={15} strokeWidth={1.75} />
            {dict.reader.savePng}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
