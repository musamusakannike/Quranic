/**
 * Safe Tauri v2 runtime wrappers with clean browser-mode fallbacks
 * (so Vite dev server + Playwright QA work seamlessly without Tauri IPC).
 */

export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function tauriInvoke<T>(
  cmd: string,
  args?: Record<string, unknown>,
): Promise<T> {
  if (!isTauriRuntime()) {
    throw new Error(`Tauri IPC unavailable in browser mode (${cmd})`);
  }
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(cmd, args);
}

export async function tauriListen<T>(
  event: string,
  handler: (payload: T) => void,
): Promise<() => void> {
  if (!isTauriRuntime()) {
    return () => {};
  }
  const { listen } = await import("@tauri-apps/api/event");
  const unlisten = await listen<T>(event, (e) => handler(e.payload));
  return unlisten;
}

export async function showMainWindow(): Promise<void> {
  if (!isTauriRuntime()) return;
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const win = getCurrentWindow();
    await win.show();
    await win.setFocus();
  } catch {
    // Ignore if already visible or unsupported
  }
}

export async function hideMainWindow(): Promise<void> {
  if (!isTauriRuntime()) return;
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().hide();
  } catch {
    // Ignore
  }
}

export async function quitApplication(): Promise<void> {
  if (!isTauriRuntime()) return;
  await tauriInvoke("quit_app");
}

export async function setCloseToTray(enabled: boolean): Promise<void> {
  if (!isTauriRuntime()) return;
  try {
    await tauriInvoke("set_close_to_tray", { enabled });
  } catch {
    // Ignore
  }
}

export async function updateTrayStatus(
  nextPrayerLabel: string,
  tooltip: string,
  isPlaying: boolean,
): Promise<void> {
  if (!isTauriRuntime()) return;
  try {
    await tauriInvoke("update_tray_status", {
      nextPrayerLabel,
      tooltip,
      isPlaying,
    });
  } catch {
    // Ignore
  }
}

/**
 * Fetch UTF-8 text via Rust reqwest in Tauri (avoids webview CORS),
 * falling back to browser fetch in dev/Playwright mode.
 */
export async function httpGetText(url: string): Promise<string> {
  if (isTauriRuntime()) {
    return tauriInvoke<string>("http_get_text", { url });
  }
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`);
  }
  return res.text();
}

export async function httpGetJson<T>(url: string): Promise<T> {
  const text = await httpGetText(url);
  return JSON.parse(text) as T;
}

export async function convertLocalFileSrc(absolutePath: string): Promise<string> {
  if (!isTauriRuntime()) return absolutePath;
  const { convertFileSrc } = await import("@tauri-apps/api/core");
  return convertFileSrc(absolutePath);
}

export async function sendNativeNotification(
  title: string,
  body: string,
): Promise<void> {
  if (isTauriRuntime()) {
    try {
      const notif = await import("@tauri-apps/plugin-notification");
      let granted = await notif.isPermissionGranted();
      if (!granted) {
        const perm = await notif.requestPermission();
        granted = perm === "granted";
      }
      if (granted) {
        notif.sendNotification({ title, body });
      }
      return;
    } catch {
      // Fall through to web Notification API
    }
  }
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

export async function copyTextToClipboard(text: string): Promise<void> {
  if (isTauriRuntime()) {
    try {
      const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");
      await writeText(text);
      return;
    } catch {
      // Fallback
    }
  }
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  }
}

export async function openExternalUrl(url: string): Promise<void> {
  if (isTauriRuntime()) {
    try {
      const { open } = await import("@tauri-apps/plugin-shell");
      await open(url);
      return;
    } catch {
      // Fallback
    }
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

export async function savePngFile(
  defaultFileName: string,
  pngBytes: Uint8Array,
): Promise<boolean> {
  if (isTauriRuntime()) {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeFile } = await import("@tauri-apps/plugin-fs");
    const target = await save({
      defaultPath: defaultFileName,
      filters: [{ name: "PNG Image", extensions: ["png"] }],
    });
    if (!target) return false;
    await writeFile(target, pngBytes);
    return true;
  }
  // Browser fallback: trigger download
  const blob = new Blob([pngBytes as unknown as BlobPart], { type: "image/png" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = defaultFileName;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

export async function getAutostartEnabled(): Promise<boolean> {
  if (!isTauriRuntime()) return false;
  try {
    const { isEnabled } = await import("@tauri-apps/plugin-autostart");
    return await isEnabled();
  } catch {
    return false;
  }
}

export async function setAutostartEnabled(enabled: boolean): Promise<void> {
  if (!isTauriRuntime()) return;
  const { enable, disable } = await import("@tauri-apps/plugin-autostart");
  if (enabled) {
    await enable();
  } else {
    await disable();
  }
}
