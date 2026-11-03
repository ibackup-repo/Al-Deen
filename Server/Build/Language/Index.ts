import path from "path";
import fs from "fs";
import { DATA_DIR, OUTPUT_DIR, SUPPORTED_LANGUAGES } from "./Config.js";
import {
  Walk_Directory,
  Parse_Vocabulary_File,
  Parse_Grammar_File,
  Parse_Lesson_File,
  VocabularyEntry,
  GrammarEntry,
  LessonEntry
} from "./Utility/Parse.js";
import { Build_Vocabulary_DB } from "./DB/Vocabulary.js";
import { Build_Grammar_DB } from "./DB/Grammar.js";
import { Build_Lesson_DB } from "./DB/Lesson.js";

function Build_Language_Databases() {
  console.log("🚀 Building Language SQLite Databases...");

  for (const language of SUPPORTED_LANGUAGES) {
    const langSourceDir = path.join(DATA_DIR, language);
    const langOutputDir = path.join(OUTPUT_DIR, language);

    if (!fs.existsSync(langSourceDir)) {
      console.warn(`[Skip] Missing directory: ${langSourceDir}`);
      continue;
    }

    fs.mkdirSync(langOutputDir, { recursive: true });

    // 1. Build Vocabulary.db
    const vocabDir = path.join(langSourceDir, "Vocabulary");
    if (fs.existsSync(vocabDir)) {
      const files = Walk_Directory(vocabDir);
      const entries: VocabularyEntry[] = files
        .map((file) => {
          const rel = path.relative(vocabDir, file).split(path.sep);
          const category = rel[0] ?? "Default";
          const subcategory = rel.length > 2 ? rel[1] : "Default";
          return Parse_Vocabulary_File(file, category, subcategory);
        })
        .filter((entry): entry is VocabularyEntry => entry !== null);

      Build_Vocabulary_DB(path.join(langOutputDir, "Vocabulary.db"), entries);
      console.log(`✓ Built ${language}/Vocabulary.db (${entries.length} entries)`);
    }

    // 2. Build Grammar.db
    const grammarDir = path.join(langSourceDir, "Grammar");
    if (fs.existsSync(grammarDir)) {
      const files = Walk_Directory(grammarDir);
      const entries: GrammarEntry[] = files
        .map((file) => {
          const rel = path.relative(grammarDir, file).split(path.sep);
          const category = rel[0] ?? "Default";
          const subcategory = rel.length > 2 ? rel[1] : "Default";
          return Parse_Grammar_File(file, category, subcategory);
        })
        .filter((entry): entry is GrammarEntry => entry !== null);

      Build_Grammar_DB(path.join(langOutputDir, "Grammar.db"), entries);
      console.log(`✓ Built ${language}/Grammar.db (${entries.length} entries)`);
    }

    // 3. Build Lesson.db
    const lessonsDir = path.join(langSourceDir, "Lessons");
    if (fs.existsSync(lessonsDir)) {
      const files = Walk_Directory(lessonsDir);
      const entries: LessonEntry[] = files
        .map((file) => {
          const rel = path.relative(lessonsDir, file).split(path.sep);
          const level = rel[0] ?? "Default";
          return Parse_Lesson_File(file, level);
        })
        .filter((entry): entry is LessonEntry => entry !== null);

      Build_Lesson_DB(path.join(langOutputDir, "Lesson.db"), entries);
      console.log(`✓ Built ${language}/Lesson.db (${entries.length} entries)`);
    }
  }

  console.log("✨ All Language Databases successfully generated.");
}

Build_Language_Databases();