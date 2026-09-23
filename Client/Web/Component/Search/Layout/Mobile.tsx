import { X, Search, ArrowRight } from "lucide-react";
import { Sheet, SheetContent } from "@Web/Component/UI/Sheet";
import { Scroll_Area } from "@Web/Component/UI/Scroll-Area";
import { Button } from "@Web/Component/UI/Button";
import { Search_Input } from ".././Input";
import { Search_Results } from ".././Results";
import { Navigation_Links } from ".././Navigation";
import type { Search_Category, Search_Result } from "../Types";

interface Mobile_Properties {
  Open: boolean;
  On_Close: () => void;
  query: string;
  Set_Query: (query: string) => void;
  Category: Search_Category;
  Set_Category: (Category: Search_Category) => void;
  Results: Search_Result[];
  On_Search: () => void;
  On_Result_Click: (path: string) => void;
  On_See_All: () => void;
  On_Link_Click: (path: string) => void;
  Nav_Links: Array<{ name: string; path: string; icon: React.ElementType }>;
  Support_Links: Array<{ name: string; path: string; icon: React.ElementType }>;
  Input_Reference: React.RefObject<HTMLInputElement>;
  Is_RTL?: boolean;
}

export function Mobile({
  Open,
  On_Close,
  query,
  Set_Query,
  Category,
  Set_Category,
  Results,
  On_Search,
  On_Result_Click,
  On_See_All,
  On_Link_Click,
  Nav_Links,
  Support_Links,
  Input_Reference,
  Is_RTL,
}: Mobile_Properties) {
  return (
    <Sheet Open={Open} On_Open_Change={On_Close}>
      <SheetContent side={Is_RTL ? "right" : "left"} className="p-0 w-full border-0" hideCloseButton>
        <div className="flex flex-col h-full bg-background">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <span className="font-semibold text-foreground text-lg">Search</span>
            <Button size="sm" className="w-9 h-9 p-0 rounded-full" onClick={On_Close}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search Input */}
          <div className="p-4 border-b border-border bg-muted/30">
            <Search_Input
              query={query}
              Set_Query={Set_Query}
              Category={Category}
              Set_Category={Set_Category}
              On_Search={On_Search}
              Input_Reference={Input_Reference}
            />
          </div>

          {/* Results or Navigation */}
          <Scroll_Area className="flex-1">
            <div className="p-4">
              {query.length > 0 ? (
                <>
                  {Results.length > 0 ? (
                    <Search_Results
                      query={query}
                      Category={Category}
                      Results={Results}
                      Selected_Index={-1}
                      On_Result_Click={On_Result_Click}
                      On_See_All={On_See_All}
                    />
                  ) : (
                    <div className="p-8 text-center">
                      <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground font-medium">No Results for "{query}"</p>
                    </div>
                  )}
                </>
              ) : (
                <Navigation_Links
                  Nav_Links={Nav_Links}
                  Support_Links={Support_Links}
                  On_Link_Click={On_Link_Click}
                />
              )}
            </div>
          </Scroll_Area>
        </div>
      </SheetContent>
    </Sheet>
  );
}