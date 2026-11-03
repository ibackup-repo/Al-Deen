// Persisted user preferences for the Chess module.
import { useEffect, useState } from "react";

export type Input_Mode = "click" | "drag" | "both";

export interface Chess_Settings {
  Allow_Premove: boolean;
  Animate_Pieces: boolean;
  Animation_Speed: number; // ms
  Show_Hints: boolean;
  Speak_Narration: boolean;
  Input_Mode: Input_Mode;
  Focus_Mode: boolean;
}

const DEFAULTS: Chess_Settings = {
  Allow_Premove: false,
  Animate_Pieces: true,
  Animation_Speed: 220,
  Show_Hints: true,
  Speak_Narration: true,
  Input_Mode: "both",
  Focus_Mode: false,
};

const KEY = "chess-settings-v1";

function read(): Chess_Settings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Chess_Settings>) };
  } catch {
    return DEFAULTS;
  }
}

const listeners = new Set<() => void>();

export function Get_Chess_Settings(): Chess_Settings {
  return read();
}

export function Set_Chess_Settings(patch: Partial<Chess_Settings>) {
  const next = { ...read(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* noop */ }
  listeners.forEach(l => l());
}

export function Use_Chess_Settings(): [Chess_Settings, (p: Partial<Chess_Settings>) => void] {
  const [state, setState] = useState<Chess_Settings>(read);
  useEffect(() => {
    const cb = () => setState(read());
    listeners.add(cb);
    return () => { listeners.delete(cb); };
  }, []);
  return [state, Set_Chess_Settings];
}
