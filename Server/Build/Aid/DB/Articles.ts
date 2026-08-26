import * as File_System_Module from "fs";
import * as Path_Module from "path";
import Database from "better-sqlite3";
import {
  Aid_Articles_Data_Directory_Path,
  Aid_Articles_Output_Database_Path,
} from "../Config.js";
import { Should_Rebuild_Database } from "../Utility/Cache.js";
import {
  Read_JavaScript_Object_Notation_File,
  Clean_String_Content,
} from "../Utility/Parser.js";

// Structure inside each Article JSON file: [ Title, text ]
type Raw_Article_Entry = [string, string];

interface Article_Record {
  Id_Number: number;
  In_Topic_Id_Number: number;
  Article_Title: string;
  Article_Text: string;
}

interface Topic_Record {
  Id_Number: number;
  Topic_Name: string;
  Articles_Collection: Article_Record[];
}

export function Build_Articles_Database(
  Should_Force_Execution: boolean = false
): void {
  if (!File_System_Module.existsSync(Aid_Articles_Data_Directory_Path)) return;

  if (
    !Should_Rebuild_Database(
      Aid_Articles_Output_Database_Path,
      Aid_Articles_Data_Directory_Path,
      Should_Force_Execution
    )
  ) {
    console.log("[Skipped] Aid/Article.db is up to date.");
    return;
  }

  const Output_Directory_Path: string = Path_Module.dirname(
    Aid_Articles_Output_Database_Path
  );
  if (!File_System_Module.existsSync(Output_Directory_Path)) {
    File_System_Module.mkdirSync(Output_Directory_Path, { recursive: true });
  }

  if (File_System_Module.existsSync(Aid_Articles_Output_Database_Path)) {
    File_System_Module.unlinkSync(Aid_Articles_Output_Database_Path);
  }

  console.log("Compiling Aid Database: Article.db");
  const Database_Instance = new Database(Aid_Articles_Output_Database_Path);
  Database_Instance.pragma("journal_mode = WAL");
  Database_Instance.pragma("synchronous = NORMAL");

  // Schema without AUTOINCREMENT (prevents sqlite_sequence creation)
  Database_Instance.exec(`
    CREATE TABLE IF NOT EXISTS Topic (
      ID INTEGER PRIMARY KEY,
      Name TEXT NOT NULL,
      Article_Count INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Article (
      ID INTEGER PRIMARY KEY,
      Topic_ID INTEGER NOT NULL,
      In_Topic_ID INTEGER NOT NULL,
      Title TEXT NOT NULL,
      text TEXT NOT NULL,
      FOREIGN KEY (Topic_ID) REFERENCES Topic(ID)
    );
  `);

  const Insert_Topic_Statement = Database_Instance.prepare(
    `INSERT INTO Topic (ID, Name, Article_Count) VALUES (?, ?, ?)`
  );

  const Insert_Article_Statement = Database_Instance.prepare(`
    INSERT INTO Article (
      ID,
      Topic_ID,
      In_Topic_ID,
      Title,
      text
    ) VALUES (?, ?, ?, ?, ?)
  `);

  const Directory_Entries_List: string[] = File_System_Module.readdirSync(
    Aid_Articles_Data_Directory_Path
  ).filter((File_Name_Item: string) => File_Name_Item.endsWith(".json"));

  Directory_Entries_List.sort(
    (First_File_Name: string, Second_File_Name: string) =>
      First_File_Name.localeCompare(Second_File_Name, undefined, {
        numeric: true,
        sensitivity: "base",
      })
  );

  const Topics_Collection: Topic_Record[] = [];
  let Topic_Id_Counter_Number: number = 1;
  let Global_Article_Counter_Number: number = 1;

  for (const File_Name_Item of Directory_Entries_List) {
    const File_Path_String: string = Path_Module.join(
      Aid_Articles_Data_Directory_Path,
      File_Name_Item
    );
    const Raw_Data_Content: unknown = Read_JavaScript_Object_Notation_File(
      File_Path_String
    ) as Raw_Article_Entry[] | Raw_Article_Entry;

    if (!Raw_Data_Content) continue;

    const Topic_Name_String: string = Path_Module.basename(
      File_Name_Item,
      ".json"
    ).replace(/-/g, " ");
    const Topic_Articles_Collection: Article_Record[] = [];

    // Handles both an array of pairs [[title, text], ...] or a single pair [title, text]
    const Entries_To_Process_List: Raw_Article_Entry[] = Array.isArray(
      (Raw_Data_Content as Raw_Article_Entry[])[0]
    )
      ? (Raw_Data_Content as Raw_Article_Entry[])
      : [(Raw_Data_Content as unknown) as Raw_Article_Entry];

    Entries_To_Process_List.forEach(
      (Article_Entry_Item: Raw_Article_Entry, Index_Identifier: number) => {
        if (
          Array.isArray(Article_Entry_Item) &&
          Article_Entry_Item.length >= 2
        ) {
          const [Article_Title_String, Article_Text_String] = Article_Entry_Item;

          Topic_Articles_Collection.push({
            Id_Number: Global_Article_Counter_Number++,
            In_Topic_Id_Number: Index_Identifier + 1,
            Article_Title: Clean_String_Content(Article_Title_String),
            Article_Text: Clean_String_Content(Article_Text_String),
          });
        }
      }
    );

    if (Topic_Articles_Collection.length > 0) {
      Topics_Collection.push({
        Id_Number: Topic_Id_Counter_Number++,
        Topic_Name: Topic_Name_String,
        Articles_Collection: Topic_Articles_Collection,
      });
    }
  }

  // Execute Batch Transaction
  const Database_Transaction = Database_Instance.transaction(() => {
    for (const Topic_Record_Item of Topics_Collection) {
      Insert_Topic_Statement.run(
        Topic_Record_Item.Id_Number,
        Topic_Record_Item.Topic_Name,
        Topic_Record_Item.Articles_Collection.length
      );
      for (const Article_Record_Item of Topic_Record_Item.Articles_Collection) {
        Insert_Article_Statement.run(
          Article_Record_Item.Id_Number,
          Topic_Record_Item.Id_Number,
          Article_Record_Item.In_Topic_Id_Number,
          Article_Record_Item.Article_Title,
          Article_Record_Item.Article_Text
        );
      }
    }
  });

  Database_Transaction();
  Database_Instance.close();
  console.log(
    ` -> Compiled Asset/Corpus/Aid/Article.db (${Topics_Collection.length} topics)`
  );
}