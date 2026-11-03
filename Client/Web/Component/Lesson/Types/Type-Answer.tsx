import { useState } from "react";
import { Container } from "@Web/Component/UI/container";
import { Class_Names } from "@/Library/Utility";
import { Action_Bar, type Exercise_Properties } from "./Shared";

export function Type_Answer_Exercise({ step, onResult }: Exercise_Properties) {
  const [text, setText] = useState("");
  const [checked, setChecked] = useState(false);
  const Correct = text.trim().toLowerCase() === String(step.answer).trim().toLowerCase();
  return (
    <div className="space-y-4 pb-24">
      <Container className="p-6 text-center">
        <h2 className="text-xl sm:text-2xl font-bold">{step.prompt}</h2>
      </Container>
      <input
        autoFocus
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={checked}
        className="w-full px-4 py-3 rounded-[12px] border-2 border-border bg-background"
      />
      {checked && (
        <p className={Class_Names("text-center font-semibold", Correct ? "text-emerald-500" : "text-rose-500")}>
          {Correct ? "Correct!" : `Answer: ${step.answer}`}
        </p>
      )}
      <Action_Bar
        primary={
          !checked
            ? { label: "Check", disabled: !text, onClick: () => setChecked(true) }
            : { label: "Continue", onClick: () => onResult(Correct) }
        }
      />
    </div>
  );
}