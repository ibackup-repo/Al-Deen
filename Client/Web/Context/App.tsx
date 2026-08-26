import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from "react";

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

interface Hifz_Progress {
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
interface App_Context_Type {
  Is_Settings_Sidebar_Open: boolean;
  Set_Settings_Sidebar_Open: (Open: boolean) => void;
  Is_Search_Sidebar_Open: boolean;
  Set_Search_Sidebar_Open: (Open: boolean) => void;
  Is_Quran_Nav_Sidebar_Open: boolean;
  Set_Quran_Nav_Sidebar_Open: (Open: boolean) => void;
  layout: Quran_Layout;
  Set_Layout: (layout: Quran_Layout) => void;
  Current_Language: string;
  Set_Current_Language: (Language: string) => void;
  theme: "auto" | "light" | "dark";
  Set_Theme: (theme: "auto" | "light" | "dark") => void;
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
  Prayer_Saved_Location: { city: string; country: string; lat: number; lng: number } | null;
  Set_Prayer_Saved_Location: (Location_Data: { city: string; country: string; lat: number; lng: number } | null) => void;

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
  
  // Hadith Settings - General (main display)
  Show_Hadith_Translation: boolean;
  Set_Show_Hadith_Translation: (enabled: boolean) => void;
  Show_Hadith_Transliteration: boolean;
  Set_Show_Hadith_Transliteration: (enabled: boolean) => void;
  
  // Hadith Settings - Inline (separate from General)
  Show_Hadith_Inline_Translation: boolean;
  Set_Show_Hadith_Inline_Translation: (enabled: boolean) => void;
  Show_Hadith_Inline_Transliteration: boolean;
  Set_Show_Hadith_Inline_Transliteration: (enabled: boolean) => void;
  
  // Hadith Settings - Hover
  Show_Hadith_Hover_Translation: boolean;
  Set_Show_Hadith_Hover_Translation: (enabled: boolean) => void;
  Show_Hadith_Hover_Transliteration: boolean;
  Set_Show_Hadith_Hover_Transliteration: (enabled: boolean) => void;
  
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
  
  // Transliteration Settings (Ayah/Ayah Level)
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

  // Accessibility
  High_Contrast: boolean;
  Set_High_Contrast: (v: boolean) => void;
  Reduce_Motion: boolean;
  Set_Reduce_Motion: (v: boolean) => void;
  Underline_Links: boolean;
  Set_Underline_Links: (v: boolean) => void;
  Screen_Reader_Hints: boolean;
  Set_Screen_Reader_Hints: (v: boolean) => void;
  UI_Text_Scale: number; // 0.85 - 1.5
  Set_UI_Text_Scale: (v: number) => void;
}

const App_Context = createContext<App_Context_Type | undefined>(undefined);

const Storage_Key = "app-Settings";
const Active_Translations_Storage_Key = "quran_active_translation_ids";

interface Persisted_Settings {
  Current_Language: string;
  theme: "auto" | "light" | "dark";
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
  // Transliteration Settings (Ayah/Ayah Level)
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
  High_Contrast: boolean;
  Reduce_Motion: boolean;
  Underline_Links: boolean;
  Screen_Reader_Hints: boolean;
  UI_Text_Scale: number;
}

const Defaults: Persisted_Settings = {
  Current_Language: "en",
  theme: "auto",
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
  Surah_Info_Text_Size: 3, // Normal

  Tafsir_Provider: "Ibn-Kathir",
Tafsir_Text_Size: 3, // Normal

Hide_Ayaat: false,
Hide_Verse_Markers: false,
Record_Audio_Enabled: false,

Reading_Idle_Timeout: 60, // 60 Seconds
Reading_Save_Interval: 10, // Save every 10 Seconds
Reading_Tracking_Enabled: true,

  // Accessibility defaults
  High_Contrast: false,
  Reduce_Motion: false,
  Underline_Links: false,
  Screen_Reader_Hints: false,
  UI_Text_Scale: 1,
};

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

export function App_Provider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => Load_Settings(), []);

  const [Is_Settings_Sidebar_Open, Set_Settings_Sidebar_Open] = useState(false);
  const [Is_Search_Sidebar_Open, Set_Search_Sidebar_Open] = useState(false);
  const [Is_Quran_Nav_Sidebar_Open, Set_Quran_Nav_Sidebar_Open] = useState(false);

  const [layout, Set_Layout] = useState<Quran_Layout>(initial.layout);
  const [Current_Language, Set_Current_Language] = useState(initial.Current_Language);
  const [theme, Set_Theme] = useState<"auto" | "light" | "dark">(initial.theme);
  const [Quran_Font, Set_Quran_Font] = useState<Quran_Font_Family>(initial.Quran_Font);
  const [fontSize, Set_Font_Size] = useState(initial.fontSize);
  const [Translation_Font_Size, Set_Translation_Font_Size] = useState(initial.Translation_Font_Size);
  
  // Prayer Times Settings
  const [Prayer_Calculation_Method, Set_Prayer_Calculation_Method] = useState(initial.Prayer_Calculation_Method);
  const [Prayer_School, Set_Prayer_School] = useState(initial.Prayer_School);
  const [Prayer_Latitude_Method, Set_Prayer_Latitude_Method] = useState(initial.Prayer_Latitude_Method);
  const [Prayer_Time_Format, Set_Prayer_Time_Format] = useState<"12h" | "24h">(initial.Prayer_Time_Format);
  const [Prayer_Auto_Location, Set_Prayer_Auto_Location] = useState(initial.Prayer_Auto_Location);
  const [Prayer_Saved_Location, Set_Prayer_Saved_Location_State] = useState<{ city: string; country: string; lat: number; lng: number } | null>(
    initial.prayerSavedLocationCity ? {
      city: initial.prayerSavedLocationCity,
      country: initial.prayerSavedLocationCountry,
      lat: initial.prayerSavedLocationLat,
      lng: initial.prayerSavedLocationLng,
    } : null
  );

  const Set_Prayer_Saved_Location = useCallback((Location_Data: { city: string; country: string; lat: number; lng: number } | null) => {
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

  // ---------- Translation catalog (from API) + Active Translation IDs ----------
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
      Prev_IDs.includes(id)
        ? Prev_IDs.filter((item) => item !== id)
        : [...Prev_IDs, id]
    );
  }, []);
  
  // Hadith Settings
  const [Show_Hadith_Translation, Set_Show_Hadith_Translation] = useState(initial.Show_Hadith_Translation);
  const [Show_Hadith_Transliteration, Set_Show_Hadith_Transliteration] = useState(initial.Show_Hadith_Transliteration);
  const [Show_Hadith_Inline_Translation, Set_Show_Hadith_Inline_Translation] = useState(initial.Show_Hadith_Inline_Translation);
  const [Show_Hadith_Inline_Transliteration, Set_Show_Hadith_Inline_Transliteration] = useState(initial.Show_Hadith_Inline_Transliteration);
  const [Show_Hadith_Hover_Translation, Set_Show_Hadith_Hover_Translation] = useState(initial.Show_Hadith_Hover_Translation);
  const [Show_Hadith_Hover_Transliteration, Set_Show_Hadith_Hover_Transliteration] = useState(initial.Show_Hadith_Hover_Transliteration);

  // Hadith Edition_Name selections
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

  // Surah_Info
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

// ---------- Accessibility ----------
const [High_Contrast, Set_High_Contrast] = useState(initial.High_Contrast);
const [Reduce_Motion, Set_Reduce_Motion] = useState(initial.Reduce_Motion);
const [Underline_Links, Set_Underline_Links] = useState(initial.Underline_Links);
const [Screen_Reader_Hints, Set_Screen_Reader_Hints] = useState(initial.Screen_Reader_Hints);
const [UI_Text_Scale, Set_UI_Text_Scale] = useState<number>(initial.UI_Text_Scale);

// Apply accessibility classes + text scale to <html>
useEffect(() => {
  const root = document.documentElement;
  root.classList.toggle("high-contrast", High_Contrast);
  root.classList.toggle("reduce-motion", Reduce_Motion);
  root.classList.toggle("underline-links", Underline_Links);
  root.classList.toggle("sr-hints", Screen_Reader_Hints);
  root.style.setProperty("--ui-text-scale", String(UI_Text_Scale));
}, [High_Contrast, Reduce_Motion, Underline_Links, Screen_Reader_Hints, UI_Text_Scale]);
  // ---------- Hifz (Memorization) Progress State ----------
  const [Completed_Kalimaat, Set_Completed_Kalimaat] = useState<Set<string>>(new Set());

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('hifz_progress');
    if (stored) {
      try {
        const arr = JSON.parse(stored);
        Set_Completed_Kalimaat(new Set(arr));
      } catch (e) {
        console.error('Failed to parse hifz_progress', e);
      }
    }
  }, []);

  // Save to localStorage whenever Completed_Kalimaat changes
  useEffect(() => {
    const arr = Array.from(Completed_Kalimaat);
    localStorage.setItem('hifz_progress', JSON.stringify(arr));
  }, [Completed_Kalimaat]);

  // Kalimah-Level operations
  const Mark_Kalimah_Completed = useCallback((SurahId: number, Ayah: number, Kalimah_Index: number) => {
    const key = `${SurahId}:${Ayah}:${Kalimah_Index}`;
    Set_Completed_Kalimaat(prev => new Set(prev).add(key));
  }, []);

  const Unmark_Kalimah_Completed = useCallback((SurahId: number, Ayah: number, Kalimah_Index: number) => {
    const key = `${SurahId}:${Ayah}:${Kalimah_Index}`;
    Set_Completed_Kalimaat(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const Is_Kalimah_Completed = useCallback((SurahId: number, Ayah: number, Kalimah_Index: number) => {
    const key = `${SurahId}:${Ayah}:${Kalimah_Index}`;
    return Completed_Kalimaat.has(key);
  }, [Completed_Kalimaat]);

  const Is_Ayah_Completed = useCallback((SurahId: number, Ayah: number, Total_Kalimaat: number) => {
    // Total_Kalimaat includes the Ayah marker; ignore the last Kalimah (Ayah marker)
    for (let i = 0; i < Total_Kalimaat - 1; i++) {
      if (!Is_Kalimah_Completed(SurahId, Ayah, i)) return false;
    }
    return true;
  }, [Is_Kalimah_Completed]);

  const Reset_Kalimah = useCallback((SurahId: number, Ayah: number, Kalimah_Index: number) => {
    const key = `${SurahId}:${Ayah}:${Kalimah_Index}`;
    Set_Completed_Kalimaat(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const Reset_Ayah = useCallback((SurahId: number, Ayah: number) => {
    Set_Completed_Kalimaat(prev => {
      const next = new Set(prev);
      const prefix = `${SurahId}:${Ayah}:`;
      for (const key of next) {
        if (key.startsWith(prefix)) next.delete(key);
      }
      return next;
    });
  }, []);

  const Reset_Surah = useCallback((SurahId: number) => {
    Set_Completed_Kalimaat(prev => {
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

  const Hifz: Hifz_Progress = {
    Completed_Kalimaat,
    Mark_Kalimah_Completed,
    Unmark_Kalimah_Completed,
    Is_Kalimah_Completed,
    Is_Ayah_Completed,
    Reset_Kalimah,
    Reset_Ayah,
    Reset_Surah,
    Reset_All,
  };
  useEffect(() => {
    Save_Settings({
      Current_Language, theme, layout, Quran_Font, fontSize, Translation_Font_Size,
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
      // Toggles
      Show_Hadith_Translation,
      Show_Hadith_Transliteration,
      Show_Hadith_Inline_Translation,
      Show_Hadith_Inline_Transliteration,
      Show_Hadith_Hover_Translation,
      Show_Hadith_Hover_Transliteration,

      // Selected Editions
      Selected_Hadith_Translation_Edition,
      Selected_Hadith_Transliteration_Edition,
      Selected_Hadith_Inline_Translation_Edition,
      Selected_Hadith_Inline_Transliteration_Edition,
      Selected_Hadith_Hover_Translation_Edition,
      Selected_Hadith_Hover_Transliteration_Edition,

      // font Sizes
      Hadith_Arabic_Font_Size,
      Hadith_Translation_Font_Size,
      Hadith_Transliteration_Font_Size,
      Hadith_Inline_Translation_Font_Size,
      Hadith_Inline_Transliteration_Font_Size,

      Show_Dua_Translation, Show_Dua_Transliteration,
      Show_Dua_Inline_Translation, Show_Dua_Inline_Transliteration,
      Show_Dua_Hover_Translation, Show_Dua_Hover_Transliteration,
      Dua_Arabic_Font_Size, Dua_Translation_Font_Size, Dua_Transliteration_Font_Size,
      Dua_Inline_Translation_Font_Size, Dua_Inline_Transliteration_Font_Size,
      Transliteration_Size, Selected_Ayah_Transliterator,
      Surah_Info_Provider,
      Surah_Info_Text_Size,
      Tafsir_Provider,
Tafsir_Text_Size,
    Reading_Idle_Timeout,
    Reading_Save_Interval,
    Reading_Tracking_Enabled,
    Hide_Ayaat,
Hide_Verse_Markers,
Record_Audio_Enabled,
High_Contrast, Reduce_Motion, Underline_Links, Screen_Reader_Hints, UI_Text_Scale,
    });
  }, [
    Current_Language, theme, layout, Quran_Font, fontSize, Translation_Font_Size,
    Prayer_Calculation_Method, Prayer_School, Prayer_Latitude_Method, Prayer_Time_Format,
    Prayer_Auto_Location, Prayer_Saved_Location,
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
  Reading_Idle_Timeout,
  Reading_Save_Interval,
  Reading_Tracking_Enabled,
  Hide_Ayaat, Hide_Verse_Markers, Record_Audio_Enabled,
  High_Contrast, Reduce_Motion, Underline_Links, Screen_Reader_Hints, UI_Text_Scale,
  ]);

  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const Apply_Theme = () => {
      root.classList.remove("light", "dark");
      root.classList.add(theme === "auto" ? (mq.matches ? "dark" : "light") : theme);
    };
    Apply_Theme();
    if (theme === "auto") {
      mq.addEventListener("change", Apply_Theme);
      return () => mq.removeEventListener("change", Apply_Theme);
    }
  }, [theme]);

  const value = useMemo<App_Context_Type>(() => ({
    Is_Settings_Sidebar_Open, Set_Settings_Sidebar_Open,
    Is_Search_Sidebar_Open, Set_Search_Sidebar_Open,
    Is_Quran_Nav_Sidebar_Open, Set_Quran_Nav_Sidebar_Open,
    layout, Set_Layout,
    Current_Language, Set_Current_Language,
    theme, Set_Theme,
    Quran_Font, Set_Quran_Font,
    fontSize, Set_Font_Size,
    Translation_Font_Size, Set_Translation_Font_Size,
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
    // General Toggles & Setters
    Show_Hadith_Translation, Set_Show_Hadith_Translation,
    Show_Hadith_Transliteration, Set_Show_Hadith_Transliteration,

    // General Selected Editions & Setters
    Selected_Hadith_Translation_Edition, Set_Selected_Hadith_Translation_Edition,
    Selected_Hadith_Transliteration_Edition, Set_Selected_Hadith_Transliteration_Edition,

    // Inline Toggles & Setters
    Show_Hadith_Inline_Translation, Set_Show_Hadith_Inline_Translation,
    Show_Hadith_Inline_Transliteration, Set_Show_Hadith_Inline_Transliteration,

    // Inline Selected Editions & Setters
    Selected_Hadith_Inline_Translation_Edition, Set_Selected_Hadith_Inline_Translation_Edition,
    Selected_Hadith_Inline_Transliteration_Edition, Set_Selected_Hadith_Inline_Transliteration_Edition,

    // Hover Toggles & Setters
    Show_Hadith_Hover_Translation, Set_Show_Hadith_Hover_Translation,
    Show_Hadith_Hover_Transliteration, Set_Show_Hadith_Hover_Transliteration,

    // Hover Selected Editions & Setters
    Selected_Hadith_Hover_Translation_Edition, Set_Selected_Hadith_Hover_Translation_Edition,
    Selected_Hadith_Hover_Transliteration_Edition, Set_Selected_Hadith_Hover_Transliteration_Edition,

    // font Sizes & Setters
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
      Surah_Info_Provider,
  Set_Surah_Info_Provider,
  Surah_Info_Text_Size,
  Set_Surah_Info_Text_Size,
  Tafsir_Provider, Set_Tafsir_Provider,
Tafsir_Text_Size, Set_Tafsir_Text_Size,
  Reading_Idle_Timeout,
  Set_Reading_Idle_Timeout,
  Reading_Save_Interval,
  Set_Reading_Save_Interval,
  Reading_Tracking_Enabled,
  Set_Reading_Tracking_Enabled,
  Hide_Ayaat, Set_Hide_Ayaat,
Hide_Verse_Markers, Set_Hide_Ayah_Markers,
Record_Audio_Enabled, Set_Record_Audio_Enabled,
    Hifz,
    // Accessibility
    High_Contrast, Set_High_Contrast,
    Reduce_Motion, Set_Reduce_Motion,
    Underline_Links, Set_Underline_Links,
    Screen_Reader_Hints, Set_Screen_Reader_Hints,
    UI_Text_Scale, Set_UI_Text_Scale,
  }), [
    Is_Settings_Sidebar_Open, Is_Search_Sidebar_Open, Is_Quran_Nav_Sidebar_Open,
    layout, Current_Language, theme,
    Quran_Font, fontSize, Translation_Font_Size,
    Prayer_Calculation_Method, Prayer_School, Prayer_Latitude_Method, Prayer_Time_Format,
    Prayer_Auto_Location, Set_Prayer_Auto_Location,
    Prayer_Saved_Location, Set_Prayer_Saved_Location,
    Hover_Translation, Hover_Translation_Size,
    Hover_Transliteration, Hover_Transliteration_Size,
    Hover_Recitation,
    Inline_Translation, Inline_Translation_Size,
    Inline_Transliteration, Inline_Transliteration_Size,
    Ayah_Translation, Auto_Scroll_During_Playback, Selected_Translations, Show_Arabic_Text,
    Selected_Reciter, Selected_Translator,
    Available_Translations, Active_Translation_IDs, Toggle_Translation,
    Show_Hadith_Translation, Show_Hadith_Transliteration,
    Show_Hadith_Inline_Translation, Show_Hadith_Inline_Transliteration,
    Show_Hadith_Hover_Translation, Show_Hadith_Hover_Transliteration,
    Hadith_Arabic_Font_Size, Hadith_Translation_Font_Size, Hadith_Transliteration_Font_Size,
    Hadith_Inline_Translation_Font_Size, Hadith_Inline_Transliteration_Font_Size,
    Show_Dua_Translation, Show_Dua_Transliteration,
    Show_Dua_Inline_Translation, Show_Dua_Inline_Transliteration,
    Show_Dua_Hover_Translation, Show_Dua_Hover_Transliteration,
    Dua_Arabic_Font_Size, Dua_Translation_Font_Size, Dua_Transliteration_Font_Size,
    Dua_Inline_Translation_Font_Size, Dua_Inline_Transliteration_Font_Size,
    Transliteration_Size, Selected_Ayah_Transliterator,
      Surah_Info_Provider,
  Set_Surah_Info_Provider,
  Surah_Info_Text_Size,
  Set_Surah_Info_Text_Size,
  Tafsir_Provider, Set_Tafsir_Provider,
Tafsir_Text_Size, Set_Tafsir_Text_Size,
  Reading_Idle_Timeout,
  Set_Reading_Idle_Timeout,
  Reading_Save_Interval,
  Set_Reading_Save_Interval,
  Reading_Tracking_Enabled,
  Set_Reading_Tracking_Enabled,
  Hide_Ayaat, Hide_Verse_Markers, Record_Audio_Enabled,
    Hifz,
    High_Contrast, Reduce_Motion, Underline_Links, Screen_Reader_Hints, UI_Text_Scale,
  ]);

  return <App_Context.Provider value={value}>{children}</App_Context.Provider>;
}

export function Use_App() {
  const context = useContext(App_Context);
  if (context === undefined) throw new Error("Use_App must be used within an App_Provider");
  return context;
}