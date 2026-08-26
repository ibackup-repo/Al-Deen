import * as File_System_Module from "fs";
import * as Path_Module from "path";
import Database from "better-sqlite3";
import {
  Aid_Adiyah_Data_Directory_Path,
  Aid_Adiyah_Output_Database_Path,
} from "../Config.js";
import { Should_Rebuild_Database } from "../Utility/Cache.js";
import {
  Read_JavaScript_Object_Notation_File,
  Clean_String_Content,
} from "../Utility/Parser.js";

type Raw_Dua_Entry = [string, string[], string, string[], string];

interface Word_By_Word_Record {
  ID: number;
  Dua_ID: number;
  Word_Position_Index: number;
  Transliteration_Text: string;
  Translation_Text: string;
}

interface Dua_Record {
  ID: number;
  In_Category_ID: number;
  Arabic_Text: string;
  Translation_Text: string;
  Reference_Text: string;
  Words_Collection: Word_By_Word_Record[];
}

interface Category_Record {
  ID: number;
  Category_Name: string;
  Adiyah_Collection: Dua_Record[];
}

export function Build_Adiyah_Database(
  Should_Force_Execution: boolean = false
): void {
  if (!File_System_Module.existsSync(Aid_Adiyah_Data_Directory_Path)) return;

  if (
    !Should_Rebuild_Database(
      Aid_Adiyah_Output_Database_Path,
      Aid_Adiyah_Data_Directory_Path,
      Should_Force_Execution
    )
  ) {
    console.log("[Skipped] Aid/Dua.db is up to date.");
    return;
  }

  const Output_Directory_Path: string = Path_Module.dirname(
    Aid_Adiyah_Output_Database_Path
  );
  if (!File_System_Module.existsSync(Output_Directory_Path)) {
    File_System_Module.mkdirSync(Output_Directory_Path, { recursive: true });
  }

  if (File_System_Module.existsSync(Aid_Adiyah_Output_Database_Path)) {
    File_System_Module.unlinkSync(Aid_Adiyah_Output_Database_Path);
  }

  console.log("Compiling Aid Database: Dua.db");
  const Database_Instance = new Database(Aid_Adiyah_Output_Database_Path);
  Database_Instance.pragma("journal_mode = WAL");
  Database_Instance.pragma("synchronous = NORMAL");

  // Schema without AUTOINCREMENT (prevents sqlite_sequence creation)
  Database_Instance.exec(`
    CREATE TABLE IF NOT EXISTS Category (
      ID INTEGER PRIMARY KEY,
      Name TEXT NOT NULL,
      Dua_Count INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Dua (
      ID INTEGER PRIMARY KEY,
      Category_ID INTEGER NOT NULL,
      In_Category_ID INTEGER NOT NULL,
      Arabic TEXT NOT NULL,
      Translation TEXT NOT NULL,
      Reference TEXT,
      FOREIGN KEY (Category_ID) REFERENCES Category(ID)
    );

    CREATE TABLE IF NOT EXISTS WBW (
      ID INTEGER PRIMARY KEY,
      Dua_ID INTEGER NOT NULL,
      Word_Position INTEGER NOT NULL,
      Transliteration TEXT,
      Translation TEXT,
      FOREIGN KEY (Dua_ID) REFERENCES Dua(ID)
    );
  `);

  const Insert_Category_Statement = Database_Instance.prepare(
    `INSERT INTO Category (ID, Name, Dua_Count) VALUES (?, ?, ?)`
  );

  const Insert_Dua_Statement = Database_Instance.prepare(`
    INSERT INTO Dua (
      ID,
      Category_ID, 
      In_Category_ID, 
      Arabic, 
      Translation, 
      Reference
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  const Insert_Word_By_Word_Statement = Database_Instance.prepare(`
    INSERT INTO WBW (
      ID,
      Dua_ID,
      Word_Position,
      Transliteration,
      Translation
    ) VALUES (?, ?, ?, ?, ?)
  `);

  const Directory_Entries_List: string[] = File_System_Module.readdirSync(
    Aid_Adiyah_Data_Directory_Path
  ).filter((File_Name_Item: string) => File_Name_Item.endsWith(".json"));

  Directory_Entries_List.sort(
    (First_File_Name: string, Second_File_Name: string) =>
      First_File_Name.localeCompare(Second_File_Name, undefined, {
        numeric: true,
        sensitivity: "base",
      })
  );

  const Categories_Collection: Category_Record[] = [];
  let Category_ID_Counter_Number: number = 1;
  let Global_Dua_Counter_Number: number = 1;
  let Global_Word_By_Word_Counter_Number: number = 1;

  for (const File_Name_Item of Directory_Entries_List) {
    const File_Path_String: string = Path_Module.join(
      Aid_Adiyah_Data_Directory_Path,
      File_Name_Item
    );
    const Raw_Data_Content: unknown = Read_JavaScript_Object_Notation_File(
      File_Path_String
    ) as Raw_Dua_Entry[];

    if (!Array.isArray(Raw_Data_Content)) continue;

    const Category_Name_String: string = Path_Module.basename(
      File_Name_Item,
      ".json"
    ).replace(/-/g, " ");
    const Category_Adiyah_Collection: Dua_Record[] = [];

    (Raw_Data_Content as Raw_Dua_Entry[]).forEach(
      (Dua_Entry_Item: Raw_Dua_Entry, Index_Identifier: number) => {
        if (
          Array.isArray(Dua_Entry_Item) &&
          Dua_Entry_Item.length >= 5
        ) {
          const [
            Arabic_Text_String,
            Transliteration_Word_By_Word_List,
            Translation_Text_String,
            Translation_Word_By_Word_List,
            Reference_Text_String,
          ] = Dua_Entry_Item;

          const Current_Dua_ID_Number: number = Global_Dua_Counter_Number++;
          const Words_Collection: Word_By_Word_Record[] = [];

          const Maximum_Word_Length_Number: number = Math.max(
            Array.isArray(Transliteration_Word_By_Word_List)
              ? Transliteration_Word_By_Word_List.length
              : 0,
            Array.isArray(Translation_Word_By_Word_List)
              ? Translation_Word_By_Word_List.length
              : 0
          );

          for (
            let Word_Index_Identifier = 0;
            Word_Index_Identifier < Maximum_Word_Length_Number;
            Word_Index_Identifier++
          ) {
            Words_Collection.push({
              ID: Global_Word_By_Word_Counter_Number++,
              Dua_ID: Current_Dua_ID_Number,
              Word_Position_Index: Word_Index_Identifier + 1,
              Transliteration_Text: Clean_String_Content(
                Transliteration_Word_By_Word_List?.[Word_Index_Identifier]
              ),
              Translation_Text: Clean_String_Content(
                Translation_Word_By_Word_List?.[Word_Index_Identifier]
              ),
            });
          }

          Category_Adiyah_Collection.push({
            ID: Current_Dua_ID_Number,
            In_Category_ID: Index_Identifier + 1,
            Arabic_Text: Clean_String_Content(Arabic_Text_String),
            Translation_Text: Clean_String_Content(Translation_Text_String),
            Reference_Text: Clean_String_Content(Reference_Text_String),
            Words_Collection,
          });
        }
      }
    );

    if (Category_Adiyah_Collection.length > 0) {
      Categories_Collection.push({
        ID: Category_ID_Counter_Number++,
        Category_Name: Category_Name_String,
        Adiyah_Collection: Category_Adiyah_Collection,
      });
    }
  }

  // Execute Batch Transaction
  const Database_Transaction = Database_Instance.transaction(() => {
    for (const Category_Record_Item of Categories_Collection) {
      Insert_Category_Statement.run(
        Category_Record_Item.ID,
        Category_Record_Item.Category_Name,
        Category_Record_Item.Adiyah_Collection.length
      );
      for (const Dua_Record_Item of Category_Record_Item.Adiyah_Collection) {
        Insert_Dua_Statement.run(
          Dua_Record_Item.ID,
          Category_Record_Item.ID,
          Dua_Record_Item.In_Category_ID,
          Dua_Record_Item.Arabic_Text,
          Dua_Record_Item.Translation_Text,
          Dua_Record_Item.Reference_Text
        );
        for (const Word_By_Word_Record_Item of Dua_Record_Item.Words_Collection) {
          Insert_Word_By_Word_Statement.run(
            Word_By_Word_Record_Item.ID,
            Word_By_Word_Record_Item.Dua_ID,
            Word_By_Word_Record_Item.Word_Position_Index,
            Word_By_Word_Record_Item.Transliteration_Text,
            Word_By_Word_Record_Item.Translation_Text
          );
        }
      }
    }
  });

  Database_Transaction();
  Database_Instance.close();
  console.log(
    ` -> Compiled Asset/Corpus/Aid/Dua.db (${Categories_Collection.length} categories)`
  );
}