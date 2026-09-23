import * as File_System from "fs";
import * as Path_Module from "path";
import Database from "better-sqlite3";
import { Transliteration_Base_Directory, Corpus_Quran_Output_Directory } from "../Config.js";
import { Should_Rebuild_Database } from "../Utility/Cache.js";
import { Read_JavaScript_Object_Notation_File, Extract_Ayaat_Array, Extract_Ayah_String, Split_Into_Kalimaat } from "../Utility/Parser.js";

export function Build_Transliteration_Databases(): void {
  if (!File_System.existsSync(Transliteration_Base_Directory)) return;

  function Traverse_Directory(Current_Directory: string, Relative_Path: string): void {
    const Entries_Array: File_System.Dirent[] = File_System.readdirSync(Current_Directory, { withFileTypes: true });
    const Is_Edition_Folder: boolean = Entries_Array.some(
      (Entry_Item) => Entry_Item.isFile() && Entry_Item.name.endsWith(".json") && !isNaN(parseInt(Entry_Item.name.replace(".json", ""), 10))
    );

    if (Is_Edition_Folder) {
      const Target_Database_Path: string = Path_Module.join(Corpus_Quran_Output_Directory, "Transliteration", `${Relative_Path}.db`);

      if (!Should_Rebuild_Database(Target_Database_Path, Current_Directory)) {
        console.log(`[Skipped] Transliteration/${Relative_Path}.db is up to date.`);
        return;
      }

      const Edition_Output_Directory: string = Path_Module.dirname(Target_Database_Path);
      if (!File_System.existsSync(Edition_Output_Directory)) {
        File_System.mkdirSync(Edition_Output_Directory, { recursive: true });
      }

      if (File_System.existsSync(Target_Database_Path)) File_System.unlinkSync(Target_Database_Path);

      console.log(`Compiling Transliteration DB: ${Relative_Path}.db`);
      const Database_Instance: Database.Database = new Database(Target_Database_Path);
      Database_Instance.pragma("journal_mode = WAL");
      Database_Instance.pragma("synchronous = NORMAL");

      Database_Instance.exec(`
        CREATE TABLE IF NOT EXISTS Ayah (
          Surah INTEGER NOT NULL,
          Ayah INTEGER NOT NULL,
          Text TEXT NOT NULL,
          PRIMARY KEY (Surah, Ayah)
        );

        CREATE TABLE IF NOT EXISTS Kalimah (
          Surah INTEGER NOT NULL,
          Ayah INTEGER NOT NULL,
          Kalimah INTEGER NOT NULL,
          Text TEXT NOT NULL,
          PRIMARY KEY (Surah, Ayah, Kalimah)
        );
      `);

      const Insert_Ayah_Statement: Database.Statement = Database_Instance.prepare(`INSERT INTO Ayah (Surah, Ayah, text) VALUES (?, ?, ?)`);
      const Insert_Kalimah_Statement: Database.Statement = Database_Instance.prepare(`INSERT INTO Kalimah (Surah, Ayah, Kalimah, text) VALUES (?, ?, ?, ?)`);

      const Transaction_Execution = Database_Instance.transaction(() => {
        for (let Surah_ID = 1; Surah_ID <= 114; Surah_ID++) {
          const Raw_Data_Object: unknown = Read_JavaScript_Object_Notation_File(Path_Module.join(Current_Directory, `${Surah_ID}.json`));
          const Ayaat_Array: unknown[] = Extract_Ayaat_Array(Raw_Data_Object);

          Ayaat_Array.forEach((Item_Value: unknown, Ayah_Index: number) => {
            const Ayah_ID = Ayah_Index + 1;
            let Kalimaat_List_Array: string[] = [];
            let Ayah_Text_Content = "";

            if (Array.isArray(Item_Value)) {
              Kalimaat_List_Array = Item_Value.map((Kalimah_Item) => Extract_Ayah_String(Kalimah_Item).trim()).filter(Boolean);
              Ayah_Text_Content = Kalimaat_List_Array.join(" ");
            } else if (
              Item_Value &&
              typeof Item_Value === "object" &&
              "Kalimaat" in Item_Value &&
              Array.isArray((Item_Value as Record<string, unknown>).Kalimaat)
            ) {
              const Kalimaat_Array = (Item_Value as Record<string, unknown>).Kalimaat as unknown[];
              Kalimaat_List_Array = Kalimaat_Array.map((Kalimah_Item) => Extract_Ayah_String(Kalimah_Item).trim()).filter(Boolean);
              Ayah_Text_Content = Kalimaat_List_Array.join(" ");
            } else {
              Ayah_Text_Content = Extract_Ayah_String(Item_Value);
              Kalimaat_List_Array = Split_Into_Kalimaat(Ayah_Text_Content);
            }

            if (Ayah_Text_Content) {
              Insert_Ayah_Statement.run(Surah_ID, Ayah_ID, Ayah_Text_Content);

              Kalimaat_List_Array.forEach((Kalimah_Text_Content: string, Kalimah_Index: number) => {
                const Kalimah_Position = Kalimah_Index + 1;
                if (Kalimah_Text_Content && typeof Kalimah_Text_Content === "string") {
                  Insert_Kalimah_Statement.run(Surah_ID, Ayah_ID, Kalimah_Position, Kalimah_Text_Content.trim());
                }
              });
            }
          });
        }
      });

      Transaction_Execution();
      Database_Instance.close();
      console.log(` -> Compiled Transliteration/${Relative_Path}.db with Ayah and Kalimah`);
    } else {
      for (const Entry_Item of Entries_Array) {
        if (Entry_Item.isDirectory()) {
          Traverse_Directory(
            Path_Module.join(Current_Directory, Entry_Item.name),
            Relative_Path ? `${Relative_Path}/${Entry_Item.name}` : Entry_Item.name
          );
        }
      }
    }
  }

  Traverse_Directory(Transliteration_Base_Directory, "");
}