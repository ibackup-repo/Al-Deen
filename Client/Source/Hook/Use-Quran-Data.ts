// @/Hook/Use-Quran-Data.ts
import { useQuery } from '@tanstack/react-query';
import { Use_App, type Quran_Font_Family } from '@Web/Context/App';

export type Quran_Font_Type = "V1" | "V2" | "Standard";

export interface Assembled_Ayah {
  Ayah_ID: number;
  Arabic: string;
  Arabic_V1?: string | null;
  Arabic_V2?: string | null;
  Translation?: string;
  Transliteration?: string;
  Kalimaat: string[];
  Words_V1?: string[] | null;
  Words_V2?: string[] | null;
  KBK_Translation?: string[];
  KBK_Translation_Hover?: string[];
  KBK_Translation_Inline?: string[];
  KBK_Transliteration?: string[];
  KBK_Transliteration_Hover?: string[];
  KBK_Transliteration_Inline?: string[];
}

export interface Assembled_Surah {
  id: number;
  name: string;
  English_Name: string;
  English_Name_Translation: string;
  Number_Of_Ayaat: number;
  Revelation_Type: string;
  Pages: [number, number];
  Ayaat: Assembled_Ayah[];
}

const Backend_Base_URL = "https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev";

// Safe dictionary to map application UI labels to actual backend keys
const BACKEND_IDENTIFIER_MAP: Record<string, string> = {
  "Direct": "en.Transliteration", // Adjust this value to your backend's exact layout standard key
  "Standard": "en.Transliteration",
  "Saheeh-International": "en.sahih",
  "None": "",
};

function Map_Font_To_Data_Type(font: Quran_Font_Family): Quran_Font_Type {
  switch (font) {
    case "Uthmani_V1": return "V1";
    case "Uthmani_V2":
    case "Uthmani_V4": return "V2";
    default: return "Standard";
  }
}

function Normalize_Parameter(value: string | boolean | undefined): string | undefined {
  if (!value || value === "None") return undefined;
  if (typeof value === "string" && BACKEND_IDENTIFIER_MAP[value] !== undefined) {
    return BACKEND_IDENTIFIER_MAP[value] || undefined;
  }
  return String(value);
}

/**
 * Picks the Arabic text + Kalimah array matching the Active font variant.
 * Falls back to Standard if the requested variant isn't present on the Ayah
 * (e.g. backend didn't precompute it, or the source file was missing).
 */
function Select_Variant(Ayah: Assembled_Ayah, Font_Type: Quran_Font_Type): Assembled_Ayah {
  if (Font_Type === "V1" && Ayah.Arabic_V1 && Ayah.Words_V1) {
    return { ...Ayah, Arabic: Ayah.Arabic_V1, Kalimaat: Ayah.Words_V1 };
  }
  if (Font_Type === "V2" && Ayah.Arabic_V2 && Ayah.Words_V2) {
    return { ...Ayah, Arabic: Ayah.Arabic_V2, Kalimaat: Ayah.Words_V2 };
  }
  return Ayah;
}

export function Use_Quran_Data(Surah_Number: number) {
  const {
    Ayah_Translation,
    Hover_Translation,
    Inline_Translation,
    Quran_Font,
    Selected_Translator,
    Selected_Ayah_Transliterator,
    Hover_Transliteration,
    Inline_Transliteration,
  } = Use_App();

  const Font_Type = Map_Font_To_Data_Type(Quran_Font);

  // Normalize all states into valid engine database identifiers
  const Translation_Source = Ayah_Translation && Selected_Translator ? Normalize_Parameter(Selected_Translator) : undefined;
  const KBK_Translation_Hover = Normalize_Parameter(Hover_Translation);
  const KBK_Translation_Inline = Normalize_Parameter(Inline_Translation);
  const Transliteration_Style = Normalize_Parameter(Selected_Ayah_Transliterator);
  const KBK_Transliteration_Hover = Normalize_Parameter(Hover_Transliteration);
  const KBK_Transliteration_Inline = Normalize_Parameter(Inline_Transliteration);

  return useQuery<Assembled_Surah, error>({
    queryKey: [
      'Surah',
      Surah_Number,
      Translation_Source,
      KBK_Translation_Hover,
      KBK_Translation_Inline,
      Font_Type,
      Transliteration_Style,
      KBK_Transliteration_Hover,
      KBK_Transliteration_Inline,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (Translation_Source) params.append("Translation", Translation_Source);
      if (KBK_Translation_Hover) params.append("KBK_Translation_Hover", KBK_Translation_Hover);
      if (KBK_Translation_Inline) params.append("KBK_Translation_Inline", KBK_Translation_Inline);
      if (Font_Type) params.append("Font_Type", Font_Type);
      if (Transliteration_Style) params.append("Transliteration", Transliteration_Style);
      if (KBK_Transliteration_Hover) params.append("KBK_Transliteration_Hover", KBK_Transliteration_Hover);
      if (KBK_Transliteration_Inline) params.append("KBK_Transliteration_Inline", KBK_Transliteration_Inline);

      const url = `${Backend_Base_URL}/api/Surah/${Surah_Number}?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch Surah data context: ${response.statusText}`);
      }

      const data: Assembled_Surah = await response.json();

      return {
        ...data,
        Ayaat: data.Ayaat.map((Ayah) => Select_Variant(Ayah, Font_Type)),
      };
    },
    staleTime: 1000 * 60 * 60,      // 1 hour
    gcTime: 1000 * 60 * 60 * 24,    // 1 day
    retry: 2,
    refetchOnWindowFocus: false,
  });
}