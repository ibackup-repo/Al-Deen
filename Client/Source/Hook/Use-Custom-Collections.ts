import { useCallback, useEffect, useState } from "react";
import type { Word_Detail } from "@/Hook/Use-Custom-Words";

/**
 * A subcategory is just a named collection of words.
 * Defined here rather than imported from courseData.
 */
export interface Subcategory {
  id: string;
  name: { Dutch: string; English: string; Arabic?: string };
  words: Word_Detail[];
}

const KEY = "customCollections.v1"; // { [Category_ID]: Subcategory[] }

type Collection_Map = Record<string, Subcategory[]>;

const read = (): Collection_Map => {
  try { return JSON.parse(localStorage.getItem(KEY) || "null") || {}; } catch { return {}; }
};
const write = (m: Collection_Map) => {
  localStorage.setItem(KEY, JSON.stringify(m));
  window.dispatchEvent(new CustomEvent("customCollections:change"));
};

function Make_ID(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `col-${Date.now()}`;
}

export function Use_Custom_Collections(Category_ID?: string) {
  const [all, setAll] = useState<Collection_Map>(read);

  useEffect(() => {
    const h = () => setAll(read());
    window.addEventListener("customCollections:change", h);
    return () => window.removeEventListener("customCollections:change", h);
  }, []);

  const collections = Category_ID ? (all[Category_ID] || []) : [];

  const Add_Collection = useCallback((Cat_ID: string, name: string) => {
    if (!name.trim()) return;
    const cur = read();
    const id  = `c-${Make_ID(name)}-${Date.now().toString(36)}`;
    const sub: Subcategory = {
      id,
      name: { Dutch: name, English: name, Arabic: name },
      words: [],
    };
    cur[Cat_ID] = [...(cur[Cat_ID] || []), sub];
    write(cur);
  }, []);

  const Remove_Collection = useCallback((Cat_ID: string, subId: string) => {
    const cur  = read();
    cur[Cat_ID] = (cur[Cat_ID] || []).filter(s => s.id !== subId);
    write(cur);
  }, []);

  return { collections, Add_Collection, Remove_Collection };
}