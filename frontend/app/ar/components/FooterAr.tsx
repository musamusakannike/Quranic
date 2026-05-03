"use client";

import Image from "next/image";

const footerLinks = [
  {
    heading: "المنتج",
    links: [
      { label: "المميزات", href: "#features" },
      { label: "التجربة", href: "#experience" },
      { label: "آراء المستخدمين", href: "#testimonials" },
    ],
  },
  {
    heading: "تحميل",
    links: [
      {
        label: "App Store",
        href: "https://apps.apple.com/ng/app/quranic-read-listen/id6760474571",
        external: true,
      },
      {
        label: "Google Play",
        href: "https://play.google.com/store/apps/details?id=com.codiac.quranic",
        external: true,
      },
    ],
  },
  {
    heading: "قانوني",
    links: [
      { label: "سياسة الخصوصية", href: "/privacy-policy" },
      { label: "الدعم", href: "/support" },
    ],
  },
];

export default function FooterAr() {
  return (
    <footer className="bg-ink-soft border-t border-border-subtle">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <a href="#" className="flex items-center gap-3 mb-4">
              <Image
                src="/images/icon.png"
                alt="Quranic"
                width={32}
                height={32}
                className="rounded-xl"
              />
              <span className="font-headline text-xl font-semibold text-parchment">
                Quranic
              </span>
            </a>
            <p className="text-[14px] font-arabic text-slate-400 leading-relaxed max-w-xs">
              اقرأ، تأمّل، وتواصل. رفيقك الروحي، مُصمَّم بجمال للباحث
              المعاصر.
            </p>
          </div>

          {/* Link columns */}
          {footerLinks.map((group) => (
            <div key={group.heading}>
              <h4 className="text-[12px] font-arabic font-semibold text-slate-500 mb-4">
                {group.heading}
              </h4>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      {...("external" in link && link.external
                        ? {
                            target: "_blank",
                            rel: "noopener noreferrer",
                          }
                        : {})}
                      className="text-[14px] font-arabic text-slate-400 hover:text-parchment transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-border-subtle flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[13px] font-arabic text-slate-500">
            © {new Date().getFullYear()} Quranic بواسطة Fluenttera Limited. جميع الحقوق محفوظة.
          </p>
          <p className="text-[13px] font-arabic text-slate-500/60">
            صُنع بـ ❤️ للأمة الإسلامية
          </p>
        </div>
      </div>
    </footer>
  );
}
