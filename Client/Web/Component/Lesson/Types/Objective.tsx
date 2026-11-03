import { Container } from "@Web/Component/UI/container";
import { Action_Bar, type Exercise_Properties } from "./Shared";

export function Objective_Exercise({ step, onResult }: Exercise_Properties) {
  return (
    <div className="space-y-4 pb-24">
      <Container className="p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-3">{step.title}</h2>
        <ul className="space-y-2 text-sm">
          {(step.points ?? []).map((p: string, i: number) => (
            <li key={i} className="flex gap-2"><span className="opacity-60">•</span><span>{p}</span></li>
          ))}
        </ul>
      </Container>
      <Action_Bar primary={{ label: "Let's go", onClick: () => onResult(true) }} />
    </div>
  );
}