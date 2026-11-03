export type Piece_Type = "K" | "Q" | "R" | "B" | "N" | "P";
export type Piece_Color = "w" | "b";

export interface Placed_Piece {
  square: string;
  color: Piece_Color;
  type: Piece_Type;
  id?: string;
  themed?: boolean;
  hidden?: boolean;
}

export interface Arrow {
  from: string;
  to: string;
  color?: string;
}

export interface International_Text {
  Dutch: string;
  English: string;
  Arabic: string;
  Pashto?: string;
}

export interface Chess_Lesson {
  id: string;
  name: International_Text;
  steps: any[];
}

export interface Chess_Group {
  id: string;
  name: International_Text;
  lessons: Chess_Lesson[];
}

export interface Chess_Level {
  id: string;
  name: International_Text;
  groups: Chess_Group[];
}

export interface Chess_Corpus_Response {
  levels: Chess_Level[];
  puzzles: string[];
}

export interface Puzzle_Payload {
  FEN: string;
  moves: string[];
  [key: string]: any;
}