import { useState } from "react";
import { Container } from "@Web/Component/UI/container";
import { Class_Names } from "@/Library/Utility";
import { Action_Bar, type Exercise_Properties } from "./Shared";

// Prompt in a Container; the tray + token buttons float standalone below it.
export function Build_Exercise({ step, onResult }: Exercise_Properties) {
  const tokens: string[] = step.tokens;
  const answer: number[] = step.answer;
  const [Picked, Set_Picked] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const Correct = Picked.length === answer.length && Picked.every((p, i) => p === answer[i]);

  const toggle = (i: number) => {
    if (checked) return;
    Set_Picked(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);
  };

  return (
    <div className="space-y-4 pb-24">
      <Container className="p-6 text-center">
        <h2 className="text-xl sm:text-2xl font-bold">{step.prompt}</h2>
      </Container>
      <div className="min-h-[60px] p-3 rounded-[12px] border-2 border-dashed border-border flex flex-wrap gap-2">
        {Picked.map((i, pos) => (
          <button key={pos} onClick={() => toggle(i)} disabled={checked}
            className="px-3 py-2 rounded-[10px] border-2 border-foreground bg-muted font-semibold text-sm">
            {tokens[i]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {tokens.map((t, i) => (
          <button key={i} onClick={() => toggle(i)} disabled={checked || Picked.includes(i)}
            className={Class_Names(
              "px-3 py-2 rounded-[10px] border-2 font-semibold text-sm transition-colors",
              Picked.includes(i) ? "opacity-30 border-border" : "border-border hover:bg-muted",
            )}>
            {t}
          </button>
        ))}
      </div>
      {checked && (
        <p className={Class_Names("text-center font-semibold", Correct ? "text-emerald-500" : "text-rose-500")}>
          {Correct ? "Correct!" : "Not quite."}
        </p>
      )}
      {checked && !Correct && (
        <p className="text-sm text-center opacity-70">Answer: {answer.map(i => tokens[i]).join(" ")}</p>
      )}
      <Action_Bar
        primary={
          !checked
            ? { label: "Check", disabled: Picked.length === 0, onClick: () => setChecked(true) }
            : { label: "Continue", onClick: () => onResult(Correct) }
        }
      />
    </div>
  );
}