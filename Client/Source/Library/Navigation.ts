// FIX: Localized type boundary to prevent backend cross-contamination
export type Supported_Language = "Dutch" | "English" | "Arabic" | "Pashto";

// Helpers for the in-app browser.
// Browse_Path still drives the views internally, but every browse state now has
// a stable slug URL, e.g. /Language/English/Dictionary/Vocabulary/Noun/Greeting.

export const ALPHABET_SEGMENT = "@alphabet";

export const LANG_CODE_TO_NAME: Record<string, Supported_Language> = {
  nl: "Dutch",
  en: "English",
  ar: "Arabic",
  ps: "Pashto",
};

export const LANG_NAME_TO_CODE: Record<string, string> = {
  dutch: "nl",
  nederlands: "nl",
  nl: "nl",
  english: "en",
  en: "en",
  arabic: "ar",
  العربية: "ar",
  ar: "ar",
  pashto: "ps",
  ps: "ps",
};

function enc(segment: string) {
  return encodeURIComponent(segment);
}

function dec(segment: string) {
  try { return decodeURIComponent(segment); }
  catch { return segment; }
}

function Normalize_Chess_Segment(segment: string) {
  return dec(segment).replace(/^The-/i, "").toLowerCase();
}

function To_Title_Slug(segment: string) {
  return segment
    .split("-")
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");
}

const LESSON_SECTION_TO_SLUG: Record<string, string> = {
  "sec-0": "Beginner",
  "sec-1": "Intermediate",
  "sec-2": "Advanced",
};

const LESSON_SLUG_TO_SECTION: Record<string, string> = {
  beginner: "sec-0",
  intermediate: "sec-1",
  advanced: "sec-2",
  "sec-0": "sec-0",
  "sec-1": "sec-1",
  "sec-2": "sec-2",
};

function Section_To_URL_Segment(section?: string) {
  if (!section) return undefined;
  return enc(LESSON_SECTION_TO_SLUG[section] ?? To_Title_Slug(section));
}

function Section_From_URL_Segment(section?: string) {
  if (!section) return undefined;
  return LESSON_SLUG_TO_SECTION[section.toLowerCase()] ?? section;
}

function Language_Code_From_Slug(slug: string) {
  return LANG_NAME_TO_CODE[dec(slug).toLowerCase()] ?? dec(slug).toLowerCase();
}

function Language_Name_From_Code_Or_Name(value: string): Supported_Language {
  const raw = dec(value);
  const code = LANG_NAME_TO_CODE[raw.toLowerCase()] ?? raw.toLowerCase();
  return LANG_CODE_TO_NAME[code] ?? "English";
}

function Lesson_Folder_To_Segments(folderId?: string) {
  if (!folderId) return [];
  return folderId.split(":").map(enc);
}

function Lesson_Unit_To_Segment(unitId?: string) {
  if (!unitId) return [];
  const parts = unitId.split(":");
  return [enc(parts[2] ?? unitId)];
}

function Language_Content_Segments(path: string[]) {
  // Internal Browse_Path uses a synthetic Default subcategory for word files that
  // live directly under a Category. Keep the public URL slug clean:
  // /Language/English/Dictionary/Vocabulary/Noun/Hello
  if (path.length >= 3 && path[1] === "Default") return [path[0], ...path.slice(2)];
  return path;
}

export function Browse_Path_To_Url(path: string[]): string {
  if (path.length === 0) return "/";

  if (path[0] === "language") {
    if (path.length === 1) return "/Language";

    const Lang_Name = Language_Name_From_Code_Or_Name(path[1]);
    const base = `/Language/${enc(Lang_Name)}`;
    const branch = path[2];

    if (!branch) return base;
    if (branch === ALPHABET_SEGMENT) return `${base}/Alphabet`;

    if (branch === "dictionary") {
      // ["language", code, "dictionary"]                          → /Dictionary
      // ["language", code, "dictionary", "vocabulary", ...rest]   → /Dictionary/Vocabulary/rest
      if (path.length === 3) return `${base}/Dictionary`;
      const sub = path[3];
      const rest = path.slice(4);
      const Sub_Seg = sub === "vocabulary" ? "Vocabulary" : sub === "grammar" ? "Grammar" : To_Title_Slug(sub);
      return [`${base}/Dictionary`, Sub_Seg, ...Language_Content_Segments(rest).map(enc)]
        .filter(Boolean)
        .join("/");
    }

    if (branch === "lessons") {
      // ["language", code, "lessons", level?, unit?, lesson?, sub?]
      const rest = path.slice(3).map(enc);
      return [`${base}/Lesson`, ...rest].filter(Boolean).join("/");
    }
    if (branch === "_marked") {
      return `${base}/Dictionary/Vocabulary/${Language_Content_Segments(path.slice(3)).map(enc).join("/")}`;
    }

    return `${base}/${path.slice(2).map(enc).join("/")}`;
  }

  if (path[0] === "chess") {
    if (path.length === 1) return "/Chess";
    const [mode, level, group, Lesson_Or_Puzzle] = path.slice(1);
    if (mode === "lesson") {
      return ["/Chess/Lesson", level && To_Title_Slug(level), group && To_Title_Slug(group), Lesson_Or_Puzzle && `The-${To_Title_Slug(Lesson_Or_Puzzle)}`]
        .filter(Boolean)
        .join("/");
    }
    if (mode === "puzzle") return `/Chess/Puzzle${level ? `/${enc(level)}` : ""}`;
    if (mode === "play") return "/Chess/Play";
    return `/Chess/${path.slice(1).map(enc).join("/")}`;
  }

  return "/";
}

export function URL_To_Browse_Path(pathname: string): string[] | null {
  const segs = pathname.split("/").filter(Boolean).map(dec);
  if (segs.length === 0) return [];

  const root = segs[0].toLowerCase();

  if (root === "language") {
    if (segs.length === 1) return ["language"];

    const Lang_Code = Language_Code_From_Slug(segs[1]);
    const rest = segs.slice(2);
    if (rest.length === 0) return ["language", Lang_Code];

    const branch = rest[0].toLowerCase();
    if (branch === "alphabet" || rest[0] === ALPHABET_SEGMENT) return ["language", Lang_Code, ALPHABET_SEGMENT];
    if (branch === "lesson" || branch === "lessons") {
      const Lesson_Segs = rest.slice(1);
      return ["language", Lang_Code, "lessons", ...Lesson_Segs];
    }

    if (branch === "dictionary") {
      const Dict_Rest = rest.slice(1);
      if (Dict_Rest.length === 0) return ["language", Lang_Code, "dictionary"];

      const Sub_Seg = Dict_Rest[0].toLowerCase();
      const Sub_Key = Sub_Seg === "grammar" ? "grammar" : "vocabulary";
      const Content_Segs = Dict_Rest.slice(1);
      if (Content_Segs.length === 0) return ["language", Lang_Code, "dictionary", Sub_Key];

      // FIX: Clean structural client parsing. 
      // If content length is 1, it's a structural root Category.
      if (Content_Segs.length === 1) {
        return ["language", Lang_Code, "dictionary", Sub_Key, Content_Segs[0]];
      }
      // If content length is 2, it maps directly to a clean subcategory layout.
      if (Content_Segs.length === 2) {
        return ["language", Lang_Code, "dictionary", Sub_Key, Content_Segs[0], Content_Segs[1]];
      }
      // If content length is 3, it represents a deep entry word Definition.
      if (Content_Segs.length === 3) {
        return ["language", Lang_Code, "dictionary", Sub_Key, Content_Segs[0], Content_Segs[1], Content_Segs[2]];
      }

      return ["language", Lang_Code, "dictionary", Sub_Key, ...Content_Segs];
    }

    return ["language", Lang_Code, ...rest];
  }

  if (root === "chess") {
    const rest = segs.slice(1);
    if (rest.length === 0) return ["chess"];
    const mode = rest[0].toLowerCase();
    if (mode === "lesson" || mode === "lessons") return ["chess", "lesson", ...rest.slice(1).map(Normalize_Chess_Segment)];
    if (mode === "puzzle" || mode === "puzzles") return ["chess", "puzzle", ...rest.slice(1)];
    if (mode === "play") return ["chess", "play"];
    return ["chess", ...rest.map(s => s.toLowerCase())];
  }

  return null;
}

export function Same_Browse_Path(a: string[], b: string[]) {
  return a.length === b.length && a.every((segment, index) => segment === b[index]);
}

/**
 * Convert a legacy slug path like `/language/cat/sub/word` into our internal
 * Browse_Path, injecting the active target language at index 1.
 */
export function Path_To_Browse(path: string, Target_Lang: string): string[] {
  const segs = path.split("/").filter(Boolean);
  if (segs[0] === "language" && segs.length >= 2 && segs[1] !== Target_Lang) {
    return ["language", Target_Lang, ...segs.slice(1)];
  }
  return segs;
}