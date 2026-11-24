export interface TranslationPackMeta {
  id: string;
  name: string;
  translator: string;
  language: string;
  license: string;
  sourceUrl: string;
  attribution: string;
  devOnly?: boolean;
}

export type TranslationData = (string | null)[][];

const INCLUDE_DEV = import.meta.env.VITE_INCLUDE_DEV_TRANSLATIONS === "true";

const BASE_PACKS: TranslationPackMeta[] = [
  {
    id: "en-pickthall",
    name: "The Meaning of the Glorious Koran",
    translator: "Mohammed Marmaduke Pickthall (1930)",
    language: "en",
    license: "Public Domain (1930; author died 1936)",
    sourceUrl: "https://api.alquran.cloud/v1/quran/en.pickthall",
    attribution:
      "English translation by Mohammed Marmaduke Pickthall (1930), Public Domain, sourced via AlQuran Cloud.",
  },
];

const DEV_PACKS: TranslationPackMeta[] = [
  {
    id: "en-abdelhaleem",
    name: "The Qur'an (Dev-Only)",
    translator: "M.A.S. Abdel Haleem",
    language: "en",
    license: "Copyrighted — Oxford University Press (Dev-only flag, excluded from release builds)",
    sourceUrl: "https://global.oup.com/",
    attribution:
      "M.A.S. Abdel Haleem, The Qur'an, Oxford University Press. Local development only; not redistributed in release builds.",
    devOnly: true,
  },
];

export function getAvailableTranslationPacks(): TranslationPackMeta[] {
  return INCLUDE_DEV ? [...BASE_PACKS, ...DEV_PACKS] : [...BASE_PACKS];
}

export function getDefaultTranslationPackId(): string {
  return "en-pickthall";
}

const packCache = new Map<string, TranslationData>();

export async function loadTranslationPack(packId: string): Promise<TranslationData> {
  const resolvedId =
    packId === "en-abdelhaleem" && !INCLUDE_DEV ? "en-pickthall" : packId;

  const cached = packCache.get(resolvedId);
  if (cached) return cached;

  let mod: { default: unknown };
  if (resolvedId === "en-abdelhaleem" && INCLUDE_DEV) {
    mod = await import("./eng-abdelhaleem_dev.json");
  } else {
    mod = await import("./eng-pickthall.json");
  }
  const data = mod.default as TranslationData;
  packCache.set(resolvedId, data);
  return data;
}
