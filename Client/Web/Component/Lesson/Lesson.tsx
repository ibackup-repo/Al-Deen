// Lessons view: level → lesson → runner. Locks progressively; triple-click on
// a Locked card bypasses. Star mastery per lesson.
import { useEffect, useMemo, useState } from "react";
import { Lock, Star } from "lucide-react";
import { CardButton } from "@Web/Component/UI/card-button";
import { Button } from "@Web/Component/UI/Button";
import { Class_Names } from "@/Library/Utility";
import { toast } from "@Web/Component/UI/use-toast";
import { Use_App } from "@Web/Context/App";
import { Exercise, Lesson_Complete_Screen } from "@Web/Component/Lesson/Types/Index";
import { Parse_Alphabet_Lesson, type Alphabet_Content_Block } from "@Web/Component/Parser/Language/Alphabet";
import {
  Get_Mastery,
  Is_Unlocked,
  Record_Result,
  Lesson_ID,
  Subscribe_Mastery,
  Has_Visited,
  Mark_Visited,
} from "@/Library/Lesson-Mastery";
import { Lesson_Progress } from "@/Library/Lesson-Progress";
import { Supported_Language, Lesson_Record } from "@/Library/Language-Types";
import { Get_Lessons_List } from "@/Library/Language-API";

export interface Lesson_Summary {
  slug: string;
  title: string;
}

// 2 cols on phones, 3 from small screens up, 4 on large desktops.
const GRID = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 w-full";
// Slightly less thumb-sized padding once there's room to work with.
const CARD = "min-h-[64px] sm:min-h-[56px] py-3 px-3 sm:py-3.5 sm:px-4 flex items-center justify-between gap-2 text-left";

// Practice-style exercises count toward the "perfect" grading.
const Practice_Kinds = new Set([
  "multipleChoice", "matchPairs", "typeAnswer", "orderSentence",
]);

function Title_From_Slug(slug: string): string {
  return slug.split("-").filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function Roman_To_Int(roman: string): number {
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let i = 0; i < roman.length; i++) {
    const cur = map[roman[i]] ?? 0;
    const next = map[roman[i + 1]] ?? 0;
    total += cur < next ? -cur : cur;
  }
  return total;
}

function Flatten_Steps(content: Alphabet_Content_Block[]): any[] {
  return content.flatMap((block) => {
    if (block.kind === "vocab") {
      return block.entries.map((entry) => ({ kind: "vocab", ...entry }));
    }
    if (block.kind === "practice") {
      return block.activities.flatMap((activity) =>
        activity.items.map((item: any) => ({ kind: activity.kind, ...item }))
      );
    }
    return [block];
  });
}

function Use_Mastery_Tick() {
  const [, set] = useState(0);
  useEffect(() => { const off = Subscribe_Mastery(() => set(n => n + 1)); return () => { off(); }; }, []);
}

function Star_Row({ Stars }: { Stars: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={Class_Names("h-3.5 w-3.5", n <= Stars ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
      ))}
    </span>
  );
}

interface Lockable_Card_Properties {
  title: string;
  subtitle?: string;
  Locked: boolean;
  Stars: number;
  onOpen: () => void;
}
function Lockable_Card({ title, subtitle, Locked, Stars, onOpen }: Lockable_Card_Properties) {
  const [Clicks, Set_Clicks] = useState(0);
  const onClick = () => {
    if (!Locked) { onOpen(); return; }
    const next = Clicks + 1;
    Set_Clicks(next);
    if (next >= 3) {
      Set_Clicks(0);
      toast({ title: "Unlocked" });
      onOpen();
    } else {
      toast({ title: `Locked — ${3 - next} more to bypass` });
      setTimeout(() => Set_Clicks(c => (c === next ? 0 : c)), 1200);
    }
  };
  return (
    <CardButton
      onClick={onClick}
      title={Locked ? "Triple-click to bypass" : undefined}
      className={Class_Names(CARD, "transition-transform sm:hover:scale-[1.02]", Locked && "opacity-60")}
    >
      <span className="flex-1">
        <span className="block font-semibold text-sm sm:text-base">{title}</span>
        {subtitle && <span className="block text-xs opacity-70">{subtitle}</span>}
      </span>
      {Locked ? <Lock className="h-4 w-4" /> : <Star_Row Stars={Stars} />}
    </CardButton>
  );
}

interface Properties { lang: Supported_Language }

export function Lessons_View({ lang }: Properties) {
  Use_Mastery_Tick();
  const { Browse_Path, Push_Browse, Set_Browse_Path } = Use_App();
  
  const [Lesson_Records, Set_Lesson_Records] = useState<Lesson_Record[]>([]);
  const [Loading, Set_Loading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const level = Browse_Path[3];
  const lesson = Browse_Path[4];

  // Fetch lesson records from database endpoint using client API
  useEffect(() => {
    let isMounted = true;
    Set_Loading(true);

    Get_Lessons_List(lang)
      .then((data) => {
        if (!isMounted) return;
        Set_Lesson_Records(data);
        setError(null);
      })
      .catch((err) => {
        console.error("An error occurred fetching lessons data: ", err);
        if (isMounted) {
          setError(err.message || "Failed to fetch lesson information.");
        }
      })
      .finally(() => {
        if (isMounted) Set_Loading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [lang]);

  // Transform flat lesson records into level-mapped structure
  const Corpus_Lessons = useMemo(() => {
    const map: Record<string, Record<string, any>> = {};
    for (const record of Lesson_Records) {
      if (!map[record.level]) {
        map[record.level] = {};
      }
      let content = record.content;
      if (!content && record.content_json) {
        try {
          content = JSON.parse(record.content_json);
        } catch (e) {
          content = [];
        }
      }
      map[record.level][record.slug] = content || [];
    }
    return map;
  }, [Lesson_Records]);

  // Derived levels sorted chronologically by Roman Numerals
  const levels = useMemo(() => {
    return Object.keys(Corpus_Lessons).sort((a, b) => Roman_To_Int(a) - Roman_To_Int(b));
  }, [Corpus_Lessons]);

  const Default_Lesson_Entry = useMemo(() => {
    if (levels.length === 0) return null;
    for (const lv of levels) {
      const lessons = Object.keys(Corpus_Lessons[lv] || {});
      if (lessons.length > 0) {
        return { level: lv, lesson: lessons[0] };
      }
    }
    return null;
  }, [levels, Corpus_Lessons]);

  // Handle first-visit routing logic
  useEffect(() => {
    if (Loading || Browse_Path.length !== 3) return;
    if (Has_Visited(lang)) return;
    if (!Default_Lesson_Entry) return;
    
    Mark_Visited(lang);
    Set_Browse_Path([Browse_Path[0], Browse_Path[1], "lessons", Default_Lesson_Entry.level, Default_Lesson_Entry.lesson]);
  }, [Browse_Path, lang, Set_Browse_Path, Loading, Default_Lesson_Entry]);

  if (Loading) return <div className="text-sm py-6 text-center opacity-60">Loading lesson configurations...</div>;
  if (error) return <div className="text-sm py-6 text-center text-destructive">Error Loading systems: {error}</div>;

  // ── Runner ─────────────────────────────────────────────────────────────
  if (level && lesson) {
    const Raw_Lesson_Data = Corpus_Lessons[level]?.[lesson];
    let steps: any[] | null = null;

    if (Raw_Lesson_Data) {
      // Support both top-level tuple array format and object-wrapped steps
      const rawSteps = Array.isArray(Raw_Lesson_Data)
        ? Raw_Lesson_Data
        : (Raw_Lesson_Data.steps || []);

      if (lesson === "The-Alphabet") {
        const parsed = Parse_Alphabet_Lesson(rawSteps);
        steps = Flatten_Steps(parsed.content);
      } else {
        steps = rawSteps;
      }
    }

    if (!steps?.length) {
      return <div className="text-sm py-6 text-center opacity-60">Lesson is empty.</div>;
    }
    return (
      <Lesson_Runner
        lang={lang}
        id={Lesson_ID(level, lesson)}
        title={lesson.replace(/-/g, " ")}
        steps={steps}
        On_Done={() => Set_Browse_Path(Browse_Path.slice(0, -1))}
      />
    );
  }

  // ── Lessons grid ───────────────────────────────────────────────────────
  if (level) {
    const Raw_Lessons_Object = Corpus_Lessons[level] || {};
    const lessons: Lesson_Summary[] = Object.keys(Raw_Lessons_Object).map(slug => ({
      slug,
      title: Title_From_Slug(slug)
    }));

    if (!lessons.length) return <div className="text-sm py-6 text-center opacity-60">No lessons yet.</div>;
    return (
      <div className={Class_Names(GRID, "max-w-4xl mx-auto")}>
        {lessons.map((l, i) => {
          const id = Lesson_ID(level, l.slug);
          const Prev_ID = i === 0 ? undefined : Lesson_ID(level, lessons[i - 1].slug);
          const Locked = !Is_Unlocked(lang, id, Prev_ID);
          const m = Get_Mastery(lang, id);
          return (
            <Lockable_Card
              key={l.slug}
              title={l.title}
              Locked={Locked}
              Stars={m.Stars}
              onOpen={() => Push_Browse(l.slug)}
            />
          );
        })}
      </div>
    );
  }

  // ── Levels grid ────────────────────────────────────────────────────────
  if (!levels.length) {
    return <div className="text-sm py-6 text-center opacity-60">No lessons yet.</div>;
  }

  return (
    <div className={Class_Names(GRID, "max-w-4xl mx-auto")}>
      {levels.map((lv, i) => {
        const id = Lesson_ID(lv);
        const Raw_Prev_Lessons = i === 0 ? [] : Object.keys(Corpus_Lessons[levels[i - 1]] || {});
        const First_Of_Previous_Slug = Raw_Prev_Lessons[0];
        const Prev_Lesson_ID = First_Of_Previous_Slug ? Lesson_ID(levels[i - 1], First_Of_Previous_Slug) : undefined;
        
        const Locked = i > 0 && !Is_Unlocked(lang, id, Prev_Lesson_ID);
        const Has_Lessons = Object.keys(Corpus_Lessons[lv] || {}).length > 0;
        return (
          <Lockable_Card
            key={lv}
            title={lv}
            subtitle={Has_Lessons ? undefined : "Coming soon"}
            Locked={Locked}
            Stars={0}
            onOpen={() => Push_Browse(lv)}
          />
        );
      })}
    </div>
  );
}

/* ─────────────────────────── Runner ─────────────────────────── */

function Lesson_Runner({ lang, id, title, steps, On_Done }: {
  lang: Supported_Language;
  id: string;
  title: string;
  steps: any[];
  On_Done: () => void;
}) {
  const [Index, Set_Index] = useState(0);
  const [Practice_Total, setPracticeTotal] = useState(0);
  const [Practice_Ok, setPracticeOk] = useState(0);
  const [result, setResult] = useState<null | ReturnType<typeof Record_Result>>(null);
  const done = Index >= steps.length;

  useEffect(() => { Set_Index(0); setPracticeTotal(0); setPracticeOk(0); setResult(null); }, [id]);

  useEffect(() => {
    Lesson_Progress.set({ current: Math.min(Index, steps.length), total: steps.length });
    return () => Lesson_Progress.set(null);
  }, [Index, steps.length]);

  useEffect(() => {
    if (!done || result) return;
    const Accuracy = Practice_Total ? Practice_Ok / Practice_Total : 1;
    const perfect = Practice_Total > 0 && Practice_Ok === Practice_Total;
    setResult(Record_Result(lang, id, { perfect, Accuracy }));
  }, [done, result, Practice_Ok, Practice_Total, lang, id]);

  if (done) {
    const Accuracy = Practice_Total ? Practice_Ok / Practice_Total : 1;
    const perfect = Practice_Total > 0 && Practice_Ok === Practice_Total;
    const Next_In_Days = result?.nextReviewAt
      ? Math.max(1, Math.round((result.nextReviewAt - Date.now()) / 86_400_000))
      : null;
    return (
      <div className="max-w-md lg:max-w-xl mx-auto w-full">
        <Lesson_Complete_Screen
          title={title}
          Stars={result?.Stars ?? 0}
          Practice_Total={Practice_Total}
          Practice_Ok={Practice_Ok}
          Accuracy={Accuracy}
          perfect={perfect}
          Next_In_Days={Next_In_Days}
          On_Done={On_Done}
        />
      </div>
    );
  }

  return (
    <div className="max-w-md lg:max-w-xl mx-auto w-full space-y-4">
      <Exercise
        key={Index}
        step={steps[Index]}
        onResult={(ok) => {
          const kind = steps[Index]?.kind;
          if (Practice_Kinds.has(kind)) {
            setPracticeTotal(t => t + 1);
            if (ok) setPracticeOk(c => c + 1);
          }
          Set_Index(i => i + 1);
        }}
      />
    </div>
  );
}

// Legacy compat exports for Layout / older callers.
export interface Unit { id: string; title: string }
export function Build_All_Units(_lang: Supported_Language): Unit[] { return []; }
export function Find_Unit(_unitId: string): Unit | undefined { return undefined; }