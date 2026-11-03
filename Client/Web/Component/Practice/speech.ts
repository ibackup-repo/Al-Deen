import type { Word_Language } from "@/Library/Word-Types";

const Voice_Locale: Record<Word_Language, string> = {
  nl: "nl-NL",
  en: "en-US",
  ar: "ar-SA",
};

// Acceptable BCP-47 prefixes per language (so we can fall back to e.g. nl-BE).
const Lang_Prefix: Record<Word_Language, string> = {
  nl: "nl",
  en: "en",
  ar: "ar",
};

let Cached_Voices: SpeechSynthesisVoice[] = [];

function Load_Voices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve([]); return;
    }
    const Try_Get = () => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length) { Cached_Voices = v; resolve(v); return true; }
      return false;
    };
    if (Try_Get()) return;
    // Some browsers populate voices asynchronously.
    let attempts = 0;
    const id = window.setInterval(() => {
      attempts++;
      if (Try_Get() || attempts > 20) {
        window.clearInterval(id);
        resolve(Cached_Voices);
      }
    }, 100);
    window.speechSynthesis.onvoiceschanged = () => { Try_Get(); };
  });
}

function Pick_Voice(lang: Word_Language): SpeechSynthesisVoice | null {
  const target = Voice_Locale[lang];
  const prefix = Lang_Prefix[lang];
  // Exact match first, then prefix match.
  return (
    Cached_Voices.find(v => v.lang === target) ||
    Cached_Voices.find(v => v.lang?.toLowerCase().startsWith(prefix)) ||
    null
  );
}

/** Speak the given text using the browser's SpeechSynthesis API. */
export function speak(text: string, lang: Word_Language) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (!text || !text.trim()) return;
  // Strip leading definite articles & punctuation that confuse TTS engines
  // (e.g. "De Hond" → "Hond" reads cleaner on some Dutch voices).
  const cleaned = text.replace(/^\s*(de|het|een|the|a|an)\s+/i, "").trim();
  const Utter_Text = cleaned || text;

  const Do_Speak = () => {
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(Utter_Text);
      utter.lang = Voice_Locale[lang] || "en-US";
      const voice = Pick_Voice(lang);
      if (voice) utter.voice = voice;
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    } catch { /* no-op */ }
  };

  if (Cached_Voices.length === 0) {
    Load_Voices().then(Do_Speak);
  } else {
    Do_Speak();
  }
}

export function Is_Speech_Available(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// Warm voice cache on module load (no-op on SSR).
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  Load_Voices();
}
