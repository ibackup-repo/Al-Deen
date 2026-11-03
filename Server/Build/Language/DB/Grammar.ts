import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { GrammarEntry } from "../Utility/Parse.js";

export function Build_Grammar_DB(dbPath: string, entries: GrammarEntry[]): void {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE grammar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT NOT NULL,
      term TEXT NOT NULL,
      rule_explanation TEXT,
      example_usage TEXT
    );
    CREATE INDEX idx_grammar_category ON grammar(category);
    CREATE INDEX idx_grammar_subcategory ON grammar(subcategory);
  `);

  const insert = db.prepare(`
    INSERT INTO grammar (
      slug, category, subcategory, term, rule_explanation, example_usage
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((rows: GrammarEntry[]) => {
    for (const row of rows) {
      insert.run(
        row.slug || "",
        row.category || "",
        row.subcategory || "",
        row.term || "",
        row.ruleExplanation || null,
        row.exampleUsage || null
      );
    }
  });

  insertMany(entries);
  db.close();
}