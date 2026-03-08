import type { Metadata } from "next";
import { Inter, Amiri_Quran } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const amiriQuran = Amiri_Quran({
  variable: "--font-amiri-quran",
  weight: "400",
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  title: "Quranic - Connect with the Divine Words",
  description:
    "Read, reflect, and immerse yourself in the Holy Quran with a seamless, customizable experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${amiriQuran.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
