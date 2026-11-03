import { Fetch_With_Cache_Fallback } from "./Service-Worker-Cache-Store.js";
import {
  Supported_Language,
  Vocabulary_Record,
  Grammar_Record,
  Lesson_Record,
  Language_Corpus_Response,
  Language_Query_Options
} from "./Language-Types.js";

const BASE_URL = "/api/language-Corpus";

/**
 * Low-level query builder for the Language Corpus endpoint.
 */
export async function Fetch_Language_Data<T = any>(
  lang: Supported_Language,
  options: Language_Query_Options = {}
): Promise<T> {
  const params = new URLSearchParams({ lang });

  if (options.type) params.append("type", options.type);
  if (options.category) params.append("category", options.category);
  if (options.subcategory) params.append("subcategory", options.subcategory);
  if (options.level) params.append("level", options.level);
  if (options.slug) params.append("slug", options.slug);

  const requestUrl = `${BASE_URL}?${params.toString()}`;
  return await Fetch_With_Cache_Fallback<T>(requestUrl);
}

/**
 * Fetch full language bundle (vocabulary, grammar, lessons).
 */
export async function Get_Full_Language_Corpus(
  lang: Supported_Language
): Promise<Language_Corpus_Response> {
  return Fetch_Language_Data<Language_Corpus_Response>(lang);
}

/**
 * Fetch Vocabulary records with optional category/subcategory filtering.
 */
export async function Get_Vocabulary_List(
  lang: Supported_Language,
  category?: string,
  subcategory?: string
): Promise<Vocabulary_Record[]> {
  const response = await Fetch_Language_Data<{ vocabulary: Vocabulary_Record[] }>(lang, {
    type: "vocabulary",
    category,
    subcategory
  });
  return response.vocabulary || [];
}

/**
 * Fetch single Vocabulary entry by slug.
 */
export async function Get_Vocabulary_Item(
  lang: Supported_Language,
  slug: string
): Promise<Vocabulary_Record> {
  return Fetch_Language_Data<Vocabulary_Record>(lang, {
    type: "vocabulary",
    slug
  });
}

/**
 * Fetch Grammar records with optional category/subcategory filtering.
 */
export async function Get_Grammar_List(
  lang: Supported_Language,
  category?: string,
  subcategory?: string
): Promise<Grammar_Record[]> {
  const response = await Fetch_Language_Data<{ grammar: Grammar_Record[] }>(lang, {
    type: "grammar",
    category,
    subcategory
  });
  return response.grammar || [];
}

/**
 * Fetch single Grammar entry by slug.
 */
export async function Get_Grammar_Item(
  lang: Supported_Language,
  slug: string
): Promise<Grammar_Record> {
  return Fetch_Language_Data<Grammar_Record>(lang, {
    type: "grammar",
    slug
  });
}

/**
 * Fetch Lessons records with optional level filtering.
 */
export async function Get_Lessons_List(
  lang: Supported_Language,
  level?: string
): Promise<Lesson_Record[]> {
  const response = await Fetch_Language_Data<{ lessons: Lesson_Record[] }>(lang, {
    type: "lessons",
    level
  });
  return response.lessons || [];
}

/**
 * Fetch single Lesson entry by slug.
 */
export async function Get_Lesson_Item(
  lang: Supported_Language,
  slug: string
): Promise<Lesson_Record & { content: any }> {
  return Fetch_Language_Data<Lesson_Record & { content: any }>(lang, {
    type: "lessons",
    slug
  });
}