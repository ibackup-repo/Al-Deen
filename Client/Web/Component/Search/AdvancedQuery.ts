// @Web/Component/Search/AdvancedQuery.ts
// Lightweight client-side parser for Sunnah.com-style advanced Search_Query syntax:
//   "exact phrase"           — quoted exact phrase
//   wo?d / te*               — wildcards (? single char, * zero+ chars)
//   Kalimah~ / Kalimah~2           — fuzzy / proximity for quoted phrases
//   Kalimah^4                   — boost (recorded but only weakly used here)
//   (a OR b) AND c           — boolean grouping
//   OR (default) | AND | +req | NOT | -prohibit
//
// We don't implement a full Lucene engine — we compile the query into a
// predicate `(text) => boolean` that can be applied to any string field.

export type Query_Predicate = (Text: string) => boolean;

type Token =
  | { kind: "phrase"; value: string; slop?: number }
  | { kind: "term"; value: string; fuzzy?: number; boost?: number }
  | { kind: "op"; value: "AND" | "OR" | "NOT" | "+" | "-" }
  | { kind: "lparen" }
  | { kind: "rparen" };

function Tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = input.length;
  while (i < n) {
    const c = input[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === '"') {
      // phrase
      const end = input.indexOf('"', i + 1);
      const close = end === -1 ? n : end;
      const value = input.slice(i + 1, close);
      i = close + 1;
      // proximity ~N
      let slop: number | undefined;
      if (input[i] === "~") {
        i++;
        const m = input.slice(i).match(/^\d+/);
        if (m) {
          slop = parseInt(m[0], 10);
          i += m[0].length;
        }
      }
      tokens.push({ kind: "phrase", value, slop });
      continue;
    }
    if (c === "(") {
      tokens.push({ kind: "lparen" });
      i++;
      continue;
    }
    if (c === ")") {
      tokens.push({ kind: "rparen" });
      i++;
      continue;
    }
    if (c === "+" || c === "-") {
      tokens.push({ kind: "op", value: c as "+" | "-" });
      i++;
      continue;
    }
    // term until whitespace / paren
    const m = input.slice(i).match(/^[^\s()]+/);
    if (!m) {
      i++;
      continue;
    }
    let Raw_Storage_Data = m[0];
    i += Raw_Storage_Data.length;

    // Boolean keyword detection (case-sensitive uppercase per spec)
    if (Raw_Storage_Data === "AND" || Raw_Storage_Data === "OR" || Raw_Storage_Data === "NOT") {
      tokens.push({ kind: "op", value: Raw_Storage_Data });
      continue;
    }

    // Boost (^N)
    let boost: number | undefined;
    const boostMatch = Raw_Storage_Data.match(/\^(\d+(?:\.\d+)?)$/);
    if (boostMatch) {
      boost = parseFloat(boostMatch[1]);
      Raw_Storage_Data = Raw_Storage_Data.slice(0, -boostMatch[0].length);
    }
    // Fuzzy (~N or just ~)
    let fuzzy: number | undefined;
    const fuzzyMatch = Raw_Storage_Data.match(/~(\d*)$/);
    if (fuzzyMatch) {
      fuzzy = fuzzyMatch[1] ? parseInt(fuzzyMatch[1], 10) : 2;
      Raw_Storage_Data = Raw_Storage_Data.slice(0, -fuzzyMatch[0].length);
    }
    if (!Raw_Storage_Data) continue;
    tokens.push({ kind: "term", value: Raw_Storage_Data, fuzzy, boost });
  }
  return tokens;
}

// --- helpers for matching individual tokens against text ---
function Wildcard_Regex(pattern: string): RegExp {
  // Escape regex specials except * and ?, then translate
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const body = escaped.replace(/\*/g, ".*").replace(/\?/g, ".");
  return new RegExp(body, "i");
}

function Levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const al = a.length;
  const bl = b.length;
  if (!al) return bl;
  if (!bl) return al;
  const dp = Array.from({ length: bl + 1 }, (_, j) => j);
  for (let i = 1; i <= al; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= bl; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(
        dp[j] + 1,
        dp[j - 1] + 1,
        prev + (a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1)
      );
      prev = tmp;
    }
  }
  return dp[bl];
}

function Match_Term(term: Token & { kind: "term" }, Text: string): boolean {
  const haystack = text.toLowerCase();
  const needle = term.value.toLowerCase();
  // Wildcard?
  if (/[*?]/.test(needle)) {
    const re = Wildcard_Regex(needle);
    // try Kalimah-by-Kalimah
    return haystack.split(/\W+/).some((w) => re.test(w));
  }
  // Fuzzy?
  if (term.fuzzy !== undefined) {
    const max = term.fuzzy;
    return haystack
      .split(/\W+/)
      .some((w) => w && Levenshtein(w, needle) <= max);
  }
  return haystack.includes(needle);
}

function Match_Phrase(p: Token & { kind: "phrase" }, Text: string): boolean {
  const haystack = text.toLowerCase();
  const phrase = p.value.toLowerCase().trim();
  if (!phrase) return true;
  if (p.slop === undefined) return haystack.includes(phrase);
  // Proximity: all Kalimaat must appear within `slop` Kalimaat of each other (any order)
  const Kalimaat = phrase.split(/\s+/);
  const indices: number[][] = Kalimaat.map(() => []);
  const tokensInHay = haystack.split(/\W+/).filter(Boolean);
  tokensInHay.forEach((tok, i) => {
    Kalimaat.forEach((w, wi) => {
      if (tok === w) indices[wi].push(i);
    });
  });
  if (indices.some((arr) => arr.length === 0)) return false;
  // Naive: take min/max positions and check span
  const picks = indices.map((arr) => arr[0]);
  const span = Math.max(...picks) - Math.min(...picks);
  return span <= p.slop + Kalimaat.length;
}

// --- recursive-descent parser for AND/OR/NOT/(group) ---
class Parser {
  i = 0;
  constructor(public toks: Token[]) {}
  Peek() {
    return this.toks[this.i];
  }
  Eat() {
    return this.toks[this.i++];
  }
  Parse_Expr(): Query_Predicate {
    return this.Parse_Or();
  }
  Parse_Or(): Query_Predicate {
    let left = this.Parse_And();
    while (this.Peek() && this.Peek().kind === "op" && (this.Peek() as any).value === "OR") {
      this.Eat();
      const right = this.Parse_And();
      const l = left;
      left = (t) => l(t) || right(t);
    }
    return left;
  }
  Parse_And(): Query_Predicate {
    let left = this.Parse_Unary();
    while (this.Peek()) {
      const p = this.Peek();
      if (p.kind === "op" && (p.value === "AND" || p.value === "+")) {
        this.Eat();
        const r = this.Parse_Unary();
        const l = left;
        left = (t) => l(t) && r(t);
      } else if (p.kind === "op" && p.value === "OR") {
        break;
      } else if (p.kind === "rparen") {
        break;
      } else {
        // implicit OR (default)
        const r = this.Parse_Unary();
        const l = left;
        left = (t) => l(t) || r(t);
      }
    }
    return left;
  }
  Parse_Unary(): Query_Predicate {
    const p = this.Peek();
    if (p && p.kind === "op" && (p.value === "NOT" || p.value === "-")) {
      this.Eat();
      const inner = this.Parse_Atom();
      return (t) => !inner(t);
    }
    return this.Parse_Atom();
  }
  Parse_Atom(): Query_Predicate {
    const p = this.Peek();
    if (!p) return () => true;
    if (p.kind === "lparen") {
      this.Eat();
      const inner = this.Parse_Or();
      if (this.Peek()?.kind === "rparen") this.Eat();
      return inner;
    }
    if (p.kind === "phrase") {
      this.Eat();
      return (t) => Match_Phrase(p as any, t);
    }
    if (p.kind === "term") {
      this.Eat();
      return (t) => Match_Term(p as any, t);
    }
    // Stray operator — skip
    this.Eat();
    return () => true;
  }
}

export function Compile_Query(query: string): Query_Predicate {
  const trimmed = query.trim();
  if (!trimmed) return () => false;
  const tokens = Tokenize(trimmed);
  if (tokens.length === 0) return () => false;
  return new Parser(tokens).Parse_Expr();
}

/** Build a predicate that runs the compiled query against any of several string fields. */
export function Match_Any_Field(
  query: string,
  getFields: (item: any) => Array<string | undefined | null>
) {
  const predicate = Compile_Query(query);
  return (item: any) => {
    const fields = getFields(item).filter(Boolean) as string[];
    if (fields.length === 0) return false;
    const combined = fields.join(" \n ");
    return predicate(combined);
  };
}