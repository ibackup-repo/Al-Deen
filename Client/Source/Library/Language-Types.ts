export type Supported_Language = "Dutch" | "English" | "Arabic" | "Pashto";
export type International_Language = "Dutch" | "English" | "Arabic";

export interface Vocabulary_Record {
  id: number;
  slug: string;
  category: string;
  subcategory: string;
  title: string;
  description: string | null;
  plural_or_notes: string | null;
  diminutive_or_alt: string | null;
  example_sentence: string | null;
}

export interface Grammar_Record {
  id: number;
  slug: string;
  category: string;
  subcategory: string;
  term: string;
  rule_explanation: string | null;
  example_usage: string | null;
}

export interface Lesson_Record {
  id: number;
  slug: string;
  level: string;
  content_json: string;
  content?: any;
}

export interface Language_Corpus_Response {
  vocabulary?: Vocabulary_Record[];
  grammar?: Grammar_Record[];
  lessons?: Lesson_Record[];
}

export interface Language_Query_Options {
  type?: "vocabulary" | "grammar" | "lessons";
  category?: string;
  subcategory?: string;
  level?: string;
  slug?: string;
}