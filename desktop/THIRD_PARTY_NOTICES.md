# Third-Party Notices & Attributions

Quranic Desktop is licensed under the **MIT License** (see repository root `LICENSE`).
This document records the sources, licenses, and provenance status of all bundled datasets, fonts, external APIs, and software dependencies.

## 1. Datasets & Content

| Asset | Source | License / Status | Notes |
| --- | --- | --- | --- |
| **Quran Arabic Text (Uthmani)** (`quran_optimized_array.json`) & Metadata (`quran_metadata_optimized.json`) | Carried over from `mobile/docs/` | **Provenance unverified** | No upstream provenance certificate exists in the repository; flagged for manual verification before public distribution. |
| **Quran Transliteration** (`ara-quran-la_optimized_array.json`) | Carried over from `mobile/docs/` | **Provenance unverified** | Carried over from `mobile/docs/`. |
| **English Translation — Marmaduke Pickthall (1930)** (`eng-pickthall.json`) | [AlQuran Cloud](https://api.alquran.cloud/v1/quran/en.pickthall) | **Public Domain** | First published in 1930; author Mohammed Marmaduke Pickthall died in 1936. Used as the default translation pack in release builds. |
| **English Translation — M.A.S. Abdel Haleem** (`eng-abdelhaleem_dev.json`) | Oxford University Press (`mobile/docs/`) | **Copyrighted (Dev-only)** | Excluded from release builds via `VITE_INCLUDE_DEV_TRANSLATIONS` build flag (OFF by default). |
| **Mushaf Page Scans** (604 WebP images, 456×672 px) | Fetched on demand from `raw.githubusercontent.com/musamusakannike/Quranic/main/mobile/assets/images/mushaf-complete/{n}.webp` | **Provenance unverified** | Not bundled in the installer. |
| **Hisn al-Muslim & Adhkaar** (`hisnulmuslim.json`, `adhkaar.json`) | Extracted from `mobile/` | **Provenance unverified** | Bundled for offline daily adhkaar. |
| **Offline Cities Database** (`cities.json`) | [GeoNames `cities15000`](https://download.geonames.org/export/dump/cities15000.zip) | **CC BY 4.0** | Compact subset of 7,927 world cities (name, country code, lat, lng, IANA timezone). © GeoNames. |

## 2. Fonts (Bundled Locally as WOFF2)

| Font | Source | License |
| --- | --- | --- |
| **Amiri Quran** | `@fontsource/amiri-quran` | SIL Open Font License 1.1 |
| **Cairo** | `@fontsource/cairo` | SIL Open Font License 1.1 |
| **Satoshi** | Indian Type Foundry / [Fontshare](https://www.fontshare.com/fonts/satoshi) | Fontshare Free Font License (free for personal & commercial use; redistribution as part of an application permitted, standalone font resale prohibited) |

## 3. External Network Services (Opt-in / Explicit Only)

- **mp3quran.net** (`https://mp3quran.net/api/v3/*`): Chapter-level reciter catalog and MP3 audio streams.
- **AlQuran Cloud / Islamic Network** (`https://api.alquran.cloud/v1/*`, `https://cdn.islamic.network/quran/audio/*`): Verse-by-verse reciter editions and MP3 audio streams.
- **GitHub Raw** (`https://raw.githubusercontent.com/musamusakannike/Quranic/*`): On-demand Mushaf page images (configurable base URL in `src/lib/mushaf.ts`).
- **ipapi.co** (`https://ipapi.co/json/`): Optional IP-based location detection, invoked **only** when the user explicitly clicks "Detect from my IP".

## 4. Open-Source Software Dependencies

### Frontend (npm / pnpm)
- `react`, `react-dom`, `react-router`, `zustand`, `@tanstack/react-virtual`, `adhan`, `moment`, `moment-hijri`, `tailwindcss`, `vite`, `vitest`: **MIT License**
- `lucide-react`: **ISC License**
- `@tauri-apps/api`, `@tauri-apps/plugin-*`: **MIT / Apache-2.0**

### Backend (Rust / Cargo)
- `tauri`, `tauri-build`, `tauri-plugin-*`: **MIT / Apache-2.0**
- `reqwest`, `tokio`, `futures-util`, `serde`, `serde_json`: **MIT / Apache-2.0**
