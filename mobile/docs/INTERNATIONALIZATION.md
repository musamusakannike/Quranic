# Internationalization (i18n) Implementation

## Overview

The Quranic app now supports **English** and **Arabic** with full RTL (Right-to-Left) support for Arabic. The implementation uses:

- **expo-localization** - Device locale detection
- **i18n-js** - Translation management
- **Cairo font** - Beautiful Arabic/Latin UI typeface
- **AmiriQuran font** - Quranic Arabic text (unchanged)

## Features

✅ **Automatic language detection** based on device settings  
✅ **Manual language switching** in Settings screen  
✅ **RTL layout support** for Arabic  
✅ **Beautiful Arabic typography** with Cairo font  
✅ **Persistent language preference** across app restarts  
✅ **190+ translation keys** covering all UI text  
✅ **Type-safe translations** with TypeScript

## Architecture

### File Structure

```
mobile/
├── lib/
│   ├── i18n/
│   │   ├── index.ts                 # i18n instance & config
│   │   ├── translations/
│   │   │   ├── en.ts                # English translations
│   │   │   └── ar.ts                # Arabic translations
│   │   └── useAppFonts.ts           # Font selection hook
│   └── LanguageContext.tsx          # Language state management
├── scripts/
│   └── extract_translations.py      # Translation extraction tool
└── app/
    └── _layout.tsx                  # LanguageProvider integration
```

### Key Components

#### 1. **LanguageContext**
Manages language state and provides the `useLanguage()` hook:

```typescript
const { t, locale, setLocale, isRTL } = useLanguage();
```

- `t(key, options)` - Translation function
- `locale` - Current language ("en" | "ar")
- `setLocale(locale)` - Change language
- `isRTL` - Boolean for RTL layout

#### 2. **useAppFonts Hook**
Returns appropriate fonts based on current language:

```typescript
const fonts = useAppFonts();
// fonts.regular, fonts.medium, fonts.bold, fonts.arabic
```

- **English**: Satoshi (Regular, Medium, Bold)
- **Arabic**: Cairo (Regular, Medium, Bold)
- **Quranic text**: AmiriQuran (both languages)

#### 3. **Translation Files**
Structured translation objects with nested keys:

```typescript
// Usage
t("settings.title")                    // "Settings" / "الإعدادات"
t("home.ayah", { verse: 5 })          // "Ayah 5" / "آية ٥"
t("chapters.verses_other", { count: 10 }) // "10 verses" / "١٠ آيات"
```

## Usage Guide

### Basic Translation

```typescript
import { useLanguage } from "../../lib/LanguageContext";

function MyComponent() {
  const { t, isRTL } = useLanguage();
  
  return (
    <Text style={{ textAlign: isRTL ? "right" : "left" }}>
      {t("common.loading")}
    </Text>
  );
}
```

### With Interpolation

```typescript
// Translation key: "home.ayah": "Ayah {{verse}}"
t("home.ayah", { verse: 42 })  // "Ayah 42" / "آية ٤٢"
```

### Pluralization

```typescript
// Translation keys:
// "chapters.verses_one": "{{count}} verse"
// "chapters.verses_other": "{{count}} verses"

t("chapters.verses", { count: 1 })   // "1 verse"
t("chapters.verses", { count: 10 })  // "10 verses"
```

### RTL Layout

```typescript
const { isRTL } = useLanguage();

<View style={[
  styles.row,
  isRTL && { flexDirection: "row-reverse" }
]}>
  {/* Content automatically mirrors for RTL */}
</View>
```

### Font Selection

```typescript
import { useAppFonts } from "../../lib/i18n/useAppFonts";

function MyComponent() {
  const fonts = useAppFonts();
  
  return (
    <Text style={{ fontFamily: fonts.bold }}>
      {/* Uses CairoBold for Arabic, SatoshiBold for English */}
    </Text>
  );
}
```

## Adding New Translations

### 1. Add to Translation Files

**mobile/lib/i18n/translations/en.ts:**
```typescript
export default {
  myFeature: {
    title: "My Feature",
    description: "Feature description",
  },
};
```

**mobile/lib/i18n/translations/ar.ts:**
```typescript
export default {
  myFeature: {
    title: "ميزتي",
    description: "وصف الميزة",
  },
};
```

### 2. Use in Component

```typescript
const { t } = useLanguage();

<Text>{t("myFeature.title")}</Text>
```

### 3. Extract Translations (Optional)

Run the extraction script to find untranslated strings:

```bash
python3 mobile/scripts/extract_translations.py
```

## Language Switching

Users can change language in **Settings > Language**:

1. Open Settings screen
2. Tap Language section
3. Select English or العربية
4. UI updates immediately
5. Preference is saved to AsyncStorage

## RTL Considerations

### Automatic RTL

The app automatically enables RTL when Arabic is selected:

```typescript
I18nManager.forceRTL(true);  // Applied when locale === "ar"
```

### Manual RTL Adjustments

Some components need explicit RTL handling:

```typescript
// Flex direction
<View style={[styles.row, isRTL && { flexDirection: "row-reverse" }]} />

// Text alignment
<Text style={{ textAlign: isRTL ? "right" : "left" }} />

// Padding/Margin
<View style={{
  paddingLeft: isRTL ? 0 : 16,
  paddingRight: isRTL ? 16 : 0,
}} />
```

## Fonts

### UI Fonts

| Language | Regular | Medium | Bold |
|----------|---------|--------|------|
| English  | Satoshi | SatoshiMedium | SatoshiBold |
| Arabic   | Cairo   | CairoMedium   | CairoBold   |

### Quranic Font

**AmiriQuran** is used for all Quranic Arabic text regardless of UI language.

### Loading Fonts

Fonts are loaded in `app/_layout.tsx`:

```typescript
const [loaded] = useFonts({
  AmiriQuran: AmiriQuran_400Regular,
  Satoshi: require("../assets/fonts/Satoshi-Regular.ttf"),
  SatoshiMedium: require("../assets/fonts/Satoshi-Medium.ttf"),
  SatoshiBold: require("../assets/fonts/Satoshi-Bold.ttf"),
  Cairo: Cairo_400Regular,
  CairoMedium: Cairo_500Medium,
  CairoBold: Cairo_700Bold,
});
```

## Translation Coverage

### Fully Translated Screens

✅ Settings  
✅ Tab Navigation  
✅ Onboarding  
✅ Splash Screen  

### Partially Translated Screens

The following screens have translation keys defined but need component updates:

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

### Translation Keys

Total: **190+ keys** organized by feature:

- `tabs.*` - Tab navigation labels
- `splash.*` - Splash screen
- `onboarding.*` - Onboarding flow
- `home.*` - Home screen
- `chapters.*` - Chapters list
- `bookmarks.*` - Bookmarks
- `settings.*` - Settings screen
- `search.*` - Search functionality
- `qiblah.*` - Qibla direction
- `solah.*` - Prayer times
- `adhkaar.*` - Supplications
- `hijriCalendar.*` - Islamic calendar
- `hifz.*` - Memorization
- `aiChat.*` - AI chat
- `common.*` - Common UI elements

## Best Practices

### 1. Always Use Translation Keys

❌ **Bad:**
```typescript
<Text>Settings</Text>
```

✅ **Good:**
```typescript
<Text>{t("settings.title")}</Text>
```

### 2. Use Appropriate Fonts

❌ **Bad:**
```typescript
<Text style={{ fontFamily: "Satoshi" }}>
  {t("settings.title")}
</Text>
```

✅ **Good:**
```typescript
const fonts = useAppFonts();
<Text style={{ fontFamily: fonts.regular }}>
  {t("settings.title")}
</Text>
```

### 3. Handle RTL Layouts

❌ **Bad:**
```typescript
<View style={{ flexDirection: "row" }}>
  <Icon />
  <Text>{t("label")}</Text>
</View>
```

✅ **Good:**
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

### 4. Use Pluralization

❌ **Bad:**
```typescript
<Text>{count} verse{count !== 1 ? "s" : ""}</Text>
```

✅ **Good:**
```typescript
<Text>{t("chapters.verses", { count })}</Text>
```

## Testing

### Test Language Switching

1. Open Settings
2. Switch to Arabic (العربية)
3. Verify:
   - UI text is in Arabic
   - Layout is RTL
   - Cairo font is used
   - Tab labels are translated
4. Switch back to English
5. Verify UI reverts correctly

### Test RTL Layout

1. Enable Arabic
2. Check all screens for:
   - Proper text alignment (right-aligned)
   - Mirrored flex layouts
   - Icon positions
   - Padding/margins

### Test Font Rendering

1. Verify Cairo font renders Arabic text beautifully
2. Verify AmiriQuran is used for Quranic text
3. Check font weights (Regular, Medium, Bold)

## Troubleshooting

### Language Not Changing

- Check AsyncStorage: `@app_language`
- Verify LanguageProvider is in app tree
- Restart app (RTL changes require restart)

### Fonts Not Loading

- Check font files in `node_modules/@expo-google-fonts/cairo`
- Verify `useFonts` hook in `_layout.tsx`
- Check for font loading errors in console

### RTL Layout Issues

- Use `isRTL` from `useLanguage()`
- Apply `flexDirection: "row-reverse"` conditionally
- Check `I18nManager.isRTL` in native code

### Missing Translations

- Check translation key exists in both `en.ts` and `ar.ts`
- Verify key path is correct (e.g., `settings.title`)
- Check for typos in translation keys

## Future Enhancements

- [ ] Add more languages (Urdu, French, Indonesian, etc.)
- [ ] Implement translation fallback chain
- [ ] Add translation management UI
- [ ] Support dynamic translation loading
- [ ] Add translation validation tests
- [ ] Implement translation memory/cache
- [ ] Add context-aware translations
- [ ] Support regional variants (e.g., ar-SA, ar-EG)

## Resources

- [expo-localization docs](https://docs.expo.dev/versions/latest/sdk/localization/)
- [i18n-js documentation](https://github.com/fnando/i18n-js)
- [Cairo font](https://fonts.google.com/specimen/Cairo)
- [RTL layout guide](https://reactnative.dev/docs/i18nmanager)

---

**Implementation Date:** May 6, 2026  
**Version:** 1.0.0  
**Supported Languages:** English, Arabic (العربية)
