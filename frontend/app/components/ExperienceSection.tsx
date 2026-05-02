"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";

const showcases = [
  {
    tag: "Pristine Reading",
    title: "Every verse, beautifully rendered",
    description:
      "Experience the Holy Quran with authentic Arabic typography, verse-by-verse navigation, and a reader that remembers exactly where you left off. Bookmark, copy, and share any ayah effortlessly.",
    image: "/images/mobile-chapter-details.PNG",
    alt: "Quranic chapter reading view showing Arabic verses with bookmark, copy, and share actions",
    align: "left" as const,
  },
  {
    tag: "Spiritual Tools",
    title: "Your daily companion",
    description:
      "From Qiblah direction to prayer times, Hijri calendar to daily Adhkaar — everything is integrated into one cohesive experience. Each tool is designed to feel natural and never get in the way.",
    image: "/images/mobile-homepage.PNG",
    alt: "Quranic home screen with quick actions grid for Audio, Chapters, Qiblah, and Solah",
    align: "right" as const,
  },
];

export default function ExperienceSection() {
  return (
    <section
      id="experience"
      className="relative py-28 sm:py-36 bg-ink overflow-hidden"
    >
      {/* Background accents */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal/15 to-transparent" />
      <div className="absolute top-[20%] right-[-5%] w-[500px] h-[500px] rounded-full bg-teal/5 blur-[100px]" />
      <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-gold/3 blur-[80px]" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {showcases.map((item, idx) => (
          <ShowcaseRow key={item.title} item={item} index={idx} />
        ))}
      </div>
    </section>
  );
}

function ShowcaseRow({
  item,
  index,
}: {
  item: (typeof showcases)[0];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const isLeft = item.align === "left";

  return (
    <div
      ref={ref}
      className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
        index > 0 ? "mt-28 sm:mt-36" : ""
      }`}
    >
      {/* Text */}
      <motion.div
        initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={isLeft ? "lg:order-1" : "lg:order-2"}
      >
        <span className="inline-block text-[12px] font-semibold uppercase tracking-[0.2em] text-teal-glow mb-4">
          {item.tag}
        </span>
        <h2 className="font-headline text-[clamp(1.8rem,3.5vw,2.5rem)] font-semibold text-parchment tracking-tight mb-5 leading-tight">
          {item.title}
        </h2>
        <p className="text-[16px] leading-relaxed text-slate-300 max-w-md">
          {item.description}
        </p>

        {/* Decorative bar */}
        <div className="mt-8 flex items-center gap-3">
          <div className="h-px w-12 bg-gradient-to-r from-teal to-transparent" />
          <span className="text-[12px] text-slate-500 uppercase tracking-widest">
            Designed with care
          </span>
        </div>
      </motion.div>

      {/* Phone */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.92 }}
        animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{
          duration: 0.9,
          delay: 0.15,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={`relative flex ${
          isLeft ? "lg:order-2 justify-center lg:justify-end" : "lg:order-1 justify-center lg:justify-start"
        }`}
      >
        <div className="relative">
          <div className="absolute inset-0 -m-10 rounded-full bg-teal/10 blur-[60px]" />
          <div className="relative w-[260px] sm:w-[280px] rounded-[36px] overflow-hidden shadow-2xl shadow-black/40 border border-white/8">
            <Image
              src={item.image}
              alt={item.alt}
              width={280}
              height={600}
              className="w-full h-auto"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
