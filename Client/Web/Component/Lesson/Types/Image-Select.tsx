import { useState } from "react";
import { Container } from "@Web/Component/UI/container";
import { Class_Names } from "@/Library/Utility";
import { Action_Bar, type Exercise_Properties } from "./Shared";

export function Image_Select_Exercise({ step, onResult }: Exercise_Properties) {
  const [Picked, Set_Picked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const Correct_Index = step.options.findIndex((o: any) => o.Correct);
  return (
    <div className="space-y-4 pb-24">
      <Container className="p-6 text-center">
        <h2 className="text-xl sm:text-2xl font-bold">{step.prompt}</h2>
      </Container>
      <div className="grid grid-cols-2 gap-3">
        {step.options.map((opt: any, i: number) => (
          <button key={i} disabled={checked} onClick={() => Set_Picked(i)}
            className={Class_Names(
              "rounded-[14px] border-2 overflow-hidden aspect-square flex items-center justify-center",
              !checked && Picked === i && "border-foreground",
              !checked && Picked !== i && "border-border hover:bg-muted",
              checked && i === Correct_Index && "border-emerald-500",
              checked && Picked === i && i !== Correct_Index && "border-rose-500",
            )}>
            {opt.image
              ? <img src={opt.image} alt={opt.label ?? ""} className="w-full h-full object-cover" />
              : <span className="text-2xl font-bold p-4 text-center">{opt.label ?? "?"}</span>}
          </button>
        ))}
      </div>
      <Action_Bar
        primary={
          !checked
            ? { label: "Check", disabled: Picked === null, onClick: () => setChecked(true) }
            : { label: "Continue", onClick: () => onResult(Picked === Correct_Index) }
        }
      />
    </div>
  );
}