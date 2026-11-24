import React from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { openExternalUrl } from "../lib/tauri";
import { useI18n } from "../hooks/useI18n";
import { Button } from "../components/ui";

const NETWORK_ENDPOINTS = [
  "https://mp3quran.net/api/v3/* — Chapter reciters catalog and audio streams",
  "https://api.alquran.cloud/v1/* — Verse-by-verse reciter editions",
  "https://cdn.islamic.network/quran/audio/* — Verse-by-verse MP3 audio streams",
  "https://raw.githubusercontent.com/musamusakannike/Quranic/* — On-demand Mushaf WebP scans",
  "https://ipapi.co/json/ — Optional IP geolocation (only when you explicitly click 'Detect from my IP')",
];

const ATTRIBUTIONS = [
  {
    name: "Quran Arabic Uthmani Text & Metadata",
    license: "Provenance unverified (carried over from mobile/docs)",
    url: "https://github.com/musamusakannike/Quranic",
  },
  {
    name: "Mushaf Page Scans (604 WebP, 456×672)",
    license: "Provenance unverified (fetched on demand)",
    url: "https://github.com/musamusakannike/Quranic",
  },
  {
    name: "English Translation — Marmaduke Pickthall (1930)",
    license: "Public Domain (sourced via AlQuran Cloud)",
    url: "https://alquran.cloud/",
  },
  {
    name: "Hisn al-Muslim & Adhkaar",
    license: "Bundled dataset from mobile repository",
    url: "https://github.com/musamusakannike/Quranic",
  },
  {
    name: "GeoNames cities15000 (Offline City Database)",
    license: "CC BY 4.0",
    url: "https://www.geonames.org/",
  },
  {
    name: "Amiri Quran & Cairo Fonts",
    license: "SIL Open Font License 1.1",
    url: "https://fonts.google.com/",
  },
  {
    name: "Satoshi Font",
    license: "Fontshare Free Font License (Indian Type Foundry)",
    url: "https://www.fontshare.com/fonts/satoshi",
  },
  {
    name: "Audio Recitations",
    license: "Streamed via mp3quran.net and AlQuran Cloud / Islamic Network",
    url: "https://mp3quran.net/",
  },
];

export const AboutPage: React.FC = () => {
  const { dict, isRTL } = useI18n();
  const navigate = useNavigate();
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[740px] px-8 py-8 space-y-8 pb-16">
        <header className="border-b border-[var(--color-border)] pb-5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/settings")}
            className="mb-3 -ms-2"
          >
            <BackIcon size={15} /> {dict.nav.settings}
          </Button>
          <h1 className="text-[22px] font-bold tracking-tight">
            {dict.about.title}
          </h1>
          <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
            {dict.app.name} · {dict.about.version} · {dict.about.license}
          </p>
        </header>

        {/* Privacy Stance */}
        <section className="space-y-3 border-b border-[var(--color-border)] pb-6">
          <h2 className="text-[14px] font-semibold">{dict.about.privacyTitle}</h2>
          <p className="text-[14px] leading-relaxed text-[var(--color-text-muted)]">
            {dict.about.privacyBody}
          </p>
          <div className="pt-2">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              {dict.about.networkListTitle}
            </div>
            <ul className="space-y-1 text-[13px] text-[var(--color-text-muted)] list-disc ps-5">
              {NETWORK_ENDPOINTS.map((ep) => (
                <li key={ep}>{ep}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Provenance Note */}
        <section className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-[13px] text-[var(--color-text-muted)]">
          {dict.about.provenanceWarning}
        </section>

        {/* Attributions */}
        <section className="space-y-3">
          <h2 className="text-[14px] font-semibold">
            {dict.about.attributionsTitle}
          </h2>
          <div className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
            {ATTRIBUTIONS.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div>
                  <div className="text-[14px] font-medium">{item.name}</div>
                  <div className="text-[12px] text-[var(--color-text-muted)]">
                    {item.license}
                  </div>
                </div>
                <Button
                  variant="icon"
                  size="sm"
                  onClick={() => void openExternalUrl(item.url)}
                  aria-label={`Open ${item.name}`}
                >
                  <ExternalLink size={14} />
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
