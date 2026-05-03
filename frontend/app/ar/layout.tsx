import type { Metadata } from "next";
import { Cormorant, Manrope, Amiri_Quran } from "next/font/google";
import "../globals.css";

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
  title: "Quranic — اقرأ، تأمّل، وتواصل",
  description:
    "رفيقك الروحي، مُعاد تصوّره. اقرأ القرآن الكريم بخطوط جميلة، استمع إلى أشهر القرّاء، اعرف اتجاه القبلة، تتبّع أوقات الصلاة، وعزّز إيمانك — كل ذلك في تطبيق أنيق واحد.",
  keywords: [
    "قرآن",
    "Quranic",
    "تطبيق إسلامي",
    "قارئ القرآن",
    "أوقات الصلاة",
    "القبلة",
    "أذكار",
    "حفظ",
    "مسلم",
    "إسلام",
  ],
  openGraph: {
    title: "Quranic — اقرأ، تأمّل، وتواصل",
    description:
      "رفيقك الروحي، مُعاد تصوّره. اقرأ، استمع، وعزّز إيمانك مع التطبيق الإسلامي الشامل.",
    type: "website",
    siteName: "Quranic",
    locale: "ar_AR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quranic — اقرأ، تأمّل، وتواصل",
    description:
      "رفيقك الروحي، مُعاد تصوّره. اقرأ، استمع، وعزّز إيمانك مع التطبيق الإسلامي الشامل.",
  },
};

export default function ArLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="scroll-smooth">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${cormorant.variable} ${manrope.variable} ${amiriQuran.variable} font-arabic antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
