import * as File_System from "fs";
import * as Path_Module from "path";
import Database from "better-sqlite3";
import { Information_Base_Directory, Corpus_Quran_Output_Directory } from "../Config.js";
import { Should_Rebuild_Database } from "../Utility/Cache.js";
import { Read_JavaScript_Object_Notation_File, Extract_Ayah_String } from "../Utility/Parser.js";

export function Build_Information_Databases(): void {
  if (!File_System.existsSync(Information_Base_Directory)) return;

  const Entries_Array: File_System.Dirent[] = File_System.readdirSync(Information_Base_Directory, { withFileTypes: true });

  for (const Entry_Item of Entries_Array) {
    if (Entry_Item.isDirectory()) {
      const Author_Directory: string = Path_Module.join(Information_Base_Directory, Entry_Item.name);
      const Target_Database_Path: string = Path_Module.join(Corpus_Quran_Output_Directory, "Info", `${Entry_Item.name}.db`);

      if (!Should_Rebuild_Database(Target_Database_Path, Author_Directory)) {
        console.log(`[Skipped] Info/${Entry_Item.name}.db is up to date.`);
        continue;
      }

      const Information_Output_Directory: string = Path_Module.dirname(Target_Database_Path);
      if (!File_System.existsSync(Information_Output_Directory)) {
        File_System.mkdirSync(Information_Output_Directory, { recursive: true });
      }

      if (File_System.existsSync(Target_Database_Path)) File_System.unlinkSync(Target_Database_Path);

      console.log(`Compiling Info DB: ${Entry_Item.name}.db`);
      const Database_Instance: Database.Database = new Database(Target_Database_Path);
      Database_Instance.pragma("journal_mode = WAL");
      Database_Instance.pragma("synchronous = NORMAL");

      Database_Instance.exec(`
        CREATE TABLE IF NOT EXISTS Info (
          Surah INTEGER PRIMARY KEY,
          text TEXT NOT NULL
        );
      `);

      const Insert_Information_Statement: Database.Statement = Database_Instance.prepare(`INSERT INTO Info (Surah, text) VALUES (?, ?)`);

      const Transaction_Execution = Database_Instance.transaction(() => {
        for (let Surah_ID = 1; Surah_ID <= 114; Surah_ID++) {
          const JavaScript_Object_Notation_Path: string = Path_Module.join(Author_Directory, `${Surah_ID}.json`);
          if (!File_System.existsSync(JavaScript_Object_Notation_Path)) continue;

          const Information_Data: unknown = Read_JavaScript_Object_Notation_File(JavaScript_Object_Notation_Path);
          
          let Information_Text = "";
          if (Array.isArray(Information_Data)) {
            Information_Text = Extract_Ayah_String(Information_Data[0]);
          } else {
            Information_Text = Extract_Ayah_String(Information_Data);
          }

          if (Information_Text && Information_Text.trim()) {
            Insert_Information_Statement.run(Surah_ID, Information_Text.trim());
          }
        }
      });

      Transaction_Execution();
      Database_Instance.close();
      console.log(` -> Compiled Info DB ${Entry_Item.name}.db`);
    }
  }
}