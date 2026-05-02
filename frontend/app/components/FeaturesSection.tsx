"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  BookOpen,
  Headphones,
  Compass,
  Clock,
  CalendarDays,
  Sparkles,
  Brain,
  MessageCircle,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Quran Reader",
    description:
      "Beautiful Mushaf typography with verse-by-verse navigation, bookmarks, and seamless progress tracking.",
    accent: "teal",
  },
  {
    icon: Headphones,
    title: "Audio Recitation",
    description:
      "Listen to world-renowned reciters with a built-in mini player. Follow along as you listen.",
    accent: "teal-vivid",
  },
  {
    icon: Compass,
    title: "Qiblah Finder",
    description:
      "Precision compass that points you towards the Ka'bah from anywhere in the world.",
    accent: "teal-glow",
  },
  {
    icon: Clock,
    title: "Prayer Times",
    description:
      "Accurate prayer schedules based on your location with reminders for each Solah.",
    accent: "gold",
  },
  {
    icon: CalendarDays,
    title: "Hijri Calendar",
    description:
      "Always know the Islamic date. Track important days and religious events.",
    accent: "teal",
  },
  {
    icon: Sparkles,
    title: "Daily Adhkaar",
    description:
      "Morning and evening supplications with counters to build your daily remembrance habit.",
    accent: "teal-vivid",
  },
  {
    icon: Brain,
    title: "Hifz Suite",
    description:
      "Memorize the Quran with spaced repetition tools, progress tracking, and revision schedules.",
    accent: "gold",
  },
  {
    icon: MessageCircle,
    title: "AI Assistant",
    description:
      "Ask questions about the deen and get thoughtful, source-backed answers instantly.",
    accent: "teal-glow",
  },
];

const accentColors: Record<string, string> = {
  teal: "rgba(5, 108, 92, 0.12)",
  "teal-vivid": "rgba(10, 143, 122, 0.12)",
  "teal-glow": "rgba(16, 185, 129, 0.12)",
  gold: "rgba(212, 175, 55, 0.12)",
};

const accentTextColors: Record<string, string> = {
  teal: "#056C5C",
  "teal-vivid": "#0A8F7A",
  "teal-glow": "#10B981",
  gold: "#D4AF37",
};

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.6,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative p-6 rounded-2xl bg-surface border border-slate-100 hover:border-teal/20 transition-all duration-400 hover:shadow-lg hover:shadow-teal/5 hover:-translate-y-1"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
        style={{ backgroundColor: accentColors[feature.accent] }}
      >
        <Icon
          size={20}
          strokeWidth={1.8}
          style={{ color: accentTextColors[feature.accent] }}
        />
      </div>

      <h3 className="font-headline text-lg font-semibold text-ink mb-2">
        {feature.title}
      </h3>
      <p className="text-[14px] leading-relaxed text-slate-400">
        {feature.description}
      </p>

      {/* Hover shimmer */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 animate-shimmer"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(5,108,92,0.03), transparent)",
            backgroundSize: "200% 100%",
          }}
        />
      </div>
    </motion.div>
  );
}

export default function FeaturesSection() {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-40px" });

  return (
    <section id="features" className="relative py-28 sm:py-36 bg-parchment">
      {/* Subtle top gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal/15 to-transparent" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-[12px] font-semibold uppercase tracking-[0.2em] text-teal mb-4">
            Everything you need
          </span>
          <h2 className="font-headline text-[clamp(2rem,4vw,3rem)] font-semibold text-ink tracking-tight mb-4">
            One app, complete devotion
          </h2>
          <p className="text-[16px] text-slate-400 max-w-lg mx-auto leading-relaxed">
            Every tool a Muslim needs for their spiritual journey — thoughtfully
            designed and always at your fingertips.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
