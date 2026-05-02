import type { Metadata } from "next";
import { Cormorant, Manrope, Amiri_Quran } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const amiriQuran = Amiri_Quran({
  variable: "--font-amiri-quran",
  weight: "400",
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  title: "Quranic — Read, Reflect, and Connect",
  description:
    "Your spiritual companion, reimagined. Read the Holy Quran with beautiful typography, listen to world-renowned reciters, find Qiblah direction, track prayer times, and grow your Iman — all in one elegant app.",
  keywords: [
    "Quran",
    "Quranic",
    "Islamic app",
    "Quran reader",
    "Prayer times",
    "Qiblah",
    "Adhkaar",
    "Hifz",
    "Muslim",
    "Islam",
  ],
  openGraph: {
    title: "Quranic — Read, Reflect, and Connect",
    description:
      "Your spiritual companion, reimagined. Read, listen, and grow your Iman with the ultimate Islamic app.",
    type: "website",
    siteName: "Quranic",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quranic — Read, Reflect, and Connect",
    description:
      "Your spiritual companion, reimagined. Read, listen, and grow your Iman with the ultimate Islamic app.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${cormorant.variable} ${manrope.variable} ${amiriQuran.variable} font-body antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
