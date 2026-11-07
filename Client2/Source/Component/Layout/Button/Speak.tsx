// @Web/Component/Word/Buttons/Speak_Button.tsx
import { Volume2 } from "lucide-react";
import { speak, Is_Speech_Available } from "@Web/Component/Practice/speech";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { Class_Names } from "@/Library/Utility";

interface Speak_Button_Properties {
  Target_Text: string;
  className?: string;
}

export function Speak_Button({ Target_Text, className }: Speak_Button_Properties) {
  const { Course_Language, t } = Use_Course_Language();

  if (!Is_Speech_Available()) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        speak(Target_Text, Course_Language as any);
      }}
      className={Class_Names(
        "w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-background border-2 border-border hover:bg-foreground hover:text-background transition-colors",
        className
      )}
      aria-label={t("play") || "Play"}
    >
      <Volume2 className="h-5 w-5" />
    </button>
  );
}