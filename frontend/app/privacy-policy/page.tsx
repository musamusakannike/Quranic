"use client";

import React, { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import { BookOpen, ChevronLeft, Shield, Lock, Eye, Mail, Info, FileText } from "lucide-react";
import Link from "next/link";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function PrivacyPolicy() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary-500/30">
      {/* Mini Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl shadow-sm border-b border-gray-200/50 dark:border-white/5 py-4"
            : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-primary-50 dark:bg-primary-900/30 p-2 rounded-lg group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors">
              <BookOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">
              Quranic
            </span>
          </Link>
          <Link 
            href="/" 
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
          >
            <ChevronLeft size={16} />
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-12"
          >
            {/* Header */}
            <motion.div variants={fadeInUp} className="text-center space-y-4">
              <div className="inline-flex p-3 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 mb-2">
                <Shield size={32} />
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Privacy Policy
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </motion.div>

            {/* Introduction Card */}
            <motion.div 
              variants={fadeInUp}
              className="p-8 rounded-[2.5rem] bg-gray-50 dark:bg-[#0b1612] border border-gray-100 dark:border-gray-800/50"
            >
              <div className="flex gap-4 mb-6">
                <div className="p-2 h-fit rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                  <Info size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Introduction</h2>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    At Quranic, we are committed to protecting your privacy and ensuring you have a positive experience while using our app. This Privacy Policy describes how we handle user data and our commitment to transparency.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Main Content Sections */}
            <div className="space-y-10 px-2">
              <Section 
                icon={<Lock size={20} />} 
                title="1. Information We Collect"
                content="Quranic is designed to be a privacy-first application. We collect minimal data necessary for the app to function. This includes:
                • App settings and preferences (e.g., theme, font size)
                • Reading progress (locally stored or synced if logged in)
                • Bookmarks and notes
                • Anonymous crash reports and usage statistics to help us improve the app."
              />

              <Section 
                icon={<Eye size={20} />} 
                title="2. How We Use Your Information"
                content="We use the information collected solely to:
                • Provide and maintain our services.
                • Personalize your experience within the app.
                • Analyze app performance and fix bugs.
                • Sync your data across devices if you choose to create an account."
              />

              <Section 
                icon={<Shield size={20} />} 
                title="3. Data Protection"
                content="We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, loss, or disclosure. Your connection to our services is encrypted using SSL/TLS protocols."
              />

              <Section 
                icon={<FileText size={20} />} 
                title="4. Third-Party Services"
                content="We may use third-party services like Firebase (for authentication and database) or Sentry (for error monitoring). These services have their own privacy policies and are chosen based on their commitment to security and privacy."
              />

              <Section 
                icon={<Info size={20} />} 
                title="5. Your Rights"
                content="You have the right to:
                • Access the data we have about you.
                • Request the correction or deletion of your personal data.
                • Opt-out of anonymous usage tracking in the app settings.
                • Export your data at any time."
              />

              <Section 
                icon={<Mail size={20} />} 
                title="6. Contact Us"
                content="If you have any questions or concerns about our Privacy Policy or data practices, please contact us at support@quranic.app."
              />
            </div>

            {/* Footer Note */}
            <motion.div variants={fadeInUp} className="text-center pt-8 border-t border-gray-100 dark:border-gray-800/50">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} Quranic App. All rights reserved.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function Section({ icon, title, content }: { icon: React.ReactNode; title: string; content: string }) {
  return (
    <motion.section variants={fadeInUp} className="space-y-4">
      <div className="flex items-center gap-3 text-primary-600 dark:text-primary-400">
        <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
          {icon}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <div className="pl-12 text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
        {content}
      </div>
    </motion.section>
  );
}
