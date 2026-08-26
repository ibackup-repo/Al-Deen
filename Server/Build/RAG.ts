import * as File_System_Module from "node:fs";
import * as Path_Module from "node:path";
import { fileURLToPath as File_URL_To_Path } from "node:url";
import { DatabaseSync as Database_Sync } from "node:sqlite";

const File_Name_Path: string = File_URL_To_Path(import.meta.url);
const Directory_Name_Path: string = Path_Module.dirname(File_Name_Path);

const Command_Line_Arguments: string[] = process.argv.slice(2);
const Should_Force_Execution: boolean = Command_Line_Arguments.includes("--force");

// Directory Paths
const Base_Hadith_Directory_Path: string = Path_Module.join(
  Directory_Name_Path,
  "../Data/Hadith"
);
const Arabic_Hadith_Directory_Path: string = Path_Module.join(
  Base_Hadith_Directory_Path,
  "Arabic"
);

const Base_Quran_Directory_Path: string = Path_Module.join(
  Directory_Name_Path,
  "../Data/Quran"
);
const Quran_Suwar_Directory_Path: string = Path_Module.join(
  Base_Quran_Directory_Path,
  "Surah"
);
const Quran_Metadata_Directory_Path: string = Path_Module.join(
  Base_Quran_Directory_Path,
  "Meta"
);

const Output_Directory_Path: string = Path_Module.join(
  Directory_Name_Path,
  "../Asset/Corpus"
);
const Output_File_Path: string = Path_Module.join(
  Output_Directory_Path,
  "RAG.db"
);

// Helper Functions
function Get_JavaScript_Object_Notation_Files(
  Target_Directory_Path: string
): string[] {
  let File_List_Results: string[] = [];
  if (!File_System_Module.existsSync(Target_Directory_Path)) return File_List_Results;

  const Directory_Entries: string[] = File_System_Module.readdirSync(Target_Directory_Path);
  Directory_Entries.forEach((File_Or_Folder_Name: string) => {
    const Full_Item_Path: string = Path_Module.join(Target_Directory_Path, File_Or_Folder_Name);
    if (File_System_Module.statSync(Full_Item_Path).isDirectory()) {
      File_List_Results = File_List_Results.concat(
        Get_JavaScript_Object_Notation_Files(Full_Item_Path)
      );
    } else if (File_Or_Folder_Name.endsWith(".json")) {
      File_List_Results.push(Full_Item_Path);
    }
  });

  return File_List_Results;
}

function Read_JavaScript_Object_Notation_Array(
  Target_File_Path: string,
  Is_Word_By_Word_Format: boolean = false
): string {
  if (!File_System_Module.existsSync(Target_File_Path)) return "";
  try {
    const Parsed_File_Content: unknown = JSON.parse(
      File_System_Module.readFileSync(Target_File_Path, "utf-8")
    );
    if (!Array.isArray(Parsed_File_Content)) return "";

    const String_Elements: string[] = Parsed_File_Content.filter(
      (Array_Item: unknown): Array_Item is string => typeof Array_Item === "string"
    );

    return Is_Word_By_Word_Format
      ? String_Elements.join(" ")
      : String_Elements.join("\n");
  } catch {
    return "";
  }
}

function Strip_Hypertext_Markup_Language(Source_Markup_String: string): string {
  return Source_Markup_String
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Safely converts any JSON value into a valid SQLite parameter (string, number, or null)
function Sanitize_Database_Parameter(
  Parameter_Value: unknown
): string | number | null {
  if (Parameter_Value === undefined || Parameter_Value === null) return "";
  if (
    typeof Parameter_Value === "string" ||
    typeof Parameter_Value === "number"
  ) {
    return Parameter_Value;
  }
  if (typeof Parameter_Value === "object") {
    return Array.isArray(Parameter_Value)
      ? Parameter_Value.join(" ")
      : JSON.stringify(Parameter_Value);
  }
  return String(Parameter_Value);
}

async function Build_Unified_Retrieval_Augmented_Generation(): Promise<void> {
  console.log(
    `Starting Unified Quran + Hadith RAG DB Compilation... [Force: ${Should_Force_Execution}]`
  );

  if (!File_System_Module.existsSync(Output_Directory_Path)) {
    File_System_Module.mkdirSync(Output_Directory_Path, { recursive: true });
  }

  if (File_System_Module.existsSync(Output_File_Path)) {
    if (Should_Force_Execution) {
      File_System_Module.unlinkSync(Output_File_Path);
      console.log(`Deleted existing database: ${Output_File_Path}`);
    } else {
      console.log(
        `Database ${Output_File_Path} already exists. Use --force to overwrite.`
      );
      return;
    }
  }

  const Database_Instance = new Database_Sync(Output_File_Path);
  Database_Instance.exec("PRAGMA journal_mode = WAL;");
  Database_Instance.exec("PRAGMA synchronous = NORMAL;");

  // Schema Definition
  Database_Instance.exec(`
    CREATE TABLE IF NOT EXISTS hadiths (
      id TEXT PRIMARY KEY,
      grade TEXT,
      collection TEXT,
      book TEXT,
      hadith_number TEXT,
      relative_path TEXT,
      text_arabic TEXT,
      text_english TEXT,
      text_wbw TEXT,
      text_transliteration TEXT,
      embedding_input TEXT,
      embedding_blob BLOB
    );

    CREATE TABLE IF NOT EXISTS quran_verses (
      id TEXT PRIMARY KEY,
      surah_number INTEGER,
      ayah_number INTEGER,
      surah_name_en TEXT,
      surah_name_transliteration TEXT,
      text_arabic TEXT,
      text_english TEXT,
      text_transliteration TEXT,
      tafsir_ibn_kathir TEXT,
      embedding_input TEXT,
      embedding_blob BLOB
    );

    CREATE INDEX IF NOT EXISTS idx_hadith_lookup ON hadiths(collection, book, hadith_number);
    CREATE INDEX IF NOT EXISTS idx_quran_lookup ON quran_verses(surah_number, ayah_number);
  `);

  Database_Instance.exec("BEGIN TRANSACTION;");

  // ----------------------------------------------------
  // 1. INGEST HADITH DATA
  // ----------------------------------------------------
  if (File_System_Module.existsSync(Arabic_Hadith_Directory_Path)) {
    console.log("Processing Hadith Hadith_Collections_List...");
    const Hadith_Insert_Statement = Database_Instance.prepare(`
      INSERT INTO hadiths (
        id, grade, collection, book, hadith_number, relative_path,
        text_arabic, text_english, text_wbw, text_transliteration, embedding_input
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const Arabic_File_Paths_List: string[] = Get_JavaScript_Object_Notation_Files(
      Arabic_Hadith_Directory_Path
    );
    let Processed_Hadith_Count: number = 0;

    for (const Arabic_File_Path of Arabic_File_Paths_List) {
      const Relative_File_Path: string = Path_Module.relative(
        Arabic_Hadith_Directory_Path,
        Arabic_File_Path
      );
      const Path_Parts_List: string[] = Relative_File_Path.split(Path_Module.sep);

      const Grade_Name: string = Path_Parts_List[0] || "";
      const Collection_Name: string = Path_Parts_List[1] || "";
      const Book_Name: string = Path_Parts_List[2] || "";
      const Hadith_Number_String: string = Path_Module.basename(
        Path_Parts_List[Path_Parts_List.length - 1],
        ".json"
      );

      const English_File_Path: string = Path_Module.join(
        Base_Hadith_Directory_Path,
        "Translation",
        "English",
        Relative_File_Path
      );
      const Word_By_Word_File_Path: string = Path_Module.join(
        Base_Hadith_Directory_Path,
        "Translation",
        "WBW",
        "English",
        Relative_File_Path
      );
      const Transliteration_File_Path: string = Path_Module.join(
        Base_Hadith_Directory_Path,
        "Transliteration",
        "Academic",
        Relative_File_Path
      );

      const Arabic_Text_Content: string = Read_JavaScript_Object_Notation_Array(Arabic_File_Path);
      const English_Text_Content: string = Read_JavaScript_Object_Notation_Array(English_File_Path);
      const Word_By_Word_Text_Content: string = Read_JavaScript_Object_Notation_Array(
        Word_By_Word_File_Path,
        true
      );
      const Transliteration_Text_Content: string = Read_JavaScript_Object_Notation_Array(
        Transliteration_File_Path,
        true
      );

      const Entity_Identifier: string = `Hadith-${Grade_Name}-${Collection_Name}-${Book_Name}-${Hadith_Number_String}`.toLowerCase();
      const Embedding_Input_Context: string = `Collection: ${Collection_Name} | Book: ${Book_Name} | Hadith: ${Hadith_Number_String}\nEnglish: ${English_Text_Content}\nArabic: ${Arabic_Text_Content}`;

      try {
        Hadith_Insert_Statement.run(
          Sanitize_Database_Parameter(Entity_Identifier),
          Sanitize_Database_Parameter(Grade_Name),
          Sanitize_Database_Parameter(Collection_Name),
          Sanitize_Database_Parameter(Book_Name),
          Sanitize_Database_Parameter(Hadith_Number_String),
          Sanitize_Database_Parameter(Relative_File_Path),
          Sanitize_Database_Parameter(Arabic_Text_Content),
          Sanitize_Database_Parameter(English_Text_Content),
          Sanitize_Database_Parameter(Word_By_Word_Text_Content),
          Sanitize_Database_Parameter(Transliteration_Text_Content),
          Sanitize_Database_Parameter(Embedding_Input_Context)
        );
        Processed_Hadith_Count++;
      } catch (Execution_Error) {
        console.error(
          `❌ error inserting Hadith: ${Relative_File_Path}`,
          Execution_Error
        );
      }
    }
    console.log(`Ingested ${Processed_Hadith_Count} Hadith records.`);
  }

  // ----------------------------------------------------
  // 2. INGEST QURAN DATA
  // ----------------------------------------------------
  if (File_System_Module.existsSync(Quran_Suwar_Directory_Path)) {
    console.log("Processing Quran Suwar, Translations, and Tafsir...");

    const Surah_Translation_Metadata_File_Path: string = Path_Module.join(
      Quran_Metadata_Directory_Path,
      "Surah",
      "Translation.json"
    );
    const Surah_Transliteration_Metadata_File_Path: string = Path_Module.join(
      Quran_Metadata_Directory_Path,
      "Surah",
      "Transliteration.json"
    );

    const Surah_English_Names_List: string[] = File_System_Module.existsSync(
      Surah_Translation_Metadata_File_Path
    )
      ? JSON.parse(
          File_System_Module.readFileSync(
            Surah_Translation_Metadata_File_Path,
            "utf-8"
          )
        )
      : [];
    const Surah_Transliteration_Names_List: string[] = File_System_Module.existsSync(
      Surah_Transliteration_Metadata_File_Path
    )
      ? JSON.parse(
          File_System_Module.readFileSync(
            Surah_Transliteration_Metadata_File_Path,
            "utf-8"
          )
        )
      : [];

    const Quran_Insert_Statement = Database_Instance.prepare(`
      INSERT INTO quran_verses (
        id, surah_number, ayah_number, surah_name_en, surah_name_transliteration,
        text_arabic, text_english, text_transliteration, tafsir_ibn_kathir, embedding_input
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let Processed_Ayaat_Count: number = 0;

    for (let Surah_Number = 1; Surah_Number <= 114; Surah_Number++) {
      const Arabic_Surah_File_Path: string = Path_Module.join(
        Quran_Suwar_Directory_Path,
        `${Surah_Number}.json`
      );
      if (!File_System_Module.existsSync(Arabic_Surah_File_Path)) continue;

      let Arabic_Ayaat_Collection: string[] = [];
      try {
        Arabic_Ayaat_Collection = JSON.parse(
          File_System_Module.readFileSync(Arabic_Surah_File_Path, "utf-8")
        );
      } catch {
        console.error(
          `❌ Failed parsing Arabic file for Surah ${Surah_Number}: ${Arabic_Surah_File_Path}`
        );
        continue;
      }

      const English_Surah_File_Path: string = Path_Module.join(
        Quran_Suwar_Directory_Path,
        "Translation",
        "English",
        "Saheeh-International",
        `${Surah_Number}.json`
      );
      const English_Ayaat_Collection: string[] = File_System_Module.existsSync(
        English_Surah_File_Path
      )
        ? JSON.parse(
            File_System_Module.readFileSync(English_Surah_File_Path, "utf-8")
          )
        : [];

      const Transliteration_Surah_File_Path: string = Path_Module.join(
        Quran_Suwar_Directory_Path,
        "Transliteration",
        "Standard",
        `${Surah_Number}.json`
      );
      const Transliteration_Ayaat_Collection: string[] = File_System_Module.existsSync(
        Transliteration_Surah_File_Path
      )
        ? JSON.parse(
            File_System_Module.readFileSync(
              Transliteration_Surah_File_Path,
              "utf-8"
            )
          )
        : [];

      const Surah_English_Name: string =
        Surah_English_Names_List[Surah_Number - 1] || "";
      const Surah_Transliteration_Name: string =
        Surah_Transliteration_Names_List[Surah_Number - 1] || "";

      for (
        let Ayah_Index = 0;
        Ayah_Index < Arabic_Ayaat_Collection.length;
        Ayah_Index++
      ) {
        const Ayah_ID: number = Ayah_Index + 1;
        const Arabic_Ayah_Text: string = Arabic_Ayaat_Collection[Ayah_Index];
        const English_Ayah_Text: string = English_Ayaat_Collection[Ayah_Index];
        const Transliteration_Ayah_Text: string =
          Transliteration_Ayaat_Collection[Ayah_Index];

        const Tafsir_File_Path: string = Path_Module.join(
          Quran_Suwar_Directory_Path,
          "Tafsir",
          "English",
          "Ibn-Kathir",
          `${Surah_Number}`,
          `${Ayah_ID}.json`
        );
        let Tafsir_Text_Content: string = "";
        if (File_System_Module.existsSync(Tafsir_File_Path)) {
          const Raw_Tafsir_Content: string = Read_JavaScript_Object_Notation_Array(
            Tafsir_File_Path
          );
          Tafsir_Text_Content = Strip_Hypertext_Markup_Language(
            Raw_Tafsir_Content
          );
        }

        const Verse_Entity_Identifier: string = `Quran-${Surah_Number}-${Ayah_ID}`;
        const Embedding_Input_Context: string = `Surah: ${Surah_Transliteration_Name} (${Surah_English_Name}) [${Surah_Number}:${Ayah_ID}]\nVerse: ${English_Ayah_Text}\nArabic: ${Arabic_Ayah_Text}`;

        // Prepared binding parameters
        const Parameter_List = [
          Sanitize_Database_Parameter(Verse_Entity_Identifier),
          Sanitize_Database_Parameter(Surah_Number),
          Sanitize_Database_Parameter(Ayah_ID),
          Sanitize_Database_Parameter(Surah_English_Name),
          Sanitize_Database_Parameter(Surah_Transliteration_Name),
          Sanitize_Database_Parameter(Arabic_Ayah_Text),
          Sanitize_Database_Parameter(English_Ayah_Text),
          Sanitize_Database_Parameter(Transliteration_Ayah_Text),
          Sanitize_Database_Parameter(Tafsir_Text_Content),
          Sanitize_Database_Parameter(Embedding_Input_Context),
        ];

        try {
          Quran_Insert_Statement.run(...Parameter_List);
          Processed_Ayaat_Count++;
        } catch (Execution_Error) {
          console.error(`\n================ DEBUG LOG ================`);
          console.error(
            `❌ error inserting Ayah ${Surah_Number}:${Ayah_ID}`
          );
          console.error(
            `Transliteration File: ${Transliteration_Surah_File_Path}`
          );
          console.error(
            `Raw Transliteration Value at [${Ayah_Index}]:`,
            Transliteration_Ayah_Text,
            `(Type: ${typeof Transliteration_Ayah_Text})`
          );
          console.error(
            `Sanitized Parameter List:`,
            Parameter_List.map(
              (Parameter_Value, Index_Identifier) =>
                `[Param ${Index_Identifier + 1} (${typeof Parameter_Value})]: ${String(
                  Parameter_Value
                ).slice(0, 30)}`
            )
          );
          console.error(`error details:`, Execution_Error);
          console.error(`===========================================\n`);
        }
      }
    }
    console.log(
      `Ingested ${Processed_Ayaat_Count} Quran Ayaat across 114 Suwar.`
    );
  }

  Database_Instance.exec("COMMIT;");
  Database_Instance.close();

  console.log(`Unified database generated at: ${Output_File_Path}`);
}

Build_Unified_Retrieval_Augmented_Generation().catch(
  (Execution_Error: unknown) => {
    console.error("Execution failed:", Execution_Error);
  }
);