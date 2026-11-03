import fs from "fs";
import path from "path";

export interface VocabularyEntry {
  slug: string;
  category: string;
  subcategory: string;
  title: string;
  description: string;
  pluralOrNotes: string;
  diminutiveOrAlt: string;
  exampleSentence: string;
}

export interface GrammarEntry {
  slug: string;
  category: string;
  subcategory: string;
  term: string;
  ruleExplanation: string;
  exampleUsage: string;
}

export interface LessonEntry {
  slug: string;
  level: string;
  contentJson: string;
}

export function Walk_Directory(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      Walk_Directory(fullPath, fileList);
    } else if (file.endsWith(".json")) {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

export function Parse_Vocabulary_File(
  filePath: string,
  category: string,
  subcategory: string
): VocabularyEntry | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const content = JSON.parse(raw);
    const slug = path.basename(filePath, ".json");

    return {
      slug,
      category,
      subcategory,
      title: content[0] ? String(content[0]) : "",
      description: content[1] ? String(content[1]) : "",
      pluralOrNotes: content[2] ? String(content[2]) : "",
      diminutiveOrAlt: content[3] ? String(content[3]) : "",
      exampleSentence: content[4] ? String(content[4]) : ""
    };
  } catch (error) {
    console.error(`Error parsing Vocabulary file at ${filePath}:`, error);
    return null;
  }
}

export function Parse_Grammar_File(
  filePath: string,
  category: string,
  subcategory: string
): GrammarEntry | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const content = JSON.parse(raw);
    const slug = path.basename(filePath, ".json");

    return {
      slug,
      category,
      subcategory,
      term: content[0] ? String(content[0]) : "",
      ruleExplanation: content[1] ? String(content[1]) : "",
      exampleUsage: content[2] ? String(content[2]) : ""
    };
  } catch (error) {
    console.error(`Error parsing Grammar file at ${filePath}:`, error);
    return null;
  }
}

export function Parse_Lesson_File(filePath: string, level: string): LessonEntry | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const content = JSON.parse(raw);
    const slug = path.basename(filePath, ".json");

    return {
      slug,
      level,
      contentJson: JSON.stringify(content)
    };
  } catch (error) {
    console.error(`Error parsing Lesson file at ${filePath}:`, error);
    return null;
  }
}