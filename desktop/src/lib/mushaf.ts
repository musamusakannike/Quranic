import { convertLocalFileSrc, isTauriRuntime, tauriInvoke } from "./tauri";

/**
 * Single configurable base URL for the 604 Mushaf WebP scans (456x672).
 * Can be moved to a dedicated CDN without touching reader code.
 */
export const MUSHAF_BASE_URL =
  "https://raw.githubusercontent.com/musamusakannike/Quranic/main/mobile/assets/images/mushaf-complete";

export const TOTAL_MUSHAF_PAGES = 604;

export function getMushafRemoteUrl(page: number): string {
  return `${MUSHAF_BASE_URL}/${page}.webp`;
}

export function getMushafRelativePath(page: number): string {
  return `mushaf/${page}.webp`;
}

/**
 * Resolve a Mushaf page image URL:
 * - In Tauri: checks app data cache first, otherwise downloads to cache and returns asset:// URL.
 * - In browser dev mode: returns the remote URL directly.
 */
export async function resolveMushafPageSrc(page: number): Promise<string> {
  if (page < 1 || page > TOTAL_MUSHAF_PAGES) {
    throw new Error(`Invalid Mushaf page ${page}`);
  }
  const remoteUrl = getMushafRemoteUrl(page);
  if (!isTauriRuntime()) {
    return remoteUrl;
  }

  const relPath = getMushafRelativePath(page);
  const existing = await tauriInvoke<string | null>("app_file_exists", {
    relativePath: relPath,
  });
  if (existing) {
    return convertLocalFileSrc(existing);
  }

  const res = await tauriInvoke<{ path: string }>("download_file", {
    id: `mushaf-${page}`,
    url: remoteUrl,
    relativePath: relPath,
  });
  return convertLocalFileSrc(res.path);
}

/**
 * Prefetch +/-3 neighboring pages in the background without blocking UI.
 */
export function prefetchMushafPages(centerPage: number): void {
  const candidates = [
    centerPage + 1,
    centerPage + 2,
    centerPage + 3,
    centerPage - 1,
    centerPage - 2,
    centerPage - 3,
  ].filter((p) => p >= 1 && p <= TOTAL_MUSHAF_PAGES);

  for (const p of candidates) {
    if (isTauriRuntime()) {
      void resolveMushafPageSrc(p).catch(() => {});
    } else {
      const img = new Image();
      img.src = getMushafRemoteUrl(p);
    }
  }
}

export async function clearMushafCache(): Promise<void> {
  if (!isTauriRuntime()) return;
  await tauriInvoke("delete_app_file", { relativePath: "mushaf" });
}

export async function getMushafCacheSize(): Promise<number> {
  if (!isTauriRuntime()) return 0;
  return tauriInvoke<number>("get_dir_size", { relativePath: "mushaf" });
}
