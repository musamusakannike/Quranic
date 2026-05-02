"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const testimonials = [
  {
    name: "Amina K.",
    location: "Lagos, Nigeria",
    text: "I've tried many Quran apps, but Quranic is the one that finally stuck. The design is beautiful and the reading experience feels so natural.",
    rating: 5,
  },
  {
    name: "Yusuf A.",
    location: "London, UK",
    text: "The Hifz memorization tools are exactly what I needed. Being able to track my progress and set revision schedules has been a game-changer.",
    rating: 5,
  },
  {
    name: "Fatima M.",
    location: "Dubai, UAE",
    text: "Everything I need in one place — prayer times, Qiblah, Adhkaar, and the Quran itself. Beautifully designed and completely free. Jazakallahu khairan!",
    rating: 5,
  },
  {
    name: "Ibrahim S.",
    location: "Toronto, Canada",
    text: "The audio recitation feature with the mini player is wonderful. I listen during my commute and it's become an essential part of my daily routine.",
    rating: 5,
  },
];

export default function TestimonialsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [current, setCurrent] = useState(0);

  const prev = () =>
    setCurrent((c) => (c === 0 ? testimonials.length - 1 : c - 1));
  const next = () =>
    setCurrent((c) => (c === testimonials.length - 1 ? 0 : c + 1));

  return (
    <section
      id="testimonials"
      className="relative py-28 sm:py-36 bg-parchment overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal/15 to-transparent" />

      <div ref={ref} className="mx-auto max-w-4xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-[12px] font-semibold uppercase tracking-[0.2em] text-teal mb-4">
            Community voices
          </span>
          <h2 className="font-headline text-[clamp(2rem,4vw,3rem)] font-semibold text-ink tracking-tight">
            Loved by Muslims worldwide
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="relative"
        >
          <div className="relative bg-surface rounded-3xl border border-slate-100 p-8 sm:p-12 min-h-[260px] flex flex-col items-center justify-center overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-6 left-8 text-[120px] leading-none font-headline text-teal/5 select-none pointer-events-none">
              &ldquo;
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="text-center relative z-10"
              >
                {/* Stars */}
                <div className="flex justify-center gap-1 mb-6">
                  {Array.from({ length: testimonials[current].rating }).map(
                    (_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className="fill-gold text-gold"
                      />
                    )
                  )}
                </div>

                <p className="text-[17px] sm:text-[19px] leading-relaxed text-slate-600 font-headline italic max-w-2xl mx-auto mb-8">
                  &ldquo;{testimonials[current].text}&rdquo;
                </p>

                <p className="text-[15px] font-semibold text-ink">
                  {testimonials[current].name}
                </p>
                <p className="text-[13px] text-slate-400 mt-1">
                  {testimonials[current].location}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-xl bg-surface border border-slate-100 flex items-center justify-center text-slate-400 hover:text-teal hover:border-teal/20 transition-all duration-200 active:scale-95"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === current
                      ? "w-6 bg-teal"
                      : "w-1.5 bg-slate-200 hover:bg-slate-300"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="w-10 h-10 rounded-xl bg-surface border border-slate-100 flex items-center justify-center text-slate-400 hover:text-teal hover:border-teal/20 transition-all duration-200 active:scale-95"
              aria-label="Next testimonial"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
