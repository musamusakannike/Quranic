# Quick Start: Internationalization

## 🚀 Getting Started

The Quranic app now supports **English** and **Arabic** with beautiful typography and RTL support!

## 📱 For Users

### Switching Language

1. Open the app
2. Go to **Settings** (⚙️ icon in bottom navigation)
3. Tap **Language** section (first section at the top)
4. Choose:
   - **English** - for English interface
   - **العربية** - for Arabic interface with RTL layout
5. The app updates immediately!

### What Changes

When you switch to Arabic:
- ✨ All UI text displays in Arabic
- ✨ Beautiful Cairo font for UI elements
- ✨ Right-to-left (RTL) layout
- ✨ Arabic numerals (٠١٢٣٤٥٦٧٨٩)
- ✨ Mirrored navigation and icons
- ✨ Quranic text remains in AmiriQuran font

## 💻 For Developers

### Installation

Already done! The following packages are installed:
```bash
npm install i18n-js@4.4.3 @expo-google-fonts/cairo
```

### Basic Usage

```typescript
import { useLanguage } from "../../lib/LanguageContext";
import { useAppFonts } from "../../lib/i18n/useAppFonts";

function MyScreen() {
  const { t, isRTL } = useLanguage();
  const fonts = useAppFonts();
  
  return (
    <View style={[
      styles.container,
      isRTL && { flexDirection: "row-reverse" }
    ]}>
      <Text style={{
        fontFamily: fonts.bold,
        textAlign: isRTL ? "right" : "left"
      }}>
        {t("myScreen.title")}
      </Text>
    </View>
  );
}
```

### Adding Translations

1. **Add to English** (`mobile/lib/i18n/translations/en.ts`):
```typescript
export default {
  myScreen: {
    title: "My Screen",
    subtitle: "Screen description",
  },
};
```

2. **Add to Arabic** (`mobile/lib/i18n/translations/ar.ts`):
```typescript
export default {
  myScreen: {
    title: "شاشتي",
    subtitle: "وصف الشاشة",
  },
};
```

3. **Use in component**:
```typescript
<Text>{t("myScreen.title")}</Text>
```

### Common Patterns

#### With Variables
```typescript
// Translation: "Ayah {{verse}}"
t("home.ayah", { verse: 42 })  // "Ayah 42" / "آية ٤٢"
```

#### Pluralization
```typescript
// Translation keys:
// "verses_one": "{{count}} verse"
// "verses_other": "{{count}} verses"
t("chapters.verses", { count: 1 })   // "1 verse"
t("chapters.verses", { count: 10 })  // "10 verses"
```

#### RTL Layout
```typescript
const { isRTL } = useLanguage();

<View style={[
  { flexDirection: "row" },
  isRTL && { flexDirection: "row-reverse" }
]}>
  <Icon />
  <Text>{t("label")}</Text>
</View>
```

#### Font Selection
```typescript
const fonts = useAppFonts();

// Automatically uses Cairo for Arabic, Satoshi for English
<Text style={{ fontFamily: fonts.regular }}>{t("text")}</Text>
<Text style={{ fontFamily: fonts.medium }}>{t("text")}</Text>
<Text style={{ fontFamily: fonts.bold }}>{t("text")}</Text>

// Always use AmiriQuran for Quranic text
<Text style={{ fontFamily: fonts.arabic }}>{quranVerse}</Text>
```

## 📚 Available Hooks

### `useLanguage()`
```typescript
const {
  t,           // Translation function
  locale,      // Current language ("en" | "ar")
  setLocale,   // Change language
  isRTL,       // Boolean for RTL layout
} = useLanguage();
```

### `useAppFonts()`
```typescript
const {
  regular,     // "Cairo" or "Satoshi"
  medium,      // "CairoMedium" or "SatoshiMedium"
  bold,        // "CairoBold" or "SatoshiBold"
  arabic,      // "AmiriQuran" (always)
  isRTL,       // Boolean for RTL
} = useAppFonts();
```

## 🎨 Fonts

| Language | Regular | Medium | Bold | Quranic |
|----------|---------|--------|------|---------|
| English  | Satoshi | SatoshiMedium | SatoshiBold | AmiriQuran |
| Arabic   | Cairo   | CairoMedium   | CairoBold   | AmiriQuran |

## ✅ Checklist for New Screens

When creating a new screen:

- [ ] Import `useLanguage` and `useAppFonts`
- [ ] Use `t()` for all user-facing text
- [ ] Use `fonts.regular/medium/bold` for font families
- [ ] Add `isRTL && { flexDirection: "row-reverse" }` for rows
- [ ] Add `textAlign: isRTL ? "right" : "left"` for text
- [ ] Add translation keys to both `en.ts` and `ar.ts`
- [ ] Test with both English and Arabic

## 🔍 Translation Keys

All keys are organized by feature:

```typescript
t("tabs.home")                    // Tab labels
t("settings.title")               // Settings screen
t("home.greeting")                // Home screen
t("chapters.searchPlaceholder")   // Chapters screen
t("bookmarks.emptyTitle")         // Bookmarks screen
t("search.noResults")             // Search screen
t("qiblah.findingDirection")      // Qiblah screen
t("solah.nextPrayer")             // Solah screen
t("adhkaar.introTitle")           // Adhkaar screen
t("hijriCalendar.today")          // Hijri calendar
t("hifz.startLoop")               // Hifz screen
t("aiChat.placeholder")           // AI chat
t("common.loading")               // Common UI
```

## 🐛 Troubleshooting

### Language not changing?
- Check if LanguageProvider is in app tree (it is!)
- Restart the app (RTL changes require restart)
- Clear AsyncStorage: `@app_language`

### Fonts not loading?
- Check console for font loading errors
- Verify fonts are in `node_modules/@expo-google-fonts/cairo`
- Restart Metro bundler

### RTL layout broken?
- Use `isRTL` from `useLanguage()`
- Apply `flexDirection: "row-reverse"` conditionally
- Check text alignment: `textAlign: isRTL ? "right" : "left"`

## 📖 Full Documentation

For complete documentation, see:
- **`mobile/docs/INTERNATIONALIZATION.md`** - Full implementation guide
- **`mobile/I18N_IMPLEMENTATION_SUMMARY.md`** - Implementation summary

## 🎯 Current Status

### ✅ Fully Implemented
- Settings screen
- Tab navigation
- Onboarding flow
- Splash screen
- Language switching
- RTL support
- Font system

### 🔄 Translation Keys Ready (Need Component Updates)
- Home screen
- Chapters screen
- Bookmarks screen
- Search screen
- Qiblah screen
- Solah screen
- Adhkaar screen
- Hijri Calendar screen
- Hifz screen
- AI Chat screen

**All 190+ translation keys are defined and ready to use!**

## 🎉 That's It!

You're ready to use internationalization in the Quranic app. Just use `t()` for text, `fonts` for typography, and `isRTL` for layout!

---

**Questions?** Check the full documentation in `mobile/docs/INTERNATIONALIZATION.md`
