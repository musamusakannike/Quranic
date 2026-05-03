"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FaApple, FaGooglePlay } from "react-icons/fa";

export default function CTASectionAr() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="relative py-28 sm:py-36 bg-ink overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal/15 to-transparent" />

      {/* Background orbs */}
      <div className="absolute top-[30%] left-[20%] w-[300px] h-[300px] rounded-full bg-teal/8 blur-[80px]" />
      <div className="absolute bottom-[20%] right-[15%] w-[250px] h-[250px] rounded-full bg-gold/5 blur-[70px]" />

      <div
        ref={ref}
        className="relative z-10 mx-auto max-w-3xl px-5 sm:px-8 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <p className="font-arabic text-3xl sm:text-4xl text-teal-vivid/60 mb-6 leading-relaxed">
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </p>

          <h2 className="font-arabic text-[clamp(2rem,4.5vw,3.2rem)] font-bold text-parchment mb-5 leading-tight">
            ابدأ رحلتك اليوم
          </h2>

          <p className="text-[16px] leading-relaxed font-arabic text-slate-300 max-w-lg mx-auto mb-10">
            حمّل تطبيق Quranic مجاناً واكتشف رفيقاً روحياً مُصمَّماً بجمال
            وهدف واهتمام. متاح على iOS و Android.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://apps.apple.com/ng/app/quranic-read-listen/id6760474571"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-7 py-4 bg-parchment text-ink rounded-2xl hover:bg-parchment-warm transition-all duration-300 hover:shadow-xl hover:shadow-teal/8 hover:-translate-y-0.5 active:translate-y-0"
            >
              <FaApple className="text-[24px]" />
              <div className="text-left">
                <p className="text-[10px] font-medium uppercase tracking-wider opacity-60 leading-tight">
                  Download on the
                </p>
                <p className="text-[16px] font-semibold leading-tight">
                  App Store
                </p>
              </div>
            </a>

            <a
              href="https://play.google.com/store/apps/details?id=com.codiac.quranic"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-7 py-4 bg-surface-glass-strong text-parchment rounded-2xl border border-border-subtle hover:bg-surface-glass transition-all duration-300 hover:border-teal/30 hover:-translate-y-0.5 active:translate-y-0"
            >
              <FaGooglePlay className="text-[22px] text-teal-glow" />
              <div className="text-left">
                <p className="text-[10px] font-medium uppercase tracking-wider opacity-50 leading-tight">
                  Get it on
                </p>
                <p className="text-[16px] font-semibold leading-tight">
                  Google Play
                </p>
              </div>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
