// Chess engine: alpha-beta + iterative deepening + transposition table + quiescence
// + killer/history heuristics. Tuned for ELO range 100..2000 in Pick_Engine_Move.
import { Chess } from "chess.js";

const VAL: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

// Piece-square tables (white POV, Ranks 8→1).
const PST = {
  p: [
     0, 0, 0, 0, 0, 0, 0, 0,
    50,50,50,50,50,50,50,50,
    10,10,20,30,30,20,10,10,
     5, 5,10,25,25,10, 5, 5,
     0, 0, 0,20,20, 0, 0, 0,
     5,-5,-10, 0, 0,-10,-5, 5,
     5,10,10,-20,-20,10,10, 5,
     0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
   -50,-40,-30,-30,-30,-30,-40,-50,
   -40,-20,  0,  0,  0,  0,-20,-40,
   -30,  0, 10, 15, 15, 10,  0,-30,
   -30,  5, 15, 20, 20, 15,  5,-30,
   -30,  0, 15, 20, 20, 15,  0,-30,
   -30,  5, 10, 15, 15, 10,  5,-30,
   -40,-20,  0,  5,  5,  0,-20,-40,
   -50,-40,-30,-30,-30,-30,-40,-50,
  ],
  b: [
   -20,-10,-10,-10,-10,-10,-10,-20,
   -10,  0,  0,  0,  0,  0,  0,-10,
   -10,  0,  5, 10, 10,  5,  0,-10,
   -10,  5,  5, 10, 10,  5,  5,-10,
   -10,  0, 10, 10, 10, 10,  0,-10,
   -10, 10, 10, 10, 10, 10, 10,-10,
   -10,  5,  0,  0,  0,  0,  5,-10,
   -20,-10,-10,-10,-10,-10,-10,-20,
  ],
  r: [
     0, 0, 0, 0, 0, 0, 0, 0,
     5,10,10,10,10,10,10, 5,
    -5, 0, 0, 0, 0, 0, 0,-5,
    -5, 0, 0, 0, 0, 0, 0,-5,
    -5, 0, 0, 0, 0, 0, 0,-5,
    -5, 0, 0, 0, 0, 0, 0,-5,
    -5, 0, 0, 0, 0, 0, 0,-5,
     0, 0, 0, 5, 5, 0, 0, 0,
  ],
  q: [
   -20,-10,-10,-5,-5,-10,-10,-20,
   -10,  0,  0, 0, 0,  0,  0,-10,
   -10,  0,  5, 5, 5,  5,  0,-10,
    -5,  0,  5, 5, 5,  5,  0, -5,
     0,  0,  5, 5, 5,  5,  0, -5,
   -10,  5,  5, 5, 5,  5,  0,-10,
   -10,  0,  5, 0, 0,  0,  0,-10,
   -20,-10,-10,-5,-5,-10,-10,-20,
  ],
  k: [
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -30,-40,-40,-50,-50,-40,-40,-30,
   -20,-30,-30,-40,-40,-30,-30,-20,
   -10,-20,-20,-20,-20,-20,-20,-10,
    20, 20,  0,  0,  0,  0, 20, 20,
    20, 30, 10,  0,  0, 10, 30, 20,
  ],
  // Endgame king PST favours central king.
  kEnd: [
   -50,-40,-30,-20,-20,-30,-40,-50,
   -30,-20,-10,  0,  0,-10,-20,-30,
   -30,-10, 20, 30, 30, 20,-10,-30,
   -30,-10, 30, 40, 40, 30,-10,-30,
   -30,-10, 30, 40, 40, 30,-10,-30,
   -30,-10, 20, 30, 30, 20,-10,-30,
   -30,-30,  0,  0,  0,  0,-30,-30,
   -50,-30,-30,-30,-30,-30,-30,-50,
  ],
} as const;

/** Static evaluation in centipawns from White's POV. */
export function evaluate(game: Chess): number {
  if (game.isCheckmate()) return game.turn() === "w" ? -99999 : 99999;
  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) return 0;
  let s = 0;
  let Total_Material = 0;
  const board = game.board();
  let W_Bishops = 0, B_Bishops = 0;
  const W_Pawn_Files: number[] = [], B_Pawn_Files: number[] = [];

  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = board[r][f];
      if (!p) continue;
      const v = VAL[p.type] || 0;
      Total_Material += v;
      if (p.type === "b") { if (p.color === "w") W_Bishops++; else B_Bishops++; }
      if (p.type === "p") { (p.color === "w" ? W_Pawn_Files : B_Pawn_Files).push(f); }
    }
  }
  const endgame = Total_Material < 2400; // light endgame heuristic
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = board[r][f];
      if (!p) continue;
      const v = VAL[p.type] || 0;
      const Table_Src = (p.type === "k" && endgame) ? (PST as any).kEnd : (PST as any)[p.type];
      const Index = p.color === "w" ? r * 8 + f : (7 - r) * 8 + f;
      const pst = Table_Src ? Table_Src[Index] : 0;
      const tot = v + pst;
      s += p.color === "w" ? tot : -tot;
    }
  }

  // Bishop pair bonus
  if (W_Bishops >= 2) s += 35;
  if (B_Bishops >= 2) s -= 35;

  // Doubled pawns penalty
  const dup = (files: number[]) => {
    const seen: Record<number, number> = {};
    for (const f of files) seen[f] = (seen[f] || 0) + 1;
    let pen = 0;
    for (const k in seen) if (seen[k] > 1) pen += (seen[k] - 1) * 18;
    return pen;
  };
  s -= dup(W_Pawn_Files);
  s += dup(B_Pawn_Files);

  // Light mobility heuristic — count current side moves and estimate opponent.
  const turn = game.turn();
  const My_Moves = (game.moves() as string[]).length;
  s += (turn === "w" ? 1 : -1) * My_Moves * 3;

  return s;
}

export interface Engine_Move { from: string; to: string; promotion?: string; san?: string }

// ── Transposition table ────────────────────────────────────────
type TT_Entry = { depth: number; score: number; flag: 0 | 1 | 2; best?: string };
const TT = new Map<string, TT_Entry>();
const TT_LIMIT = 50_000;
function TT_Key(g: Chess): string {
  const f = g.fen().split(" ");
  return `${f[0]} ${f[1]} ${f[2]} ${f[3]}`;
}
function TT_Store(key: string, e: TT_Entry) {
  if (TT.size > TT_LIMIT) TT.clear();
  TT.set(key, e);
}

// Killer moves and history heuristic
const Killers: string[][] = Array.from({ length: 32 }, () => []);
const history: Record<string, number> = {};
function Move_Key(m: any): string { return `${m.from}${m.to}${m.promotion || ""}`; }

function Order_Moves(moves: any[], ply: number, ttBest?: string): any[] {
  return moves.slice().sort((a, b) => score(b) - score(a));
  function score(m: any) {
    const k = Move_Key(m);
    if (ttBest && k === ttBest) return 100000;
    if (m.Captured) return 10000 + (VAL[m.Captured] || 0) * 10 - (VAL[m.piece] || 0);
    if (m.promotion) return 9000 + (VAL[m.promotion] || 0);
    if (Killers[ply]?.includes(k)) return 8000;
    return history[k] || 0;
  }
}

function Quiesce(game: Chess, alpha: number, beta: number, sign: number, depth: number): number {
  const Stand_Pat = sign * evaluate(game);
  if (Stand_Pat >= beta) return beta;
  if (Stand_Pat > alpha) alpha = Stand_Pat;
  if (depth <= 0) return alpha;
  const moves = (game.moves({ verbose: true }) as any[]).filter(m => m.Captured || m.promotion);
  for (const m of Order_Moves(moves, 0)) {
    game.move(m);
    const score = -Quiesce(game, -beta, -alpha, -sign, depth - 1);
    game.undo();
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

function Is_Endgame(game: Chess): boolean {
  let mat = 0;
  const b = game.board();
  for (const row of b) for (const p of row) if (p) mat += VAL[p.type] || 0;
  return mat < 2600;
}

function Negamax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  sign: number,
  ply: number,
  allowNull = true,
): number {
  const Alpha_Orig = alpha;
  const key = TT_Key(game);
  const tte = TT.get(key);
  if (tte && tte.depth >= depth) {
    if (tte.flag === 0) return tte.score;
    if (tte.flag === 1 && tte.score > alpha) alpha = tte.score;
    else if (tte.flag === 2 && tte.score < beta) beta = tte.score;
    if (alpha >= beta) return tte.score;
  }
  if (game.isGameOver()) return sign * evaluate(game);
  if (depth <= 0) return Quiesce(game, alpha, beta, sign, 4);

  const inCheck = game.inCheck();

  // Null-move pruning.
  if (allowNull && !inCheck && depth >= 3 && !Is_Endgame(game)) {
    try {
      const parts = game.fen().split(" ");
      parts[1] = parts[1] === "w" ? "b" : "w";
      parts[3] = "-";
      const Null_Game = new Chess(parts.join(" "));
      const R = depth > 6 ? 3 : 2;
      const v = -Negamax(Null_Game, depth - 1 - R, -beta, -beta + 1, -sign, ply + 1, false);
      if (v >= beta) return beta;
    } catch { /* skip */ }
  }

  const moves = game.moves({ verbose: true }) as any[];
  if (!moves.length) return sign * evaluate(game);

  let best = -Infinity;
  let Best_Move_Key: string | undefined;
  let Move_Index = 0;
  for (const m of Order_Moves(moves, ply, tte?.best)) {
    const Is_Quiet = !m.Captured && !m.promotion;
    game.move(m);
    let v: number;
    let reduction = 0;
    if (depth >= 3 && Move_Index >= 3 && Is_Quiet && !inCheck) reduction = 1;
    if (Move_Index === 0) {
      v = -Negamax(game, depth - 1, -beta, -alpha, -sign, ply + 1, true);
    } else {
      v = -Negamax(game, depth - 1 - reduction, -alpha - 1, -alpha, -sign, ply + 1, true);
      if (v > alpha && reduction > 0) {
        v = -Negamax(game, depth - 1, -alpha - 1, -alpha, -sign, ply + 1, true);
      }
      if (v > alpha && v < beta) {
        v = -Negamax(game, depth - 1, -beta, -alpha, -sign, ply + 1, true);
      }
    }
    game.undo();
    if (v > best) { best = v; Best_Move_Key = Move_Key(m); }
    if (best > alpha) alpha = best;
    if (alpha >= beta) {
      if (Is_Quiet) {
        const kk = Killers[ply] || (Killers[ply] = []);
        if (!kk.includes(Best_Move_Key!)) { kk.unshift(Best_Move_Key!); if (kk.length > 2) kk.pop(); }
        history[Best_Move_Key!] = (history[Best_Move_Key!] || 0) + depth * depth;
      }
      break;
    }
    Move_Index++;
  }
  const flag: 0 | 1 | 2 = best <= Alpha_Orig ? 2 : (best >= beta ? 1 : 0);
  TT_Store(key, { depth, score: best, flag, best: Best_Move_Key });
  return best;
}

/** Best move via iterative deepening. */
export function Find_Best_Move(game: Chess, depth = 3): { move: Engine_Move | null; score: number } {
  const turn = game.turn();
  const root = game.moves({ verbose: true }) as any[];
  if (!root.length) return { move: null, score: evaluate(game) };

  let Best_Move: Engine_Move | null = null;
  let Best_Score = -Infinity;
  let ordered = root.slice();
  for (let d = 1; d <= Math.max(1, depth); d++) {
    let Current_Best: Engine_Move | null = null;
    let Current_Score = -Infinity;
    const scored: { m: any; s: number }[] = [];
    for (const m of ordered) {
      game.move(m);
      const s = -Negamax(game, d - 1, -Infinity, Infinity, turn === "w" ? -1 : 1, 1);
      game.undo();
      scored.push({ m, s });
      if (s > Current_Score) {
        Current_Score = s;
        Current_Best = { from: m.from, to: m.to, promotion: m.promotion, san: m.san };
      }
    }
    scored.sort((a, b) => b.s - a.s);
    ordered = scored.map(x => x.m);
    Best_Move = Current_Best;
    Best_Score = Current_Score;
  }
  const White_POV = turn === "w" ? Best_Score : -Best_Score;
  return { move: Best_Move, score: White_POV };
}

/** Principal variation: best move sequence up to `Plies` deep. */
export function Get_Best_Line(game: Chess, Plies = 4, Search_Depth = 3): Engine_Move[] {
  const line: Engine_Move[] = [];
  const g = new Chess(game.fen());
  for (let i = 0; i < Plies; i++) {
    if (g.Is_Game_Over()) break;
    const { move } = Find_Best_Move(g, Search_Depth);
    if (!move) break;
    try { g.move({ from: move.from, to: move.to, promotion: move.promotion ?? "q" }); }
    catch { break; }
    line.push(move);
  }
  return line;
}

/** Opponent's best reply if they were to move now (threat arrow). */
export function Find_Threat(game: Chess): Engine_Move | null {
  try {
    const parts = game.fen().split(" ");
    parts[1] = parts[1] === "w" ? "b" : "w";
    parts[3] = "-";
    const g2 = new Chess(parts.join(" "));
    return Find_Best_Move(g2, 2).move;
  } catch { return null; }
}

export function Pick_Engine_Move(game: Chess, Elo: number): Engine_Move | null {
  const moves = game.moves({ verbose: true }) as any[];
  if (!moves.length) return null;

  const cfg = (() => {
    if (Elo <= 100)  return { depth: 1, blunder: 0.80, topN: 1 };
    if (Elo <= 200)  return { depth: 1, blunder: 0.55, topN: 2 };
    if (Elo <= 300)  return { depth: 2, blunder: 0.35, topN: 3 };
    if (Elo <= 400)  return { depth: 2, blunder: 0.22, topN: 3 };
    if (Elo <= 500)  return { depth: 3, blunder: 0.12, topN: 2 };
    if (Elo <= 600)  return { depth: 3, blunder: 0.08, topN: 2 };
    if (Elo <= 800)  return { depth: 4, blunder: 0.04, topN: 2 };
    if (Elo <= 1000) return { depth: 4, blunder: 0.0,  topN: 2 };
    if (Elo <= 1200) return { depth: 5, blunder: 0.0,  topN: 2 };
    if (Elo <= 1400) return { depth: 5, blunder: 0.0,  topN: 1 };
    if (Elo <= 1600) return { depth: 6, blunder: 0.0,  topN: 1 };
    if (Elo <= 1800) return { depth: 6, blunder: 0.0,  topN: 1 };
    return { depth: 7, blunder: 0.0, topN: 1 };
  })();

  if (cfg.blunder > 0 && Math.random() < cfg.blunder) {
    const m = moves[Math.floor(Math.random() * moves.length)];
    return { from: m.from, to: m.to, promotion: m.promotion };
  }

  const turn = game.turn();
  let ordered = moves.slice();
  let final: { m: any; s: number }[] = [];
  for (let d = 1; d <= cfg.depth; d++) {
    const scored: { m: any; s: number }[] = [];
    for (const m of ordered) {
      game.move(m);
      const s = -Negamax(game, d - 1, -Infinity, Infinity, turn === "w" ? -1 : 1, 1);
      game.undo();
      scored.push({ m, s });
    }
    scored.sort((a, b) => b.s - a.s);
    ordered = scored.map(x => x.m);
    final = scored;
  }
  const pool = final.slice(0, Math.max(1, cfg.topN));
  const pick = pool[Math.floor(Math.random() * pool.length)].m;
  return { from: pick.from, to: pick.to, promotion: pick.promotion };
}
