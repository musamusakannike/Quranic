import { savePngFile } from "./tauri";

export interface ShareCardOptions {
  arabicText: string;
  translationText: string | null;
  surahName: string;
  surahArabicName: string;
  chapter: number;
  verse: number;
  theme: "light" | "dark";
  includeTranslation: boolean;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function renderVerseCardToCanvas(
  canvas: HTMLCanvasElement,
  opts: ShareCardOptions,
): void {
  const width = 1080;
  const paddingX = 88;
  const maxTextW = width - paddingX * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Measure Arabic lines
  ctx.font = '400 44px "Amiri Quran", "Amiri", serif';
  const arabicLines = wrapText(ctx, opts.arabicText, maxTextW);

  // Measure Translation lines
  let transLines: string[] = [];
  if (opts.includeTranslation && opts.translationText) {
    ctx.font = '400 24px "Satoshi", sans-serif';
    transLines = wrapText(ctx, opts.translationText, maxTextW);
  }

  const arabicHeight = arabicLines.length * 84;
  const transHeight = transLines.length > 0 ? transLines.length * 38 + 44 : 0;
  const height = Math.max(540, 230 + arabicHeight + transHeight + 100);

  canvas.width = width;
  canvas.height = height;

  const isDark = opts.theme === "dark";
  const bg = isDark ? "#0B1914" : "#F9FAFB";
  const surface = isDark ? "#142D24" : "#FFFFFF";
  const border = isDark ? "#1F3C31" : "#E5E7EB";
  const textMain = isDark ? "#F9FAFB" : "#111827";
  const textMuted = isDark ? "#9CA3AF" : "#525965";
  const primary = isDark ? "#0A8F7A" : "#056C5C";
  const accent = "#D4AF37";

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Clean editorial frame
  ctx.fillStyle = surface;
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.fillRect(36, 36, width - 72, height - 72);
  ctx.strokeRect(36, 36, width - 72, height - 72);

  // Top gold accent hairline
  ctx.fillStyle = accent;
  ctx.fillRect(paddingX, 82, 56, 3);

  // Surah header
  ctx.fillStyle = primary;
  ctx.font = '600 20px "Satoshi", sans-serif';
  ctx.textAlign = "left";
  ctx.direction = "ltr";
  ctx.fillText(
    `${opts.surahName} · ${opts.chapter}:${opts.verse}`,
    paddingX,
    120,
  );

  ctx.fillStyle = textMuted;
  ctx.font = '400 26px "Amiri Quran", "Cairo", serif';
  ctx.textAlign = "right";
  ctx.direction = "rtl";
  ctx.fillText(opts.surahArabicName, width - paddingX, 120);

  // Arabic verse text
  ctx.fillStyle = textMain;
  ctx.font = '400 44px "Amiri Quran", "Amiri", serif';
  ctx.textAlign = "right";
  ctx.direction = "rtl";
  let y = 200;
  for (const line of arabicLines) {
    ctx.fillText(line, width - paddingX, y);
    y += 84;
  }

  // Translation
  if (transLines.length > 0) {
    y += 14;
    ctx.fillStyle = textMuted;
    ctx.font = '400 24px "Satoshi", sans-serif';
    ctx.textAlign = "left";
    ctx.direction = "ltr";
    for (const line of transLines) {
      ctx.fillText(line, paddingX, y);
      y += 38;
    }
  }

  // Footer
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(paddingX, height - 96);
  ctx.lineTo(width - paddingX, height - 96);
  ctx.stroke();

  ctx.fillStyle = textMuted;
  ctx.font = '500 18px "Satoshi", sans-serif';
  ctx.textAlign = "left";
  ctx.direction = "ltr";
  ctx.fillText("Quranic Desktop", paddingX, height - 62);
}

export async function canvasToPngBytes(
  canvas: HTMLCanvasElement,
): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png"),
  );
  if (!blob) throw new Error("Failed to encode PNG");
  const buf = await blob.arrayBuffer();
  return new Uint8Array(buf);
}

export async function saveVerseCardPng(
  canvas: HTMLCanvasElement,
  chapter: number,
  verse: number,
): Promise<boolean> {
  const bytes = await canvasToPngBytes(canvas);
  return savePngFile(`quranic-${chapter}-${verse}.png`, bytes);
}

export async function copyVerseCardToClipboard(
  canvas: HTMLCanvasElement,
): Promise<void> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png"),
  );
  if (!blob) throw new Error("Failed to encode PNG");
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return;
  }
  throw new Error("Image clipboard is not supported in this webview");
}
