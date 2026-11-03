import { Star } from "lucide-react";
import { Container } from "@Web/Component/UI/container";
import { Class_Names } from "@/Library/Utility";
import { Action_Bar } from "./Shared";

// Shown once a runner finishes all steps. Title/Stars/stats live in a
// Container; the Continue button uses the same fixed Action_Bar as exercises.
interface Lesson_Complete_Screen_Properties {
  title: string;
  Stars: number;
  Practice_Total: number;
  Practice_Ok: number;
  Accuracy: number;
  perfect: boolean;
  Next_In_Days: number | null;
  On_Done: () => void;
}
export function Lesson_Complete_Screen({
  title, Stars, Practice_Total, Practice_Ok, Accuracy, perfect, Next_In_Days, On_Done,
}: Lesson_Complete_Screen_Properties) {
  return (
    <div className="space-y-4 pb-24">
      <Container className="p-6 sm:p-8 text-center space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold">Lesson complete</h2>
        <p className="text-sm opacity-70 capitalize">{title}</p>
        <div className="flex items-center justify-center gap-1 py-2">
          {[1, 2, 3, 4, 5].map(n => (
            <Star key={n} className={Class_Names("h-7 w-7 sm:h-8 sm:w-8", Stars >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
          ))}
        </div>
        {Practice_Total > 0 && (
          <p className="text-sm opacity-70">
            Practice: {Practice_Ok} / {Practice_Total} ({Math.round(Accuracy * 100)}%)
            {perfect ? " — perfect!" : ""}
          </p>
        )}
        {Stars === 5
          ? <p className="text-sm font-semibold text-amber-500">Mastered ★</p>
          : Next_In_Days !== null && <p className="text-xs opacity-60">Next review in {Next_In_Days} day{Next_In_Days === 1 ? "" : "s"}</p>}
      </Container>
      <Action_Bar primary={{ label: "Continue", onClick: On_Done }} />
    </div>
  );
}