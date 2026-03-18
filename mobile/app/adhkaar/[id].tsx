import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "../../lib/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, CheckCircle2, RotateCcw } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

const MORNING_ADHKAAR = [
  {
    "title": "Ayat al-Kursi",
    "arabic": "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَؤُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ",
    "transliteration": "Allahu la ilaha illa Huwa, Al-Hayyul-Qayyum. La ta'khudhuhu sinatun wa la nawm. Lahu ma fis-samawati wa ma fil-ard. Man dhal-ladhi yashfa'u 'indahu illa bi-idhnih? Ya'lamu ma bayna aydihim wa ma khalfahum, wa la yuhituna bishay'im-min 'ilmihi illa bima sha'. Wasi'a kursiyyuhus-samawati wal-ard, wa la ya'uduhu hifzhuhuma, wa Huwal-'Aliyyul-'Azhim.",
    "translation": "Allah! There is no god but He, the Living, the Self-Subsisting, Eternal. No slumber can seize Him nor sleep. His are all things in the heavens and on earth. Who is there can intercede in His presence except as He permitteth? He knoweth what (appeareth to His creatures as) before or after or behind them. Nor shall they compass aught of His knowledge except as He willeth. His Throne doth extend over the heavens and the earth, and He feeleth no fatigue in guarding and preserving them for He is the Most High, the Supreme (in glory).",
    "count": 1,
    "evidence": "Whoever says this when he rises in the morning will be protected from jinns until he retires in the evening. (Al-Hakim 1/562, Sahih Al-Targhib wat-Tarhib 1/273)"
  },
  {
    "title": "The Three Protectors (Al-Mu'awwidhat)",
    "arabic": "بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ. قُلْ هُوَ اللهُ أَحَدٌ... (Surah Al-Ikhlas, Al-Falaq, An-Nas)",
    "transliteration": "Qul Huwallahu Ahad... Qul A'udhu bi Rabbil-Falaq... Qul A'udhu bi Rabbin-Nas...",
    "translation": "Say: He is Allah, the One... Say: I seek refuge with the Lord of the Dawn... Say: I seek refuge with the Lord of Mankind...",
    "count": 3,
    "evidence": "Whoever recites these three times in the morning and in the evening, they will suffice him against everything. (Abu Dawud 4/322, At-Tirmidhi 5/567)"
  },
  {
    "title": "Sayyidul Istighfar (Master of Forgiveness)",
    "arabic": "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
    "transliteration": "Allahumma Anta Rabbi la ilaha illa Anta, khalaqtani wa ana 'abduka, wa ana 'ala 'ahdika wa wa'dika mastata'tu, a'udhu bika min sharri ma sana'tu, abu'u laka bini'matika 'alayya, wa abu'u bidhanbi faghfir li fa-innahu la yaghfirudh-dhunuba illa Anta.",
    "translation": "O Allah, You are my Lord, there is no god but You. You created me and I am Your slave, and I am faithful to Your covenant and my promise to You as much as I am able. I seek refuge in You from the evil of what I have done. I acknowledge Your favor upon me and I acknowledge my sin, so forgive me, for no one forgives sins except You.",
    "count": 1,
    "evidence": "If someone recites this during the day with firm faith and dies on the same day before evening, he will be from the people of Paradise. (Al-Bukhari 7/150)"
  },
  {
    "title": "Protection from Sudden Harm",
    "arabic": "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
    "transliteration": "Bismillahil-ladhi la yadurru ma'as-mihi shay'un fil-ardi wa la fis-sama'i wa Huwas-Sami'ul-'Alim.",
    "translation": "In the Name of Allah, Who with His Name nothing can cause harm in the earth nor in the heavens, and He is the All-Hearing, the All-Knowing.",
    "count": 3,
    "evidence": "Whoever recites it three times in the morning will not be afflicted by any sudden calamity until evening. (Abu Dawud 4/323, At-Tirmidhi 5/465)"
  },
  {
    "title": "Contentment with Faith",
    "arabic": "رَضِيتُ بِاللَّهِ رَبَّاً، وَبِالْإِسْلَامِ دِيناً، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيّاً",
    "transliteration": "Raditu billahi Rabban, wa bil-Islami dinan, wa bi Muhammadin (sallallahu 'alayhi wa sallam) Nabiyyan.",
    "translation": "I am pleased with Allah as my Lord, Islam as my religion, and Muhammad (peace and blessings of Allah be upon him) as my Prophet.",
    "count": 3,
    "evidence": "Allah has promised that anyone who says this three times every morning and evening will be pleased on the Day of Resurrection. (Ahmad 4/337, At-Tirmidhi 5/465)"
  },
  {
    "title": "Glorification and Praise",
    "arabic": "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    "transliteration": "Subhanallahi wa bihamdihi.",
    "translation": "Glory is to Allah and praise is to Him.",
    "count": 100,
    "evidence": "Whoever says this one hundred times in the morning and evening, none will come on the Day of Resurrection with anything better except one who has said the same or more. (Muslim 4/2071)"
  }
];

const EVENING_ADHKAAR = [
  {
    "title": "Ayat al-Kursi",
    "arabic": "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَؤُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ",
    "transliteration": "Allahu la ilaha illa Huwa, Al-Hayyul-Qayyum. La ta'khudhuhu sinatun wa la nawm. Lahu ma fis-samawati wa ma fil-ard. Man dhal-ladhi yashfa'u 'indahu illa bi-idhnih? Ya'lamu ma bayna aydihim wa ma khalfahum, wa la yuhituna bishay'im-min 'ilmihi illa bima sha'. Wasi'a kursiyyuhus-samawati wal-ard, wa la ya'uduhu hifzhuhuma, wa Huwal-'Aliyyul-'Azhim.",
    "translation": "Allah! There is no god but He, the Living, the Self-Subsisting, Eternal. No slumber can seize Him nor sleep. His are all things in the heavens and on earth. Who is there can intercede in His presence except as He permitteth? He knoweth what (appeareth to His creatures as) before or after or behind them. Nor shall they compass aught of His knowledge except as He willeth. His Throne doth extend over the heavens and the earth, and He feeleth no fatigue in guarding and preserving them for He is the Most High, the Supreme (in glory).",
    "count": 1,
    "evidence": "Whoever says this when he retires in the evening will be protected from jinns until he rises in the morning. (Al-Hakim 1/562, Sahih Al-Targhib wat-Tarhib 1/273)"
  },
  {
    "title": "The Three Protectors (Al-Mu'awwidhat)",
    "arabic": "بِسْمِ اللهِ الرَّحْمَنِ الرَّحِيمِ. قُلْ هُوَ اللهُ أَحَدٌ... (Surah Al-Ikhlas, Al-Falaq, An-Nas)",
    "transliteration": "Qul Huwallahu Ahad... Qul A'udhu bi Rabbil-Falaq... Qul A'udhu bi Rabbin-Nas...",
    "translation": "Say: He is Allah, the One... Say: I seek refuge with the Lord of the Dawn... Say: I seek refuge with the Lord of Mankind...",
    "count": 3,
    "evidence": "Whoever recites these three times in the morning and in the evening, they will suffice him against everything. (Abu Dawud 4/322, At-Tirmidhi 5/567)"
  },
  {
    "title": "Evening Supplication (Amsayna)",
    "arabic": "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ، وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ",
    "transliteration": "Amsayna wa amsal-mulku lillahi walhamdu lillahi, la ilaha illallahu wahdahu la sharika lahu, lahul-mulku wa lahul-hamdu wa Huwa 'ala kulli shay'in Qadir. Rabbi as'aluka khayra ma fi hadhihil-laylati wa khayra ma ba'daha, wa a'udhu bika min sharri ma fi hadhihil-laylati wa sharri ma ba'daha. Rabbi a'udhu bika minal-kasali wa su'il-kibar, Rabbi a'udhu bika min 'adhabin fin-nari wa 'adhabin fil-qabr.",
    "translation": "We have entered the evening and at this time all dominion belongs to Allah, and all praise is for Allah. None has the right to be worshiped but Allah alone, without partner. To Him belongs all dominion and all praise and He is over all things Omnipotent. My Lord, I ask You for the good of this night and the good of what follows it, and I seek refuge in You from the evil of this night and the evil of what follows it. My Lord, I seek refuge in You from laziness and senility. My Lord, I seek refuge in You from torment in the Fire and torment in the grave.",
    "count": 1,
    "evidence": "This was a regular supplication of the Prophet ﷺ upon entering the evening. (Sahih Muslim 4/2088)"
  },
  {
    "title": "Sayyidul Istighfar (Master of Forgiveness)",
    "arabic": "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
    "transliteration": "Allahumma Anta Rabbi la ilaha illa Anta, khalaqtani wa ana 'abduka, wa ana 'ala 'ahdika wa wa'dika mastata'tu, a'udhu bika min sharri ma sana'tu, abu'u laka bini'matika 'alayya, wa abu'u bidhanbi faghfir li fa-innahu la yaghfirudh-dhunuba illa Anta.",
    "translation": "O Allah, You are my Lord, there is no god but You. You created me and I am Your slave, and I am faithful to Your covenant and my promise to You as much as I am able. I seek refuge in You from the evil of what I have done. I acknowledge Your favor upon me and I acknowledge my sin, so forgive me, for no one forgives sins except You.",
    "count": 1,
    "evidence": "If someone recites this during the evening with firm faith and dies before morning, he will be from the people of Paradise. (Al-Bukhari 7/150)"
  },
  {
    "title": "Protection from Sudden Harm",
    "arabic": "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
    "transliteration": "Bismillahil-ladhi la yadurru ma'as-mihi shay'un fil-ardi wa la fis-sama'i wa Huwas-Sami'ul-'Alim.",
    "translation": "In the Name of Allah, Who with His Name nothing can cause harm in the earth nor in the heavens, and He is the All-Hearing, the All-Knowing.",
    "count": 3,
    "evidence": "Whoever recites it three times in the evening will not be afflicted by any sudden calamity until morning. (Abu Dawud 4/323, At-Tirmidhi 5/465)"
  },
  {
    "title": "Protection from Evil of Creatures",
    "arabic": "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
    "transliteration": "A'udhu bikalimatil-lahit-tammati min sharri ma khalaq.",
    "translation": "I seek refuge in the perfect words of Allah from the evil of what He has created.",
    "count": 3,
    "evidence": "Whoever recites this three times in the evening will be protected from insect stings (and other harms) that night. (At-Tirmidhi 5/590, Sahih Muslim 4/2080)"
  },
  {
    "title": "Contentment with Faith",
    "arabic": "رَضِيتُ بِاللَّهِ رَبَّاً، وَبِالْإِسْلَامِ دِيناً، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيّاً",
    "transliteration": "Raditu billahi Rabban, wa bil-Islami dinan, wa bi Muhammadin (sallallahu 'alayhi wa sallam) Nabiyyan.",
    "translation": "I am pleased with Allah as my Lord, Islam as my religion, and Muhammad (peace and blessings of Allah be upon him) as my Prophet.",
    "count": 3,
    "evidence": "Allah has promised that anyone who says this three times every evening will be pleased on the Day of Resurrection. (Ahmad 4/337, At-Tirmidhi 5/465)"
  }
];

const AFTER_SOLAH_ADHKAAR = [
  {
    "title": "Istighfar (Seeking Forgiveness)",
    "arabic": "أَسْتَغْفِرُ اللَّهَ (ثَلَاثَاً)",
    "transliteration": "Astaghfirullah (3 times)",
    "translation": "I seek the forgiveness of Allah.",
    "count": 3,
    "evidence": "When the Messenger of Allah (ﷺ) finished his prayer, he would beg forgiveness three times. (Sahih Muslim 591)"
  },
  {
    "title": "Allahumma Antas-Salam",
    "arabic": "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ",
    "transliteration": "Allahumma Antas-Salamu wa minkas-salamu, tabarakta ya Dhal-Jalali wal-Ikram.",
    "translation": "O Allah, You are As-Salam (the One Who is free from every defect and deficiency) and from You is all peace, blessed are You, O Possessor of majesty and honor.",
    "count": 1,
    "evidence": "Reported as part of the Prophet's (ﷺ) immediate routine after Taslim. (Sahih Muslim 591)"
  },
  {
    "title": "The Declaration of Tawheed",
    "arabic": "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ، وَلَا مُعْطِيَ لِمَا مَنَعْتَ، وَلَا يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ",
    "transliteration": "La ilaha illallahu wahdahu la sharika lahu, lahul-mulku wa lahul-hamdu wa Huwa 'ala kulli shay'in Qadir. Allahumma la mani'a lima a'tayta, wa la mu'tiya lima mana'ta, wa la yanfa'u dhal-jaddi minkal-jadd.",
    "translation": "None has the right to be worshiped but Allah alone, He has no partner, His is the dominion and His is the praise, and He is Able to do all things. O Allah, there is none who can withhold what You give, and none may give what You have withheld; and the might of the mighty person cannot benefit him against You.",
    "count": 1,
    "evidence": "The Prophet (ﷺ) used to say this after every prescribed prayer. (Sahih al-Bukhari 844, Sahih Muslim 593)"
  },
  {
    "title": "Tasbih, Tahmid, and Takbir",
    "arabic": "سُبْحَانَ اللَّهِ (33x)، الْحَمْدُ لِلَّهِ (33x)، اللَّهُ أَكْبَرُ (33x)",
    "transliteration": "Subhanallah (33x), Alhamdulillah (33x), Allahu Akbar (33x).",
    "translation": "Glory be to Allah, Praise be to Allah, Allah is the Greatest.",
    "count": 99,
    "evidence": "Whoever says this after every prayer... and completes the hundred with 'La ilaha illallahu...', his sins will be forgiven even if they are like the foam of the sea. (Sahih Muslim 597)"
  },
  {
    "title": "Completion of the Hundred",
    "arabic": "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    "transliteration": "La ilaha illallahu wahdahu la sharika lahu, lahul-mulku wa lahul-hamdu wa Huwa 'ala kulli shay'in Qadir.",
    "translation": "None has the right to be worshiped but Allah alone, He has no partner, His is the dominion and His is the praise, and He is Able to do all things.",
    "count": 1,
    "evidence": "Used to complete the count of 100 after the Tasbih/Tahmid/Takbir. (Sahih Muslim 597)"
  },
  {
    "title": "Ayat al-Kursi",
    "arabic": "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ... (Quran 2:255)",
    "transliteration": "Allahu la ilaha illa Huwa, Al-Hayyul-Qayyum...",
    "translation": "Allah! There is no god but He, the Living, the Self-Subsisting, Eternal...",
    "count": 1,
    "evidence": "Whoever recites Ayat al-Kursi after every prescribed prayer, nothing will prevent him from entering Paradise except death. (An-Nasa'i, Sahih al-Jami' 6464)"
  },
  {
    "title": "The Three Protectors (Al-Mu'awwidhat)",
    "arabic": "قُلْ هُوَ اللَّهُ أَحَدٌ... قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ... قُلْ أَعُوذُ بِرَبِّ النَّاسِ...",
    "transliteration": "Surah Al-Ikhlas, Surah Al-Falaq, Surah An-Nas.",
    "translation": "The 112th, 113th, and 114th chapters of the Quran.",
    "count": 1,
    "evidence": "The Messenger of Allah (ﷺ) commanded me to recite Al-Mu'awwidhat after every prayer. (Abu Dawud 1523, At-Tirmidhi 2903)"
  }
];

const FORTY_ROBBANAS_ADHKAAR = [
  {
    "title": "Rabbana 1: Acceptance of Deeds",
    "arabic": "رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ",
    "transliteration": "Rabbana taqabbal minna innaka Antas-Sami'ul-'Alim.",
    "translation": "Our Lord, accept [this] from us. Indeed You are the All-Hearing, the All-Knowing.",
    "count": 1,
    "evidence": "Surah Al-Baqarah (2:127)"
  },
  {
    "title": "Rabbana 2: Submission to Allah",
    "arabic": "رَبَّنَا وَاجْعَلْنَا مُسْلِمَيْنِ لَكَ وَمِنْ ذُرِّيَّتِنَا أُمَّةً مُسْلِمَةً لَكَ وَأَرِنَا مَنَاسِكَنَا وَتُبْ عَلَيْنَا إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ",
    "transliteration": "Rabbana waj'alna muslimayni laka wa min dhurriyyatina ummatan muslimatan laka wa arina manasikana wa tub 'alayna innaka Antat-Tawwabur-Rahim.",
    "translation": "Our Lord, and make us Muslims [in submission] to You and from our descendants a Muslim nation [in submission] to You. And show us our rites and accept our repentance. Indeed, You are the Accepting of repentance, the Merciful.",
    "count": 1,
    "evidence": "Surah Al-Baqarah (2:128)"
  },
  {
    "title": "Rabbana 3: Success in Both Worlds",
    "arabic": "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    "transliteration": "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina 'adhaban-nar.",
    "translation": "Our Lord, give us in this world [that which is] good and in the Hereafter [that which is] good and protect us from the punishment of the Fire.",
    "count": 1,
    "evidence": "Surah Al-Baqarah (2:201)"
  },
  {
    "title": "Rabbana 4: Patience and Victory",
    "arabic": "رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا وَانْصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ",
    "transliteration": "Rabbana afrigh 'alayna sabran wa thabbit aqdamana wansurna 'alal-qawmil-kafirin.",
    "translation": "Our Lord, pour upon us patience and plant firmly our feet and give us victory over the disbelieving people.",
    "count": 1,
    "evidence": "Surah Al-Baqarah (2:250)"
  },
  {
    "title": "Rabbana 5: Forgiveness for Forgetfulness",
    "arabic": "رَبَّنَا لَا تُؤَاخِذْنَا إِنْ نَسِينَا أَوْ أَخْطَأْنَا",
    "transliteration": "Rabbana la tu'akhidhna in nasina aw akhta'na.",
    "translation": "Our Lord, do not impose blame upon us if we have forgotten or erred.",
    "count": 1,
    "evidence": "Surah Al-Baqarah (2:286)"
  },
  {
    "title": "Rabbana 6: Protection from Heavy Burdens",
    "arabic": "رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِنْ قَبْلِنَا",
    "transliteration": "Rabbana wa la tahmil 'alayna isran kama hamaltahu 'alal-ladhina min qablina.",
    "translation": "Our Lord, and lay not upon us a burden like that which You laid upon those before us.",
    "count": 1,
    "evidence": "Surah Al-Baqarah (2:286)"
  },
  {
    "title": "Rabbana 7: Mercy and Pardon",
    "arabic": "رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا أَنْتَ مَوْلَانَا فَانْصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ",
    "transliteration": "Rabbana wa la tuhammilna ma la taqata lana bih. Wa'fu 'anna waghfir lana warhamna. Anta mawlana fansurna 'alal-qawmil-kafirin.",
    "translation": "Our Lord, and burden us not with that which we have no ability to bear. And pardon us; and forgive us; and have mercy upon us. You are our protector, so give us victory over the disbelieving people.",
    "count": 1,
    "evidence": "Surah Al-Baqarah (2:286)"
  },
  {
    "title": "Rabbana 8: Protection from Misguidance",
    "arabic": "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً إِنَّكَ أَنْتَ الْوَهَّابُ",
    "transliteration": "Rabbana la tuzigh qulubana ba'da idh hadaytana wa hab lana mil-ladunka rahmatan innaka Antal-Wahhab.",
    "translation": "Our Lord, let not our hearts deviate after You have guided us and grant us from Yourself mercy. Indeed, You are the Bestower.",
    "count": 1,
    "evidence": "Surah Ali 'Imran (3:8)"
  },
  {
    "title": "Rabbana 9: Believing in the Promise",
    "arabic": "رَبَّنَا إِنَّكَ جَامِعُ النَّاسِ لِيَوْمٍ لَا رَيْبَ فِيهِ إِنَّ اللَّهَ لَا يُخْلِفُ الْمِيعَادَ",
    "transliteration": "Rabbana innaka jami'un-nasi liyawmil-la rayba fih; innallaha la yukhliful-mi'ad.",
    "translation": "Our Lord, surely You will gather the people for a Day about which there is no doubt. Indeed, Allah does not fail in His promise.",
    "count": 1,
    "evidence": "Surah Ali 'Imran (3:9)"
  },
  {
    "title": "Rabbana 10: Forgiveness for Belief",
    "arabic": "رَبَّنَا إِنَّنَا آمَنَّا فَاغْفِرْ لَنَا ذُنُوبَنَا وَقِنَا عَذَابَ النَّارِ",
    "transliteration": "Rabbana innana amanna faghfir lana dhunubana wa qina 'adhaban-nar.",
    "translation": "Our Lord, indeed we have believed, so forgive us our sins and protect us from the punishment of the Fire.",
    "count": 1,
    "evidence": "Surah Ali 'Imran (3:16)"
  },
  {
    "title": "Rabbana 11: Witnessing the Truth",
    "arabic": "رَبَّنَا آمَنَّا بِمَا أَنْزَلْتَ وَاتَّبَعْنَا الرَّسُولَ فَاكْتُبْنَا مَعَ الشَّاهِدِينَ",
    "transliteration": "Rabbana amanna bima anzalta wattaba'nar-Rasula faktubna ma'ash-shahidin.",
    "translation": "Our Lord, we have believed in what You revealed and have followed the messenger, so register us among the witnesses [to the truth].",
    "count": 1,
    "evidence": "Surah Ali 'Imran (3:53)"
  },
  {
    "title": "Rabbana 12: Forgiveness for Excesses",
    "arabic": "رَبَّنَا اغْفِرْ لَنَا ذُنُوبَنَا وَإِسْرَافَنَا فِي أَمْرِنَا وَثَبِّتْ أَقْدَامَنَا وَانْصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ",
    "transliteration": "Rabbanagh-fir lana dhunubana wa israfana fi amrina wa thabbit aqdamana wansurna 'alal-qawmil-kafirin.",
    "translation": "Our Lord, forgive us our sins and the excess [committed] in our affairs and plant firmly our feet and give us victory over the disbelieving people.",
    "count": 1,
    "evidence": "Surah Ali 'Imran (3:147)"
  },
  {
    "title": "Rabbana 13: Purpose of Creation",
    "arabic": "رَبَّنَا مَا خَلَقْتَ هَذَا بَاطِلًا سُبْحَانَكَ فَقِنَا عَذَابَ النَّارِ",
    "transliteration": "Rabbana ma khalaqta hadha batilan subhanaka faqina 'adhaban-nar.",
    "translation": "Our Lord, You did not create this aimlessly; exalted are You [above such a thing]; then protect us from the punishment of the Fire.",
    "count": 1,
    "evidence": "Surah Ali 'Imran (3:191)"
  },
  {
    "title": "Rabbana 14: Salvation from the Fire",
    "arabic": "رَبَّنَا إِنَّكَ مَنْ تُدْخِلِ النَّارَ فَقَدْ أَخْزَيْتَهُ وَمَا لِلظَّالِمِينَ مِنْ أَنْصَارٍ",
    "transliteration": "Rabbana innaka man tudkhilin-nara faqad akhzaytah, wa ma lizzalimina min ansar.",
    "translation": "Our Lord, indeed whoever You admit to the Fire - You have disgraced him, and for the wrongdoers there are no helpers.",
    "count": 1,
    "evidence": "Surah Ali 'Imran (3:192)"
  },
  {
    "title": "Rabbana 15: Response to the Caller",
    "arabic": "رَبَّنَا إِنَّنَا سَمِعْنَا مُنَادِيًا يُنَادِي لِلْإِيمَانِ أَنْ آمِنُوا بِرَبِّكُمْ فَآمَنَّا",
    "transliteration": "Rabbana innana sami'na munadiyan yunadi lil-imani an aminu bi-Rabbikum fa'amanna.",
    "translation": "Our Lord, indeed we have heard a caller calling to faith, [saying], 'Believe in your Lord,' and we have believed.",
    "count": 1,
    "evidence": "Surah Ali 'Imran (3:193)"
  },
  {
    "title": "Rabbana 16: Forgiveness of Major and Minor Sins",
    "arabic": "رَبَّنَا فَاغْفِرْ لَنَا ذُنُوبَنَا وَكَفِّرْ عَنَّا سَيِّئَاتِنَا وَتَوَفَّنَا مَعَ الْأَبْرَارِ",
    "transliteration": "Rabbana faghfir lana dhunubana wa kaffir 'anna sayyi'atina wa tawaffana ma'al-abrar.",
    "translation": "Our Lord, so forgive us our sins and remove from us our misdeeds and cause us to die with the righteous.",
    "count": 1,
    "evidence": "Surah Ali 'Imran (3:193)"
  },
  {
    "title": "Rabbana 17: Fulfilling the Promise",
    "arabic": "رَبَّنَا وَآتِنَا مَا وَعَدْتَنَا عَلَى رُسُلِكَ وَلَا تُخْزِنَا يَوْمَ الْقِيَامَةِ إِنَّكَ لَا تُخْلِفُ الْمِيعَادَ",
    "transliteration": "Rabbana wa atina ma wa'adtana 'ala rusulika wa la tukhzina yawmal-qiyamah; innaka la yukhliful-mi'ad.",
    "translation": "Our Lord, and grant us what You promised us through Your messengers and do not disgrace us on the Day of Resurrection. Indeed, You do not fail in [Your] promise.",
    "count": 1,
    "evidence": "Surah Ali 'Imran (3:194)"
  },
  {
    "title": "Rabbana 18: Rescue from Oppression",
    "arabic": "رَبَّنَا أَخْرِجْنَا مِنْ هَذِهِ الْقَرْيَةِ الظَّالِمِ أَهْلُهَا وَاجْعَلْ لَنَا مِنْ لَدُنْكَ وَلِيًّا وَاجْعَلْ لَنَا مِنْ لَدُنْكَ نَصِيرًا",
    "transliteration": "Rabbana akhrijna min hadhihil-qaryatiz-zalimi ahluha waj'al lana mil-ladunka waliyyan waj'al lana mil-ladunka nasira.",
    "translation": "Our Lord, take us out of this city of oppressive people and appoint for us from Yourself a protector and appoint for us from Yourself a helper.",
    "count": 1,
    "evidence": "Surah An-Nisa (4:75)"
  },
  {
    "title": "Rabbana 19: Provision and Sustenance",
    "arabic": "رَبَّنَا أَنْزِلْ عَلَيْنَا مَائِدَةً مِنَ السَّمَاءِ تَكُونُ لَنَا عِيدًا لِأَوَّلِنَا وَآخِرِنَا وَآيَةً مِنْكَ وَارْزُقْنَا وَأَنْتَ خَيْرُ الرَّازِقِينَ",
    "transliteration": "Rabbana anzil 'alayna ma'idatan minas-sama'i takunu lana 'idan li'awwalina wa akhirina wa ayatan minka warzuqna wa Anta khayrur-raziqin.",
    "translation": "O Allah, our Lord, send down to us a table [spread with food] from the heaven to be for us a festival for the first of us and the last of us and a sign from You. And provide for us, and You are the best of providers.",
    "count": 1,
    "evidence": "Surah Al-Ma'idah (5:114)"
  },
  {
    "title": "Rabbana 20: Admitting Wrongdoing (Adam & Eve's Dua)",
    "arabic": "رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ",
    "transliteration": "Rabbana zalamna anfusana wa in lam taghfir lana wa tarhamna lanakunanna minal-khasirin.",
    "translation": "Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us, we will surely be among the losers.",
    "count": 1,
    "evidence": "Surah Al-A'raf (7:23)"
  },
  {
    "title": "Rabbana 21: Protection from Wrongdoers",
    "arabic": "رَبَّنَا لَا تَجْعَلْنَا مَعَ الْقَوْمِ الظَّالِمِينَ",
    "transliteration": "Rabbana la taj'alna ma'al-qawmiz-zalimin.",
    "translation": "Our Lord, do not place us with the wrongdoing people.",
    "count": 1,
    "evidence": "Surah Al-A'raf (7:47)"
  },
  {
    "title": "Rabbana 22: Judging with Truth",
    "arabic": "رَبَّنَا افْتَحْ بَيْنَنَا وَبَيْنَ قَوْمِنَا بِالْحَقِّ وَأَنْتَ خَيْرُ الْفَاتِحِينَ",
    "transliteration": "Rabbanaf-tah baynana wa bayna qawmina bil-haqqi wa Anta khayrul-fatihin.",
    "translation": "Our Lord, decide between us and our people in truth, and You are the best of those who give decision.",
    "count": 1,
    "evidence": "Surah Al-A'raf (7:89)"
  },
  {
    "title": "Rabbana 23: Dying as Muslims",
    "arabic": "رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَتَوَفَّنَا مُسْلِمِينَ",
    "transliteration": "Rabbana afrigh 'alayna sabran wa tawaffana muslimin.",
    "translation": "Our Lord, pour upon us patience and let us die as Muslims [in submission to You].",
    "count": 1,
    "evidence": "Surah Al-A'raf (7:126)"
  },
  {
    "title": "Rabbana 24: Protection from Oppression",
    "arabic": "رَبَّنَا لَا تَجْعَلْنَا فِتْنَةً لِلْقَوْمِ الظَّالِمِينَ وَنَجِّنَا بِرَحْمَتِكَ مِنَ الْقَوْمِ الْكَافِرِينَ",
    "transliteration": "Rabbana la taj'alna fitnatan lil-qawmiz-zalimin. Wa najjina birahmatika minal-qawmil-kafirin.",
    "translation": "Our Lord, make us not [objects of] trial for the wrongdoing people. And save us by Your mercy from the disbelieving people.",
    "count": 1,
    "evidence": "Surah Yunus (10:85-86)"
  },
  {
    "title": "Rabbana 25: Allah Knows the Hidden",
    "arabic": "رَبَّنَا إِنَّكَ تَعْلَمُ مَا نُخْفِي وَمَا نُعْلِنُ وَمَا يَخْفَى عَلَى اللَّهِ مِنْ شَيْءٍ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ",
    "transliteration": "Rabbana innaka ta'lamu ma nukhfi wa ma nu'lin; wa ma yakhfa 'alal-lahi min shay'in fil-ardi wa la fis-sama'.",
    "translation": "Our Lord, indeed You know what we conceal and what we declare, and nothing is hidden from Allah on the earth or in the heaven.",
    "count": 1,
    "evidence": "Surah Ibrahim (14:38)"
  },
  {
    "title": "Rabbana 26: Acceptance of Prayer",
    "arabic": "رَبَّنَا وَتَقَبَّلْ دُعَاءِ",
    "transliteration": "Rabbana wa taqabbal du'a'.",
    "translation": "Our Lord, and accept my supplication.",
    "count": 1,
    "evidence": "Surah Ibrahim (14:40)"
  },
  {
    "title": "Rabbana 27: Forgiveness on Judgment Day",
    "arabic": "رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ",
    "transliteration": "Rabbanagh-fir li wa liwalidayya wa lil-mu'minina yawma yaqumul-hisab.",
    "translation": "Our Lord, forgive me and my parents and the believers the Day the account is established.",
    "count": 1,
    "evidence": "Surah Ibrahim (14:41)"
  },
  {
    "title": "Rabbana 28: Mercy and Right Guidance",
    "arabic": "رَبَّنَا آتِنَا مِنْ لَدُنْكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا",
    "transliteration": "Rabbana atina mil-ladunka rahmatan wa hayyi' lana min amrina rashada.",
    "translation": "Our Lord, grant us from Yourself mercy and prepare for us from our affair right guidance.",
    "count": 1,
    "evidence": "Surah Al-Kahf (18:10)"
  },
  {
    "title": "Rabbana 29: Protection from Pharaoh's Wrath",
    "arabic": "رَبَّنَا إِنَّنَا نَخَافُ أَنْ يَفْرُطَ عَلَيْنَا أَوْ أَنْ يَطْغَى",
    "transliteration": "Rabbana innana nakhafu an yafruta 'alayna aw an yatgha.",
    "translation": "Our Lord, indeed we are afraid that he will hasten [punishment] against us or that he will transgress.",
    "count": 1,
    "evidence": "Surah Taha (20:45)"
  },
  {
    "title": "Rabbana 30: Forgiveness and Mercy",
    "arabic": "رَبَّنَا آمَنَّا فَاغْفِرْ لَنَا وَارْحَمْنَا وَأَنْتَ خَيْرُ الرَّاحِمِينَ",
    "transliteration": "Rabbana amanna faghfir lana warhamna wa Anta khayrur-rahimin.",
    "translation": "Our Lord, we have believed, so forgive us and have mercy upon us, and You are the best of the merciful.",
    "count": 1,
    "evidence": "Surah Al-Mu'minun (23:109)"
  },
  {
    "title": "Rabbana 31: Averting the Punishment of Hell",
    "arabic": "رَبَّنَا اصْرِفْ عَنَّا عَذَابَ جَهَنَّمَ إِنَّ عَذَابَهَا كَانَ غَرَامًا",
    "transliteration": "Rabbanas-rif 'anna 'adhaba jahannama inna 'adhabaha kana gharama.",
    "translation": "Our Lord, avert from us the punishment of Hell. Indeed, its punishment is ever adhering.",
    "count": 1,
    "evidence": "Surah Al-Furqan (25:65)"
  },
  {
    "title": "Rabbana 32: Righteous Spouses and Offspring",
    "arabic": "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا",
    "transliteration": "Rabbana hab lana min azwajina wa dhurriyyatina qurrata a'yunin waj'alna lil-muttaqina imama.",
    "translation": "Our Lord, grant us from among our wives and offspring comfort to our eyes and make us an example for the righteous.",
    "count": 1,
    "evidence": "Surah Al-Furqan (25:74)"
  },
  {
    "title": "Rabbana 33: Acknowledgment of All-Encompassing Mercy",
    "arabic": "رَبَّنَا وَسِعْتَ كُلَّ شَيْءٍ رَحْمَةً وَعِلْمًا فَاغْفِرْ لِلَّذِينَ تَابُوا وَاتَّبَعُوا سَبِيلَكَ وَقِهِمْ عَذَابَ الْجَحِيمِ",
    "transliteration": "Rabbana wasi'ta kulla shay'in rahmatan wa 'ilman faghfir lilladhina tabu wattaba'u sabilaka waqihim 'adhabal-jahim.",
    "translation": "Our Lord, You have encompassed all things in mercy and knowledge, so forgive those who have repented and followed Your way and protect them from the punishment of Hellfire.",
    "count": 1,
    "evidence": "Surah Ghafir (40:7)"
  },
  {
    "title": "Rabbana 34: Admittance to Paradise",
    "arabic": "رَبَّنَا وَأَدْخِلْهُمْ جَنَّاتِ عَدْنٍ الَّتِي وَعَدْتَهُمْ وَمَنْ صَلَحَ مِنْ آبَائِهِمْ وَأَزْوَاجِهِمْ وَذُرِّيَّاتِهِمْ إِنَّكَ أَنْتَ الْعَزِيزُ الْحَكِيمُ",
    "transliteration": "Rabbana wa adkhilhum jannati 'adninil-lati wa'adtahum wa man salaha min aba'ihim wa azwajihim wa dhurriyyatihim innaka Antal-'Azizul-Hakim.",
    "translation": "Our Lord, and admit them to gardens of perpetual residence which You have promised them and whoever was righteous among their fathers, their spouses and their offspring. Indeed, it is You who is the Exalted in Might, the Wise.",
    "count": 1,
    "evidence": "Surah Ghafir (40:8)"
  },
  {
    "title": "Rabbana 35: Forgiveness for Brethren in Faith",
    "arabic": "رَبَّنَا اغْفِرْ لَنَا وَلِإِخْوَانِنَا الَّذِينَ سَبَقُونَا بِالْإِيمَانِ وَلَا تَجْعَلْ فِي قُلُوبِنَا غِلًّا لِلَّذِينَ آمَنُوا رَبَّنَا إِنَّكَ رَءُوفٌ رَحِيمٌ",
    "transliteration": "Rabbanagh-fir lana wa li'ikhwaninal-ladhina sabaquna bil-imani wa la taj'al fi qulubina ghillan lilladhina amanu Rabbana innaka Ra'ufur-Rahim.",
    "translation": "Our Lord, forgive us and our brothers who preceded us in faith and put not in our hearts [any] resentment toward those who have believed. Our Lord, indeed You are Kind and Merciful.",
    "count": 1,
    "evidence": "Surah Al-Hashr (59:10)"
  },
  {
    "title": "Rabbana 36: Reliance on Allah",
    "arabic": "رَبَّنَا عَلَيْكَ تَوَكَّلْنَا وَإِلَيْكَ أَنَبْنَا وَإِلَيْكَ الْمَصِيرُ",
    "transliteration": "Rabbana 'alayka tawakkalna wa ilayka anabna wa ilaykal-masir.",
    "translation": "Our Lord, upon You we have relied, and to You we have returned, and to You is the destination.",
    "count": 1,
    "evidence": "Surah Al-Mumtahanah (60:4)"
  },
  {
    "title": "Rabbana 37: Protection from Being a Trial for Disbelievers",
    "arabic": "رَبَّنَا لَا تَجْعَلْنَا فِتْنَةً لِلَّذِينَ كَفَرُوا وَاغْفِرْ لَنَا رَبَّنَا إِنَّكَ أَنْتَ الْعَزِيزُ الْحَكِيمُ",
    "transliteration": "Rabbana la taj'alna fitnatan lilladhina kafaru waghfir lana Rabbana innaka Antal-'Azizul-Hakim.",
    "translation": "Our Lord, make us not [objects of] torment for the disbelievers and forgive us, our Lord. Indeed, it is You who is the Exalted in Might, the Wise.",
    "count": 1,
    "evidence": "Surah Al-Mumtahanah (60:5)"
  },
  {
    "title": "Rabbana 38: Perfecting Light on Judgment Day",
    "arabic": "رَبَّنَا أَتْمِمْ لَنَا نُورَنَا وَاغْفِرْ لَنَا إِنَّكَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
    "transliteration": "Rabbana atmim lana nurana waghfir lana innaka 'ala kulli shay'in Qadir.",
    "translation": "Our Lord, perfect for us our light and forgive us. Indeed, You are over all things competent.",
    "count": 1,
    "evidence": "Surah At-Tahrim (66:8)"
  },
  {
    "title": "Rabbana 39: Building a House in Paradise",
    "arabic": "رَبِّ ابْنِ لِي عِنْدَكَ بَيْتًا فِي الْجَنَّةِ",
    "transliteration": "Rabbib-ni li 'indaka baytan fil-jannah.",
    "translation": "My Lord, build for me near You a house in Paradise.",
    "count": 1,
    "evidence": "Surah At-Tahrim (66:11) - Note: Singular 'Rabbi' but traditionally included in collections."
  },
  {
    "title": "Rabbana 40: Rescue from Oppression (Asiya's Dua)",
    "arabic": "وَنَجِّنِي مِنْ فِرْعَوْنَ وَعَمَلِهِ وَنَجِّنِي مِنَ الْقَوْمِ الظَّالِمِينَ",
    "transliteration": "Wa najjini min Fir'awna wa 'amalihi wa najjini minal-qawmiz-zalimin.",
    "translation": "And save me from Pharaoh and his deeds and save me from the wrongdoing people.",
    "count": 1,
    "evidence": "Surah At-Tahrim (66:11) - Note: Continuation of the previous Dua."
  }
];

const AdhkaarCard = ({ item, count, onIncrement, onReset, colors }: any) => {
  const isCompleted = count >= item.count;

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isCompleted ? colors.primary : "transparent",
          borderWidth: 1,
        },
      ]}
      onPress={onIncrement}
      disabled={isCompleted}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.textMain }]}>
          {item.title}
        </Text>
      </View>

      <Text style={[styles.arabicText, { color: colors.textMain }]}>
        {item.arabic}
      </Text>

      <Text style={[styles.transliterationText, { color: colors.primary }]}>
        {item.transliteration}
      </Text>

      <Text style={[styles.translationText, { color: colors.textMuted }]}>
        {item.translation}
      </Text>

      <View style={[styles.evidenceContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.evidenceText, { color: colors.textMuted }]}>
          {item.evidence}
        </Text>
      </View>

      <View style={styles.cardFooter}>
         <Pressable 
           style={[styles.resetButton, { backgroundColor: colors.background }]} 
           onPress={onReset}
         >
           <RotateCcw color={colors.textMuted} size={16} />
         </Pressable>

        <Pressable
          style={[
            styles.counterButton,
            { backgroundColor: isCompleted ? colors.primary : colors.background },
          ]}
          onPress={onIncrement}
        >
          {isCompleted ? (
            <CheckCircle2 color="#FFF" size={24} />
          ) : (
            <Text style={[styles.counterText, { color: colors.textMain }]}>
              {count} / {item.count}
            </Text>
          )}
        </Pressable>
      </View>
    </Pressable>
  );
};

const withOpacity = (hexColor: string, opacity: number) => {
  const sanitized = hexColor.replace("#", "");
  const bigint = Number.parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function AdhkaarDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  let adhkaarData = [];
  let pageTitle = "Adhkaar";

  if (id === "morning") {
    adhkaarData = MORNING_ADHKAAR;
    pageTitle = "Morning Adhkaar";
  } else if (id === "evening") {
    adhkaarData = EVENING_ADHKAAR;
    pageTitle = "Evening Adhkaar";
  } else if (id === "after-solah") {
    adhkaarData = AFTER_SOLAH_ADHKAAR;
    pageTitle = "After Solaah Adhkaar";
  } else if (id === "40-robbanahs") {
    adhkaarData = FORTY_ROBBANAS_ADHKAAR;
    pageTitle = "40 Robbanahas";
  } else {
    adhkaarData = MORNING_ADHKAAR; // Fallback or display other adhkaar types
  }

  const [counts, setCounts] = useState<{ [key: number]: number }>(
    adhkaarData.reduce((acc, _, index) => ({ ...acc, [index]: 0 }), {})
  );

  const handleIncrement = (index: number, max: number) => {
    setCounts((prev) => ({
      ...prev,
      [index]: Math.min((prev[index] || 0) + 1, max),
    }));
  };

  const handleReset = (index: number) => {
    setCounts((prev) => ({
      ...prev,
      [index]: 0,
    }));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <LinearGradient
        colors={[
          colors.background,
          withOpacity(colors.primary, isDark ? 0.1 : 0.05),
          colors.background,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
        >
          <ChevronLeft color={colors.textMain} size={24} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textMain }]}>
          {pageTitle}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introSection}>
          <Text style={[styles.introTitle, { color: colors.textMain }]}>
            {pageTitle}
          </Text>
          <Text style={[styles.introSubtitle, { color: colors.textMuted }]}>
            Tap on the card or counter to track your progress. Let your heart find peace in His remembrance.
          </Text>
        </View>

        <View style={styles.list}>
          {adhkaarData.map((item, index) => (
            <AdhkaarCard
              key={index}
              item={item}
              count={counts[index] || 0}
              onIncrement={() => handleIncrement(index, item.count)}
              onReset={() => handleReset(index)}
              colors={colors}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 20,
  },
  headerRight: {
    width: 44,
  },
  content: {
    paddingBottom: 40,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  introSection: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  introTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 24,
    marginBottom: 8,
  },
  introSubtitle: {
    fontFamily: "SatoshiMedium",
    fontSize: 15,
    lineHeight: 22,
  },
  list: {
    gap: 16,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: "SatoshiBold",
    fontSize: 18,
  },
  arabicText: {
    fontFamily: "AmiriRegular", // Assuming a Quranic/Arabic font is available, fallback to default font.
    fontSize: 26,
    lineHeight: 46,
    textAlign: "right",
    marginBottom: 16,
  },
  transliterationText: {
    fontFamily: "SatoshiMedium",
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  translationText: {
    fontFamily: "SatoshiRegular",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  evidenceContainer: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  evidenceText: {
    fontFamily: "SatoshiMedium",
    fontSize: 13,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resetButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  counterButton: {
    paddingHorizontal: 24,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  counterText: {
    fontFamily: "SatoshiBold",
    fontSize: 16,
  },
});
