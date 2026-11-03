import { Container } from "@Web/Component/UI/container";
import { Action_Bar, type Exercise_Properties } from "./Shared";

export function Did_You_Know_Exercise({ step, onResult }: Exercise_Properties) {
  return (
    <div className="space-y-4 pb-24">
      <Container className="p-6 text-center">
        <p className="text-base leading-relaxed">{step.fact}</p>
      </Container>
      <Action_Bar primary={{ label: "Cool", onClick: () => onResult(true) }} />
    </div>
  );
}