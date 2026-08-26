import * as File_System_Module from "fs";
import * as Path_Module from "path";
import Database from "better-sqlite3";
import {
  Aid_Prophets_Data_Directory_Path,
  Aid_Prophets_Output_Database_Path,
} from "../Config.js";
import { Should_Rebuild_Database } from "../Utility/Cache.js";
import {
  Read_JavaScript_Object_Notation_File,
  Clean_String_Content,
} from "../Utility/Parser.js";

type Section_Tuple = [string, string];
type Raw_Prophet_Entry = [string, Section_Tuple[]];

interface Prophet_Section_Record {
  ID: number;
  Prophet_ID: number;
  Position_Index: number;
  Heading_Text: string;
  Content_Text: string;
}

interface Prophet_Record {
  ID: number;
  Prophet_Name: string;
  Sections_Collection: Prophet_Section_Record[];
}

export function Build_Prophets_Database(
  Should_Force_Execution: boolean = false
): void {
  if (!File_System_Module.existsSync(Aid_Prophets_Data_Directory_Path)) return;

  if (
    !Should_Rebuild_Database(
      Aid_Prophets_Output_Database_Path,
      Aid_Prophets_Data_Directory_Path,
      Should_Force_Execution
    )
  ) {
    console.log("[Skipped] Aid/Prophets.db is up to date.");
    return;
  }

  const Output_Directory_Path: string = Path_Module.dirname(
    Aid_Prophets_Output_Database_Path
  );
  if (!File_System_Module.existsSync(Output_Directory_Path)) {
    File_System_Module.mkdirSync(Output_Directory_Path, { recursive: true });
  }

  if (File_System_Module.existsSync(Aid_Prophets_Output_Database_Path)) {
    File_System_Module.unlinkSync(Aid_Prophets_Output_Database_Path);
  }

  console.log("Compiling Aid Database: Prophets.db");
  const Database_Instance = new Database(Aid_Prophets_Output_Database_Path);
  Database_Instance.pragma("journal_mode = WAL");
  Database_Instance.pragma("synchronous = NORMAL");

  Database_Instance.exec(`
    CREATE TABLE IF NOT EXISTS Prophet (
      ID INTEGER PRIMARY KEY,
      Name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Prophet_Section (
      ID INTEGER PRIMARY KEY,
      Prophet_ID INTEGER NOT NULL,
      Position INTEGER NOT NULL,
      Heading TEXT NOT NULL,
      Content TEXT NOT NULL,
      FOREIGN KEY (Prophet_ID) REFERENCES Prophet(ID)
    );
  `);

  const Insert_Prophet_Statement = Database_Instance.prepare(`
    INSERT INTO Prophet (
      ID,
      Name
    ) VALUES (?, ?)
  `);

  const Insert_Section_Statement = Database_Instance.prepare(`
    INSERT INTO Prophet_Section (
      ID,
      Prophet_ID,
      Position,
      Heading,
      Content
    ) VALUES (?, ?, ?, ?, ?)
  `);

  const Directory_Entries_List: string[] = File_System_Module.readdirSync(
    Aid_Prophets_Data_Directory_Path
  ).filter((File_Name_Item: string) => File_Name_Item.endsWith(".json"));

  Directory_Entries_List.sort(
    (First_File_Name: string, Second_File_Name: string) =>
      First_File_Name.localeCompare(Second_File_Name, undefined, {
        numeric: true,
        sensitivity: "base",
      })
  );

  const Prophets_Collection: Prophet_Record[] = [];
  let Global_Prophet_Counter_Number: number = 1;
  let Global_Section_Counter_Number: number = 1;

  for (const File_Name_Item of Directory_Entries_List) {
    const File_Path_String: string = Path_Module.join(
      Aid_Prophets_Data_Directory_Path,
      File_Name_Item
    );
    const Raw_Data_Content: unknown = Read_JavaScript_Object_Notation_File(
      File_Path_String
    ) as Raw_Prophet_Entry;

    if (!Array.isArray(Raw_Data_Content) || Raw_Data_Content.length < 2) {
      continue;
    }

    const [Prophet_Name_String, Raw_Sections_Collection] =
      Raw_Data_Content as Raw_Prophet_Entry;

    const Current_Prophet_ID_Number: number = Global_Prophet_Counter_Number++;
    const Compiled_Sections_Collection: Prophet_Section_Record[] = [];

    if (Array.isArray(Raw_Sections_Collection)) {
      Raw_Sections_Collection.forEach(
        (Section_Item: Section_Tuple, Index_Identifier: number) => {
          if (Array.isArray(Section_Item) && Section_Item.length >= 2) {
            const [Heading_Text_String, Content_Text_String] = Section_Item;
            Compiled_Sections_Collection.push({
              ID: Global_Section_Counter_Number++,
              Prophet_ID: Current_Prophet_ID_Number,
              Position_Index: Index_Identifier + 1,
              Heading_Text: Clean_String_Content(Heading_Text_String),
              Content_Text: Clean_String_Content(Content_Text_String),
            });
          }
        }
      );
    }

    Prophets_Collection.push({
      ID: Current_Prophet_ID_Number,
      Prophet_Name: Clean_String_Content(Prophet_Name_String),
      Sections_Collection: Compiled_Sections_Collection,
    });
  }

  const Database_Transaction = Database_Instance.transaction(() => {
    for (const Prophet_Record_Item of Prophets_Collection) {
      Insert_Prophet_Statement.run(
        Prophet_Record_Item.ID,
        Prophet_Record_Item.Prophet_Name
      );
      for (const Section_Record_Item of Prophet_Record_Item.Sections_Collection) {
        Insert_Section_Statement.run(
          Section_Record_Item.ID,
          Section_Record_Item.Prophet_ID,
          Section_Record_Item.Position_Index,
          Section_Record_Item.Heading_Text,
          Section_Record_Item.Content_Text
        );
      }
    }
  });

  Database_Transaction();
  Database_Instance.close();
  console.log(
    ` -> Compiled Asset/Corpus/Aid/Prophets.db (${Prophets_Collection.length} prophets)`
  );
}