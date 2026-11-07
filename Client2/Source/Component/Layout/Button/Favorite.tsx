// @Web/Component/Word/Buttons/Favorite_Button.tsx
import { Star } from "lucide-react";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { Use_Favorite_Words } from "@/Hook/Use-Favorite-Words";
import { Class_Names } from "@/Library/Utility";

interface Favorite_Button_Properties {
  Word_ID: string;
  className?: string;
}

export function Favorite_Button({ Word_ID, className }: Favorite_Button_Properties) {
  const { Course_Language, t } = Use_Course_Language();
  const { Is_Favorite, toggle: Toggle_Fav } = Use_Favorite_Words();
  const Favored = Is_Favorite(Course_Language as any, Word_ID);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        Toggle_Fav(Course_Language as any, Word_ID);
      }}
      className={Class_Names(
        "w-10 h-10 shrink-0 flex items-center justify-center rounded-full border-2 border-border transition-colors",
        Favored ? "bg-foreground text-background" : "bg-background hover:bg-foreground hover:text-background",
        className
      )}
      aria-label={Favored ? (t("unfavorite") || "Unfavorite") : (t("favorite") || "Favorite")}
    >
      {Favored ? <Star className="h-5 w-5 fill-current" /> : <Star className="h-5 w-5" />}
    </button>
  );
}