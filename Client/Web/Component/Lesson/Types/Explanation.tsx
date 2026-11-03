import { Container } from "@Web/Component/UI/container";
import { Action_Bar, type Exercise_Properties } from "./Shared";

// Explanation blocks are now pure content — no title field (it's embedded
// as an <h3> inside the HTML body) and no attached question. Inline checks
// are their own step (see CheckExercise) that follows in sequence.
export function Explanation_Exercise({ step, onResult }: Exercise_Properties) {
  return (
    <div className="space-y-4 pb-24">
      <Container className="p-6">
        <div
          className="text-sm leading-relaxed space-y-2 [&_h3]:text-lg [&_h3]:sm:text-xl [&_h3]:font-bold [&_h3]:mb-1"
          dangerouslySetInnerHTML={{ __html: step.body }}
        />
      </Container>
      <Action_Bar primary={{ label: "Continue", onClick: () => onResult(true) }} />
    </div>
  );
}