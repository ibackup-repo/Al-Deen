// Stockfish.wasm UCI wrapper. Single-threaded build → no SharedArrayBuffer needed.
// Files are served from /public/Stockfish/.
// Single persistent worker + serialized request queue so we don't tear down /
// recreate the engine per call (huge perf win for analysis + opponent moves).

const ENGINE_URL = "/Stockfish/Stockfish-18-lite-single.js";

let Worker_Singleton: Worker | null = null;
let Ready_Promise: Promise<Worker> | null = null;

function Get_Worker(): Promise<Worker> {
  if (Worker_Singleton) return Promise.resolve(Worker_Singleton);
  if (Ready_Promise) return Ready_Promise;
  Ready_Promise = new Promise<Worker>((resolve, reject) => {
    try {
      const w = new Worker(ENGINE_URL);
      let Is_Ready = false;
      const On_Message = (e: MessageEvent) => {
        const line = typeof e.data === "string" ? e.data : "";
        if (!Is_Ready && line === "uciok") {
          w.postMessage("isready");
        } else if (!Is_Ready && line === "readyok") {
          Is_Ready = true;
          w.removeEventListener("message", On_Message);
          Worker_Singleton = w;
          // eslint-disable-next-line no-console
          console.info("[sf] ready");
          resolve(w);
        }
      };
      w.addEventListener("message", On_Message);
      w.addEventListener("error", (e) => reject(e));
      w.postMessage("uci");
    } catch (e) {
      reject(e);
    }
  });
  return Ready_Promise;
}

export interface SF_Eval {
  /** centipawn score from side-to-move POV (mate scores clamped to ±100000) */
  Score_CP: number;
  Best_Move: string | null; // long algebraic, e.g. "e2e4"
}

export interface SF_Options {
  /** Search depth (used when no movetime). */
  depth?: number;
  /** Hard time cap in ms (Overrides depth-only search if set). */
  Movetime_MS?: number;
  /** 0..20 — lower = weaker. Mutually exclusive with Uci_Elo. */
  skill?: number;
  /** Use UCI_LimitStrength + UCI_Elo. Stockfish range ≈ 1320–3190. */
  Uci_Elo?: number;
}

// Serialize calls so concurrent requests don't garble UCI state.
let chain: Promise<unknown> = Promise.resolve();

async function Run_Uci(fen: string, opts: SF_Options): Promise<SF_Eval> {
  const w = await Get_Worker();
  return new Promise<SF_Eval>((resolve) => {
    let Last_Cp = 0;
    const On_Message = (e: MessageEvent) => {
      const line = typeof e.data === "string" ? e.data : "";
      if (line.startsWith("info ")) {
        const mCp = line.match(/score cp (-?\d+)/);
        const mMate = line.match(/score mate (-?\d+)/);
        if (mMate) {
          const n = parseInt(mMate[1], 10);
          Last_Cp = n > 0 ? 100000 - n : -100000 - n;
        } else if (mCp) {
          Last_Cp = parseInt(mCp[1], 10);
        }
      } else if (line.startsWith("bestmove")) {
        const parts = line.split(/\s+/);
        const best = parts[1] && parts[1] !== "(none)" ? parts[1] : null;
        w.removeEventListener("message", On_Message);
        resolve({ Score_CP: Last_Cp, Best_Move: best });
      }
    };
    w.addEventListener("message", On_Message);
    // Apply strength options.
    if (typeof opts.Uci_Elo === "number") {
      w.postMessage("setoption name UCI_LimitStrength value true");
      const Elo = Math.max(1320, Math.min(3190, Math.round(opts.Uci_Elo)));
      w.postMessage(`setoption name UCI_Elo value ${Elo}`);
    } else {
      w.postMessage("setoption name UCI_LimitStrength value false");
    }
    if (typeof opts.skill === "number") {
      const sk = Math.max(0, Math.min(20, Math.round(opts.skill)));
      w.postMessage(`setoption name Skill Level value ${sk}`);
    } else {
      w.postMessage("setoption name Skill Level value 20");
    }
    w.postMessage(`position fen ${fen}`);
    if (opts.Movetime_MS && opts.Movetime_MS > 0) {
      w.postMessage(`go movetime ${Math.round(opts.Movetime_MS)}`);
    } else {
      const d = Math.max(1, Math.min(22, opts.depth ?? 12));
      w.postMessage(`go depth ${d}`);
    }
  });
}

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  // Keep chain rejection-safe.
  chain = next.catch(() => undefined);
  return next;
}

/** Evaluate a position with full strength. */
export function SF_Evaluate(fen: string, depth = 12): Promise<SF_Eval> {
  return enqueue(() => Run_Uci(fen, { depth }));
}

/** Evaluate / pick a move with strength controls. */
export function SF_Best_Move(fen: string, opts: SF_Options = {}): Promise<SF_Eval> {
  return enqueue(() => Run_Uci(fen, opts));
}

export interface SF_Line {
  /** centipawn score from side-to-move POV (mate scores clamped to ±100000) */
  Score_CP: number;
  /** principal variation, long algebraic (e.g. ["e2e4", "e7e5", ...]) */
  pv: string[];
}

export interface SF_Line_Options {
  depth?: number;
  Movetime_MS?: number;
  /** number of candidate lines (MultiPV). Default 3. */
  lines?: number;
}

async function Run_Multi_PV(fen: string, opts: SF_Line_Options): Promise<SF_Line[]> {
  const w = await Get_Worker();
  const Num_Lines = Math.max(1, Math.min(8, opts.lines ?? 3));
  return new Promise<SF_Line[]>((resolve) => {
    const PV_Map = new Map<number, SF_Line>();
    const On_Message = (e: MessageEvent) => {
      const line = typeof e.data === "string" ? e.data : "";
      if (line.startsWith("info ")) {
        const mMultipv = line.match(/multipv (\d+)/);
        const Index = mMultipv ? parseInt(mMultipv[1], 10) : 1;
        const mMate = line.match(/score mate (-?\d+)/);
        const mCp = line.match(/score cp (-?\d+)/);
        const mPv = line.match(/ pv (.+)$/);
        if (!mPv) return; // ignore info lines without a pv (e.g. currmove updates)
        let Score_CP = 0;
        if (mMate) {
          const n = parseInt(mMate[1], 10);
          Score_CP = n > 0 ? 100000 - n : -100000 - n;
        } else if (mCp) {
          Score_CP = parseInt(mCp[1], 10);
        }
        PV_Map.set(Index, { Score_CP, pv: mPv[1].trim().split(/\s+/) });
      } else if (line.startsWith("bestmove")) {
        w.removeEventListener("message", On_Message);
        // Reset MultiPV so subsequent single-line calls (SF_Best_Move/SF_Evaluate)
        // aren't affected by this search's setting.
        w.postMessage("setoption name MultiPV value 1");
        const result = Array.from(PV_Map.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([, v]) => v);
        resolve(result);
      }
    };
    w.addEventListener("message", On_Message);
    w.postMessage(`setoption name MultiPV value ${Num_Lines}`);
    w.postMessage("setoption name UCI_LimitStrength value false");
    w.postMessage("setoption name Skill Level value 20");
    w.postMessage(`position fen ${fen}`);
    if (opts.Movetime_MS && opts.Movetime_MS > 0) {
      w.postMessage(`go movetime ${Math.round(opts.Movetime_MS)}`);
    } else {
      const d = Math.max(1, Math.min(22, opts.depth ?? 14));
      w.postMessage(`go depth ${d}`);
    }
  });
}

/** Top N candidate lines (principal variations) from a position, via Stockfish MultiPV. */
export function SF_Best_Line(fen: string, opts: SF_Line_Options = {}): Promise<SF_Line[]> {
  return enqueue(() => Run_Multi_PV(fen, opts));
}

/** Stop and discard the engine (frees memory). */
export function SF_Terminate() {
  if (Worker_Singleton) {
    try { Worker_Singleton.postMessage("quit"); } catch { /* */ }
    try { Worker_Singleton.terminate(); } catch { /* */ }
    Worker_Singleton = null;
    Ready_Promise = null;
    chain = Promise.resolve();
  }
}

// Expose tiny ping for manual verification in the browser console.
if (typeof window !== "undefined") {
  (window as unknown as { __sfPing?: () => Promise<SF_Eval> }).__sfPing =
    () => SF_Evaluate("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", 6);
}