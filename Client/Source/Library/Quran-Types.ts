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
  Indo_Pak_Ayah_Ending?: string[];
  Layout?: any;
}

export interface Ayah {
  Surah: number;
  Ayah: number;
  Arabic: string;
  Presentation_Form_A_Ligature_Based?: string;
  Presentation_Form_A_Glyph_Based?: string;
}

export interface Kalimah {
  Surah: number;
  Ayah: number;
  Kalimah: number;
  Arabic: string;
  Presentation_Form_A_Ligature_Based?: string;
  Presentation_Form_A_Glyph_Based?: string;
}

export interface Translation {
  Surah: number;
  Ayah: number;
  Text: string;
  Edition: string;
}

export interface KBK_Translation {
  Surah: number;
  Ayah: number;
  Kalimah: number;
  Text: string;
  Edition: string;
}

export interface Transliteration {
  Surah: number;
  Ayah: number;
  Text: string;
  Edition: string;
}

export interface KBK_Transliteration {
  Surah: number;
  Ayah: number;
  Kalimah: number;
  Text: string;
  Edition: string;
}

export interface Footnote {
  Surah: number;
  Ayah: number;
  Footnote: number;
  Text: string;
}

export interface Page {
  Page: number;
  Start_Surah: number;
  Start_Ayah: number;
  End_Surah: number;
  End_Ayah: number;
}

export interface Page_Range {
  Start_Page: number;
  End_Page: number;
}

// Composite interface representing Raw_Storage_Data endpoint responses (API contract)
export interface Surah_Output {
  Surah: Surah_Metadata;
  Ayaat: Ayah[];
  Kalimaat: Kalimah[];
  Pages: Page[];
}

// Full domain model for client side
export interface Surah {
  Surah: Surah_Metadata;
  Ayah: Ayah[];
  Kalimah: Kalimah[];
  Translation: Translation[];
  KBK_Translation: KBK_Translation[];
  Transliteration: Transliteration[];
  KBK_Transliteration: KBK_Transliteration[];
  Footnote: Footnote[];
}

export interface Translation_Output {
  Translations: Translation[];
  KBK_Translations?: KBK_Translation[];
  Footnotes?: Footnote[];
}

export interface Transliteration_Output {
  Transliterations: Transliteration[];
  Word_By_Word_Transliterations?: KBK_Transliteration[];
}