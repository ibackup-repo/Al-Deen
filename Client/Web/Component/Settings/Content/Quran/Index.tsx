// Component/Settings/Content/Quran/index.tsx
import { Arabic } from "./Section/Arabic";
import { Translation } from "./Section/Translation";
import { Transliteration } from "./Section/Transliteration";
import { WBW } from "./Section/WBW";  // ← Import WBW, not PerWord
import { Audio } from "./Section/Audio";
import { Hifz } from "./Section/Hifz"
import { Surah_Info } from "./Section/Surah-Info";
import { Tafsir } from "./Section/Tafsir";
import { Layout } from "./Section/Layout";
import type { Quran_Subcategory } from "./Types";

interface Quran_Section_Properties {
  Active_Subcategory: Quran_Subcategory;
}

export function Quran_Section({ Active_Subcategory }: Quran_Section_Properties) {
  switch (Active_Subcategory) {
    case "Arabic":
      return <Arabic />;
    case "Translation":
      return <Translation />;
    case "Transliteration":
      return <Transliteration />;
    case "per-Kalimah":
      return <WBW />;  // ← Use WBW component
    case "audio":
      return <Audio />;
      case "Hifz":
      return <Hifz />;
    case "Surah-info":
      return <Surah_Info />;
    case "tafsir":
      return <Tafsir />;
    case "layout":
      return <Layout />;
    default:
      return null;
  }
}