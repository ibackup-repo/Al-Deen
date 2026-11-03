// @Web/Component/Word/Word_Detail_View.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@Web/Component/UI/Button";
import { Word_Edit_Dialog } from "@Web/Component/Word/Word-Edit-Dialog";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { Use_Custom_Words } from "@/Hook/Use-Custom-Words";
import { Fetch_Word_Image } from "@/Library/Word-Image";
import { Class_Names } from "@/Library/Utility";
import { Supported_Language, Vocabulary_Record } from "@/Library/Language-Types";
import { Get_Vocabulary_Item } from "@/Library/Language-API";
import type { Word_Detail } from "@/Hook/Use-Custom-Words";
import type { Word_Language } from "@/Library/Word-Types";

type Flip_State = 0 | 1 | 2;

function Section({ label, children, italic }: { label: string; children: React.ReactNode; italic?: boolean }) {
  return (
    <div className="mb-3">
      <h3 className="text-xs font-medium opacity-70 mb-0.5">{label}</h3>
      <p className={Class_Names("text-sm", italic && "italic")}>{children}</p>
    </div>
  );
}

export default function Word_Detail_View() {
  const { Lang_Name, Category_ID, Subcategory_ID, Word_ID } = useParams<{
    Lang_Name: string;
    Category_ID: string;
    Subcategory_ID: string;
    Word_ID: string;
  }>();

  const navigate = useNavigate();
  const Active_Lang_Name = (Lang_Name || "English") as Supported_Language;
  
  const { UI_Language, Course_Language, t } = Use_Course_Language();
  const [flip, Set_Flip] = useState<Flip_State>(0);
  const [Image_URL, Set_Image_URL] = useState<string | null>(null);
  
  const { Custom_Words, Update_Custom_Word, Remove_Custom_Word, Set_Override } = Use_Custom_Words(Category_ID || "", Subcategory_ID || "");
  const [Edit_Open, Set_Edit_Open] = useState(false);

  // Local state to store fetched word details
  const [word, setWord] = useState<Word_Detail | null>(null);
  const [Loading, Set_Loading] = useState<boolean>(true);

  // Fetch target word using client API
  useEffect(() => {
    if (!Word_ID) return;

    let isMounted = true;
    Set_Loading(true);

    Get_Vocabulary_Item(Active_Lang_Name, Word_ID)
      .then((record: Vocabulary_Record) => {
        if (!isMounted) return;

        if (record && record.slug) {
          const compiled: Word_Detail = {
            id: record.slug,
            category: record.category,
            subcategory: record.subcategory,
            en: {
              word: record.title,
              Definition: record.description || "",
              plural: record.plural_or_notes || "",
              diminutive: record.diminutive_or_alt || "",
              example: record.example_sentence || "",
            },
            nl: {
              word: record.title,
              Definitie: record.description || "",
              meervoud: record.plural_or_notes || "",
              verkleinwoord: record.diminutive_or_alt || "",
              Voorbeeld: record.example_sentence || "",
            },
          };
          setWord(compiled);
        } else {
          setWord(null);
        }
        Set_Loading(false);
      })
      .catch((err) => {
        console.error("Failed loading word details from API:", err);
        if (isMounted) {
          setWord(null);
          Set_Loading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [Active_Lang_Name, Word_ID]);

  const Target_Text_Early = word ? (word[Course_Language]?.word ?? word.en?.word) : "";
  const Show_Image = Category_ID === "zelfstandig-naamwoord";

  useEffect(() => {
    Set_Image_URL(null);
    if (!Target_Text_Early || !Show_Image || !word) return;
    let cancelled = false;
    Fetch_Word_Image({
      word: Target_Text_Early,
      lang: Course_Language,
      En_Word: word.en?.word,
      En_Definition: word.en?.Definition,
    }).then(url => {
      if (!cancelled) Set_Image_URL(url);
    });
    return () => { cancelled = true; };
  }, [word?.id, Target_Text_Early, Course_Language, Show_Image, word?.en?.word, word?.en?.Definition]);

  if (Loading) {
    return <div className="p-8 text-center text-sm opacity-60">Loading word details...</div>;
  }

  if (!word) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm opacity-60">Word details not found.</p>
        <button onClick={() => navigate(-1)} className="text-xs underline">Back</button>
      </div>
    );
  }

  const Handle_Flip = () => Set_Flip(f => ((f + 1) % 3) as Flip_State);

  const cLang  = Course_Language as Word_Language;
  const Interface_Word_Lang: Word_Language = UI_Language === "ar" ? "en" : (UI_Language as Word_Language);
  const Show_Language: Word_Language = flip === 2 ? Interface_Word_Lang : cLang;
  
  const Data_For = (lang: Word_Language) => {
    const rawData = lang === "ar" ? (word.ar ?? word.en) : word[lang];
    return rawData || {};
  };
  const data = Data_For(Show_Language);

  const en = word.en ?? {};
  const nl = word.nl ?? {};
  const Definition  = Show_Language === "nl" ? nl.Definitie  : Show_Language === "ar" ? (word.ar?.Definition ?? en.Definition)  : en.Definition;
  const plural      = Show_Language === "nl" ? nl.meervoud   : en.plural;
  const diminutive  = Show_Language === "nl" ? nl.verkleinwoord : en.diminutive;
  const conjugation = Show_Language === "nl" ? nl.vervoeging : en.conjugation;
  const example     = Show_Language === "nl" ? nl.Voorbeeld  : Show_Language === "ar" ? (word.ar?.example ?? en.example) : en.example;
  
  const Pronunciation = data?.Pronunciation ?? undefined;
  const gender = Show_Language === "nl" ? nl.gender : Show_Language === "en" ? en.gender : undefined;
  
  const Gender_Label = gender === "m" ? t("masculine")
    : gender === "f" ? t("feminine")
    : gender === "n" ? t("neuter")
    : gender === "c" ? t("common") : null;

  const Target_Text = (cLang === "ar" ? word.ar?.word : word[cLang]?.word) ?? word.en?.word;
  const Front_Pron  = (cLang === "ar" ? word.ar?.Pronunciation : word[cLang]?.Pronunciation) ?? undefined;
  const Is_Front = flip === 0;

  const Is_Custom = Custom_Words.some(w => w.id === word.id);

  return (
    <div className="px-4 max-w-md mx-auto space-y-4 pt-4">
      <Button
        onClick={Handle_Flip}
        className={Class_Names(
          "w-full relative rounded-2xl p-4 flex flex-col justify-start items-stretch text-left",
          Is_Front ? "min-h-[140px]" : "min-h-[260px]"
        )}
      >
        {/* Floating Indicator for active flipping Language context */}
        {!Is_Front && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
            <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full border border-border bg-background text-foreground group-hover:border-foreground">
              {Show_Language}
            </span>
          </div>
        )}

        {/* Card body */}
        <div className="flex flex-col h-full text-left w-full">
          {Is_Front ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[100px] gap-1">
              <h1 className="text-3xl font-bold text-center">{Target_Text}</h1>
              {Front_Pron && <p className="text-sm opacity-70 font-mono">{Front_Pron}</p>}
            </div>
          ) : (
            <>
              <div className="flex items-center mb-2 pr-12">
                <h1 className="text-2xl font-bold">{data?.word || Target_Text}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {Pronunciation && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full border border-border bg-background text-foreground group-hover:border-foreground">
                    {Pronunciation}
                  </span>
                )}
                {Gender_Label && (
                  <span className="text-xs px-2 py-0.5 rounded-full border border-border bg-background text-foreground group-hover:border-foreground">
                    {t("gender")}: {Gender_Label}
                  </span>
                )}
              </div>
              {Definition  && <Section label={t("Definition")}>{Definition}</Section>}
              {plural      && <Section label={t("plural")}>{plural}</Section>}
              {diminutive  && <Section label={t("diminutive")}>{diminutive}</Section>}
              {conjugation && (
                <div className="mb-3">
                  <h3 className="text-xs font-medium opacity-70 mb-0.5">{t("conjugation")}</h3>
                  <div className="space-y-0.5">
                    {Object.entries(conjugation).map(([pronoun, form]) => (
                      <div key={pronoun} className="flex justify-between text-sm">
                        <span className="opacity-70">{pronoun}</span>
                        <span className="font-medium">{String(form ?? "")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {example && <Section label={t("example")} italic>{example}</Section>}
            </>
          )}

          {Image_URL && (
            <div className="mt-4 rounded-xl overflow-hidden border border-border bg-background aspect-[4/3] group-hover:border-foreground transition-colors">
              <img
                src={Image_URL}
                alt={Target_Text}
                loading="lazy"
                className="w-full h-full object-cover"
                onError={() => Set_Image_URL(null)}
              />
            </div>
          )}

          <p className="text-xs opacity-60 mt-4 text-center">{t("tapToFlip")}</p>
        </div>
      </Button>

      {/* Global State/Trigger-Controlled Edit Dialog */}
      <Word_Edit_Dialog
        open={Edit_Open}
        onOpenChange={Set_Edit_Open}
        word={word}
        onSave={(w) => {
          if (Is_Custom) Update_Custom_Word(word.id, w);
          else Set_Override(word.id, w);
        }}
        onDelete={Is_Custom ? () => Remove_Custom_Word(word.id) : undefined}
      />
    </div>
  );
}