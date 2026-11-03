// @Web/Component/Header/Recall.tsx
import { useNavigate, useLocation } from "react-router-dom";
import { Brain } from "lucide-react";
import { Use_App } from "@Web/Context/App";

export function Recall_Button() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract global selection states from context
  const { 
    Set_Active_Recall,
    Select_Mode = false,
    Set_Select_Mode = () => {},
    selected = new Set<string>(),
    Set_Selected = () => {}
  } = Use_App();

  // Extract path segments: e.g., ["Language", "English", "Dictionary", "Vocabulary", "Adjective", "Description", "Beautiful"]
  const segments = location.pathname.split("/").filter(Boolean);

  // Guard: Only render if we are inside the vocabulary Category, subcategory, or word detail tracks
  const Is_Dictionary_Path = 
    segments[0]?.toLowerCase() === "language" &&
    segments[2]?.toLowerCase() === "dictionary" &&
    segments[3]?.toLowerCase() === "vocabulary";

  if (!Is_Dictionary_Path) {
    return null;
  }

  const Handle_Recall_Click = () => {
    const Category_ID = segments[4];
    const Subcategory_ID = segments[5];
    const Word_ID = segments[6] ? decodeURIComponent(segments[6]) : undefined;

    // 1. If in Select_Mode and words are checked, study ONLY the selected words
    if (Select_Mode && selected.size > 0) {
      Set_Active_Recall({
        Scope: "word",
        Category_ID: Category_ID || "",
        Subcategory_ID: Subcategory_ID || "",
        Word_IDs: Array.from(selected),
      });

      // Clear the selection mode and current queue
      Set_Select_Mode(false);
      Set_Selected(new Set());
      
    } else {
      // 2. Fall back to original Scope-based active recall logic
      if (Word_ID && Category_ID && Subcategory_ID) {
        Set_Active_Recall({
          Scope: "word",
          Category_ID,
          Subcategory_ID,
          Word_IDs: [Word_ID],
        });
      } else if (Subcategory_ID && Category_ID) {
        Set_Active_Recall({
          Scope: "subcategory",
          Category_ID,
          Subcategory_ID,
        });
      } else if (Category_ID) {
        Set_Active_Recall({
          Scope: "Category",
          Category_ID,
        });
      }
    }

    // 3. Instead of navigating to "/Recall", append "?Recall" to the current path slug
    navigate(`${location.pathname}?Recall`);
  };

  const Has_Selections = Select_Mode && selected.size > 0;

  return (
    <button
      type="button"
      onClick={Handle_Recall_Click}
      className="w-10 h-10 shrink-0 relative flex items-center justify-center rounded-full bg-background border-2 border-border text-foreground hover:bg-foreground hover:text-background transition-colors"
      aria-label="Recall"
    >
      <Brain className="h-5 w-5" />
      
      {/* Dynamic selection badge adjusted for 40x40px alignment */}
      {Has_Selections && (
        <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-foreground text-background text-[10px] font-bold ring-2 ring-background">
          {selected.size}
        </span>
      )}
    </button>
  );
}