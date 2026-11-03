import { Container } from "@Web/Component/UI/container";
import { Action_Bar, type Exercise_Properties } from "./Shared";

export function Learn_Exercise({ step, onResult }: Exercise_Properties) {
  return (
    <div className="space-y-4 pb-24">
      <Container className="p-6 text-center space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold">{step.word ?? step.title}</h2>
        {step.ipa && <p className="text-lg opacity-80 font-mono">{step.ipa}</p>}
        {step.note && <p className="text-sm opacity-70">{step.note}</p>}
      </Container>
      <Action_Bar primary={{ label: "Got it", onClick: () => onResult(true) }} />
    </div>
  );
}