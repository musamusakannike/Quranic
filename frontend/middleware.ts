import { NextRequest, NextResponse } from "next/server";

// Arabic language codes and locales
const ARABIC_LOCALES = new Set([
  "ar",
  "ar-AE",
  "ar-BH",
  "ar-DZ",
  "ar-EG",
  "ar-IQ",
  "ar-JO",
  "ar-KW",
  "ar-LB",
  "ar-LY",
  "ar-MA",
  "ar-OM",
  "ar-QA",
  "ar-SA",
  "ar-SD",
  "ar-SY",
  "ar-TN",
  "ar-YE",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Don't redirect if already on the Arabic page or any /ar/* sub-path
  if (pathname.startsWith("/ar")) {
    return NextResponse.next();
  }

  // Only apply auto-redirect on the root path
  if (pathname !== "/") {
    return NextResponse.next();
  }

  // Check if the user has already been redirected (cookie-based opt-out)
  // This prevents redirect loops and respects manual navigation back to "/"
  const hasManuallyChosen = request.cookies.get("preferred-lang");
  if (hasManuallyChosen) {
    return NextResponse.next();
  }

  // Parse Accept-Language header
  const acceptLanguage = request.headers.get("accept-language") ?? "";
  const preferredLocales = parseAcceptLanguage(acceptLanguage);

  const isArabicUser = preferredLocales.some((locale) => {
    const lang = locale.toLowerCase();
    // Match "ar" exactly or any "ar-XX" variant
    return lang === "ar" || lang.startsWith("ar-") || ARABIC_LOCALES.has(lang);
  });

  if (isArabicUser) {
    const url = request.nextUrl.clone();
    url.pathname = "/ar";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

/**
 * Parse the Accept-Language header and return an ordered list of language tags.
 * e.g. "ar-SA,ar;q=0.9,en;q=0.8" → ["ar-SA", "ar", "en"]
 */
function parseAcceptLanguage(header: string): string[] {
  return header
    .split(",")
    .map((part) => {
      const [locale, q] = part.trim().split(";q=");
      return { locale: locale.trim(), q: q ? parseFloat(q) : 1.0 };
    })
    .sort((a, b) => b.q - a.q)
    .map((entry) => entry.locale)
    .filter(Boolean);
}

export const config = {
  matcher: [
    /*
     * Match only the root path and skip:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, images, etc.
     */
    "/((?!_next/static|_next/image|favicon.ico|images|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)",
  ],
};
