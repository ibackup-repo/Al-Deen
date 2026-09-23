import * as File_System from "fs";
import * as Path_Module from "path";
import Database from "better-sqlite3";
import { Translation_Base_Directory, Corpus_Quran_Output_Directory } from "../Config.js";
import { Should_Rebuild_Database } from "../Utility/Cache.js";
import { Read_JavaScript_Object_Notation_File, Extract_Ayaat_Array, Extract_Ayah_String } from "../Utility/Parser.js";

// Directory matched directly to Server/Data/Quran/Surah/Translation/Kalimah-By-Kalimah
const Word_By_Word_Base_Directory: string = Path_Module.join(Translation_Base_Directory, "Kalimah-By-Kalimah");

interface Process_Database_Options {
  Has_Ayah?: boolean;
}

export function Build_Translation_Databases(): void {
  if (!File_System.existsSync(Translation_Base_Directory)) return;

  const Processed_Word_By_Word_Paths_Set = new Set<string>();

  function Find_Word_By_Word_Directory(Relative_Path: string): string | null {
    if (!File_System.existsSync(Word_By_Word_Base_Directory)) return null;

    // 1. Exact relative path match
    const Exact_Match_Path: string = Path_Module.join(Word_By_Word_Base_Directory, Relative_Path);
    if (File_System.existsSync(Exact_Match_Path)) return Exact_Match_Path;

    // 2. Edition name match (e.g. "Saheeh-International")
    const Edition_Name: string = Path_Module.basename(Relative_Path);

    function Search_Directory_Tree(Current_Directory: string): string | null {
      const Entries_Array: File_System.Dirent[] = File_System.readdirSync(Current_Directory, { withFileTypes: true });
      for (const Entry_Item of Entries_Array) {
        if (Entry_Item.isDirectory()) {
          const Full_Path: string = Path_Module.join(Current_Directory, Entry_Item.name);
          if (Entry_Item.name === Edition_Name) {
            return Full_Path;
          }
          const Nested_Directory_Path: string | null = Search_Directory_Tree(Full_Path);
          if (Nested_Directory_Path) return Nested_Directory_Path;
        }
      }
      return null;
    }

    return Search_Directory_Tree(Word_By_Word_Base_Directory);
  }

  function Find_Footnote_Directory(Current_Directory: string): string | null {
    const Footnote_Directory_Path: string = Path_Module.join(Current_Directory, "Footnote");
    if (File_System.existsSync(Footnote_Directory_Path) && File_System.statSync(Footnote_Directory_Path).isDirectory()) {
      return Footnote_Directory_Path;
    }
    return null;
  }

  function Traverse_Directory(Current_Directory: string, Relative_Path: string): void {
    // Skip Kalimah-By-Kalimah directory in primary pass to prevent duplicate compilation
    if (Relative_Path.startsWith("Kalimah-By-Kalimah")) return;

    const Entries_Array: File_System.Dirent[] = File_System.readdirSync(Current_Directory, { withFileTypes: true });
    const Is_Edition_Folder: boolean = Entries_Array.some(
      (Entry_Item) => Entry_Item.isFile() && Entry_Item.name.endsWith(".json") && !isNaN(parseInt(Entry_Item.name.replace(".json", ""), 10))
    );

    if (Is_Edition_Folder) {
      Process_Database(Current_Directory, Relative_Path, { Has_Ayah: true });
    } else {
      for (const Entry_Item of Entries_Array) {
        if (Entry_Item.isDirectory()) {
          // Avoid traversing into nested utility/metadata folders as separate editions
          if (Entry_Item.name === "Footnote" || Entry_Item.name === "Kalimah-By-Kalimah") {
            continue;
          }
          Traverse_Directory(
            Path_Module.join(Current_Directory, Entry_Item.name),
            Relative_Path ? `${Relative_Path}/${Entry_Item.name}` : Entry_Item.name
          );
        }
      }
    }
  }

  function Process_Database(
    Current_Directory: string,
    Relative_Path: string,
    Options_Object: Process_Database_Options = { Has_Ayah: true },
    Forced_Word_By_Word_Directory: string | null = null
  ): void {
    const Target_Database_Path: string = Path_Module.join(Corpus_Quran_Output_Directory, "Translation", `${Relative_Path}.db`);

    const Word_By_Word_Directory: string | null = Forced_Word_By_Word_Directory || Find_Word_By_Word_Directory(Relative_Path);
    const Footnote_Directory: string | null = Find_Footnote_Directory(Current_Directory);

    const Has_Kalimah_Table: boolean = Boolean(Word_By_Word_Directory);
    const Has_Footnote_Table: boolean = Boolean(Footnote_Directory);

    if (Word_By_Word_Directory) {
      Processed_Word_By_Word_Paths_Set.add(Path_Module.resolve(Word_By_Word_Directory));
    }

    if (!Should_Rebuild_Database(Target_Database_Path, Current_Directory)) {
      console.log(`[Skipped] Translation/${Relative_Path}.db is up to date.`);
      return;
    }

    const Edition_Output_Directory: string = Path_Module.dirname(Target_Database_Path);
    if (!File_System.existsSync(Edition_Output_Directory)) {
      File_System.mkdirSync(Edition_Output_Directory, { recursive: true });
    }

    if (File_System.existsSync(Target_Database_Path)) File_System.unlinkSync(Target_Database_Path);

    console.log(`Compiling Translation DB: ${Relative_Path}.db`);
    const Database_Instance: Database.Database = new Database(Target_Database_Path);
    Database_Instance.pragma("journal_mode = WAL");
    Database_Instance.pragma("synchronous = NORMAL");

    if (Options_Object.Has_Ayah) {
      Database_Instance.exec(`
        CREATE TABLE IF NOT EXISTS Ayah (
          Surah INTEGER NOT NULL,
          Ayah INTEGER NOT NULL,
          Text TEXT NOT NULL,
          PRIMARY KEY (Surah, Ayah)
        );
      `);
    }

    if (Has_Kalimah_Table) {
      Database_Instance.exec(`
        CREATE TABLE IF NOT EXISTS Kalimah (
          Surah INTEGER NOT NULL,
          Ayah INTEGER NOT NULL,
          Kalimah INTEGER NOT NULL,
          Text TEXT NOT NULL,
          PRIMARY KEY (Surah, Ayah, Kalimah)
        );
      `);
    }

    if (Has_Footnote_Table) {
      Database_Instance.exec(`
        CREATE TABLE IF NOT EXISTS Footnote (
          Surah INTEGER NOT NULL,
          Footnote INTEGER NOT NULL,
          Text TEXT NOT NULL,
          PRIMARY KEY (Surah, Footnote)
        );
      `);
    }

    const Insert_Ayah_Statement: Database.Statement | null = Options_Object.Has_Ayah
      ? Database_Instance.prepare(`INSERT INTO Ayah (Surah, Ayah, text) VALUES (?, ?, ?)`)
      : null;

    const Insert_Kalimah_Statement: Database.Statement | null = Has_Kalimah_Table
      ? Database_Instance.prepare(`INSERT INTO Kalimah (Surah, Ayah, Kalimah, text) VALUES (?, ?, ?, ?)`)
      : null;

    const Insert_Footnote_Statement: Database.Statement | null = Has_Footnote_Table
      ? Database_Instance.prepare(`INSERT INTO Footnote (Surah, Footnote, text) VALUES (?, ?, ?)`)
      : null;

    const Transaction_Execution = Database_Instance.transaction(() => {
      for (let Surah_ID = 1; Surah_ID <= 114; Surah_ID++) {
        // 1. Insert Ayah
        if (Options_Object.Has_Ayah && Insert_Ayah_Statement) {
          const Raw_Data_Object: unknown = Read_JavaScript_Object_Notation_File(Path_Module.join(Current_Directory, `${Surah_ID}.json`));
          const Ayaat_Array: unknown[] = Extract_Ayaat_Array(Raw_Data_Object);

          Ayaat_Array.forEach((Item_Value, Ayah_Index) => {
            const Ayah_ID = Ayah_Index + 1;
            const Ayah_Text_Content: string = Extract_Ayah_String(Item_Value);

            if (Ayah_Text_Content) {
              Insert_Ayah_Statement.run(Surah_ID, Ayah_ID, Ayah_Text_Content);
            }
          });
        }

        // 2. Insert Kalimah (Kalimah by Kalimah)
        if (Has_Kalimah_Table && Insert_Kalimah_Statement && Word_By_Word_Directory) {
          const Word_By_Word_File_Path: string = Path_Module.join(Word_By_Word_Directory, `${Surah_ID}.json`);
          const Raw_Word_By_Word_Data: unknown = Read_JavaScript_Object_Notation_File(Word_By_Word_File_Path);

          if (Array.isArray(Raw_Word_By_Word_Data)) {
            Raw_Word_By_Word_Data.forEach((Ayah_Array_Item: unknown, Ayah_Index: number) => {
              const Ayah_ID = Ayah_Index + 1;

              if (Array.isArray(Ayah_Array_Item)) {
                Ayah_Array_Item.forEach((Word_Text_Content: unknown, Kalimah_Index: number) => {
                  if (Word_Text_Content && typeof Word_Text_Content === "string") {
                    Insert_Kalimah_Statement.run(Surah_ID, Ayah_ID, Kalimah_Index + 1, Word_Text_Content.trim());
                  }
                });
              }
            });
          }
        }

        // 3. Insert Footnote without Ayah column
        if (Has_Footnote_Table && Insert_Footnote_Statement && Footnote_Directory) {
          const Footnote_File_Path: string = Path_Module.join(Footnote_Directory, `${Surah_ID}.json`);
          const Raw_Footnote_Data: unknown = Read_JavaScript_Object_Notation_File(Footnote_File_Path);

          if (Array.isArray(Raw_Footnote_Data)) {
            let Surah_Footnote_Counter = 0;

            const Insert_Entry = (Footnote_Text_Content: unknown) => {
              if (typeof Footnote_Text_Content === "string" && Footnote_Text_Content.trim()) {
                Surah_Footnote_Counter++;
                Insert_Footnote_Statement.run(Surah_ID, Surah_Footnote_Counter, Footnote_Text_Content.trim());
              }
            };

            Raw_Footnote_Data.forEach((Item: unknown) => {
              if (Array.isArray(Item)) {
                // Handles nested 2D array formats
                Item.forEach(Insert_Entry);
              } else {
                // Handles flat 1D string array formats (like your 1.json)
                Insert_Entry(Item);
              }
            });
          }
        }
      }
    });

    Transaction_Execution();
    Database_Instance.close();
    console.log(` -> Compiled tables into Translation/${Relative_Path}.db`);
  }

  // 1. Process standard Translations
  Traverse_Directory(Translation_Base_Directory, "");

  // 2. Process standalone Kalimah-By-Kalimah editions (e.g., Kalimah-By-Kalimah/English/Direct)
  if (File_System.existsSync(Word_By_Word_Base_Directory)) {
    function Traverse_Word_By_Word_Standalone(Current_Directory: string): void {
      const Entries_Array: File_System.Dirent[] = File_System.readdirSync(Current_Directory, { withFileTypes: true });
      const Is_Edition_Folder: boolean = Entries_Array.some(
        (Entry_Item) => Entry_Item.isFile() && Entry_Item.name.endsWith(".json") && !isNaN(parseInt(Entry_Item.name.replace(".json", ""), 10))
      );

      if (Is_Edition_Folder) {
        const Full_Path: string = Path_Module.resolve(Current_Directory);
        if (!Processed_Word_By_Word_Paths_Set.has(Full_Path)) {
          const Relative_Path_String: string = Path_Module.relative(Translation_Base_Directory, Current_Directory);
          Process_Database(Current_Directory, Relative_Path_String, { Has_Ayah: false }, Current_Directory);
        }
      } else {
        for (const Entry_Item of Entries_Array) {
          if (Entry_Item.isDirectory()) {
            Traverse_Word_By_Word_Standalone(Path_Module.join(Current_Directory, Entry_Item.name));
          }
        }
      }
    }

    Traverse_Word_By_Word_Standalone(Word_By_Word_Base_Directory);
  }
}