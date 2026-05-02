"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Experience", href: "#experience" },
  { label: "Testimonials", href: "#testimonials" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-ink/80 backdrop-blur-2xl border-b border-border-subtle shadow-lg shadow-black/10"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 flex items-center justify-between h-[72px]">
          <a href="#" className="flex items-center gap-3 group">
            <Image
              src="/images/icon.png"
              alt="Quranic"
              width={36}
              height={36}
              className="rounded-xl transition-transform duration-300 group-hover:scale-105"
            />
            <span className="font-headline text-[22px] font-semibold text-parchment tracking-tight">
              Quranic
            </span>
          </a>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-[15px] text-slate-300 hover:text-parchment transition-colors duration-200 rounded-lg hover:bg-surface-glass"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://apps.apple.com/ng/app/quranic-read-listen/id6760474571"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 text-[14px] font-medium text-ink bg-parchment rounded-xl hover:bg-parchment-warm transition-all duration-300 hover:shadow-lg hover:shadow-teal/10 hover:-translate-y-0.5 active:translate-y-0"
            >
              Download Free
            </a>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-parchment rounded-lg hover:bg-surface-glass transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-ink/95 backdrop-blur-2xl pt-[80px] px-6 md:hidden"
          >
            <div className="flex flex-col gap-2">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="py-4 px-4 text-lg text-parchment border-b border-border-subtle font-headline"
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.a
                href="https://apps.apple.com/ng/app/quranic-read-listen/id6760474571"
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 py-4 text-center text-ink bg-parchment rounded-2xl font-medium text-lg"
              >
                Download Free
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
