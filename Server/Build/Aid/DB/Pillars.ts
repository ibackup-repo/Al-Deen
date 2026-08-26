import * as File_System_Module from "fs";
import * as Path_Module from "path";
import Database from "better-sqlite3";
import {
  Aid_Pillars_Data_Directory_Path,
  Aid_Pillars_Output_Database_Path,
} from "../Config.js";
import { Should_Rebuild_Database } from "../Utility/Cache.js";
import {
  Read_JavaScript_Object_Notation_File,
  Clean_String_Content,
} from "../Utility/Parser.js";

// [Name, Subtitle, KeyHadith, [ [Heading, Content], ... ]]
type Detail_Tuple = [string, string];
type Raw_Pillar_Entry = [string, string, string, Detail_Tuple[]];

interface Pillar_Detail_Record {
  ID: number;
  Pillar_ID: number;
  Position_Index: number;
  Heading_Text: string;
  Content_Text: string;
}

interface Pillar_Record {
  ID: number;
  Pillar_Name: string;
  Subtitle_Text: string;
  Key_Hadith_Text: string;
  Details_Collection: Pillar_Detail_Record[];
}

export function Build_Pillars_Database(
  Should_Force_Execution: boolean = false
): void {
  if (!File_System_Module.existsSync(Aid_Pillars_Data_Directory_Path)) return;

  if (
    !Should_Rebuild_Database(
      Aid_Pillars_Output_Database_Path,
      Aid_Pillars_Data_Directory_Path,
      Should_Force_Execution
    )
  ) {
    console.log("[Skipped] Aid/Pillars.db is up to date.");
    return;
  }

  const Output_Directory_Path: string = Path_Module.dirname(
    Aid_Pillars_Output_Database_Path
  );
  if (!File_System_Module.existsSync(Output_Directory_Path)) {
    File_System_Module.mkdirSync(Output_Directory_Path, { recursive: true });
  }

  if (File_System_Module.existsSync(Aid_Pillars_Output_Database_Path)) {
    File_System_Module.unlinkSync(Aid_Pillars_Output_Database_Path);
  }

  console.log("Compiling Aid Database: Pillars.db");
  const Database_Instance = new Database(Aid_Pillars_Output_Database_Path);
  Database_Instance.pragma("journal_mode = WAL");
  Database_Instance.pragma("synchronous = NORMAL");

  // Schema without AUTOINCREMENT
  Database_Instance.exec(`
    CREATE TABLE IF NOT EXISTS Pillar (
      ID INTEGER PRIMARY KEY,
      Name TEXT NOT NULL,
      Subtitle TEXT NOT NULL,
      Key_Hadith TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Pillar_Detail (
      ID INTEGER PRIMARY KEY,
      Pillar_ID INTEGER NOT NULL,
      Position INTEGER NOT NULL,
      Heading TEXT NOT NULL,
      Content TEXT NOT NULL,
      FOREIGN KEY (Pillar_ID) REFERENCES Pillar(ID)
    );
  `);

  const Insert_Pillar_Statement = Database_Instance.prepare(`
    INSERT INTO Pillar (
      ID,
      Name,
      Subtitle,
      Key_Hadith
    ) VALUES (?, ?, ?, ?)
  `);

  const Insert_Detail_Statement = Database_Instance.prepare(`
    INSERT INTO Pillar_Detail (
      ID,
      Pillar_ID,
      Position,
      Heading,
      Content
    ) VALUES (?, ?, ?, ?, ?)
  `);

  const Directory_Entries_List: string[] = File_System_Module.readdirSync(
    Aid_Pillars_Data_Directory_Path
  ).filter((File_Name_Item: string) => File_Name_Item.endsWith(".json"));

  Directory_Entries_List.sort(
    (First_File_Name: string, Second_File_Name: string) =>
      First_File_Name.localeCompare(Second_File_Name, undefined, {
        numeric: true,
        sensitivity: "base",
      })
  );

  const Pillars_Collection: Pillar_Record[] = [];
  let Global_Pillar_Counter_Number: number = 1;
  let Global_Detail_Counter_Number: number = 1;

  for (const File_Name_Item of Directory_Entries_List) {
    const File_Path_String: string = Path_Module.join(
      Aid_Pillars_Data_Directory_Path,
      File_Name_Item
    );
    const Raw_Data_Content: unknown = Read_JavaScript_Object_Notation_File(
      File_Path_String
    ) as Raw_Pillar_Entry;

    if (!Array.isArray(Raw_Data_Content) || Raw_Data_Content.length < 4) {
      continue;
    }

    const [
      Pillar_Name_String,
      Subtitle_Text_String,
      Key_Hadith_Text_String,
      Raw_Details_Collection,
    ] = Raw_Data_Content as Raw_Pillar_Entry;

    const Current_Pillar_ID_Number: number = Global_Pillar_Counter_Number++;
    const Compiled_Details_Collection: Pillar_Detail_Record[] = [];

    if (Array.isArray(Raw_Details_Collection)) {
      Raw_Details_Collection.forEach(
        (Detail_Item: Detail_Tuple, Index_Identifier: number) => {
          if (Array.isArray(Detail_Item) && Detail_Item.length >= 2) {
            const [Heading_Text_String, Content_Text_String] = Detail_Item;
            Compiled_Details_Collection.push({
              ID: Global_Detail_Counter_Number++,
              Pillar_ID: Current_Pillar_ID_Number,
              Position_Index: Index_Identifier + 1,
              Heading_Text: Clean_String_Content(Heading_Text_String),
              Content_Text: Clean_String_Content(Content_Text_String),
            });
          }
        }
      );
    }

    Pillars_Collection.push({
      ID: Current_Pillar_ID_Number,
      Pillar_Name: Clean_String_Content(Pillar_Name_String),
      Subtitle_Text: Clean_String_Content(Subtitle_Text_String),
      Key_Hadith_Text: Clean_String_Content(Key_Hadith_Text_String),
      Details_Collection: Compiled_Details_Collection,
    });
  }

  // Execute Batch Transaction
  const Database_Transaction = Database_Instance.transaction(() => {
    for (const Pillar_Record_Item of Pillars_Collection) {
      Insert_Pillar_Statement.run(
        Pillar_Record_Item.ID,
        Pillar_Record_Item.Pillar_Name,
        Pillar_Record_Item.Subtitle_Text,
        Pillar_Record_Item.Key_Hadith_Text
      );
      for (const Detail_Record_Item of Pillar_Record_Item.Details_Collection) {
        Insert_Detail_Statement.run(
          Detail_Record_Item.ID,
          Detail_Record_Item.Pillar_ID,
          Detail_Record_Item.Position_Index,
          Detail_Record_Item.Heading_Text,
          Detail_Record_Item.Content_Text
        );
      }
    }
  });

  Database_Transaction();
  Database_Instance.close();
  console.log(
    ` -> Compiled Asset/Corpus/Aid/Pillars.db (${Pillars_Collection.length} pillars)`
  );
}