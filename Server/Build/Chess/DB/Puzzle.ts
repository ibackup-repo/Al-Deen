import FS from 'fs';
import Path from 'path';
import Database from 'better-sqlite3';
import { Puzzle_Data_Directory, Puzzle_DB_Path, Is_Force_Build } from '../Config.ts';

export function Build_Puzzle_DB(): void {
  console.log("🔍 Processing Chess Puzzles...");

  if (!FS.existsSync(Puzzle_Data_Directory)) {
    console.warn(`[WARN] Puzzle directory missing: ${Puzzle_Data_Directory}`);
    return;
  }

  if (Is_Force_Build && FS.existsSync(Puzzle_DB_Path)) {
    console.log("  [FORCE] Removing existing Puzzle DB...");
    FS.unlinkSync(Puzzle_DB_Path);
  }

  const DB = new Database(Puzzle_DB_Path);
  DB.pragma('journal_mode = WAL');

  DB.prepare(`
    CREATE TABLE IF NOT EXISTS Puzzles (
      FEN TEXT PRIMARY KEY,
      Data TEXT NOT NULL
    )
  `).run();

  const Insert_Stmt = DB.prepare(`
    INSERT OR REPLACE INTO Puzzles (FEN, Data) VALUES (?, ?)
  `);

  const Puzzle_Files = FS.readdirSync(Puzzle_Data_Directory).filter(F => F.endsWith('.json'));
  let Processed_Count = 0;

  const Insert_Transaction = DB.transaction((Files: string[]) => {
    for (const File_Name of Files) {
      const File_Path = Path.join(Puzzle_Data_Directory, File_Name);
      try {
        const FEN_Key = Path.basename(File_Name, '.json');
        const Content = FS.readFileSync(File_Path, 'utf-8');
        const Json_Data = JSON.parse(Content);

        Insert_Stmt.run(FEN_Key, JSON.stringify(Json_Data));
        Processed_Count++;
      } catch (Error: any) {
        console.error(`  [ERROR - Parse/DB Insert Failed] ${File_Path}: ${Error.message}`);
      }
    }
  });

  Insert_Transaction(Puzzle_Files);
  DB.close();

  console.log(`✓ Puzzle DB Built (${Processed_Count} parsed)`);
}