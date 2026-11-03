/**
 * Localized Type Boundaries to eliminate backend build leakage.
 * Replicates the base tuple pattern used across raw language lesson arrays.
 */
export type Lesson_Step = [string, ...any[]];

export interface Objective_Step {
  kind: "objective";
  title: string;
  points: string[];
}

export interface Explanation_Step {
  kind: "explanation";
  body: string;
}

// Both the inline mini-check after an Explanation and the Practice-section
// multiple choice items share this exact shape — no need for a separate
// "check" kind, the dispatcher/component are identical either way.
export interface Multiple_Choice_Step {
  kind: "multipleChoice";
  prompt: string;
  options: string[];
  answer: number;
}

export interface Did_You_Know_Step {
  kind: "didYouKnow";
  fact: string;
}

export interface Vocabulaire_Entry {
  letter: string;
  ipa: string;
  uppercase: string;
  lowercase: string;
}

export interface Vocabulaire_Step {
  kind: "vocab";
  entries: Vocabulaire_Entry[];
}

export interface Match_Pairs_Activity {
  kind: "matchPairs";
  items: Array<{ prompt: string; pairs: [string, string][] }>;
}

export interface Multiple_Choice_Activity {
  kind: "multipleChoice";
  items: Array<{ prompt: string; options: string[]; answer: number }>;
}

export interface Type_Answer_Activity {
  kind: "typeAnswer";
  items: Array<{ prompt: string; answer: string }>;
}

export interface Order_Sentence_Activity {
  kind: "orderSentence";
  items: Array<{ prompt: string; tokens: string[]; answer: number[] }>;
}

export type Practice_Activity =
  | Match_Pairs_Activity
  | Multiple_Choice_Activity
  | Type_Answer_Activity
  | Order_Sentence_Activity;

export interface Practice_Step {
  kind: "practice";
  activities: Practice_Activity[];
}

export interface Summary_Step {
  kind: "summary";
  title: string;
  points: string[];
}

export type Alphabet_Content_Block =
  | Objective_Step
  | Explanation_Step
  | Multiple_Choice_Step
  | Did_You_Know_Step
  | Vocabulaire_Step
  | Practice_Step
  | Summary_Step;

export interface Alphabet_Lesson {
  pattern: "alphabet";
  content: Alphabet_Content_Block[];
  // Convenience accessors, derived from `content`, for callers that don't
  // want to walk the ordered block list.
  objective: Objective_Step | null;
  explanations: Explanation_Step[];
  didYouKnow: Did_You_Know_Step[];
  vocab: Vocabulaire_Entry[];
  practice: Practice_Activity[];
  summary: Summary_Step | null;
}

const Practice_Activity_Parsers: Record<string, (items: any[]) => Practice_Activity> = {
  "Match Pairs": (items) => ({
    kind: "matchPairs",
    items: items.map(([prompt, pairs]) => ({
      prompt,
      pairs: pairs as [string, string][],
    })),
  }),
  "Multiple Choice": (items) => ({
    kind: "multipleChoice",
    items: items.map(([prompt, options, answer]) => ({ prompt, options, answer })),
  }),
  "Type Answer": (items) => ({
    kind: "typeAnswer",
    items: items.map(([prompt, answer]) => ({ prompt, answer })),
  }),
  "Order Sentence": (items) => ({
    kind: "orderSentence",
    items: items.map(([prompt, tokens, answer]) => ({ prompt, tokens, answer })),
  }),
};

function Parse_Practice(activities: any[]): Practice_Step {
  const parsed: Practice_Activity[] = [];
  for (const [type, items] of activities) {
    const parser = Practice_Activity_Parsers[type];
    if (parser) {
      parsed.push(parser(items));
    }
    // Unknown activity Types are silently skipped rather than throwing —
    // lesson JSON is content, not code, and shouldn't break rendering.
  }
  return { kind: "practice", activities: parsed };
}

function Parse_Vocabulaire(entries: any[]): Vocabulaire_Step {
  return {
    kind: "vocab",
    entries: entries.map(([letter, ipa, uppercase, lowercase]) => ({
      letter,
      ipa,
      uppercase,
      lowercase,
    })),
  };
}

export function Parse_Alphabet_Lesson(steps: Lesson_Step[]): Alphabet_Lesson {
  const content: Alphabet_Content_Block[] = [];

  for (const raw of steps as unknown as any[][]) {
    const [type, ...args] = raw;

    switch (type) {
      case "Objective": {
        const [title, points] = args;
        content.push({ kind: "objective", title, points });
        break;
      }
      case "Explanation": {
        const [body] = args;
        content.push({ kind: "explanation", body });
        break;
      }
      case "Multiple Choice": {
        const [prompt, options, answer] = args;
        content.push({ kind: "multipleChoice", prompt, options, answer });
        break;
      }
      case "Did You Know": {
        const [fact] = args;
        content.push({ kind: "didYouKnow", fact });
        break;
      }
      case "Vocab": {
        const [entries] = args;
        content.push(Parse_Vocabulaire(entries));
        break;
      }
      case "Practice": {
        const [activities] = args;
        content.push(Parse_Practice(activities));
        break;
      }
      case "Summary": {
        const [title, points] = args;
        content.push({ kind: "summary", title, points });
        break;
      }
      default:
        // Unknown block Types are silently skipped rather than throwing —
        // lesson JSON is content, not code, and shouldn't break rendering.
        break;
    }
  }

  const lesson: Alphabet_Lesson = {
    pattern: "alphabet",
    content,
    objective: (content.find(b => b.kind === "objective") as Objective_Step) ?? null,
    explanations: content.filter((b): b is Explanation_Step => b.kind === "explanation"),
    didYouKnow: content.filter((b): b is Did_You_Know_Step => b.kind === "didYouKnow"),
    vocab: (content.find(b => b.kind === "vocab") as Vocabulaire_Step)?.entries ?? [],
    practice: (content.find(b => b.kind === "practice") as Practice_Step)?.activities ?? [],
    summary: (content.find(b => b.kind === "summary") as Summary_Step) ?? null,
  };

  return lesson;
}