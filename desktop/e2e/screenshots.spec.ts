import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const OUT_DIR = path.resolve(process.cwd(), "docs/screenshots");
fs.mkdirSync(OUT_DIR, { recursive: true });

async function applySettingsAndReload(
  page: import("@playwright/test").Page,
  route: string,
  opts: { theme: "light" | "dark"; lang: "en" | "ar" },
) {
  await page.goto(`/#${route}`);
  await page.evaluate(({ theme, lang }) => {
    localStorage.setItem("quranic.theme", theme);
    localStorage.setItem("quranic.lang", lang);
    localStorage.setItem(
      "quranic.kv.settings.v1",
      JSON.stringify({
        theme,
        language: lang,
        hasCompletedOnboarding: true,
        showTranslation: true,
        showTransliteration: false,
        arabicFontSize: 36,
        translationFontSize: 16,
        readingMode: "list",
        sidebarCollapsed: false,
      }),
    );
  }, opts);
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("h1").first().waitFor({ state: "visible", timeout: 10_000 });
  await page.waitForTimeout(300);
}

test("capture desktop UI matrix screenshots and check console errors", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  // 1. 1280x800 Light EN across all primary screens
  await page.setViewportSize({ width: 1280, height: 800 });
  await applySettingsAndReload(page, "/", { theme: "light", lang: "en" });
  await page.screenshot({
    path: path.join(OUT_DIR, "01-home-light-en-1280x800.png"),
  });

  const enRoutes: [string, string][] = [
    ["/quran", "02-quran-light-en-1280x800.png"],
    ["/quran/2?verse=255", "03-reader-baqarah-255-light-en-1280x800.png"],
    ["/prayer-times", "04-prayer-times-light-en-1280x800.png"],
    ["/qiblah", "05-qiblah-light-en-1280x800.png"],
    ["/adhkaar", "06-adhkaar-light-en-1280x800.png"],
    ["/hijri", "07-hijri-light-en-1280x800.png"],
    ["/hifz", "08-hifz-light-en-1280x800.png"],
    ["/settings", "09-settings-light-en-1280x800.png"],
    ["/about", "10-about-light-en-1280x800.png"],
  ];

  for (const [route, file] of enRoutes) {
    await page.goto(`/#${route}`);
    await page.locator("h1").first().waitFor({ state: "visible", timeout: 10_000 });
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(OUT_DIR, file) });
  }

  // Command palette check
  await page.goto("/#/quran/2");
  await page.locator("h1").first().waitFor({ state: "visible" });
  await page.keyboard.press("Control+k");
  await page.waitForTimeout(200);
  await page.fill('input[type="text"]', "2:255");
  await page.waitForTimeout(350);
  await page.screenshot({
    path: path.join(OUT_DIR, "11-command-palette-light-en-1280x800.png"),
  });
  await page.keyboard.press("Escape");

  // 2. 1280x800 Dark EN
  await applySettingsAndReload(page, "/", { theme: "dark", lang: "en" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({
    path: path.join(OUT_DIR, "12-home-dark-en-1280x800.png"),
  });
  await page.goto("/#/quran/2?verse=255");
  await page.locator("h1").first().waitFor({ state: "visible" });
  await page.waitForTimeout(350);
  await page.screenshot({
    path: path.join(OUT_DIR, "13-reader-dark-en-1280x800.png"),
  });

  // 3. 1280x800 Light AR (RTL)
  await applySettingsAndReload(page, "/", { theme: "light", lang: "ar" });
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.screenshot({
    path: path.join(OUT_DIR, "14-home-light-ar-rtl-1280x800.png"),
  });
  await page.goto("/#/hijri");
  await page.locator("h1").first().waitFor({ state: "visible" });
  await page.waitForTimeout(350);
  await page.screenshot({
    path: path.join(OUT_DIR, "15-hijri-light-ar-rtl-1280x800.png"),
  });

  // 4. 1920x1080 Dark AR (RTL)
  await page.setViewportSize({ width: 1920, height: 1080 });
  await applySettingsAndReload(page, "/quran/2?verse=255", {
    theme: "dark",
    lang: "ar",
  });
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({
    path: path.join(OUT_DIR, "16-reader-dark-ar-rtl-1920x1080.png"),
  });

  // 5. 960x640 Narrow Light EN (auto-collapsed sidebar rail)
  await page.setViewportSize({ width: 960, height: 640 });
  await applySettingsAndReload(page, "/", { theme: "light", lang: "en" });
  await page.screenshot({
    path: path.join(OUT_DIR, "17-home-narrow-light-en-960x640.png"),
  });

  expect(consoleErrors).toEqual([]);
});
