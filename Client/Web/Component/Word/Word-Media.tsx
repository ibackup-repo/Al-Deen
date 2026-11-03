import { useEffect, useRef, useState } from "react";
import { Volume2, Mic, MicOff } from "lucide-react";
import { Button } from "@Web/Component/UI/Button";
import { Container } from "@Web/Component/UI/container";
import { speak, Is_Speech_Available } from "@Web/Component/Practice/speech";
import { Fetch_Word_Image } from "@/Library/Word-Image";
import type { Word_Language } from "@/Library/Word-Types";
import { Class_Names } from "@/Library/Utility";

interface Properties {
  word: string;
  lang: Word_Language;
}

/**
 * Bare-bones media helpers for a word:
 *  - TTS: browser SpeechSynthesis (only when available)
 *  - STT: Web Speech API (only when available; shows Transcript + match)
 *  - Image: Wikipedia thumbnail (only rendered if one is found)
 */
export function Word_Media({ word, lang }: Properties) {
  const [listening, setListening] = useState(false);
  const [Transcript, Set_Transcript] = useState("");
  const [match, setMatch] = useState<null | boolean>(null);
  const [Image_URL, Set_Image_URL] = useState<string | null>(null);
  const Rec_Reference = useRef<any>(null);

  useEffect(() => {
    Set_Transcript(""); setMatch(null); Set_Image_URL(null);
    let cancelled = false;
    Fetch_Word_Image(word, lang).then(url => {
      if (!cancelled) Set_Image_URL(url);
    });
    return () => { cancelled = true; };
  }, [word, lang]);

  const SR: any = typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;
  const STT_Available = !!SR;
  const TTS_Available = Is_Speech_Available();
  const Show_Actions = TTS_Available || STT_Available;

  const Toggle_Listen = () => {
    if (!SR) return;
    if (listening) { Rec_Reference.current?.stop?.(); return; }
    const rec = new SR();
    rec.lang = lang === "nl" ? "nl-NL" : "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const text = e.results[0][0].Transcript || "";
      Set_Transcript(text);
      setMatch(text.trim().toLowerCase() === word.trim().toLowerCase());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    Rec_Reference.current = rec;
    Set_Transcript(""); setMatch(null); setListening(true);
    try { rec.start(); } catch { setListening(false); }
  };

  return (
    <div className="mt-4 space-y-3">
      {Show_Actions && (
        <div className="flex items-center justify-center gap-2">
          {TTS_Available && (
            <Button size="icon" onClick={() => speak(word, lang)} aria-label="Play">
              <Volume2 className="h-5 w-5" />
            </Button>
          )}
          {STT_Available && (
            <Button
              size="icon"
              active={listening}
              onClick={Toggle_Listen}
              aria-label="Speak"
            >
              {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
          )}
        </div>
      )}

      {Transcript && (
        <Container className={Class_Names("text-sm text-center", match === false && "border-destructive")}>
          <span className="opacity-60 mr-1">You said:</span>
          <span className="font-medium">{Transcript}</span>
          {match === true && <span className="ml-2">✓</span>}
          {match === false && <span className="ml-2">✗</span>}
        </Container>
      )}

      {Image_URL && (
        <div className="rounded-[24px] overflow-hidden border-2 border-border bg-background aspect-[4/3] flex items-center justify-center">
          <img
            src={Image_URL}
            alt={word}
            Loading="lazy"
            className="w-full h-full object-cover"
            onError={() => Set_Image_URL(null)}
          />
        </div>
      )}
    </div>
  );
}
