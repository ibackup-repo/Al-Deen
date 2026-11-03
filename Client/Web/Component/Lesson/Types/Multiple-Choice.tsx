import { useState } from "react";
import { Container } from "@Web/Component/UI/container";
import { Class_Names } from "@/Library/Utility";
import { Action_Bar, type Exercise_Properties } from "./Shared";

// Prompt lives in a Container; the answer options are standalone floating
// buttons underneath (not nested inside the Container). Used both for the
// Practice-section multiple choice items and the inline mini check that
// follows an Explanation step ("check" kind).
export function Multiple_Choice_Exercise({ step, onResult }: Exercise_Properties) {
  const [Picked, Set_Picked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const Correct = Picked === step.answer;

  return (
    <div className="space-y-4 pb-24">
      <Container className="p-6 text-center">
        <h2 className="text-xl sm:text-2xl font-bold">{step.prompt}</h2>
      </Container>
      <div className="grid gap-2">
        {step.options.map((opt: string, i: number) => (
          <button
            key={i}
            disabled={checked}
            onClick={() => Set_Picked(i)}
            className={Class_Names(
              "px-4 py-3 rounded-[14px] border-2 text-left font-semibold transition-colors",
              !checked && Picked === i && "border-foreground bg-muted",
              !checked && Picked !== i && "border-border hover:bg-muted",
              checked && i === step.answer && "border-emerald-500 bg-emerald-500/15",
              checked && Picked === i && i !== step.answer && "border-rose-500 bg-rose-500/15",
              checked && Picked !== i && i !== step.answer && "opacity-50",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
      <Action_Bar
        primary={
          !checked
            ? { label: "Check", disabled: Picked === null, onClick: () => setChecked(true) }
            : { label: "Continue", onClick: () => onResult(Correct) }
        }
      />
    </div>
  );
}