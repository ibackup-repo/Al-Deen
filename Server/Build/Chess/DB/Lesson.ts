import FS from 'fs';
import Database from 'better-sqlite3';
import { Lesson_Data_Directory, Lesson_DB_Path, Is_Force_Build } from '../Config.ts';
import { Walk_Directory, Sanitize_Table_Name } from '../Utility/Parse.ts';

export function Build_Lesson_DB(): void {
  console.log("🔍 Processing Chess Lessons...");

  if (Is_Force_Build && FS.existsSync(Lesson_DB_Path)) {
    console.log("  [FORCE] Removing existing Lesson DB...");
    FS.unlinkSync(Lesson_DB_Path);
  }

  const DB = new Database(Lesson_DB_Path);
  DB.pragma('journal_mode = WAL');

  const Lesson_Files = Walk_Directory(Lesson_Data_Directory);
  let Processed_Count = 0;
  let Skipped_Count = 0;

  const Active_Tables = new Set<string>();

  for (const File_Path of Lesson_Files) {
    const Clean_Path = File_Path.replace(/\\/g, "/");
    const Match_Result = Clean_Path.match(/\/Lesson\/([^/]+)\/([^/]+)\/(?:The-)?([^/]+)\.json$/i);

    if (!Match_Result) {
      console.warn(`  [SKIP - Regex Mismatch] ${Clean_Path}`);
      Skipped_Count++;
      continue;
    }

    const Raw_Category_Id = Match_Result[1].toLowerCase();
    const Subcategory_Id = Match_Result[2].toLowerCase();
    const Lesson_Id = Match_Result[3].toLowerCase();
    const Table_Name = Sanitize_Table_Name(Raw_Category_Id);

    try {
      const File_Content = FS.readFileSync(File_Path, 'utf-8');
      const Json_Data = JSON.parse(File_Content);

      if (!Active_Tables.has(Table_Name)) {
        DB.prepare(`
          CREATE TABLE IF NOT EXISTS "${Table_Name}" (
            Lesson_Id TEXT PRIMARY KEY,
            Subcategory_Id TEXT NOT NULL,
            Data TEXT NOT NULL
          )
        `).run();
        Active_Tables.add(Table_Name);
      }

      const Insert_Stmt = DB.prepare(`
        INSERT OR REPLACE INTO "${Table_Name}" (Lesson_Id, Subcategory_Id, Data)
        VALUES (?, ?, ?)
      `);

      Insert_Stmt.run(Lesson_Id, Subcategory_Id, JSON.stringify(Json_Data));
      Processed_Count++;
    } catch (Error: any) {
      console.error(`  [ERROR - Parse/DB Insert Failed] ${Clean_Path}: ${Error.message}`);
      Skipped_Count++;
    }
  }

  DB.close();
  console.log(`✓ Lesson DB Built (${Processed_Count} parsed, ${Skipped_Count} skipped)`);
}