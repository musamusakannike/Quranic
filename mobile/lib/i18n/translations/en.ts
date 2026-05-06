const en = {
  // ── Navigation / Tab labels ──────────────────────────────────────────────
  tabs: {
    home: "Home",
    chapters: "Chapters",
    bookmarks: "Bookmarks",
    settings: "Settings",
  },

  // ── Splash screen ────────────────────────────────────────────────────────
  splash: {
    tagline: "Read, Reflect, and Connect",
  },

  // ── Onboarding ───────────────────────────────────────────────────────────
  onboarding: {
    slides: [
      {
        title: "Welcome to Quranic",
        description:
          "Read, reflect, and connect with the Holy Quran. Immerse yourself in the divine words.",
      },
      {
        title: "Seamless Progress",
        description:
          "Your recitation progress is saved seamlessly. Pick up exactly where you left off.",
      },
      {
        title: "Daily Reminders",
        description:
          "Build a consistent habit with daily reminders tailored to your schedule.",
      },
      {
        title: "Fully Customizable",
        description:
          "Personalize your experience with themes, translations, and transliterations.",
      },
    ],
    continue: "Continue",
    getStarted: "Get Started",
  },

  // ── Home screen ──────────────────────────────────────────────────────────
  home: {
    greeting: "Assalamu alaikum",
    greetingNight: "Night recitation",
    greetingMorning: "Good morning",
    greetingAfternoon: "Good afternoon",
    greetingEvening: "Good evening",
    reminderOff: "Reminder off",
    reminderAt: "Reminder at {{time}}",
    continueReading: "Continue reading",
    startReading: "Start reading",
    positionSaved: "Your position is saved automatically",
    ayah: "Ayah {{verse}}",
    juz: "Juz {{juz}}",
    page: "Pg {{page}}",
    progressLabel: "{{percent}}% through surah",
    resume: "Resume",
    openChapters: "Open chapters",
    quickActions: "Quick Actions",
    quickActionsSubtitle: "Access essential features quickly",
    quickJuz: "Quick Juz",
    quickJuzSubtitle: "Jump to any part of the Quran",
    seeAll: "See all",
    ayahOfDay: "Ayah of the Day",
    surahAyah: "Surah {{name}} · Ayah {{verse}}",
    daily: "Daily",
    readAyah: "Read Ayah",
    allJuz: "All Juz",
    allJuzSubtitle: "30 parts of the Holy Quran",
    juzLabel: "Juz",
    // Quick action cards
    audio: "Audio",
    audioSubtitle: "Listen to reciters",
    chaptersCard: "Chapters",
    chaptersSubtitle: "All surahs",
    qiblah: "Qiblah",
    qiblahSubtitle: "Direction",
    solah: "Solah",
    solahSubtitle: "Prayer times",
    hijri: "Hijri",
    hijriSubtitle: "Islamic calendar",
    adhkaar: "Adhkaar",
    adhkaarSubtitle: "Daily supplications",
    hifz: "Hifz",
    hifzSubtitle: "Memorization suite",
    aiChat: "AI Chat",
    aiChatSubtitle: "Ask about the deen",
  },

  // ── Chapters screen ──────────────────────────────────────────────────────
  chapters: {
    title: "Chapters",
    subtitle: "Explore all 114 surahs with quick filters and instant search.",
    total: "Total",
    mecca: "Mecca",
    madina: "Madina",
    searchPlaceholder: "Search by surah name",
    all: "All",
    chaptersFound_one: "{{count}} chapter found",
    chaptersFound_other: "{{count}} chapters found",
    verses_one: "{{count}} verse",
    verses_other: "{{count}} verses",
  },

  // ── Bookmarks screen ─────────────────────────────────────────────────────
  bookmarks: {
    title: "Bookmarks",
    savedVerses_one: "{{count}} saved verse",
    savedVerses_other: "{{count}} saved verses",
    emptyTitle: "No Bookmarks",
    emptySubtitle:
      "Save your favorite ayahs to read them later. Tap the bookmark icon on any verse.",
    readQuran: "Read Quran",
    surahAyah: "Surah {{name}} • Ayah {{verse}}",
    remove: "Remove",
  },

  // ── Settings screen ──────────────────────────────────────────────────────
  settings: {
    title: "Settings",
    // Appearance
    appearance: "Appearance",
    appearanceSubtitle: "Choose app theme mode",
    themeDevice: "Device",
    themeLight: "Light",
    themeDark: "Dark",
    currentTheme: "Current: {{theme}}",
    // Chapter display
    chapterDisplay: "Chapter display",
    chooseReadingView: "Choose reading view",
    viewList: "List",
    viewVerseByVerse: "Verse by Verse",
    viewMushaf: "Mushaf",
    showTranslations: "Show translations",
    showTranslationsDesc: "Disabled by default",
    showTransliterations: "Show transliterations",
    showTransliterationsDesc: "Latin script under each ayah",
    // Typography
    typography: "Typography",
    arabicTextSize: "Arabic text size",
    translationTextSize: "Translation text size",
    sizeLabel: "{{size}}px",
    // Reminder
    dailyReminder: "Daily Quran reminder",
    dailyReminderSubtitle: "Local notification to recite",
    enableReminder: "Enable reminder",
    enableReminderDesc: "Sends one reminder every day",
    reminderTime: "Reminder time",
    done: "Done",
    // Language
    language: "Language",
    languageSubtitle: "App display language",
    languageEnglish: "English",
    languageArabic: "العربية",
    // Alerts
    permissionRequired: "Permission required",
    notificationPermissionMsg:
      "Please allow notifications from device settings to receive reminders.",
  },

  // ── Search screen ────────────────────────────────────────────────────────
  search: {
    title: "Global Search",
    subtitle:
      "Search across Arabic texts, English translations, and transliterations in milliseconds.",
    placeholder: "Search Quran (Arabic, Translations...)",
    noResults: "No results found",
    noResultsSubtitle:
      'We couldn\'t find anything matching "{{query}}". Try a different keyword.',
    foundVerses_one: "Found {{count}} verse",
    foundVerses_other: "Found {{count}} verses",
    foundVersesPlus: "Found 100+ verses",
    surahAyah: "Surah {{name}} • Ayah {{verse}}",
  },

  // ── Qiblah screen ────────────────────────────────────────────────────────
  qiblah: {
    title: "Qiblah",
    findingDirection: "Finding direction...",
    yourHeading: "Your Heading",
    qiblahLabel: "Qiblah",
    facingQiblah: "You are facing the Qiblah",
    rotateDevice: "Rotate your device until the arrow points up",
    locationDenied: "Permission to access location was denied.",
    locationError: "Could not fetch location or heading.",
  },

  // ── Solah screen ─────────────────────────────────────────────────────────
  solah: {
    title: "Solat Times",
    calculating: "Calculating times...",
    nextPrayer: "NEXT PRAYER",
    reminders: "Solah reminders",
    noReminders: "No daily reminders active",
    remindersActive_one: "{{count}} daily reminder active",
    remindersActive_other: "{{count}} daily reminders active",
    todayTimes: "Today's prayer times",
    todayTimesSubtitle:
      "Toggle any solah to receive a daily local reminder at that time.",
    noReminder: "No reminder",
    locationDenied: "Permission to access location was denied",
    locationError: "Could not fetch location.",
    notificationPermission:
      "Please enable notifications to set daily salah reminders.",
    reminderError: "Could not update this reminder right now.",
    error: "Error",
    // Prayer names
    fajr: "Fajr",
    sunrise: "Sunrise",
    dhuhr: "Dhuhr",
    asr: "Asr",
    maghrib: "Maghrib",
    isha: "Isha",
    // Advance reminder
    advanceReminder: "Advance reminder",
    advanceReminderDesc: "Get notified before the prayer time",
    advanceOff: "Off",
    advanceMin: "{{count}} min",
    advanceNotifTitle: "{{label}} prayer in {{count}} minutes",
    advanceNotifBody: "Prepare for {{label}} — time to make wudu.",
    atTimeNotifTitle: "{{label}} — Time to Pray",
    atTimeNotifBody: "It's time for {{label}} prayer.",
  },

  // ── Adhkaar screen ───────────────────────────────────────────────────────
  adhkaar: {
    title: "Adhkaar",
    introTitle: "Daily Remembrance 🤲",
    introSubtitle:
      "Establish a connection with Allah through these selected authentic supplications.",
    morning: "Morning",
    morningSubtitle: "Supplications for the morning",
    evening: "Evening",
    eveningSubtitle: "Supplications for the evening",
    afterSolah: "After Solaah",
    afterSolahSubtitle: "Supplications after every prayer",
    robbanahs: "40 Robbanahs",
    robbanahsSubtitle: "Supplications from the Holy Quran",
    hisnulMuslim: "Hisnul Muslim",
    hisnulMuslimSubtitle: "Fortress of the Muslim",
  },

  // ── Hijri Calendar screen ────────────────────────────────────────────────
  hijriCalendar: {
    title: "Hijri Calendar",
    subtitle: "Islamic date planner",
    today: "Today",
    jumpToToday: "Jump to Today",
    gregorianDate: "Gregorian Date",
    hijriDate: "Hijri Date",
    selectedDate: "Selected Date",
    islamicEvents: "Islamic Events",
    noEventsThisMonth: "No special events this month",
    weekDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    months: [
      "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani",
      "Jumada al-Ula", "Jumada al-Akhirah", "Rajab", "Sha'ban",
      "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah",
    ],
    events: {
      newYear: "Islamic New Year",
      ashura: "Day of Ashura",
      mawlid: "Mawlid al-Nabi ﷺ",
      israMiraj: "Isra' and Mi'raj",
      shaabanMiddle: "Middle of Sha'ban",
      ramadanStart: "Ramadan Begins",
      laylatAlQadr: "Laylat al-Qadr (27th)",
      eidAlFitr: "Eid al-Fitr",
      eidAlAdha: "Eid al-Adha",
      arafah: "Day of Arafah",
    },
  },

  // ── Hifz screen ──────────────────────────────────────────────────────────
  hifz: {
    title: "Memorization Suite",
    tabLoop: "Loop",
    tabReveal: "Reveal",
    tabProgress: "Progress",
    reciter: "Reciter",
    selectReciter: "Select Reciter",
    selectReciterSubtitle: "Choose your preferred audio",
    surah: "Surah",
    selectSurah: "Select Surah",
    ayahRange: "Ayah Range",
    from: "From",
    to: "To",
    ayahsSelected_one: "{{count}} ayah selected",
    ayahsSelected_other: "{{count}} ayahs selected",
    repetitions: "Repetitions",
    eachAyahRepeats: "Each ayah will repeat {{count}} times",
    startLoop: "Start Loop Session",
    tapToReveal: "Tap to reveal",
    hidden: "Hidden",
    shown: "Shown",
    tapAyahHint: "Tap any ayah to reveal it and test your memory",
    noInternet: "Internet connection required for loop playback.",
    startingLoop: "Starting loop: Ayah {{start}} to {{end}}",
    verses_one: "{{count}} verse",
    verses_other: "{{count}} verses",
  },

  // ── AI Chat screen ───────────────────────────────────────────────────────
  aiChat: {
    title: "Islamic AI",
    subtitle: "Ask about the Deen",
    description:
      "Ask anything about Islam, Quran, Sunnah, or Islamic guidance. Every answer is backed by evidence.",
    placeholder: "Ask an Islamic question...",
    disclaimer:
      "AI responses may contain errors — always verify with a scholar.",
    chatHistory: "Chat History",
    noChatHistory: "No chat history yet",
    deleteChat: "Delete Chat",
    connectionError: "Connection Error",
    connectionErrorMsg:
      "Failed to get a response. Please check your internet connection and try again.",
    messages_one: "{{count}} message",
    messages_other: "{{count}} messages",
    suggestedQuestions: [
      "What does the Quran say about patience?",
      "How do I perform Salah correctly?",
      "What are the pillars of Islam?",
      "Tell me about Surah Al-Fatiha",
    ],
  },

  // ── Not Found screen ─────────────────────────────────────────────────────
  notFound: {
    message: "This screen doesn't exist.",
    goHome: "Go to home screen!",
  },

  // ── Common ───────────────────────────────────────────────────────────────
  common: {
    throughSurah: "{{percent}}% through surah",
    pg: "Pg",
    juz: "Juz",
    surah: "Surah",
    ayah: "Ayah",
    verses: "verses",
    loading: "Loading...",
    error: "Error",
    ok: "OK",
    cancel: "Cancel",
  },

  // ── Chapter detail screen ─────────────────────────────────────────────────
  chapter: {
    notFound: "Chapter not found",
    goBack: "Go back",
    chapters: "Chapters",
    searchPlaceholder: "Search verses in this surah",
    verses_one: "{{count}} verse",
    verses_other: "{{count}} verses",
    readingSettings: "Reading settings",
    readingMode: "Reading mode",
    modeList: "List",
    modeVerse: "Verse",
    modeMushaf: "Mushaf",
    showTranslations: "Show translations",
    showTranslationsDesc: "English translation under ayah",
    showTransliterations: "Show transliterations",
    showTransliterationsDesc: "Latin transliteration under ayah",
    arabicTextSize: "Arabic text size",
    translationTextSize: "Translation text size",
    done: "Done",
    sajda: "Sajda",
    juzLabel: "Juz {{juz}}",
    pageLabel: "Page {{page}}",
    bookmark: "Bookmark",
    bookmarked: "Bookmarked",
    copy: "Copy",
    share: "Share",
    previous: "Previous",
    next: "Next",
    noVersesFound: "No verses found.",
    copiedTitle: "Copied",
    copiedMsg: "Ayah {{verse}} copied to clipboard.",
    pageDisplay: "Page {{page}}",
    nowPlaying: "Now Playing",
    readAlong: "Read Along",
    verseByVerse: "Verse by verse",
  },

  // ── Hifz screen (extra keys) ──────────────────────────────────────────────
  hifzExtra: {
    loopMode: "Loop Mode",
    hideReveal: "Hide & Reveal",
    memorized: "Memorized",
    learning: "Learning",
    overallProgress: "Overall Progress",
    bySurah: "BY SURAH",
    noHifzTitle: "No Hifz started yet",
    noHifzSubtitle: "Use the Hide & Reveal tab to mark ayahs as memorized",
    memorizedVerses: "Memorized Verses",
    learningVerses: "Learning Verses",
    howTracked: "How your progress is tracked",
    gotIt: "Got it",
    resetTitle: "Reset {{name}}",
    resetMsg: "This will clear all memorization data for this Surah. Are you sure?",
    reset: "Reset",
    cancel: "Cancel",
    ofQuran: "% of Quran",
    totalLabel: "total",
    memorizedLabel: "memorized",
    learningLabel: "learning",
  },

  // ── Audio screens ─────────────────────────────────────────────────────────
  audio: {
    browseReciters: "Browse Reciters",
    reciters: "Reciters",
    chapterReciters: "Chapter Reciters",
    verseByVerse: "Verse-by-Verse",
    searchReciters: "Search Reciters...",
    recitersFound_one: "{{count}} reciter found",
    recitersFound_other: "{{count}} reciters found",
    selectSurah: "Select a Surah to listen to this reciter.",
    selectSurahVerse: "Select a Surah to listen verse-by-verse with read-along.",
    searchSurahs: "Search Surahs...",
    surahsFound_one: "{{count}} surah found",
    surahsFound_other: "{{count}} surahs found",
    playNext: "Play Next",
    filters: "Filters",
    filtersReset: "Reset",
    riwayat: "Riwayat (Narration)",
    moshaf: "Moshaf (Style)",
    all: "All",
    murattal: "Murattal",
    mujawwad: "Mujawwad",
    teaching: "Teaching",
    verseByVerseLabel: "Verse-by-verse recitation",
    nowPlaying: "Now Playing",
    readAlong: "Read Along",
    upNext: "Up Next",
    queueEmpty: "Queue is empty",
    loadingVerses: "Loading verses…",
  },
};

export default en;
export type TranslationKeys = typeof en;
