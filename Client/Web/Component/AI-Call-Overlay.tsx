import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Loader2 } from "lucide-react";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { supabase } from "Client/Integration/supabase/client";
import { Class_Names } from "@/Library/Utility";

type Msg = { role: "user" | "assistant"; content: string };

const BCP47: Record<string, string> = { en: "en-US", nl: "nl-NL", ar: "ar-SA" };

function Pick_Voice(lang: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const prefix = BCP47[lang]?.split("-")[0] ?? lang;
  return voices.find(v => v.lang.toLowerCase().startsWith(prefix)) || null;
}

export function AI_Call_Overlay({ onClose }: { onClose: () => void }) {
  const { Target_Lang, UI_Language, t } = Use_Course_Language();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const Rec_Reference = useRef<any>(null);

  const SR: any = typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;
  const supported = !!SR && typeof window !== "undefined" && !!window.speechSynthesis;

  // Warm-up voices list (some browsers populate it asynchronously)
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.getVoices();
    const handler = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", handler);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", handler);
  }, []);

  // Cleanup on close
  useEffect(() => () => {
    try { Rec_Reference.current?.stop?.(); } catch {}
    try { window.speechSynthesis?.cancel(); } catch {}
  }, []);

  const Speak_Out = (text: string) =>
    new Promise<void>(resolve => {
      if (!window.speechSynthesis) return resolve();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = BCP47[Target_Lang] || "en-US";
      const v = Pick_Voice(Target_Lang);
      if (v) u.voice = v;
      u.onend = () => { setSpeaking(false); resolve(); };
      u.onerror = () => { setSpeaking(false); resolve(); };
      setSpeaking(true);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    });

  const Send_To_AI = async (history: Msg[]) => {
    setThinking(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("ai-tutor", {
        body: { messages: history, Target_Lang, UI_Language },
      });
      if (fnErr) throw fnErr;
      if ((data as any)?.error) throw new Error((data as any).error);
      const reply: string = (data as any)?.reply ?? "";
      if (reply) {
        const next: Msg = { role: "assistant", content: reply };
        setMessages(m => [...m, next]);
        setCaption(reply);
        await Speak_Out(reply);
      }
    } catch (e: any) {
      setError(e?.message ?? "Something went Wrong");
    } finally {
      setThinking(false);
    }
  };

  const Toggle_Mic = () => {
    if (!SR) return;
    if (listening) { try { Rec_Reference.current?.stop?.(); } catch {} return; }
    try { window.speechSynthesis?.cancel(); } catch {}
    const rec = new SR();
    rec.lang = BCP47[Target_Lang] || "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) text += e.results[i][0].Transcript;
      setCaption(text);
      if (e.results[e.results.length - 1].isFinal && text.trim()) {
        const User_Message: Msg = { role: "user", content: text.trim() };
        const next = [...messages, User_Message];
        setMessages(next);
        Send_To_AI(next);
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = (e: any) => {
      setListening(false);
      if (e?.error && e.error !== "no-speech" && e.error !== "aborted") {
        setError(`Mic error: ${e.error}`);
      }
    };
    Rec_Reference.current = rec;
    setCaption("");
    setListening(true);
    try { rec.start(); } catch { setListening(false); }
  };

  // Greet once the overlay mounts
  useEffect(() => {
    const greet: Msg = {
      role: "user",
      content: `Start the conversation by greeting me in ${Target_Lang} and asking what I want to practise today. Keep it to one short sentence.`,
    };
    Send_To_AI([greet]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const End_Call = () => {
    try { Rec_Reference.current?.stop?.(); } catch {}
    try { window.speechSynthesis?.cancel(); } catch {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between"
         style={{ background: "radial-gradient(circle at 50% 30%, hsl(var(--primary) / 0.15), hsl(var(--background)))" }}>
      <div className="w-full sticky top-0 z-10 bg-background/95 backdrop-blur border-b-2 border-border px-4 py-3">
        <h2 className="text-base font-semibold text-center">
          {UI_Language === "nl" ? "AI-gesprek" : UI_Language === "ar" ? "مكالمة الذكاء" : "AI Call"}
        </h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center mt-1">
          {(Target_Lang || "en").toUpperCase()} · {UI_Language === "nl" ? "Live" : UI_Language === "ar" ? "مباشر" : "Live"}
        </p>
      </div>


      {/* Animated orb */}
      <div className="flex flex-col items-center gap-6">
        <div
          className={Class_Names(
            "h-48 w-48 rounded-full transition-transform",
            (listening || speaking || thinking) && "scale-110",
          )}
          style={{
            background: "radial-gradient(circle at 35% 30%, hsl(var(--primary) / 0.9), hsl(var(--primary) / 0.4) 60%, transparent 75%)",
            boxShadow: speaking
              ? "0 0 80px 10px hsl(var(--primary) / 0.5)"
              : listening
              ? "0 0 60px 6px hsl(var(--accent) / 0.5)"
              : "0 0 40px 4px hsl(var(--primary) / 0.25)",
            animation: speaking
              ? "Pulse 1.2s ease-in-out infinite"
              : listening
              ? "Pulse 1.6s ease-in-out infinite"
              : "none",
          }}
        />
        <div className="max-w-md text-center min-h-[3rem]">
          {thinking ? (
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> {UI_Language === "nl" ? "Denken…" : UI_Language === "ar" ? "يفكر…" : "Thinking…"}
            </p>
          ) : (
            <p className="text-base leading-relaxed">{caption || (UI_Language === "nl" ? "Tik op de microfoon en spreek" : UI_Language === "ar" ? "اضغط على الميكروفون وتحدث" : "Tap the mic and start speaking")}</p>
          )}
          {error && <p className="text-xs text-destructive mt-2">{error}</p>}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6 pb-4">
        <button
          type="button"
          onClick={Toggle_Mic}
          disabled={!supported || thinking || speaking}
          aria-label="microphone"
          className={Class_Names(
            "h-16 w-16 rounded-full flex items-center justify-center transition-all",
            "glass-card",
            listening ? "ring-2 ring-destructive" : "ring-1 ring-border",
            !supported && "opacity-40 cursor-not-allowed",
          )}
        >
          {listening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </button>
        <button
          type="button"
          onClick={End_Call}
          aria-label="end call"
          className="h-16 w-16 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
        >
          <PhoneOff className="h-6 w-6" />
        </button>
      </div>

      {!supported && (
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Voice features need a browser with Web Speech API (Chrome / Edge / Safari).
        </p>
      )}
    </div>
  );
}
