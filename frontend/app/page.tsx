"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, Variants, useSpring, useInView } from "framer-motion";

/* ─────────────── Animation Variants ─────────────── */
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

/* ─────────────── Animated Counter ─────────────── */
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ─────────────── Marquee Testimonial Strip ─────────────── */
const testimonials = [
  { name: "Yusuf Ahmed", location: "London, UK", initials: "YA", tone: "primary", quote: "The most beautiful Quran app I've ever used. The typography alone is breathtaking." },
  { name: "Sara Malik", location: "Dubai, UAE", initials: "SM", tone: "secondary", quote: "Quranic has completely transformed my daily routine. SubhanAllah, the design is incredible." },
  { name: "Ibrahim Khan", location: "Toronto, CA", initials: "IK", tone: "tertiary", quote: "Finally an Islamic app that isn't cluttered with ads or poor design. Editorial quality." },
  { name: "Amina Hassan", location: "Cairo, EG", initials: "AH", tone: "primary", quote: "The Adhkar reminders are so gentle and timely. It has become a core part of my day." },
  { name: "Omar Faruk", location: "Kuala Lumpur, MY", initials: "OF", tone: "secondary", quote: "Word-by-word translation changed how I connect with the Quran. Absolutely magnificent." },
  { name: "Fatima Al-Zahra", location: "Jakarta, ID", initials: "FZ", tone: "tertiary", quote: "The prayer times are always accurate and the Adhan sound is mesmerising. 5 stars." },
];

const toneClasses: Record<string, string> = {
  primary: "bg-primary-container text-on-primary-container",
  secondary: "bg-secondary-container text-on-secondary-container",
  tertiary: "bg-tertiary-container text-on-tertiary-container",
};

function TestimonialCard({ t }: { t: typeof testimonials[0] }) {
  return (
    <div className="flex-shrink-0 w-80 bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-6 mx-3 shadow-sm">
      <div className="flex gap-0.5 text-tertiary mb-4">
        {[1, 2, 3, 4, 5].map((s) => (
          <span key={s} className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
        ))}
      </div>
      <p className="text-on-surface-variant text-sm italic leading-relaxed mb-5">"{t.quote}"</p>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${toneClasses[t.tone]}`}>
          {t.initials}
        </div>
        <div>
          <p className="text-sm font-bold text-on-surface">{t.name}</p>
          <p className="text-xs text-on-surface-variant uppercase tracking-widest">{t.location}</p>
        </div>
      </div>
    </div>
  );
}

function MarqueeTrack({ reverse = false }: { reverse?: boolean }) {
  const items = [...testimonials, ...testimonials]; // duplicate for seamlessness
  return (
    <div className="overflow-hidden w-full">
      <motion.div
        className="flex"
        animate={{ x: reverse ? ["0%", "50%"] : ["0%", "-50%"] }}
        transition={{ duration: 40, ease: "linear", repeat: Infinity }}
      >
        {items.map((t, i) => <TestimonialCard key={i} t={t} />)}
      </motion.div>
    </div>
  );
}

/* ─────────────── Features ─────────────── */
const deepDiveFeatures = [
  { icon: "history_edu", title: "Journal Your Reflections", desc: "Personalize your journey by adding notes and reflections to any Ayah. Your spiritual growth, documented and cherished." },
  { icon: "podcasts", title: "Guided Podcasts & Tafsir", desc: "Listen to exclusive tafsir and spiritual discussions from leading scholars while you commute or rest." },
  { icon: "calendar_month", title: "Hijri Calendar", desc: "Never miss an important Islamic date. Integrated Hijri dates with events, fasting reminders and moon phases." },
];

/* ─────────────── Main Component ─────────────── */
export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-surface font-body text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed overflow-x-hidden">

      {/* ── Navigation ── */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? "bg-surface/75 backdrop-blur-2xl shadow-sm border-b border-outline-variant/10 py-3" : "bg-transparent py-5"}`}>
        <nav className="flex justify-between items-center px-6 md:px-10 max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
            </div>
            <span className="text-xl font-headline italic text-primary font-semibold tracking-tight">Quranic</span>
          </div>
          {/* Links */}
          <div className="hidden md:flex items-center gap-8">
            {["Features", "About", "Download", "Help"].map((link, i) => (
              <a
                key={link}
                href="#"
                className={`text-sm font-medium transition-all duration-300 ${i === 0 ? "text-primary" : "text-on-surface/70 hover:text-primary"}`}
              >
                {link}
              </a>
            ))}
          </div>
          {/* CTA */}
          <div className="flex items-center gap-3">
            <button className="hidden md:inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all duration-200 shadow-md shadow-primary/20">
              <span className="material-symbols-outlined text-base">download</span>
              Get the App
            </button>
            <button className="md:hidden text-primary p-1">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </nav>
      </header>

      <main>
        {/* ── Hero ── */}
        <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden hero-pattern">
          {/* Background glow orbs */}
          <motion.div style={{ y: heroY }} className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px]" />
            <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-tertiary-fixed/20 rounded-full blur-[80px]" />
          </motion.div>

          {/* Floating Arabic Calligraphy watermark */}
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 2 }}
            className="absolute right-0 top-0 bottom-0 flex items-center justify-end overflow-hidden pointer-events-none"
          >
            <p
              className="font-arabic text-[22vw] text-primary/[0.03] leading-none select-none pr-12 hidden md:block"
              style={{ lineHeight: 1 }}
            >
              بِسْمِ اللَّهِ
            </p>
          </motion.div>

          <motion.div style={{ opacity: heroOpacity }} className="max-w-7xl mx-auto px-6 md:px-10 w-full grid md:grid-cols-12 gap-12 items-center pt-32 pb-20">
            {/* Left: Copy */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="md:col-span-6 lg:col-span-7 z-10"
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-primary text-xs font-bold tracking-widest uppercase">Experience Divine Guidance</span>
              </motion.div>

              <motion.h1 variants={fadeInUp} className="font-headline text-[clamp(3rem,7vw,6rem)] text-on-surface font-semibold leading-[1.05] mb-6 tracking-tight">
                Your{" "}
                <span className="relative inline-block">
                  <span className="text-primary italic">Spiritual</span>
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.9, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute bottom-1 left-0 right-0 h-[3px] bg-primary/30 origin-left rounded-full"
                  />
                </span>
                {" "}Journey,{" "}
                <span className="text-primary italic">Reimagined.</span>
              </motion.h1>

              <motion.p variants={fadeInUp} className="text-on-surface-variant text-lg md:text-xl max-w-lg mb-10 leading-relaxed">
                Recite, listen, and grow your Iman with the ultimate Islamic companion. Beautifully crafted for the modern Muslim.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
                <button className="group inline-flex items-center justify-center gap-3 bg-primary text-on-primary px-8 py-4 rounded-full font-semibold text-base shadow-xl shadow-primary/25 hover:bg-primary/90 hover:shadow-primary/40 hover:-translate-y-0.5 active:scale-95 transition-all duration-300">
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>download</span>
                  Download for Free
                  <span className="material-symbols-outlined text-base opacity-60 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
                <button className="inline-flex items-center justify-center gap-2 border border-outline-variant text-on-surface px-8 py-4 rounded-full font-semibold text-base hover:bg-surface-container-low hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300">
                  <span className="material-symbols-outlined text-base">play_circle</span>
                  Watch Demo
                </button>
              </motion.div>

              {/* Social proof sub-text */}
              <motion.div variants={fadeInUp} className="mt-10 flex items-center gap-6">
                <div className="flex -space-x-3">
                  {["YA", "SM", "IK", "AH"].map((initials, i) => (
                    <div key={i} className={`w-9 h-9 rounded-full border-2 border-surface flex items-center justify-center text-xs font-bold ${["bg-primary-container text-on-primary-container", "bg-secondary-container text-on-secondary-container", "bg-tertiary-container text-on-tertiary-container", "bg-surface-container-high text-on-surface"][i]}`}>
                      {initials}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5 text-tertiary">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    ))}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">Loved by <span className="font-bold text-on-surface">1M+ Muslims</span> worldwide</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right: Phone Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="md:col-span-6 lg:col-span-5 relative flex justify-center"
            >
              {/* Glow behind phone */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/20 rounded-full blur-[80px]" />

              {/* Floating badge - top left */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="absolute -left-6 top-16 z-20 bg-surface-container-lowest p-3 rounded-2xl shadow-xl border border-outline-variant/10 hidden md:flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface">Fajr</p>
                  <p className="text-lg font-headline font-bold text-primary leading-none">5:24 AM</p>
                </div>
              </motion.div>

              {/* Phone */}
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 w-full max-w-[300px]"
              >
                <img
                  alt="Quranic Mobile App Interface"
                  className="rounded-[2.75rem] shadow-2xl border-[6px] border-white ring-1 ring-black/5 w-full"
                  src="/images/mobile-homepage.PNG"
                />
              </motion.div>

              {/* Floating badge - bottom right */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.4, duration: 0.5 }}
                className="absolute -bottom-4 -right-4 md:-right-10 z-20 bg-surface-container-lowest p-4 rounded-2xl shadow-2xl border border-outline-variant/10 max-w-[190px]"
              >
                <div className="flex gap-0.5 text-tertiary mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  ))}
                </div>
                <p className="text-xs font-medium text-on-surface leading-snug">"The most beautiful Quran app I've ever used."</p>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-on-surface/40"
          >
            <p className="text-xs uppercase tracking-[0.2em]">Scroll</p>
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <span className="material-symbols-outlined text-lg">keyboard_arrow_down</span>
            </motion.div>
          </motion.div>
        </section>

        {/* ── Stats Strip ── */}
        <section className="bg-primary py-12">
          <div className="max-w-5xl mx-auto px-6 md:px-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
            >
              {[
                { value: 1000000, suffix: "+", label: "Active Users" },
                { value: 114, suffix: "", label: "Quran Surahs" },
                { value: 40, suffix: "+", label: "Reciters" },
                { value: 99, suffix: "%", label: "User Satisfaction" },
              ].map((stat, i) => (
                <motion.div key={i} variants={fadeInUp}>
                  <p className="font-headline text-4xl md:text-5xl text-on-primary font-bold">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-on-primary/70 text-sm mt-1 uppercase tracking-wider">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Features Bento Grid ── */}
        <section className="py-28 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-6 md:px-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="mb-16 max-w-2xl"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Features</span>
              <h2 className="font-headline text-4xl md:text-5xl lg:text-6xl text-on-surface mb-5 leading-tight">
                A Sanctuary in <span className="italic text-primary">Your Pocket.</span>
              </h2>
              <p className="text-on-surface-variant text-lg leading-relaxed">
                Everything you need to maintain your daily spiritual habits, designed with intentionality and grace.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 md:h-[640px]">
              {/* Main — Quran */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="md:col-span-2 md:row-span-2 bg-surface-container-lowest rounded-3xl border border-outline-variant/10 flex flex-col overflow-hidden group hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 cursor-default"
              >
                <div className="p-8 flex-1">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/15 transition-colors">
                    <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
                  </div>
                  <h3 className="font-headline text-3xl text-on-surface mb-3 leading-tight">Divine Recitation</h3>
                  <p className="text-on-surface-variant text-base leading-relaxed">
                    Experience the Quran with word-by-word translations, transliteration, and crystal clear tajweed rules beautifully rendered.
                  </p>
                </div>
                <div className="mx-4 mb-4 rounded-2xl overflow-hidden flex-shrink-0 h-52 border border-outline-variant/10">
                  <img
                    alt="Quran App Interface"
                    className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-700"
                    src="/images/mobile-chapter-details.PNG"
                  />
                </div>
              </motion.div>

              {/* Audio */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05, duration: 0.6 }}
                className="bg-primary rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group cursor-default"
              >
                <div className="absolute inset-0 bg-[url('/images/ayah-of-the-day.webp')] bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-gradient-to-b from-primary/30 to-primary/80" />
                <div className="z-10 relative">
                  <div className="w-10 h-10 bg-on-primary/15 rounded-xl flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>headphones</span>
                  </div>
                  <h3 className="font-headline text-xl text-on-primary font-semibold mb-2">Immersive Audio</h3>
                  <p className="text-on-primary/75 text-sm leading-relaxed">Listen to world-renowned reciters in high fidelity.</p>
                </div>
              </motion.div>

              {/* Prayer Times */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="bg-surface-container-highest rounded-3xl p-8 flex flex-col justify-between border border-outline-variant/15 relative overflow-hidden group cursor-default"
              >
                <div className="absolute inset-0 bg-[url('/images/masjid-nabawi.webp')] bg-cover bg-center opacity-20 group-hover:opacity-35 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-highest/90 to-surface-container-highest/40" />
                <div className="z-10 relative">
                  <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
                  </div>
                  <h3 className="font-headline text-xl text-on-surface font-semibold mb-2">Prayer Times</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">Accurate local timings with beautiful Adhan notifications.</p>
                </div>
              </motion.div>

              {/* Qiblah */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15, duration: 0.6 }}
                className="bg-surface-container-lowest rounded-3xl p-8 flex flex-col justify-between border border-outline-variant/10 relative overflow-hidden group cursor-default hover:border-tertiary/20 transition-all"
              >
                <div className="w-10 h-10 bg-tertiary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-tertiary/15 transition-colors">
                  <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
                </div>
                <div>
                  <h3 className="font-headline text-xl mb-2">Qiblah Finder</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">Precision compass to guide your devotion anywhere on earth.</p>
                </div>
              </motion.div>

              {/* Adhkar */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="bg-secondary-container rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group cursor-default"
              >
                <div className="absolute inset-0 bg-[url('/images/solah-sajda.webp')] bg-cover bg-center opacity-25 group-hover:opacity-40 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary-container/95 to-secondary-container/50" />
                <div className="z-10 relative">
                  <div className="w-10 h-10 bg-on-secondary-container/10 rounded-xl flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  </div>
                  <h3 className="font-headline text-xl text-on-secondary-container font-semibold mb-2">Hisnul Muslim</h3>
                  <p className="text-on-secondary-container/75 text-sm leading-relaxed">A complete library of daily Adhkar and Duas.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Feature Deep Dive ── */}
        <section className="py-28 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 md:px-10">
            <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-center">
              {/* Image side */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInLeft}
                className="relative"
              >
                <div className="relative rounded-3xl overflow-hidden aspect-[4/5] shadow-2xl">
                  <img alt="Masjid Nabawi" className="w-full h-full object-cover" src="/images/masjid-nabawi.webp" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>

                {/* Floating progress card */}
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="absolute -bottom-6 -right-4 md:-right-12 bg-surface-container-lowest p-5 rounded-2xl shadow-2xl border border-outline-variant/10 w-52"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-tight text-primary">Daily Progress</span>
                    <span className="text-xs font-bold text-on-surface">75%</span>
                  </div>
                  <div className="h-2 w-full bg-outline-variant/20 rounded-full overflow-hidden mb-3">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "75%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full bg-gradient-to-r from-primary to-primary-fixed-dim rounded-full"
                    />
                  </div>
                  <p className="text-on-surface font-bold">12 Ayahs Today</p>
                  <p className="text-on-surface-variant text-xs mt-0.5">Keep it up, MashAllah! 🌙</p>
                </motion.div>

                {/* Floating stat top-left */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="absolute -top-6 -left-4 md:-left-10 bg-surface-container-lowest p-4 rounded-2xl shadow-xl border border-outline-variant/10"
                >
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Streak</p>
                  <p className="font-headline text-3xl text-primary font-bold">21 🔥</p>
                  <p className="text-xs text-on-surface-variant">Days in a row</p>
                </motion.div>
              </motion.div>

              {/* Copy side */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                <motion.span variants={fadeInUp} className="text-xs font-bold uppercase tracking-widest text-primary mb-4 block">Beyond Recitation</motion.span>
                <motion.h2 variants={fadeInUp} className="font-headline text-4xl md:text-5xl lg:text-6xl text-on-surface leading-tight mb-6">
                  Nurture Your Soul with <span className="italic text-primary">Gentle Persistence.</span>
                </motion.h2>
                <motion.p variants={fadeInUp} className="text-on-surface-variant text-lg leading-relaxed mb-12">
                  Quranic isn't just an app — it's a companion for your spiritual life. Every feature is designed to help you build habits that last.
                </motion.p>

                <div className="space-y-8">
                  {deepDiveFeatures.map((item, idx) => (
                    <motion.div key={idx} variants={fadeInUp} className="flex gap-5 group">
                      <div className="shrink-0 w-12 h-12 bg-primary/8 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary/15 transition-colors duration-300 border border-primary/10">
                        <span className="material-symbols-outlined text-xl">{item.icon}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-1.5 text-on-surface">{item.title}</h3>
                        <p className="text-on-surface-variant leading-relaxed text-sm">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── App Showcase / Dark Band ── */}
        <section className="py-28 bg-inverse-surface overflow-hidden relative">
          {/* Subtle noise / pattern */}
          <div className="absolute inset-0 opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/moroccan-flower.png')]" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[120px] opacity-40" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-[100px] opacity-40" />

          <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center mb-20"
            >
              <h2 className="font-headline text-5xl md:text-7xl text-inverse-on-surface mb-6 leading-tight">
                Designed for <span className="italic text-primary-fixed-dim">Focus.</span>
              </h2>
              <p className="text-inverse-on-surface/60 max-w-2xl mx-auto text-lg leading-relaxed">
                We removed the noise so you can focus on what matters most. A clean, distraction-free environment for your daily devotions.
              </p>
            </motion.div>

            <div className="relative flex justify-center items-end gap-4 md:gap-8 h-[480px] md:h-[600px]">
              {/* Left phone */}
              <motion.div
                initial={{ opacity: 0, y: 80, rotate: 0 }}
                whileInView={{ opacity: 0.6, y: 0, rotate: -10 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="hidden md:block w-[220px] self-end mb-8"
              >
                <img alt="App Homepage" className="rounded-[2rem] shadow-2xl border-4 border-white/10 w-full" src="/images/mobile-homepage.PNG" />
              </motion.div>

              {/* Center phone (hero) */}
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="w-[280px] md:w-[320px] z-20 self-end"
              >
                <img alt="App Chapter Details" className="rounded-[2.5rem] shadow-[0_50px_120px_rgba(0,0,0,0.6)] ring-8 ring-primary/20 w-full" src="/images/mobile-chapter-details.PNG" />
              </motion.div>

              {/* Right phone */}
              <motion.div
                initial={{ opacity: 0, y: 80, rotate: 0 }}
                whileInView={{ opacity: 0.6, y: 0, rotate: 10 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="hidden md:block w-[220px] self-end mb-8"
              >
                <img alt="App Homepage" className="rounded-[2rem] shadow-2xl border-4 border-white/10 w-full" src="/images/mobile-homepage.PNG" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Testimonials Marquee ── */}
        <section className="py-24 bg-surface overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 md:px-10 mb-12">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center"
            >
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Community</span>
              <h2 className="font-headline text-4xl md:text-5xl text-on-surface">Loved by the <span className="italic text-primary">Ummah.</span></h2>
            </motion.div>
          </div>
          <div className="space-y-4">
            <MarqueeTrack />
            <MarqueeTrack reverse />
          </div>
        </section>

        {/* ── Download CTA ── */}
        <section className="py-24 overflow-hidden">
          <div className="max-w-5xl mx-auto px-6 md:px-10">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-[2.5rem] p-12 md:p-20 text-center"
              style={{
                background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-container) 60%, var(--color-secondary) 100%)",
              }}
            >
              {/* Background patterns */}
              <div className="absolute inset-0 opacity-[0.06] bg-[url('https://www.transparenttextures.com/patterns/islamic-art.png')]" />
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-[60px]" />
              <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-white/10 rounded-full blur-[60px]" />

              {/* Arabic text watermark */}
              <p className="absolute top-4 md:top-8 left-1/2 -translate-x-1/2 font-arabic text-4xl md:text-5xl text-white/10 select-none whitespace-nowrap">
                بسم الله الرحمن الرحيم
              </p>

              <div className="relative z-10">
                <motion.h2
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeInUp}
                  className="font-headline text-5xl md:text-6xl text-on-primary mb-6 leading-tight"
                >
                  Begin Your Path <br />
                  <span className="italic">Towards Presence.</span>
                </motion.h2>
                <motion.p
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeInUp}
                  className="text-on-primary/80 text-xl mb-12 max-w-xl mx-auto leading-relaxed"
                >
                  Join over 1 million users worldwide who have elevated their spiritual practice with Quranic. Free forever.
                </motion.p>

                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={staggerContainer}
                  className="flex flex-col sm:flex-row justify-center gap-4"
                >
                  <motion.a
                    variants={fadeInUp}
                    href="#"
                    className="bg-on-surface text-surface flex items-center justify-center gap-3 px-8 py-4 rounded-xl hover:bg-on-surface/90 hover:-translate-y-0.5 transition-all duration-300 shadow-xl"
                  >
                    <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>phone_iphone</span>
                    <div className="text-left">
                      <p className="text-[10px] uppercase font-bold opacity-60 tracking-wider">Download on the</p>
                      <p className="text-lg font-bold leading-none">App Store</p>
                    </div>
                  </motion.a>
                  <motion.a
                    variants={fadeInUp}
                    href="#"
                    className="bg-on-surface text-surface flex items-center justify-center gap-3 px-8 py-4 rounded-xl hover:bg-on-surface/90 hover:-translate-y-0.5 transition-all duration-300 shadow-xl"
                  >
                    <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_store_installed</span>
                    <div className="text-left">
                      <p className="text-[10px] uppercase font-bold opacity-60 tracking-wider">Get it on</p>
                      <p className="text-lg font-bold leading-none">Google Play</p>
                    </div>
                  </motion.a>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full border-t border-outline-variant/10 bg-surface py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
                </div>
                <span className="text-xl font-headline italic text-primary font-semibold">Quranic</span>
              </div>
              <p className="text-on-surface-variant text-sm leading-relaxed max-w-xs">
                A beautiful Islamic companion app for the modern Muslim. Recite, listen, reflect.
              </p>
            </div>
            {/* Links */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface mb-4">Product</p>
              <div className="space-y-3">
                {["Features", "Download", "Changelog"].map((link) => (
                  <a key={link} href="#" className="block text-sm text-on-surface-variant hover:text-primary transition-colors">{link}</a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface mb-4">Legal</p>
              <div className="space-y-3">
                {["Privacy Policy", "Terms of Service", "Support", "Contact"].map((link) => (
                  <a key={link} href="#" className="block text-sm text-on-surface-variant hover:text-primary transition-colors">{link}</a>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-on-surface-variant">© 2025 Quranic. The Sacred Breath.</p>
            <p className="text-xs text-on-surface-variant/60 font-arabic">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
