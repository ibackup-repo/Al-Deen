import { Chess_Corpus_Response, Chess_Level, Puzzle_Payload } from "./Chess-Types.js";
import { Fetch_With_Cache_Fallback } from "./Service-Worker-Cache-Store.js";

const Base_API_Url = "/api";

/**
 * Fetches the full chess corpus (levels and puzzle keys).
 * Endpoint: /api/chess
 */
export async function Fetch_Chess_Corpus(): Promise<Chess_Corpus_Response> {
  const Target_Url = `${Base_API_Url}/chess`;
  return await Fetch_With_Cache_Fallback(Target_Url);
}

/**
 * Fetches only the chess lesson levels.
 * Endpoint: /api/chess?levels=true
 */
export async function Fetch_Chess_Levels(): Promise<Chess_Level[]> {
  const Target_Url = `${Base_API_Url}/chess?levels=true`;
  try {
    const Data = await Fetch_With_Cache_Fallback(Target_Url);
    return Data.levels || [];
  } catch (Error: any) {
    console.error("[API Error] Could not fetch chess levels:", Error);
    return [];
  }
}

/**
 * Fetches all available puzzle FEN keys.
 * Endpoint: /api/chess?puzzles=true
 */
export async function Fetch_All_Puzzle_FENs(): Promise<string[]> {
  const Target_Url = `${Base_API_Url}/chess?puzzles=true`;
  try {
    const Data = await Fetch_With_Cache_Fallback(Target_Url);
    return Data.puzzles || [];
  } catch (Error: any) {
    console.error("[API Error] Could not fetch puzzle FEN list:", Error);
    return [];
  }
}

/**
 * Fetches specific puzzle payload by FEN query.
 * Endpoint: /api/chess?fen=<encoded_fen>
 */
export async function Fetch_Puzzle_By_FEN(FEN: string): Promise<Puzzle_Payload | null> {
  const Encoded_FEN = encodeURIComponent(FEN);
  const Target_Url = `${Base_API_Url}/chess?fen=${Encoded_FEN}`;

  try {
    return await Fetch_With_Cache_Fallback(Target_Url);
  } catch (Error: any) {
    console.error(`[API Error] Could not fetch puzzle for FEN: ${FEN}`, Error);
    return null;
  }
}