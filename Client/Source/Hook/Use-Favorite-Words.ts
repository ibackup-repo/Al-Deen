import { useEffect, useState, useCallback } from "react";

// FIX: Localized type boundaries to prevent backend cross-contamination
export type Supported_Language = "Dutch" | "English" | "Arabic" | "Pashto";

const KEY = "favoriteWords.v1";

type Favorite_Map = Record<string, string[]>;

function read(): Favorite_Map {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") as Favorite_Map; } catch { return {}; }
}
function write(m: Favorite_Map) {
  localStorage.setItem(KEY, JSON.stringify(m));
  window.dispatchEvent(new CustomEvent("favoriteWords:change"));
}

export function Use_Favorite_Words() {
  const [map, setMap] = useState<Favorite_Map>(() => read());

  useEffect(() => {
    const h = () => setMap(read());
    window.addEventListener("favoriteWords:change", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("favoriteWords:change", h);
      window.removeEventListener("storage", h);
    };
  }, []);

  const Is_Favorite = useCallback(
    (lang: Supported_Language, id: string) => (map[lang] || []).includes(id),
    [map],
  );

  const toggle = useCallback((lang: Supported_Language, id: string) => {
    const cur  = read();
    const list = cur[lang] || [];
    cur[lang]  = list.includes(id) ? list.filter(x => x !== id) : [...list, id];
    write(cur);
  }, []);

  return { map, Is_Favorite, toggle };
}