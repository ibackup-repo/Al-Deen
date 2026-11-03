// Tiny module-level store so the global Layout header can render a progress
// bar driven by whichever Lesson_Runner is currently mounted.
export type Lesson_Progress_State = { current: number; total: number } | null;

let state: Lesson_Progress_State = null;
const listeners = new Set<() => void>();

export const Lesson_Progress = {
  set(s: Lesson_Progress_State) {
    state = s;
    listeners.forEach(l => l());
  },
  get(): Lesson_Progress_State {
    return state;
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => { listeners.delete(l); };
  },
};
