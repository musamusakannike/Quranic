"use client";

import React, { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
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
      staggerChildren: 0.15,
    },
  },
};

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-surface font-body text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed overflow-x-hidden">
      {/* TopAppBar */}
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-surface/80 backdrop-blur-2xl shadow-sm border-b border-outline-variant/10 py-4"
            : "bg-transparent py-6"
        }`}
      >
        <nav className="flex justify-between items-center px-8 max-w-7xl mx-auto">
          <div className="text-2xl font-headline italic text-primary">
            Quranic
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a
              className="text-primary font-bold border-b-2 border-primary pb-1 font-headline tracking-tight"
              href="#"
            >
              Features
            </a>
            <a
              className="text-on-surface opacity-80 hover:opacity-100 hover:text-primary transition-all duration-300 font-headline tracking-tight"
              href="#"
            >
              About
            </a>
            <a
              className="text-on-surface opacity-80 hover:opacity-100 hover:text-primary transition-all duration-300 font-headline tracking-tight"
              href="#"
            >
              Download
            </a>
            <a
              className="text-on-surface opacity-80 hover:opacity-100 hover:text-primary transition-all duration-300 font-headline tracking-tight"
              href="#"
            >
              Help
            </a>
          </div>
          <div className="flex items-center gap-4">
            <button className="hidden md:block bg-primary text-on-primary px-6 py-2.5 rounded-md font-medium scale-95 duration-200 active:opacity-70 hover:bg-primary-container transition-all">
              Get Started
            </button>
            <button className="md:hidden text-primary">
              <span className="material-symbols-outlined" data-icon="menu">
                menu
              </span>
            </button>
          </div>
        </nav>
      </header>

      <main className="pt-24">
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex items-center overflow-hidden hero-pattern">
          <div className="max-w-7xl mx-auto px-8 w-full grid md:grid-cols-12 gap-12 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="md:col-span-7 z-10"
            >
              <motion.span
                variants={fadeInUp}
                className="inline-block px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold tracking-widest uppercase mb-6"
              >
                Experience Divine Guidance
              </motion.span>
              <motion.h1
                variants={fadeInUp}
                className="font-headline text-6xl md:text-8xl text-primary font-semibold leading-[1.1] mb-6 tracking-tight"
              >
                Your Spiritual Journey, Reimagined.
              </motion.h1>
              <motion.p
                variants={fadeInUp}
                className="text-on-surface-variant text-xl md:text-2xl max-w-xl mb-10 leading-relaxed"
              >
                Recite, Listen, and grow your Iman with the ultimate Islamic
                companion app. Built for the modern seeker.
              </motion.p>
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4"
              >
                <button className="bg-primary text-on-primary px-8 py-4 rounded-md font-bold text-lg shadow-xl shadow-primary/10 hover:bg-primary-container transition-all">
                  Download for Free
                </button>
                <button className="border border-outline-variant text-on-surface px-8 py-4 rounded-md font-bold text-lg hover:bg-surface-container-low transition-all">
                  Explore Features
                </button>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="md:col-span-5 relative flex justify-center"
            >
              <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary-fixed/20 rounded-full blur-[100px]"></div>
              <div className="relative z-10 w-full max-w-[320px]">
                <img
                  alt="iPhone App Interface"
                  className="rounded-[2.5rem] shadow-2xl border-[8px] border-white ring-1 ring-outline-variant"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKfV4GVK3Z0gRSsfcUGmE9uPcdKR5NDUAYX4Ukpb09_Hnr-zPUqS22sm-xThCFwKtyXXOlXs6RadTAJUC9NooDBOrCN817ihKu0kPOynS4DhdxepMOpdc-kCE_lNVr39wtfu8hN79xxnBn_jtDzSoZKTsUBuNloZV6FAipCUP5UGTaDVL2ssw4-joSUdgiH6YpLYVkZ4VvabR89baYs738FWPhKHTKLB5zY5Ai-adA51hBnLOK8Q7hyZCo1M16p9KAZ5f4TLXgNc2V"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="absolute -bottom-6 -left-12 bg-surface-container-lowest p-6 rounded-xl shadow-xl border border-outline-variant/20 max-w-[200px]"
                >
                  <div className="flex gap-1 text-tertiary mb-2">
                    <span
                      className="material-symbols-outlined text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span
                      className="material-symbols-outlined text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span
                      className="material-symbols-outlined text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span
                      className="material-symbols-outlined text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span
                      className="material-symbols-outlined text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                  </div>
                  <p className="text-xs font-medium text-on-surface">
                    "The most beautiful Quran app I have ever used."
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className="py-24 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="mb-16 text-center"
            >
              <h2 className="font-headline text-4xl md:text-5xl text-on-surface mb-4">
                A Sanctuary in Your Pocket
              </h2>
              <p className="text-on-surface-variant max-w-2xl mx-auto">
                Everything you need to maintain your daily spiritual habits,
                designed with intentionality and grace.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-full md:h-[600px]">
              {/* Main Quran Feature */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="md:col-span-2 md:row-span-2 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 flex flex-col justify-between group hover:border-primary/20 transition-all cursor-default"
              >
                <div>
                  <span
                    className="material-symbols-outlined text-primary text-4xl mb-6"
                    data-icon="menu_book"
                  >
                    menu_book
                  </span>
                  <h3 className="font-headline text-3xl mb-4">
                    Divine Recitation
                  </h3>
                  <p className="text-on-surface-variant text-lg">
                    Experience the Quran with word-by-word translations,
                    transliteration, and crystal clear tajweed rules.
                  </p>
                </div>
                <img
                  alt="Quran Close-up"
                  className="w-full h-48 object-cover rounded-lg mt-8 opacity-80 group-hover:opacity-100 transition-opacity"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBU8rTUbZz_MjDBeW5Epuw5styU6F-LtNrLosSdjrN_QBzmBHdFScl1ZLiY2nxcJ649kbUj2Ril-2CZZ1Lxq-FmbdzaXPessyQ292TgFnClfJ39so47a2J5XZjob_PBskJ9g5h-Dn78xhcHzZoP3VjwlSV5ZFSexesNptLAEdWpj4UH926wNCNnU8sd0SaCZALUrLx4Rnmc02H6BaZRgSucwzZG3E1HTod75caKgfhkxMU7uQphT43V1C2X7Nv2tonH575M9yyotvP2"
                />
              </motion.div>
              {/* Audio */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-primary text-on-primary p-8 rounded-xl flex flex-col justify-between"
              >
                <span className="material-symbols-outlined text-3xl">
                  headphones
                </span>
                <div>
                  <h3 className="font-bold text-xl mb-2">Immersive Audio</h3>
                  <p className="text-on-primary/80 text-sm">
                    Listen to world-renowned reciters in high fidelity.
                  </p>
                </div>
              </motion.div>
              {/* Prayer Times */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-surface-container-highest p-8 rounded-xl flex flex-col justify-between border border-outline-variant/20"
              >
                <span className="material-symbols-outlined text-primary text-3xl">
                  schedule
                </span>
                <div>
                  <h3 className="font-bold text-xl text-on-surface mb-2">
                    Prayer Times
                  </h3>
                  <p className="text-on-surface-variant text-sm">
                    Accurate local timings with beautiful Adhan notifications.
                  </p>
                </div>
              </motion.div>
              {/* Qiblah */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 flex flex-col justify-between"
              >
                <span className="material-symbols-outlined text-tertiary text-3xl">
                  explore
                </span>
                <div>
                  <h3 className="font-bold text-xl mb-2">Qiblah Finder</h3>
                  <p className="text-on-surface-variant text-sm">
                    Precision compass to guide your devotion anywhere.
                  </p>
                </div>
              </motion.div>
              {/* Adhkar */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="bg-secondary-container text-on-secondary-container p-8 rounded-xl flex flex-col justify-between"
              >
                <span className="material-symbols-outlined text-3xl">
                  auto_awesome
                </span>
                <div>
                  <h3 className="font-bold text-xl mb-2">Hisnul Muslim</h3>
                  <p className="text-on-secondary-container/80 text-sm">
                    A complete library of daily Adhkar and Duas.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Feature Deep Dive */}
        <section className="py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid md:grid-cols-2 gap-20 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="aspect-[4/5] bg-surface-container rounded-2xl overflow-hidden shadow-inner">
                  <img
                    alt="Lifestyle Devotion"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGY9fxb9T4VyvLmeod7cGB3emDI4QeS4XxRcz6o8__IhnwgQdCMWmNnNn0HhXWhqkVP1zKbmvkzDZtka7CgDSm2LOf9kJDOhp1169U8HAUUJip5P3j6tF5YvSExSJCGdcll_oSHcrMca8lJ0cOk0Ey_zmaAA7A__y0JVhk7eE-pIp5-BYg_wlLXWgRsNK_iZ5MyOgnIFbmq57gaiw7Iz2Za2N-TGJMbyPSmFgIDCNQw4r3T2dXdn56msr4jEmaDYMO9LcNlWAVgzYS"
                  />
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="absolute -bottom-10 -right-10 bg-surface-container-lowest p-4 rounded-2xl shadow-2xl w-48 hidden md:block border border-outline-variant/10"
                >
                  <div className="bg-primary/5 p-4 rounded-xl">
                    <span className="text-xs font-bold uppercase tracking-tighter text-primary">
                      Daily Progress
                    </span>
                    <div className="h-2 w-full bg-outline-variant/20 rounded-full mt-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: "75%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.6 }}
                        className="h-full bg-primary"
                      ></motion.div>
                    </div>
                    <p className="text-sm mt-2 font-bold">12 Ayahs Today</p>
                  </div>
                </motion.div>
              </motion.div>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                <motion.h2
                  variants={fadeInUp}
                  className="font-headline text-5xl text-primary leading-tight mb-8"
                >
                  Nurture Your Soul with Gentle Persistence.
                </motion.h2>
                <div className="space-y-8">
                  {[
                    {
                      icon: "history_edu",
                      title: "Journal Your Reflections",
                      desc: "Personalize your journey by adding notes and reflections to any Ayah. Your spiritual growth, documented.",
                    },
                    {
                      icon: "podcasts",
                      title: "Guided Podcasts",
                      desc: "Listen to exclusive tafsir and spiritual discussions from leading scholars while you commute or rest.",
                    },
                    {
                      icon: "calendar_month",
                      title: "Hijri Calendar",
                      desc: "Never miss an important Islamic date. Integrated Hijri dates with events and fasting reminders.",
                    },
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      variants={fadeInUp}
                      className="flex gap-6"
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">
                          {item.icon}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2 text-on-surface">
                          {item.title}
                        </h3>
                        <p className="text-on-surface-variant leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* App Showcase */}
        <section className="py-24 bg-primary overflow-hidden">
          <div className="max-w-7xl mx-auto px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center mb-20"
            >
              <h2 className="font-headline text-4xl md:text-6xl text-on-primary mb-6">
                Designed for Focus.
              </h2>
              <p className="text-primary-fixed/80 max-w-2xl mx-auto text-lg">
                We removed the noise so you can focus on what matters most. A
                clean, distraction-free environment for your daily devotions.
              </p>
            </motion.div>
            <div className="relative flex justify-center items-center gap-8">
              {/* Phone Left */}
              <motion.div
                initial={{ opacity: 0, rotate: 0, x: -50 }}
                whileInView={{ opacity: 0.5, rotate: -12, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="hidden md:block w-[280px] translate-y-12"
              >
                <img
                  alt="App Screen"
                  className="rounded-[2rem] shadow-2xl"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBT0HdYiVhWxJfi7pSz5V0b288Qj4xemcyg8jJP1U8SdbTj_Gmb1bv1PKr2BrzcZhjtAYOYEab4WNIkt63XqqXPItCqmCgpMmyzR0YYH18JFnGdCAsBkB3hJrk3lsFCSzYiBD8daSI-_xN01pXe4Ci9OLbSlb5mzvDpPmU7q__Kw30FO9bVsgM8yjQKajW0x1ZowAiSZWo0URlmSff_GfFWG6z9-uWXvO2MlzNrICqPPOmP6MN7GeIbEkk1_h9z_OwnS7gSzp46SjQR"
                />
              </motion.div>
              {/* Phone Center */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="w-[320px] z-20"
              >
                <img
                  alt="Main App Screen"
                  className="rounded-[2.5rem] shadow-2xl ring-8 ring-primary-container"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBctZi04_yQ8Y8WRoQOrt_ipW-qMgyQRuCwgvsCpolXay6yAzw7eb4Db3Xcph8ZqedEWsdX_nrPkaBAf2bhV9kh_Qt_qqAPY4zDMKrIAGSCuEYX_rtPvlbC_ndMoC8Ciasm_X0ez366uBKUVqFS_GfGuwBml1bCjAr_J7HVoa7RyIR77Qsy1Z6FNP7kv53hXMDKWaFt0mWFnVoFOESFtCDX6Cbiz9LFkq8fNk7ukGdVVfdY92oX3SAL6TwlA7yOrl3WEuNbWZaEOerS"
                />
              </motion.div>
              {/* Phone Right */}
              <motion.div
                initial={{ opacity: 0, rotate: 0, x: 50 }}
                whileInView={{ opacity: 0.5, rotate: 12, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="hidden md:block w-[280px] translate-y-12"
              >
                <img
                  alt="App Screen"
                  className="rounded-[2rem] shadow-2xl"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAiuTuICbZgYufK3KNsGNpjodzC_A5YaN41jUROtZxgDtrUyZwJEi8m4-MhwE_G6A_XLsBgqr96sYwM9UpRJ5I3I580Uks07VJMZIdvYmfbRki9VoWtuJIs9WWBu6oIqlhPuzCjbPRC0zBzZst4h612_S9Ha0L8mnA61UOctcfY_hH3R9hckws73eNjbNl1tHlFbQetEIuFwQE1Tu2Lh9YPCgU6DOsdlWTVeffoZWruDniX6hKBCAW89UniwIq7fFMURHjLV1797-9"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 bg-surface">
          <div className="max-w-7xl mx-auto px-8">
            <h2 className="font-headline text-4xl text-center mb-16">
              Loved by the Ummah.
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Yusuf Ahmed",
                  location: "London, UK",
                  initials: "YA",
                  quote:
                    "The dark mode and the selection of reciters are unmatched. It feels like a premium experience that actually respects my time and focus.",
                  bgColor: "bg-surface-container-lowest",
                },
                {
                  name: "Sara Malik",
                  location: "Dubai, UAE",
                  initials: "SM",
                  quote:
                    "Quranic has completely transformed my daily routine. The Adhkar notifications are subtle yet timely. Highly recommended for every Muslim.",
                  bgColor: "bg-surface-container-low",
                  offset: true,
                },
                {
                  name: "Ibrahim Khan",
                  location: "Toronto, CA",
                  initials: "IK",
                  quote:
                    "Finally an Islamic app that isn't cluttered with ads or poor design. This is editorial quality for spiritual growth.",
                  bgColor: "bg-surface-container-lowest",
                },
              ].map((t, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-8 rounded-xl ${t.bgColor} border border-outline-variant/10 shadow-sm ${t.offset ? "md:-translate-y-4" : ""}`}
                >
                  <div className="flex gap-1 text-tertiary mb-6">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span
                        key={s}
                        className="material-symbols-outlined text-sm"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                    ))}
                  </div>
                  <p className="text-on-surface-variant italic mb-8 leading-relaxed">
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${idx === 1 ? "bg-primary-container text-on-primary-container" : idx === 2 ? "bg-tertiary-container text-on-tertiary-container" : "bg-secondary-container text-on-secondary-container"}`}>
                      {t.initials}
                    </div>
                    <div>
                      <h4 className="font-bold">{t.name}</h4>
                      <p className="text-xs text-on-surface-variant uppercase tracking-widest">
                        {t.location}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Download Section */}
        <section className="py-24">
          <div className="max-w-5xl mx-auto px-8">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              className="bg-surface-container-highest rounded-[2rem] p-12 md:p-20 text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/islamic-art.png')]"></div>
              </div>
              <div className="relative z-10">
                <h2 className="font-headline text-5xl md:text-6xl text-primary mb-8 leading-tight">
                  Begin Your Path <br />
                  Towards Presence.
                </h2>
                <p className="text-xl text-on-surface-variant mb-12 max-w-xl mx-auto">
                  Join over 1 million users worldwide who have elevated their
                  spiritual practice with Quranic.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-6">
                  <a
                    className="bg-[#171d19] text-white flex items-center gap-3 px-8 py-4 rounded-xl hover:bg-black transition-all"
                    href="#"
                  >
                    <span className="material-symbols-outlined text-3xl">
                      phone_iphone
                    </span>
                    <div className="text-left">
                      <p className="text-[10px] uppercase font-bold opacity-70">
                        Download on the
                      </p>
                      <p className="text-xl font-bold leading-none">
                        App Store
                      </p>
                    </div>
                  </a>
                  <a
                    className="bg-[#171d19] text-white flex items-center gap-3 px-8 py-4 rounded-xl hover:bg-black transition-all"
                    href="#"
                  >
                    <span className="material-symbols-outlined text-3xl">
                      play_store_installed
                    </span>
                    <div className="text-left">
                      <p className="text-[10px] uppercase font-bold opacity-70">
                        Get it on
                      </p>
                      <p className="text-xl font-bold leading-none">
                        Google Play
                      </p>
                    </div>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-16 border-t border-primary/10 bg-surface">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto gap-8">
          <div className="text-lg font-headline text-primary">Quranic</div>
          <div className="flex flex-wrap justify-center gap-8">
            <a
              className="text-sm uppercase tracking-widest text-[#171d19]/60 hover:text-tertiary transition-colors"
              href="#"
            >
              Privacy Policy
            </a>
            <a
              className="text-sm uppercase tracking-widest text-[#171d19]/60 hover:text-tertiary transition-colors"
              href="#"
            >
              Terms of Service
            </a>
            <a
              className="text-sm uppercase tracking-widest text-[#171d19]/60 hover:text-tertiary transition-colors"
              href="#"
            >
              Support
            </a>
            <a
              className="text-sm uppercase tracking-widest text-[#171d19]/60 hover:text-tertiary transition-colors"
              href="#"
            >
              Contact Us
            </a>
          </div>
          <div className="text-sm uppercase tracking-widest text-[#171d19]/60">
            © 2024 Quranic. The Sacred Breath.
          </div>
        </div>
      </footer>
    </div>
  );
}
