import React, { Suspense, useEffect } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router";
import { AppShell } from "./components/layout/AppShell";
import { Skeleton } from "./components/ui";
import { useSettingsStore } from "./stores/settingsStore";
import { useReadingStore } from "./stores/readingStore";
import { useAudioStore } from "./stores/audioStore";
import { useDownloadsStore } from "./stores/downloadsStore";
import { useHifzStore } from "./stores/hifzStore";
import { useAdhkaarStore } from "./stores/adhkaarStore";
import { showMainWindow } from "./lib/tauri";

const HomePage = React.lazy(() =>
  import("./pages/HomePage").then((m) => ({ default: m.HomePage })),
);
const QuranPage = React.lazy(() =>
  import("./pages/QuranPage").then((m) => ({ default: m.QuranPage })),
);
const ReaderPage = React.lazy(() =>
  import("./pages/ReaderPage").then((m) => ({ default: m.ReaderPage })),
);
const BookmarksPage = React.lazy(() =>
  import("./pages/BookmarksPage").then((m) => ({ default: m.BookmarksPage })),
);
const AudioPage = React.lazy(() =>
  import("./pages/AudioPage").then((m) => ({ default: m.AudioPage })),
);
const PrayerTimesPage = React.lazy(() =>
  import("./pages/PrayerTimesPage").then((m) => ({ default: m.PrayerTimesPage })),
);
const QiblahPage = React.lazy(() =>
  import("./pages/QiblahPage").then((m) => ({ default: m.QiblahPage })),
);
const AdhkaarPage = React.lazy(() =>
  import("./pages/AdhkaarPage").then((m) => ({ default: m.AdhkaarPage })),
);
const HijriCalendarPage = React.lazy(() =>
  import("./pages/HijriCalendarPage").then((m) => ({
    default: m.HijriCalendarPage,
  })),
);
const HifzPage = React.lazy(() =>
  import("./pages/HifzPage").then((m) => ({ default: m.HifzPage })),
);
const SettingsPage = React.lazy(() =>
  import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const AboutPage = React.lazy(() =>
  import("./pages/AboutPage").then((m) => ({ default: m.AboutPage })),
);

const PageFallback: React.FC = () => (
  <div className="mx-auto w-full max-w-[760px] p-8 space-y-4">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-24 w-full" />
  </div>
);

export const App: React.FC = () => {
  useEffect(() => {
    void Promise.all([
      useSettingsStore.getState().hydrate(),
      useReadingStore.getState().hydrate(),
      useAudioStore.getState().hydrate(),
      useDownloadsStore.getState().hydrate(),
      useHifzStore.getState().hydrate(),
      useAdhkaarStore.getState().hydrate(),
    ]).finally(() => {
      // Show window immediately after first paint (zero artificial splash delay)
      requestAnimationFrame(() => {
        void showMainWindow();
      });
    });
  }, []);

  return (
    <HashRouter>
      <AppShell>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/quran" element={<QuranPage />} />
            <Route path="/quran/:surahId" element={<ReaderPage />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="/audio" element={<AudioPage />} />
            <Route path="/prayer-times" element={<PrayerTimesPage />} />
            <Route path="/qiblah" element={<QiblahPage />} />
            <Route path="/adhkaar" element={<AdhkaarPage />} />
            <Route path="/hijri" element={<HijriCalendarPage />} />
            <Route path="/hifz" element={<HifzPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppShell>
    </HashRouter>
  );
};

export default App;
