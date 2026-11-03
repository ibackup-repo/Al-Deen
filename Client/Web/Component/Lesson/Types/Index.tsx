// Barrel export + dispatcher for every exercise type. This is the single
// entry point the rest of the app imports from.
import type { Exercise_Properties } from "./Shared";
import { Learn_Exercise } from "./Learn";
import { Flashcard_Exercise } from "./Flashcard";
import { Multiple_Choice_Exercise } from "./Multiple-Choice";
import { Match_Pairs_Exercise } from "./Match-Pairs";
import { Build_Exercise } from "./Build-The-Answer";
import { Type_Answer_Exercise } from "./Type-Answer";
import { Image_Select_Exercise } from "./Image-Select";
import { Objective_Exercise } from "./Objective";
import { Explanation_Exercise } from "./Explanation";
import { Did_You_Know_Exercise } from "./Did-You-Know";
import { Vocabulaire_Exercise } from "./Vocabulary";
import { Summary_Exercise } from "./Summary";
import { Lesson_Complete_Screen } from "./Lesson-Complete";

export type { Exercise_Properties };
export { Action_Bar, shuffle } from "./Shared";
export { Learn_Exercise } from "./Learn";
export { Flashcard_Exercise } from "./Flashcard";
export { Multiple_Choice_Exercise } from "./Multiple-Choice";
export { Match_Pairs_Exercise } from "./Match-Pairs";
export { Build_Exercise } from "./Build-The-Answer";
export { Type_Answer_Exercise } from "./Type-Answer";
export { Image_Select_Exercise } from "./Image-Select";
export { Objective_Exercise } from "./Objective";
export { Explanation_Exercise } from "./Explanation";
export { Did_You_Know_Exercise } from "./Did-You-Know";
export { Vocabulaire_Exercise } from "./Vocabulary";
export { Summary_Exercise } from "./Summary";
export { Lesson_Complete_Screen } from "./Lesson-Complete";

// ── Dispatcher ───────────────────────────────────────────────────────────────
export function Exercise({ step, onResult }: Exercise_Properties) {
  switch (step.kind) {
    case "objective":        return <Objective_Exercise step={step} onResult={onResult} />;
    case "explanation":      return <Explanation_Exercise step={step} onResult={onResult} />;
    case "didYouKnow":       return <Did_You_Know_Exercise step={step} onResult={onResult} />;
    case "vocab":            return <Vocabulaire_Exercise step={step} onResult={onResult} />;
    case "summary":          return <Summary_Exercise step={step} onResult={onResult} />;
    case "Active_Recall":     return <Explanation_Exercise step={step} onResult={onResult} />;
    case "learn":            return <Learn_Exercise step={step} onResult={onResult} />;
    case "flashcard":        return <Flashcard_Exercise step={step} onResult={onResult} />;
    case "multipleChoice":   return <Multiple_Choice_Exercise step={step} onResult={onResult} />;
    case "matchPairs":       return <Match_Pairs_Exercise step={step} onResult={onResult} />;
    case "buildTranslation":
    case "orderSentence":    return <Build_Exercise step={step} onResult={onResult} />;
    case "fillBlank":
    case "typeAnswer":
    case "listenType":       return <Type_Answer_Exercise step={step} onResult={onResult} />;
    case "imageSelect":      return <Image_Select_Exercise step={step} onResult={onResult} />;
    case "listenChoose":     return <Multiple_Choice_Exercise step={step} onResult={onResult} />;
    case "speaking":         return <Learn_Exercise step={step} onResult={onResult} />;
    default:                 return <Learn_Exercise step={step} onResult={onResult} />;
  }
}