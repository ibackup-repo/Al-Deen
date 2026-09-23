import { User, Type, Globe, Bookmark, FileText, Clock, BookText, Heart, Palette, Accessibility } from "lucide-react";
import type { Settings_Category_Config, Account_Subcategory_Config, Hadith_Subcategory_Configuration } from "./Types";
import { Aid_Subcategories } from "./Content/Aid/Constant";
import { Quran_Subcategories } from "./Content/Quran/Constant";  // ← ADD THIS IMPORT

// Main categories
export const Settings_Categories: Settings_Category_Config[] = [
  { id: "account", label: "Account", icon: User, Has_Subcategories: true },
    { id: "Appearance", label: "Appearance", icon: User, Has_Subcategories: true },
  { id: "Quran",   label: "Quran",   icon: Type, Has_Subcategories: true },
  { id: "Hadith",  label: "Hadith",  icon: BookText, Has_Subcategories: true },
  { id: "Aid",     label: "Aid",     icon: Heart, Has_Subcategories: true },
  { id: "Language", label: "Language", icon: Globe, Has_Subcategories: false },
  { id: "theme", label: "theme", icon: Palette, Has_Subcategories: false },
  { id: "accessibility", label: "Accessibility", icon: Accessibility, Has_Subcategories: false },
];

// Account subcategories
export const Account_Subcategories: Account_Subcategory_Config[] = [
  { id: "profile",   label: "Profile",   icon: <User className="h-4 w-4" /> },
  { id: "Bookmarks", label: "Bookmarks", icon: <Bookmark className="h-4 w-4" /> },
  { id: "Notes",     label: "Notes",     icon: <FileText className="h-4 w-4" /> },
  { id: "History",   label: "History",   icon: <Clock className="h-4 w-4" /> },
];

export const Appearance_Subcategories: Account_Subcategory_Config[] = [
  { id: "General",   label: "General",   icon: <User className="h-4 w-4" /> },
  { id: "Button",   label: "Button",   icon: <Clock className="h-4 w-4" /> },
];

export const Hadith_Subcategories: Hadith_Subcategory_Configuration[] = [
  { id: "Arabic",   label: "Arabic",   icon: <User className="h-4 w-4" /> },
  { id: "Translation", label: "Translation", icon: <Bookmark className="h-4 w-4" /> },
  { id: "Transliteration",     label: "Transliteration",     icon: <FileText className="h-4 w-4" /> },
  { id: "wbw",   label: "WBW",   icon: <Clock className="h-4 w-4" /> },
];

// Helper to get subcategories for a given Category
export const Get_Subcategories = (Category: string) => {
  switch (Category) {
    case "account":
      return Account_Subcategories;
    case "Aid":
      return Aid_Subcategories;
    case "Quran":                     // ← ADD THIS CASE
      return Quran_Subcategories;
    case "Hadith":                     // ← ADD THIS CASE
      return Hadith_Subcategories;
    case "Appearance":                     // ← ADD THIS CASE
      return Appearance_Subcategories;
    default:
      return [];
  }
};

// Add these exports for Quran_Section
export const Preview_Words = [
  { Arabic: "بِسْمِ",       Translation: "In the name of"    },
  { Arabic: "اللَّهِ",      Translation: "Allah"             },
  { Arabic: "الرَّحْمَٰنِ", Translation: "the Most Gracious" },
  { Arabic: "الرَّحِيمِ",   Translation: "the Most Merciful" },
];

export const Reciters = [
  { id: "Mishary_Rashid_Alafasy",  label: "Mishari Rashid al-Afasy"      },
  { id: "Abdul-Basit-Abdus-Samad-Murattal",   label: "Abdul Basit Abdus-Samad Murattal"        },
  { id: "Abdul-Basit-Abdus-Samad-Mujawwad",   label: "Abdul-Basit-Abdus-Samad-Mujawwad"      },
];

export const Translators = [
  { id: "Direct", label: "Direct" },
  { id: "Saheeh-International", label: "Saheeh International" },
];

export const Languages = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
];