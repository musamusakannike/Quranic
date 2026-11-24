import React, { useEffect, useRef, useState } from "react";
import { Sidebar } from "./Sidebar";
import { BottomPlayerBar } from "./BottomPlayerBar";
import { CommandPalette } from "./CommandPalette";
import { OnboardingModal } from "./OnboardingModal";
import { Button, Dialog, ToastContainer } from "../ui";
import {
  useSettingsStore,
  getActivePlace,
  hasAnyPrayerReminderEnabled,
} from "../../stores/settingsStore";
import { useAudioStore } from "../../stores/audioStore";
import { ReminderScheduler } from "../../lib/scheduler";
import {
  computeNextPrayer,
  formatShortCountdown,
  type SolahConfig,
} from "../../lib/solah";
import {
  hideMainWindow,
  quitApplication,
  sendNativeNotification,
  setCloseToTray,
  tauriListen,
  updateTrayStatus,
} from "../../lib/tauri";
import { useI18n } from "../../hooks/useI18n";

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { dict } = useI18n();
  const sidebarCollapsed = useSettingsStore((s) => s.sidebarCollapsed);
  const updateSettings = useSettingsStore((s) => s.update);
  const closeToTray = useSettingsStore((s) => s.closeToTray);
  const hasSeenTrayNotice = useSettingsStore((s) => s.hasSeenTrayNotice);
  const prayerReminders = useSettingsStore((s) => s.prayerReminders);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const currentTrack = useAudioStore((s) => s.currentTrack);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [narrowAutoCollapsed, setNarrowAutoCollapsed] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 1000,
  );
  const [trayDialogOpen, setTrayDialogOpen] = useState(false);
  const schedulerRef = useRef(new ReminderScheduler(120_000));

  // Auto-collapse sidebar under ~1000px
  useEffect(() => {
    const onResize = () => setNarrowAutoCollapsed(window.innerWidth < 1000);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Keep OS system-theme listener synced when theme === "system"
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (useSettingsStore.getState().theme === "system") {
        useSettingsStore.getState().setTheme("system");
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Sync close-to-tray behavior with Rust backend
  useEffect(() => {
    const shouldHide =
      closeToTray && hasAnyPrayerReminderEnabled(prayerReminders);
    void setCloseToTray(shouldHide);
  }, [closeToTray, prayerReminders]);

  // Listen to Rust tray events
  useEffect(() => {
    let unlistenToggle: (() => void) | undefined;
    let unlistenClose: (() => void) | undefined;

    void tauriListen("tray-toggle-audio", () => {
      useAudioStore.getState().togglePlayPause();
    }).then((fn) => {
      unlistenToggle = fn;
    });

    void tauriListen("close-to-tray-requested", () => {
      if (!useSettingsStore.getState().hasSeenTrayNotice) {
        setTrayDialogOpen(true);
      } else {
        void hideMainWindow();
      }
    }).then((fn) => {
      unlistenClose = fn;
    });

    return () => {
      unlistenToggle?.();
      unlistenClose?.();
    };
  }, []);

  // Single idempotent reminder scheduler + tray status tick (every 20s)
  useEffect(() => {
    const runTick = () => {
      const s = useSettingsStore.getState();
      const place = getActivePlace(s);
      const solahConfig: SolahConfig = {
        latitude: place.latitude,
        longitude: place.longitude,
        timezone: place.timezone,
        method: s.calculationMethod,
        madhab: s.madhab,
        highLatitudeRule: s.highLatitudeRule,
        adjustments: s.adjustments,
      };
      const now = new Date();

      // Update tray next-prayer indicator
      const nextP = computeNextPrayer(solahConfig, now);
      const pName = dict.prayer[nextP.key];
      const shortCd = formatShortCountdown(nextP.time, now);
      const label = `${pName} in ${shortCd}`;
      void updateTrayStatus(
        `${dict.home.nextPrayer}: ${label}`,
        label,
        useAudioStore.getState().isPlaying,
      );

      // Evaluate scheduled reminders
      const events = schedulerRef.current.tick(now, {
        solahConfig,
        prayerReminders: s.prayerReminders,
        dailyReadingReminder: s.dailyReadingReminder,
        dailyReadingTime: s.dailyReadingTime,
        fridayKahfReminder: s.fridayKahfReminder,
      });

      for (const ev of events) {
        void sendNativeNotification(ev.title, ev.body);
        if (ev.playAdhan) {
          useAudioStore.getState().playAdhan();
        }
      }
    };

    runTick();
    const interval = setInterval(runTick, 20_000);
    return () => clearInterval(interval);
  }, [dict, isPlaying]);

  // Global keyboard shortcuts (Cmd/Ctrl+K, audio controls)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }

      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const audio = useAudioStore.getState();
      if (!audio.currentTrack) return;

      if (e.shiftKey && e.key === "ArrowRight") {
        e.preventDefault();
        audio.seekBy(10);
      } else if (e.shiftKey && e.key === "ArrowLeft") {
        e.preventDefault();
        audio.seekBy(-10);
      } else if (e.shiftKey && e.key === "ArrowUp") {
        e.preventDefault();
        audio.setVolume(audio.volume + 0.1);
      } else if (e.shiftKey && e.key === "ArrowDown") {
        e.preventDefault();
        audio.setVolume(audio.volume - 0.1);
      } else if (!mod && !e.altKey && e.key.toLowerCase() === "n") {
        audio.skipNext();
      } else if (!mod && !e.altKey && e.key.toLowerCase() === "p") {
        audio.skipPrevious();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const effectiveCollapsed = narrowAutoCollapsed || sidebarCollapsed;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar
          collapsed={effectiveCollapsed}
          onToggleCollapse={() =>
            updateSettings({ sidebarCollapsed: !sidebarCollapsed })
          }
          onOpenCommandPalette={() => setPaletteOpen(true)}
        />
        <main
          id="main-content"
          className="relative flex min-w-0 flex-1 flex-col overflow-hidden"
        >
          {children}
        </main>
      </div>

      {currentTrack && <BottomPlayerBar />}

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <OnboardingModal />
      <ToastContainer />

      <Dialog
        open={trayDialogOpen}
        onClose={() => setTrayDialogOpen(false)}
        title={dict.trayDialog.title}
        maxWidth="max-w-md"
      >
        <p className="text-[14px] text-[var(--color-text-muted)]">
          {dict.trayDialog.body}
        </p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button
            variant="subtle"
            onClick={() => {
              setTrayDialogOpen(false);
              void quitApplication();
            }}
          >
            {dict.trayDialog.quitInstead}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!hasSeenTrayNotice) {
                updateSettings({ hasSeenTrayNotice: true });
              }
              setTrayDialogOpen(false);
              void hideMainWindow();
            }}
          >
            {dict.trayDialog.keepInTray}
          </Button>
        </div>
      </Dialog>
    </div>
  );
};
