// Component/Settings/Types.ts
import { ReactNode } from "react";

export type Settings_Category = "account" | "Quran" | "Hadith" | "Aid" | "Language";
export type Account_Subcategory = "profile" | "Bookmarks" | "Notes" | "History";
export type Aid_Subcategory = "Prayer-Times" | "Dua";
// Remove Quran_Subcategory from here - it's defined in Content/Quran/Types.ts

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

export interface Aid_Subcategory_Config {
  id: Aid_Subcategory;
  label: string;
  icon: ReactNode;
}

// Remove Quran_Subcategory_Configuration from here too