import FS from 'fs';
import Path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { type Supported_Language } from "./Language.js";

const File_Name = fileURLToPath(import.meta.url);
const Directory_Name = Path.dirname(File_Name);

// ─── Constants & Paths ───
const Corpus_Directory = Path.join(Directory_Name, '../../Asset/Corpus/Chess');
const Lesson_DB_Path = Path.join(Corpus_Directory, 'Lesson.db');
const Puzzle_DB_Path = Path.join(Corpus_Directory, 'Puzzle.db');

// ─── Types ───
export type Piece_Type  = "K" | "Q" | "R" | "B" | "N" | "P";
export type Piece_Color = "w" | "b";
export interface Placed_Piece { square: string; color: Piece_Color; type: Piece_Type; id?: string; themed?: boolean; hidden?: boolean; }
export interface Arrow { from: string; to: string; color?: string; }
export interface ChessLesson { id: string; name: Record<string, string>; steps: any[]; }
export interface ChessGroup { id: string; name: Record<string, string>; lessons: ChessLesson[]; }
export interface ChessLevel { id: string; name: Record<string, string>; groups: ChessGroup[]; }

const Files_Letters = "abcdefgh";
function File_Of(Square: string) { return Files_Letters.indexOf(Square[0]); }
function Rank_Of(Square: string) { return parseInt(Square[1], 10) - 1; }

function Format_Name_From_Id(Id: string): Record<string, string> {
  const Clean = Id.split("-").map(W => W.charAt(0).toUpperCase() + W.slice(1)).join(" ");
  return { Dutch: Clean, English: Clean, Arabic: Clean, Pashto: Clean };
}

function Sanitize_Table_Name(Name: string): string {
  return Name.replace(/[^a-zA-Z0-9_]/g, '_');
}

// ─── Helper DB Connections ───
function Get_Lesson_DB() {
  if (!FS.existsSync(Lesson_DB_Path)) {
    throw new Error(`Lesson DB file not found at path: ${Lesson_DB_Path}`);
  }
  return new Database(Lesson_DB_Path, { readonly: true });
}

function Get_Puzzle_DB() {
  if (!FS.existsSync(Puzzle_DB_Path)) {
    throw new Error(`Puzzle DB file not found at path: ${Puzzle_DB_Path}`);
  }
  return new Database(Puzzle_DB_Path, { readonly: true });
}

// ─── Logic ───
export function Is_Legal_Move(Type: Piece_Type, From: string, To: string, Would_Capture = false): boolean {
  if (From === To) return false;
  const DF = Math.abs(File_Of(To) - File_Of(From));
  const DR = Math.abs(Rank_Of(To) - Rank_Of(From));
  const RF = Rank_Of(From), RT = Rank_Of(To);

  switch (Type) {
    case "K": return DF <= 1 && DR <= 1;
    case "Q": return DF === 0 || DR === 0 || DF === DR;
    case "R": return DF === 0 || DR === 0;
    case "B": return DF === DR;
    case "N": return (DF === 1 && DR === 2) || (DF === 2 && DR === 1);
    case "P": {
      const Dir = 1;
      const Rank_Diff = RT - RF;
      if (Would_Capture) return DF === 1 && Rank_Diff === Dir;
      if (DF !== 0) return false;
      if (Rank_Diff === Dir) return true;
      if (Rank_Diff === 2 * Dir && RF === 1) return true;
      return false;
    }
    default: return false;
  }
}

// Safely read levels & groups dynamically from Lesson.db tables
export function Get_Chess_Levels(): ChessLevel[] {
  let DB: Database.Database | null = null;
  try {
    DB = Get_Lesson_DB();

    const Tables = DB.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all() as { name: string }[];

    const Output_Levels: ChessLevel[] = [];

    for (const { name: Table_Name } of Tables) {
      // Query table dynamically and handle case-insensitive column names
      const Rows = DB.prepare(`SELECT * FROM "${Table_Name}"`).all() as Record<string, any>[];
      if (!Rows || Rows.length === 0) continue;

      const Groups_Map = new Map<string, ChessLesson[]>();

      for (const Row of Rows) {
        // Case-insensitive fallback for column names
        const Lesson_Id = Row.Lesson_Id || Row.lesson_id || Row.id || "unknown";
        const Subcategory_Id = Row.Subcategory_Id || Row.subcategory_id || Row.group_id || "general";
        const Raw_Data = Row.Data || Row.data || "[]";

        if (!Groups_Map.has(Subcategory_Id)) {
          Groups_Map.set(Subcategory_Id, []);
        }

        let Step_Data: any = [];
        try {
          Step_Data = typeof Raw_Data === 'string' ? JSON.parse(Raw_Data) : Raw_Data;
        } catch (Parse_Error) {
          console.error(`[DB Error] Failed to parse JSON data for Lesson ${Lesson_Id}:`, Parse_Error);
          Step_Data = [];
        }

        Groups_Map.get(Subcategory_Id)!.push({
          id: Lesson_Id,
          name: Format_Name_From_Id(Lesson_Id),
          steps: Array.isArray(Step_Data) ? Step_Data : [Step_Data]
        });
      }

      const Groups: ChessGroup[] = Array.from(Groups_Map.entries()).map(([Subcategory_Id, Lessons]) => ({
        id: Subcategory_Id,
        name: Format_Name_From_Id(Subcategory_Id),
        lessons: Lessons
      }));

      Output_Levels.push({
        id: Table_Name,
        name: Format_Name_From_Id(Table_Name),
        groups: Groups
      });
    }

    return Output_Levels;
  } finally {
    if (DB) DB.close();
  }
}

export function Get_Chess_Level(Id: string): ChessLevel | null {
  const Target_Table = Sanitize_Table_Name(Id.toLowerCase());
  const Levels = Get_Chess_Levels();
  return Levels.find(L => L.id === Target_Table) ?? null;
}

export function Get_All_Puzzles(): string[] {
  let DB: Database.Database | null = null;
  try {
    DB = Get_Puzzle_DB();
    const Rows = DB.prepare(`SELECT FEN FROM Puzzles`).all() as { FEN: string }[];
    return Rows.map(R => R.FEN);
  } finally {
    if (DB) DB.close();
  }
}

export function Get_Puzzle_By_FEN(FEN: string): any | null {
  let DB: Database.Database | null = null;
  try {
    DB = Get_Puzzle_DB();
    const Row = DB.prepare(`SELECT Data FROM Puzzles WHERE FEN = ?`).get(FEN) as { Data: string } | undefined;
    if (!Row) return null;
    return typeof Row.Data === 'string' ? JSON.parse(Row.Data) : Row.Data;
  } finally {
    if (DB) DB.close();
  }
}