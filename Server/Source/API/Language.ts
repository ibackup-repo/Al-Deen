import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type Supported_Language = "Dutch" | "English" | "Arabic" | "Pashto";
export type International_Language = "Dutch" | "English" | "Arabic";

export interface Vocabulary_Record {
  id: number;
  slug: string;
  category: string;
  subcategory: string;
  title: string;
  description: string | null;
  plural_or_notes: string | null;
  diminutive_or_alt: string | null;
  example_sentence: string | null;
}

export interface Grammar_Record {
  id: number;
  slug: string;
  category: string;
  subcategory: string;
  term: string;
  rule_explanation: string | null;
  example_usage: string | null;
}

export interface Lesson_Record {
  id: number;
  slug: string;
  level: string;
  content_json: string;
}

/* ── Database Resolver Helper ───────────────────────────────────── */

function Open_Language_DB(lang: Supported_Language, dbName: "Vocabulary" | "Grammar" | "Lesson"): Database.Database {
  const dbPath = path.join(__dirname, `../../Asset/Corpus/Language/${lang}/${dbName}.db`);
  if (!fs.existsSync(dbPath)) {
    throw new Error(`${dbName} database for language '${lang}' not found at ${dbPath}. Run database build script first.`);
  }
  return new Database(dbPath, { readonly: true });
}

/* ── Vocabulary API ──────────────────────────────────────────────── */

export function Get_Vocabulary(
  lang: Supported_Language,
  category?: string,
  subcategory?: string
): Vocabulary_Record[] {
  const db = Open_Language_DB(lang, "Vocabulary");
  try {
    if (category && subcategory) {
      return db
        .prepare("SELECT * FROM vocabulary WHERE category = ? AND subcategory = ? ORDER BY title ASC")
        .all(category, subcategory) as Vocabulary_Record[];
    }
    if (category) {
      return db
        .prepare("SELECT * FROM vocabulary WHERE category = ? ORDER BY title ASC")
        .all(category) as Vocabulary_Record[];
    }
    return db.prepare("SELECT * FROM vocabulary ORDER BY category, subcategory, title ASC").all() as Vocabulary_Record[];
  } finally {
    db.close();
  }
}

export function Get_Vocabulary_By_Slug(lang: Supported_Language, slug: string): Vocabulary_Record | null {
  const db = Open_Language_DB(lang, "Vocabulary");
  try {
    const row = db.prepare("SELECT * FROM vocabulary WHERE slug = ?").get(slug);
    return (row as Vocabulary_Record) || null;
  } finally {
    db.close();
  }
}

/* ── Grammar API ─────────────────────────────────────────────────── */

export function Get_Grammar(
  lang: Supported_Language,
  category?: string,
  subcategory?: string
): Grammar_Record[] {
  const db = Open_Language_DB(lang, "Grammar");
  try {
    if (category && subcategory) {
      return db
        .prepare("SELECT * FROM grammar WHERE category = ? AND subcategory = ? ORDER BY term ASC")
        .all(category, subcategory) as Grammar_Record[];
    }
    if (category) {
      return db
        .prepare("SELECT * FROM grammar WHERE category = ? ORDER BY term ASC")
        .all(category) as Grammar_Record[];
    }
    return db.prepare("SELECT * FROM grammar ORDER BY category, subcategory, term ASC").all() as Grammar_Record[];
  } finally {
    db.close();
  }
}

export function Get_Grammar_By_Slug(lang: Supported_Language, slug: string): Grammar_Record | null {
  const db = Open_Language_DB(lang, "Grammar");
  try {
    const row = db.prepare("SELECT * FROM grammar WHERE slug = ?").get(slug);
    return (row as Grammar_Record) || null;
  } finally {
    db.close();
  }
}

/* ── Lessons API ─────────────────────────────────────────────────── */

export function Get_Lessons(lang: Supported_Language, level?: string): Lesson_Record[] {
  const db = Open_Language_DB(lang, "Lesson");
  try {
    if (level) {
      return db
        .prepare("SELECT * FROM lessons WHERE level = ? ORDER BY slug ASC")
        .all(level) as Lesson_Record[];
    }
    return db.prepare("SELECT * FROM lessons ORDER BY level, slug ASC").all() as Lesson_Record[];
  } finally {
    db.close();
  }
}

export function Get_Lesson_By_Slug(lang: Supported_Language, slug: string): (Lesson_Record & { content: any }) | null {
  const db = Open_Language_DB(lang, "Lesson");
  try {
    const row = db.prepare("SELECT * FROM lessons WHERE slug = ?").get(slug) as Lesson_Record | undefined;
    if (!row) return null;
    return {
      ...row,
      content: JSON.parse(row.content_json)
    };
  } finally {
    db.close();
  }
}