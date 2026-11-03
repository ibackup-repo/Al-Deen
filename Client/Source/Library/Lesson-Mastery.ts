// Per-lesson mastery + spaced review scheduling.
// Star path:  0 → 1 (learn) → 2 → 3 → 4 → 5 (mastered)
// You only earn the next star with a PERFECT review. Otherwise you keep
// your current Stars and get scheduled for another review sooner.

const KEY = "lesson-mastery-v1";
const VISIT_KEY = "lessons-visited-v1";
const DAY = 86_400_000;

export interface Mastery {
  Stars: 0 | 1 | 2 | 3 | 4 | 5;
  lastReviewedAt: number;
  nextReviewAt: number; // 0 when not yet learned or when mastered
}

interface Store { [lang: string]: { [id: string]: Mastery } }

function read(): Store {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
function write(s: Store) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* noop */ }
  listeners.forEach(l => l());
}
const listeners = new Set<() => void>();

export function Subscribe_Mastery(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function Lesson_ID(...segments: string[]): string {
  return segments.filter(Boolean).join("/");
}

export function Get_Mastery(lang: string, id: string): Mastery {
  return read()[lang]?.[id] ?? { Stars: 0, lastReviewedAt: 0, nextReviewAt: 0 };
}

function Days_For_Next_Review(Stars: number): number {
  // Perfect review → longer gap for higher Stars, capped at 28 days.
  const table = [7, 7, 14, 21, 28];
  return table[Math.min(Stars, table.length - 1)];
}

function Days_For_Retry(Accuracy: number): number {
  // Not perfect: schedule again in 1–5 days based on Accuracy.
  // 100% (but not perfect due to slips) → 5 days; 0% → 1 day.
  const d = 1 + Math.round(Math.max(0, Math.min(1, Accuracy)) * 4);
  return Math.min(7, d);
}

/** Called when the runner finishes. Accuracy is 0..1 across practice steps. */
export function Record_Result(
  lang: string, id: string,
  opts: { perfect: boolean; Accuracy: number },
): Mastery {
  const s = read();
  if (!s[lang]) s[lang] = {};
  const prev = s[lang][id] ?? { Stars: 0, lastReviewedAt: 0, nextReviewAt: 0 } as Mastery;
  const now = Date.now();

  let Stars = prev.Stars;
  let nextReviewAt: number;

  if (prev.Stars === 0) {
    // First completion — always earn one star.
    Stars = 1;
    nextReviewAt = now + Days_For_Next_Review(1) * DAY;
  } else if (opts.perfect) {
    Stars = Math.min(5, prev.Stars + 1) as Mastery["Stars"];
    nextReviewAt = Stars >= 5 ? 0 : now + Days_For_Next_Review(Stars) * DAY;
  } else {
    nextReviewAt = now + Days_For_Retry(opts.Accuracy) * DAY;
  }

  const next: Mastery = { Stars, lastReviewedAt: now, nextReviewAt };
  s[lang][id] = next;
  write(s);
  return next;
}

/** A lesson is unlocked if it's the first, or if the previous one has ≥1 star. */
export function Is_Unlocked(lang: string, id: string, Prev_ID?: string) {
  if (!Prev_ID) return true;
  return Get_Mastery(lang, Prev_ID).Stars >= 1;
}

export function Is_Due_For_Review(lang: string, id: string): boolean {
  const m = Get_Mastery(lang, id);
  return m.Stars > 0 && m.Stars < 5 && m.nextReviewAt > 0 && Date.now() >= m.nextReviewAt;
}

// First-visit gate used by the Lessons root to auto-redirect into the
// first lesson.
export function Has_Visited(lang: string) {
  try { return (JSON.parse(localStorage.getItem(VISIT_KEY) || "[]") as string[]).includes(lang); }
  catch { return false; }
}
export function Mark_Visited(lang: string) {
  try {
    const arr = JSON.parse(localStorage.getItem(VISIT_KEY) || "[]") as string[];
    if (!arr.includes(lang)) arr.push(lang);
    localStorage.setItem(VISIT_KEY, JSON.stringify(arr));
  } catch { /* noop */ }
}
