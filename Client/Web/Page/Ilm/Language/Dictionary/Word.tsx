import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckSquare, Clock, Square } from "lucide-react";
import { Use_App } from "@Web/Context/App";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { Use_Marked_Words } from "@/Hook/Use-Marked-Words";
import { Use_Favorite_Words } from "@/Hook/Use-Favorite-Words";
import { Use_Custom_Words } from "@/Hook/Use-Custom-Words";
import { Button } from "@Web/Component/UI/Button";
import { Class_Names } from "@/Library/Utility";
import { Supported_Language, Vocabulary_Record } from "@/Library/Language-Types";
import { Get_Vocabulary_List } from "@/Library/Language-API";

export default function Dictionary_Word() {
  const { Lang_Name, Category_ID, Subcategory_ID } = useParams<{ Lang_Name: string; Category_ID: string; Subcategory_ID: string }>();
  const navigate = useNavigate();
  
  const Active_Lang_Name = (Lang_Name || "English") as Supported_Language;
  const { Course_Language } = Use_Course_Language();
  
  const context = Use_App();
  const Recall_Queue = context.Recall_Queue || [];
  const Select_Mode = context.Select_Mode || false;
  const Set_Select_Mode = context.Set_Select_Mode || (() => {});
  const selected = context.selected || new Set<string>();
  const Set_Selected = context.Set_Selected || (() => {});
  
  // Global filter context variables
  const filter = context.filter || "all";

  const { Custom_Words, Apply_Override } = Use_Custom_Words(Category_ID || "", Subcategory_ID || "");
  const { Is_Marked } = Use_Marked_Words();
  const { Is_Favorite } = Use_Favorite_Words();

  const [Resolved_Words, Set_Resolved_Words] = useState<any[]>([]);
  const [Loading, Set_Loading] = useState<boolean>(true);

  useEffect(() => {
    if (!Category_ID || !Subcategory_ID) return;

    let isMounted = true;
    Set_Loading(true);

    Get_Vocabulary_List(Active_Lang_Name, Category_ID, Subcategory_ID)
      .then((records: Vocabulary_Record[]) => {
        if (!isMounted) return;

        // Map vocabulary DB records to the word structure expected by UI components
        const compiled = records.map((record) => ({
          id: record.slug,
          slug: record.slug,
          title: record.title,
          description: record.description || "",
          pluralOrNotes: record.plural_or_notes || "",
          diminutiveOrAlt: record.diminutive_or_alt || "",
          exampleSentence: record.example_sentence || ""
        }));

        Set_Resolved_Words(compiled);
        Set_Loading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch vocabulary words from API:", err);
        if (isMounted) {
          Set_Resolved_Words([]);
          Set_Loading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [Active_Lang_Name, Category_ID, Subcategory_ID]);

  const All_Words = useMemo(() => [...Resolved_Words, ...Custom_Words].map(Apply_Override), [Resolved_Words, Custom_Words, Apply_Override]);
  
  // Filters automatically using the global context setting
  const filtered = useMemo(() => {
    switch (filter) {
      case "Marked":    return All_Words.filter(w => Is_Marked(Course_Language as any, w.id));
      case "favorites": return All_Words.filter(w => Is_Favorite(Course_Language as any, w.id));
      case "custom":    return All_Words.filter(w => Custom_Words.some(c => c.id === w.id));
      default:          return All_Words;
    }
  }, [All_Words, filter, Course_Language, Is_Marked, Is_Favorite, Custom_Words]);

  useEffect(() => {
    return () => {
      if (typeof Set_Select_Mode === "function") Set_Select_Mode(false);
      if (typeof Set_Selected === "function") Set_Selected(new Set());
    };
  }, [Category_ID, Subcategory_ID, Set_Select_Mode, Set_Selected]);

  if (Loading) {
    return <div className="p-4 text-sm">Loading...</div>;
  }

  const now = Date.now();
  const Word_Cooling = (wid: string) => {
    const item = Recall_Queue.find(r => r.Scope === "word" && r.Category_ID === Category_ID && r.Subcategory_ID === Subcategory_ID && r.Word_ID === wid);
    return !!item && item.Ready_At > now;
  };

  const toggle = (id: string) => {
    if (Word_Cooling(id)) return;
    if (typeof Set_Selected === "function") {
      Set_Selected((prev: Set<string>) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    }
  };

  return (
    <div className="space-y-4 px-4">
      {/* Grid automatically spans across viewports */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filtered.map(word => {
          const Is_Sel = Select_Mode && selected.has(word.id);
          const cooling = Word_Cooling(word.id);
          
          return (
            <Button
              key={word.id}
              active={Is_Sel}
              onClick={() => {
                if (Select_Mode) {
                  toggle(word.id);
                } else {
                  navigate(`/Language/${Active_Lang_Name}/Dictionary/Vocabulary/${Category_ID}/${Subcategory_ID}/${encodeURIComponent(word.id)}`);
                }
              }}
              disabled={Select_Mode && cooling}
              className={Class_Names(
                "h-12 px-4 flex items-center justify-center text-center relative",
                Select_Mode && "pr-8"
              )}
            >
              {Select_Mode && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {cooling ? (
                    <Clock className="h-4 w-4 opacity-60" />
                  ) : Is_Sel ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4 opacity-60" />
                  )}
                </span>
              )}
              <span className="font-semibold text-sm leading-none">{word.title || word.id}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}