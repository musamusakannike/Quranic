"use client";

import React, { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import {
  BookOpen,
  Clock,
  Settings,
  Moon,
  Sun,
  Play,
  Apple,
  Twitter,
  Github,
  Instagram,
} from "lucide-react";
import Link from "next/link";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

export default function Home() {
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary-500/30">
      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl shadow-sm border-b border-gray-200/50 dark:border-white/5 py-4"
            : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="bg-primary-50 dark:bg-primary-900/30 p-2.5 rounded-xl group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors">
              <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-primary-600 dark:text-primary-400" />
            </div>
            <span className="font-bold text-xl sm:text-2xl tracking-tight text-gray-900 dark:text-white">
              Quranic
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-medium">
            <a
              href="#features"
              className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm"
            >
              Features
            </a>
            <a
              href="#themes"
              className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm"
            >
              Themes
            </a>
            <a
              href="#about"
              className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm"
            >
              About
            </a>
          </div>
          <button className="btn btn-primary px-6 py-2.5 text-sm sm:text-base">
            Download Now
          </button>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 flex flex-col items-center text-center">
          {/* Subtle Background Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-primary-300/10 dark:bg-primary-900/10 blur-[120px] rounded-full -z-10 pointer-events-none"></div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl mx-auto z-10"
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-primary-200 dark:border-primary-900/50 bg-primary-50/50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium text-sm backdrop-blur-md shadow-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-primary-500 animate-pulse"></span>
              Discover a new way to interact with the Quran
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] text-gray-900 dark:text-white"
            >
              Connect with the <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-600 to-primary-400 dark:from-primary-400 dark:to-primary-200">
                Divine Words.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Read, reflect, and immerse yourself in the Holy Quran with a
              seamless, customizable, and deeply spiritual experience designed for modern life.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button className="w-full sm:w-auto flex items-center justify-center gap-3 bg-[#111827] hover:bg-[#1f2937] text-white px-8 py-3.5 rounded-2xl font-semibold transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5">
                <Apple size={28} />
                <div className="text-left leading-tight">
                  <div className="text-[11px] font-medium text-gray-300">
                    Download on the
                  </div>
                  <div className="text-lg">App Store</div>
                </div>
              </button>

              <button className="w-full sm:w-auto flex items-center justify-center gap-3 bg-primary-600 hover:bg-primary-500 text-white px-8 py-3.5 rounded-2xl font-semibold transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 shadow-primary-700/20">
                <Play size={24} />
                <div className="text-left leading-tight">
                  <div className="text-[11px] font-medium text-primary-100">
                    GET IT ON
                  </div>
                  <div className="text-lg">Google Play</div>
                </div>
              </button>
            </motion.div>
          </motion.div>

          {/* Floating Mockup / Art */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="mt-20 md:mt-24 relative w-full max-w-[320px] sm:max-w-md mx-auto aspect-1/2 sm:h-[650px] sm:aspect-auto z-10"
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="w-full h-full relative"
            >
              <div className="absolute inset-x-0 top-0 bottom-0 bg-white dark:bg-[#0b1612] rounded-[3rem] shadow-2xl border-10 border-gray-100 dark:border-[#13251e] overflow-hidden flex flex-col ring-1 ring-black/5 dark:ring-white/5">
                {/* Mock Header */}
                <div className="h-24 px-6 flex items-end justify-between pb-4 bg-linear-to-b from-primary-50/50 to-transparent dark:from-primary-900/10">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-sm"></div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">Al-Fatihah</div>
                    <div className="w-16 h-1.5 bg-primary-200 dark:bg-primary-800 rounded-full"></div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <Settings size={16} />
                  </div>
                </div>
                {/* Mock Content */}
                <div className="flex-1 px-8 py-6 flex flex-col items-center justify-center relative bg-white dark:bg-[#0b1612]">
                  <div className="w-full text-center space-y-12">
                    <h2
                      className="text-[2.75rem] md:text-[3.5rem] font-arabic text-gray-900 dark:text-gray-50 leading-relaxed drop-shadow-sm"
                      dir="rtl"
                    >
                      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                    </h2>
                    <div className="space-y-4 w-full opacity-60">
                      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full w-full"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full w-5/6 mx-auto"></div>
                    </div>
                  </div>
                </div>
                {/* Mock Nav */}
                <div className="h-20 border-t border-gray-100 dark:border-gray-800/50 flex items-center justify-around px-6 bg-white/80 dark:bg-[#0b1612]/80 backdrop-blur-md">
                  <div className="flex flex-col items-center gap-1 text-primary-600 dark:text-primary-400">
                    <BookOpen size={20} />
                    <div className="w-1 h-1 rounded-full bg-primary-500 mt-1"></div>
                  </div>
                  <div className="text-gray-400 dark:text-gray-600">
                    <Clock size={20} />
                  </div>
                  <div className="text-gray-400 dark:text-gray-600">
                    <Sun size={20} />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="py-32 px-6 bg-white dark:bg-background-dark relative"
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[24px_24px] mask-image-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
          <div className="max-w-7xl mx-auto relative z-10">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="text-center mb-20"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white tracking-tight">
                Elevate Your Spiritual Journey
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
                Thoughtfully designed features to integrate the Quran into your
                daily life perfectly, with elegance and simplicity.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid md:grid-cols-3 gap-8"
            >
              {[
                {
                  icon: <BookOpen size={24} />,
                  title: "Seamless Progress",
                  desc: "Never lose your place. Save your recitation exactly where you left off across all your devices seamlessly.",
                  color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/30",
                },
                {
                  icon: <Clock size={24} />,
                  title: "Daily Reminders",
                  desc: "Build consistent habits with tailored schedules and gentle notifications that align with your pace.",
                  color: "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 border-primary-100 dark:border-primary-900/30",
                },
                {
                  icon: <Settings size={24} />,
                  title: "Full Customization",
                  desc: "Personalize your experience with various stunning visual themes, multiple translations, and transliterations.",
                  color: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30",
                },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeInUp}
                  whileHover={{ y: -8 }}
                  className="bg-white dark:bg-[#0b1612] p-8 rounded-4xl shadow-sm hover:shadow-xl hover:shadow-primary-900/5 dark:hover:shadow-primary-900/20 border border-gray-100 dark:border-gray-800/50 transition-all duration-300 group"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 border transition-transform duration-300 group-hover:scale-110 ${feature.color}`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white tracking-tight">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Interactive Themes Section */}
        <section id="themes" className="py-32 px-6 md:px-12 relative overflow-hidden bg-gray-50/50 dark:bg-[#040a08]">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="max-w-7xl mx-auto text-center mb-20 relative z-10"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white tracking-tight">
              Experience the Divine, <br className="sm:hidden" /> Day or Night
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Our beautifully crafted reading environments adapt to your
              preferences to ensure a comfortable and serene experience at any
              hour.
            </p>
          </motion.div>

          <div
            className="max-w-5xl mx-auto rounded-[2.5rem] p-8 sm:p-12 md:p-16 overflow-hidden shadow-2xl transition-all duration-700 ease-in-out border relative z-10"
            style={{
              backgroundColor: themeMode === "light" ? "#ffffff" : "#07130f",
              borderColor: themeMode === "light" ? "#f3f4f6" : "#13251e",
            }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-16">
              <div className="flex-1 text-center md:text-left space-y-10">
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full mx-auto md:mx-0 transition-colors duration-500 border"
                  style={{
                    backgroundColor: themeMode === "light" ? "#f8fafc" : "#0b1d17",
                    borderColor: themeMode === "light" ? "#e2e8f0" : "#132a21"
                  }}
                >
                  {themeMode === "light" ? (
                    <Sun size={16} className="text-amber-500" />
                  ) : (
                    <Moon size={16} className="text-blue-400" />
                  )}
                  <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: themeMode === "light" ? "#64748b" : "#94a3b8" }}>
                    {themeMode === "light"
                      ? "Light Mode"
                      : "Dark Mode"}
                  </span>
                </div>

                <div className="space-y-6">
                  <h3
                    className="text-4xl md:text-5xl lg:text-6xl font-arabic leading-[1.8] drop-shadow-sm transition-colors duration-500"
                    style={{
                      color: themeMode === "light" ? "#0f172a" : "#f8fafc",
                    }}
                    dir="rtl"
                  >
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </h3>
                  <p className="text-lg md:text-xl font-medium transition-colors duration-500"
                    style={{
                      color: themeMode === "light" ? "#64748b" : "#94a3b8",
                    }}
                  >
                    In the name of Allah, the Entirely Merciful, the Especially
                    Merciful.
                  </p>
                </div>
              </div>

              <div className="w-full md:w-auto flex flex-col sm:flex-row md:flex-col gap-4">
                <button
                  onClick={() => setThemeMode("light")}
                  className={`group flex-1 md:w-64 px-6 py-4 rounded-2xl flex justify-between items-center transition-all duration-300 border ${
                    themeMode === "light"
                      ? "border-primary-200 bg-primary-50/50 shadow-lg shadow-primary-500/10 scale-105"
                      : "border-transparent bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10"
                  }`}
                >
                  <span className={`font-semibold transition-colors ${themeMode === "light" ? "text-primary-700" : "text-gray-600 dark:text-gray-400"}`}>Light Theme</span>
                  <Sun
                    size={20}
                    className={`transition-colors ${themeMode === "light" ? "text-amber-500" : "text-gray-400 group-hover:text-amber-500"}`}
                  />
                </button>
                <button
                  onClick={() => setThemeMode("dark")}
                  className={`group flex-1 md:w-64 px-6 py-4 rounded-2xl flex justify-between items-center transition-all duration-300 border ${
                    themeMode === "dark"
                      ? "border-primary-800 bg-[#0b1d17] shadow-lg shadow-black/50 scale-105"
                      : "border-transparent bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10"
                  }`}
                >
                  <span className={`font-semibold transition-colors ${themeMode === "dark" ? "text-primary-300" : "text-gray-600 dark:text-gray-400"}`}>Dark Theme</span>
                  <Moon
                    size={20}
                    className={`transition-colors ${themeMode === "dark" ? "text-blue-400" : "text-gray-400 group-hover:text-blue-400"}`}
                  />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="pt-24 pb-12 bg-gray-900 text-gray-300 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">
            <div className="md:col-span-5 lg:col-span-4 space-y-6">
              <div className="flex items-center gap-3 text-white">
                <div className="bg-primary-500/20 p-2 rounded-xl">
                  <BookOpen className="w-7 h-7 text-primary-400" />
                </div>
                <span className="font-bold text-2xl tracking-tight">
                  Quranic
                </span>
              </div>
              <p className="text-gray-400 leading-relaxed text-sm pr-4">
                Empowering Muslims around the world to read, reflect, and deeply
                connect with the words of Allah subhanahu wa ta&apos;ala anywhere,
                anytime.
              </p>
              <div className="flex gap-4 pt-2">
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-600 hover:text-white transition-all duration-300"
                  aria-label="Twitter"
                >
                  <Twitter size={18} />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-600 hover:text-white transition-all duration-300"
                  aria-label="Instagram"
                >
                  <Instagram size={18} />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-600 hover:text-white transition-all duration-300"
                  aria-label="GitHub"
                >
                  <Github size={18} />
                </a>
              </div>
            </div>

            <div className="md:col-span-3 lg:col-span-2 lg:col-start-7">
              <h4 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">Product</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li>
                  <a
                    href="#features"
                    className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#themes"
                    className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300"
                  >
                    Themes
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300">
                    Android App
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300">
                    iOS App
                  </a>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4 lg:col-span-2">
              <h4 className="text-white font-semibold mb-6 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li>
                  <a
                    href="#about"
                    className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <Link 
                    href="/privacy-policy" 
                    className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-300">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>
              © {new Date().getFullYear()} Quranic App. All rights reserved.
            </p>
            <p className="flex items-center gap-1.5 font-medium">
              Made with <span className="text-red-500 animate-pulse">❤️</span>{" "}
              for the Ummah
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
