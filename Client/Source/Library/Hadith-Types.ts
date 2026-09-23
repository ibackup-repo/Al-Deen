// Source/Library/Hadith-Types.ts

export interface Collection_Info {
  ID: string;
  Name: string;
  Category: string;
}

export interface Chapter {
  ID: number;
  Hadith_Count: number;
  Name: string;
}

export interface Narration {
  Chapter_ID: number;
  ID: number;
  In_Chapter_ID: number;
  Text: string;
}

export interface Translation {
  ID: number;
  Text: string;
  Edition: string;
}

export interface KBK_Translation {
  ID: number;
  Token_Index: number;
  Text: string;
  Edition: string;
}

export interface Transliteration {
  ID: number;
  Text: string;
  Edition: string;
}

export interface KBK_Transliteration {
  ID: number;
  Token_Index: number;
  Text: string;
  Edition: string;
}

export interface Edition {
  ID: string;
  Name: string;
  Language: string;
}

export interface Chapter_Data {
  Chapter: Chapter;
  Narrations: Narration[];
}

export interface Translation_Data {
  Translations: Translation[];
  KBK_Translations?: KBK_Translation[];
}

export interface Transliteration_Data {
  Transliterations: Transliteration[];
  Word_By_Word_Transliterations?: KBK_Transliteration[];
}

export interface Hadith_Composite {
  Narration: Narration;
  Translation?: Translation[];
  KBK_Translation?: KBK_Translation[];
  Transliteration?: Transliteration[];
  KBK_Transliteration?: KBK_Transliteration[];
}