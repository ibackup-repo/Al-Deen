import Path_Module from "path";
import File_System_Module from "fs";
import { fileURLToPath as File_URL_To_Path_Function } from "url";
import Database_Module from "better-sqlite3";

export interface Chapter {
  ID: number;
  Hadith_Count: number;
  Name: string;
}

export interface Narration {
  Chapter_ID: number;
  ID: number;
  In_Chapter_ID: number;
  Text: string;
}

export interface Translation {
  ID: number;
  Text: string;
  Edition: string;
}

export interface KBK_Translation {
  ID: number;
  Token_Index: number;
  Text: string;
  Edition: string;
}

export interface Transliteration {
  ID: number;
  Text: string;
  Edition: string;
}

export interface KBK_Transliteration {
  ID: number;
  Token_Index: number;
  Text: string;
  Edition: string;
}

export interface Chapter_Output {
  Chapter: Chapter;
  Narrations: Narration[];
}

export interface Translation_Output {
  Translations: Translation[];
  KBK_Translations?: KBK_Translation[];
}

export interface Transliteration_Output {
  Transliterations: Transliteration[];
  Word_By_Word_Transliterations?: KBK_Transliteration[];
}

export interface Edition {
  ID: string;
  Name: string;
  Language: string;
}

export interface Collection_Info {
  ID: string;
  Name: string;
  Category: string;
}

const Script_File_Path = File_URL_To_Path_Function(import.meta.url);
const Script_Directory_Path = Path_Module.dirname(Script_File_Path);

const Asset_Corpus_Directory_Path = Path_Module.resolve(
  Script_Directory_Path,
  "..",
  "..",
  "Asset",
  "Corpus"
);

const Normalize_Collection_Segment = (Collection_Path: string): string =>
  Collection_Path.replace(/\.db$/, "").replace(/[\/\.]/g, Path_Module.sep);

function Resolve_Arabic_Database_Path(Collection_Path: string): string {
  return Path_Module.join(
    Asset_Corpus_Directory_Path,
    "Hadith",
    "Arabic",
    `${Normalize_Collection_Segment(Collection_Path)}.db`
  );
}

function Resolve_Language_Collection_Database_Path(
  Sub_Folder: "Translation" | "Transliteration",
  Language: string,
  Collection_Path: string
): string {
  const Cleaned_Language_String = Language.replace(/\.db$/, "");
  return Path_Module.join(
    Asset_Corpus_Directory_Path,
    "Hadith",
    Sub_Folder,
    Cleaned_Language_String,
    `${Normalize_Collection_Segment(Collection_Path)}.db`
  );
}

export function Fetch_Chapters(Collection_Path: string): Chapter[] {
  const Target_Database_Path = Resolve_Arabic_Database_Path(Collection_Path);
  if (!File_System_Module.existsSync(Target_Database_Path)) {
    console.warn(
      `[HADITH API WARNING] Collection DB not found at: ${Target_Database_Path}`
    );
    return [];
  }

  try {
    const Database_Connection = new Database_Module(Target_Database_Path, {
      readonly: true,
    });
    const Fetched_Chapters_List = Database_Connection.prepare(
      `SELECT ID, Hadith_Count, Name FROM Chapter ORDER BY ID ASC`
    ).all() as Chapter[];
    Database_Connection.close();
    return Fetched_Chapters_List;
  } catch (Error_Object) {
    console.error(
      `[HADITH API ERROR] Failed to fetch chapters from ${Target_Database_Path}:`,
      Error_Object
    );
    return [];
  }
}

export function Fetch_Chapter(
  Collection_Path: string,
  Chapter_ID: number
): Chapter_Output | null {
  const Target_Database_Path = Resolve_Arabic_Database_Path(Collection_Path);
  if (!File_System_Module.existsSync(Target_Database_Path)) {
    console.warn(
      `[HADITH API WARNING] Collection DB not found at: ${Target_Database_Path}`
    );
    return null;
  }

  try {
    const Database_Connection = new Database_Module(Target_Database_Path, {
      readonly: true,
    });

    const Chapter_Entry = Database_Connection.prepare(
      `SELECT ID, Hadith_Count, Name FROM Chapter WHERE ID = ?`
    ).get(Chapter_ID) as Chapter | undefined;

    if (!Chapter_Entry) {
      Database_Connection.close();
      return null;
    }

    const Fetched_Narrations_List = Database_Connection.prepare(
      `SELECT Chapter_ID, ID, In_Chapter_ID, text FROM Narration WHERE Chapter_ID = ? ORDER BY In_Chapter_ID ASC`
    ).all(Chapter_ID) as Narration[];

    Database_Connection.close();

    return {
      Chapter: Chapter_Entry,
      Narrations: Fetched_Narrations_List,
    };
  } catch (Error_Object) {
    console.error(
      `[HADITH API ERROR] Failed to fetch chapter ${Chapter_ID} from ${Target_Database_Path}:`,
      Error_Object
    );
    return null;
  }
}

export function Fetch_Narration(
  Collection_Path: string,
  Hadith_ID: number
): Narration | null {
  const Target_Database_Path = Resolve_Arabic_Database_Path(Collection_Path);
  if (!File_System_Module.existsSync(Target_Database_Path)) {
    console.warn(
      `[HADITH API WARNING] Collection DB not found at: ${Target_Database_Path}`
    );
    return null;
  }

  try {
    const Database_Connection = new Database_Module(Target_Database_Path, {
      readonly: true,
    });
    const Narration_Entry = Database_Connection.prepare(
      `SELECT Chapter_ID, ID, In_Chapter_ID, text FROM Narration WHERE ID = ?`
    ).get(Hadith_ID) as Narration | undefined;
    Database_Connection.close();

    return Narration_Entry || null;
  } catch (Error_Object) {
    console.error(
      `[HADITH API ERROR] Failed to fetch Narration ${Hadith_ID} from ${Target_Database_Path}:`,
      Error_Object
    );
    return null;
  }
}

export function Fetch_Hadith_Translation(
  Collection_Path: string,
  Hadith_IDs: number | number[],
  Translation_Languages: string | string[] = [],
  Include_Word_By_Word_Flag: boolean = false
): Translation_Output {
  const Target_IDs_List = Array.isArray(Hadith_IDs) ? Hadith_IDs : [Hadith_IDs];
  const Target_Languages_List = Array.isArray(Translation_Languages)
    ? Translation_Languages.filter(Boolean)
    : Translation_Languages
    ? [Translation_Languages]
    : [];

  const Local_Translations_Collection: Translation[] = [];
  const Local_Word_By_Word_Translations_Collection: KBK_Translation[] = [];

  if (Target_IDs_List.length === 0 || Target_Languages_List.length === 0) {
    return { Translations: [] };
  }

  const Query_Placeholders_String = Target_IDs_List.map(() => "?").join(",");

  for (const Language_Identifier of Target_Languages_List) {
    const Target_Database_Path = Resolve_Language_Collection_Database_Path(
      "Translation",
      Language_Identifier,
      Collection_Path
    );
    if (!File_System_Module.existsSync(Target_Database_Path)) {
      console.warn(
        `[HADITH API WARNING] Translation DB not found at ${Target_Database_Path}`
      );
      continue;
    }

    try {
      const Database_Connection = new Database_Module(Target_Database_Path, {
        readonly: true,
      });
      const Cleaned_Edition_Identifier = Language_Identifier.replace(
        /\.db$/,
        ""
      );

      const Hadith_Table_Exists_Result = Database_Connection.prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='Hadith'`
      ).get();

      if (Hadith_Table_Exists_Result) {
        const Query_Hadith_Statement = Database_Connection.prepare(
          `SELECT ID, text FROM Hadith WHERE ID IN (${Query_Placeholders_String}) ORDER BY ID ASC`
        );
        const Fetched_Hadith_Rows = Query_Hadith_Statement.all(
          ...Target_IDs_List
        ) as any[];
        Local_Translations_Collection.push(
          ...Fetched_Hadith_Rows.map((Row_Object) => ({
            ID: Row_Object.ID,
            Text: Row_Object.text,
            Edition: Cleaned_Edition_Identifier,
          }))
        );
      }

      if (Include_Word_By_Word_Flag) {
        const Word_By_Word_Table_Exists_Result = Database_Connection.prepare(
          `SELECT name FROM sqlite_master WHERE type='table' AND name='WBW'`
        ).get();

        if (Word_By_Word_Table_Exists_Result) {
          const Query_Word_By_Word_Statement = Database_Connection.prepare(
            `SELECT ID, Token_Index, text FROM WBW WHERE ID IN (${Query_Placeholders_String}) ORDER BY ID ASC, Token_Index ASC`
          );
          const Fetched_Word_By_Word_Rows = Query_Word_By_Word_Statement.all(
            ...Target_IDs_List
          ) as any[];
          Local_Word_By_Word_Translations_Collection.push(
            ...Fetched_Word_By_Word_Rows.map((Row_Object) => ({
              ID: Row_Object.ID,
              Token_Index: Row_Object.Token_Index,
              Text: Row_Object.text,
              Edition: Cleaned_Edition_Identifier,
            }))
          );
        }
      }

      Database_Connection.close();
    } catch (Error_Object) {
      console.error(
        `[HADITH API ERROR] Failed to query Translation DB at ${Target_Database_Path}:`,
        Error_Object
      );
    }
  }

  return {
    Translations: Local_Translations_Collection,
    ...(Include_Word_By_Word_Flag
      ? { KBK_Translations: Local_Word_By_Word_Translations_Collection }
      : {}),
  };
}

export function Fetch_Hadith_Transliteration(
  Collection_Path: string,
  Hadith_IDs: number | number[],
  Transliteration_Languages: string | string[] = [],
  Include_Word_By_Word_Flag: boolean = false
): Transliteration_Output {
  const Target_IDs_List = Array.isArray(Hadith_IDs) ? Hadith_IDs : [Hadith_IDs];
  const Target_Languages_List = Array.isArray(Transliteration_Languages)
    ? Transliteration_Languages.filter(Boolean)
    : Transliteration_Languages
    ? [Transliteration_Languages]
    : [];

  const Local_Transliterations_Collection: Transliteration[] = [];
  const Local_Word_By_Word_Transliterations_Collection: KBK_Transliteration[] =
    [];

  if (Target_IDs_List.length === 0 || Target_Languages_List.length === 0) {
    return { Transliterations: [] };
  }

  const Query_Placeholders_String = Target_IDs_List.map(() => "?").join(",");

  for (const Language_Identifier of Target_Languages_List) {
    const Target_Database_Path = Resolve_Language_Collection_Database_Path(
      "Transliteration",
      Language_Identifier,
      Collection_Path
    );
    if (!File_System_Module.existsSync(Target_Database_Path)) {
      console.warn(
        `[HADITH API WARNING] Transliteration DB not found at ${Target_Database_Path}`
      );
      continue;
    }

    try {
      const Database_Connection = new Database_Module(Target_Database_Path, {
        readonly: true,
      });
      const Cleaned_Edition_Identifier = Language_Identifier.replace(
        /\.db$/,
        ""
      );

      const Hadith_Table_Exists_Result = Database_Connection.prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='Hadith'`
      ).get();

      if (Hadith_Table_Exists_Result) {
        const Query_Hadith_Statement = Database_Connection.prepare(
          `SELECT ID, text FROM Hadith WHERE ID IN (${Query_Placeholders_String}) ORDER BY ID ASC`
        );
        const Fetched_Hadith_Rows = Query_Hadith_Statement.all(
          ...Target_IDs_List
        ) as any[];
        Local_Transliterations_Collection.push(
          ...Fetched_Hadith_Rows.map((Row_Object) => ({
            ID: Row_Object.ID,
            Text: Row_Object.text,
            Edition: Cleaned_Edition_Identifier,
          }))
        );
      }

      if (Include_Word_By_Word_Flag) {
        const Word_By_Word_Table_Exists_Result = Database_Connection.prepare(
          `SELECT name FROM sqlite_master WHERE type='table' AND name='WBW'`
        ).get();

        if (Word_By_Word_Table_Exists_Result) {
          const Query_Word_By_Word_Statement = Database_Connection.prepare(
            `SELECT ID, Token_Index, text FROM WBW WHERE ID IN (${Query_Placeholders_String}) ORDER BY ID ASC, Token_Index ASC`
          );
          const Fetched_Word_By_Word_Rows = Query_Word_By_Word_Statement.all(
            ...Target_IDs_List
          ) as any[];
          Local_Word_By_Word_Transliterations_Collection.push(
            ...Fetched_Word_By_Word_Rows.map((Row_Object) => ({
              ID: Row_Object.ID,
              Token_Index: Row_Object.Token_Index,
              Text: Row_Object.text,
              Edition: Cleaned_Edition_Identifier,
            }))
          );
        }
      }

      Database_Connection.close();
    } catch (Error_Object) {
      console.error(
        `[HADITH API ERROR] Failed to query Transliteration DB at ${Target_Database_Path}:`,
        Error_Object
      );
    }
  }

  return {
    Transliterations: Local_Transliterations_Collection,
    ...(Include_Word_By_Word_Flag
      ? {
          Word_By_Word_Transliterations:
            Local_Word_By_Word_Transliterations_Collection,
        }
      : {}),
  };
}

const Prettify_Name = (Raw_Name_String: string): string =>
  Raw_Name_String.replace(/[-_]+/g, " ").trim();

function Format_Edition_From_Directory_Name(Directory_Name: string): Edition {
  return {
    ID: Directory_Name,
    Name: Prettify_Name(Directory_Name),
    Language: Directory_Name,
  };
}

function Scan_Language_Editions(Root_Directory_Path: string): Edition[] {
  const Local_Editions_Collection: Edition[] = [];
  if (!File_System_Module.existsSync(Root_Directory_Path)) {
    return Local_Editions_Collection;
  }

  const Directory_Entries_List = File_System_Module.readdirSync(
    Root_Directory_Path,
    { withFileTypes: true }
  );

  for (const Directory_Entry of Directory_Entries_List) {
    if (Directory_Entry.isDirectory()) {
      Local_Editions_Collection.push(
        Format_Edition_From_Directory_Name(Directory_Entry.name)
      );
    }
  }

  return Local_Editions_Collection;
}

export function Get_Available_Collections(
  Base_Directory_Path: string = Asset_Corpus_Directory_Path
): Collection_Info[] {
  const Arabic_Directory_Path = Path_Module.join(
    Base_Directory_Path,
    "Hadith",
    "Arabic"
  );
  const Collections_Collection: Collection_Info[] = [];

  if (!File_System_Module.existsSync(Arabic_Directory_Path)) {
    return Collections_Collection;
  }

  function Traverse_Directory_Tree(
    Current_Directory_Path: string,
    Relative_Directory_Path: string
  ) {
    const Directory_Entries_List = File_System_Module.readdirSync(
      Current_Directory_Path,
      { withFileTypes: true }
    );

    for (const Directory_Entry of Directory_Entries_List) {
      const Full_Entry_Path = Path_Module.join(
        Current_Directory_Path,
        Directory_Entry.name
      );
      const Relative_Entry_Path = Relative_Directory_Path
        ? `${Relative_Directory_Path}/${Directory_Entry.name}`
        : Directory_Entry.name;

      if (Directory_Entry.isDirectory()) {
        Traverse_Directory_Tree(Full_Entry_Path, Relative_Entry_Path);
      } else if (
        Directory_Entry.isFile() &&
        Directory_Entry.name.endsWith(".db")
      ) {
        const Collection_Identifier = Relative_Entry_Path.replace(/\.db$/, "");
        const Path_Segments_List = Collection_Identifier.split("/");
        const Category_Name =
          Path_Segments_List.length > 1 ? Path_Segments_List[0] : "General";
        const Collection_Name = Prettify_Name(
          Path_Segments_List[Path_Segments_List.length - 1]
        );

        Collections_Collection.push({
          ID: Collection_Identifier,
          Name: Collection_Name,
          Category: Category_Name,
        });
      }
    }
  }

  Traverse_Directory_Tree(Arabic_Directory_Path, "");
  return Collections_Collection;
}

export function Get_Available_Translations(
  Base_Directory_Path: string = Asset_Corpus_Directory_Path
): Edition[] {
  return Scan_Language_Editions(
    Path_Module.join(Base_Directory_Path, "Hadith", "Translation")
  );
}

export function Get_Available_KBK_Translations(
  Base_Directory_Path: string = Asset_Corpus_Directory_Path
): Edition[] {
  return Get_Available_Translations(Base_Directory_Path);
}

export function Get_Available_Transliterations(
  Base_Directory_Path: string = Asset_Corpus_Directory_Path
): Edition[] {
  return Scan_Language_Editions(
    Path_Module.join(Base_Directory_Path, "Hadith", "Transliteration")
  );
}

export function Get_Available_KBK_Transliterations(
  Base_Directory_Path: string = Asset_Corpus_Directory_Path
): Edition[] {
  return Get_Available_Transliterations(Base_Directory_Path);
}