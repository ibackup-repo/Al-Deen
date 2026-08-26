// Component/Settings/Content/Quran/Constant.tsx
import { Type, Languages, BookOpen, AlignLeft, AudioLines, Info, BookText, LayoutGrid } from "lucide-react";

// Subcategories for Quran (tabs)
export const Quran_Subcategories = [
  { id: "Arabic",          label: "Arabic",          icon: <Type className="h-4 w-4" /> },
  { id: "Translation",     label: "Translation",     icon: <Languages className="h-4 w-4" /> },
  { id: "Transliteration", label: "Transliteration", icon: <BookOpen className="h-4 w-4" /> },
  { id: "per-Kalimah",        label: "WBW",        icon: <AlignLeft className="h-4 w-4" /> },
  { id: "audio",           label: "Audio",           icon: <AudioLines className="h-4 w-4" /> },
  { id: "Hifz",            label: "Hifz",            icon: <AudioLines className="h-4 w-4" /> },
  { id: "Surah-info",      label: "Surah Info",      icon: <Info className="h-4 w-4" /> },
  { id: "tafsir",          label: "Tafsir",          icon: <BookText className="h-4 w-4" /> },
  { id: "layout",          label: "Layout",          icon: <LayoutGrid className="h-4 w-4" /> },
];

// KFGQPC font variants
export const KFGQPC_Variants = [
  { id: "Uthmani" as const,    label: "QPC Uthmani Hafs" },
  { id: "Uthmani_V1" as const, label: "King Fahad Complex V1" },
  { id: "Uthmani_V2" as const, label: "King Fahad Complex V2" },
  { id: "Uthmani_V4" as const, label: "King Fahad Complex V4" },
];

// Reciters
export const Reciters = [
  { id: "Mishary_Rashid_Alafasy",                    label: "Mishari Rashid al-Afasy" },
  { id: "Abdul-Basit-Abdus-Samad-Murattal",          label: "Abdul Basit Abdus-Samad (Murattal)" },
  { id: "Abdul-Basit-Abdus-Samad-Mujawwad",          label: "Abdul Basit Abdus-Samad (Mujawwad)" },
];

// Translators
export const Translators = [
  { id: "None",                 label: "None" },
  { id: "Direct",               label: "Direct" },
  { id: "Saheeh-International", label: "Saheeh International" },
];

// Transliterators
export const Transliterators = [
  { id: "None",     label: "None" },
  { id: "Standard", label: "Standard" },
  { id: "WBW",      label: "WBW" },
];

// Layout options
export const Layouts = [
  { id: "standard", label: "Standard" },
  { id: "wide",     label: "Wide" },
];

// Preview Kalimaat (optional, kept for potential use)
export const Preview_Words = [
  { Arabic: "بِسْمِ",       Translation: "In the name of"    },
  { Arabic: "اللَّهِ",      Translation: "Allah"             },
  { Arabic: "الرَّحْمَٰنِ", Translation: "the Most Gracious" },
  { Arabic: "الرَّحِيمِ",   Translation: "the Most Merciful" },
];