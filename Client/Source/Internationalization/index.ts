import { en, Translation_Keys } from "./Translation/en";
import { fr } from "./Translation/fr";
import { nl } from "./Translation/nl";

export const Languages = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "nl", name: "Nederlands" },
];

export const Translations: Record<string, Translation_Keys> = {
  en,
  fr,
  nl,
};

export type { Translation_Keys };

export const Get_Translation = (Language: string): Translation_Keys => {
  return Translations[Language] || Translations.en;
};

// RTL Languages
export const RTL_Languages: string[] = [];

export const Is_RTL_Language = (Language: string): boolean => {
  return RTL_Languages.includes(Language);
};
