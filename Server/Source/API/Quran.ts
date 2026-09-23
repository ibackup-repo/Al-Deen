import Path_Module from "path";
import File_System from "fs";
import { fileURLToPath as File_URL_To_Path } from "url";
import Database from "better-sqlite3";

export interface Surah {
  Surah: number;
  Arabic: string;
  Translation: string;
  Transliteration: string;
  Revelation_Place: string | null;
  Revelation_Order: number | null;
  Ayah_Count: number;
  Start_Page: number;
  End_Page: number;
  Indo_Pak_Ayah_Ending: string[];
  Layout: Record<string, any> | null;
}

export interface Ayah {
  Surah: number;
  Ayah: number;
  Arabic: string;
  Presentation_Form_A_Ligature_Based?: string | null;
  Presentation_Form_A_Glyph_Based?: string | null;
}

export interface Kalimah {
  Surah: number;
  Ayah: number;
  Kalimah: number;
  Arabic: string;
  Presentation_Form_A_Ligature_Based?: string | null;
  Presentation_Form_A_Glyph_Based?: string | null;
}

export interface Page {
  Page: number;
  Start_Surah: number;
  Start_Ayah: number;
  Start_Kalimah: number;
  End_Surah: number;
  End_Ayah: number;
  End_Kalimah: number;
}

export interface Translation {
  Surah: number;
  Ayah: number;
  Text: string;
  Edition: string;
}

export interface KBK_Translation {
  Surah: number;
  Ayah: number;
  Kalimah: number;
  Text: string;
  Edition: string;
}

export interface Footnote {
  Surah: number;
  Footnote: number;
  Text: string;
  Edition: string;
}

export interface Transliteration {
  Surah: number;
  Ayah: number;
  Text: string;
  Edition: string;
}

export interface KBK_Transliteration {
  Surah: number;
  Ayah: number;
  Kalimah: number;
  Text: string;
  Edition: string;
}

export interface Surah_Output {
  Surah: Surah;
  Ayaat: Ayah[];
  Kalimaat: Kalimah[];
  Pages: Page[];
}

export interface Translation_Output {
  Translations: Translation[];
  KBK_Translations?: KBK_Translation[];
  Footnotes: Footnote[];
}

export interface Transliteration_Output {
  Transliterations: Transliteration[];
  Word_By_Word_Transliterations?: KBK_Transliteration[];
}

export interface Page_Range {
  Surah: number;
  Start_Ayah: number;
  End_Ayah: number;
  Start_Kalimah: number;
  End_Kalimah: number;
}

export type Page_Range_Map = Record<number, Page_Range[]>;

export interface Edition {
  ID: string;
  Name: string;
  Language: string;
}

const File_Name: string = File_URL_To_Path(import.meta.url);
const Directory_Name: string = Path_Module.dirname(File_Name);

const Asset_Corpus_Directory_Path: string = Path_Module.resolve(
  Directory_Name,
  "..",
  "..",
  "Asset",
  "Corpus"
);

const Core_Database_Path: string = Path_Module.join(Asset_Corpus_Directory_Path, "Quran", "Core.db");

if (!File_System.existsSync(Core_Database_Path)) {
  console.error(`[QURAN API ERROR] Missing database at: ${Core_Database_Path}`);
}

const Core_Database_Instance = new Database(Core_Database_Path, { readonly: true });
Core_Database_Instance.pragma("journal_mode = WAL");

const Select_All_Suwar_Statement = Core_Database_Instance.prepare(
  `SELECT 
    Surah, Arabic, Translation, Transliteration,
    Revelation_Place, Revelation_Order, Ayah_Count,
    Start_Page, End_Page, Indo_Pak_Ayah_Ending, Layout
  FROM Surah ORDER BY Surah ASC`
);

const Select_Surah_By_Number_Statement = Core_Database_Instance.prepare(
  `SELECT 
    Surah, Arabic, Translation, Transliteration,
    Revelation_Place, Revelation_Order, Ayah_Count,
    Start_Page, End_Page, Indo_Pak_Ayah_Ending, Layout
  FROM Surah WHERE Surah = ?`
);

const Select_Ayaat_By_Surah_Statement = Core_Database_Instance.prepare(
  `SELECT 
    Surah, Ayah, Arabic,
    Presentation_Form_A_Ligature_Based,
    Presentation_Form_A_Glyph_Based
  FROM Ayah WHERE Surah = ? ORDER BY Ayah ASC`
);

const Select_Kalimaat_By_Surah_Statement = Core_Database_Instance.prepare(
  `SELECT 
    Surah, Ayah, Kalimah, Arabic,
    Presentation_Form_A_Ligature_Based,
    Presentation_Form_A_Glyph_Based
  FROM Kalimah WHERE Surah = ? ORDER BY Ayah ASC, Kalimah ASC`
);

const Select_All_Pages_Statement = Core_Database_Instance.prepare(
  `SELECT 
    Page, Start_Surah, Start_Ayah, Start_Kalimah,
    End_Surah, End_Ayah, End_Kalimah
  FROM Page ORDER BY Page ASC`
);

const Select_Pages_By_Surah_Statement = Core_Database_Instance.prepare(
  `SELECT 
    Page, Start_Surah, Start_Ayah, Start_Kalimah,
    End_Surah, End_Ayah, End_Kalimah
  FROM Page 
  WHERE Start_Surah <= ? AND End_Surah >= ?
  ORDER BY Page ASC`
);

const Select_Ayah_Counts_Per_Surah_Statement = Core_Database_Instance.prepare(
  `SELECT Surah, Ayah_Count FROM Surah`
);

function Format_Surah(Entry_Object: Record<string, any>): Surah {
  return {
    ...Entry_Object,
    Indo_Pak_Ayah_Ending: Entry_Object.Indo_Pak_Ayah_Ending
      ? JSON.parse(Entry_Object.Indo_Pak_Ayah_Ending)
      : [],
    Layout: Entry_Object.Layout ? JSON.parse(Entry_Object.Layout) : null,
  };
}

export function Fetch_Surah(
  Surah_Number: number,
  Font_Type: string = "Standard"
): Surah_Output | null {
  const Surah_Entry = Select_Surah_By_Number_Statement.get(Surah_Number) as Record<string, any> | undefined;
  if (!Surah_Entry) return null;

  let Ayaat_Local = Select_Ayaat_By_Surah_Statement.all(Surah_Number) as Ayah[];
  let Kalimaat_Local = Select_Kalimaat_By_Surah_Statement.all(Surah_Number) as Kalimah[];
  const Pages_Local = Select_Pages_By_Surah_Statement.all(Surah_Number, Surah_Number) as Page[];

  if (Font_Type === "V1" || Font_Type === "V2") {
    const Target_Field_Name =
      Font_Type === "V1"
        ? "Presentation_Form_A_Ligature_Based"
        : "Presentation_Form_A_Glyph_Based";

    Ayaat_Local = Ayaat_Local.map((Ayah_Item) => ({ ...Ayah_Item, Arabic: Ayah_Item[Target_Field_Name] || Ayah_Item.Arabic }));
    Kalimaat_Local = Kalimaat_Local.map((Kalimah_Item) => ({ ...Kalimah_Item, Arabic: Kalimah_Item[Target_Field_Name] || Kalimah_Item.Arabic }));
  }

  return {
    Surah: Format_Surah(Surah_Entry),
    Ayaat: Ayaat_Local,
    Kalimaat: Kalimaat_Local,
    Pages: Pages_Local,
  };
}

export function Fetch_Surah_Translation(
  Surah_Number: number,
  Translation_Editions: string | string[] = [],
  Include_WBW: boolean = false
): Translation_Output {
  const Target_Editions_Array = Array.isArray(Translation_Editions)
    ? Translation_Editions.filter(Boolean)
    : Translation_Editions
    ? [Translation_Editions]
    : [];

  const Translations_Local: Translation[] = [];
  const Word_By_Word_Translations_Local: KBK_Translation[] = [];
  const Footnotes_Local: Footnote[] = [];

  for (const Target_Item of Target_Editions_Array) {
    const Clean_Target_String = Target_Item.replace(/\.db$/, "");
    const Normalized_Subpath_String = Clean_Target_String.replace(/[\/\.]/g, Path_Module.sep);

    let Full_Database_Path = Path_Module.join(
      Asset_Corpus_Directory_Path,
      "Quran",
      "Translation",
      `${Normalized_Subpath_String}.db`
    );

    if (!File_System.existsSync(Full_Database_Path)) {
      Full_Database_Path = Path_Module.join(
        Asset_Corpus_Directory_Path,
        "Quran",
        "Translation",
        `${Clean_Target_String}.db`
      );
    }

    if (!File_System.existsSync(Full_Database_Path)) {
      console.warn(`[QURAN API WARNING] Translation DB not found at ${Full_Database_Path}`);
      continue;
    }

    try {
      const Database_Instance = new Database(Full_Database_Path, { readonly: true });
      const Edition_Identifier = Clean_Target_String;

      const Has_Ayah_Table = Database_Instance
        .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='Ayah'`)
        .get();

      if (Has_Ayah_Table) {
        const Select_Ayah_Statement = Database_Instance.prepare(
          `SELECT Surah, Ayah, text FROM Ayah WHERE Surah = ? ORDER BY Ayah ASC`
        );
        const Ayah_Rows_Array = Select_Ayah_Statement.all(Surah_Number) as any[];
        Translations_Local.push(
          ...Ayah_Rows_Array.map((Ayah_Row_Item) => ({
            Surah: Ayah_Row_Item.Surah,
            Ayah: Ayah_Row_Item.Ayah,
            Text: Ayah_Row_Item.Text,
            Edition: Edition_Identifier,
          }))
        );
      }

      if (Include_WBW) {
        const Has_Kalimah_Table = Database_Instance
          .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='Kalimah'`)
          .get();

        if (Has_Kalimah_Table) {
          const Select_Kalimah_Statement = Database_Instance.prepare(
            `SELECT Surah, Ayah, Kalimah, text FROM Kalimah WHERE Surah = ? ORDER BY Ayah ASC, Kalimah ASC`
          );
          const Kalimah_Rows_Array = Select_Kalimah_Statement.all(Surah_Number) as any[];

          Word_By_Word_Translations_Local.push(
            ...Kalimah_Rows_Array.map((Kalimah_Row_Item) => ({
              Surah: Kalimah_Row_Item.Surah,
              Ayah: Kalimah_Row_Item.Ayah,
              Kalimah: Kalimah_Row_Item.Kalimah,
              Text: Kalimah_Row_Item.Text,
              Edition: Edition_Identifier,
            }))
          );
        }
      }

      const Has_Footnote_Table = Database_Instance
        .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='Footnote'`)
        .get();

      if (Has_Footnote_Table) {
        const Select_Footnote_Statement = Database_Instance.prepare(
          `SELECT Surah, Footnote, text FROM Footnote WHERE Surah = ? ORDER BY Footnote ASC`
        );
        const Footnote_Rows_Array = Select_Footnote_Statement.all(Surah_Number) as any[];
        Footnotes_Local.push(
          ...Footnote_Rows_Array.map((Footnote_Row_Item) => ({
            Surah: Footnote_Row_Item.Surah,
            Footnote: Footnote_Row_Item.Footnote,
            Text: Footnote_Row_Item.Text,
            Edition: Edition_Identifier,
          }))
        );
      }

      Database_Instance.close();
    } catch (Error_Object) {
      console.error(
        `[QURAN API ERROR] Failed to query Translation DB at ${Full_Database_Path}:`,
        Error_Object
      );
    }
  }

  return {
    Translations: Translations_Local,
    ...(Include_WBW ? { KBK_Translations: Word_By_Word_Translations_Local } : {}),
    Footnotes: Footnotes_Local,
  };
}

export function Fetch_Surah_Transliteration(
  Surah_Number: number,
  Transliteration_Editions: string | string[] = [],
  Include_WBW: boolean = false
): Transliteration_Output {
  const Target_Editions_Array = Array.isArray(Transliteration_Editions)
    ? Transliteration_Editions.filter(Boolean)
    : Transliteration_Editions
    ? [Transliteration_Editions]
    : [];

  const Transliterations_Local: Transliteration[] = [];
  const Word_By_Word_Transliterations_Local: KBK_Transliteration[] = [];

  for (const Target_Item of Target_Editions_Array) {
    const Relative_Database_Path = Target_Item.endsWith(".db") ? Target_Item : `${Target_Item}.db`;
    const Full_Database_Path = Path_Module.join(
      Asset_Corpus_Directory_Path,
      "Quran",
      "Transliteration",
      Relative_Database_Path
    );

    if (!File_System.existsSync(Full_Database_Path)) continue;

    try {
      const Database_Instance = new Database(Full_Database_Path, { readonly: true });
      const Edition_Identifier = Target_Item.replace(/\.db$/, "");

      const Has_Ayah_Table = Database_Instance
        .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='Ayah'`)
        .get();

      if (Has_Ayah_Table) {
        const Select_Ayah_Statement = Database_Instance.prepare(
          `SELECT Surah, Ayah, text FROM Ayah WHERE Surah = ? ORDER BY Ayah ASC`
        );
        const Ayah_Rows_Array = Select_Ayah_Statement.all(Surah_Number) as any[];
        Transliterations_Local.push(
          ...Ayah_Rows_Array.map((Ayah_Row_Item) => ({
            Surah: Ayah_Row_Item.Surah,
            Ayah: Ayah_Row_Item.Ayah,
            Text: Ayah_Row_Item.Text,
            Edition: Edition_Identifier,
          }))
        );
      }

      if (Include_WBW) {
        const Has_Kalimah_Table = Database_Instance
          .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='Kalimah'`)
          .get();

        if (Has_Kalimah_Table) {
          const Select_Kalimah_Statement = Database_Instance.prepare(
            `SELECT Surah, Ayah, Kalimah, text FROM Kalimah WHERE Surah = ? ORDER BY Ayah ASC, Kalimah ASC`
          );
          const Kalimah_Rows_Array = Select_Kalimah_Statement.all(Surah_Number) as any[];
          Word_By_Word_Transliterations_Local.push(
            ...Kalimah_Rows_Array.map((Kalimah_Row_Item) => ({
              Surah: Kalimah_Row_Item.Surah,
              Ayah: Kalimah_Row_Item.Ayah,
              Kalimah: Kalimah_Row_Item.Kalimah,
              Text: Kalimah_Row_Item.Text,
              Edition: Edition_Identifier,
            }))
          );
        }
      }

      Database_Instance.close();
    } catch (Error_Object) {
      console.error(
        `[QURAN API ERROR] Failed to query Transliteration DB at ${Full_Database_Path}:`,
        Error_Object
      );
    }
  }

  return {
    Transliterations: Transliterations_Local,
    ...(Include_WBW ? { Word_By_Word_Transliterations: Word_By_Word_Transliterations_Local } : {}),
  };
}

export function Fetch_Quran_Suwar(): Surah[] {
  const Entries_Array = Select_All_Suwar_Statement.all() as Record<string, any>[];
  return Entries_Array.map(Format_Surah);
}

export function Fetch_Pages(): Page[] {
  return Select_All_Pages_Statement.all() as Page[];
}

export function Fetch_Page_Ranges(): Page_Range_Map {
  const Pages_Local = Select_All_Pages_Statement.all() as Page[];
  const Surah_Ayah_Counts_Map = new Map<number, number>();

  (Select_Ayah_Counts_Per_Surah_Statement.all() as any[]).forEach((Surah_Count_Item) =>
    Surah_Ayah_Counts_Map.set(Surah_Count_Item.Surah, Surah_Count_Item.Ayah_Count)
  );

  const Page_Range_Map_Local: Page_Range_Map = {};

  for (const Page_Entry of Pages_Local) {
    const Page_Ranges_Local: Page_Range[] = [];
    const {
      Start_Surah,
      Start_Ayah,
      Start_Kalimah,
      End_Surah,
      End_Ayah,
      End_Kalimah,
    } = Page_Entry;

    if (Start_Surah === End_Surah) {
      Page_Ranges_Local.push({
        Surah: Start_Surah,
        Start_Ayah,
        End_Ayah,
        Start_Kalimah,
        End_Kalimah,
      });
    } else {
      Page_Ranges_Local.push({
        Surah: Start_Surah,
        Start_Ayah,
        End_Ayah: Surah_Ayah_Counts_Map.get(Start_Surah) ?? Start_Ayah,
        Start_Kalimah,
        End_Kalimah: 0,
      });

      for (let Surah_Index = Start_Surah + 1; Surah_Index < End_Surah; Surah_Index++) {
        Page_Ranges_Local.push({
          Surah: Surah_Index,
          Start_Ayah: 1,
          End_Ayah: Surah_Ayah_Counts_Map.get(Surah_Index) ?? 1,
          Start_Kalimah: 1,
          End_Kalimah: 0,
        });
      }

      Page_Ranges_Local.push({
        Surah: End_Surah,
        Start_Ayah: 1,
        End_Ayah,
        Start_Kalimah: 1,
        End_Kalimah,
      });
    }

    Page_Range_Map_Local[Page_Entry.Page] = Page_Ranges_Local;
  }

  return Page_Range_Map_Local;
}

function Prettify_Name(Raw_Name_String: string): string {
  return Raw_Name_String.replace(/[-_]+/g, " ").trim();
}

function Format_Editions(Relative_Path_String: string): Edition {
  const Edition_Identifier = Relative_Path_String.replace(/\.db$/, "");
  const Path_Segments_Array = Edition_Identifier.split("/");
  const Language_String = Path_Segments_Array.length > 1 ? Path_Segments_Array[0] : Edition_Identifier;
  const Target_File_Name = Path_Segments_Array[Path_Segments_Array.length - 1];

  return {
    ID: Edition_Identifier,
    Name: Prettify_Name(Target_File_Name),
    Language: Language_String,
  };
}

function Scan_Editions(
  Root_Path: string,
  Required_Table_Name: "Ayah" | "Kalimah"
): Edition[] {
  const Result_Editions_Array: Edition[] = [];
  if (!File_System.existsSync(Root_Path)) return Result_Editions_Array;

  function Traverse_Directory_Tree(Current_Directory: string, Relative_Directory: string): void {
    const Directory_Entries_Array = File_System.readdirSync(Current_Directory, { withFileTypes: true });

    for (const Entry_Item of Directory_Entries_Array) {
      const Full_Entry_Path = Path_Module.join(Current_Directory, Entry_Item.name);
      const Relative_Entry_Path = Relative_Directory ? `${Relative_Directory}/${Entry_Item.name}` : Entry_Item.name;

      if (Entry_Item.isDirectory()) {
        Traverse_Directory_Tree(Full_Entry_Path, Relative_Entry_Path);
      } else if (Entry_Item.isFile() && Entry_Item.name.endsWith(".db")) {
        try {
          const Database_Instance = new Database(Full_Entry_Path, { readonly: true });
          const Has_Target_Table = Database_Instance
            .prepare(
              `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
            )
            .get(Required_Table_Name);
          Database_Instance.close();

          if (Has_Target_Table) {
            Result_Editions_Array.push(Format_Editions(Relative_Entry_Path));
          }
        } catch (Error_Object) {
          console.error(`[QURAN API ERROR] Could not check DB schema at ${Full_Entry_Path}:`, Error_Object);
        }
      }
    }
  }

  Traverse_Directory_Tree(Root_Path, "");
  return Result_Editions_Array;
}

export function Get_Available_Translations(
  Base_Directory_Path: string = Asset_Corpus_Directory_Path
): Edition[] {
  return Scan_Editions(Path_Module.join(Base_Directory_Path, "Quran", "Translation"), "Ayah");
}

export function Get_Available_KBK_Translations(
  Base_Directory_Path: string = Asset_Corpus_Directory_Path
): Edition[] {
  return Scan_Editions(Path_Module.join(Base_Directory_Path, "Quran", "Translation"), "Kalimah");
}

export function Get_Available_Transliterations(
  Base_Directory_Path: string = Asset_Corpus_Directory_Path
): Edition[] {
  return Scan_Editions(Path_Module.join(Base_Directory_Path, "Quran", "Transliteration"), "Ayah");
}

export function Get_Available_KBK_Transliterations(
  Base_Directory_Path: string = Asset_Corpus_Directory_Path
): Edition[] {
  return Scan_Editions(Path_Module.join(Base_Directory_Path, "Quran", "Transliteration"), "Kalimah");
}

process.on("SIGINT", () => {
  Core_Database_Instance.close();
  process.exit(0);
});