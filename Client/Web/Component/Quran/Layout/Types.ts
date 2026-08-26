import type React from "react";
import type { Page } from "@/Library/Quran-Types";

export type Reference_Map = React.MutableRefObject<Map<number, HTMLDivElement>>;

export interface Surah_Metadata {
  Surah: number;
  Arabic: string;
  Translation: string;
  Transliteration: string;
  Revelation_Place: string | null;
  Revelation_Order: number | null;
  Ayah_Count: number;
  Start_Page: number;
  End_Page: number;
  Indo_Pak_Ayah_Ending: string[];
  Layout: Record<string, any> | null;
}

export interface Assembled_Ayah {
  Surah: number;
  Ayah: number;
  Arabic: string;
  Presentation_Form_A_Ligature_Based: string | null;
  Presentation_Form_A_Glyph_Based: string | null;
  Indo_Pak_Ayah_Ending: string | null;
}

export interface Assembled_Surah extends Surah_Metadata {
  Ayah: Assembled_Ayah[];
  Kalimah: any[];
}

export interface Page_Ayaat {
  Page_Number: number;
  Ayah: Assembled_Ayah[];
}

export interface Word_Tooltip_Properties {
  Translation?: string;
  Transliteration?: string;
  enabled?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  children: React.ReactNode;
}

export interface Resolved_Kalimah {
  Glyph: string;
  Ayah: Assembled_Ayah | null;
  Kalimah_Index: number;
  Is_Ayah_End: boolean;
  Is_Ayah_Marker: boolean;
  Ayah_ID?: number;
  Transliteration?: string;
}

export interface Basmalah_Kalimah {
  Glyph: string;
  Translation?: string;
  Transliteration?: string;
}

export interface Page_Lines_Properties {
  Resolved_Lines: Resolved_Kalimah[][];
  Font_Class: string;
  Arabic_Font_Size: string;
  Kalimah_Spacing: string;
  Surah_Number: number;
  Ayah_Reference: Reference_Map;
  Highlighted_Ayah: number | null;
  Set_Highlighted_Ayah: (Ayah: number | null) => void;
  Show_Transliteration?: boolean;
  Transliteration_Font_Size?: string;
  Hover_Translation: string | boolean;
  Hover_Transliteration?: string | boolean;
  Inline_Translation: string;
  Inline_Transliteration: string;
  Hide_Ayaat?: boolean;
  Hide_Ayah_Markers?: boolean;
  Basmalah_Kalimaat?: Basmalah_Kalimah[];
  Basmalah_Font_Family?: string;
  Basmalah_Font_Class?: string;
  Basmalah_Font_Size?: string;
  Page_Font_Family?: string;
  Is_Indo_Pak_Font?: boolean;
  Ayah_Marker_Overrides?: string[];
  Is_Uthmani_V4_Font?: boolean;
  Justify_Lines?: boolean;
}

export interface Page_Card_Properties {
  Page_Data: Page_Ayaat;
  Raw_Page_Data: Page | null;
  Page_Index: number;
  Surah_Number: number;
  Resolved_Lines: Resolved_Kalimah[][];
  Container_Class: string;
  Show_Arabic_Text: boolean;
  Show_Transliteration?: boolean;
  Show_Basmalah_On_Page: boolean;
  Basmalah_Kalimaat: Basmalah_Kalimah[];
  Page_Font_Family: string;
  Basmalah_Font_Family?: string;
  Font_Class: string;
  Arabic_Font_Size: string;
  Translation_Font_Size?: string;
  Transliteration_Font_Size?: string;
  Ayah_Reference: Reference_Map;
  Highlighted_Ayah: number | null;
  Set_Highlighted_Ayah: (Ayah: number | null) => void;
  Hover_Translation: string | boolean;
  Hover_Transliteration?: string | boolean;
  Inline_Translation: string;
  Inline_Transliteration: string;
  Hide_Ayaat?: boolean;
  Hide_Ayah_Markers?: boolean;
  Is_Indo_Pak_Font: boolean;
  Ayah_Marker_Overrides: string[];
  Is_Uthmani_V4_Font: boolean;
  Page_Footer?: React.ReactNode | ((Page_Number?: number) => React.ReactNode);
  Kalimah_Spacing: string;
  Layout: string | null;
}

export interface Page_View_Properties {
  Surah: Surah_Metadata;
  Show_Arabic_Text: boolean;
  Hover_Translation: string | boolean;
  Hover_Transliteration?: string | boolean;
  Inline_Translation: string;
  Inline_Transliteration: string;
  Font_Class: string;
  Arabic_Font_Size: string;
  Translation_Font_Size?: string;
  Transliteration_Font_Size?: string;
  Show_Transliteration?: boolean;
  Ayah_Reference: Reference_Map;
  Kalimah_Spacing?: string;
  Hide_Ayaat?: boolean;
  Hide_Ayah_Markers?: boolean;
  Page_Footer?: React.ReactNode | ((Page_Number?: number) => React.ReactNode);
}

export interface Ayah_Card_Properties {
  Ayah: Assembled_Ayah;
  Kalimah?: any[];
  Translation?: string | null;
  Translations?: Array<{ id?: string; name?: string; Text: string; footnotes?: string[] }>;
  Transliteration?: string | null;
  Footnote?: string[];
  Surah?: Surah_Metadata;
  Show_Arabic_Text?: boolean;
  Show_Translation?: boolean;
  Translation_Font_Size?: string;
  Transliteration_Font_Size?: string;
  Show_Transliteration?: boolean;
  Hover_Translation?: string | boolean;
  Hover_Transliteration?: string | boolean;
  Inline_Translation?: string;
  Inline_Transliteration?: string;
  Is_Highlighted?: boolean;
  Ayah_Reference?: (element: HTMLDivElement | null) => void;
  On_Notes_Click?: () => void;
  On_Share_Click?: () => void;
  On_Tafsir_Click?: () => void;
  On_Embed_Click?: () => void;
  On_Render_Click?: () => void;
}

export interface Ayah_List_Properties {
  Surah?: Surah_Metadata;
  Ayah?: Assembled_Ayah[];
  Kalimah?: any[];
  Translation?: any;
  Transliteration?: any[];
  Footnote?: string[];
  KBK_Translation?: any[];
  KBK_Transliteration?: any[];
  Show_Arabic_Text?: boolean;
  Show_Translation?: boolean;
  Show_Transliteration?: boolean;
  Translation_Font_Size?: string;
  Transliteration_Font_Size?: string;
  Hover_Translation?: string | boolean;
  Hover_Transliteration?: string | boolean;
  Inline_Translation?: string;
  Inline_Transliteration?: string;
  Target_Ayah?: string;
  Ayah_Reference?: Reference_Map;
  On_Notes_Click?: (Ayah_ID: number, text?: string) => void;
  On_Share_Click?: (Ayah_ID: number, text?: string, Translation?: string) => void;
  On_Tafsir_Click?: (Ayah_ID: number) => void;
  On_Embed_Click?: (Ayah_ID: number) => void;
  On_Render_Click?: (Ayah_ID: number) => void;
  Flush_First_Item_Top?: boolean;
}