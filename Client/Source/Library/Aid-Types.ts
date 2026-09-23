export interface Adiyah_Category_Record {
  ID: number;
  Category_Name: string;
  Adiyah_Count_Number: number;
}

export interface Adiyah_Word_By_Word_Record {
  ID: number;
  Dua_ID: number;
  Word_Position_Index: number;
  Transliteration_Text: string;
  Translation_Text: string;
}

export interface Adiyah_Record {
  ID: number;
  Category_ID: number;
  In_Category_ID: number;
  Arabic_Content_Text: string;
  Translation_Content_Text: string;
  Reference_Content_Text: string;
  Word_By_Word_Collection?: Adiyah_Word_By_Word_Record[];
}

export interface Adiyah_Category_Output_Payload {
  Category_Information: Adiyah_Category_Record;
  Adiyah_Collection: Adiyah_Record[];
}

export interface Article_Topic_Record {
  ID: number;
  Topic_Name: string;
  Article_Count_Number: number;
}

export interface Article_Record {
  ID: number;
  Topic_ID: number;
  In_Topic_ID: number;
  Article_Title: string;
  Article_Content_Text: string;
}

export interface Article_Topic_Output_Payload {
  Topic_Information: Article_Topic_Record;
  Articles_Collection: Article_Record[];
}

export interface Asma_Ul_Husna_Record {
  ID: number;
  Arabic_Content_Text: string;
  Transliteration_Text: string;
  Translation_Text: string;
}

export interface Pillar_Detail_Record {
  ID: number;
  Pillar_ID: number;
  Position_Index: number;
  Heading_Text: string;
  Content_Text: string;
}

export interface Pillar_Record {
  ID: number;
  Pillar_Name: string;
  Subtitle_Text: string;
  Key_Hadith_Text: string;
  Details_Collection?: Pillar_Detail_Record[];
}

export interface Prophet_Section_Record {
  ID: number;
  Prophet_ID: number;
  Position_Index: number;
  Heading_Text: string;
  Content_Text: string;
}

export interface Prophet_Record {
  ID: number;
  Prophet_Name: string;
  Sections_Collection?: Prophet_Section_Record[];
}

export interface School_Record {
  ID: number;
  Branch_ID: number;
  Slug_Text: string;
  School_Name: string;
  Founder_Name: string;
  Regions_Text: string;
  Description_Text: string;
}

export interface Branch_Record {
  ID: number;
  Slug_Text: string;
  Branch_Name: string;
  Summary_Text: string;
  School_Count_Number: number;
  Schools_Collection?: School_Record[];
}

export interface Aid_Resource_Information_Payload {
  "Available-Resources": string[];
}