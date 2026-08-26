import * as File_System_Module from "node:fs";
import * as Path_Module from "node:path";
import Database_Connection from "better-sqlite3";
import {
  Hadith_Arabic_Data_Directory_Path,
  Hadith_Arabic_Output_Directory_Path,
} from "../Config.js";
import { Should_Rebuild_Database } from "../Utility/Cache.js";
import {
  Read_JavaScript_Object_Notation_File_Data,
  Clean_String_Value,
} from "../Utility/Parser.js";

type Narration_Record = {
  Identifier_Number: number;
  In_Chapter_Identifier_Number: number;
  Text_Content_String: string;
};

type Chapter_Record = {
  Chapter_Identifier_Number: number;
  Name_Text_String: string;
  Narration_Collection_List: Narration_Record[];
};

export function Build_Arabic_Hadith_Databases(
  Force_Rebuild_Flag: boolean = false
): void {
  if (!File_System_Module.existsSync(Hadith_Arabic_Data_Directory_Path)) return;

  const Top_Level_Directory_Entry_Collection = File_System_Module
    .readdirSync(Hadith_Arabic_Data_Directory_Path, { withFileTypes: true })
    .filter((Directory_Entry_Object) => Directory_Entry_Object.isDirectory());

  for (const Top_Level_Directory_Entry_Object of Top_Level_Directory_Entry_Collection) {
    const Top_Level_Directory_Name_String = Top_Level_Directory_Entry_Object.name;
    const Top_Level_Directory_Path_String = Path_Module.join(
      Hadith_Arabic_Data_Directory_Path,
      Top_Level_Directory_Name_String
    );

    const Author_Directory_Entry_Collection = File_System_Module
      .readdirSync(Top_Level_Directory_Path_String, { withFileTypes: true })
      .filter((Directory_Entry_Object) => Directory_Entry_Object.isDirectory());

    for (const Author_Directory_Entry_Object of Author_Directory_Entry_Collection) {
      const Author_Name_String = Author_Directory_Entry_Object.name;
      const Author_Directory_Path_String = Path_Module.join(
        Top_Level_Directory_Path_String,
        Author_Name_String
      );

      const Target_Database_Path_String = Path_Module.join(
        Hadith_Arabic_Output_Directory_Path,
        Top_Level_Directory_Name_String,
        `${Author_Name_String}.db`
      );

      if (
        !Should_Rebuild_Database(
          Target_Database_Path_String,
          Author_Directory_Path_String,
          Force_Rebuild_Flag
        )
      ) {
        console.log(
          `[Skipped] Hadith/Arabic/${Top_Level_Directory_Name_String}/${Author_Name_String}.db is up to date.`
        );
        continue;
      }

      const Output_Directory_Path_String = Path_Module.dirname(
        Target_Database_Path_String
      );
      if (!File_System_Module.existsSync(Output_Directory_Path_String)) {
        File_System_Module.mkdirSync(Output_Directory_Path_String, {
          recursive: true,
        });
      }

      if (File_System_Module.existsSync(Target_Database_Path_String)) {
        File_System_Module.unlinkSync(Target_Database_Path_String);
      }

      console.log(
        `Compiling Hadith DB: Arabic/${Top_Level_Directory_Name_String}/${Author_Name_String}.db`
      );
      const Database_Instance = new Database_Connection(
        Target_Database_Path_String
      );
      Database_Instance.pragma("journal_mode = WAL");
      Database_Instance.pragma("synchronous = NORMAL");

      Database_Instance.exec(`
        CREATE TABLE IF NOT EXISTS Chapter (
          ID INTEGER PRIMARY KEY,
          Hadith_Count INTEGER NOT NULL,
          Name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS Narration (
          Chapter_ID INTEGER NOT NULL,
          ID INTEGER PRIMARY KEY,
          In_Chapter_ID INTEGER NOT NULL,
          text TEXT NOT NULL,
          FOREIGN KEY (Chapter_ID) REFERENCES Chapter(ID)
        );
      `);

      const Insert_Chapter_Statement = Database_Instance.prepare(
        `INSERT INTO Chapter (ID, Hadith_Count, Name) VALUES (?, ?, ?)`
      );
      const Insert_Narration_Statement = Database_Instance.prepare(
        `INSERT INTO Narration (Chapter_ID, ID, In_Chapter_ID, text) VALUES (?, ?, ?, ?)`
      );

      const Directory_Entry_Collection = File_System_Module.readdirSync(
        Author_Directory_Path_String,
        { withFileTypes: true }
      );
      const Chapter_Collection_List: Chapter_Record[] = [];

      Directory_Entry_Collection.sort(
        (First_Entry_Object, Second_Entry_Object) =>
          First_Entry_Object.name.localeCompare(
            Second_Entry_Object.name,
            undefined,
            { numeric: true, sensitivity: "base" }
          )
      );

      let Chapter_Identifier_Counter_Number = 1;

      for (const Directory_Entry_Object of Directory_Entry_Collection) {
        const Directory_Entry_Path_String = Path_Module.join(
          Author_Directory_Path_String,
          Directory_Entry_Object.name
        );
        const Compiled_Narration_Collection_List: Narration_Record[] = [];

        if (Directory_Entry_Object.isDirectory()) {
          const Hadith_File_Name_Collection_List = File_System_Module
            .readdirSync(Directory_Entry_Path_String)
            .filter((File_Name_String) =>
              File_Name_String.endsWith(".json")
            );

          Hadith_File_Name_Collection_List.sort(
            (First_File_Name_String, Second_File_Name_String) =>
              First_File_Name_String.localeCompare(
                Second_File_Name_String,
                undefined,
                { numeric: true, sensitivity: "base" }
              )
          );

          Hadith_File_Name_Collection_List.forEach(
            (File_Name_String, File_Index_Position_Number) => {
              const File_Identifier_String_Text = Path_Module.basename(
                File_Name_String,
                ".json"
              );
              const Raw_File_Data_Object =
                Read_JavaScript_Object_Notation_File_Data(
                  Path_Module.join(
                    Directory_Entry_Path_String,
                    File_Name_String
                  )
                );

              let Arabic_Text_Content_String = "";
              let In_Chapter_Identifier_Number =
                File_Index_Position_Number + 1;
              let Global_Identifier_Number =
                Number(File_Identifier_String_Text) ||
                File_Index_Position_Number + 1;

              if (Array.isArray(Raw_File_Data_Object)) {
                if (typeof Raw_File_Data_Object[0] === "string") {
                  Arabic_Text_Content_String = Clean_String_Value(
                    Raw_File_Data_Object[0]
                  );
                }
                if (typeof Raw_File_Data_Object[1] === "number") {
                  In_Chapter_Identifier_Number = Raw_File_Data_Object[1];
                }
                if (typeof Raw_File_Data_Object[2] === "number") {
                  Global_Identifier_Number = Raw_File_Data_Object[2];
                }
              } else if (typeof Raw_File_Data_Object === "string") {
                Arabic_Text_Content_String = Clean_String_Value(
                  Raw_File_Data_Object
                );
              }

              if (Arabic_Text_Content_String) {
                Compiled_Narration_Collection_List.push({
                  Identifier_Number: Global_Identifier_Number,
                  In_Chapter_Identifier_Number,
                  Text_Content_String: Arabic_Text_Content_String,
                });
              }
            }
          );

          if (Compiled_Narration_Collection_List.length > 0) {
            Chapter_Collection_List.push({
              Chapter_Identifier_Number:
                Chapter_Identifier_Counter_Number++,
              Name_Text_String: Directory_Entry_Object.name.replace(/-/g, " "),
              Narration_Collection_List:
                Compiled_Narration_Collection_List,
            });
          }
        }
      }

      const Execute_Database_Transaction_Handler = Database_Instance.transaction(
        () => {
          for (const Chapter_Record_Object of Chapter_Collection_List) {
            Insert_Chapter_Statement.run(
              Chapter_Record_Object.Chapter_Identifier_Number,
              Chapter_Record_Object.Narration_Collection_List.length,
              Chapter_Record_Object.Name_Text_String
            );
            for (const Narration_Record_Object of Chapter_Record_Object.Narration_Collection_List) {
              Insert_Narration_Statement.run(
                Chapter_Record_Object.Chapter_Identifier_Number,
                Narration_Record_Object.Identifier_Number,
                Narration_Record_Object.In_Chapter_Identifier_Number,
                Narration_Record_Object.Text_Content_String
              );
            }
          }
        }
      );

      Execute_Database_Transaction_Handler();
      Database_Instance.close();
      console.log(
        ` -> Compiled Hadith/Arabic/${Top_Level_Directory_Name_String}/${Author_Name_String}.db (${Chapter_Collection_List.length} chapters)`
      );
    }
  }
}