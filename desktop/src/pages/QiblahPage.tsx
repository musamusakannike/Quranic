import React from "react";
import { useNavigate } from "react-router";
import { MapPin } from "lucide-react";
import { useSettingsStore, getActivePlace } from "../stores/settingsStore";
import {
  bearingToCardinal,
  computeDistanceToKaabaKm,
  computeQiblahBearing,
} from "../lib/qiblah";
import { useI18n } from "../hooks/useI18n";
import { Button } from "../components/ui";

export const QiblahPage: React.FC = () => {
  const { dict, fmt, num, lang } = useI18n();
  const navigate = useNavigate();

  const places = useSettingsStore((s) => s.places);
  const activePlaceId = useSettingsStore((s) => s.activePlaceId);
  const place = getActivePlace({ places, activePlaceId });

  const bearing = computeQiblahBearing(place.latitude, place.longitude);
  const distanceKm = Math.round(computeDistanceToKaabaKm(place.latitude, place.longitude));
  const cardinal = bearingToCardinal(bearing, lang);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[760px] px-8 py-8 space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-border)] pb-5">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight">
              {dict.qiblah.title}
            </h1>
            <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
              {dict.qiblah.subtitle}
            </p>
          </div>
          <Button
            variant="subtle"
            size="sm"
            onClick={() => navigate("/prayer-times")}
          >
            <MapPin size={14} />
            {dict.qiblah.changeLocation}
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-10 py-4">
          {/* Static SVG Compass Rose */}
          <div className="flex items-center justify-center">
            <svg
              viewBox="0 0 280 280"
              className="h-64 w-64 select-none"
              role="img"
              aria-label={`Qiblah bearing ${bearing.toFixed(1)} degrees ${cardinal}`}
            >
              {/* Outer ring */}
              <circle
                cx="140"
                cy="140"
                r="124"
                fill="var(--color-surface)"
                stroke="var(--color-border)"
                strokeWidth="1.5"
              />
              {/* Degree ticks */}
              {Array.from({ length: 36 }, (_, i) => {
                const angle = i * 10;
                const major = angle % 90 === 0;
                const r1 = major ? 110 : 117;
                const r2 = 123;
                const rad = ((angle - 90) * Math.PI) / 180;
                return (
                  <line
                    key={angle}
                    x1={140 + r1 * Math.cos(rad)}
                    y1={140 + r1 * Math.sin(rad)}
                    x2={140 + r2 * Math.cos(rad)}
                    y2={140 + r2 * Math.sin(rad)}
                    stroke={major ? "var(--color-text-muted)" : "var(--color-border)"}
                    strokeWidth={major ? 1.75 : 1}
                  />
                );
              })}

              {/* Cardinal labels */}
              <text
                x="140"
                y="42"
                textAnchor="middle"
                fill="var(--color-text)"
                fontSize="13"
                fontWeight="700"
              >
                {dict.qiblah.north}
              </text>
              <text
                x="240"
                y="145"
                textAnchor="middle"
                fill="var(--color-text-muted)"
                fontSize="12"
                fontWeight="600"
              >
                {dict.qiblah.east}
              </text>
              <text
                x="140"
                y="246"
                textAnchor="middle"
                fill="var(--color-text-muted)"
                fontSize="12"
                fontWeight="600"
              >
                {dict.qiblah.south}
              </text>
              <text
                x="40"
                y="145"
                textAnchor="middle"
                fill="var(--color-text-muted)"
                fontSize="12"
                fontWeight="600"
              >
                {dict.qiblah.west}
              </text>

              {/* Qiblah Needle rotated to bearing */}
              <g transform={`rotate(${bearing} 140 140)`}>
                <polygon
                  points="140,46 147,140 133,140"
                  fill="var(--color-primary)"
                />
                <polygon
                  points="140,214 145,140 135,140"
                  fill="var(--color-border)"
                />
                {/* Kaaba gold dot at needle tip */}
                <circle cx="140" cy="40" r="5" fill="var(--color-accent)" />
              </g>

              <circle
                cx="140"
                cy="140"
                r="6"
                fill="var(--color-surface)"
                stroke="var(--color-primary)"
                strokeWidth="2.5"
              />
            </svg>
          </div>

          {/* Bearing & Distance Readout */}
          <div className="space-y-6">
            <div className="border-b border-[var(--color-border)] pb-4">
              <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                {dict.qiblah.bearing}
              </div>
              <div className="mt-1 text-[36px] font-bold tracking-tight tabular-nums text-[var(--color-primary)]">
                {bearing.toFixed(1)}°{" "}
                <span className="text-[20px] font-semibold text-[var(--color-text)]">
                  {cardinal}
                </span>
              </div>
            </div>

            <div className="border-b border-[var(--color-border)] pb-4">
              <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                {dict.qiblah.distance}
              </div>
              <div className="mt-1 text-[22px] font-semibold tabular-nums">
                {fmt(dict.qiblah.km, { n: num(distanceKm) })}
              </div>
            </div>

            <div>
              <div className="text-[12px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                {dict.qiblah.activeLocation}
              </div>
              <div className="mt-1 text-[14px] font-medium">
                {place.name}
                {place.country ? `, ${place.country}` : ""} ({place.latitude.toFixed(3)},{" "}
                {place.longitude.toFixed(3)})
              </div>
            </div>

            <p className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3.5 py-2.5 text-[12px] text-[var(--color-text-muted)]">
              {dict.qiblah.staticNotice}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
