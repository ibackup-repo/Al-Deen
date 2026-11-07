// @Web/Component/Settings/Layout/Mobile.tsx
import { useState, useEffect, useMemo } from "react";
import { Scroll_Area } from "@Web/Component/UI/Scroll-Area";
import { Button } from "@Web/Component/UI/Button";
import { ChevronRight, Search } from "lucide-react";
import { Settings_Categories, Get_Subcategories } from "../Constants";
import { Mobile_Settings_Store } from "../Mobile-Settings-Store";
import type { Settings_Category, Account_Subcategory, Aid_Subcategory } from "../Types";

type Subcategory_Identifier = Account_Subcategory | Aid_Subcategory;

interface Mobile_Properties {
  Active_Category: Settings_Category;
  Active_Subcategory: Subcategory_Identifier | null;
  On_Category_Change: (Category: Settings_Category) => void;
  On_Subcategory_Change: (Subcategory: Subcategory_Identifier) => void;
  On_Close: () => void;
  children: React.ReactNode;
}

export function Mobile({ 
  Active_Category, 
  Active_Subcategory, 
  On_Category_Change, 
  On_Subcategory_Change, 
  On_Close, 
  children 
}: Mobile_Properties) {
  const [view, Set_Current_View] = useState<"categories" | "subcategories" | "content">("categories");
  const [Selected_Category, Set_Selected_Category] = useState<Settings_Category | null>(null);
  const [Is_Search_Mode, Set_Is_Search_Mode] = useState(false);
  const [Search_Query, Set_Search_Query] = useState("");

  // Subscribe to store for Search_Query Mode and query
  useEffect(() => {
    const Unsubscribe_Mode_Listener = Mobile_Settings_Store.subscribe(() => {
      const { Is_Search_Mode } = Mobile_Settings_Store.getState();
      Set_Is_Search_Mode(Is_Search_Mode);
    });
    const Unsubscribe_Query_Listener = Mobile_Settings_Store.Subscribe_Search(() => {
      Set_Search_Query(Mobile_Settings_Store.Get_Search_Query());
    });
    Set_Is_Search_Mode(Mobile_Settings_Store.getState().Is_Search_Mode);
    Set_Search_Query(Mobile_Settings_Store.Get_Search_Query());
    return () => {
      Unsubscribe_Mode_Listener();
      Unsubscribe_Query_Listener();
    };
  }, []);

  // Filtered Results
  const Filtered_Results = useMemo(() => {
    if (!Search_Query.trim()) return [];
    const query = Search_Query.toLowerCase();
    const Results: { Category: Settings_Category; Subcategory?: Subcategory_Identifier; label: string }[] = [];
    for (const cat of Settings_Categories) {
      if (cat.label.toLowerCase().includes(query)) {
        Results.push({ Category: cat.id, label: cat.label });
      }
      if (cat.Has_Subcategories) {
        const subs = Get_Subcategories(cat.id);
        for (const sub of subs) {
          if (sub.label.toLowerCase().includes(query)) {
            Results.push({ Category: cat.id, Subcategory: sub.id as Subcategory_Identifier, label: sub.label });
          }
        }
      }
    }
    return Results;
  }, [Search_Query]);

  // Auto-select Top result when Search_Query query changes
  useEffect(() => {
    if (!Is_Search_Mode || Filtered_Results.length === 0) return;
    const Top = Filtered_Results[0];
    if (Top.Subcategory) {
      On_Category_Change(Top.Category);
      On_Subcategory_Change(Top.Subcategory);
    } else {
      On_Category_Change(Top.Category);
      On_Subcategory_Change(null as any);
    }
    // Switch to content view (the selected setting will be rendered by the parent)
    Set_Current_View("content");
  }, [Filtered_Results, Is_Search_Mode, On_Category_Change, On_Subcategory_Change]);

  // Sync store for title/back when not in Search_Query Mode
  useEffect(() => {
    if (Is_Search_Mode) {
      Mobile_Settings_Store.Set_State("Search", true, () => {
        // Go_Back: exit Search_Query Mode
        Mobile_Settings_Store.Exit_Search_Mode();
      }, On_Close);
      return;
    }
    let title = "Settings";
    let Show_Back_Button = false;
    let Go_Back_Function = () => {};
    if (view === "categories") {
      title = "Settings";
      Show_Back_Button = false;
      Go_Back_Function = () => On_Close();
    } else if (view === "subcategories" && Selected_Category) {
      const cat = Settings_Categories.find(c => c.id === Selected_Category);
      title = cat?.label || "Settings";
      Show_Back_Button = true;
      Go_Back_Function = () => {
        Set_Current_View("categories");
        Set_Selected_Category(null);
      };
    } else if (view === "content") {
      if (Active_Subcategory) {
        const subs = Get_Subcategories(Active_Category);
        const sub = subs.find(s => s.id === Active_Subcategory);
        title = sub?.label || Active_Category;
      } else {
        const cat = Settings_Categories.find(c => c.id === Active_Category);
        title = cat?.label || "Settings";
      }
      Show_Back_Button = true;
      Go_Back_Function = () => {
        const Category_Configuration = Settings_Categories.find(c => c.id === Active_Category);
        if (Category_Configuration?.Has_Subcategories) {
          Set_Current_View("subcategories");
          Set_Selected_Category(Active_Category);
        } else {
          Set_Current_View("categories");
          Set_Selected_Category(null);
        }
      };
    }
    Mobile_Settings_Store.Set_State(title, Show_Back_Button, Go_Back_Function, On_Close);
  }, [view, Selected_Category, Active_Category, Active_Subcategory, On_Close, Is_Search_Mode]);

  // Search Results view
  if (Is_Search_Mode) {
    return (
      <div className="fixed inset-0 z-40 bg-background">
        <Scroll_Area className="h-full">
          <div className="pt-[60px]">
            <div className="p-4">
              {Filtered_Results.length > 0 ? (
                <div className="space-y-2">
                  {Filtered_Results.map((item, Index) => (
                    <Button
                      key={Index}
                      onClick={() => {
                        if (item.Subcategory) {
                          On_Category_Change(item.Category);
                          On_Subcategory_Change(item.Subcategory);
                        } else {
                          On_Category_Change(item.Category);
                          On_Subcategory_Change(null as any);
                        }
                        // Exit Search_Query Mode
                        Mobile_Settings_Store.Exit_Search_Mode();
                        Set_Current_View("content");
                      }}
                      className="w-full flex items-center justify-between py-3 px-4"
                      fullWidth
                    >
                      <span className="text-sm font-medium">{item.label}</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              ) : Search_Query ? (
                <div className="text-center py-8 text-muted-foreground">
                  No Results for "{Search_Query}"
                </div>
              ) : null}
            </div>
          </div>
        </Scroll_Area>
      </div>
    );
  }

  // Normal navigation: categories view
  if (view === "categories") {
    return (
      <div className="fixed inset-0 z-40 bg-background">
        <Scroll_Area className="h-full">
          <div className="pt-[60px]">
            <div className="p-4">
              <div className="space-y-2">
                {Settings_Categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <Button
                      key={cat.id}
                      onClick={() => {
                        const Has_Subcategories = cat.Has_Subcategories;
                        if (Has_Subcategories) {
                          Set_Selected_Category(cat.id);
                          Set_Current_View("subcategories");
                        } else {
                          On_Category_Change(cat.id);
                          On_Subcategory_Change(null as any);
                          Set_Current_View("content");
                        }
                      }}
                      className="w-full flex items-center justify-between gap-3 h-auto py-4 px-4"
                      fullWidth
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{cat.label}</span>
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </Scroll_Area>
      </div>
    );
  }

  // Subcategories view
  if (view === "subcategories" && Selected_Category) {
    const subcategories = Get_Subcategories(Selected_Category);
    return (
      <div className="fixed inset-0 z-40 bg-background">
        <Scroll_Area className="h-full">
          <div className="pt-[60px]">
            <div className="p-4">
              <div className="space-y-2">
                {subcategories.map((sub) => (
                  <Button
                    key={sub.id}
                    onClick={() => {
                      On_Category_Change(Selected_Category);
                      On_Subcategory_Change(sub.id as any);
                      Set_Current_View("content");
                    }}
                    className="w-full flex items-center justify-between gap-3 h-auto py-4 px-4"
                    fullWidth
                  >
                    <div className="flex items-center gap-3">
                      {sub.icon}
                      <span className="text-sm font-medium">{sub.label}</span>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Scroll_Area>
      </div>
    );
  }

  // Content view (renders the Active setting)
  return (
    <div className="fixed inset-0 z-40 bg-background">
      <Scroll_Area className="h-full">
        <div className="pt-[60px]">
          <div className="p-4">
            {children}
          </div>
        </div>
      </Scroll_Area>
    </div>
  );
}