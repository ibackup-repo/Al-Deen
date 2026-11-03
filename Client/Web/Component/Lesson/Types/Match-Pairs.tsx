import { useEffect, useState } from "react";
import { Button } from "@Web/Component/UI/button";
import { Class_Names } from "@/Library/Utility";
import { shuffle, type Exercise_Properties } from "./Shared";

export function Match_Pairs_Exercise({ step, onResult }: Exercise_Properties) {
  const pairs: [string, string][] = step.pairs;
  const [left] = useState(() => pairs.map(p => p[0]));
  const [right] = useState(() => shuffle(pairs.map(p => p[1])));
  const [Sel_Left, Set_Sel_Left] = useState<number | null>(null);
  const [Sel_Right, Set_Sel_Right] = useState<number | null>(null);
  const [matched, Set_Matched] = useState<Set<string>>(new Set());
  const [Wrong, Set_Wrong] = useState(0);
  const [mismatchPair, Set_MismatchPair] = useState<{ left: number; right: number } | null>(null);

  useEffect(() => {
    if (Sel_Left === null || Sel_Right === null) return;

    const l = left[Sel_Left];
    const r = right[Sel_Right];
    const Is_Match = pairs.some(p => p[0] === l && p[1] === r);

    if (Is_Match) {
      Set_Matched(m => new Set([...m, l, r]));
      Set_Sel_Left(null);
      Set_Sel_Right(null);
    } else {
      Set_Wrong(w => w + 1);
      // Temporarily mark as mismatched to trigger the red flashing style
      Set_MismatchPair({ left: Sel_Left, right: Sel_Right });
      setTimeout(() => {
        Set_MismatchPair(null);
        Set_Sel_Left(null);
        Set_Sel_Right(null);
      }, 500);
    }
  }, [Sel_Left, Sel_Right, left, right, pairs]);

  useEffect(() => {
    if (matched.size === pairs.length * 2) {
      setTimeout(() => onResult(Wrong <= 1), 400);
    }
  }, [matched, pairs.length, Wrong, onResult]);

  const cell = (
    text: string, 
    index: number, 
    side: "left" | "right", 
    selected: boolean, 
    done: boolean, 
    onClick: () => void
  ) => {
    const isMismatched = mismatchPair !== null && (side === "left" ? mismatchPair.left === index : mismatchPair.right === index);

    // Initial default: Transparent/White background, black text (#000000)
    let color = "transparent";
    let textColor = "#000000";

    if (selected) {
      // Selected: Black background, white text (#ffffff)
      color = "#000000";
      textColor = "#ffffff";
    }

    if (isMismatched) {
      // Flash red on incorrect pair match
      color = "#ef4444";
      textColor = "#ffffff";
    }

    return (
      <Button
        OnClick={onClick}
        Disabled={done || isMismatched}
        Label={text}
        Color={color}
        TextColor={textColor}
        className={Class_Names(
          "px-3 py-3 rounded-[12px] border-2 border-black font-semibold text-sm transition-all w-full",
          done && "opacity-0 pointer-events-none", // Hide button when pair is matched
          isMismatched && "border-red-500 animate-shake",
        )}
      />
    );
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          {left.map((t, i) =>
            cell(
              t,
              i,
              "left",
              Sel_Left === i,
              matched.has(t),
              () => Set_Sel_Left(Sel_Left === i ? null : i)
            )
          )}
        </div>
        <div className="grid gap-2">
          {right.map((t, i) =>
            cell(
              t,
              i,
              "right",
              Sel_Right === i,
              matched.has(t),
              () => Set_Sel_Right(Sel_Right === i ? null : i)
            )
          )}
        </div>
      </div>
    </div>
  );
}