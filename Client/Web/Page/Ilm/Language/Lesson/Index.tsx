import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@Web/Component/UI/button";
import { Class_Names } from "@/Library/Utility";
import { toast } from "@Web/Component/UI/use-toast";
import { Supported_Language, Lesson_Record } from "@/Library/Language-Types";
import { Get_Lessons_List } from "@/Library/Language-API";
import { Is_Unlocked, Lesson_ID } from "@/Library/Lesson-Mastery";

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

interface LockableCardProps {
  title: string;
  subtitle?: string;
  locked: boolean;
  navigateTo: string;
  onOpen: () => void;
}

function LockableCard({ title, subtitle, locked, navigateTo, onOpen }: LockableCardProps) {
  const [clicks, setClicks] = useState(0);

  const onClick = () => {
    if (!locked) {
      return;
    }
    const next = clicks + 1;
    setClicks(next);
    if (next >= 3) {
      setClicks(0);
      toast({ title: "Unlocked" });
      onOpen();
    } else {
      toast({ title: `Locked — ${3 - next} more to bypass` });
      setTimeout(() => setClicks((c) => (c === next ? 0 : c)), 1200);
    }
  };

  const labelContent = (
    <div className="flex items-center justify-between gap-2 w-full text-left">
      <span className="flex-1">
        <span className="block font-semibold text-sm sm:text-base">{title}</span>
        {subtitle && <span className="block text-xs opacity-70">{subtitle}</span>}
      </span>
      {locked && <Lock className="h-4 w-4" />}
    </div>
  );

  return (
    <Button
      Label={labelContent}
      NavigateTo={locked ? undefined : navigateTo}
      OnClick={onClick}
      Height={64}
      Color="#000000"
      TextColor="#ffffff"
      className={Class_Names("w-full transition-transform sm:hover:scale-[1.02]", locked && "opacity-60")}
    />
  );
}

export default function Levels_Page() {
  const { Lang_Name } = useParams<{ Lang_Name: string }>();
  const activeLang = (Lang_Name || "English") as Supported_Language;
  const navigate = useNavigate();

  const [records, setRecords] = useState<Lesson_Record[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Get_Lessons_List(activeLang)
      .then((data) => {
        if (!isMounted) return;
        setRecords(data);
        setError(null);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Failed to fetch lesson data.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeLang]);

  const corpusLessons = useMemo(() => {
    const map: Record<string, Record<string, any>> = {};
    for (const record of records) {
      if (!map[record.level]) map[record.level] = {};
      let content = record.content;
      if (!content && record.content_json) {
        try {
          content = JSON.parse(record.content_json);
        } catch {
          content = [];
        }
      }
      map[record.level][record.slug] = content || [];
    }
    return map;
  }, [records]);

  const levels = useMemo(() => {
    return Object.keys(corpusLessons).sort((a, b) => Roman_To_Int(a) - Roman_To_Int(b));
  }, [corpusLessons]);

  if (loading) return <div className="text-sm py-6 text-center opacity-60">Loading levels...</div>;
  if (error) return <div className="text-sm py-6 text-center text-destructive">Error: {error}</div>;
  if (!levels.length) return <div className="text-sm py-6 text-center opacity-60">No levels available.</div>;

  return (
    <div className="px-8 py-4 w-full relative z-[60] max-w-8xl mx-auto">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
        {levels.map((lv, i) => {
          const id = Lesson_ID(lv);
          const prevLessons = i === 0 ? [] : Object.keys(corpusLessons[levels[i - 1]] || {});
          const prevLessonId = prevLessons[0] ? Lesson_ID(levels[i - 1], prevLessons[0]) : undefined;

          const locked = i > 0 && !Is_Unlocked(activeLang, id, prevLessonId);
          const hasLessons = Object.keys(corpusLessons[lv] || {}).length > 0;
          const targetUrl = `/Language/${activeLang}/Lesson/${lv}`;

          return (
            <LockableCard
              key={lv}
              title={lv}
              subtitle={hasLessons ? undefined : "Coming soon"}
              locked={locked}
              navigateTo={targetUrl}
              onOpen={() => navigate(targetUrl)}
            />
          );
        })}
      </div>
    </div>
  );
}