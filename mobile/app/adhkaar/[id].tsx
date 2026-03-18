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
