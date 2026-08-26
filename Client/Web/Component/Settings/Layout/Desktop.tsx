// @Web/Component/Settings/Layout/Desktop.tsx
import { useState, useRef, useEffect, useMemo } from "react";
import { Scroll_Area } from "@Web/Component/UI/Scroll-Area";
import { Button } from "@Web/Component/UI/Button";
import { Input } from "@Web/Component/UI/Input";
import { Class_Names } from "@/Library/Utility";
import { Container } from "@Web/Component/UI/Container";
import { Search, X } from "lucide-react";
import { Settings_Categories, Get_Subcategories } from "../Constants";
import type { Settings_Category, Account_Subcategory, Aid_Subcategory } from "../Types";

type Subcategory_Identifier = Account_Subcategory | Aid_Subcategory;

interface Desktop_Properties {
  Active_Category: Settings_Category;
  Active_Subcategory: Subcategory_Identifier | null;
  On_Category_Change: (Category: Settings_Category) => void;
  On_Subcategory_Change: (Subcategory: Subcategory_Identifier) => void;
  children: React.ReactNode;
}

export function Desktop({ 
  Active_Category, 
  Active_Subcategory, 
  On_Category_Change, 
  On_Subcategory_Change, 
  children 
}: Desktop_Properties) {
  const [Is_Search_Active, Set_Is_Search_Active] = useState(false);
  const [Search_Query, Set_Search_Query] = useState("");
  const [Is_Focused, setIsFocused] = useState(false);
  const Input_Reference = useRef<HTMLInputElement>(null);

  // Determine if the input should be in "Active" style (black bg, white border)
  const Is_Input_Active = Is_Focused || Search_Query.length > 0;

  // --- Search filtering logic ---
  const Filtered_Data = useMemo(() => {
    if (!Search_Query.trim()) {
      // No query: return all categories with all subcategories
      return Settings_Categories.map(cat => ({
        ...cat,
        subcategories: cat.Has_Subcategories ? Get_Subcategories(cat.id) : []
      }));
    }

    const Query_Lower = Search_Query.toLowerCase();
    const Results: typeof Settings_Categories = [];
    
    for (const cat of Settings_Categories) {
      const Category_Matches = cat.label.toLowerCase().includes(Query_Lower);
      let Matching_Subcategories = [];
      if (cat.Has_Subcategories) {
        const subs = Get_Subcategories(cat.id);
        Matching_Subcategories = subs.filter(sub => sub.label.toLowerCase().includes(Query_Lower));
      }
      if (Category_Matches || Matching_Subcategories.length > 0) {
        Results.push({
          ...cat,
          subcategories: Matching_Subcategories
        });
      }
    }
    
    // Determine Top result: first matching Subcategory, else first matching Category
    let Top_Category: Settings_Category | null = null;
    let Top_Subcategory: Subcategory_Identifier | null = null;
    
    for (const cat of Results) {
      if (cat.subcategories && cat.subcategories.length > 0) {
        Top_Category = cat.id;
        Top_Subcategory = cat.subcategories[0].id as Subcategory_Identifier;
        break;
      }
    }
    if (!Top_Category && Results.length > 0) {
      Top_Category = Results[0].id;
      Top_Subcategory = null;
    }
    
    // Automatically switch to the Top result if different from current
    if (Top_Category && (Top_Category !== Active_Category || Top_Subcategory !== Active_Subcategory)) {
      // Use setTimeout to avoid state Update during render
      setTimeout(() => {
        On_Category_Change(Top_Category);
        if (Top_Subcategory) On_Subcategory_Change(Top_Subcategory);
      }, 0);
    }
    
    return Results.map(cat => ({
      ...cat,
      subcategories: cat.subcategories || []
    }));
  }, [Search_Query, Active_Category, Active_Subcategory, On_Category_Change, On_Subcategory_Change]);

  const Handle_Search_Click = () => {
    Set_Is_Search_Active(true);
  };

  const Handle_Blur = () => {
    setIsFocused(false);
    if (Search_Query === "") {
      Set_Is_Search_Active(false);
    }
  };

  const Handle_Clear = () => {
    Set_Search_Query("");
    Input_Reference.current?.focus();
  };

  useEffect(() => {
    if (Is_Search_Active && Input_Reference.current) {
      Input_Reference.current.focus();
    }
  }, [Is_Search_Active]);

  return (
    <div className="fixed inset-0 z-40 bg-background">
      <div className="h-full flex">
        {/* Sidebar */}
        <div className="shrink-0 w-64 max-h-full flex flex-col pt-10 pl-6 pb-6 overflow-hidden self-start">
          <div className="flex-1 min-h-0 p-2 flex flex-col overflow-y-auto">

            {/* Search Section */}
            <div className="mt-5 mb-0">
              {!Is_Search_Active ? (
                <Button
                  onClick={Handle_Search_Click}
                  className="w-10 h-10 rounded-full flex items-center justify-center p-0"
                >
                  <Search className="h-4 w-4" />
                </Button>
              ) : (
                <div className="relative flex-1">
                  <Input
                    ref={Input_Reference}
                    value={Search_Query}
                    On_Change={(e) => Set_Search_Query(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={Handle_Blur}
                    className={Class_Names(
                      "pr-10 transition-all Duration-200",
                      Is_Input_Active && "bg-black text-white border-white"
                    )}
                  />
                  {Search_Query && (
                    <Button
                      onClick={Handle_Clear}
                      className="absolute right-1 Top-1/2 -translate-y-1/2 w-8 h-8 rounded-full p-0 flex items-center justify-center"
                      size="sm"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Categories List - Filtered_Lines */}
            <div className="space-y-2 flex-1 py-4">
              {Filtered_Data.map((cat) => {
                const Is_Active = Active_Category === cat.id;
                const Has_Subcategories = cat.subcategories && cat.subcategories.length > 0;
                
                return (
                  <div key={cat.id}>
                    <Button
                      onClick={() => {
                        On_Category_Change(cat.id);
                        if (Has_Subcategories) {
                          const First_Subcategory = cat.subcategories[0];
                          if (First_Subcategory) On_Subcategory_Change(First_Subcategory.id as any);
                        } else {
                          On_Subcategory_Change(null);
                        }
                      }}
                      className={Class_Names(
                        "w-full flex items-center gap-2.5 h-auto px-3 py-2.5",
                        Is_Active && "bg-black dark:bg-white text-white dark:text-black"
                      )}
                      fullWidth
                    >
                      <span className="text-sm font-medium">{cat.label}</span>
                    </Button>
                    
                    {Has_Subcategories && Is_Active && (
                      <div className="mt-2 space-y-2 ml-6">
                        {cat.subcategories.map((sub) => {
                          const Is_Active_Subcategory = Active_Subcategory === sub.id;
                          return (
                            <Button
                              key={sub.id}
                              onClick={() => On_Subcategory_Change(sub.id as any)}
                              className={Class_Names(
                                "flex items-center gap-2.5 h-auto py-1.5 px-3 rounded-full",
                                Is_Active_Subcategory && "bg-black dark:bg-white text-white dark:text-black"
                              )}
                              fullWidth
                            >
                              <span className="text-sm font-medium">{sub.label}</span>
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {Filtered_Data.length === 0 && Search_Query && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No Results for "{Search_Query}"
                </div>
              )}
            </div>
          </div>
        </div>


        {/* Content area */}
        <Scroll_Area className="flex-1 h-full">
          <div className="pt-10">
            <div className="p-6 max-w-2xl text-left">
              {children}
            </div>
          </div>
        </Scroll_Area>
      </div>
    </div>
  );
}