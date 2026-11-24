# Quranic Desktop

A fast, lightweight, offline-first desktop Quran application for **Windows, macOS, and Linux**, built with **Tauri v2**, **React 19**, **TypeScript**, and **Tailwind CSS v4**.

- **Zero telemetry, zero accounts, zero ads.**
- **Offline-first** for Quran text, search, translation, transliteration, prayer times (7,900+ bundled world cities), Qiblah, Adhkaar, Hijri calendar, Hifz progress, and bookmarks.
- **Native desktop UX**: collapsible sidebar, `Cmd/Ctrl+K` command palette, virtualized reader (List, Focus, and Mushaf modes), persistent bottom audio player, system tray next-prayer countdown, and full English / Arabic (RTL) mirroring.

---

## Development & Running Locally

### Prerequisites
- **Node.js 22+** and **pnpm**
- **Rust** (stable toolchain via [rustup.rs](https://rustup.rs/))
- **Linux only**: WebKitGTK 4.1 + GStreamer + AppIndicator development libraries:
  ```bash
  sudo apt-get install -y libwebkit2gtk-4.1-dev build-essential libxdo-dev libssl-dev \
    libayatana-appindicator3-dev librsvg2-dev patchelf \
    gstreamer1.0-plugins-base gstreamer1.0-plugins-good gstreamer1.0-plugins-ugly gstreamer1.0-libav
  ```

### Run in Development Mode
```bash
cd desktop
pnpm install
pnpm tauri dev
```

### Run Frontend Only (Browser Preview)
```bash
cd desktop
pnpm install
pnpm dev
```

### Tests, Linting & Typecheck
```bash
cd desktop
pnpm typecheck
pnpm lint
pnpm test
cargo test --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
```

### Production Build
```bash
cd desktop
pnpm tauri build
```

---

## Keyboard Shortcuts

| Context | Shortcut | Action |
| --- | --- | --- |
| Global | `Cmd/Ctrl + K` | Open Command Palette (search Quran, jump to `2:255`, `baqarah 255`, `surah 36`, `juz 30`, `page 604`, or run actions) |
| Audio | `Shift + Left / Right` | Seek backward / forward 10 seconds |
| Audio | `Shift + Up / Down` | Volume up / down |
| Audio | `N` / `P` | Next / Previous track |
| Reader | `J / K` or `Up / Down` | Move verse selection |
| Reader | `Enter` | Play audio from selected verse |
| Reader | `B` | Toggle bookmark on selected verse |
| Reader | `C` | Copy selected verse |
| Reader | `Cmd/Ctrl + F` | In-surah search |
| Reader | `G` | Go to verse number |
| Reader | `Cmd/Ctrl + =` / `-` | Increase / decrease Arabic font size |
| Reader | `Left / Right` | Previous / next surah (List) or verse (Focus) or page (Mushaf) |
| Adhkaar | `Space / Enter` | Increment counter |
| Adhkaar | `Backspace` / `R` | Decrement / Reset item |
| Hifz (Hide & Reveal) | `Space` | Reveal / hide verse |
| Hifz (Hide & Reveal) | `1 / 2 / 3` | Mark Not Started / Learning / Memorized |

---

## Installing Unsigned Builds

Release builds produced by CI are currently **unsigned** (no Apple Developer / Windows Authenticode certificate configured yet):

- **macOS (Gatekeeper)**: Right-click `Quranic.app` → **Open** → confirm, or run:
  ```bash
  xattr -dr com.apple.quarantine /Applications/Quranic.app
  ```
- **Windows (SmartScreen)**: Click **More info** → **Run anyway**. Machines without WebView2 will automatically download the small Microsoft WebView2 bootstrapper during installation.
- **Linux**: Install the `.deb` (`sudo apt install ./Quranic_*.deb`), `.rpm`, or make the `.AppImage` executable (`chmod +x Quranic_*.AppImage`). GStreamer plugins are declared as `.deb`/`.rpm` dependencies and bundled in the AppImage so MP3 streaming works on WebKitGTK.

### Signing, Notarization & Auto-Updater (Future)
- **macOS**: Requires an Apple Developer ID Application certificate (`APPLE_CERTIFICATE`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID` secrets in GitHub Actions) for signing and notarization.
- **Windows**: Requires an EV/OV code-signing certificate or Azure Trusted Signing.
- **Auto-Updater**: Intentionally omitted in v1 (requires signing keys). To add later, enable `tauri-plugin-updater` with a signed `latest.json` endpoint hosted on GitHub Releases.

---

## Known Limitations & Not on Desktop (v1)

### Known Limitations
- **Mushaf scan resolution**: The 604 Mushaf WebP scans fetched on demand are **456×672 px**. The reader caps display scale to preserve sharpness and defaults to the crisp Amiri Quran text reader; Mushaf mode is optional.
- **Linux tray title**: Linux AppIndicator trays display the next-prayer countdown in the tray tooltip and menu header rather than inline next to the icon (macOS displays it directly in the menu bar).

### Not on Desktop (Explicitly Out of Scope for v1)
- AI Chat assistant (hidden in mobile; clean seam preserved)
- Live magnetometer Qiblah compass (desktops lack magnetometers; replaced with a static true-north great-circle bearing compass rose)
- Haptic feedback, Android home-screen widget (replaced by system tray), iOS Liquid Glass tabs, mobile background-task wakeups, `quranic://` deep links, Expo OTA updates.

---

## Licensing & Attribution
See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) and the in-app **Settings → About, Privacy & Attributions** screen.
