import { useQuery } from "@tanstack/react-query";
import { Use_App } from "@Web/Context/App";

// FIX: Localized type boundaries to prevent backend cross-contamination
export type Supported_Language = "Dutch" | "English" | "Arabic" | "Pashto";
export type International_Language = "Dutch" | "English" | "Arabic";
export type Short_Lang = "en" | "nl" | "ar" | "ps";

// FIX: Pull directly from the build-time injected environment variables
const BACKEND_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://orange-lamp-jrr4x9wp97rh5r7r-8081.app.github.dev";

const SHORT_TO_I18N: Record<string, International_Language> = {
  en: "English",
  nl: "Dutch",
  ar: "Arabic",
};

const SHORT_TO_SUPPORTED: Record<string, Supported_Language> = {
  en: "English",
  nl: "Dutch",
  ar: "Arabic",
  ps: "Pashto",
};

async function Fetch_Language_Corpus_From_Backend(lang: Supported_Language) {
  const response = await fetch(`${BACKEND_BASE_URL}/api/language-Corpus?lang=${lang}`);
  if (!response.ok) throw new Error(`Failed to load language Corpus for ${lang}`);
  return response.json();
}

export function Use_Course_Language() {
  const { Interface_Language, Learning_Language } = Use_App();

  const UI_Language: string = Interface_Language || "en";
  const Target_Lang: string = Learning_Language || "nl";
  const Course_Language: string = Target_Lang;

  const International_Language: International_Language = SHORT_TO_I18N[UI_Language] ?? "English";
  const API_Language: Supported_Language = SHORT_TO_SUPPORTED[Target_Lang] ?? "Dutch";

  const { data: Corpus } = useQuery({
    queryKey: ["languageCorpusBackend", International_Language],
    queryFn: () => Fetch_Language_Corpus_From_Backend(International_Language),
    staleTime: 1000 * 60 * 30,
  });

  const { data: Fallback_Corpus } = useQuery({
    queryKey: ["languageCorpusBackend", "English"],
    queryFn: () => Fetch_Language_Corpus_From_Backend("English"),
    staleTime: 1000 * 60 * 30,
    enabled: International_Language !== "English",
  });

  const t = (key: string): string => {
    const labels = Corpus?.labels ?? {};
    const Fallback_Labels = (International_Language === "English" ? Corpus?.labels : Fallback_Corpus?.labels) ?? {};
    return labels[key] ?? Fallback_Labels[key] ?? key;
  };

  return { UI_Language, International_Language, Target_Lang, Course_Language, API_Language, t };
}