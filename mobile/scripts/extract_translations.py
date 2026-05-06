#!/usr/bin/env python3
"""
Script to extract all hardcoded text strings from the Quranic app
for translation purposes. Outputs a structured list of all UI strings.
"""

import re
import os
import json
from pathlib import Path

# Files to scan
SCAN_FILES = [
    "app/(tabs)/index.tsx",
    "app/(tabs)/settings.tsx",
    "app/(tabs)/chapters.tsx",
    "app/(tabs)/bookmarks.tsx",
    "app/(tabs)/ai-chat.tsx",
    "app/(tabs)/_layout.tsx",
    "app/index.tsx",
    "app/onboarding.tsx",
    "app/search.tsx",
    "app/qiblah.tsx",
    "app/solah.tsx",
    "app/adhkaar.tsx",
    "app/hijri-calendar.tsx",
    "app/hifz.tsx",
    "app/not-found.tsx",
]

# Patterns to extract text from JSX
PATTERNS = [
    # Text inside <Text> tags
    r'<Text[^>]*>\s*([A-Za-z][^<{}\n]{2,}?)\s*</Text>',
    # String literals in JSX expressions
    r'(?:title|label|subtitle|placeholder|description|text|message|body)\s*[:=]\s*["\']([A-Za-z][^"\']{2,}?)["\']',
    # Alert messages
    r'Alert\.alert\(\s*["\']([^"\']+)["\']',
    # showToast calls
    r'showToast\(["\']([^"\']+)["\']',
]

def extract_strings_from_file(filepath):
    """Extract all text strings from a TSX file."""
    strings = set()
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"  WARNING: File not found: {filepath}")
        return strings
    
    # Extract strings from JSX Text components
    # Match content between <Text ...> and </Text>
    text_pattern = re.compile(r'<Text[^>]*>\s*\n?\s*([A-Za-z][^\n<{]*[A-Za-z0-9!?.])\s*\n?\s*</Text>', re.MULTILINE)
    for match in text_pattern.finditer(content):
        text = match.group(1).strip()
        if len(text) > 2 and not text.startswith('//') and not text.startswith('*'):
            strings.add(text)
    
    # Extract from string literals used as labels/titles
    label_pattern = re.compile(r'(?:title|label|subtitle|placeholder|description|text|message|body|name)\s*:\s*["\']([A-Za-z][^"\']{2,}?)["\']')
    for match in label_pattern.finditer(content):
        text = match.group(1).strip()
        if len(text) > 2:
            strings.add(text)
    
    # Extract Alert messages
    alert_pattern = re.compile(r'Alert\.alert\(\s*["\']([^"\']+)["\'](?:\s*,\s*["\']([^"\']+)["\'])?')
    for match in alert_pattern.finditer(content):
        strings.add(match.group(1).strip())
        if match.group(2):
            strings.add(match.group(2).strip())
    
    # Extract showToast messages
    toast_pattern = re.compile(r'showToast\(["\']([^"\']+)["\']')
    for match in toast_pattern.finditer(content):
        strings.add(match.group(1).strip())
    
    return strings

def main():
    base_dir = Path(__file__).parent.parent
    
    all_strings = {}
    
    print("=" * 60)
    print("QURANIC APP - TEXT STRING EXTRACTION")
    print("=" * 60)
    
    for rel_path in SCAN_FILES:
        filepath = base_dir / rel_path
        strings = extract_strings_from_file(filepath)
        
        if strings:
            all_strings[rel_path] = sorted(strings)
            print(f"\n📄 {rel_path} ({len(strings)} strings):")
            for s in sorted(strings):
                print(f"   • {s}")
    
    # Collect all unique strings
    unique_strings = set()
    for strings in all_strings.values():
        unique_strings.update(strings)
    
    print("\n" + "=" * 60)
    print(f"TOTAL UNIQUE STRINGS: {len(unique_strings)}")
    print("=" * 60)
    
    # Generate translation template
    translations_en = {}
    translations_ar = {}
    
    # Manually curated translations based on the app content
    MANUAL_TRANSLATIONS = {
        # Navigation / Tab labels
        "Home": "الرئيسية",
        "Chapters": "السور",
        "Bookmarks": "المفضلة",
        "Settings": "الإعدادات",
        
        # Home screen
        "Assalamu alaikum": "السلام عليكم",
        "Night recitation": "تلاوة الليل",
        "Good morning": "صباح الخير",
        "Good afternoon": "مساء الخير",
        "Good evening": "مساء الخير",
        "Reminder off": "التذكير متوقف",
        "Continue reading": "متابعة القراءة",
        "Start reading": "ابدأ القراءة",
        "Your position is saved automatically": "يتم حفظ موضعك تلقائياً",
        "Resume": "استئناف",
        "Open chapters": "فتح السور",
        "Quick Actions": "الإجراءات السريعة",
        "Access essential features quickly": "الوصول السريع للميزات الأساسية",
        "Quick Juz": "الأجزاء السريعة",
        "Jump to any part of the Quran": "انتقل إلى أي جزء من القرآن",
        "See all": "عرض الكل",
        "Ayah of the Day": "آية اليوم",
        "Daily": "يومي",
        "Read Ayah": "اقرأ الآية",
        "All Juz": "جميع الأجزاء",
        "30 parts of the Holy Quran": "٣٠ جزءاً من القرآن الكريم",
        "Juz": "جزء",
        
        # Quick action cards
        "Audio": "الصوت",
        "Listen to reciters": "استمع إلى القراء",
        "All surahs": "جميع السور",
        "Qiblah": "القبلة",
        "Direction": "الاتجاه",
        "Solah": "الصلاة",
        "Prayer times": "أوقات الصلاة",
        "Hijri": "الهجري",
        "Islamic calendar": "التقويم الإسلامي",
        "Adhkaar": "الأذكار",
        "Daily supplications": "الأذكار اليومية",
        "Hifz": "الحفظ",
        "Memorization suite": "مجموعة الحفظ",
        "AI Chat": "المحادثة الذكية",
        "Ask about the deen": "اسأل عن الدين",
        
        # Settings screen
        "Appearance": "المظهر",
        "Choose app theme mode": "اختر وضع مظهر التطبيق",
        "Device": "الجهاز",
        "Light": "فاتح",
        "Dark": "داكن",
        "Current": "الحالي",
        "Chapter display": "عرض السورة",
        "Choose reading view": "اختر طريقة القراءة",
        "List": "قائمة",
        "Verse by Verse": "آية بآية",
        "Mushaf": "مصحف",
        "Show translations": "إظهار الترجمة",
        "Disabled by default": "معطل افتراضياً",
        "Show transliterations": "إظهار النطق",
        "Latin script under each ayah": "الكتابة اللاتينية تحت كل آية",
        "Typography": "الخطوط",
        "Arabic text size": "حجم النص العربي",
        "Translation text size": "حجم نص الترجمة",
        "Daily Quran reminder": "تذكير القرآن اليومي",
        "Local notification to recite": "إشعار محلي للتلاوة",
        "Enable reminder": "تفعيل التذكير",
        "Sends one reminder every day": "يرسل تذكيراً واحداً كل يوم",
        "Reminder time": "وقت التذكير",
        "Done": "تم",
        "Language": "اللغة",
        "App language": "لغة التطبيق",
        "English": "الإنجليزية",
        "Arabic": "العربية",
        "Permission required": "الإذن مطلوب",
        "Please allow notifications from device settings to receive reminders.": "يرجى السماح بالإشعارات من إعدادات الجهاز لتلقي التذكيرات.",
        
        # Chapters screen
        "Explore all 114 surahs with quick filters and instant search.": "استكشف جميع السور الـ١١٤ مع فلاتر سريعة وبحث فوري.",
        "Total": "الإجمالي",
        "Mecca": "مكية",
        "Madina": "مدنية",
        "Search by surah name": "ابحث باسم السورة",
        "All": "الكل",
        "chapter found": "سورة وجدت",
        "chapters found": "سور وجدت",
        "verses": "آيات",
        "verse": "آية",
        
        # Bookmarks screen
        "No Bookmarks": "لا توجد مفضلة",
        "Save your favorite ayahs to read them later. Tap the bookmark icon on any verse.": "احفظ آياتك المفضلة لقراءتها لاحقاً. اضغط على أيقونة المفضلة على أي آية.",
        "Read Quran": "اقرأ القرآن",
        "saved verse": "آية محفوظة",
        "saved verses": "آيات محفوظة",
        "Remove": "إزالة",
        "Surah": "سورة",
        "Ayah": "آية",
        
        # Search screen
        "Global Search": "البحث الشامل",
        "Search across Arabic texts, English translations, and transliterations in milliseconds.": "ابحث في النصوص العربية والترجمات الإنجليزية والنطق في ثوانٍ.",
        "Search Quran (Arabic, Translations...)": "ابحث في القرآن (عربي، ترجمات...)",
        "No results found": "لا توجد نتائج",
        "Found": "وجد",
        "verses": "آيات",
        
        # Qiblah screen
        "Finding direction...": "جارٍ تحديد الاتجاه...",
        "Your Heading": "اتجاهك",
        "You are facing the Qiblah": "أنت تواجه القبلة",
        "Rotate your device until the arrow points up": "أدر جهازك حتى يشير السهم للأعلى",
        "Permission to access location was denied.": "تم رفض إذن الوصول إلى الموقع.",
        "Could not fetch location or heading.": "تعذر جلب الموقع أو الاتجاه.",
        
        # Solah screen
        "Solat Times": "أوقات الصلاة",
        "Calculating times...": "جارٍ حساب الأوقات...",
        "NEXT PRAYER": "الصلاة القادمة",
        "Solah reminders": "تذكيرات الصلاة",
        "No daily reminders active": "لا توجد تذكيرات يومية نشطة",
        "daily reminder active": "تذكير يومي نشط",
        "daily reminders active": "تذكيرات يومية نشطة",
        "Today's prayer times": "أوقات الصلاة اليوم",
        "Toggle any solah to receive a daily local reminder at that time.": "فعّل أي صلاة لتلقي تذكير يومي محلي في ذلك الوقت.",
        "No reminder": "لا تذكير",
        "Fajr": "الفجر",
        "Sunrise": "الشروق",
        "Dhuhr": "الظهر",
        "Asr": "العصر",
        "Maghrib": "المغرب",
        "Isha": "العشاء",
        "Permission to access location was denied": "تم رفض إذن الوصول إلى الموقع",
        "Could not fetch location.": "تعذر جلب الموقع.",
        "Please enable notifications to set daily salah reminders.": "يرجى تفعيل الإشعارات لضبط تذكيرات الصلاة اليومية.",
        "Could not update this reminder right now.": "تعذر تحديث هذا التذكير الآن.",
        "Error": "خطأ",
        
        # Adhkaar screen
        "Daily Remembrance 🤲": "الذكر اليومي 🤲",
        "Establish a connection with Allah through these selected authentic supplications.": "أقم صلة بالله من خلال هذه الأذكار الصحيحة المختارة.",
        "Morning": "الصباح",
        "Supplications for the morning": "أذكار الصباح",
        "Evening": "المساء",
        "Supplications for the evening": "أذكار المساء",
        "After Solaah": "بعد الصلاة",
        "Supplications after every prayer": "أذكار بعد كل صلاة",
        "40 Robbanahs": "٤٠ ربنا",
        "Supplications from the Holy Quran": "أدعية من القرآن الكريم",
        "Hisnul Muslim": "حصن المسلم",
        "Fortress of the Muslim": "حصن المسلم",
        
        # Hijri Calendar screen
        "Hijri Calendar": "التقويم الهجري",
        "Islamic date planner": "مخطط التاريخ الإسلامي",
        "Today": "اليوم",
        "Sun": "أحد",
        "Mon": "اثن",
        "Tue": "ثلا",
        "Wed": "أرب",
        "Thu": "خمي",
        "Fri": "جمع",
        "Sat": "سبت",
        
        # Hifz screen
        "Reciter": "القارئ",
        "Select Reciter": "اختر القارئ",
        "Choose your preferred audio": "اختر الصوت المفضل لديك",
        "Select Surah": "اختر السورة",
        "Ayah Range": "نطاق الآيات",
        "From": "من",
        "To": "إلى",
        "Repetitions": "التكرارات",
        "Start Loop Session": "ابدأ جلسة التكرار",
        "ayah selected": "آية محددة",
        "ayahs selected": "آيات محددة",
        "Each ayah will repeat": "ستتكرر كل آية",
        "times": "مرات",
        "Tap to reveal": "اضغط للكشف",
        "Hidden": "مخفي",
        "Shown": "مكشوف",
        "Tap any ayah to reveal it and test your memory": "اضغط على أي آية للكشف عنها واختبار ذاكرتك",
        "Loop": "تكرار",
        "Reveal": "كشف",
        "Progress": "التقدم",
        "Memorization Suite": "مجموعة الحفظ",
        "Internet connection required for loop playback.": "مطلوب اتصال بالإنترنت لتشغيل التكرار.",
        
        # Onboarding screen
        "Welcome to Quranic": "مرحباً بك في قرآنيك",
        "Read, reflect, and connect with the Holy Quran. Immerse yourself in the divine words.": "اقرأ وتأمل وتواصل مع القرآن الكريم. انغمس في الكلمات الإلهية.",
        "Seamless Progress": "تقدم سلس",
        "Your recitation progress is saved seamlessly. Pick up exactly where you left off.": "يتم حفظ تقدم تلاوتك بسلاسة. استأنف من حيث توقفت تماماً.",
        "Daily Reminders": "تذكيرات يومية",
        "Build a consistent habit with daily reminders tailored to your schedule.": "ابنِ عادة منتظمة مع تذكيرات يومية مخصصة لجدولك.",
        "Fully Customizable": "قابل للتخصيص الكامل",
        "Personalize your experience with themes, translations, and transliterations.": "خصص تجربتك مع السمات والترجمات والنطق.",
        "Continue": "متابعة",
        "Get Started": "ابدأ الآن",
        
        # Splash screen
        "Read, Reflect, and Connect": "اقرأ، تأمل، وتواصل",
        
        # AI Chat screen
        "Islamic AI": "الذكاء الاصطناعي الإسلامي",
        "Ask about the Deen": "اسأل عن الدين",
        "Ask anything about Islam, Quran, Sunnah, or Islamic guidance. Every answer is backed by evidence.": "اسأل عن أي شيء يتعلق بالإسلام والقرآن والسنة والإرشاد الإسلامي. كل إجابة مدعومة بالدليل.",
        "Ask an Islamic question...": "اطرح سؤالاً إسلامياً...",
        "AI responses may contain errors — always verify with a scholar.": "قد تحتوي ردود الذكاء الاصطناعي على أخطاء — تحقق دائماً مع عالم.",
        "Chat History": "سجل المحادثات",
        "No chat history yet": "لا يوجد سجل محادثات بعد",
        "Delete Chat": "حذف المحادثة",
        "Connection Error": "خطأ في الاتصال",
        "Failed to get a response. Please check your internet connection and try again.": "فشل في الحصول على رد. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.",
        
        # Not found
        "This screen doesn't exist.": "هذه الشاشة غير موجودة.",
        "Go to home screen!": "الذهاب إلى الشاشة الرئيسية!",
        
        # Common
        "through surah": "من السورة",
        "Pg": "ص",
    }
    
    print("\n" + "=" * 60)
    print("TRANSLATION TEMPLATE (en/ar)")
    print("=" * 60)
    
    output = {
        "en": {},
        "ar": {}
    }
    
    for key, ar_value in MANUAL_TRANSLATIONS.items():
        output["en"][key] = key
        output["ar"][key] = ar_value
    
    print(json.dumps(output, ensure_ascii=False, indent=2))
    
    # Save to file
    output_path = base_dir / "lib" / "translations_extracted.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Saved to: {output_path}")
    print(f"📊 Total translation keys: {len(MANUAL_TRANSLATIONS)}")

if __name__ == "__main__":
    main()
