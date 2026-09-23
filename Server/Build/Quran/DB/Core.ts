import * as File_System from "fs";
import * as Path_Module from "path";
import Database from "better-sqlite3";
import {
  Corpus_Quran_Output_Directory,
  Quran_Directory,
  Metadata_Directory,
  Surah_Directory,
  Presentation_Version_One_Directory,
  Presentation_Version_Two_Directory,
} from "../Config.js";
import { Should_Rebuild_Database } from "../Utility/Cache.js";
import {
  Read_JavaScript_Object_Notation_File,
  Parse_Page_Range,
  Extract_Ayaat_Array,
  Extract_Ayah_String,
  Split_Into_Kalimaat,
  Page_Range,
} from "../Utility/Parser.js";

interface Endpoint {
  Surah: number;
  Ayah: number;
  Kalimah: number;
}

interface Full_Range_Result {
  Start_Surah: number;
  Start_Ayah: number;
  Start_Kalimah: number;
  End_Surah: number;
  End_Ayah: number;
  End_Kalimah: number;
}

interface Basic_Range_Result {
  Start_Surah: number;
  Start_Ayah: number;
  End_Surah: number;
  End_Ayah: number;
}

interface Parsed_Page extends Page_Range {
  Page: number;
}

function Parse_Range_String(Range_String: unknown): Full_Range_Result | null {
  if (typeof Range_String !== "string") return null;

  const Parts_Array = Range_String.trim().split("-");
  if (Parts_Array.length !== 2) return null;

  const Parse_Endpoint = (Endpoint_String: string): Endpoint | null => {
    const [Surah_String, Ayah_Kalimah_String] = Endpoint_String.split(":");
    if (!Surah_String || !Ayah_Kalimah_String) return null;

    const [Ayah_String, Kalimah_String] = Ayah_Kalimah_String.split(".");
    if (!Ayah_String) return null;

    return {
      Surah: parseInt(Surah_String, 10),
      Ayah: parseInt(Ayah_String, 10),
      Kalimah: Kalimah_String ? parseInt(Kalimah_String, 10) : 1,
    };
  };

  const Start_Endpoint = Parse_Endpoint(Parts_Array[0]);
  const End_Endpoint = Parse_Endpoint(Parts_Array[1]);

  if (!Start_Endpoint || !End_Endpoint) return null;

  return {
    Start_Surah: Start_Endpoint.Surah,
    Start_Ayah: Start_Endpoint.Ayah,
    Start_Kalimah: Start_Endpoint.Kalimah,
    End_Surah: End_Endpoint.Surah,
    End_Ayah: End_Endpoint.Ayah,
    End_Kalimah: End_Endpoint.Kalimah,
  };
}

export function Build_Core_Database(): void {
  if (!File_System.existsSync(Corpus_Quran_Output_Directory)) {
    File_System.mkdirSync(Corpus_Quran_Output_Directory, { recursive: true });
  }

  const Core_Database_File: string = Path_Module.join(Corpus_Quran_Output_Directory, "Core.db");

  if (!Should_Rebuild_Database(Core_Database_File, Quran_Directory)) {
    console.log(`[Skipped] Core.db is up to date.`);
    return;
  }

  if (File_System.existsSync(Core_Database_File)) File_System.unlinkSync(Core_Database_File);

  console.log(`Building Core Database at: ${Core_Database_File}`);
  const Database_Instance: Database.Database = new Database(Core_Database_File);
  Database_Instance.pragma("journal_mode = WAL");
  Database_Instance.pragma("synchronous = NORMAL");

  Database_Instance.exec(`
    CREATE TABLE IF NOT EXISTS Page (
      Page INTEGER PRIMARY KEY,
      Start_Surah INTEGER NOT NULL,
      Start_Ayah INTEGER NOT NULL,
      Start_Kalimah INTEGER NOT NULL,
      End_Surah INTEGER NOT NULL,
      End_Ayah INTEGER NOT NULL,
      End_Kalimah INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Juz (
      Juz INTEGER PRIMARY KEY,
      Start_Surah INTEGER NOT NULL,
      Start_Ayah INTEGER NOT NULL,
      End_Surah INTEGER NOT NULL,
      End_Ayah INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Hizb (
      Hizb INTEGER PRIMARY KEY,
      Start_Surah INTEGER NOT NULL,
      Start_Ayah INTEGER NOT NULL,
      End_Surah INTEGER NOT NULL,
      End_Ayah INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Surah (
      Surah INTEGER PRIMARY KEY,
      Arabic TEXT NOT NULL,
      Translation TEXT NOT NULL,
      Transliteration TEXT NOT NULL,
      Revelation_Place TEXT,
      Revelation_Order INTEGER,
      Ayah_Count INTEGER,
      Start_Page INTEGER,
      End_Page INTEGER,
      Indo_Pak_Ayah_Ending TEXT,
      Layout TEXT
    );

    CREATE TABLE IF NOT EXISTS Ayah (
      Surah INTEGER NOT NULL,
      Ayah INTEGER NOT NULL,
      Arabic TEXT NOT NULL,
      Presentation_Form_A_Ligature_Based TEXT,
      Presentation_Form_A_Glyph_Based TEXT,
      PRIMARY KEY (Surah, Ayah),
      FOREIGN KEY (Surah) REFERENCES Surah(Surah)
    );

    CREATE TABLE IF NOT EXISTS Kalimah (
      Surah INTEGER NOT NULL,
      Ayah INTEGER NOT NULL,
      Kalimah INTEGER NOT NULL,
      Arabic TEXT NOT NULL,
      Presentation_Form_A_Ligature_Based TEXT,
      Presentation_Form_A_Glyph_Based TEXT,
      PRIMARY KEY (Surah, Ayah, Kalimah),
      FOREIGN KEY (Surah, Ayah) REFERENCES Ayah(Surah, Ayah)
    );
  `);

  const Page_Ranges_Array: string[] = Read_JavaScript_Object_Notation_File<string[]>(Path_Module.join(Metadata_Directory, "Page.json")) || [];
  const Parsed_Pages_Array: Parsed_Page[] = Page_Ranges_Array.map((Range_Item, Index) => ({ Page: Index + 1, ...Parse_Page_Range(Range_Item) }));

  const Hizb_Data_Array: unknown[] = Read_JavaScript_Object_Notation_File<unknown[]>(Path_Module.join(Metadata_Directory, "Hizb.json")) || [];
  const Juz_Data_Array: unknown[] = Read_JavaScript_Object_Notation_File<unknown[]>(Path_Module.join(Metadata_Directory, "Juz.json")) || [];

  const Insert_Page_Statement: Database.Statement = Database_Instance.prepare(`
    INSERT INTO Page (Page, Start_Surah, Start_Ayah, Start_Kalimah, End_Surah, End_Ayah, End_Kalimah)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const Insert_Juz_Statement: Database.Statement = Database_Instance.prepare(`
    INSERT INTO Juz (Juz, Start_Surah, Start_Ayah, End_Surah, End_Ayah)
    VALUES (?, ?, ?, ?, ?)
  `);

  const Insert_Hizb_Statement: Database.Statement = Database_Instance.prepare(`
    INSERT INTO Hizb (Hizb, Start_Surah, Start_Ayah, End_Surah, End_Ayah)
    VALUES (?, ?, ?, ?, ?)
  `);

  function Page_Range_For_Surah(Surah_ID: number): [number | null, number | null] {
    let First_Page: number | null = null;
    let Last_Page: number | null = null;
    for (const Parsed_Page_Item of Parsed_Pages_Array) {
      const Start_Surah_Identifier = Parsed_Page_Item.Start?.Surah;
      const End_Surah_Identifier = Parsed_Page_Item.End?.Surah;
      if (Start_Surah_Identifier !== undefined && End_Surah_Identifier !== undefined && Start_Surah_Identifier <= Surah_ID && Surah_ID <= End_Surah_Identifier) {
        if (First_Page === null) First_Page = Parsed_Page_Item.Page;
        Last_Page = Parsed_Page_Item.Page;
      }
    }
    return [First_Page, Last_Page];
  }

  const Ayah_Counts_Array: number[] = Read_JavaScript_Object_Notation_File<number[]>(Path_Module.join(Metadata_Directory, "Surah", "Ayah.json")) || 
                                     Read_JavaScript_Object_Notation_File<number[]>(Path_Module.join(Metadata_Directory, "Surah", "Ayahs.json")) || [];
  const Translations_Array: string[] = Read_JavaScript_Object_Notation_File<string[]>(Path_Module.join(Metadata_Directory, "Surah", "Translation.json")) || [];
  const Transliterations_Array: string[] = Read_JavaScript_Object_Notation_File<string[]>(Path_Module.join(Metadata_Directory, "Surah", "Transliteration.json")) || [];
  const Arabic_Names_Array: string[] = Read_JavaScript_Object_Notation_File<string[]>(Path_Module.join(Metadata_Directory, "Surah", "Arabic.json")) || [];
  
  const Places_Array: string[] = Read_JavaScript_Object_Notation_File<string[]>(Path_Module.join(Metadata_Directory, "Surah", "Place.json")) || 
                                 Read_JavaScript_Object_Notation_File<string[]>(Path_Module.join(Metadata_Directory, "Surah", "Revelation", "Place.json")) || [];
                 
  const Orders_Array: (number | null)[] = Read_JavaScript_Object_Notation_File<(number | null)[]>(Path_Module.join(Metadata_Directory, "Surah", "Order.json")) || 
                                          Read_JavaScript_Object_Notation_File<(number | null)[]>(Path_Module.join(Metadata_Directory, "Surah", "Revelation", "Order.json")) || [];
                 
  const Indo_Page_Ayah_Endings_Array: unknown[] = Read_JavaScript_Object_Notation_File<unknown[]>(Path_Module.join(Metadata_Directory, "Indo_Pak_Ayah_Ending.json")) || 
                                                Read_JavaScript_Object_Notation_File<unknown[]>(Path_Module.join(Metadata_Directory, "Indo-Page-Ayah-Ending.json")) || 
                                                Read_JavaScript_Object_Notation_File<unknown[]>(Path_Module.join(Metadata_Directory, "Indo-Pak-Ayah-Markers.json")) || [];

  const Insert_Surah_Statement: Database.Statement = Database_Instance.prepare(`
    INSERT INTO Surah (
      Surah, Arabic, Translation, Transliteration, Revelation_Place, Revelation_Order,
      Ayah_Count, Start_Page, End_Page, Indo_Pak_Ayah_Ending, Layout
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const Insert_Ayah_Statement: Database.Statement = Database_Instance.prepare(`
    INSERT INTO Ayah (Surah, Ayah, Arabic, Presentation_Form_A_Ligature_Based, Presentation_Form_A_Glyph_Based)
    VALUES (?, ?, ?, ?, ?)
  `);

  const Insert_Kalimah_Statement: Database.Statement = Database_Instance.prepare(`
    INSERT INTO Kalimah (Surah, Ayah, Kalimah, Arabic, Presentation_Form_A_Ligature_Based, Presentation_Form_A_Glyph_Based)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  let Total_Ayah_Count = 0;
  let Total_Kalimah_Count = 0;

  const Transaction_Execution = Database_Instance.transaction(() => {
    Parsed_Pages_Array.forEach((Parsed_Page_Item) => {
      const Start_Surah = Parsed_Page_Item.Start?.Surah ?? 0;
      const Start_Ayah = Parsed_Page_Item.Start?.Ayah ?? 0;
      const Start_Kalimah = Parsed_Page_Item.Start?.Kalimah ?? 1;
      const End_Surah = Parsed_Page_Item.End?.Surah ?? 0;
      const End_Ayah = Parsed_Page_Item.End?.Ayah ?? 0;
      const End_Kalimah = Parsed_Page_Item.End?.Kalimah ?? 1;

      Insert_Page_Statement.run(Parsed_Page_Item.Page, Start_Surah, Start_Ayah, Start_Kalimah, End_Surah, End_Ayah, End_Kalimah);
    });

    const Extract_Range = (Item_Value: unknown): Basic_Range_Result | null => {
      if (typeof Item_Value === "string") {
        return Parse_Range_String(Item_Value);
      }
      if (!Item_Value || typeof Item_Value !== "object") return null;

      const Object_Instance = Item_Value as Record<string, any>;
      const Start_Surah = Object_Instance.Start_Surah ?? Object_Instance.start_surah ?? Object_Instance.Start_Surah ?? Object_Instance.Start?.Surah ?? Object_Instance.start?.Surah;
      const Start_Ayah = Object_Instance.Start_Ayah ?? Object_Instance.start_ayah ?? Object_Instance.Start_Ayah ?? Object_Instance.Start?.Ayah ?? Object_Instance.start?.Ayah;
      const End_Surah = Object_Instance.End_Surah ?? Object_Instance.end_surah ?? Object_Instance.End_Surah ?? Object_Instance.End?.Surah ?? Object_Instance.end?.Surah;
      const End_Ayah = Object_Instance.End_Ayah ?? Object_Instance.end_ayah ?? Object_Instance.End_Ayah ?? Object_Instance.End?.Ayah ?? Object_Instance.end?.Ayah;

      if (Start_Surah != null && Start_Ayah != null && End_Surah != null && End_Ayah != null) {
        return { Start_Surah, Start_Ayah, End_Surah, End_Ayah };
      }
      return null;
    };

    if (Array.isArray(Juz_Data_Array)) {
      let Juz_Index = 1;
      Juz_Data_Array.forEach((Juz_Item) => {
        const Parsed_Range = Extract_Range(Juz_Item);
        if (Parsed_Range) {
          Insert_Juz_Statement.run(Juz_Index++, Parsed_Range.Start_Surah, Parsed_Range.Start_Ayah, Parsed_Range.End_Surah, Parsed_Range.End_Ayah);
        }
      });
    }

    if (Array.isArray(Hizb_Data_Array)) {
      let Hizb_Index = 1;
      Hizb_Data_Array.forEach((Hizb_Item) => {
        const Parsed_Range = Extract_Range(Hizb_Item);
        if (Parsed_Range) {
          Insert_Hizb_Statement.run(Hizb_Index++, Parsed_Range.Start_Surah, Parsed_Range.Start_Ayah, Parsed_Range.End_Surah, Parsed_Range.End_Ayah);
        }
      });
    }

    for (let Index = 0; Index < 114; Index++) {
      const Surah_ID = Index + 1;

      let Surah_File_Path = Path_Module.join(Surah_Directory, `${Surah_ID}.json`);
      let Raw_Surah_Text = Read_JavaScript_Object_Notation_File(Surah_File_Path);

      if (!Raw_Surah_Text) {
        Surah_File_Path = Path_Module.join(Presentation_Version_Two_Directory, `${Surah_ID}.json`);
        Raw_Surah_Text = Read_JavaScript_Object_Notation_File(Surah_File_Path);
      }

      const Ayaat_Text_Array = Extract_Ayaat_Array(Raw_Surah_Text);

      const Raw_Surah_Text_Version_Two = Read_JavaScript_Object_Notation_File(Path_Module.join(Presentation_Version_Two_Directory, `${Surah_ID}.json`));
      const Ayaat_Text_Version_Two_Array = Extract_Ayaat_Array(Raw_Surah_Text_Version_Two);

      const Raw_Surah_Text_Version_One = Read_JavaScript_Object_Notation_File(Path_Module.join(Presentation_Version_One_Directory, `${Surah_ID}.json`));
      const Ayaat_Text_Version_One_Array = Extract_Ayaat_Array(Raw_Surah_Text_Version_One);

      const Layout_Data = Read_JavaScript_Object_Notation_File(Path_Module.join(Surah_Directory, "Layout", `${Surah_ID}.json`));
      const [Start_Page_Number, End_Page_Number] = Page_Range_For_Surah(Surah_ID);

      Insert_Surah_Statement.run(
        Surah_ID,
        Arabic_Names_Array[Index] ?? "",
        Translations_Array[Index] ?? "",
        Transliterations_Array[Index] ?? "",
        Places_Array[Index] ?? "",
        Orders_Array[Index] ?? null,
        Ayah_Counts_Array[Index] ?? Ayaat_Text_Array.length,
        Start_Page_Number,
        End_Page_Number,
        JSON.stringify(Indo_Page_Ayah_Endings_Array[Index] || []),
        Layout_Data ? JSON.stringify(Layout_Data) : null
      );

      Ayaat_Text_Array.forEach((Raw_Ayah_Item, Ayah_Index) => {
        const Ayah_ID = Ayah_Index + 1;
        const Arabic_Text = Extract_Ayah_String(Raw_Ayah_Item);
        const Presentation_Form_A_Text = Extract_Ayah_String(Ayaat_Text_Version_One_Array[Ayah_Index]);
        const Presentation_Form_B_Text = Extract_Ayah_String(Ayaat_Text_Version_Two_Array[Ayah_Index]);

        Insert_Ayah_Statement.run(
          Surah_ID,
          Ayah_ID,
          Arabic_Text,
          Presentation_Form_A_Text || null,
          Presentation_Form_B_Text || null
        );
        Total_Ayah_Count++;

        const Kalimah_Arabic_Array = Split_Into_Kalimaat(Arabic_Text);

        const Parse_Glyphs = (Raw_Ayah_Entry: unknown, Text_String: string, Target_Length: number): string[] => {
          if (Array.isArray(Raw_Ayah_Entry) && Raw_Ayah_Entry.length === Target_Length) {
            return Raw_Ayah_Entry.map(String);
          }
          const Kalimaat_Array = Split_Into_Kalimaat(Text_String);
          if (Kalimaat_Array.length === Target_Length) return Kalimaat_Array;

          const Characters_Array = Array.from(Text_String || "");
          if (Characters_Array.length === Target_Length) return Characters_Array;

          return Kalimaat_Array;
        };

        const Kalimah_Version_One_Array = Parse_Glyphs(Ayaat_Text_Version_One_Array[Ayah_Index], Presentation_Form_A_Text, Kalimah_Arabic_Array.length);
        const Kalimah_Version_Two_Array = Parse_Glyphs(Ayaat_Text_Version_Two_Array[Ayah_Index], Presentation_Form_B_Text, Kalimah_Arabic_Array.length);

        const Maximum_Kalimah_Count = Kalimah_Arabic_Array.length;

        for (let Kalimah_Index = 0; Kalimah_Index < Maximum_Kalimah_Count; Kalimah_Index++) {
          const Kalimah_Position = Kalimah_Index + 1;
          const Kalimah_Arabic_Item = Kalimah_Arabic_Array[Kalimah_Index] || "";
          const Kalimah_Presentation_Form_A_Item = Kalimah_Version_One_Array[Kalimah_Index] !== undefined ? String(Kalimah_Version_One_Array[Kalimah_Index]) : null;
          const Kalimah_Presentation_Form_B_Item = Kalimah_Version_Two_Array[Kalimah_Index] !== undefined ? String(Kalimah_Version_Two_Array[Kalimah_Index]) : null;

          Insert_Kalimah_Statement.run(
            Surah_ID,
            Ayah_ID,
            Kalimah_Position,
            Kalimah_Arabic_Item,
            Kalimah_Presentation_Form_A_Item,
            Kalimah_Presentation_Form_B_Item
          );
          Total_Kalimah_Count++;
        }
      });
    }
  });

  Transaction_Execution();
  Database_Instance.close();
  console.log(`Core.db built successfully: ${Parsed_Pages_Array.length} Page, ${Total_Ayah_Count} Ayah entries, ${Total_Kalimah_Count} Kalimah entries.`);
}