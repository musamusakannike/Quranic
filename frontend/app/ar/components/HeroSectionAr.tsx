"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { FaApple, FaGooglePlay } from "react-icons/fa";

export default function HeroSectionAr() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-ink">
      {/* Background layers */}
      <div className="absolute inset-0">
        <div className="absolute top-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full bg-teal/8 blur-[120px] animate-pulse-glow" />
        <div
          className="absolute bottom-[-30%] left-[-15%] w-[600px] h-[600px] rounded-full bg-teal-vivid/6 blur-[100px]"
          style={{ animationDelay: "2s" }}
        />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full bg-gold/4 blur-[80px]" />

        {/* Grain texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Subtle geometric pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 w-full pt-28 pb-20 md:pt-32 md:pb-28">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-8 items-center">
          {/* Right: Copy (RTL — visually on the right, logically first in RTL flow) */}
          <div className="max-w-xl lg:order-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-wash border border-teal/20 mb-8"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal-glow animate-pulse" />
              <span className="text-[13px] font-arabic font-medium text-teal-glow tracking-wide">
                متاح على iOS و Android
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-arabic text-[clamp(2.4rem,5.5vw,4rem)] leading-[1.2] font-bold text-parchment mb-6"
            >
              اقرأ، تأمّل،
              <br />
              <span className="text-teal-vivid">وتواصل</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="text-[17px] leading-relaxed font-arabic text-slate-300 mb-10 max-w-md"
            >
              رفيقك الروحي، مُصمَّم بعناية واهتمام. انغمس في القرآن الكريم
              بخطوط أنيقة، وقرّاء عالميين، وأدوات تُعزّز ممارستك اليومية.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <a
                href="https://apps.apple.com/ng/app/quranic-read-listen/id6760474571"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 px-6 py-3.5 bg-parchment text-ink rounded-2xl hover:bg-parchment-warm transition-all duration-300 hover:shadow-xl hover:shadow-teal/8 hover:-translate-y-0.5 active:translate-y-0"
              >
                <FaApple className="text-[22px]" />
                <div className="text-left">
                  <p className="text-[10px] font-medium uppercase tracking-wider opacity-60 leading-tight">
                    Download on the
                  </p>
                  <p className="text-[15px] font-semibold leading-tight">
                    App Store
                  </p>
                </div>
              </a>

              <a
                href="https://play.google.com/store/apps/details?id=com.codiac.quranic"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 px-6 py-3.5 bg-surface-glass-strong text-parchment rounded-2xl border border-border-subtle hover:bg-surface-glass transition-all duration-300 hover:border-teal/30 hover:-translate-y-0.5 active:translate-y-0"
              >
                <FaGooglePlay className="text-[20px] text-teal-glow" />
                <div className="text-left">
                  <p className="text-[10px] font-medium uppercase tracking-wider opacity-50 leading-tight">
                    Get it on
                  </p>
                  <p className="text-[15px] font-semibold leading-tight">
                    Google Play
                  </p>
                </div>
              </a>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex gap-10 mt-14 pt-8 border-t border-border-subtle"
            >
              {[
                { value: "١١٤", label: "سورة" },
                { value: "٦٢٣٦", label: "آية" },
                { value: "مجاناً", label: "للأبد" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-arabic font-bold text-parchment">
                    {stat.value}
                  </p>
                  <p className="text-[13px] font-arabic text-slate-400 mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Left: Phone mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex justify-center lg:justify-start lg:order-1"
          >
            <div className="relative">
              {/* Glow behind phone */}
              <div className="absolute inset-0 -m-12 rounded-full bg-teal/15 blur-[80px]" />

              {/* Phone frame */}
              <div className="relative w-[280px] sm:w-[300px] animate-breathe">
                <div className="relative rounded-[40px] overflow-hidden shadow-2xl shadow-black/40 border border-white/10">
                  <Image
                    src="/images/mobile-homepage.PNG"
                    alt="شاشة تطبيق Quranic الرئيسية تعرض تقدم قراءة القرآن وأدوات الصوت والفصول والقبلة وأوقات الصلاة"
                    width={300}
                    height={650}
                    className="w-full h-auto"
                    priority
                  />
                </div>

                {/* Floating notch reflection */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-gradient-to-b from-white/5 to-transparent rounded-b-2xl" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-ink to-transparent" />
    </section>
  );
}
