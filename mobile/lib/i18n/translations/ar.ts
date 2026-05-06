const ar = {
  // ── Navigation / Tab labels ──────────────────────────────────────────────
  tabs: {
    home: "الرئيسية",
    chapters: "السور",
    bookmarks: "المفضلة",
    settings: "الإعدادات",
  },

  // ── Splash screen ────────────────────────────────────────────────────────
  splash: {
    tagline: "اقرأ، تأمل، وتواصل",
  },

  // ── Onboarding ───────────────────────────────────────────────────────────
  onboarding: {
    slides: [
      {
        title: "مرحباً بك في قرآنيك",
        description:
          "اقرأ وتأمل وتواصل مع القرآن الكريم. انغمس في الكلمات الإلهية.",
      },
      {
        title: "تقدم سلس",
        description:
          "يتم حفظ تقدم تلاوتك بسلاسة. استأنف من حيث توقفت تماماً.",
      },
      {
        title: "تذكيرات يومية",
        description:
          "ابنِ عادة منتظمة مع تذكيرات يومية مخصصة لجدولك.",
      },
      {
        title: "قابل للتخصيص الكامل",
        description:
          "خصص تجربتك مع السمات والترجمات والنطق.",
      },
    ],
    continue: "متابعة",
    getStarted: "ابدأ الآن",
  },

  // ── Home screen ──────────────────────────────────────────────────────────
  home: {
    greeting: "السلام عليكم",
    greetingNight: "تلاوة الليل",
    greetingMorning: "صباح الخير",
    greetingAfternoon: "مساء الخير",
    greetingEvening: "مساء الخير",
    reminderOff: "التذكير متوقف",
    reminderAt: "تذكير في {{time}}",
    continueReading: "متابعة القراءة",
    startReading: "ابدأ القراءة",
    positionSaved: "يتم حفظ موضعك تلقائياً",
    ayah: "آية {{verse}}",
    juz: "جزء {{juz}}",
    page: "ص {{page}}",
    progressLabel: "{{percent}}٪ من السورة",
    resume: "استئناف",
    openChapters: "فتح السور",
    quickActions: "الإجراءات السريعة",
    quickActionsSubtitle: "الوصول السريع للميزات الأساسية",
    quickJuz: "الأجزاء السريعة",
    quickJuzSubtitle: "انتقل إلى أي جزء من القرآن",
    seeAll: "عرض الكل",
    ayahOfDay: "آية اليوم",
    surahAyah: "سورة {{name}} · آية {{verse}}",
    daily: "يومي",
    readAyah: "اقرأ الآية",
    allJuz: "جميع الأجزاء",
    allJuzSubtitle: "٣٠ جزءاً من القرآن الكريم",
    juzLabel: "جزء",
    // Quick action cards
    audio: "الصوت",
    audioSubtitle: "استمع إلى القراء",
    chaptersCard: "السور",
    chaptersSubtitle: "جميع السور",
    qiblah: "القبلة",
    qiblahSubtitle: "الاتجاه",
    solah: "الصلاة",
    solahSubtitle: "أوقات الصلاة",
    hijri: "الهجري",
    hijriSubtitle: "التقويم الإسلامي",
    adhkaar: "الأذكار",
    adhkaarSubtitle: "الأذكار اليومية",
    hifz: "الحفظ",
    hifzSubtitle: "مجموعة الحفظ",
    aiChat: "المحادثة الذكية",
    aiChatSubtitle: "اسأل عن الدين",
  },

  // ── Chapters screen ──────────────────────────────────────────────────────
  chapters: {
    title: "السور",
    subtitle: "استكشف جميع السور الـ١١٤ مع فلاتر سريعة وبحث فوري.",
    total: "الإجمالي",
    mecca: "مكية",
    madina: "مدنية",
    searchPlaceholder: "ابحث باسم السورة",
    all: "الكل",
    chaptersFound_one: "{{count}} سورة وجدت",
    chaptersFound_other: "{{count}} سور وجدت",
    verses_one: "{{count}} آية",
    verses_other: "{{count}} آيات",
  },

  // ── Bookmarks screen ─────────────────────────────────────────────────────
  bookmarks: {
    title: "المفضلة",
    savedVerses_one: "{{count}} آية محفوظة",
    savedVerses_other: "{{count}} آيات محفوظة",
    emptyTitle: "لا توجد مفضلة",
    emptySubtitle:
      "احفظ آياتك المفضلة لقراءتها لاحقاً. اضغط على أيقونة المفضلة على أي آية.",
    readQuran: "اقرأ القرآن",
    surahAyah: "سورة {{name}} • آية {{verse}}",
    remove: "إزالة",
  },

  // ── Settings screen ──────────────────────────────────────────────────────
  settings: {
    title: "الإعدادات",
    // Appearance
    appearance: "المظهر",
    appearanceSubtitle: "اختر وضع مظهر التطبيق",
    themeDevice: "الجهاز",
    themeLight: "فاتح",
    themeDark: "داكن",
    currentTheme: "الحالي: {{theme}}",
    // Chapter display
    chapterDisplay: "عرض السورة",
    chooseReadingView: "اختر طريقة القراءة",
    viewList: "قائمة",
    viewVerseByVerse: "آية بآية",
    viewMushaf: "مصحف",
    showTranslations: "إظهار الترجمة",
    showTranslationsDesc: "معطل افتراضياً",
    showTransliterations: "إظهار النطق",
    showTransliterationsDesc: "الكتابة اللاتينية تحت كل آية",
    // Typography
    typography: "الخطوط",
    arabicTextSize: "حجم النص العربي",
    translationTextSize: "حجم نص الترجمة",
    sizeLabel: "{{size}} بكسل",
    // Reminder
    dailyReminder: "تذكير القرآن اليومي",
    dailyReminderSubtitle: "إشعار محلي للتلاوة",
    enableReminder: "تفعيل التذكير",
    enableReminderDesc: "يرسل تذكيراً واحداً كل يوم",
    reminderTime: "وقت التذكير",
    done: "تم",
    // Language
    language: "اللغة",
    languageSubtitle: "لغة عرض التطبيق",
    languageEnglish: "English",
    languageArabic: "العربية",
    // Alerts
    permissionRequired: "الإذن مطلوب",
    notificationPermissionMsg:
      "يرجى السماح بالإشعارات من إعدادات الجهاز لتلقي التذكيرات.",
  },

  // ── Search screen ────────────────────────────────────────────────────────
  search: {
    title: "البحث الشامل",
    subtitle:
      "ابحث في النصوص العربية والترجمات الإنجليزية والنطق في ثوانٍ.",
    placeholder: "ابحث في القرآن (عربي، ترجمات...)",
    noResults: "لا توجد نتائج",
    noResultsSubtitle:
      'لم نجد شيئاً يطابق "{{query}}". جرب كلمة مختلفة.',
    foundVerses_one: "وجدت {{count}} آية",
    foundVerses_other: "وجدت {{count}} آيات",
    foundVersesPlus: "وجدت أكثر من ١٠٠ آية",
    surahAyah: "سورة {{name}} • آية {{verse}}",
  },

  // ── Qiblah screen ────────────────────────────────────────────────────────
  qiblah: {
    title: "القبلة",
    findingDirection: "جارٍ تحديد الاتجاه...",
    yourHeading: "اتجاهك",
    qiblahLabel: "القبلة",
    facingQiblah: "أنت تواجه القبلة",
    rotateDevice: "أدر جهازك حتى يشير السهم للأعلى",
    locationDenied: "تم رفض إذن الوصول إلى الموقع.",
    locationError: "تعذر جلب الموقع أو الاتجاه.",
  },

  // ── Solah screen ─────────────────────────────────────────────────────────
  solah: {
    title: "أوقات الصلاة",
    calculating: "جارٍ حساب الأوقات...",
    nextPrayer: "الصلاة القادمة",
    reminders: "تذكيرات الصلاة",
    noReminders: "لا توجد تذكيرات يومية نشطة",
    remindersActive_one: "{{count}} تذكير يومي نشط",
    remindersActive_other: "{{count}} تذكيرات يومية نشطة",
    todayTimes: "أوقات الصلاة اليوم",
    todayTimesSubtitle:
      "فعّل أي صلاة لتلقي تذكير يومي محلي في ذلك الوقت.",
    noReminder: "لا تذكير",
    locationDenied: "تم رفض إذن الوصول إلى الموقع",
    locationError: "تعذر جلب الموقع.",
    notificationPermission:
      "يرجى تفعيل الإشعارات لضبط تذكيرات الصلاة اليومية.",
    reminderError: "تعذر تحديث هذا التذكير الآن.",
    error: "خطأ",
    // Prayer names
    fajr: "الفجر",
    sunrise: "الشروق",
    dhuhr: "الظهر",
    asr: "العصر",
    maghrib: "المغرب",
    isha: "العشاء",
  },

  // ── Adhkaar screen ───────────────────────────────────────────────────────
  adhkaar: {
    title: "الأذكار",
    introTitle: "الذكر اليومي 🤲",
    introSubtitle:
      "أقم صلة بالله من خلال هذه الأذكار الصحيحة المختارة.",
    morning: "الصباح",
    morningSubtitle: "أذكار الصباح",
    evening: "المساء",
    eveningSubtitle: "أذكار المساء",
    afterSolah: "بعد الصلاة",
    afterSolahSubtitle: "أذكار بعد كل صلاة",
    robbanahs: "٤٠ ربنا",
    robbanahsSubtitle: "أدعية من القرآن الكريم",
    hisnulMuslim: "حصن المسلم",
    hisnulMuslimSubtitle: "حصن المسلم",
  },

  // ── Hijri Calendar screen ────────────────────────────────────────────────
  hijriCalendar: {
    title: "التقويم الهجري",
    subtitle: "مخطط التاريخ الإسلامي",
    today: "اليوم",
    weekDays: ["أحد", "اثن", "ثلا", "أرب", "خمي", "جمع", "سبت"],
  },

  // ── Hifz screen ──────────────────────────────────────────────────────────
  hifz: {
    title: "مجموعة الحفظ",
    tabLoop: "تكرار",
    tabReveal: "كشف",
    tabProgress: "التقدم",
    reciter: "القارئ",
    selectReciter: "اختر القارئ",
    selectReciterSubtitle: "اختر الصوت المفضل لديك",
    surah: "السورة",
    selectSurah: "اختر السورة",
    ayahRange: "نطاق الآيات",
    from: "من",
    to: "إلى",
    ayahsSelected_one: "{{count}} آية محددة",
    ayahsSelected_other: "{{count}} آيات محددة",
    repetitions: "التكرارات",
    eachAyahRepeats: "ستتكرر كل آية {{count}} مرات",
    startLoop: "ابدأ جلسة التكرار",
    tapToReveal: "اضغط للكشف",
    hidden: "مخفي",
    shown: "مكشوف",
    tapAyahHint: "اضغط على أي آية للكشف عنها واختبار ذاكرتك",
    noInternet: "مطلوب اتصال بالإنترنت لتشغيل التكرار.",
    startingLoop: "بدء التكرار: آية {{start}} إلى {{end}}",
    verses_one: "{{count}} آية",
    verses_other: "{{count}} آيات",
  },

  // ── AI Chat screen ───────────────────────────────────────────────────────
  aiChat: {
    title: "الذكاء الاصطناعي الإسلامي",
    subtitle: "اسأل عن الدين",
    description:
      "اسأل عن أي شيء يتعلق بالإسلام والقرآن والسنة والإرشاد الإسلامي. كل إجابة مدعومة بالدليل.",
    placeholder: "اطرح سؤالاً إسلامياً...",
    disclaimer:
      "قد تحتوي ردود الذكاء الاصطناعي على أخطاء — تحقق دائماً مع عالم.",
    chatHistory: "سجل المحادثات",
    noChatHistory: "لا يوجد سجل محادثات بعد",
    deleteChat: "حذف المحادثة",
    connectionError: "خطأ في الاتصال",
    connectionErrorMsg:
      "فشل في الحصول على رد. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.",
    messages_one: "{{count}} رسالة",
    messages_other: "{{count}} رسائل",
    suggestedQuestions: [
      "ماذا يقول القرآن عن الصبر؟",
      "كيف أؤدي الصلاة بشكل صحيح؟",
      "ما هي أركان الإسلام؟",
      "أخبرني عن سورة الفاتحة",
    ],
  },

  // ── Not Found screen ─────────────────────────────────────────────────────
  notFound: {
    message: "هذه الشاشة غير موجودة.",
    goHome: "الذهاب إلى الشاشة الرئيسية!",
  },

  // ── Common ───────────────────────────────────────────────────────────────
  common: {
    throughSurah: "{{percent}}٪ من السورة",
    pg: "ص",
    juz: "جزء",
    surah: "سورة",
    ayah: "آية",
    verses: "آيات",
    loading: "جارٍ التحميل...",
    error: "خطأ",
    ok: "موافق",
    cancel: "إلغاء",
  },
};

export default ar;
