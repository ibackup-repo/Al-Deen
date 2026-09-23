import { ReactNode } from "react";

export type Settings_Menu = "main" | "repeat" | "Speed";
export type Audio_Play_Level = "Surah" | "Ayah" | "juz" | "hizb";

export interface Audio_Player_Properties {
  Is_Visible: boolean;
  On_Close: () => void;
  Surah_ID?: number;
  Surah_Name?: string;
}

export interface Audio_Player_Main_Properties {
  Is_Playing: boolean;
  Is_Loading_Corpus_Data: boolean;
  Render_Progress: number;
  currentTime: number;
  Duration: number;
  Track_Title: string | null;
  Repeat_Mode: "none" | "Surah" | "page";
  Playback_Speed: number;
  Playback_Mode: "Surah" | "page";
  Volume: number;
  Is_Muted: boolean;
  Settings_Open: boolean;
  Settings_Menu_State: Settings_Menu;
  On_Toggle_Play_Pause: () => void;
  On_Seek: (value: number[]) => void;
  On_Volume_Change: (value: number[]) => void;
  On_Toggle_Mute: () => void;
  On_Settings_Open_Change: (Open: boolean) => void;
  On_Settings_Menu_Change: (Menu: Settings_Menu) => void;
  On_Repeat_Mode_Change: (Mode: "none" | "Surah" | "page") => void;
  On_Playback_Speed_Change: (Speed: number) => void;
  On_Close: () => void;
  Current_Surah_ID?: number;
  On_Select_Surah: (id: number) => void;
  On_Select_Ayah: (Surah_ID: number, Ayah: number) => void;
  On_Select_Juz: (juz: number) => void;
  On_Select_Hizb: (hizb: number) => void;
}
