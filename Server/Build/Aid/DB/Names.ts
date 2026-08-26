import * as File_System_Module from "fs";
import * as Path_Module from "path";
import Database from "better-sqlite3";
import {
  Aid_Names_Data_Directory_Path,
  Aid_Names_Output_Database_Path,
} from "../Config.js";
import { Should_Rebuild_Database } from "../Utility/Cache.js";
import {
  Read_JavaScript_Object_Notation_File,
  Clean_String_Content,
} from "../Utility/Parser.js";

// [Arabic, Transliteration, Translation]
type Raw_Name_Entry = [string, string, string];

interface Name_Record {
  ID: number;
  Arabic_Text: string;
  Transliteration_Text: string;
  Translation_Text: string;
}

export function Build_Names_Database(
  Should_Force_Execution: boolean = false
): void {
  if (!File_System_Module.existsSync(Aid_Names_Data_Directory_Path)) return;

  if (
    !Should_Rebuild_Database(
      Aid_Names_Output_Database_Path,
      Aid_Names_Data_Directory_Path,
      Should_Force_Execution
    )
  ) {
    console.log("[Skipped] Aid/Names.db is up to date.");
    return;
  }

  const Output_Directory_Path: string = Path_Module.dirname(
    Aid_Names_Output_Database_Path
  );
  if (!File_System_Module.existsSync(Output_Directory_Path)) {
    File_System_Module.mkdirSync(Output_Directory_Path, { recursive: true });
  }

  if (File_System_Module.existsSync(Aid_Names_Output_Database_Path)) {
    File_System_Module.unlinkSync(Aid_Names_Output_Database_Path);
  }

  console.log("Compiling Aid Database: Names.db");
  const Database_Instance = new Database(Aid_Names_Output_Database_Path);
  Database_Instance.pragma("journal_mode = WAL");
  Database_Instance.pragma("synchronous = NORMAL");

  // Single flat schema without Category or sqlite_sequence
  Database_Instance.exec(`
    CREATE TABLE IF NOT EXISTS Name (
      ID INTEGER PRIMARY KEY,
      Arabic TEXT NOT NULL,
      Transliteration TEXT NOT NULL,
      Translation TEXT NOT NULL
    );
  `);

  const Insert_Name_Statement = Database_Instance.prepare(`
    INSERT INTO Name (
      ID,
      Arabic,
      Transliteration,
      Translation
    ) VALUES (?, ?, ?, ?)
  `);

  const Directory_Entries_List: string[] = File_System_Module.readdirSync(
    Aid_Names_Data_Directory_Path
  ).filter((File_Name_Item: string) => File_Name_Item.endsWith(".json"));

  Directory_Entries_List.sort(
    (First_File_Name: string, Second_File_Name: string) =>
      First_File_Name.localeCompare(Second_File_Name, undefined, {
        numeric: true,
        sensitivity: "base",
      })
  );

  const Names_Collection: Name_Record[] = [];
  let Global_Name_Counter_Number: number = 1;

  for (const File_Name_Item of Directory_Entries_List) {
    const File_Path_String: string = Path_Module.join(
      Aid_Names_Data_Directory_Path,
      File_Name_Item
    );
    const Raw_Data_Content: unknown = Read_JavaScript_Object_Notation_File(
      File_Path_String
    ) as Raw_Name_Entry[];

    if (!Array.isArray(Raw_Data_Content)) continue;

    (Raw_Data_Content as Raw_Name_Entry[]).forEach(
      (Name_Entry_Item: Raw_Name_Entry) => {
        if (
          Array.isArray(Name_Entry_Item) &&
          Name_Entry_Item.length >= 3
        ) {
          const [
            Arabic_Text_String,
            Transliteration_Text_String,
            Translation_Text_String,
          ] = Name_Entry_Item;

          Names_Collection.push({
            ID: Global_Name_Counter_Number++,
            Arabic_Text: Clean_String_Content(Arabic_Text_String),
            Transliteration_Text: Clean_String_Content(
              Transliteration_Text_String
            ),
            Translation_Text: Clean_String_Content(Translation_Text_String),
          });
        }
      }
    );
  }

  // Execute Batch Transaction
  const Database_Transaction = Database_Instance.transaction(() => {
    for (const Name_Record_Item of Names_Collection) {
      Insert_Name_Statement.run(
        Name_Record_Item.ID,
        Name_Record_Item.Arabic_Text,
        Name_Record_Item.Transliteration_Text,
        Name_Record_Item.Translation_Text
      );
    }
  });

  Database_Transaction();
  Database_Instance.close();
  console.log(
    ` -> Compiled Asset/Corpus/Aid/Names.db (${Names_Collection.length} names)`
  );
}