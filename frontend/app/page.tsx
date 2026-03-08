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
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary-light/30">
      {/* Settings Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-background/80 backdrop-blur-lg shadow-sm border-b border-gray-200 dark:border-gray-800 py-4"
            : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <span className="font-bold text-xl sm:text-2xl tracking-tight text-primary-dark dark:text-primary-light">
              Quranic
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-medium">
            <a
              href="#features"
              className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light transition-colors"
            >
              Features
            </a>
            <a
              href="#themes"
              className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light transition-colors"
            >
              Themes
            </a>
            <a
              href="#about"
              className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light transition-colors"
            >
              About
            </a>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-primary hover:bg-primary-light text-white px-5 py-2 sm:px-6 sm:py-2.5 rounded-full font-medium transition-colors shadow-lg shadow-primary/30 text-sm sm:text-base"
          >
            Download Now
          </motion.button>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-40 pb-20 md:pt-48 md:pb-32 px-6 flex flex-col items-center text-center">
          {/* Subtle Background Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[500px] bg-primary/20 bg-opacity-40 blur-[120px] rounded-full -z-10 pointer-events-none"></div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl mx-auto z-10"
          >
            <motion.div
              variants={fadeInUp}
              className="inline-block mb-6 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary dark:text-primary-light font-medium text-sm backdrop-blur-sm"
            >
              ✨ Discover a new way to interact with the Quran
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight text-gray-900 dark:text-white"
            >
              Connect with the <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light">
                Divine Words.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-2xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto"
            >
              Read, reflect, and immerse yourself in the Holy Quran with a
              seamless, customizable, and deeply spiritual experience.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "#111827" }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-black text-white px-8 py-4 rounded-2xl font-semibold transition-all shadow-xl hover:shadow-2xl"
              >
                <Apple size={24} />
                <div className="text-left leading-tight">
                  <div className="text-[10px] font-normal opacity-80">
                    Download on the
                  </div>
                  <div className="text-base sm:text-lg">App Store</div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "#014c41" }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-primary text-white px-8 py-4 rounded-2xl font-semibold transition-all shadow-xl hover:shadow-2xl"
              >
                <Play size={24} />
                <div className="text-left leading-tight">
                  <div className="text-[10px] font-normal opacity-80">
                    GET IT ON
                  </div>
                  <div className="text-base sm:text-lg">Google Play</div>
                </div>
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Floating Mockup / Art */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="mt-20 relative w-full max-w-lg mx-auto aspect-[1/2] sm:aspect-auto sm:h-[600px] z-10"
          >
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="w-full h-full relative"
            >
              {/* Abstract App Mockup instead of static image to feel modern */}
              <div className="absolute inset-x-8 sm:inset-x-12 top-0 bottom-12 bg-white dark:bg-[#0d1614] rounded-[48px] shadow-2xl border-8 border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
                {/* Mock Header */}
                <div className="h-20 border-b border-gray-100 dark:border-gray-800 flex items-center justify-center pt-4">
                  <div className="w-1/3 h-6 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
                </div>
                {/* Mock Content */}
                <div className="flex-1 p-8 flex flex-col items-center justify-center relative">
                  <div className="absolute top-4 right-4 text-xs font-arabic text-primary opacity-50">
                    Surah Al-Fatihah
                  </div>
                  <h2
                    className="text-4xl md:text-5xl font-arabic text-gray-800 dark:text-gray-100 leading-loose"
                    dir="rtl"
                  >
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </h2>
                  <div className="mt-8 space-y-4 w-full">
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full w-full"></div>
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full w-5/6"></div>
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full w-4/6"></div>
                  </div>
                </div>
                {/* Mock Nav */}
                <div className="h-16 border-t border-gray-100 dark:border-gray-800 flex items-center justify-around px-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center p-1">
                    <BookOpen className="text-primary" />
                  </div>
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="py-24 px-6 bg-gray-50 dark:bg-[#08120e]"
        >
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Elevate Your Spiritual Journey
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Thoughtfully designed features to integrate the Quran into your
                daily life perfectly.
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
                  icon: <BookOpen size={30} />,
                  title: "Seamless Progress",
                  desc: "Never lose your place. Save your recitation exactly where you left off across all your devices seamlessly.",
                  color:
                    "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
                },
                {
                  icon: <Clock size={30} />,
                  title: "Daily Reminders",
                  desc: "Build consistent habits with tailored schedules and gentle notifications that align with your pace.",
                  color:
                    "bg-primary/20 text-primary dark:bg-primary/20 dark:text-primary-light",
                },
                {
                  icon: <Settings size={30} />,
                  title: "Full Customization",
                  desc: "Personalize your experience with various stunning visual themes, multiple translations, and transliterations.",
                  color:
                    "bg-accent/20 text-yellow-700 dark:bg-accent/20 dark:text-accent",
                },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeInUp}
                  whileHover={{ y: -8 }}
                  className="bg-white dark:bg-[#0B1914] p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-xl hover:shadow-primary/5"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ring-4 ring-white dark:ring-[#0B1914] ${feature.color}`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Interactive Themes Section */}
        <section id="themes" className="py-24 px-6 md:px-12 relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="max-w-7xl mx-auto text-center mb-16 relative z-10"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Experience the Divine, <br className="sm:hidden" /> Day or Night
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Our beautifully crafted reading environments adapt to your
              preferences to ensure a comfortable and serene experience at any
              hour.
            </p>
          </motion.div>

          <div
            className="max-w-5xl mx-auto rounded-[3rem] p-4 sm:p-8 md:p-12 overflow-hidden shadow-2xl transition-all duration-700 ease-in-out border border-gray-200 dark:border-gray-800 relative z-10"
            style={{
              backgroundColor: themeMode === "light" ? "#F9FAFB" : "#0B1914",
              color: themeMode === "light" ? "#111827" : "#F9FAFB",
            }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="flex-1 text-center md:text-left space-y-8">
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full mx-auto md:mx-0 transition-colors duration-500"
                  style={{
                    backgroundColor:
                      themeMode === "light" ? "#E5E7EB" : "#1A2E26",
                  }}
                >
                  {themeMode === "light" ? (
                    <Sun size={16} className="text-amber-500" />
                  ) : (
                    <Moon size={16} className="text-blue-300" />
                  )}
                  <span className="text-sm font-semibold tracking-wide">
                    {themeMode === "light"
                      ? "LIGHT MODE ACTIVE"
                      : "DARK MODE ACTIVE"}
                  </span>
                </div>

                <h3
                  className="text-4xl md:text-5xl lg:text-6xl font-arabic text-primary-dark leading-[1.6]"
                  style={{
                    color: themeMode === "light" ? "#034036" : "#0A8F7A",
                  }}
                  dir="rtl"
                >
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </h3>
                <p className="text-lg md:text-xl font-medium opacity-90 transition-opacity">
                  In the name of Allah, the Entirely Merciful, the Especially
                  Merciful.
                </p>
              </div>

              <div className="w-full md:w-auto flex flex-col sm:flex-row md:flex-col gap-4">
                <button
                  onClick={() => setThemeMode("light")}
                  className={`flex-1 md:w-56 px-6 py-4 rounded-2xl flex justify-between items-center transition-all duration-300 ${
                    themeMode === "light"
                      ? "ring-2 ring-primary bg-white shadow-lg scale-105"
                      : "bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
                  }`}
                  style={themeMode === "light" ? { color: "#111827" } : {}}
                >
                  <span className="font-semibold">Light Theme</span>
                  <Sun
                    size={20}
                    className={themeMode === "light" ? "text-amber-500" : ""}
                  />
                </button>
                <button
                  onClick={() => setThemeMode("dark")}
                  className={`flex-1 md:w-56 px-6 py-4 rounded-2xl flex justify-between items-center transition-all duration-300 ${
                    themeMode === "dark"
                      ? "ring-2 ring-primary bg-[#1A2E26] shadow-lg scale-105"
                      : "bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
                  }`}
                  style={themeMode === "dark" ? { color: "#F9FAFB" } : {}}
                >
                  <span className="font-semibold">Dark Theme</span>
                  <Moon
                    size={20}
                    className={themeMode === "dark" ? "text-blue-300" : ""}
                  />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="pt-20 pb-10 bg-[#034036] text-primary-light">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2 space-y-6">
              <div className="flex items-center gap-2 text-white">
                <BookOpen className="w-8 h-8" />
                <span className="font-bold text-2xl tracking-tight">
                  Quranic
                </span>
              </div>
              <p className="max-w-md text-primary-light/80 leading-relaxed text-sm">
                Empowering Muslims around the world to read, reflect, and deeply
                connect with the words of Allah subhanahu wa ta'ala anywhere,
                anytime.
              </p>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-white"
                >
                  <Twitter size={18} />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-white"
                >
                  <Instagram size={18} />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-white"
                >
                  <Github size={18} />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6">Product</h4>
              <ul className="space-y-4 text-sm">
                <li>
                  <a
                    href="#features"
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#themes"
                    className="hover:text-white transition-colors"
                  >
                    Themes
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Android App
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    iOS App
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6">Company</h4>
              <ul className="space-y-4 text-sm">
                <li>
                  <a
                    href="#about"
                    className="hover:text-white transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-primary-light/60">
            <p>
              © {new Date().getFullYear()} Quranic App. All rights reserved.
            </p>
            <p className="flex items-center gap-1 font-medium text-white/80">
              Made with <span className="text-red-500 animate-pulse">❤️</span>{" "}
              for the Ummah
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
