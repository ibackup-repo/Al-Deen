import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { VocabularyEntry } from "../Utility/Parse.js";

export function Build_Vocabulary_DB(dbPath: string, entries: VocabularyEntry[]): void {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE vocabulary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      plural_or_notes TEXT,
      diminutive_or_alt TEXT,
      example_sentence TEXT
    );
    CREATE INDEX idx_vocab_category ON vocabulary(category);
    CREATE INDEX idx_vocab_subcategory ON vocabulary(subcategory);
  `);

  const insert = db.prepare(`
    INSERT INTO vocabulary (
      slug, category, subcategory, title, description, plural_or_notes, diminutive_or_alt, example_sentence
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((rows: VocabularyEntry[]) => {
    for (const row of rows) {
      insert.run(
        row.slug || "",
        row.category || "",
        row.subcategory || "",
        row.title || "",
        row.description || null,
        row.pluralOrNotes || null,
        row.diminutiveOrAlt || null,
        row.exampleSentence || null
      );
    }
  });

  insertMany(entries);
  db.close();
}