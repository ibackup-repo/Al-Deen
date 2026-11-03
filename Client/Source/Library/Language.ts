import type { Word_Detail } from "@/Hook/Use-Custom-Words";

export type Supported_Language = "Dutch" | "English" | "Arabic" | "Pashto";
export type Section_Type = "Vocabulary" | "Grammar";
export type Word_Entry = string[] | Record<string, any>[];

// Maps URL parameter names directly back to internal language codes
export const MAP_NAME_TO_CODE: Record<string, string> = {
  Dutch: "nl",
  English: "en",
  Arabic: "ar",
  Pashto: "ps"
};

// Maps internal language codes to the human-readable full name used for routing
export const MAP_CODE_TO_NAME: Record<string, Supported_Language> = {
  nl: "Dutch",
  en: "English",
  ar: "Arabic",
  ps: "Pashto"
};

export const TARGET_LANGS = [
  { code: "nl", label: "Nederlands", name: "Dutch" },
  { code: "en", label: "English", name: "English" },
  { code: "ar", label: "العربية", name: "Arabic" },
];

export const EXTRA_LANGS = [
  { code: "ps", label: "پښتو (Pashto)", name: "Pashto", preview: true },
];

export const LANGUAGE_LABEL: Record<string, string> = { nl: "Taal", en: "Language", ar: "اللغة" };
export const CHESS_LABEL: Record<string, string> = { nl: "Schaken", en: "Chess", ar: "الشطرنج" };
export const DEFAULT_SECTION: Section_Type = "Vocabulary";

// Reads directly from your .env configuration
export const BACKEND_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function Entry_Text(entry: Word_Entry | null | undefined, index: number): string | undefined {
  const value = Array.isArray(entry) ? entry[index] : undefined;
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return value.English ?? Object.values(value)[0];
  return undefined;
}

export function Word_Detail_From_API(id: string, entry: Word_Entry, lang: Supported_Language): Word_Detail {
  const word = Entry_Text(entry, 0) ?? id;
  const Definition = Entry_Text(entry, 1);
  const example = Entry_Text(entry, 2);
  const base: Word_Detail = { id, nl: { word: id }, en: { word: id } };

  if (lang === "Dutch") {
    base.nl = { word, Definitie: Definition, Voorbeeld: example };
    base.en = { word: id, Definition, example };
  } else if (lang === "Arabic") {
    base.en = { word: id, Definition, example };
    base.ar = { word, Definition, example };
  } else {
    base.en = { word, Definition, example };
  }
  return base;
}