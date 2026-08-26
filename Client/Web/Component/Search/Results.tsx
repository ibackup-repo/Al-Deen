import { Search, ArrowRight } from "lucide-react";
import { Class_Names } from "@/Library/Utility";
import { Scroll_Area } from "@Web/Component/UI/Scroll-Area";
import { Button } from "@Web/Component/UI/Button";
import { Get_Result_Type_Label } from "./Utility";
import { Search_Tips } from "./Search-Tips";
import type { Search_Results_Properties } from "./Types";

export function Search_Results({
  query,
  Category,
  Results,
  Selected_Index,
  On_Result_Click,
  On_See_All,
  Hide_Top_Border = false,
}: Search_Results_Properties & { Hide_Top_Border?: boolean }) {
  const Resolve_Font_Family_Class_Name = () => "font-tajweed tajweed-colors";

  if (!query) {
    return (
      <>
        {!Hide_Top_Border && <div className="h-px bg-border/50 mx-4" />}
        <Search_Tips />
      </>
    );
  }


  return (
    <>
      {!Hide_Top_Border && <div className="h-px bg-border/50 mx-4" />}
      <Scroll_Area className="max-h-[50vh] p-2">
        {Results.length > 0 ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {Get_Result_Type_Label(Category)}
              </span>
              <Button 
                variant="secondary"
                size="sm"
                className="text-xs gap-1"
                onClick={On_See_All}
              >
                See all <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            {Results.map((result, index) => (
              <button
                key={result.id}
                onClick={() => On_Result_Click(result.path)}
                className={Class_Names(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left group cursor-pointer",
                  Selected_Index === index ? "bg-secondary/70" : "hover:bg-secondary/50"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium">{result.type.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm truncate">{result.title}</p>
                    {result.Arabic_Name && (
                      <span className={Class_Names("text-base", Resolve_Font_Family_Class_Name())} dir="rtl">{result.Arabic_Name}</span>
                    )}
                  </div>
                  {result.Subtitle && (
                    <p className="text-xs text-muted-foreground">{result.Subtitle}</p>
                  )}
                </div>
                <ArrowRight className={Class_Names(
                  "h-4 w-4 text-muted-foreground transition-opacity flex-shrink-0",
                  Selected_Index === index ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )} />
              </button>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No Results for "{query}"</p>
          </div>
        )}
      </Scroll_Area>
    </>
  );
}