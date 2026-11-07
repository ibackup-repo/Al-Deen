// @/Context/App.tsx
// Samengevoegde context: taal-leer-app (courses, reviews, recall, knoppen) + Quran-app (instellingen, hadith, dua, hifz, gebedstijden)
import React, {
  createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode,
} from "react";
import { Review_State, Create_Review_State, Update_Review } from "@/Library/Spaced-Repetition";
import type { Recall_Item, Recall_Scope } from "@/Library/Recall";
import { Browse_Path_To_Url, Same_Browse_Path, URL_To_Browse_Path } from "@/Library/Navigation";

/* ============================================================================
   TYPES — Taal-app
   ========================================================================== */

export const ALL_LANGUAGES = ["English", "Nederlands", "Arabic", "Pashto"];

export interface Course {
  From_Language: string;
  concept: string;
  To_Language: string;
}

// "auto" (Quran-app) is een alias van "system" (taal-app)
export type Theme_Choice = "light" | "dark" | "system" | "auto";
export type Text_Size = "sm" | "md" | "lg";
export type Filter_Type = "all" | "Marked" | "favorites" | "custom";

export type ButtonVariant = "primary" | "secondary";
export type ButtonState = "normal" | "hover" | "active";

export interface ButtonStateConfig {
  bgColor: string;
  textColor: string;
  borderRadius: number;
  hasBorder: boolean;
  borderColor: string;
}

export type ButtonCustomizationMap = {
  [key in ButtonVariant]: {
    [key in ButtonState]: ButtonStateConfig;
  };
};

export interface Active_Recall {
  Scope: Recall_Scope;
  Category_ID: string;
  Subcategory_ID: string;
  Word_ID?: string;
  Word_IDs?: string[];
}

interface App_State {
  Is_Authenticated: boolean;
  user: { firstName: string; email: string } | null;
  Interface_Language: string;
  Selected_Concept: string | null;
  Learning_Language: string | null;
  Introduction_Completed: boolean;
  courses: Course[];
  reviews: Review_State[];
  theme: Theme_Choice;
  textSize: Text_Size;
  High_Contrast: boolean;
  buttonCustomization: ButtonCustomizationMap;
  Recall_Queue: Recall_Item[];
  Browse_Path: string[];
  Active_Recall: Active_Recall | null;
  Recall_Return_Path: string[] | null;
}

/* ============================================================================
   TYPES — Quran-app
   ========================================================================== */

export type Quran_Font_Family = "Uthmani" | "Uthmani_V1" | "Uthmani_V2" | "Uthmani_V4" | "IndoPak";
export type Quran_Layout = "Ayah" | "page";

// Transliterator types (includes "None" option) - for TRANSLITERATION only
export type Transliterator_Type = "None" | "Standard" | "Academic" | "Phonetic" | "KingFahd";

// Interface for API Translation objects
export interface Mudkhal_Qaimat_At_Tarjamah {
  id: string;
  name: string;
  Language: string;
  Edition_Name: string;
}

export interface Hifz_Progress {
  Completed_Kalimaat: Set<string>; // keys: `${SurahId}:${Ayah}:${Kalimah_Index}`
  Mark_Kalimah_Completed: (SurahId: number, Ayah: number, Kalimah_Index: number) => void;
  Unmark_Kalimah_Completed: (SurahId: number, Ayah: number, Kalimah_Index: number) => void;
  Is_Kalimah_Completed: (SurahId: number, Ayah: number, Kalimah_Index: number) => boolean;
  Is_Ayah_Completed: (SurahId: number, Ayah: number, Total_Kalimaat: number) => boolean;
  Reset_Kalimah: (SurahId: number, Ayah: number, Kalimah_Index: number) => void;
  Reset_Ayah: (SurahId: number, Ayah: number) => void;
  Reset_Surah: (SurahId: number) => void;
  Reset_All: () => void;
}

type Prayer_Location = { city: string; country: string; lat: number; lng: number };

// Alles van de Quran-kant, ZONDER de gedeelde velden (theme, High_Contrast, settings-sidebar)
interface Quran_Context_Type {
  Is_Search_Sidebar_Open: boolean;
  Set_Search_Sidebar_Open: (Open: boolean) => void;
  Is_Quran_Nav_Sidebar_Open: boolean;
  Set_Quran_Nav_Sidebar_Open: (Open: boolean) => void;
  layout: Quran_Layout;
  Set_Layout: (layout: Quran_Layout) => void;
  Current_Language: string;
  Set_Current_Language: (Language: string) => void;
  Quran_Font: Quran_Font_Family;
  Set_Quran_Font: (font: Quran_Font_Family) => void;
  fontSize: number;
  Set_Font_Size: (size: number) => void;
  Translation_Font_Size: number;
  Set_Translation_Font_Size: (size: number) => void;

  Reading_Idle_Timeout: number;
  Set_Reading_Idle_Timeout: (Timeout: number) => void;
  Reading_Save_Interval: number;
  Set_Reading_Save_Interval: (interval: number) => void;
  Reading_Tracking_Enabled: boolean;
  Set_Reading_Tracking_Enabled: (enabled: boolean) => void;

  // Prayer Times
  Prayer_Calculation_Method: number;
  Set_Prayer_Calculation_Method: (method: number) => void;
  Prayer_School: number;
  Set_Prayer_School: (school: number) => void;
  Prayer_Latitude_Method: number;
  Set_Prayer_Latitude_Method: (method: number) => void;
  Prayer_Time_Format: "12h" | "24h";
  Set_Prayer_Time_Format: (format: "12h" | "24h") => void;
  Prayer_Auto_Location: boolean;
  Set_Prayer_Auto_Location: (enabled: boolean) => void;
  Prayer_Saved_Location: Prayer_Location | null;
  Set_Prayer_Saved_Location: (Location_Data: Prayer_Location | null) => void;

  // Per-Kalimah Settings
  Hover_Translation: string;
  Set_Hover_Translation: (value: string) => void;
  Hover_Translation_Size: number;
  Set_Hover_Translation_Size: (size: number) => void;
  Hover_Transliteration: Transliterator_Type;
  Set_Hover_Transliteration: (value: Transliterator_Type) => void;
  Hover_Transliteration_Size: number;
  Set_Hover_Transliteration_Size: (size: number) => void;
  Hover_Recitation: boolean;
  Set_Hover_Recitation: (enabled: boolean) => void;
  Inline_Translation: string;
  Set_Inline_Translation: (value: string) => void;
  Inline_Translation_Size: number;
  Set_Inline_Translation_Size: (size: number) => void;
  Inline_Transliteration: Transliterator_Type;
  Set_Inline_Transliteration: (value: Transliterator_Type) => void;
  Inline_Transliteration_Size: number;
  Set_Inline_Transliteration_Size: (size: number) => void;

  // Ayah-Level Settings
  Ayah_Translation: boolean;
  Set_Ayah_Translation: (enabled: boolean) => void;
  Auto_Scroll_During_Playback: boolean;
  Set_Auto_Scroll_During_Playback: (enabled: boolean) => void;
  Selected_Translations: string[];
  Set_Selected_Translations: (Translations: string[]) => void;
  Show_Arabic_Text: boolean;
  Set_Show_Arabic_Text: (show: boolean) => void;
  Selected_Reciter: string;
  Set_Selected_Reciter: (Reciter: string) => void;
  Selected_Translator: string;
  Set_Selected_Translator: (translator: string) => void;

  // Translation catalog (from API) + User-managed Active Translation IDs
  Available_Translations: Mudkhal_Qaimat_At_Tarjamah[];
  Set_Available_Translations: React.Dispatch<React.SetStateAction<Mudkhal_Qaimat_At_Tarjamah[]>>;
  Active_Translation_IDs: string[];
  Set_Active_Translation_IDs: React.Dispatch<React.SetStateAction<string[]>>;
  Toggle_Translation: (id: string) => void;

  // Hadith Settings - General
  Show_Hadith_Translation: boolean;
  Set_Show_Hadith_Translation: (enabled: boolean) => void;
  Show_Hadith_Transliteration: boolean;
  Set_Show_Hadith_Transliteration: (enabled: boolean) => void;

  // Hadith Settings - Inline
  Show_Hadith_Inline_Translation: boolean;
  Set_Show_Hadith_Inline_Translation: (enabled: boolean) => void;
  Show_Hadith_Inline_Transliteration: boolean;
  Set_Show_Hadith_Inline_Transliteration: (enabled: boolean) => void;

  // Hadith Settings - Hover
  Show_Hadith_Hover_Translation: boolean;
  Set_Show_Hadith_Hover_Translation: (enabled: boolean) => void;
  Show_Hadith_Hover_Transliteration: boolean;
  Set_Show_Hadith_Hover_Transliteration: (enabled: boolean) => void;

  // Hadith Settings - Selected Editions
  Selected_Hadith_Translation_Edition: string;
  Set_Selected_Hadith_Translation_Edition: (v: string) => void;
  Selected_Hadith_Transliteration_Edition: string;
  Set_Selected_Hadith_Transliteration_Edition: (v: string) => void;
  Selected_Hadith_Inline_Translation_Edition: string;
  Set_Selected_Hadith_Inline_Translation_Edition: (v: string) => void;
  Selected_Hadith_Inline_Transliteration_Edition: string;
  Set_Selected_Hadith_Inline_Transliteration_Edition: (v: string) => void;
  Selected_Hadith_Hover_Translation_Edition: string;
  Set_Selected_Hadith_Hover_Translation_Edition: (v: string) => void;
  Selected_Hadith_Hover_Transliteration_Edition: string;
  Set_Selected_Hadith_Hover_Transliteration_Edition: (v: string) => void;

  // Hadith font sizes
  Hadith_Arabic_Font_Size: number;
  Set_Hadith_Arabic_Font_Size: (size: number) => void;
  Hadith_Translation_Font_Size: number;
  Set_Hadith_Translation_Font_Size: (size: number) => void;
  Hadith_Transliteration_Font_Size: number;
  Set_Hadith_Transliteration_Font_Size: (size: number) => void;
  Hadith_Inline_Translation_Font_Size: number;
  Set_Hadith_Inline_Translation_Font_Size: (size: number) => void;
  Hadith_Inline_Transliteration_Font_Size: number;
  Set_Hadith_Inline_Transliteration_Font_Size: (size: number) => void;

  // Dua Settings - General
  Show_Dua_Translation: boolean;
  Set_Show_Dua_Translation: (enabled: boolean) => void;
  Show_Dua_Transliteration: boolean;
  Set_Show_Dua_Transliteration: (enabled: boolean) => void;

  // Dua Settings - Inline
  Show_Dua_Inline_Translation: boolean;
  Set_Show_Dua_Inline_Translation: (enabled: boolean) => void;
  Show_Dua_Inline_Transliteration: boolean;
  Set_Show_Dua_Inline_Transliteration: (enabled: boolean) => void;

  // Dua Settings - Hover
  Show_Dua_Hover_Translation: boolean;
  Set_Show_Dua_Hover_Translation: (enabled: boolean) => void;
  Show_Dua_Hover_Transliteration: boolean;
  Set_Show_Dua_Hover_Transliteration: (enabled: boolean) => void;

  // Dua font sizes
  Dua_Arabic_Font_Size: number;
  Set_Dua_Arabic_Font_Size: (size: number) => void;
  Dua_Translation_Font_Size: number;
  Set_Dua_Translation_Font_Size: (size: number) => void;
  Dua_Transliteration_Font_Size: number;
  Set_Dua_Transliteration_Font_Size: (size: number) => void;
  Dua_Inline_Translation_Font_Size: number;
  Set_Dua_Inline_Translation_Font_Size: (size: number) => void;
  Dua_Inline_Transliteration_Font_Size: number;
  Set_Dua_Inline_Transliteration_Font_Size: (size: number) => void;

  // Transliteration Settings (Ayah Level)
  Transliteration_Size: number;
  Set_Transliteration_Size: (size: number) => void;
  Selected_Ayah_Transliterator: Transliterator_Type;
  Set_Selected_Ayah_Transliterator: (transliterator: Transliterator_Type) => void;

  // Surah Info Settings
  Surah_Info_Provider: string;
  Set_Surah_Info_Provider: (provider: string) => void;
  Surah_Info_Text_Size: number;
  Set_Surah_Info_Text_Size: (size: number) => void;

  // Tafsir Settings
  Tafsir_Provider: string;
  Set_Tafsir_Provider: (provider: string) => void;
  Tafsir_Text_Size: number;
  Set_Tafsir_Text_Size: (size: number) => void;

  Hide_Ayaat: boolean;
  Set_Hide_Ayaat: (value: boolean) => void;
  Hide_Verse_Markers: boolean;
  Set_Hide_Ayah_Markers: (value: boolean) => void;
  Record_Audio_Enabled: boolean;
  Set_Record_Audio_Enabled: (value: boolean) => void;
  Hifz: Hifz_Progress;

  // Accessibility (High_Contrast zit in de gedeelde app-state)
  Reduce_Motion: boolean;
  Set_Reduce_Motion: (v: boolean) => void;
  Underline_Links: boolean;
  Set_Underline_Links: (v: boolean) => void;
  Screen_Reader_Hints: boolean;
  Set_Screen_Reader_Hints: (v: boolean) => void;
  UI_Text_Scale: number; // 0.85 - 1.5
  Set_UI_Text_Scale: (v: number) => void;
}

/* ============================================================================
   GECOMBINEERD CONTEXT TYPE
   ========================================================================== */

interface App_Context_Type extends App_State, Quran_Context_Type {
  // Taal-app
  Available_Learning_Languages: string[];
  Active_Languages: string[];
  Inactive_Languages: string[];

  login: (email: string, password: string) => boolean;
  signup: (firstName: string, email: string, password: string) => boolean;
  logout: () => void;
  Set_Interface_Language: (lang: string) => void;
  Set_Selected_Concept: (concept: string) => void;
  Set_Learning_Language: (lang: string) => void;
  Complete_Introduction: () => void;
  Add_Course: (course: Course) => boolean;
  Set_Active_Course: (course: Course) => void;
  Get_Review: (Word_ID: string) => Review_State;
  Record_Review: (Word_ID: string, Correct: boolean) => void;
  Remove_Course: (Course_Name: string) => void;

  // Gedeeld (theme / contrast / settings-sidebar)
  Set_Theme: (t: Theme_Choice) => void;
  Set_Text_Size: (t: Text_Size) => void;
  Set_High_Contrast: (v: boolean) => void;
  Is_Settings_Sidebar_Open: boolean;
  Set_Settings_Sidebar_Open: (open: boolean) => void;

  Update_Button_Customization: (
    variant: ButtonVariant,
    state: ButtonState,
    key: keyof ButtonStateConfig,
    value: any
  ) => void;

  Add_Recall_Item: (item: Recall_Item) => void;
  Remove_Recall_Item: (id: string) => void;
  Set_Browse_Path: (path: string[]) => void;
  Push_Browse: (segment: string) => void;
  Pop_Browse: () => void;
  Reset_Browse: () => void;
  Set_Active_Recall: (r: Active_Recall | null) => void;
  Set_Recall_Return_Path: (p: string[] | null) => void;

  Select_Mode: boolean;
  Set_Select_Mode: React.Dispatch<React.SetStateAction<boolean>>;
  selected: Set<string>;
  Set_Selected: React.Dispatch<React.SetStateAction<Set<string>>>;

  Filter_Open: boolean;
  Set_Filter_Open: (open: boolean) => void;
  Selected_Filter: Filter_Type;
  Set_Selected_Filter: (filter: Filter_Type) => void;

  filter: Filter_Type;
  setFilter: (filter: Filter_Type) => void;
}

const AppContext = createContext<App_Context_Type | null>(null);

export function Use_App() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("Use_App must be inside App_Provider");
  return ctx;
}

/* ============================================================================
   DEFAULTS & STORAGE — Taal-app
   ========================================================================== */

const Default_Button_Customization: ButtonCustomizationMap = {
  primary: {
    normal: { bgColor: "#ffffff", textColor: "#0f172a", borderRadius: 24, hasBorder: false, borderColor: "#ffffff" },
    hover:  { bgColor: "#f1f5f9", textColor: "#0f172a", borderRadius: 24, hasBorder: false, borderColor: "#ffffff" },
    active: { bgColor: "#e2e8f0", textColor: "#0f172a", borderRadius: 24, hasBorder: false, borderColor: "#ffffff" },
  },
  secondary: {
    normal: { bgColor: "#1e293b", textColor: "#ffffff", borderRadius: 24, hasBorder: false, borderColor: "#334155" },
    hover:  { bgColor: "#334155", textColor: "#ffffff", borderRadius: 24, hasBorder: false, borderColor: "#334155" },
    active: { bgColor: "#475569", textColor: "#ffffff", borderRadius: 24, hasBorder: false, borderColor: "#334155" },
  },
};

const Default_State: App_State = {
  Is_Authenticated: false,
  user: null,
  Interface_Language: "English",
  Selected_Concept: "language",
  Learning_Language: null,
  Introduction_Completed: false,
  courses: [],
  reviews: [],
  theme: "system",
  textSize: "md",
  High_Contrast: false,
  buttonCustomization: Default_Button_Customization,
  Recall_Queue: [],
  Browse_Path: [],
  Active_Recall: null,
  Recall_Return_Path: null,
};

const App_Storage_Key = "appState";

/* ============================================================================
   DEFAULTS & STORAGE — Quran-app
   ========================================================================== */

const Storage_Key = "app-Settings";
const Active_Translations_Storage_Key = "quran_active_translation_ids";

// Let op: theme en High_Contrast zitten niet meer hier, die staan in de gedeelde app-state.
interface Persisted_Settings {
  Current_Language: string;
  layout: Quran_Layout;
  Quran_Font: Quran_Font_Family;
  fontSize: number;
  Translation_Font_Size: number;
  // Prayer Times
  Prayer_Calculation_Method: number;
  Prayer_School: number;
  Prayer_Latitude_Method: number;
  Prayer_Time_Format: "12h" | "24h";
  Prayer_Auto_Location: boolean;
  prayerSavedLocationCity: string;
  prayerSavedLocationCountry: string;
  prayerSavedLocationLat: number;
  prayerSavedLocationLng: number;
  // Per-Kalimah Settings
  Hover_Translation: string;
  Hover_Translation_Size: number;
  Hover_Transliteration: Transliterator_Type;
  Hover_Transliteration_Size: number;
  Hover_Recitation: boolean;
  Inline_Translation: string;
  Inline_Translation_Size: number;
  Inline_Transliteration: Transliterator_Type;
  Inline_Transliteration_Size: number;
  // Ayah-Level Settings
  Ayah_Translation: boolean;
  Auto_Scroll_During_Playback: boolean;
  Show_Arabic_Text: boolean;
  Selected_Reciter: string;
  Selected_Translator: string;
  // Hadith Settings - Toggles
  Show_Hadith_Translation: boolean;
  Show_Hadith_Transliteration: boolean;
  Show_Hadith_Inline_Translation: boolean;
  Show_Hadith_Inline_Transliteration: boolean;
  Show_Hadith_Hover_Translation: boolean;
  Show_Hadith_Hover_Transliteration: boolean;
  // Hadith Settings - Selected Editions
  Selected_Hadith_Translation_Edition: string;
  Selected_Hadith_Transliteration_Edition: string;
  Selected_Hadith_Inline_Translation_Edition: string;
  Selected_Hadith_Inline_Transliteration_Edition: string;
  Selected_Hadith_Hover_Translation_Edition: string;
  Selected_Hadith_Hover_Transliteration_Edition: string;
  // Hadith font sizes
  Hadith_Arabic_Font_Size: number;
  Hadith_Translation_Font_Size: number;
  Hadith_Transliteration_Font_Size: number;
  Hadith_Inline_Translation_Font_Size: number;
  Hadith_Inline_Transliteration_Font_Size: number;
  // Dua Settings
  Show_Dua_Translation: boolean;
  Show_Dua_Transliteration: boolean;
  Show_Dua_Inline_Translation: boolean;
  Show_Dua_Inline_Transliteration: boolean;
  Show_Dua_Hover_Translation: boolean;
  Show_Dua_Hover_Transliteration: boolean;
  Dua_Arabic_Font_Size: number;
  Dua_Translation_Font_Size: number;
  Dua_Transliteration_Font_Size: number;
  Dua_Inline_Translation_Font_Size: number;
  Dua_Inline_Transliteration_Font_Size: number;
  // Transliteration Settings (Ayah Level)
  Transliteration_Size: number;
  Selected_Ayah_Transliterator: Transliterator_Type;

  Hide_Ayaat: boolean;
  Hide_Verse_Markers: boolean;
  Record_Audio_Enabled: boolean;

  // Tafsir Settings
  Tafsir_Provider: string;
  Tafsir_Text_Size: number;

  // Surah Info
  Surah_Info_Provider: string;
  Surah_Info_Text_Size: number;

  Reading_Idle_Timeout: number;
  Reading_Save_Interval: number;
  Reading_Tracking_Enabled: boolean;

  // Accessibility
  Reduce_Motion: boolean;
  Underline_Links: boolean;
  Screen_Reader_Hints: boolean;
  UI_Text_Scale: number;
}

const Defaults: Persisted_Settings = {
  Current_Language: "en",
  layout: "Ayah",
  Quran_Font: "Uthmani",
  fontSize: 5,
  Translation_Font_Size: 3,
  // Prayer Times defaults
  Prayer_Calculation_Method: 2,
  Prayer_School: 0,
  Prayer_Latitude_Method: 3,
  Prayer_Time_Format: "12h",
  Prayer_Auto_Location: true,
  prayerSavedLocationCity: "",
  prayerSavedLocationCountry: "",
  prayerSavedLocationLat: 0,
  prayerSavedLocationLng: 0,
  // Per-Kalimah defaults
  Hover_Translation: "Direct",
  Hover_Translation_Size: 3,
  Hover_Transliteration: "None",
  Hover_Transliteration_Size: 3,
  Hover_Recitation: true,
  Inline_Translation: "None",
  Inline_Translation_Size: 3,
  Inline_Transliteration: "None",
  Inline_Transliteration_Size: 3,
  // Ayah-Level defaults
  Ayah_Translation: true,
  Auto_Scroll_During_Playback: true,
  Show_Arabic_Text: true,
  Selected_Reciter: "Mishary_Rashid_Alafasy",
  Selected_Translator: "Direct",
  // Hadith defaults - Toggles
  Show_Hadith_Translation: true,
  Show_Hadith_Transliteration: false,
  Show_Hadith_Inline_Translation: false,
  Show_Hadith_Inline_Transliteration: false,
  Show_Hadith_Hover_Translation: true,
  Show_Hadith_Hover_Transliteration: true,
  // Hadith defaults - Selected Editions
  Selected_Hadith_Translation_Edition: "English",
  Selected_Hadith_Transliteration_Edition: "",
  Selected_Hadith_Inline_Translation_Edition: "",
  Selected_Hadith_Inline_Transliteration_Edition: "",
  Selected_Hadith_Hover_Translation_Edition: "",
  Selected_Hadith_Hover_Transliteration_Edition: "",
  // Hadith font sizes
  Hadith_Arabic_Font_Size: 7,
  Hadith_Translation_Font_Size: 7,
  Hadith_Transliteration_Font_Size: 7,
  Hadith_Inline_Translation_Font_Size: 2,
  Hadith_Inline_Transliteration_Font_Size: 2,
  // Dua defaults
  Show_Dua_Translation: true,
  Show_Dua_Transliteration: false,
  Show_Dua_Inline_Translation: true,
  Show_Dua_Inline_Transliteration: false,
  Show_Dua_Hover_Translation: false,
  Show_Dua_Hover_Transliteration: false,
  Dua_Arabic_Font_Size: 5,
  Dua_Translation_Font_Size: 3,
  Dua_Transliteration_Font_Size: 3,
  Dua_Inline_Translation_Font_Size: 2,
  Dua_Inline_Transliteration_Font_Size: 2,
  // Transliteration defaults
  Transliteration_Size: 3,
  Selected_Ayah_Transliterator: "None",
  // Surah Info
  Surah_Info_Provider: "Ibn-Ashur",
  Surah_Info_Text_Size: 3,
  // Tafsir
  Tafsir_Provider: "Ibn-Kathir",
  Tafsir_Text_Size: 3,

  Hide_Ayaat: false,
  Hide_Verse_Markers: false,
  Record_Audio_Enabled: false,

  Reading_Idle_Timeout: 60, // seconden
  Reading_Save_Interval: 10, // seconden
  Reading_Tracking_Enabled: true,

  // Accessibility defaults
  Reduce_Motion: false,
  Underline_Links: false,
  Screen_Reader_Hints: false,
  UI_Text_Scale: 1,
};

// Ruwe, oude Quran-instellingen (voor migratie van theme / High_Contrast naar de gedeelde state)
function Read_Legacy_Quran_Raw(): { theme?: Theme_Choice; High_Contrast?: boolean } {
  try {
    const saved = localStorage.getItem(Storage_Key);
    if (saved) return JSON.parse(saved) ?? {};
  } catch {}
  return {};
}

function Load_Settings(): Persisted_Settings {
  try {
    const saved = localStorage.getItem(Storage_Key);
    if (saved) return { ...Defaults, ...JSON.parse(saved) };
  } catch {}
  return Defaults;
}

function Save_Settings(s: Persisted_Settings) {
  try { localStorage.setItem(Storage_Key, JSON.stringify(s)); } catch {}
}

function Load_Active_Translation_IDs(): string[] {
  try {
    const saved = localStorage.getItem(Active_Translations_Storage_Key);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/* ============================================================================
   STATE INITIALISATIE — Taal-app (+ migratie van gedeelde velden)
   ========================================================================== */

function Load_App_State(): App_State {
  const URL_Path = typeof window !== "undefined" ? URL_To_Browse_Path(window.location.pathname) : null;
  const Legacy = Read_Legacy_Quran_Raw();

  let base: App_State;
  let saved_has_theme = false;
  let saved_has_contrast = false;

  const saved = localStorage.getItem(App_Storage_Key);
  if (saved) {
    const parsed = JSON.parse(saved);
    const {
      streak, xp, lastPracticeDate,
      practiceScope, pathProgress, exerciseStats,
      Is_Settings_Sidebar_Open: _ignored,
      ...clean
    } = parsed;
    saved_has_theme = clean.theme !== undefined;
    saved_has_contrast = clean.High_Contrast !== undefined;

    const merged: App_State = {
      ...Default_State,
      ...clean,
      Selected_Concept: "language",
      // Fallback als de opgeslagen staat nog geen buttonCustomization bevat
      buttonCustomization: clean.buttonCustomization
        ? { ...Default_Button_Customization, ...clean.buttonCustomization }
        : Default_Button_Customization,
    };
    merged.courses = (merged.courses ?? []).filter((c: Course) => c.concept === "language");
    merged.Recall_Queue = Array.isArray(merged.Recall_Queue) ? merged.Recall_Queue : [];
    merged.Browse_Path = URL_Path ?? (Array.isArray(merged.Browse_Path) ? merged.Browse_Path : []);
    merged.Active_Recall = merged.Active_Recall ?? null;
    merged.Recall_Return_Path = merged.Recall_Return_Path ?? null;
    base = merged;
  } else {
    base = URL_Path ? { ...Default_State, Browse_Path: URL_Path } : Default_State;
  }

  // Eenmalige migratie: gebruik oude Quran-voorkeuren als de gedeelde state ze nog niet had
  if (!saved_has_theme && Legacy.theme) base = { ...base, theme: Legacy.theme };
  if (!saved_has_contrast && typeof Legacy.High_Contrast === "boolean") {
    base = { ...base, High_Contrast: Legacy.High_Contrast };
  }
  return base;
}

/* ============================================================================
   APPEARANCE (gedeeld: theme + text size + contrast)
   ========================================================================== */

function Apply_Appearance(theme: Theme_Choice, textSize: Text_Size, hc: boolean) {
  const root = document.documentElement;
  const Prefers_Dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const Follows_System = theme === "system" || theme === "auto";
  const Is_Dark = theme === "dark" || (Follows_System && Prefers_Dark);

  // Quran-CSS gebruikt ook een "light" class, taal-CSS alleen "dark"
  root.classList.toggle("dark", Is_Dark);
  root.classList.toggle("light", !Is_Dark);
  root.classList.toggle("hc", hc);
  root.classList.toggle("high-contrast", hc);
  root.classList.remove("text-sm", "text-md", "text-lg");
  root.classList.add(`text-${textSize}`);
}

/* ============================================================================
   PROVIDER
   ========================================================================== */

export function App_Provider({ children }: { children: ReactNode }) {
  /* ---------------------------------------------------------------------- */
  /* Taal-app state                                                          */
  /* ---------------------------------------------------------------------- */
  const [state, setState] = useState<App_State>(() => Load_App_State());

  // Gedeeld: één settings-sidebar
  const [Is_Settings_Sidebar_Open, Set_Settings_Sidebar_Open] = useState(false);

  const Current_Interface = state.Interface_Language;

  const Available_Learning_Languages = ALL_LANGUAGES.filter(
    (lang) => lang.toLowerCase() !== Current_Interface.toLowerCase()
  );

  const Active_Languages = ALL_LANGUAGES.filter((lang) =>
    state.courses.some((course) => course.To_Language.toLowerCase() === lang.toLowerCase())
  );

  const Inactive_Languages = ALL_LANGUAGES.filter(
    (lang) =>
      !Active_Languages.some((al) => al.toLowerCase() === lang.toLowerCase()) &&
      lang.toLowerCase() !== Current_Interface.toLowerCase()
  );

  useEffect(() => {
    localStorage.setItem(App_Storage_Key, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const current = window.location.pathname.toLowerCase();
    const Is_Browse_Route = current === "/" || current.startsWith("/language") || current.startsWith("/chess");
    if (!Is_Browse_Route) return;

    const Next_URL = Browse_Path_To_Url(state.Browse_Path);
    if (window.location.pathname !== Next_URL) {
      window.history.pushState(null, "", Next_URL);
    }
  }, [state.Browse_Path]);

  useEffect(() => {
    const Handle_Pop_State = () => {
      const next = URL_To_Browse_Path(window.location.pathname);
      if (!next) return;
      setState((s) => (Same_Browse_Path(s.Browse_Path, next) ? s : { ...s, Browse_Path: next }));
    };
    window.addEventListener("popstate", Handle_Pop_State);
    return () => window.removeEventListener("popstate", Handle_Pop_State);
  }, []);

  // Theme / text size / contrast
  useEffect(() => {
    Apply_Appearance(state.theme, state.textSize, state.High_Contrast);
  }, [state.theme, state.textSize, state.High_Contrast]);

  useEffect(() => {
    if (state.theme !== "system" && state.theme !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => Apply_Appearance(state.theme, state.textSize, state.High_Contrast);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [state.theme, state.textSize, state.High_Contrast]);

  const Ensure_Course = (s: App_State, From_Language: string): App_State => {
    const To_Language =
      s.Learning_Language && s.Learning_Language.toLowerCase() !== From_Language.toLowerCase()
        ? s.Learning_Language
        : (ALL_LANGUAGES.find((l) => l.toLowerCase() !== From_Language.toLowerCase()) ?? "English");
    const course: Course = { From_Language, concept: "language", To_Language };
    const exists = s.courses.some(
      (c) =>
        c.From_Language.toLowerCase() === From_Language.toLowerCase() &&
        c.concept === "language" &&
        c.To_Language.toLowerCase() === To_Language.toLowerCase()
    );
    return {
      ...s,
      Learning_Language: To_Language,
      courses: exists ? s.courses : [...s.courses, course],
    };
  };

  const login = (email: string, password: string) => {
    if (email === "a@mail.com" && password === "A") {
      setState((s) =>
        Ensure_Course(
          { ...s, Is_Authenticated: true, user: { firstName: "Demo", email } },
          s.Interface_Language ?? "English"
        )
      );
      return true;
    }
    return false;
  };

  const signup = (firstName: string, email: string, _password: string) => {
    setState((s) =>
      Ensure_Course(
        { ...s, Is_Authenticated: true, user: { firstName, email } },
        s.Interface_Language ?? "English"
      )
    );
    return true;
  };

  const logout = () => {
    setState((s) => ({
      ...Default_State,
      theme: s.theme,
      textSize: s.textSize,
      High_Contrast: s.High_Contrast,
    }));
  };

  const Set_Interface_Language = (lang: string) =>
    setState((s) => {
      let Learning_Language = s.Learning_Language;
      if (Learning_Language?.toLowerCase() === lang.toLowerCase()) {
        const fallback = ALL_LANGUAGES.find((l) => l.toLowerCase() !== lang.toLowerCase()) ?? null;
        Learning_Language = fallback;
      }
      return { ...s, Interface_Language: lang, Learning_Language };
    });

  const Set_Selected_Concept = (concept: string) => setState((s) => ({ ...s, Selected_Concept: concept }));

  const Set_Learning_Language = (lang: string) => {
    setState((s) => {
      const course: Course = { From_Language: s.Interface_Language, concept: s.Selected_Concept!, To_Language: lang };
      const exists = s.courses.some(
        (c) =>
          c.From_Language.toLowerCase() === course.From_Language.toLowerCase() &&
          c.concept === course.concept &&
          c.To_Language.toLowerCase() === course.To_Language.toLowerCase()
      );
      const courses = exists ? s.courses : [...s.courses, course];
      return { ...s, Learning_Language: lang, courses };
    });
  };

  const Complete_Introduction = () => setState((s) => ({ ...s, Introduction_Completed: true }));

  const Add_Course = (course: Course): boolean => {
    const exists = state.courses.some(
      (c) =>
        c.From_Language.toLowerCase() === course.From_Language.toLowerCase() &&
        c.concept === course.concept &&
        c.To_Language.toLowerCase() === course.To_Language.toLowerCase()
    );
    if (exists) return false;
    setState((s) => ({
      ...s,
      courses: [...s.courses, course],
      Interface_Language: course.From_Language,
      Selected_Concept: course.concept,
      Learning_Language: course.To_Language,
    }));
    return true;
  };

  const Set_Active_Course = (course: Course) => {
    setState((s) => ({
      ...s,
      Interface_Language: course.From_Language,
      Selected_Concept: course.concept,
      Learning_Language: course.To_Language,
    }));
  };

  const Get_Review = (Word_ID: string): Review_State => {
    const existing = state.reviews.find((r) => r.Word_ID === Word_ID);
    if (!existing) return Create_Review_State(Word_ID);
    return { ease: 2.5, reps: existing.learned ? 1 : 0, lapses: 0, ...existing };
  };

  const Record_Review = (Word_ID: string, Correct: boolean) => {
    setState((s) => {
      const existing = s.reviews.find((r) => r.Word_ID === Word_ID);
      const current: Review_State = existing
        ? { ease: 2.5, reps: existing.learned ? 1 : 0, lapses: 0, ...existing }
        : Create_Review_State(Word_ID);
      const updated = Update_Review(current, Correct);
      const reviews = existing
        ? s.reviews.map((r) => (r.Word_ID === Word_ID ? updated : r))
        : [...s.reviews, updated];
      return { ...s, reviews };
    });
  };

  const Remove_Course = (Course_Name: string) => {
    setState((s) => {
      const Updated_Courses = s.courses.filter(
        (c) => c.concept !== "language" || c.To_Language.toLowerCase() !== Course_Name.toLowerCase()
      );

      let Learning_Language = s.Learning_Language;
      if (Learning_Language?.toLowerCase() === Course_Name.toLowerCase()) {
        const remaining = Updated_Courses.find((c) => c.concept === "language");
        Learning_Language = remaining ? remaining.To_Language : null;
      }

      return { ...s, courses: Updated_Courses, Learning_Language };
    });
  };

  const Set_Theme = (theme: Theme_Choice) => setState((s) => ({ ...s, theme }));
  const Set_Text_Size = (textSize: Text_Size) => setState((s) => ({ ...s, textSize }));
  const Set_High_Contrast = (High_Contrast: boolean) => setState((s) => ({ ...s, High_Contrast }));

  const Update_Button_Customization = (
    variant: ButtonVariant,
    stateKey: ButtonState,
    key: keyof ButtonStateConfig,
    value: any
  ) => {
    setState((s) => ({
      ...s,
      buttonCustomization: {
        ...s.buttonCustomization,
        [variant]: {
          ...s.buttonCustomization[variant],
          [stateKey]: {
            ...s.buttonCustomization[variant][stateKey],
            [key]: value,
          },
        },
      },
    }));
  };

  const Add_Recall_Item = (item: Recall_Item) =>
    setState((s) => {
      const others = s.Recall_Queue.filter((r) => r.id !== item.id);
      return { ...s, Recall_Queue: [...others, item] };
    });
  const Remove_Recall_Item = (id: string) =>
    setState((s) => ({ ...s, Recall_Queue: s.Recall_Queue.filter((r) => r.id !== id) }));

  const Set_Browse_Path = (Browse_Path: string[]) => setState((s) => ({ ...s, Browse_Path }));
  const Push_Browse = (segment: string) => setState((s) => ({ ...s, Browse_Path: [...s.Browse_Path, segment] }));
  const Pop_Browse = () => setState((s) => ({ ...s, Browse_Path: s.Browse_Path.slice(0, -1) }));
  const Reset_Browse = () => setState((s) => ({ ...s, Browse_Path: [] }));
  const Set_Active_Recall = (Active_Recall: Active_Recall | null) => setState((s) => ({ ...s, Active_Recall }));
  const Set_Recall_Return_Path = (Recall_Return_Path: string[] | null) =>
    setState((s) => ({ ...s, Recall_Return_Path }));

  const [Select_Mode, Set_Select_Mode] = useState<boolean>(false);
  const [selected, Set_Selected] = useState<Set<string>>(new Set());

  const [Filter_Open, Set_Filter_Open] = useState(false);
  const [Selected_Filter, Set_Selected_Filter] = useState<Filter_Type>("all");

  /* ---------------------------------------------------------------------- */
  /* Quran-app state                                                         */
  /* ---------------------------------------------------------------------- */
  const initial = useMemo(() => Load_Settings(), []);

  const [Is_Search_Sidebar_Open, Set_Search_Sidebar_Open] = useState(false);
  const [Is_Quran_Nav_Sidebar_Open, Set_Quran_Nav_Sidebar_Open] = useState(false);

  const [layout, Set_Layout] = useState<Quran_Layout>(initial.layout);
  const [Current_Language, Set_Current_Language] = useState(initial.Current_Language);
  const [Quran_Font, Set_Quran_Font] = useState<Quran_Font_Family>(initial.Quran_Font);
  const [fontSize, Set_Font_Size] = useState(initial.fontSize);
  const [Translation_Font_Size, Set_Translation_Font_Size] = useState(initial.Translation_Font_Size);

  // Prayer Times Settings
  const [Prayer_Calculation_Method, Set_Prayer_Calculation_Method] = useState(initial.Prayer_Calculation_Method);
  const [Prayer_School, Set_Prayer_School] = useState(initial.Prayer_School);
  const [Prayer_Latitude_Method, Set_Prayer_Latitude_Method] = useState(initial.Prayer_Latitude_Method);
  const [Prayer_Time_Format, Set_Prayer_Time_Format] = useState<"12h" | "24h">(initial.Prayer_Time_Format);
  const [Prayer_Auto_Location, Set_Prayer_Auto_Location] = useState(initial.Prayer_Auto_Location);
  const [Prayer_Saved_Location, Set_Prayer_Saved_Location_State] = useState<Prayer_Location | null>(
    initial.prayerSavedLocationCity
      ? {
          city: initial.prayerSavedLocationCity,
          country: initial.prayerSavedLocationCountry,
          lat: initial.prayerSavedLocationLat,
          lng: initial.prayerSavedLocationLng,
        }
      : null
  );

  const Set_Prayer_Saved_Location = useCallback((Location_Data: Prayer_Location | null) => {
    Set_Prayer_Saved_Location_State(Location_Data);
  }, []);

  // Per-Kalimah Settings
  const [Hover_Translation, Set_Hover_Translation] = useState<string>(initial.Hover_Translation);
  const [Hover_Translation_Size, Set_Hover_Translation_Size] = useState(initial.Hover_Translation_Size);
  const [Hover_Transliteration, Set_Hover_Transliteration] = useState<Transliterator_Type>(initial.Hover_Transliteration);
  const [Hover_Transliteration_Size, Set_Hover_Transliteration_Size] = useState(initial.Hover_Transliteration_Size);
  const [Hover_Recitation, Set_Hover_Recitation] = useState(initial.Hover_Recitation);
  const [Inline_Translation, Set_Inline_Translation] = useState<string>(initial.Inline_Translation);
  const [Inline_Translation_Size, Set_Inline_Translation_Size] = useState(initial.Inline_Translation_Size);
  const [Inline_Transliteration, Set_Inline_Transliteration] = useState<Transliterator_Type>(initial.Inline_Transliteration);
  const [Inline_Transliteration_Size, Set_Inline_Transliteration_Size] = useState(initial.Inline_Transliteration_Size);

  // Ayah-Level Settings
  const [Ayah_Translation, Set_Ayah_Translation] = useState(initial.Ayah_Translation);
  const [Auto_Scroll_During_Playback, Set_Auto_Scroll_During_Playback] = useState(initial.Auto_Scroll_During_Playback);
  const [Selected_Translations, Set_Selected_Translations] = useState<string[]>(["Translation"]);
  const [Show_Arabic_Text, Set_Show_Arabic_Text] = useState(initial.Show_Arabic_Text);
  const [Selected_Reciter, Set_Selected_Reciter] = useState(initial.Selected_Reciter);
  const [Selected_Translator, Set_Selected_Translator] = useState(initial.Selected_Translator);

  // Translation catalog (from API) + Active Translation IDs
  const [Available_Translations, Set_Available_Translations] = useState<Mudkhal_Qaimat_At_Tarjamah[]>([]);
  const [Active_Translation_IDs, Set_Active_Translation_IDs] = useState<string[]>(() => Load_Active_Translation_IDs());

  useEffect(() => {
    try {
      localStorage.setItem(Active_Translations_Storage_Key, JSON.stringify(Active_Translation_IDs));
    } catch (error) {
      console.error("Failed to save Active Translation IDs:", error);
    }
  }, [Active_Translation_IDs]);

  const Toggle_Translation = useCallback((id: string) => {
    Set_Active_Translation_IDs((Prev_IDs) =>
      Prev_IDs.includes(id) ? Prev_IDs.filter((item) => item !== id) : [...Prev_IDs, id]
    );
  }, []);

  // Hadith Settings
  const [Show_Hadith_Translation, Set_Show_Hadith_Translation] = useState(initial.Show_Hadith_Translation);
  const [Show_Hadith_Transliteration, Set_Show_Hadith_Transliteration] = useState(initial.Show_Hadith_Transliteration);
  const [Show_Hadith_Inline_Translation, Set_Show_Hadith_Inline_Translation] = useState(initial.Show_Hadith_Inline_Translation);
  const [Show_Hadith_Inline_Transliteration, Set_Show_Hadith_Inline_Transliteration] = useState(initial.Show_Hadith_Inline_Transliteration);
  const [Show_Hadith_Hover_Translation, Set_Show_Hadith_Hover_Translation] = useState(initial.Show_Hadith_Hover_Translation);
  const [Show_Hadith_Hover_Transliteration, Set_Show_Hadith_Hover_Transliteration] = useState(initial.Show_Hadith_Hover_Transliteration);

  // Hadith Edition selections
  const [Selected_Hadith_Translation_Edition, Set_Selected_Hadith_Translation_Edition] = useState(initial.Selected_Hadith_Translation_Edition);
  const [Selected_Hadith_Transliteration_Edition, Set_Selected_Hadith_Transliteration_Edition] = useState(initial.Selected_Hadith_Transliteration_Edition);
  const [Selected_Hadith_Inline_Translation_Edition, Set_Selected_Hadith_Inline_Translation_Edition] = useState(initial.Selected_Hadith_Inline_Translation_Edition);
  const [Selected_Hadith_Inline_Transliteration_Edition, Set_Selected_Hadith_Inline_Transliteration_Edition] = useState(initial.Selected_Hadith_Inline_Transliteration_Edition);
  const [Selected_Hadith_Hover_Translation_Edition, Set_Selected_Hadith_Hover_Translation_Edition] = useState(initial.Selected_Hadith_Hover_Translation_Edition);
  const [Selected_Hadith_Hover_Transliteration_Edition, Set_Selected_Hadith_Hover_Transliteration_Edition] = useState(initial.Selected_Hadith_Hover_Transliteration_Edition);

  // Hadith font sizes
  const [Hadith_Arabic_Font_Size, Set_Hadith_Arabic_Font_Size] = useState(initial.Hadith_Arabic_Font_Size);
  const [Hadith_Translation_Font_Size, Set_Hadith_Translation_Font_Size] = useState(initial.Hadith_Translation_Font_Size);
  const [Hadith_Transliteration_Font_Size, Set_Hadith_Transliteration_Font_Size] = useState(initial.Hadith_Transliteration_Font_Size);
  const [Hadith_Inline_Translation_Font_Size, Set_Hadith_Inline_Translation_Font_Size] = useState(initial.Hadith_Inline_Translation_Font_Size);
  const [Hadith_Inline_Transliteration_Font_Size, Set_Hadith_Inline_Transliteration_Font_Size] = useState(initial.Hadith_Inline_Transliteration_Font_Size);

  // Dua Settings
  const [Show_Dua_Translation, Set_Show_Dua_Translation] = useState(initial.Show_Dua_Translation);
  const [Show_Dua_Transliteration, Set_Show_Dua_Transliteration] = useState(initial.Show_Dua_Transliteration);
  const [Show_Dua_Inline_Translation, Set_Show_Dua_Inline_Translation] = useState(initial.Show_Dua_Inline_Translation);
  const [Show_Dua_Inline_Transliteration, Set_Show_Dua_Inline_Transliteration] = useState(initial.Show_Dua_Inline_Transliteration);
  const [Show_Dua_Hover_Translation, Set_Show_Dua_Hover_Translation] = useState(initial.Show_Dua_Hover_Translation);
  const [Show_Dua_Hover_Transliteration, Set_Show_Dua_Hover_Transliteration] = useState(initial.Show_Dua_Hover_Transliteration);
  const [Dua_Arabic_Font_Size, Set_Dua_Arabic_Font_Size] = useState(initial.Dua_Arabic_Font_Size);
  const [Dua_Translation_Font_Size, Set_Dua_Translation_Font_Size] = useState(initial.Dua_Translation_Font_Size);
  const [Dua_Transliteration_Font_Size, Set_Dua_Transliteration_Font_Size] = useState(initial.Dua_Transliteration_Font_Size);
  const [Dua_Inline_Translation_Font_Size, Set_Dua_Inline_Translation_Font_Size] = useState(initial.Dua_Inline_Translation_Font_Size);
  const [Dua_Inline_Transliteration_Font_Size, Set_Dua_Inline_Transliteration_Font_Size] = useState(initial.Dua_Inline_Transliteration_Font_Size);

  // Transliteration Settings
  const [Transliteration_Size, Set_Transliteration_Size] = useState(initial.Transliteration_Size);
  const [Selected_Ayah_Transliterator, Set_Selected_Ayah_Transliterator] = useState<Transliterator_Type>(initial.Selected_Ayah_Transliterator);

  // Surah Info
  const [Surah_Info_Provider, Set_Surah_Info_Provider] = useState(initial.Surah_Info_Provider);
  const [Surah_Info_Text_Size, Set_Surah_Info_Text_Size] = useState(initial.Surah_Info_Text_Size);

  // Tafsir Settings
  const [Tafsir_Provider, Set_Tafsir_Provider] = useState(initial.Tafsir_Provider);
  const [Tafsir_Text_Size, Set_Tafsir_Text_Size] = useState(initial.Tafsir_Text_Size);

  const [Reading_Idle_Timeout, Set_Reading_Idle_Timeout] = useState(initial.Reading_Idle_Timeout);
  const [Reading_Save_Interval, Set_Reading_Save_Interval] = useState(initial.Reading_Save_Interval);
  const [Reading_Tracking_Enabled, Set_Reading_Tracking_Enabled] = useState(initial.Reading_Tracking_Enabled);

  const [Hide_Ayaat, Set_Hide_Ayaat] = useState(initial.Hide_Ayaat);
  const [Hide_Verse_Markers, Set_Hide_Ayah_Markers] = useState(initial.Hide_Verse_Markers);
  const [Record_Audio_Enabled, Set_Record_Audio_Enabled] = useState(initial.Record_Audio_Enabled);

  // Accessibility
  const [Reduce_Motion, Set_Reduce_Motion] = useState(initial.Reduce_Motion);
  const [Underline_Links, Set_Underline_Links] = useState(initial.Underline_Links);
  const [Screen_Reader_Hints, Set_Screen_Reader_Hints] = useState(initial.Screen_Reader_Hints);
  const [UI_Text_Scale, Set_UI_Text_Scale] = useState<number>(initial.UI_Text_Scale);

  // Accessibility classes + text scale op <html> (High_Contrast wordt in Apply_Appearance gedaan)
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("reduce-motion", Reduce_Motion);
    root.classList.toggle("underline-links", Underline_Links);
    root.classList.toggle("sr-hints", Screen_Reader_Hints);
    root.style.setProperty("--ui-text-scale", String(UI_Text_Scale));
  }, [Reduce_Motion, Underline_Links, Screen_Reader_Hints, UI_Text_Scale]);

  /* ---------------------------------------------------------------------- */
  /* Hifz (Memorization) progress                                            */
  /* ---------------------------------------------------------------------- */
  const [Completed_Kalimaat, Set_Completed_Kalimaat] = useState<Set<string>>(new Set());

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("hifz_progress");
    if (stored) {
      try {
        const arr = JSON.parse(stored);
        Set_Completed_Kalimaat(new Set(arr));
      } catch (e) {
        console.error("Failed to parse hifz_progress", e);
      }
    }
  }, []);

  // Save to localStorage whenever Completed_Kalimaat changes
  useEffect(() => {
    const arr = Array.from(Completed_Kalimaat);
    localStorage.setItem("hifz_progress", JSON.stringify(arr));
  }, [Completed_Kalimaat]);

  const Mark_Kalimah_Completed = useCallback((SurahId: number, Ayah: number, Kalimah_Index: number) => {
    const key = `${SurahId}:${Ayah}:${Kalimah_Index}`;
    Set_Completed_Kalimaat((prev) => new Set(prev).add(key));
  }, []);

  const Unmark_Kalimah_Completed = useCallback((SurahId: number, Ayah: number, Kalimah_Index: number) => {
    const key = `${SurahId}:${Ayah}:${Kalimah_Index}`;
    Set_Completed_Kalimaat((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const Is_Kalimah_Completed = useCallback(
    (SurahId: number, Ayah: number, Kalimah_Index: number) =>
      Completed_Kalimaat.has(`${SurahId}:${Ayah}:${Kalimah_Index}`),
    [Completed_Kalimaat]
  );

  const Is_Ayah_Completed = useCallback(
    (SurahId: number, Ayah: number, Total_Kalimaat: number) => {
      // Total_Kalimaat includes the Ayah marker; ignore the last Kalimah (Ayah marker)
      for (let i = 0; i < Total_Kalimaat - 1; i++) {
        if (!Is_Kalimah_Completed(SurahId, Ayah, i)) return false;
      }
      return true;
    },
    [Is_Kalimah_Completed]
  );

  const Reset_Kalimah = useCallback((SurahId: number, Ayah: number, Kalimah_Index: number) => {
    const key = `${SurahId}:${Ayah}:${Kalimah_Index}`;
    Set_Completed_Kalimaat((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const Reset_Ayah = useCallback((SurahId: number, Ayah: number) => {
    Set_Completed_Kalimaat((prev) => {
      const next = new Set(prev);
      const prefix = `${SurahId}:${Ayah}:`;
      for (const key of next) {
        if (key.startsWith(prefix)) next.delete(key);
      }
      return next;
    });
  }, []);

  const Reset_Surah = useCallback((SurahId: number) => {
    Set_Completed_Kalimaat((prev) => {
      const next = new Set(prev);
      const prefix = `${SurahId}:`;
      for (const key of next) {
        if (key.startsWith(prefix)) next.delete(key);
      }
      return next;
    });
  }, []);

  const Reset_All = useCallback(() => {
    Set_Completed_Kalimaat(new Set());
  }, []);

  const Hifz: Hifz_Progress = useMemo(
    () => ({
      Completed_Kalimaat,
      Mark_Kalimah_Completed,
      Unmark_Kalimah_Completed,
      Is_Kalimah_Completed,
      Is_Ayah_Completed,
      Reset_Kalimah,
      Reset_Ayah,
      Reset_Surah,
      Reset_All,
    }),
    [
      Completed_Kalimaat, Mark_Kalimah_Completed, Unmark_Kalimah_Completed,
      Is_Kalimah_Completed, Is_Ayah_Completed, Reset_Kalimah, Reset_Ayah, Reset_Surah, Reset_All,
    ]
  );

  /* ---------------------------------------------------------------------- */
  /* Persist Quran-instellingen                                              */
  /* ---------------------------------------------------------------------- */
  const Persisted: Persisted_Settings = {
    Current_Language, layout, Quran_Font, fontSize, Translation_Font_Size,
    Prayer_Calculation_Method, Prayer_School, Prayer_Latitude_Method, Prayer_Time_Format,
    Prayer_Auto_Location,
    prayerSavedLocationCity: Prayer_Saved_Location?.city || "",
    prayerSavedLocationCountry: Prayer_Saved_Location?.country || "",
    prayerSavedLocationLat: Prayer_Saved_Location?.lat || 0,
    prayerSavedLocationLng: Prayer_Saved_Location?.lng || 0,
    Hover_Translation, Hover_Translation_Size,
    Hover_Transliteration, Hover_Transliteration_Size,
    Hover_Recitation,
    Inline_Translation, Inline_Translation_Size,
    Inline_Transliteration, Inline_Transliteration_Size,
    Ayah_Translation, Auto_Scroll_During_Playback, Show_Arabic_Text,
    Selected_Reciter, Selected_Translator,
    Show_Hadith_Translation, Show_Hadith_Transliteration,
    Show_Hadith_Inline_Translation, Show_Hadith_Inline_Transliteration,
    Show_Hadith_Hover_Translation, Show_Hadith_Hover_Transliteration,
    Selected_Hadith_Translation_Edition, Selected_Hadith_Transliteration_Edition,
    Selected_Hadith_Inline_Translation_Edition, Selected_Hadith_Inline_Transliteration_Edition,
    Selected_Hadith_Hover_Translation_Edition, Selected_Hadith_Hover_Transliteration_Edition,
    Hadith_Arabic_Font_Size, Hadith_Translation_Font_Size, Hadith_Transliteration_Font_Size,
    Hadith_Inline_Translation_Font_Size, Hadith_Inline_Transliteration_Font_Size,
    Show_Dua_Translation, Show_Dua_Transliteration,
    Show_Dua_Inline_Translation, Show_Dua_Inline_Transliteration,
    Show_Dua_Hover_Translation, Show_Dua_Hover_Transliteration,
    Dua_Arabic_Font_Size, Dua_Translation_Font_Size, Dua_Transliteration_Font_Size,
    Dua_Inline_Translation_Font_Size, Dua_Inline_Transliteration_Font_Size,
    Transliteration_Size, Selected_Ayah_Transliterator,
    Surah_Info_Provider, Surah_Info_Text_Size,
    Tafsir_Provider, Tafsir_Text_Size,
    Reading_Idle_Timeout, Reading_Save_Interval, Reading_Tracking_Enabled,
    Hide_Ayaat, Hide_Verse_Markers, Record_Audio_Enabled,
    Reduce_Motion, Underline_Links, Screen_Reader_Hints, UI_Text_Scale,
  };

  // Eén serialized dependency i.p.v. een lijst van 70+ losse deps
  const Persisted_Json = JSON.stringify(Persisted);
  useEffect(() => {
    Save_Settings(JSON.parse(Persisted_Json));
  }, [Persisted_Json]);

  /* ---------------------------------------------------------------------- */
  /* Context value                                                           */
  /* ---------------------------------------------------------------------- */
  const Quran_Value: Quran_Context_Type = {
    Is_Search_Sidebar_Open, Set_Search_Sidebar_Open,
    Is_Quran_Nav_Sidebar_Open, Set_Quran_Nav_Sidebar_Open,
    layout, Set_Layout,
    Current_Language, Set_Current_Language,
    Quran_Font, Set_Quran_Font,
    fontSize, Set_Font_Size,
    Translation_Font_Size, Set_Translation_Font_Size,
    Reading_Idle_Timeout, Set_Reading_Idle_Timeout,
    Reading_Save_Interval, Set_Reading_Save_Interval,
    Reading_Tracking_Enabled, Set_Reading_Tracking_Enabled,
    Prayer_Calculation_Method, Set_Prayer_Calculation_Method,
    Prayer_School, Set_Prayer_School,
    Prayer_Latitude_Method, Set_Prayer_Latitude_Method,
    Prayer_Time_Format, Set_Prayer_Time_Format,
    Prayer_Auto_Location, Set_Prayer_Auto_Location,
    Prayer_Saved_Location, Set_Prayer_Saved_Location,
    Hover_Translation, Set_Hover_Translation,
    Hover_Translation_Size, Set_Hover_Translation_Size,
    Hover_Transliteration, Set_Hover_Transliteration,
    Hover_Transliteration_Size, Set_Hover_Transliteration_Size,
    Hover_Recitation, Set_Hover_Recitation,
    Inline_Translation, Set_Inline_Translation,
    Inline_Translation_Size, Set_Inline_Translation_Size,
    Inline_Transliteration, Set_Inline_Transliteration,
    Inline_Transliteration_Size, Set_Inline_Transliteration_Size,
    Ayah_Translation, Set_Ayah_Translation,
    Auto_Scroll_During_Playback, Set_Auto_Scroll_During_Playback,
    Selected_Translations, Set_Selected_Translations,
    Show_Arabic_Text, Set_Show_Arabic_Text,
    Selected_Reciter, Set_Selected_Reciter,
    Selected_Translator, Set_Selected_Translator,
    Available_Translations, Set_Available_Translations,
    Active_Translation_IDs, Set_Active_Translation_IDs,
    Toggle_Translation,
    Show_Hadith_Translation, Set_Show_Hadith_Translation,
    Show_Hadith_Transliteration, Set_Show_Hadith_Transliteration,
    Show_Hadith_Inline_Translation, Set_Show_Hadith_Inline_Translation,
    Show_Hadith_Inline_Transliteration, Set_Show_Hadith_Inline_Transliteration,
    Show_Hadith_Hover_Translation, Set_Show_Hadith_Hover_Translation,
    Show_Hadith_Hover_Transliteration, Set_Show_Hadith_Hover_Transliteration,
    Selected_Hadith_Translation_Edition, Set_Selected_Hadith_Translation_Edition,
    Selected_Hadith_Transliteration_Edition, Set_Selected_Hadith_Transliteration_Edition,
    Selected_Hadith_Inline_Translation_Edition, Set_Selected_Hadith_Inline_Translation_Edition,
    Selected_Hadith_Inline_Transliteration_Edition, Set_Selected_Hadith_Inline_Transliteration_Edition,
    Selected_Hadith_Hover_Translation_Edition, Set_Selected_Hadith_Hover_Translation_Edition,
    Selected_Hadith_Hover_Transliteration_Edition, Set_Selected_Hadith_Hover_Transliteration_Edition,
    Hadith_Arabic_Font_Size, Set_Hadith_Arabic_Font_Size,
    Hadith_Translation_Font_Size, Set_Hadith_Translation_Font_Size,
    Hadith_Transliteration_Font_Size, Set_Hadith_Transliteration_Font_Size,
    Hadith_Inline_Translation_Font_Size, Set_Hadith_Inline_Translation_Font_Size,
    Hadith_Inline_Transliteration_Font_Size, Set_Hadith_Inline_Transliteration_Font_Size,
    Show_Dua_Translation, Set_Show_Dua_Translation,
    Show_Dua_Transliteration, Set_Show_Dua_Transliteration,
    Show_Dua_Inline_Translation, Set_Show_Dua_Inline_Translation,
    Show_Dua_Inline_Transliteration, Set_Show_Dua_Inline_Transliteration,
    Show_Dua_Hover_Translation, Set_Show_Dua_Hover_Translation,
    Show_Dua_Hover_Transliteration, Set_Show_Dua_Hover_Transliteration,
    Dua_Arabic_Font_Size, Set_Dua_Arabic_Font_Size,
    Dua_Translation_Font_Size, Set_Dua_Translation_Font_Size,
    Dua_Transliteration_Font_Size, Set_Dua_Transliteration_Font_Size,
    Dua_Inline_Translation_Font_Size, Set_Dua_Inline_Translation_Font_Size,
    Dua_Inline_Transliteration_Font_Size, Set_Dua_Inline_Transliteration_Font_Size,
    Transliteration_Size, Set_Transliteration_Size,
    Selected_Ayah_Transliterator, Set_Selected_Ayah_Transliterator,
    Surah_Info_Provider, Set_Surah_Info_Provider,
    Surah_Info_Text_Size, Set_Surah_Info_Text_Size,
    Tafsir_Provider, Set_Tafsir_Provider,
    Tafsir_Text_Size, Set_Tafsir_Text_Size,
    Hide_Ayaat, Set_Hide_Ayaat,
    Hide_Verse_Markers, Set_Hide_Ayah_Markers,
    Record_Audio_Enabled, Set_Record_Audio_Enabled,
    Hifz,
    Reduce_Motion, Set_Reduce_Motion,
    Underline_Links, Set_Underline_Links,
    Screen_Reader_Hints, Set_Screen_Reader_Hints,
    UI_Text_Scale, Set_UI_Text_Scale,
  };

  return (
    <AppContext.Provider
      value={{
        // Taal-app state
        ...state,
        Available_Learning_Languages,
        Active_Languages,
        Inactive_Languages,

        // Quran-app state
        ...Quran_Value,

        // Gedeeld
        Is_Settings_Sidebar_Open,
        Set_Settings_Sidebar_Open,
        Set_Theme, Set_Text_Size, Set_High_Contrast,

        // Taal-app acties
        Select_Mode, Set_Select_Mode,
        selected, Set_Selected,
        login, signup, logout, Set_Interface_Language, Set_Selected_Concept,
        Set_Learning_Language, Complete_Introduction, Add_Course, Set_Active_Course,
        Get_Review, Record_Review, Remove_Course,
        Update_Button_Customization,
        Add_Recall_Item, Remove_Recall_Item,
        Set_Browse_Path, Push_Browse, Pop_Browse, Reset_Browse,
        Set_Active_Recall, Set_Recall_Return_Path,
        Filter_Open, Set_Filter_Open,
        Selected_Filter, Set_Selected_Filter,
        filter: Selected_Filter,
        setFilter: Set_Selected_Filter,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}