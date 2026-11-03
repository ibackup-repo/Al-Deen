import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { LessonEntry } from "../Utility/Parse.js";

export function Build_Lesson_DB(dbPath: string, entries: LessonEntry[]): void {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      level TEXT NOT NULL,
      content_json TEXT NOT NULL
    );
    CREATE INDEX idx_lessons_level ON lessons(level);
  `);

  const insert = db.prepare(`
    INSERT INTO lessons (
      slug, level, content_json
    ) VALUES (?, ?, ?)
  `);

  const insertMany = db.transaction((rows: LessonEntry[]) => {
    for (const row of rows) {
      insert.run(
        row.slug || "",
        row.level || "",
        row.contentJson || "{}"
      );
    }
  });

  insertMany(entries);
  db.close();
}