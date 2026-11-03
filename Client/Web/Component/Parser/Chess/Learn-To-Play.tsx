// @Web/Component/Parser/Chess/Learn-To-Play.tsx

export type Piece_Color = "w" | "b";
export type Piece_Type = "P" | "N" | "B" | "R" | "Q" | "K";

export interface Placed_Piece {
  id?: string;
  square: string;
  type: Piece_Type;
  color: Piece_Color;
  themed?: boolean;
  hidden?: boolean;
}

export interface Arrow {
  from: string;
  to: string;
  color?: string;
}

export interface Parsed_Lesson_Step {
  piece: Placed_Piece;
  Extras: Placed_Piece[];
  Stars: string[];
  intro: string;
  orientation: "white" | "black";
  Random_Stars?: number;
  done?: string;
  Intro_Arrows: Arrow[];
}

/**
 * Parses algebraic notation like "Ke1", "Ra1", or "e4" into a Placed_Piece object.
 */
export function Parse_Piece_Spec(spec: string, color: Piece_Color = "w"): Placed_Piece {
  const clean = String(spec).trim();
  const match = clean.match(/^([KQRBNkqrbn])?([a-h][1-8])$/i);

  if (!match) {
    console.warn(`[Lesson Parser] Invalid piece notation: "${spec}". Defaulting to Pawn on e4.`);
    return { square: "e4", type: "P", color };
  }

  const type = (match[1] ? match[1].toUpperCase() : "P") as Piece_Type;
  const square = match[2].toLowerCase();

  return { square, type, color };
}

/**
 * Normalizes array or comma-separated star notations into valid square lists.
 */
export function Parse_Stars(Stars_Arr: any): string[] {
  if (!Stars_Arr) return [];
  const Raw_List = Array.isArray(Stars_Arr) ? Stars_Arr.flat(Infinity) : [Stars_Arr];

  return Raw_List
    .flatMap((s) => String(s).split(","))
    .map((s) => s.trim().toLowerCase())
    .filter((s) => /^[a-h][1-8]$/.test(s));
}

/**
 * Calculates movement arrows showing the directions a piece can move along the board axes/diagonals.
 */
export function Generate_Movement_Arrows(pieceType: Piece_Type, From_Square: string): Arrow[] {
  if (!From_Square || From_Square.length !== 2) return [];

  const file = From_Square[0];
  const rank = parseInt(From_Square[1], 10);
  const File_Index = file.charCodeAt(0) - 97; // 0 (a) to 7 (h)
  const Rank_Index = rank - 1;                // 0 (1) to 7 (8)

  const arrows: Arrow[] = [];
  const color = "hsl(var(--primary))";

  switch (pieceType) {
    case "R": {
      // Rook: 4 straight directions (top, bottom, right, left)
      if (Rank_Index < 7) arrows.push({ from: From_Square, to: `${file}8`, color });
      if (Rank_Index > 0) arrows.push({ from: From_Square, to: `${file}1`, color });
      if (File_Index < 7) arrows.push({ from: From_Square, to: `h${rank}`, color });
      if (File_Index > 0) arrows.push({ from: From_Square, to: `a${rank}`, color });
      break;
    }

    case "B": {
      // Bishop: 4 diagonal directions
      const tr = Math.min(7 - File_Index, 7 - Rank_Index); // top-right
      const tl = Math.min(File_Index, 7 - Rank_Index);     // top-left
      const br = Math.min(7 - File_Index, Rank_Index);     // bottom-right
      const bl = Math.min(File_Index, Rank_Index);         // bottom-left

      if (tr > 0) arrows.push({ from: From_Square, to: `${String.fromCharCode(97 + File_Index + tr)}${rank + tr}`, color });
      if (tl > 0) arrows.push({ from: From_Square, to: `${String.fromCharCode(97 + File_Index - tl)}${rank + tl}`, color });
      if (br > 0) arrows.push({ from: From_Square, to: `${String.fromCharCode(97 + File_Index + br)}${rank - br}`, color });
      if (bl > 0) arrows.push({ from: From_Square, to: `${String.fromCharCode(97 + File_Index - bl)}${rank - bl}`, color });
      break;
    }

    case "Q": {
      // Queen: Combination of Rook and Bishop arrows
      return [
        ...Generate_Movement_Arrows("R", From_Square),
        ...Generate_Movement_Arrows("B", From_Square),
      ];
    }

    case "K": {
      // King: 1-step outward arrows in surrounding squares
      const offsets = [
        [0, 1], [0, -1], [1, 0], [-1, 0],
        [1, 1], [1, -1], [-1, 1], [-1, -1]
      ];
      for (const [df, dr] of offsets) {
        const nf = File_Index + df;
        const nr = Rank_Index + dr;
        if (nf >= 0 && nf <= 7 && nr >= 0 && nr <= 7) {
          arrows.push({
            from: From_Square,
            to: `${String.fromCharCode(97 + nf)}${nr + 1}`,
            color,
          });
        }
      }
      break;
    }

    default:
      break;
  }

  return arrows;
}

/**
 * Core Parser: Transforms raw step inputs into a strongly-typed Parsed_Lesson_Step.
 */
export function Parse_Lesson_Step(raw: any): Parsed_Lesson_Step | null {
  if (!raw) return null;

  // 1. Object format handling
  if (!Array.isArray(raw) && typeof raw === "object" && raw.piece) {
    const piece = typeof raw.piece === "string" ? Parse_Piece_Spec(raw.piece) : raw.piece;
    const Stars = Parse_Stars(raw.Stars);
    const Custom_Arrows = raw.Intro_Arrows ?? [];

    return {
      piece,
      Extras: raw.Extras ?? [],
      Stars,
      intro: raw.intro ?? "",
      orientation: raw.orientation ?? "white",
      Random_Stars: raw.Random_Stars,
      done: raw.done,
      Intro_Arrows: Custom_Arrows.length > 0 ? Custom_Arrows : Generate_Movement_Arrows(piece.type, piece.square),
    };
  }

  // 2. Compact tuple format handling: [Piece_Spec, Stars_Arr, Intro_Key, configObj?]
  if (Array.isArray(raw)) {
    const [Piece_Spec, Stars_Arr, Intro_Key, config = {}] = raw;

    if (!Piece_Spec || !Intro_Key) {
      console.warn("[Lesson Parser] Invalid step tuple structure:", raw);
      return null;
    }

    const piece = Parse_Piece_Spec(Piece_Spec, config.color ?? "w");
    const Stars = Parse_Stars(Stars_Arr);
    const Custom_Arrows = config.Intro_Arrows ?? [];

    return {
      piece,
      Extras: config.Extras ?? [],
      Stars,
      intro: String(Intro_Key),
      orientation: config.orientation ?? "white",
      Random_Stars: config.Random_Stars,
      done: config.Done_Key ?? config.done,
      Intro_Arrows: Custom_Arrows.length > 0 ? Custom_Arrows : Generate_Movement_Arrows(piece.type, piece.square),
    };
  }

  return null;
}