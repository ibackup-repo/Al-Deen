import { useEffect, useState, useCallback } from "react";

// FIX: Localized type boundaries to prevent backend cross-contamination
export type Supported_Language = "Dutch" | "English" | "Arabic" | "Pashto";

const KEY = "markedWords.v1";

type Marked_Map = Record<string, string[]>;

function read(): Marked_Map {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") as Marked_Map; } catch { return {}; }
}
function write(m: Marked_Map) {
  localStorage.setItem(KEY, JSON.stringify(m));
  window.dispatchEvent(new CustomEvent("markedWords:change"));
}

export function Use_Marked_Words() {
  const [map, setMap] = useState<Marked_Map>(() => read());

  useEffect(() => {
    const h = () => setMap(read());
    window.addEventListener("markedWords:change", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("markedWords:change", h);
      window.removeEventListener("storage", h);
    };
  }, []);

  const Is_Marked = useCallback(
    (lang: Supported_Language, id: string) => (map[lang] || []).includes(id),
    [map],
  );

  const toggle = useCallback((lang: Supported_Language, id: string) => {
    const cur  = read();
    const list = cur[lang] || [];
    cur[lang]  = list.includes(id) ? list.filter(x => x !== id) : [...list, id];
    write(cur);
  }, []);

  return { map, Is_Marked, toggle };
}