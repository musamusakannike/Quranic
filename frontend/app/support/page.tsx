"use client";

import React, { useState } from "react";
import { motion, Variants } from "framer-motion";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

export default function SupportPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) return;
    
    const subject = encodeURIComponent(`Support Request from ${name || 'a User'}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    );
    window.location.href = `mailto:support@codiac.online?subject=${subject}&body=${body}`;
  };

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen">
      {/* Navigation (Simplified for Support Page) */}
      <header className="w-full z-50 bg-surface border-b border-outline-variant/10 py-5">
        <nav className="flex justify-between items-center px-6 md:px-10 max-w-7xl mx-auto">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span
                className="material-symbols-outlined text-on-primary text-lg"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_stories
              </span>
            </div>
            <span className="text-xl font-headline italic text-primary font-semibold tracking-tight">
              Quranic
            </span>
          </a>
          <a
            href="/"
            className="text-sm font-medium text-on-surface/70 hover:text-primary transition-colors"
          >
            Back to Home
          </a>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-20 md:py-32">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">
              Help & Support
            </span>
            <h1 className="font-headline text-4xl md:text-5xl text-on-surface mb-5 leading-tight">
              How can we <span className="italic text-primary">help you?</span>
            </h1>
            <p className="text-on-surface-variant text-lg max-w-2xl mx-auto">
              If you have any questions, encounter any issues, or just want to share feedback
              about your experience with Quranic, we are here for you.
            </p>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="grid md:grid-cols-2 gap-8 mb-16"
          >
            {/* Contact Form */}
            <div className="bg-surface-container-lowest border border-outline-variant/15 p-8 rounded-3xl shadow-sm">
              <h2 className="font-headline text-2xl mb-6">Send us a message</h2>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-on-surface-variant mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-on-surface-variant mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-on-surface-variant mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors resize-none"
                    placeholder="How can we help?"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary text-on-primary px-6 py-3.5 rounded-xl font-semibold hover:bg-primary/90 active:scale-95 transition-all duration-200"
                >
                  Send Message
                </button>
              </form>
            </div>

            {/* Direct Contact Info */}
            <div className="space-y-6">
              <div className="bg-surface-container-low p-6 rounded-3xl">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-primary text-2xl">
                    mail
                  </span>
                </div>
                <h3 className="font-headline text-xl mb-2">Email Us</h3>
                <p className="text-on-surface-variant text-sm mb-4">
                  For general inquiries, technical support, or feedback, directly email us.
                </p>
                <a
                  href="mailto:support@codiac.online"
                  className="text-primary font-semibold hover:underline"
                >
                  support@codiac.online
                </a>
              </div>

              <div className="bg-surface-container-low p-6 rounded-3xl">
                <div className="w-12 h-12 bg-tertiary/10 rounded-xl flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-tertiary text-2xl">
                    quick_reference_all
                  </span>
                </div>
                <h3 className="font-headline text-xl mb-2">Frequently Asked Questions</h3>
                <p className="text-on-surface-variant text-sm mb-4">
                  Looking for quick answers? Check our FAQ section in the app settings or email us your queries directly.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
