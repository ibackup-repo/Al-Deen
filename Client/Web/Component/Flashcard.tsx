// @Web/Component/Flashcard.tsx
import { useMemo, useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Volume2, RotateCcw, X } from "lucide-react";
import { Button } from "@Web/Component/UI/Button";
import { Container } from "@Web/Component/UI/container";
import { TitleBar } from "@Web/Component/UI/title-bar";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { Use_App } from "@Web/Context/App";
import { speak, Is_Speech_Available } from "@Web/Component/Practice/speech";
import { Schedule_Next, Recall_ID, type Recall_Item } from "@/Library/Recall";
import { Class_Names } from "@/Library/Utility";

export type Supported_Language = "Dutch" | "English" | "Arabic" | "Pashto";

const MAP_LANG_CODE: Record<string, Supported_Language> = {
  nl: "Dutch",
  en: "English",
  ar: "Arabic",
  ps: "Pashto"
};

export default function Recall_Overlay() {
  const navigate = useNavigate();
  const location = useLocation();
  const { Active_Recall, Add_Recall_Item, Recall_Queue } = Use_App();
  const { Course_Language, t } = Use_Course_Language();

  const Is_Recall_Active = location.search.includes("Recall");
  const Api_Lang_Name = Active_Recall ? (MAP_LANG_CODE[Course_Language] || "English") : "English";
  const Has_Valid_Context = !!Active_Recall;

  const [Deck_Slugs, Set_Deck_Slugs] = useState<string[]>([]);
  const [Subcategory_Words, Set_Subcategory_Words] = useState<Record<string, any>>({});
  const [Loading, Set_Loading] = useState<boolean>(false);
  const [Flipped, Set_Flipped] = useState(false);
  const [Index, Set_Index] = useState(0);
  const [Ratings, Set_Ratings] = useState<(1 | 2 | 3 | 4 | 5)[]>([]);

  // Ref to track what deck we have loaded to prevent redundant triggers
  const Loaded_Deck_Key_Ref = useRef<string | null>(null);

  const Persistence_Key = useMemo(() => {
    if (!Active_Recall) return null;
    return `recall_state_${Active_Recall.Category_ID}_${Active_Recall.Subcategory_ID}`;
  }, [Active_Recall]);

  // Load Corpus and initialize state
  useEffect(() => {
    if (!Has_Valid_Context || !Active_Recall || !Is_Recall_Active) {
      // Clear key if deactivated
      if (!Is_Recall_Active) {
        Loaded_Deck_Key_Ref.current = null;
      }
      return;
    }

    const Current_Session_Key = `${Active_Recall.Category_ID}_${Active_Recall.Subcategory_ID}_${Active_Recall.Word_ID || ""}_${Active_Recall.Word_IDs?.join(",") || ""}`;
    
    // Prevent execution if this deck configuration is already loaded
    if (Loaded_Deck_Key_Ref.current === Current_Session_Key) {
      return;
    }

    Set_Loading(true);
    const Base_URL = import.meta.env.VITE_API_BASE_URL || "";
    
    fetch(`${Base_URL}/api/language-Corpus?lang=${encodeURIComponent(Api_Lang_Name)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((Corpus) => {
        if (!Corpus) return;

        const Category = Active_Recall.Category_ID;
        const subcategory = Active_Recall.Subcategory_ID;
        const Subcategory_Data = Corpus?.vocabularyGrammar?.["Vocabulary"]?.[Category]?.[subcategory] || {};
        
        const allSlugs = Object.keys(Subcategory_Data);
        let resolvedSlugs: string[] = [];

        if (Active_Recall.Word_ID) {
          resolvedSlugs = allSlugs.includes(Active_Recall.Word_ID) ? [Active_Recall.Word_ID] : [];
        } else if (Active_Recall.Word_IDs && Active_Recall.Word_IDs.length) {
          const ids = new Set(Active_Recall.Word_IDs);
          resolvedSlugs = allSlugs.filter((slug) => ids.has(slug));
        } else {
          resolvedSlugs = allSlugs;
        }

        Set_Deck_Slugs(resolvedSlugs);
        Set_Subcategory_Words(Subcategory_Data);
        Loaded_Deck_Key_Ref.current = Current_Session_Key;

        // Safely load progress
        if (Persistence_Key) {
          const saved = localStorage.getItem(Persistence_Key);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed.deckLength === resolvedSlugs.length && parsed.Index < resolvedSlugs.length) {
                Set_Index(parsed.Index);
                Set_Ratings(parsed.Ratings || []);
              } else {
                Set_Index(0);
                Set_Ratings([]);
              }
            } catch (e) {
              Set_Index(0);
              Set_Ratings([]);
            }
          } else {
            Set_Index(0);
            Set_Ratings([]);
          }
        }
      })
      .catch((err) => console.error("Error Loading Corpus:", err))
      .finally(() => Set_Loading(false));
  }, [Is_Recall_Active, Has_Valid_Context, Active_Recall, Api_Lang_Name, Persistence_Key]);

  // Persist current session progress
  useEffect(() => {
    if (!Persistence_Key || Deck_Slugs.length === 0 || !Is_Recall_Active) return;
    localStorage.setItem(Persistence_Key, JSON.stringify({
      Index,
      Ratings,
      deckLength: Deck_Slugs.length
    }));
  }, [Index, Ratings, Deck_Slugs.length, Persistence_Key, Is_Recall_Active]);

  const Current_Slug = Deck_Slugs[Index];
  const Active_Word_Data = useMemo(() => {
    if (!Current_Slug || !Subcategory_Words) return null;
    const rawData = Subcategory_Words[Current_Slug] || {};
    return {
      word: Current_Slug,
      meaning: rawData.translation || rawData.meaning || Current_Slug,
      ...rawData
    };
  }, [Current_Slug, Subcategory_Words]);

  const Handle_Close_Recall = () => {
    navigate(location.pathname);
  };

  const Clear_Persisted_Session = () => {
    if (Persistence_Key) {
      localStorage.removeItem(Persistence_Key);
    }
    Set_Index(0);
    Set_Ratings([]);
    Set_Flipped(false);
  };

  if (!Is_Recall_Active) return null;

  const renderBody = () => {
    if (Loading) {
      return <div className="text-sm py-12 text-center opacity-60">Synchronizing your flashcard collection...</div>;
    }

    if (!Has_Valid_Context || !Active_Recall || Deck_Slugs.length === 0) {
      return (
        <div className="px-4 max-w-md mx-auto space-y-4 text-center mt-12">
          <p className="text-sm opacity-70">{t("noActive") || "No deck selected."}</p>
          <Button onClick={Handle_Close_Recall} fullWidth>{t("back") || "Back"}</Button>
        </div>
      );
    }

    const target = Current_Slug || "";
    const meaning = Active_Word_Data?.meaning || Current_Slug || "";

    const Definition = Active_Word_Data?.Definition;
    const plural = Active_Word_Data?.plural;
    const diminutive = Active_Word_Data?.diminutive;
    const conjugation = Active_Word_Data?.conjugation;
    const example = Active_Word_Data?.example;
    const Pronunciation = Active_Word_Data?.Pronunciation;
    const Gender_Label = Active_Word_Data?.gender || null;

    const isLast = Index + 1 >= Deck_Slugs.length;

    const Rate_And_Advance = (r: 1 | 2 | 3 | 4 | 5) => {
      const now = Date.now();
      const wId = Recall_ID("word", Active_Recall.Category_ID, Active_Recall.Subcategory_ID, Current_Slug);
      const Previous_Word = Recall_Queue.find(i => i.id === wId);
      const wSched = Schedule_Next(Previous_Word, r);
      const Per_Word: Recall_Item = {
        id: wId,
        Scope: "word",
        Category_ID: Active_Recall.Category_ID,
        Subcategory_ID: Active_Recall.Subcategory_ID,
        Word_ID: Current_Slug,
        title: `${target} · ${Active_Recall.Subcategory_ID}`,
        completedAt: now,
        Ready_At: now + wSched.intervalMs,
        Last_Rating: r,
        ease: wSched.ease,
        reps: wSched.reps,
        intervalDays: wSched.intervalDays,
      };
      Add_Recall_Item(Per_Word);

      const Next_Ratings = [...Ratings, r];
      if (isLast) {
        const Full_Deck = !Active_Recall.Word_ID && (!Active_Recall.Word_IDs || Active_Recall.Word_IDs.length === Deck_Slugs.length);
        if (Full_Deck) {
          const avg = Math.max(1, Math.min(5, Math.round(
            Next_Ratings.reduce((a, b) => a + b, 0) / Next_Ratings.length
          ))) as 1 | 2 | 3 | 4 | 5;
          const sId = Recall_ID("subcategory", Active_Recall.Category_ID, Active_Recall.Subcategory_ID);
          const Previous_Sub = Recall_Queue.find(i => i.id === sId);
          const sSched = Schedule_Next(Previous_Sub, avg);
          const Sub_Item: Recall_Item = {
            id: sId,
            Scope: "subcategory",
            Category_ID: Active_Recall.Category_ID,
            Subcategory_ID: Active_Recall.Subcategory_ID,
            title: Active_Recall.Subcategory_ID,
            completedAt: now,
            Ready_At: now + sSched.intervalMs,
            Last_Rating: avg,
            ease: sSched.ease,
            reps: sSched.reps,
            intervalDays: sSched.intervalDays,
          };
          Add_Recall_Item(Sub_Item);
        }
        
        Clear_Persisted_Session();
        Handle_Close_Recall();
        return;
      }

      Set_Ratings(Next_Ratings);
      Set_Index(i => i + 1);
      Set_Flipped(false);
    };

    return (
      <div className="px-4 max-w-md mx-auto space-y-4 mt-6">
        <Container className="flex items-center justify-between text-xs px-3 py-2">
          <span className="opacity-70">{Index + 1} / {Deck_Slugs.length}</span>
          <span className="font-medium truncate ml-2">
            {Active_Recall.Subcategory_ID}
          </span>
        </Container>

        <div
          role="button"
          tabIndex={0}
          onClick={() => Set_Flipped(f => !f)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') Set_Flipped(f => !f); }}
          className={Class_Names(
            "relative w-full text-left bg-card hover:bg-accent/40 border border-border rounded-xl p-6 transition-all cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none", 
            Flipped ? "min-h-[320px]" : "min-h-[240px]"
          )}
        >
          {Is_Speech_Available() && (
            <button
              type="button"
              onClick={(e) => { 
                e.stopPropagation(); 
                speak(target, Course_Language as any); 
              }}
              className="absolute top-3 right-3 rounded-full p-2 bg-background border-2 border-border hover:bg-foreground hover:text-background transition-colors z-10"
              aria-label={t("play") || "Play"}
            >
              <Volume2 className="h-4 w-4" />
            </button>
          )}
          {!Flipped ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[200px] text-center gap-1 w-full">
              <h1 className="text-3xl font-bold">{target}</h1>
              {Pronunciation && <p className="text-sm opacity-70 font-mono">{Pronunciation}</p>}
              <p className="text-xs opacity-50 mt-6">{t("tapToFlip") || "Tap to flip"}</p>
            </div>
          ) : (
            <div className="flex flex-col w-full text-left pr-10">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-2xl font-bold">{target}</h2>
                {Pronunciation && <span className="text-sm opacity-70 font-mono">{Pronunciation}</span>}
              </div>
              <p className="text-base font-semibold mb-2">{meaning}</p>
              {Gender_Label && (
                <span className="inline-block self-start text-xs px-2 py-0.5 rounded-full border-2 border-border bg-background mb-2">
                  {t("gender")}: {Gender_Label}
                </span>
              )}
              {Definition && <Section label={t("Definition") || "Definition"}>{Definition}</Section>}
              {plural && <Section label={t("plural") || "Plural"}>{plural}</Section>}
              {diminutive && <Section label={t("diminutive") || "Diminutive"}>{diminutive}</Section>}
              {conjugation && (
                <div className="mb-2">
                  <h3 className="text-xs font-medium opacity-70 mb-0.5">{t("conjugation") || "Conjugation"}</h3>
                  <div className="space-y-0.5">
                    {Object.entries(conjugation).map(([pronoun, form]) => (
                      <div key={pronoun} className="flex justify-between text-sm">
                        <span className="opacity-70">{pronoun}</span>
                        <span className="font-medium">{form as string}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {example && <Section label={t("example") || "Example"} italic>{example}</Section>}
            </div>
          )}
        </div>

        {!Flipped ? (
          <Button onClick={() => Set_Flipped(true)} active fullWidth>
            <RotateCcw className="h-4 w-4 mr-2" />
            {t("flip") || "Flip"}
          </Button>
        ) : (
          <div className="space-y-2">
            <TitleBar className="text-center text-xs font-medium">
              {t("rateRecall") || "How well did you recall?"}
            </TitleBar>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map(r => (
                <Button
                  key={r}
                  onClick={() => Rate_And_Advance(r as 1 | 2 | 3 | 4 | 5)}
                  className="h-14 text-lg font-semibold"
                >
                  {r}
                </Button>
              ))}
            </div>
            <div className="flex justify-between text-[11px] opacity-60 px-1">
              <span>{t("ratingLow") || "Barely"}</span>
              <span>{t("ratingHigh") || "Perfect"}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-background z-[100] flex flex-col p-4 animate-in fade-in slide-in-from-bottom-5 duration-200 overflow-y-auto">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <h2 className="text-base font-bold">Recall Session</h2>
        <Button size="icon" variant="ghost" className="rounded-full h-9 w-9" onClick={Handle_Close_Recall}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 flex flex-col justify-center">
        {renderBody()}
      </div>
    </div>
  );
}

function Section({ label, children, italic }: { label: string; children: React.ReactNode; italic?: boolean }) {
  return (
    <div className="mb-2">
      <h3 className="text-xs font-medium opacity-70 mb-0.5">{label}</h3>
      <p className={Class_Names("text-sm", italic && "italic")}>{children}</p>
    </div>
  );
}