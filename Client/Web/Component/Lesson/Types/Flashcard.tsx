import { useState } from "react";
import { Container } from "@Web/Component/UI/container";
import { Action_Bar, type Exercise_Properties } from "./Shared";

export function Flashcard_Exercise({ step, onResult }: Exercise_Properties) {
  const [Flipped, Set_Flipped] = useState(false);
  return (
    <div className="space-y-4 pb-24">
      <Container className="p-6 text-center">
        <button
          onClick={() => Set_Flipped(f => !f)}
          className="w-full min-h-[160px] rounded-2xl border-2 border-border flex items-center justify-center text-3xl font-bold hover:bg-muted"
        >
          {Flipped ? step.back : step.front}
        </button>
      </Container>
      <Action_Bar
        secondary={{ label: "Hard", onClick: () => onResult(false) }}
        primary={{ label: "Easy", onClick: () => onResult(true) }}
      />
    </div>
  );
}