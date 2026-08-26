import * as File_System from "fs";
import * as Path_Module from "path";
import Database from "better-sqlite3";
import { Tafsir_Base_Directory, Corpus_Quran_Output_Directory } from "../Config.js";
import { Should_Rebuild_Database } from "../Utility/Cache.js";
import { Read_JavaScript_Object_Notation_File, Extract_Ayaat_Array, Extract_Ayah_String } from "../Utility/Parser.js";

export function Build_Tafsir_Databases(): void {
  if (!File_System.existsSync(Tafsir_Base_Directory)) return;

  function Traverse_Directory(Current_Directory: string, Relative_Path: string): void {
    const Entries_Array: File_System.Dirent[] = File_System.readdirSync(Current_Directory, { withFileTypes: true });
    
    const Is_Edition_Folder: boolean = Entries_Array.some(
      (Entry_Item) => Entry_Item.isFile() && Entry_Item.name.endsWith(".json") && !isNaN(parseInt(Entry_Item.name.replace(".json", ""), 10))
    );

    if (Is_Edition_Folder) {
      const Target_Database_Path: string = Path_Module.join(Corpus_Quran_Output_Directory, "Tafsir", `${Relative_Path}.db`);

      if (!Should_Rebuild_Database(Target_Database_Path, Current_Directory)) {
        console.log(`[Skipped] Tafsir/${Relative_Path}.db is up to date.`);
        return;
      }

      const Edition_Output_Directory: string = Path_Module.dirname(Target_Database_Path);
      if (!File_System.existsSync(Edition_Output_Directory)) {
        File_System.mkdirSync(Edition_Output_Directory, { recursive: true });
      }

      if (File_System.existsSync(Target_Database_Path)) File_System.unlinkSync(Target_Database_Path);

      console.log(`Compiling Tafsir DB: ${Relative_Path}.db`);
      const Database_Instance: Database.Database = new Database(Target_Database_Path);
      Database_Instance.pragma("journal_mode = WAL");
      Database_Instance.pragma("synchronous = NORMAL");

      Database_Instance.exec(`
        CREATE TABLE IF NOT EXISTS Ayah (
          Surah INTEGER NOT NULL,
          Ayah INTEGER NOT NULL,
          text TEXT NOT NULL,
          PRIMARY KEY (Surah, Ayah)
        );
      `);

      const Insert_Tafsir_Statement: Database.Statement = Database_Instance.prepare(`INSERT INTO Ayah (Surah, Ayah, text) VALUES (?, ?, ?)`);

      const Transaction_Execution = Database_Instance.transaction(() => {
        for (let Surah_ID = 1; Surah_ID <= 114; Surah_ID++) {
          const JavaScript_Object_Notation_Path: string = Path_Module.join(Current_Directory, `${Surah_ID}.json`);
          const Surah_Folder_Path: string = Path_Module.join(Current_Directory, `${Surah_ID}`);
          let Surah_Data: unknown = null;

          if (File_System.existsSync(JavaScript_Object_Notation_Path)) {
            Surah_Data = Read_JavaScript_Object_Notation_File(JavaScript_Object_Notation_Path);
          } else if (File_System.existsSync(Surah_Folder_Path) && File_System.statSync(Surah_Folder_Path).isDirectory()) {
            const Sub_Entries_Array: string[] = File_System.readdirSync(Surah_Folder_Path);
            const Collected_Items_Array: unknown[] = [];
            Sub_Entries_Array
              .filter((File_Name) => File_Name.endsWith(".json"))
              .sort((First_File, Second_File) => parseInt(First_File, 10) - parseInt(Second_File, 10))
              .forEach((File_Name) => {
                const Item_Value = Read_JavaScript_Object_Notation_File(Path_Module.join(Surah_Folder_Path, File_Name));
                if (Item_Value !== null && Item_Value !== undefined) {
                  Collected_Items_Array.push(Item_Value);
                }
              });
            Surah_Data = Collected_Items_Array;
          }

          if (!Surah_Data) continue;

          const Items_Array: unknown[] = Extract_Ayaat_Array(Surah_Data);
          Items_Array.forEach((Item_Value, Ayah_Index) => {
            const Text_Content: string = Extract_Ayah_String(Item_Value);
            if (Text_Content && Text_Content.trim()) {
              Insert_Tafsir_Statement.run(Surah_ID, Ayah_Index + 1, Text_Content.trim());
            }
          });
        }
      });

      Transaction_Execution();
      Database_Instance.close();
      console.log(` -> Compiled Tafsir DB ${Relative_Path}.db`);
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

  Traverse_Directory(Tafsir_Base_Directory, "");
}