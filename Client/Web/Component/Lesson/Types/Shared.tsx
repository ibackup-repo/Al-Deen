// Shared Types + helpers used across every exercise type.
import { Button } from "@Web/Component/UI/button";
import { Class_Names } from "@/Library/Utility";

export interface Exercise_Properties {
  step: any;
  onResult: (Correct: boolean) => void;
}

export function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ── Shared bottom action bar ──────────────────────────────────────────────
// Fixed to the bottom of the viewport (not just the nearest scroll
// container). One button: full-width. Two buttons: stacked (primary on
// top) on mobile, side-by-side (secondary left / primary right) from sm: up.
export interface Action_Bar_Properties {
  primary: { label: string; onClick: () => void; disabled?: boolean };
  secondary?: { label: string; onClick: () => void; disabled?: boolean };
}
export function Action_Bar({ primary, secondary }: Action_Bar_Properties) {
  const showSecondary = !!secondary && !secondary.disabled;
  const showPrimary = !primary.disabled;
  const bothHidden = !showSecondary && !showPrimary;

  return (
    <div className="fixed bottom-0 z-40 pb-4">
      <div
        className={Class_Names(
          "flex flex-col-reverse gap-2 px-4 pb-2 max-w-md lg:max-w-xl mx-auto",
          secondary && (bothHidden ? "sm:flex-row sm:justify-center" : "sm:flex-row sm:justify-between"),
        )}
      >
        {showSecondary && (
          <Button
            OnClick={secondary!.onClick}
            Label={secondary!.label}
            Color="#000000"
            TextColor="#ffffff"
            className="w-full sm:w-auto sm:min-w-[140px]"
          />
        )}
        {showPrimary && (
          <Button
            OnClick={primary.onClick}
            Label={primary.label}
            Color="#000000"
            TextColor="#ffffff"
            className={Class_Names(
              "w-full sm:w-auto sm:min-w-[140px]",
              bothHidden ? "sm:ml-0" : "sm:ml-auto",
            )}
          />
        )}
      </div>
    </div>
  );
}