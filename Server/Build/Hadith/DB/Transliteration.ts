import * as File_System_Module from "node:fs";
import * as Path_Module from "node:path";
import Database_Connection from "better-sqlite3";
import {
  Hadith_Transliteration_Data_Directory_Path,
  Hadith_Transliteration_Output_Directory_Path,
} from "../Config.js";
import { Should_Rebuild_Database } from "../Utility/Cache.js";
import {
  Read_JavaScript_Object_Notation_File_Data,
  Clean_String_Value,
} from "../Utility/Parser.js";

export function Build_Transliteration_Databases(
  Force_Rebuild_Flag: boolean = false
): void {
  if (!File_System_Module.existsSync(Hadith_Transliteration_Data_Directory_Path)) return;

  // 1. Language Level (e.g., "Arabic")
  const Language_Directory_Entry_Collection = File_System_Module
    .readdirSync(Hadith_Transliteration_Data_Directory_Path, { withFileTypes: true })
    .filter(
      (Directory_Entry_Object) =>
        Directory_Entry_Object.isDirectory() &&
        Directory_Entry_Object.name !== "WBW"
    );

  for (const Language_Directory_Entry_Object of Language_Directory_Entry_Collection) {
    const Language_Name_String = Language_Directory_Entry_Object.name;
    const Language_Directory_Path_String = Path_Module.join(
      Hadith_Transliteration_Data_Directory_Path,
      Language_Name_String
    );

    // 2. Category Level (e.g., "Sahih")
    const Category_Directory_Entry_Collection = File_System_Module
      .readdirSync(Language_Directory_Path_String, { withFileTypes: true })
      .filter((Directory_Entry_Object) => Directory_Entry_Object.isDirectory());

    for (const Category_Directory_Entry_Object of Category_Directory_Entry_Collection) {
      const Category_Name_String = Category_Directory_Entry_Object.name;
      const Category_Directory_Path_String = Path_Module.join(
        Language_Directory_Path_String,
        Category_Name_String
      );

      // 3. Collection Level (e.g., "Muslim")
      const Collection_Directory_Entry_Collection = File_System_Module
        .readdirSync(Category_Directory_Path_String, { withFileTypes: true })
        .filter((Directory_Entry_Object) => Directory_Entry_Object.isDirectory());

      for (const Collection_Directory_Entry_Object of Collection_Directory_Entry_Collection) {
        const Collection_Name_String = Collection_Directory_Entry_Object.name;
        const Collection_Directory_Path_String = Path_Module.join(
          Category_Directory_Path_String,
          Collection_Name_String
        );

        const Target_Database_Path_String = Path_Module.join(
          Hadith_Transliteration_Output_Directory_Path,
          Language_Name_String,
          Category_Name_String,
          `${Collection_Name_String}.db`
        );

        if (
          !Should_Rebuild_Database(
            Target_Database_Path_String,
            Collection_Directory_Path_String,
            Force_Rebuild_Flag
          )
        ) {
          console.log(
            `[Skipped] Hadith/Transliteration/${Language_Name_String}/${Category_Name_String}/${Collection_Name_String}.db is up to date.`
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
          `Compiling Hadith DB: Transliteration/${Language_Name_String}/${Category_Name_String}/${Collection_Name_String}.db`
        );
        const Database_Instance = new Database_Connection(
          Target_Database_Path_String
        );
        Database_Instance.pragma("journal_mode = WAL");
        Database_Instance.pragma("synchronous = NORMAL");

        Database_Instance.exec(`
          CREATE TABLE IF NOT EXISTS Hadith (
            ID INTEGER PRIMARY KEY,
            text TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS WBW (
            ID INTEGER NOT NULL,
            Token_Index INTEGER NOT NULL,
            text TEXT NOT NULL,
            PRIMARY KEY (ID, Token_Index),
            FOREIGN KEY (ID) REFERENCES Hadith(ID)
          );
        `);

        const Insert_Hadith_Statement = Database_Instance.prepare(
          "INSERT INTO Hadith (ID, text) VALUES (?, ?)"
        );
        const Insert_Word_By_Word_Statement = Database_Instance.prepare(
          "INSERT INTO WBW (ID, Token_Index, text) VALUES (?, ?, ?)"
        );

        // 4. Chapter Level (e.g., "Introduction")
        const Chapter_Directory_Entry_Collection = File_System_Module
          .readdirSync(Collection_Directory_Path_String, { withFileTypes: true })
          .filter((Directory_Entry_Object) => Directory_Entry_Object.isDirectory());

        const Execute_Database_Transaction_Handler = Database_Instance.transaction(
          () => {
            for (const Chapter_Directory_Entry_Object of Chapter_Directory_Entry_Collection) {
              const Chapter_Directory_Path_String = Path_Module.join(
                Collection_Directory_Path_String,
                Chapter_Directory_Entry_Object.name
              );
              const File_Name_Collection_List = File_System_Module
                .readdirSync(Chapter_Directory_Path_String)
                .filter((File_Name_String) => File_Name_String.endsWith(".json"));

              for (const File_Name_String of File_Name_Collection_List) {
                const Hadith_Identifier_Number = Number(
                  Path_Module.basename(File_Name_String, ".json")
                );
                const Token_Data_Object =
                  Read_JavaScript_Object_Notation_File_Data(
                    Path_Module.join(
                      Chapter_Directory_Path_String,
                      File_Name_String
                    )
                  );

                if (Array.isArray(Token_Data_Object)) {
                  // Construct full continuous text by joining WBW tokens
                  const Full_Text_Content_String = Token_Data_Object
                    .map((Token_Value) => Clean_String_Value(String(Token_Value)))
                    .join(" ");

                  if (Full_Text_Content_String) {
                    Insert_Hadith_Statement.run(
                      Hadith_Identifier_Number,
                      Full_Text_Content_String
                    );
                  }

                  // Insert individual WBW tokens using the exact same file array
                  Token_Data_Object.forEach(
                    (Token_Value: string, Token_Index_Position_Number: number) => {
                      const Cleaned_Token_String = Clean_String_Value(
                        String(Token_Value)
                      );
                      Insert_Word_By_Word_Statement.run(
                        Hadith_Identifier_Number,
                        Token_Index_Position_Number,
                        Cleaned_Token_String
                      );
                    }
                  );
                } else if (typeof Token_Data_Object === "string") {
                  const Cleaned_Text_Content_String = Clean_String_Value(
                    Token_Data_Object
                  );
                  Insert_Hadith_Statement.run(
                    Hadith_Identifier_Number,
                    Cleaned_Text_Content_String
                  );
                  Insert_Word_By_Word_Statement.run(
                    Hadith_Identifier_Number,
                    0,
                    Cleaned_Text_Content_String
                  );
                }
              }
            }
          }
        );

        Execute_Database_Transaction_Handler();
        Database_Instance.close();
        console.log(
          ` -> Compiled Hadith/Transliteration/${Language_Name_String}/${Category_Name_String}/${Collection_Name_String}.db`
        );
      }
    }
  }
}