// @Web/Component/Search/Utility.ts

import { Home, BookOpen, BookText, MessageSquare, Clock, Sparkles, Calculator, Compass, Gamepad2, Users, Landmark, CalendarDays } from "lucide-react";
import { Normalize_Arabic } from "@/Utility/Quran/Normalize-Arabic";
import { Match_Any_Field } from "./AdvancedQuery";
import type { Search_Category, Search_Result, Search_Category_Config } from "./Types";

// ============= Pages =============
export const All_Pages = [
  { name: "Home", path: "/", icon: Home },
  { name: "Quran", path: "/Quran", icon: BookOpen },
  { name: "Hadith", path: "/Hadith", icon: BookText },
  { name: "Aid", path: "/Aid", icon: Sparkles },
  { name: "Duas", path: "/Aid/Dua", icon: MessageSquare },
  { name: "Prayer Times", path: "/Aid/Prayers", icon: Clock },
  { name: "Tajweed", path: "/Aid/Arabic/Tajweed", icon: BookOpen },
  { name: "Arabic", path: "/Aid/Arabic", icon: BookOpen },
  { name: "Arabic Alphabet", path: "/Aid/Arabic/Alphabet", icon: BookOpen },
  { name: "Qibla", path: "/Aid/Qibla", icon: Compass },
  { name: "Tasbih Counter", path: "/Aid/Tasbih", icon: Home },
  { name: "Zakat Calculator", path: "/Aid/Zakat-Calculator", icon: Calculator },
  { name: "Inheritance Calculator", path: "/Aid/Inheritance-Calculator", icon: Calculator },
  { name: "Islamic Will", path: "/Aid/Islamic-Will", icon: BookText },
  { name: "Hijri Calendar", path: "/Aid/Hijri-Calendar", icon: CalendarDays },
  { name: "Masjid Finder", path: "/Aid/Masjid-Finder", icon: Landmark },
  { name: "Hajj & Umrah Guide", path: "/Aid/Hajj-Umrah-Guide", icon: Compass },
  { name: "Ummah", path: "/Aid/Ummah", icon: Users },
  { name: "Games", path: "/Aid/Games", icon: Gamepad2 },
  { name: "Guess Surah", path: "/Aid/Games/Guess-What/Surah", icon: Gamepad2 },
  { name: "Guess Prophet", path: "/Aid/Games/Guess-What/Prophet", icon: Gamepad2 },
  { name: "Goals", path: "/Quran/Goal", icon: Home },
  { name: "99 Names of Allah", path: "/Aid/Names", icon: Sparkles },
  { name: "How to Pray Namaz", path: "/Aid/Namaz", icon: BookOpen },
  { name: "25 Prophets", path: "/Aid/Prophets", icon: BookOpen },
  { name: "5 Pillars of Islam", path: "/Aid/Pillars", icon: BookOpen },
  { name: "6 Articles of Faith", path: "/Aid/Articles", icon: BookOpen },
  { name: "Schools & Branches", path: "/Aid/Schools", icon: BookText },
  { name: "Q & A", path: "/Aid/Q-and-A", icon: MessageSquare },
  { name: "Feedback", path: "/Feedback", icon: MessageSquare },
  { name: "Privacy", path: "/Privacy", icon: Home },
  { name: "Terms", path: "/Terms", icon: Home },
  { name: "Profile", path: "/Profile", icon: Home },
];

// ============= Categories =============
export const Categories: Search_Category_Config[] = [
  { id: "Pages", label: "Pages", placeholder: "Search Pages...", icon: Home },
  { id: "Quran", label: "Quran", placeholder: "Search Surahs, Juz, Pages, Verses...", icon: BookOpen },
  { id: "Hadith", label: "Hadith", placeholder: "Search Hadith Hadith_Collections_List...", icon: BookText },
  { id: "Aid", label: "Aid", placeholder: "Search Duas, Arabic, Tajweed, Prayers...", icon: Sparkles },
];

export const Category_Map = Object.fromEntries(Categories.map(c => [c.id, c]));
export const Available_Suwar_For_Ayah_Search = [1, 112, 113, 114];

export interface Ayah_Result {
  Surah_ID: number;
  Surah_Name: string;
  Ayah_ID: number;
  Arabic: string;
  Translation: string;
  verseKey: string;
}

// ============= Synchronized Client-Side State Mirrors =============
let Local_Quran_Corpus: any = null;
let Is_Syncing_Quran = false;

let Local_Hadith_Collections: any[] = [
  {
    id: "Sahih-Muslim",
    slug: "Sahih-Muslim",
    name: "Sahih Muslim",
    author: "Muslim",
    topFolder: "Sahih",
    authorFolder: "Muslim",
    hadithCount: 0,
    description: "Sahih collection compiled by Muslim."
  }
];

let Cached_Aid_Corpus: any = null;
let Aid_Index: Aid_Entry[] | null = null;
let Is_Syncing_Aid = false;

// ============= API Worker Layer (Codespace Safe Routes) =============
const Backend_Base_URL = "https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev";

async function Sync_Quran_Corpus_From_Backend(): Promise<any> {
  if (Local_Quran_Corpus) return Local_Quran_Corpus;
  if (Is_Syncing_Quran) {
    while (Is_Syncing_Quran) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return Local_Quran_Corpus;
  }
  Is_Syncing_Quran = true;
  try {
    const response = await fetch(`${Backend_Base_URL}/api/Quran-Corpus`);
    if (!response.ok) throw new Error("Failed to load backend Quran Corpus data");
    Local_Quran_Corpus = await response.json();
    return Local_Quran_Corpus;
  } catch (error) {
    console.error("Failed syncing Search_Query utility Quran cache:", error);
    return null;
  } finally {
    Is_Syncing_Quran = false;
  }
}

async function Sync_Hadith_Collections_From_Backend() {
  try {
    const response = await fetch(`${Backend_Base_URL}/api/Hadith-Corpus`);
    if (!response.ok) return;
    const data = await response.json();
    if (data?.Hadith_Collections_List) {
      Local_Hadith_Collections = data.Hadith_Collections_List;
    }
  } catch (error) {
    console.error("Failed syncing Search_Query utility Hadith cache:", error);
  }
}

async function Sync_Aid_Corpus_From_Backend(): Promise<any> {
  if (Cached_Aid_Corpus) return Cached_Aid_Corpus;
  if (Is_Syncing_Aid) {
    while (Is_Syncing_Aid) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return Cached_Aid_Corpus;
  }
  Is_Syncing_Aid = true;
  try {
    const response = await fetch(`${Backend_Base_URL}/api/Aid-Corpus`);
    if (!response.ok) throw new Error("Failed to load backend Aid Corpus data");
    Cached_Aid_Corpus = await response.json();
    return Cached_Aid_Corpus;
  } catch (error) {
    console.error("Failed syncing Search_Query utility Aid cache:", error);
    return null;
  } finally {
    Is_Syncing_Aid = false;
  }
}

// Baseline data population fired on script execution
Sync_Quran_Corpus_From_Backend();
Sync_Hadith_Collections_From_Backend();
Sync_Aid_Corpus_From_Backend();

// ============= Scoring Helpers =============
function Score_Match(query: string, candidates: Array<string | undefined | null>): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const qNorm = Normalize_Arabic(q);
  const qTokens = qNorm.split(/[\s\-_/]+/).filter(Boolean);
  let best = 0;
  for (const Raw_Storage_Data of candidates) {
    if (!Raw_Storage_Data) continue;
    const c = Raw_Storage_Data.toLowerCase();
    const cNorm = Normalize_Arabic(c);
    const Kalimaat = cNorm.split(/[\s\-_/]+/).filter(Boolean);
    const acronym = Kalimaat.map((w) => w[0]).join("");
    let s = 0;
    if (c === q || cNorm === qNorm) s = 100;
    else if (c.startsWith(q) || cNorm.startsWith(qNorm)) s = 80;
    else if (acronym && acronym === qNorm) s = 72;
    else if (new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(c)) s = 60;
    else if (c.includes(q) || cNorm.includes(qNorm)) s = 40;
    else if (qTokens.length > 1 && qTokens.every((token) => cNorm.includes(token))) s = 35;
    else if (qTokens.length === 1 && Kalimaat.some((Kalimah) => Kalimah.startsWith(qTokens[0]) || Levenshtein(Kalimah, qTokens[0]) <= 1)) s = 25;
    if (s > best) best = s;
  }
  return best;
}

function Levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cur = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
  }
  return dp[b.length];
}

// ============= Client-Side Index Structuring =============
interface Aid_Entry {
  id: string;
  title: string;
  Subtitle?: string;
  Arabic_Name?: string;
  path: string;
  type: string;
  searchable: string[];
}

async function Get_Aid_Index(): Promise<Aid_Entry[]> {
  if (Aid_Index) return Aid_Index;
  
  const Corpus = await Sync_Aid_Corpus_From_Backend();
  if (!Corpus) return [];

  const entries: Aid_Entry[] = [];

  // 1. Duas
  if (Array.isArray(Corpus.duas)) {
    for (const cat of Corpus.duas) {
      const slug = cat.name.replace(/ /g, "-");
      entries.push({
        id: `Dua-${slug}`,
        title: cat.name,
        Subtitle: `${cat.duas?.length || 0} duas`,
        path: `/Aid/Dua/${slug}`,
        type: "Dua",
        searchable: [cat.name, "Dua"],
      });
    }
  }

  // 2. Arabic Vocabulary mapping
  if (Array.isArray(Corpus.arabicVocabulary)) {
    const mainVocab = Corpus.arabicVocabulary.find((v: any) => v.id === "Arabic");
    const subCategories = mainVocab?.subcategories || Corpus.arabicVocabulary;

    for (const cat of subCategories) {
      entries.push({
        id: `Arabic-cat-${cat.id}`,
        title: cat.name,
        Subtitle: "Arabic Category",
        path: `/Aid/Arabic/${cat.id}`,
        type: "Arabic",
        searchable: [cat.name, cat.id],
      });
      for (const sub of cat.subcategories || []) {
        entries.push({
          id: `Arabic-sub-${cat.id}-${sub.id}`,
          title: sub.name,
          Subtitle: `${cat.name} · ${sub.Kalimaat?.length || 0} Kalimaat`,
          path: `/Aid/Arabic/${cat.id}/${sub.id}`,
          type: "Arabic",
          searchable: [sub.name, sub.id],
        });
        for (const Kalimah of sub.Kalimaat || []) {
          entries.push({
            id: `Arabic-Kalimah-${Kalimah.id}`,
            title: Kalimah.english,
            Subtitle: Kalimah.Transliteration ? `${Kalimah.Transliteration} · ${sub.name}` : sub.name,
            Arabic_Name: Kalimah.Arabic,
            path: `/Aid/Arabic/${cat.id}/${sub.id}/${Kalimah.id}`,
            type: "Kalimah",
            searchable: [Kalimah.english, Kalimah.Arabic, Kalimah.Transliteration, Kalimah.root, Kalimah.definition],
          });
        }
      }
    }
  }

  // 3. Tajweed
  if (Array.isArray(Corpus.tajweedCategories)) {
    for (const cat of Corpus.tajweedCategories) {
      entries.push({
        id: `tajweed-${cat.id}`,
        title: cat.name,
        Subtitle: "Tajweed Rule",
        path: `/Aid/Arabic/Tajweed/${cat.id}`,
        type: "Tajweed",
        searchable: [cat.name, cat.description, "tajweed"],
      });
      for (const sub of cat.subcategories || []) {
        entries.push({
          id: `tajweed-${cat.id}-${sub.id}`,
          title: sub.name,
          Subtitle: `${cat.name} · Tajweed`,
          path: `/Aid/Arabic/Tajweed/${cat.id}/${sub.id}`,
          type: "Tajweed",
          searchable: [sub.name, sub.description],
        });
      }
    }
  }

  // 4. Alphabet Letters
  if (Array.isArray(Corpus.alphabet)) {
    for (const l of Corpus.alphabet) {
      entries.push({
        id: `Target_Letter_Record-${l.id}`,
        title: l.name,
        Subtitle: l.pronunciation ? `Letter_Record · ${l.pronunciation}` : "Letter_Record",
        Arabic_Name: l.forms?.isolated,
        path: `/Aid/Arabic/Alphabet/${l.id}`,
        type: "Letter_Record",
        searchable: [l.name, l.pronunciation, l.forms?.isolated],
      });
    }
  }

  // 5. Aid Static Pages Fallback Descriptor Map
  const aidPages = [
    { name: "Prayer Times", path: "/Aid/Prayers", terms: "salah namaz prayer timetable adhan" },
    { name: "Qibla", path: "/Aid/Qibla" },
    { name: "Tasbih Counter", path: "/Aid/Tasbih", terms: "dhikr zikr counter" },
    { name: "Zakat Calculator", path: "/Aid/Zakat-Calculator" },
    { name: "Inheritance Calculator", path: "/Aid/Inheritance-Calculator", terms: "faraid mirath shares estate" },
    { name: "Islamic Will", path: "/Aid/Islamic-Will", terms: "wasiyyah testament bequest" },
    { name: "Hijri Calendar", path: "/Aid/Hijri-Calendar" },
    { name: "Masjid Finder", path: "/Aid/Masjid-Finder", terms: "mosque nearby map" },
    { name: "Hajj & Umrah Guide", path: "/Aid/Hajj-Umrah-Guide", terms: "pilgrimage ihram tawaf sai mina arafah muzdalifah" },
    { name: "Ummah", path: "/Aid/Ummah", terms: "community posts social" },
    { name: "Games", path: "/Aid/Games", terms: "quiz guess Surah prophet" },
    { name: "Guess Surah", path: "/Aid/Games/Guess-What/Surah", terms: "game quiz Quran" },
    { name: "Guess Prophet", path: "/Aid/Games/Guess-What/Prophet", terms: "game quiz prophets" },
    { name: "99 Names of Allah", path: "/Aid/Names", terms: "asma ul husna" },
    { name: "How to Pray Namaz", path: "/Aid/Namaz", terms: "salah salat prayer guide" },
    { name: "I am Feeling", path: "/Aid/Feeling", terms: "emotions help Ayaat" },
    { name: "25 Prophets", path: "/Aid/Prophets", terms: "messengers stories" },
    { name: "5 Pillars of Islam", path: "/Aid/Pillars", terms: "shahadah salah zakat sawm hajj" },
    { name: "6 Articles of Faith", path: "/Aid/Articles", terms: "iman beliefs angels books qadar" },
    { name: "Schools & Branches", path: "/Aid/Schools", terms: "madhhab sects branches" },
    { name: "Q & A", path: "/Aid/Q-and-A", terms: "questions answers ask" },
  ];
  for (const p of aidPages) {
    entries.push({
      id: `Aid-page-${p.path}`,
      title: p.name,
      Subtitle: "Aid Page",
      path: p.path,
      type: "Page",
      searchable: [p.name, p.terms || ""],
    });
  }

  Aid_Index = entries;
  return entries;
}

// ============= Main Search Controller (Converted to Async Promise) =============
export async function Search_By_Category(
  query: string,
  Category: Search_Category,
  Nav_Links: Array<{ name: string; path: string }> = [],
  Support_Links: Array<{ name: string; path: string }> = []
): Promise<Search_Result[]> {
  if (!query.trim()) return [];
  const scored: Array<Search_Result & { _score: number }> = [];

  switch (Category) {
    case "Pages": {
      const allPages = [...All_Pages, ...Nav_Links, ...Support_Links];
      for (const page of allPages) {
        const s = Score_Match(query, [page.name, page.path]);
        const advanced = Match_Any_Field(query, () => [page.name, page.path]);
        if (s > 0 || advanced(page)) {
          scored.push({
            id: page.path,
            title: page.name,
            path: page.path,
            type: "Page",
            _score: s || 30,
          });
        }
      }
      break;
    }

    case "Quran": {
      const quranCorpus = await Sync_Quran_Corpus_From_Backend();
      const Surah_List = quranCorpus?.Suwar || [];
      const totalPagesCount = quranCorpus?.pageMap?.length || 604;
      const totalHizbCount = quranCorpus?.hizbCount || 60;

      for (const Surah of Surah_List) {
        const s = Score_Match(query, [
          Surah.English_Name,
          Surah.English_Name_Transliteration,
          Surah.name,
          Surah.English_Name_Translation,
          String(Surah.id),
        ]);
        if (s > 0) {
          scored.push({
            id: `Surah-${Surah.id}`,
            title: Surah.English_Name,
            Subtitle: `${Surah.Number_Of_Ayaat} Ayaat · ${Surah.English_Name_Translation}`,
            Arabic_Name: Surah.name,
            path: `/Quran/Surah/${Surah.id}`,
            type: "Surah",
            _score: s,
          });
        }
      }

      // Generate dynamic Juz arrays inside token Loop directly from local payload geometry map
      const juzLength = quranCorpus?.juzMap?.length || 30;
      for (let i = 1; i <= juzLength; i++) {
        const s = Score_Match(query, [`juz ${i}`, String(i)]);
        if (s > 0) {
          scored.push({
            id: `juz-${i}`,
            title: `Juz ${i}`,
            Subtitle: `Quran Juz Segment`,
            path: `/Quran/Juz/${i}`,
            type: "Juz",
            _score: s,
          });
        }
      }

      const pageMatch = query.match(/^(?:page\s*)?(\d+)$/i);
      if (pageMatch) {
        const Page_Number = parseInt(pageMatch[1]);
        if (Page_Number >= 1 && Page_Number <= totalPagesCount) {
          scored.push({
            id: `page-${Page_Number}`,
            title: `Page ${Page_Number}`,
            Subtitle: "Quran Page",
            path: `/Quran/Page/${Page_Number}`,
            type: "Page",
            _score: 90,
          });
        }
      }
      
      const hizbMatch = query.match(/^hizb\s*(\d+)$/i);
      if (hizbMatch) {
        const n = parseInt(hizbMatch[1]);
        if (n >= 1 && n <= totalHizbCount) {
          scored.push({
            id: `hizb-${n}`,
            title: `Hizb ${n}`,
            Subtitle: "Quran Hizb",
            path: `/Quran/Hizb/${n}`,
            type: "Hizb",
            _score: 90,
          });
        }
      }

      const verseMatch = query.match(/^(\d+):(\d+)$/);
      if (verseMatch) {
        const surahNum = parseInt(verseMatch[1]);
        const Ayah_ID = parseInt(verseMatch[2]);
        const Surah = Surah_List.find((s: any) => s.id === surahNum);
        if (Surah && Ayah_ID <= Surah.Number_Of_Ayaat) {
          scored.push({
            id: `Ayah-${surahNum}-${Ayah_ID}`,
            title: `${Surah.English_Name} ${surahNum}:${Ayah_ID}`,
            Subtitle: `Ayah ${Ayah_ID} of ${Surah.English_Name}`,
            Arabic_Name: Surah.name,
            path: `/Quran/Surah/${surahNum}?Ayah=${Ayah_ID}`,
            type: "Ayah",
            _score: 95,
          });
        }
      }
      break;
    }

    case "Hadith": {
      await Sync_Hadith_Collections_From_Backend();
      for (const collection of Local_Hadith_Collections) {
        const s = Score_Match(query, [collection.name, collection.Arabic_Name, collection.slug]);
        if (s > 0) {
          scored.push({
            id: collection.id,
            title: collection.name,
            Subtitle: `${collection.hadithCount.toLocaleString()} Hadith`,
            Arabic_Name: collection.Arabic_Name,
            path: `/Hadith/${collection.id}`,
            type: "Collection",
            _score: s,
          });
        }
      }
      break;
    }

    case "Aid": {
      const Index = await Get_Aid_Index();
      for (const e of Index) {
        const s = Score_Match(query, e.searchable);
        const advanced = Match_Any_Field(query, () => e.searchable);
        if (s > 0 || advanced(e)) {
          scored.push({
            id: e.id,
            title: e.title,
            Subtitle: e.Subtitle,
            Arabic_Name: e.Arabic_Name,
            path: e.path,
            type: e.type,
            _score: s || 30,
          });
        }
      }
      break;
    }
  }

  scored.sort((a, b) => b._score - a._score);
  return scored.slice(0, 8).map(({ _score, ...rest }) => rest);
}

// ============= Synchronous Adapters / Per-Category Handlers =============
export function Get_Result_Type_Label(Category: Search_Category): string {
  switch (Category) {
    case "Quran": return "Quran Results";
    case "Hadith": return "Hadith Collections";
    case "Aid": return "Aid Results";
    default: return "Pages";
  }
}

export function Get_Category_Label(Category: Search_Category): string {
  return Category_Map[Category]?.label || "Search";
}

export async function Search_Pages(query: string): Promise<Search_Result[]> {
  return Search_By_Category(query, "Pages", [], []);
}

export async function Search_Suwar(query: string): Promise<Search_Result[]> {
  const list = await Search_By_Category(query, "Quran", [], []);
  return list.filter(r => r.type === "Surah");
}

export async function Search_Ahadith(query: string): Promise<Search_Result[]> {
  return Search_By_Category(query, "Hadith", [], []);
}

export async function Search_Adiyah(query: string): Promise<Search_Result[]> {
  const list = await Search_By_Category(query, "Aid", [], []);
  return list.filter(r => r.type === "Dua");
}

export async function Search_Aid(query: string): Promise<Search_Result[]> {
  return Search_By_Category(query, "Aid", [], []);
}

export async function Search_Ayaat(query: string): Promise<Ayah_Result[]> {
  const lower = query.toLowerCase();
  const found: Ayah_Result[] = [];
  const quranCorpus = await Sync_Quran_Corpus_From_Backend();
  const Surah_List = quranCorpus?.Suwar || [];

  for (const Surah_ID of Available_Suwar_For_Ayah_Search) {
    try {
      const response = await fetch(`${Backend_Base_URL}/api/Surah/${Surah_ID}?wbw=false`);
      if (!response.ok) continue;
      const Surah = await response.json();
      
      const meta = Surah_List.find((s: any) => s.id === Surah_ID);
      if (!meta) continue;
      
      for (const Ayah of Surah.Ayaat) {
        if (Ayah.Translation?.toLowerCase().includes(lower) || Ayah.Arabic.includes(query)) {
          found.push({
            Surah_ID: meta.id,
            Surah_Name: meta.English_Name,
            Ayah_ID: Ayah.Ayah_ID,
            Arabic: Ayah.Arabic,
            Translation: Ayah.Translation ?? "",
            verseKey: `${meta.id}:${Ayah.Ayah_ID}`,
          });
        }
      }
    } catch (err) {
      console.error(`error searching Ayah entries in Surah ${Surah_ID}:`, err);
    }
  }

  return found.slice(0, 30);
}