import { useLanguage } from "../LanguageContext";

/**
 * Returns the correct font family names based on the current app language.
 * When Arabic is active, Cairo (a beautiful Arabic/Latin typeface) is used
 * for UI text. AmiriQuran is always used for Quranic Arabic text.
 */
export const useAppFonts = () => {
  const { isRTL } = useLanguage();

  if (isRTL) {
    return {
      regular: "Cairo",
      medium: "CairoMedium",
      bold: "CairoBold",
      arabic: "AmiriQuran",
      isRTL: true,
    };
  }

  return {
    regular: "Satoshi",
    medium: "SatoshiMedium",
    bold: "SatoshiBold",
    arabic: "AmiriQuran",
    isRTL: false,
  };
};
