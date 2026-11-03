import { useEffect, useState, useCallback } from "react";

// FIX: Localized type boundaries to prevent backend cross-contamination
export type Supported_Language = "Dutch" | "English" | "Arabic" | "Pashto";

/**
 * Word_Detail mirrors the shape expected by Word_Detail_View.
 * Define it here since it's no longer exported from courseData.
 */
export interface Word_Language_Data {
  word: string;
  Pronunciation?: string;
  Definition?: string;
  plural?: string;
  diminutive?: string;
  conjugation?: Record<string, string>;
  example?: string;
  // Dutch-specific
  Definitie?: string;
  meervoud?: string;
  verkleinwoord?: string;
  vervoeging?: Record<string, string>;
  Voorbeeld?: string;
  gender?: "m" | "f" | "n" | "c";
}

export interface Word_Detail {
  id: string;
  nl: Word_Language_Data;
  en: Word_Language_Data;
  ar?: Word_Language_Data;
}

const CUSTOM_KEY   = "Custom_Words.v1";    // { [Cat_ID/subId]: Word_Detail[] }
const OVERRIDE_KEY = "wordOverrides.v1";  // { [Word_ID]: Partial<Word_Detail> }

type Custom_Map   = Record<string, Word_Detail[]>;
type Override_Map = Record<string, Partial<Word_Detail>>;

const Read_JSON = <T,>(k: string, fallback: T): T => {
  try { return JSON.parse(localStorage.getItem(k) || "null") ?? fallback; } catch { return fallback; }
};
const Write_JSON = (k: string, v: unknown, evt: string) => {
  localStorage.setItem(k, JSON.stringify(v));
  window.dispatchEvent(new CustomEvent(evt));
};

function Sub_Key(Cat_ID: string, subId: string) { return `${Cat_ID}/${subId}`; }

export function Use_Custom_Words(Category_ID?: string, Subcategory_ID?: string) {
  const [All_Custom, Set_All_Custom] = useState<Custom_Map>  (() => Read_JSON(CUSTOM_KEY,   {}));
  const [Overrides, Set_Overrides] = useState<Override_Map>(() => Read_JSON(OVERRIDE_KEY, {}));

  useEffect(() => {
    const h1 = () => Set_All_Custom(Read_JSON(CUSTOM_KEY,   {}));
    const h2 = () => Set_Overrides(Read_JSON(OVERRIDE_KEY, {}));
    window.addEventListener("Custom_Words:change",   h1);
    window.addEventListener("wordOverrides:change", h2);
    return () => {
      window.removeEventListener("Custom_Words:change",   h1);
      window.removeEventListener("wordOverrides:change", h2);
    };
  }, []);

  const Custom_Words = Category_ID && Subcategory_ID
    ? (All_Custom[Sub_Key(Category_ID, Subcategory_ID)] || [])
    : [];

  const Add_Custom_Word = useCallback((w: Word_Detail) => {
    if (!Category_ID || !Subcategory_ID) return;
    const cur = Read_JSON<Custom_Map>(CUSTOM_KEY, {});
    const k   = Sub_Key(Category_ID, Subcategory_ID);
    cur[k]    = [...(cur[k] || []), w];
    Write_JSON(CUSTOM_KEY, cur, "Custom_Words:change");
  }, [Category_ID, Subcategory_ID]);

  const Remove_Custom_Word = useCallback((Word_ID: string) => {
    if (!Category_ID || !Subcategory_ID) return;
    const cur = Read_JSON<Custom_Map>(CUSTOM_KEY, {});
    const k   = Sub_Key(Category_ID, Subcategory_ID);
    cur[k]    = (cur[k] || []).filter(w => w.id !== Word_ID);
    Write_JSON(CUSTOM_KEY, cur, "Custom_Words:change");
  }, [Category_ID, Subcategory_ID]);

  const Update_Custom_Word = useCallback((Word_ID: string, patch: Partial<Word_Detail>) => {
    if (!Category_ID || !Subcategory_ID) return;
    const cur = Read_JSON<Custom_Map>(CUSTOM_KEY, {});
    const k   = Sub_Key(Category_ID, Subcategory_ID);
    cur[k]    = (cur[k] || []).map(w => w.id === Word_ID ? { ...w, ...patch } : w);
    Write_JSON(CUSTOM_KEY, cur, "Custom_Words:change");
  }, [Category_ID, Subcategory_ID]);

  const Set_Override = useCallback((Word_ID: string, patch: Partial<Word_Detail>) => {
    const cur    = Read_JSON<Override_Map>(OVERRIDE_KEY, {});
    cur[Word_ID]  = { ...(cur[Word_ID] || {}), ...patch };
    Write_JSON(OVERRIDE_KEY, cur, "wordOverrides:change");
  }, []);

  const Get_Override = useCallback(
    (Word_ID: string) => Overrides[Word_ID] || null,
    [Overrides],
  );

  const Apply_Override = useCallback((w: Word_Detail): Word_Detail => {
    const o = Overrides[w.id];
    if (!o) return w;
    return {
      ...w,
      ...o,
      nl: { ...w.nl, ...(o.nl || {}) },
      en: { ...w.en, ...(o.en || {}) },
      ar: o.ar ? { ...(w.ar || { word: "" }), ...o.ar } : w.ar,
    };
  }, [Overrides]);

  const Is_Custom = useCallback(
    (id: string) => Custom_Words.some(w => w.id === id),
    [Custom_Words],
  );

  return {
    Custom_Words, Add_Custom_Word, Remove_Custom_Word, Update_Custom_Word,
    Set_Override, Get_Override, Apply_Override, Is_Custom,
  };
}