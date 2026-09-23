// Component/Settings/Types.ts
import { ReactNode } from "react";

export type Settings_Category =
  | "account"
  | "Quran"
  | "Hadith"
  | "Aid"
  | "Language"
  | "Appearance"
  | "theme"
  | "accessibility";

export type Account_Subcategory = "profile" | "Bookmarks" | "Notes" | "History";
export type Appearance_Subcategory = "General" | "Button";
export type Aid_Subcategory = "Prayer-Times" | "Dua";
export type Quran_Subcategory = ""
export type Hadith_Subcategory =

  | "Arabic"
  | "Translation"
  | "Transliteration"
  | "per-Kalimah"
  | "audio"
  | "Hifz"
  | "Surah-info"
  | "tafsir"
  | "layout";

export interface Settings_Category_Config {
  id: Settings_Category;
  label: string;
  icon: React.ElementType;
  Has_Subcategories?: boolean;
}

export interface Account_Subcategory_Config {
  id: Account_Subcategory;
  label: string;
  icon: ReactNode;
}
export interface Appearance_Subcategory_Config {
  id: Appearance_Subcategory;
  label: string;
  icon: ReactNode;
}

export interface Aid_Subcategory_Config {
  id: Aid_Subcategory;
  label: string;
  icon: ReactNode;
}
export interface Hadith_Subcategory_Configuration {
  id: Hadith_Subcategory;
  label: string;
  icon: ReactNode;
}

export interface Quran_Subcategory_Configuration {
  id: Quran_Subcategory;
  label: string;
  icon: ReactNode;
}
