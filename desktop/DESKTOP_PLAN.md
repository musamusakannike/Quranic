# Quranic Desktop — Architecture & Implementation Plan

## 1. Overview
Quranic Desktop is a native-feeling, offline-first desktop Quran application for Windows, macOS, and Linux built with **Tauri v2** (Rust backend + OS native webview) and **React 19 + TypeScript + Vite + Tailwind CSS v4** (`pnpm`).

It achieves feature parity with the relevant parts of `mobile/` while elevating the desktop experience with:
- A collapsible sidebar shell + optional reader verse inspector + persistent bottom audio bar
- Keyboard-first navigation (`Cmd/Ctrl+K` command palette, `Cmd/Ctrl+F` in-surah search, `J`/`K` or arrows, `B`, `C`, `G`, `Space`, media keys)
- Web Worker-powered diacritic-insensitive Arabic / translation / transliteration search and smart reference parsing (`2:255`, `baqarah 255`, `surah 36`, `juz 30`, `page 604`)
- Timezone-accurate prayer times (`adhan` + IANA timezones via `Intl`) with an offline bundled city database (GeoNames `cities15000`), drift-free wake-safe scheduler, native notifications, in-app Adhan playback, and system tray next-prayer indicator
- Unified reader + audio playback (chapter reciters via `mp3quran.net`, verse-by-verse via `alquran.cloud` / `cdn.islamic.network`, Rust-side streaming offline downloads)
- Pluggable translation packs with clear licensing and attribution

## 2. Folder Structure
```text
desktop/
├── DESKTOP_PLAN.md
├── README.md
├── THIRD_PARTY_NOTICES.md
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── eslint.config.js
├── index.html                   # Inline pre-paint theme + dir/lang script
├── public/
│   └── audio/azan.mp3           # Converted from mobile/assets/sounds/azan.wav (<400 KB)
├── src/
│   ├── main.tsx
│   ├── App.tsx                  # HashRouter + lazy route code-splitting
│   ├── styles/
│   │   ├── tokens.css           # Light/dark CSS variables, logical typography scale
│   │   └── global.css           # Tailwind v4 + font-face rules + reduced-motion
│   ├── assets/fonts/            # Satoshi Regular/Medium/Bold .woff2
│   ├── data/
│   │   ├── quran_optimized_array.json
│   │   ├── ara-quran-la_optimized_array.json
│   │   ├── quran_metadata_optimized.json
│   │   ├── hisnulmuslim.json
│   │   ├── adhkaar.json         # Extracted from mobile/app/adhkaar/[id].tsx
│   │   ├── cities.json          # Compact offline cities (GeoNames CC BY 4.0)
│   │   ├── islamic_events.ts    # 10 Hijri calendar events
│   │   └── translations/        # Pluggable translation packs (verified PD + dev-only)
│   ├── lib/
│   │   ├── tauri.ts             # Safe Tauri IPC wrappers with browser-mode fallbacks
│   │   ├── db.ts                # Versioned persistence (SQLite via tauri-plugin-sql + IndexedDB/localStorage fallback)
│   │   ├── quran.ts             # O(1) verse/chapter/juz/page lookups + reference parser
│   │   ├── searchClient.ts      # Typed RPC client for search.worker.ts
│   │   ├── solah.ts             # Multi-method adhan calculation in target IANA timezone
│   │   ├── scheduler.ts         # Drift-free, wake-safe prayer & daily reminder scheduler
│   │   ├── qiblah.ts            # Great-circle bearing & distance to Kaaba
│   │   ├── hijri.ts             # moment-hijri wrapper with +/-1 day offset & EN/AR localization
│   │   ├── audioApi.ts          # Rust-proxied HTTP client + cache for mp3quran & alquran.cloud
│   │   ├── mushaf.ts            # On-demand Mushaf fetch/cache/prefetch & bulk download
│   │   ├── shareCard.ts         # Canvas/SVG verse card PNG renderer + clipboard/save
│   │   └── i18n/                # Typed EN + AR dictionaries covering 100% of screens
│   ├── workers/
│   │   └── search.worker.ts     # Precomputed normalized index + fast off-thread search
│   ├── stores/
│   │   ├── settingsStore.ts     # Theme, language, typography, reading mode, prayer settings, reminders
│   │   ├── readingStore.ts      # Last-read (List/Focus/Mushaf), bookmarks
│   │   ├── audioStore.ts        # HTMLAudioElement engine, queue, speed, repeat, sleep timer, MediaSession
│   │   ├── downloadsStore.ts    # Functional-update download manager (in-progress + completed)
│   │   ├── hifzStore.ts         # 6,236-verse memorization status + loop state
│   │   └── adhkaarStore.ts      # Daily-resetting per-item dhikr counters
│   ├── components/
│   │   ├── ui/                  # Button, SegmentedControl, Toggle, Slider, Select, Dialog, Toast, Kbd, EmptyState, ErrorState, Skeleton
│   │   ├── layout/              # AppShell, Sidebar, BottomPlayerBar, CommandPalette, OnboardingModal
│   │   ├── reader/              # ListReader, FocusReader, MushafReader, VerseRow, VerseInspector, ShareVerseDialog
│   │   └── audio/               # ReciterPickerDialog, QueuePopover
│   └── pages/                   # Lazy-loaded route views (Home, Quran, Reader, Bookmarks, Audio, PrayerTimes, Qiblah, Adhkaar, Hijri, Hifz, Settings, About)
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── capabilities/default.json
│   ├── icons/                   # Generated via `tauri icon` from mobile/assets/images/icon.png
│   └── src/
│       ├── main.rs
│       ├── lib.rs               # Plugins, tray setup, close-to-tray handling, IPC commands
│       ├── http_proxy.rs        # Rust-side reqwest HTTP fetch (avoids webview CORS)
│       └── downloader.rs        # Streaming file download with progress events, cancel, partial cleanup + unit tests
├── tests/                       # Vitest unit tests
├── e2e/                         # Playwright screenshot & visual QA scripts (dev-only)
├── docs/screenshots/            # Generated light/dark EN/AR 1280x800, 1920x1080, 960x640 screenshots
└── dist-artifacts/              # Built Linux installers (.deb, .rpm, AppImage)
```

## 3. Data Flow & Persistence
- **Pre-paint initialization**: `index.html` runs a tiny inline script reading cached theme (`light`/`dark`/`system`) and language (`en`/`ar`) from `localStorage` before React mounts, setting `data-theme`, `dir`, and `lang` on `<html>` to eliminate cold-start flash.
- **Persistence**: Primary storage uses `tauri-plugin-sql` (SQLite in `appDataDir/quranic.db`) with a versioned `schema_migrations` table (`v1` creates tables for `kv_settings`, `bookmarks`, `last_read`, `hifz_progress`, `downloads`, `adhkaar_counters`, `places`). When running in plain browser/Playwright dev mode without Tauri runtime, `lib/db.ts` transparently falls back to `localStorage` with the same async interface.
- **Search**: `search.worker.ts` lazily loads the Quran Arabic, active translation pack, and transliteration arrays, precomputes normalized strings once in memory, and answers queries off the main thread (debounced 200ms, capped at 100 results). Reference queries (`2:255`, `baqarah 255`, `surah 36`, `juz 30`, `page 604`) are parsed synchronously in `lib/quran.ts`.
- **Network**: All third-party HTTP calls (`mp3quran.net`, `api.alquran.cloud`, Mushaf page fetches, optional IP geolocation) go through a Rust `http_get` / `download_file` command using `reqwest` to avoid WebKitGTK/WKWebView/WebView2 CORS quirks. Audio playback streams directly or plays local downloaded files via Tauri's `convertFileSrc` asset protocol.
- **Prayer Scheduler**: A single idempotent tick loop (`lib/scheduler.ts`, every 20s) compares `Date.now()` against computed prayer timestamps in the active location's IANA timezone, tracking fired event keys (`YYYY-MM-DD:prayer:offset`) to prevent duplicates across sleep/wake, DST transitions, and midnight rollover. Updates the system tray tooltip/title with the next prayer countdown.

## 4. Key Architectural Decisions & Brief Notes
1. **Translation Pack Licensing (Section 7)**:
   - We implement a clean `TranslationPack` abstraction (`id`, `name`, `translator`, `license`, `sourceUrl`, `attribution`, `loader`).
   - We will attempt to fetch and verify a public-domain English translation (e.g., Pickthall or Yusuf Ali from Tanzil / AlQuran.cloud) for release builds, keeping Abdel Haleem gated behind `VITE_INCLUDE_DEV_TRANSLATIONS=true` (off in release builds). If a public-domain pack cannot be verified cleanly, we will ship the mobile dataset behind the pack system and flag it first in the final report.
2. **Offline Cities Dataset**:
   - We will bundle a compact, pre-filtered GeoNames `cities15000` JSON (top world cities with name, country code, lat, lng, IANA timezone; CC BY 4.0 attributed) keeping the uncompressed file under ~600 KB (~150 KB gzipped) so the installer stays well under 15 MB.
3. **Linux Media Support**:
   - `tauri.conf.json` enables `bundle.linux.appimage.bundleMediaFramework: true` and declares GStreamer runtime dependencies (`gstreamer1.0-plugins-base`, `gstreamer1.0-plugins-good`, `gstreamer1.0-plugins-ugly`, `gstreamer1.0-libav`) for `.deb` and `.rpm`.
4. **Windows WebView2**:
   - Configured with `webviewInstallMode: { type: "downloadBootstrapper" }` so Windows machines without WebView2 download the small bootstrapper automatically.
5. **macOS / Windows Builds**:
   - Linux `.deb`, `.rpm`, and `.AppImage` will be built and measured locally on this Ubuntu VM. macOS universal `.dmg` and Windows `.exe`/`.msi` will be built via `.github/workflows/desktop-release.yml` using `tauri-apps/tauri-action` (linted with `actionlint`).
