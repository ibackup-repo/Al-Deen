// @Web/Component/Word/Buttons/Mark_Button.tsx
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { Use_Marked_Words } from "@/Hook/Use-Marked-Words";
import { Class_Names } from "@/Library/Utility";

interface Mark_Button_Properties {
  Word_ID: string;
  className?: string;
}

export function Mark_Button({ Word_ID, className }: Mark_Button_Properties) {
  const { Course_Language, t } = Use_Course_Language();
  const { Is_Marked, toggle } = Use_Marked_Words();
  const Marked = Is_Marked(Course_Language as any, Word_ID);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggle(Course_Language as any, Word_ID);
      }}
      className={Class_Names(
        "w-10 h-10 shrink-0 flex items-center justify-center rounded-full border-2 border-border transition-colors",
        Marked ? "bg-foreground text-background" : "bg-background hover:bg-foreground hover:text-background",
        className
      )}
      aria-label={Marked ? t("unmark") : t("mark")}
    >
      {Marked ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
    </button>
  );
}