// Improved spaced repetition (SM-2-lite) with active recall mixing
//
// Each word has an ease factor (default 2.5) that adjusts based on
// performance, and an interval that grows roughly geometrically.
// On a Wrong answer the card resets to 'learning' (10-min interval),
// then 1d, then ease-driven growth.

export interface Review_State {
  Word_ID: string;
  interval: number;        // current interval in days (can be fractional)
  ease: number;            // SM-2 ease factor (>= 1.3)
  reps: number;            // consecutive Correct streak
  Next_Review: number;      // timestamp ms
  learned: boolean;        // has been seen at least once
  lapses: number;          // total times forgotten (used to surface tricky words)
}

const MIN_EASE = 1.3;
const DEFAULT_EASE = 2.5;
const LEARNING_STEP_DAYS = 10 / (60 * 24); // 10 minutes
const FIRST_GRADUATION_DAYS = 1;
const SECOND_GRADUATION_DAYS = 3;

export function Create_Review_State(Word_ID: string): Review_State {
  return {
    Word_ID,
    interval: 0,
    ease: DEFAULT_EASE,
    reps: 0,
    Next_Review: 0,
    learned: false,
    lapses: 0,
  };
}

export function Update_Review(state: Review_State, Correct: boolean): Review_State {
  if (!Correct) {
    return {
      ...state,
      reps: 0,
      lapses: state.lapses + 1,
      ease: Math.max(MIN_EASE, state.ease - 0.2),
      interval: LEARNING_STEP_DAYS,
      Next_Review: Date.now() + LEARNING_STEP_DAYS * 86400000,
      learned: true,
    };
  }

  // Correct path
  let interval: number;
  const reps = state.reps + 1;
  if (reps === 1) interval = FIRST_GRADUATION_DAYS;
  else if (reps === 2) interval = SECOND_GRADUATION_DAYS;
  else interval = Math.round(state.interval * state.ease * 10) / 10;

  // Slight ease bump for repeated success, capped at 2.7
  const ease = Math.min(2.7, state.ease + 0.05);

  return {
    ...state,
    reps,
    ease,
    interval,
    Next_Review: Date.now() + interval * 86400000,
    learned: true,
  };
}

export function Is_Due(state: Review_State): boolean {
  return Date.now() >= state.Next_Review;
}

/**
 * Build a practice queue mixing:
 *   1. Lapsed/learning cards (interval < 1 day) that are due — highest priority
 *   2. Other due reviews, oldest-due first
 *   3. Fresh new words in given order
 *
 * Result is interleaved so the user doesn't see all-new or all-review back-to-back.
 */
export function Get_Next_Words_For_Practice(
  reviews: Review_State[],
  Word_IDs: string[],
  count = 5,
): string[] {
  const ID_Set = new Set(Word_IDs);
  const Review_Map = new Map(reviews.filter(r => ID_Set.has(r.Word_ID)).map(r => [r.Word_ID, r]));

  const now = Date.now();
  const lapsed: string[] = [];
  const due: string[] = [];

  for (const id of Word_IDs) {
    const r = Review_Map.get(id);
    if (!r || !r.learned) continue;
    if (r.Next_Review > now) continue;
    if (r.interval < 1) lapsed.push(id);
    else due.push(id);
  }
  // Oldest due first
  lapsed.sort((a, b) => (Review_Map.get(a)!.Next_Review) - (Review_Map.get(b)!.Next_Review));
  due.sort((a, b) => (Review_Map.get(a)!.Next_Review) - (Review_Map.get(b)!.Next_Review));

  const Learned_IDs = new Set(reviews.filter(r => r.learned).map(r => r.Word_ID));
  const fresh = Word_IDs.filter(id => !Learned_IDs.has(id));

  // Interleave: lapsed first, then alternate due / fresh
  const result: string[] = [];
  while (result.length < count && (lapsed.length || due.length || fresh.length)) {
    if (lapsed.length) result.push(lapsed.shift()!);
    if (result.length >= count) break;
    if (due.length) result.push(due.shift()!);
    if (result.length >= count) break;
    if (fresh.length) result.push(fresh.shift()!);
  }

  return result;
}

/** Number of words from the given list that are due right now. */
export function Count_Due(reviews: Review_State[], Word_IDs: string[]): number {
  const ID_Set = new Set(Word_IDs);
  return reviews.filter(r => ID_Set.has(r.Word_ID) && r.learned && Is_Due(r)).length;
}
