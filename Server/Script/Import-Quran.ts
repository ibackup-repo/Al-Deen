#!/usr/bin/env node

import * as File_System_Promises from "node:fs/promises";
import * as Path_Module from "node:path";

interface Collection_Configuration {
  Directory_Name: string;
  Prefix_Name: string;
  Series_Name: string;
}

interface Hadith_Item {
  hadithnumber: number;
  text?: string;
  reference?: {
    book?: number | string;
    [Key_Name: string]: any;
  };
}

interface Edition_Data {
  metadata: {
    sections?: Record<string, string>;
    [Key_Name: string]: any;
  };
  hadiths: Hadith_Item[];
}

const Collections: Collection_Configuration[] = [
  { Directory_Name: "Muslim", Prefix_Name: "muslim", Series_Name: "Sahih" },
  { Directory_Name: "Abu-Dawud", Prefix_Name: "abudawud", Series_Name: "Sunan" },
  { Directory_Name: "at-Tirmidhi", Prefix_Name: "tirmidhi", Series_Name: "Jami" },
  { Directory_Name: "an-Nasai", Prefix_Name: "nasai", Series_Name: "Sunan" },
  { Directory_Name: "Ibn-Majah", Prefix_Name: "ibnmajah", Series_Name: "Sunan" },
  { Directory_Name: "Muwatta-Malik", Prefix_Name: "malik", Series_Name: "Muwatta" },
  { Directory_Name: "Al-Nawawi", Prefix_Name: "nawawi", Series_Name: "Arbain" },
  { Directory_Name: "Hadith-Qudsi", Prefix_Name: "qudsi", Series_Name: "Qudsi" },
  { Directory_Name: "Mishkat-al-Masabih", Prefix_Name: "dehlawi", Series_Name: "Mishkat" }
];

const Languages: string[] = ["ar", "bn", "en", "fr", "id", "ru", "tr", "ur"];

const Language_Name_Map: Record<string, string> = {
  ar: "Arabic",
  bn: "Bengali",
  en: "English",
  fr: "French",
  id: "Indonesian",
  ru: "Russian",
  tr: "Turkish",
  ur: "Urdu"
};

const Base_Uniform_Resource_Locator: string = "https://cdn.jsdelivr.net/gh/fawazahmed0/Hadith-api@1/editions";
const Base_Root_Directory: string = Path_Module.resolve("Server/Data/Hadith");

const Generate_Slug = (Source_String: string): string =>
  Source_String.replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const Clean_Bengali_Text = (Source_Text: string): string =>
  Source_Text.replace(/^[\s\S]*?\]\s*/, "").trim();

const Clean_Russian_Text = (Source_Text: string): string =>
  Source_Text.replace(/\\n/g, " ")
    .replace(/—\s+/g, "")
    .replace(/\[\d+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const Clean_Turkish_Text = (Source_Text: string): string =>
  Source_Text.replace(/(Tekrar:|Diğer Tahric:)[\s\S]*$/, "").trim();

async function Fetch_JavaScript_Object_Notation(Request_Url: string): Promise<Edition_Data | null> {
  try {
    const Network_Response: Response = await fetch(Request_Url);
    if (!Network_Response.ok) return null;
    return (await Network_Response.json()) as Edition_Data;
  } catch {
    return null;
  }
}

async function Write_Data_File(
  Category_Name: string,
  Sub_Folder_Name: string,
  Series_Name: string,
  Book_Directory_Name: string,
  Chapter_Slug_Name: string,
  Hadith_Number: number,
  File_Data_Content: string
): Promise<void> {
  const Target_Folder_Path: string = Path_Module.join(
    Base_Root_Directory,
    Category_Name,
    Sub_Folder_Name,
    Series_Name,
    Book_Directory_Name,
    Chapter_Slug_Name
  );
  await File_System_Promises.mkdir(Target_Folder_Path, { recursive: true });
  await File_System_Promises.writeFile(
    Path_Module.join(Target_Folder_Path, `${Hadith_Number}.json`),
    JSON.stringify(File_Data_Content, null, 2),
    "utf8"
  );
}

async function Process_Book(Book_Configuration: Collection_Configuration): Promise<void> {
  const Network_Responses: (Edition_Data | null)[] = await Promise.all(
    Languages.map((Language_Code) =>
      Fetch_JavaScript_Object_Notation(
        `${Base_Uniform_Resource_Locator}/${
          Language_Code === "ar" ? "ara" : Language_Code === "en" ? "eng" : Language_Code
        }-${Book_Configuration.Prefix_Name}.json`
      )
    )
  );

  const Data_Maps: Record<string, Map<number, Hadith_Item>> = {};
  let Base_Arabic_Edition: Edition_Data | null = null;
  let Base_English_Edition: Edition_Data | null = null;

  Languages.forEach((Language_Code, Index_Identifier) => {
    const Edition_Response: Edition_Data | null = Network_Responses[Index_Identifier];
    if (!Edition_Response) {
      Data_Maps[Language_Code] = new Map();
      return;
    }
    if (Language_Code === "ar") Base_Arabic_Edition = Edition_Response;
    if (Language_Code === "en") Base_English_Edition = Edition_Response;

    Data_Maps[Language_Code] = new Map(
      Edition_Response.hadiths.map((Hadith_Object) => [Hadith_Object.hadithnumber, Hadith_Object])
    );
  });

  if (!Base_Arabic_Edition || !Base_English_Edition) {
    return;
  }

  const Chapters_Map: Map<string, string> = new Map(
    (Base_English_Edition as Edition_Data).metadata.sections
      ? Object.entries((Base_English_Edition as Edition_Data).metadata.sections!)
      : []
  );

  const Total_Ahadith_To_Process: number = (Base_Arabic_Edition as Edition_Data).hadiths.length;
  let Written_Files_Count: number = 0;

  for (const Hadith_Object of (Base_Arabic_Edition as Edition_Data).hadiths) {
    const Hadith_Number: number = Hadith_Object.hadithnumber;
    const English_Hadith_Item: Hadith_Item | undefined = Data_Maps.en.get(Hadith_Number);
    const Chapter_ID: string = String(English_Hadith_Item?.reference?.book ?? "0");
    const Chapter_Slug_Name: string = Generate_Slug(
      Chapters_Map.get(Chapter_ID) || `Chapter-${Chapter_ID}`
    );

    await Write_Data_File(
      "Transliteration",
      "Arabic",
      Book_Configuration.Series_Name,
      Book_Configuration.Directory_Name,
      Chapter_Slug_Name,
      Hadith_Number,
      ""
    );

    for (const Language_Code of Languages) {
      let Hadith_Text_Content: string = (
        Data_Maps[Language_Code].get(Hadith_Number)?.text || ""
      ).trim();

      if (Language_Code === "bn") Hadith_Text_Content = Clean_Bengali_Text(Hadith_Text_Content);
      if (Language_Code === "ru") Hadith_Text_Content = Clean_Russian_Text(Hadith_Text_Content);
      if (Language_Code === "tr") Hadith_Text_Content = Clean_Turkish_Text(Hadith_Text_Content);

      const Folder_Name_Value: string = Language_Name_Map[Language_Code];

      await Write_Data_File(
        "Translation",
        Folder_Name_Value,
        Book_Configuration.Series_Name,
        Book_Configuration.Directory_Name,
        Chapter_Slug_Name,
        Hadith_Number,
        Hadith_Text_Content
      );
      await Write_Data_File(
        "KBK",
        Folder_Name_Value,
        Book_Configuration.Series_Name,
        Book_Configuration.Directory_Name,
        Chapter_Slug_Name,
        Hadith_Number,
        ""
      );
    }

    Written_Files_Count++;
    console.log(`${Written_Files_Count}/${Total_Ahadith_To_Process}`);
  }
}

async function Fetch_Ahadith(): Promise<void> {
  for (const Book_Configuration of Collections) {
    await Process_Book(Book_Configuration);
  }
}

Fetch_Ahadith().catch(() => {
  process.exit(1);
});