// @Web/Component/Header/Select.tsx
import { CheckSquare, X } from "lucide-react";
import { Use_App } from "@Web/Context/App";

export function Select_Button() {
  // Safe extraction of global states from Use_App
  const context = Use_App();
  const Select_Mode = context.Select_Mode || false;
  const Set_Select_Mode = context.Set_Select_Mode || (() => {});
  const Set_Selected = context.Set_Selected || (() => {});

  const Handle_Toggle_Select = () => {
    if (typeof Set_Select_Mode === "function") {
      Set_Select_Mode(!Select_Mode);
    }
    // Clear selection buffer when toggling selection mode state
    if (typeof Set_Selected === "function") {
      Set_Selected(new Set<string>());
    }
  };

  return (
    <button 
      type="button"
      onClick={Handle_Toggle_Select} 
      className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full border-2 border-border transition-colors bg-background hover:bg-foreground hover:text-background"
      aria-label={Select_Mode ? "Cancel selection" : "Select words"}
    >
      {Select_Mode ? (
        <X className="h-5 w-5" />
      ) : (
        <CheckSquare className="h-5 w-5" />
      )}
    </button>
  );
}