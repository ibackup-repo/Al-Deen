import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAG_DB_PATH = path.resolve(__dirname, "../../Asset/Corpus/RAG.db");

export type RetrievedDoc = {
  i: string;      // Document ID
  s: string;      // Source/Collection (e.g., "Quran", "Sahih Bukhari")
  r: string;      // Reference (e.g., "2:255", "Book 1, Hadith 4")
  t: string;      // text content (English / Combined)
  score: number;  // Relevance match rank
};

let dbInstance: DatabaseSync | null = null;

function getDB(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(RAG_DB_PATH);
    dbInstance.exec("PRAGMA journal_mode = WAL;");
    dbInstance.exec("PRAGMA read_uncommitted = true;");
  }
  return dbInstance;
}

// Tokenize and clean query string for SQL LIKE matching
function prepareSearchTerms(query: string): string[] {
  const STOP = new Set([
    "a","an","the","is","are","was","were","be","been","of","to","in","on","at","by","for","with","and","or","but","if","then","else","as","that","this","these","those","it","its","i","you","he","she","we","they","do","does","did","have","has","had","not","no","so","than","too","very","can","will","would","should","could","may","might"
  ]);

  return (query || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

export async function searchRAG(query: string, k = 8): Promise<RetrievedDoc[]> {
  const db = getDB();
  const terms = prepareSearchTerms(query);
  if (terms.length === 0) return [];

  // Build dynamic SQL LIKE parameters for match ranking
  const likeConditions = terms.map(() => `embedding_input LIKE ?`).join(" OR ");
  const sqlParams = terms.map((t) => `%${t}%`);

  const quranSql = `
    SELECT 
      id as i,
      'Quran' as s,
      (surah_name_transliteration || ' [' || surah_number || ':' || ayah_number || ']') as r,
      (text_english || ' ' || COALESCE(tafsir_ibn_kathir, '')) as t,
      1.0 as score
    FROM quran_verses
    WHERE ${likeConditions}
    LIMIT ?;
  `;

  const hadithSql = `
    SELECT 
      id as i,
      collection as s,
      ('Book ' || book || ', Hadith ' || hadith_number) as r,
      text_english as t,
      0.8 as score
    FROM hadiths
    WHERE ${likeConditions}
    LIMIT ?;
  `;

  try {
    const quranStmt = db.prepare(quranSql);
    const hadithStmt = db.prepare(hadithSql);

    const quranResults = quranStmt.all(...sqlParams, k) as RetrievedDoc[];
    const hadithResults = hadithStmt.all(...sqlParams, k) as RetrievedDoc[];

    // Combine and slice Top Results
    const combined = [...quranResults, ...hadithResults];
    return combined.slice(0, k);
  } catch (err) {
    console.error("[RAG SEARCH ERROR]", err);
    return [];
  }
}