// @Web/Component/Layout/Header/Navigator/Aid.tsx
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "@Web/Component/UI/Button";
import { Class_Names } from "@/Library/Utility";
import { Navigator_Layout } from "./Utility";

type View_Depth = "Category" | "Subcategory" | "Sub-Subcategory" | "Detail";
type Drill_State = "root" | "module-select" | "Category-select" | "Subcategory-select";

interface Aid_Navigator_Properties {
  On_Open_Change?: (Open: boolean) => void;
}

const Allowed_Sections = ["Feeling", "Prophets", "Arabic", "Dua", "Pillars", "Articles"];

const Section_Labels: Record<string, string> = {
  Dua: "Dua",
  Prophets: "Prophets",
  Articles: "6 Articles of Faith",
  Pillars: "5 Pillars",
  Feeling: "Feelings",
  Arabic: "Arabic",
};

// Fetch function targeting your GitHub Codespaces forwarded address
async function Fetch_Aid_Corpus_From_Backend() {
  const response = await fetch("https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev/api/Aid-Corpus");
  if (!response.ok) throw new Error("Failed to load backend Aid Corpus data");
  return response.json();
}

function Parse_Aid_Route(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "Aid" && parts[1]) {
    let section = parts[1];

    const isTajweed = section === "Tajweed" || parts[2] === "Tajweed";
    const isAlphabet = section === "Alphabet" || parts[2] === "Alphabet";
    const isVocabulary = section === "Vocabulary" || parts[2] === "Vocabulary";

    if (section === "Alphabet" || section === "Vocabulary" || section === "Tajweed") {
      section = "Arabic";
    }

    if (!Allowed_Sections.includes(section)) {
      return null;
    }

    const hasSubfolder = parts[2] === "Tajweed" || parts[2] === "Vocabulary" || parts[2] === "Alphabet";
    const p1 = hasSubfolder ? parts[3] : parts[2];
    const p2 = hasSubfolder ? parts[4] : parts[3];
    const p3 = hasSubfolder ? parts[5] : parts[4];

    if (section !== "Arabic" && !p1) {
      return null;
    }

    return {
      sectionSlug: section,
      isTajweed,
      isAlphabet,
      isVocabulary,
      param1: p1,
      param2: p2,
      param3: p3,
    };
  }
  return null;
}

export function Aid_Navigator({ On_Open_Change }: Aid_Navigator_Properties) {
  const navigate = useNavigate();
  const Location_Data = useLocation();
  const route = Parse_Aid_Route(Location_Data.pathname);

  const [Is_Open, setIsOpen] = useState(false);
  const [Is_Searching, Set_Is_Searching] = useState(false);
  const [Search_Query, Set_Search_Query] = useState("");
  
  const [Current_Depth, Set_Current_Depth] = useState<View_Depth>("Category");
  const [Is_Mobile_Depth_Open, Set_Is_Mobile_Depth_Open] = useState(false);
  const [Is_Desktop_Depth_Open, Set_Is_Desktop_Depth_Open] = useState(false);
  
  const [Drill_Step, Set_Drill_Step] = useState<Drill_State>("root");
  const [Selected_Module, Set_Selected_Module] = useState<"Vocabulary" | "Tajweed" | "Alphabet" | null>(null);
  const [Selected_Category, Set_Selected_Category] = useState<string | null>(null);

  const Is_Lock_Active = useRef(false);
  const Input_Reference = useRef<HTMLInputElement>(null);

  // Hook into your asynchronous client query cache pipeline
  const { data: Corpus, Is_Loading_Corpus_Data } = useQuery({
    queryKey: ["aidCorpusBackend"],
    queryFn: Fetch_Aid_Corpus_From_Backend,
    staleTime: 1000 * 60 * 15, // Cache client-side for 15 Minutes
  });

  if (!route) return null;

  const Active_Section = route.sectionSlug;
  const Is_Arabic_Module = Active_Section === "Arabic";
  const Section_Label = Section_Labels[Active_Section] ?? "Aid";

  useEffect(() => {
    if (!Is_Arabic_Module) {
      Set_Current_Depth("Category");
      return;
    }
    
    if (Is_Lock_Active.current) {
      return;
    }
    
    if (route.param3 || route.isAlphabet) {
      Set_Current_Depth("Detail");
    } else if (route.param2) {
      Set_Current_Depth("Sub-Subcategory");
    } else if (route.param1) {
      Set_Current_Depth("Subcategory");
    } else {
      Set_Current_Depth("Category");
    }
  }, [Location_Data.pathname, Is_Arabic_Module, route]);

  useEffect(() => {
    Set_Drill_Step("root");
    Set_Selected_Module(null);
    Set_Selected_Category(null);
  }, [Current_Depth]);

  useEffect(() => {
    On_Open_Change?.(Is_Open);
    return () => On_Open_Change?.(false);
  }, [Is_Open, On_Open_Change]);

  useEffect(() => {
    if (!Is_Mobile_Depth_Open && !Is_Desktop_Depth_Open) return;
    const handleOutsideClick = () => {
      Set_Is_Mobile_Depth_Open(false);
      Set_Is_Desktop_Depth_Open(false);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [Is_Mobile_Depth_Open, Is_Desktop_Depth_Open]);

  const Close_All = () => {
    setIsOpen(false);
    Set_Is_Searching(false);
    Set_Search_Query("");
    Set_Is_Mobile_Depth_Open(false);
    Set_Is_Desktop_Depth_Open(false);
    Set_Drill_Step("root");
    Set_Selected_Module(null);
    Set_Selected_Category(null);
    Is_Lock_Active.current = false;
  };

  const Handle_Go_Back = useCallback(() => {
    if (Drill_Step === "Subcategory-select") {
      Set_Drill_Step("Category-select");
    } else if (Drill_Step === "Category-select") {
      Set_Drill_Step("module-select");
    } else if (Drill_Step === "module-select") {
      Set_Drill_Step("root");
      Set_Selected_Module(null);
    }
  }, [Drill_Step]);

  const Show_Go_Back = useMemo(() => {
    return Is_Arabic_Module && Drill_Step !== "root";
  }, [Is_Arabic_Module, Drill_Step]);

  // Dynamically resolve vocabulary/tree queries against the local client cache state
  const Section_Items = useMemo(() => {
    const items: { slug: string; name: string; isBranchTrigger?: boolean; branchAction?: () => void }[] = [];
    if (!Corpus) return items;
    
    if (Is_Arabic_Module) {
      if (Current_Depth === "Category") {
        items.push({ slug: "Aid/Arabic/Tajweed", name: "Tajweed" });
        items.push({ slug: "Aid/Arabic/Vocabulary", name: "Vocabulary" });
        items.push({ slug: "Aid/Arabic/Alphabet", name: "Alphabet" });
      } 
      else if (Current_Depth === "Subcategory") {
        if (Drill_Step === "root") {
          items.push({ slug: "", name: "Vocabulary", isBranchTrigger: true, branchAction: () => { Set_Selected_Module("Vocabulary"); Set_Drill_Step("module-select"); } });
          items.push({ slug: "", name: "Tajweed", isBranchTrigger: true, branchAction: () => { Set_Selected_Module("Tajweed"); Set_Drill_Step("module-select"); } });
        } else if (Selected_Module === "Vocabulary") {
          const vocabTree = Array.isArray(Corpus.arabicVocabulary) ? Corpus.arabicVocabulary : [];
          vocabTree.forEach((c: any) => {
            if (!c.subfolders && !c.subFolderCategory?.length) {
              items.push({ slug: `Aid/Arabic/Vocabulary/${c.id}`, name: c.name });
            }
          });
        } else if (Selected_Module === "Tajweed") {
          const tajweedTree = Array.isArray(Corpus.tajweedCategories) ? Corpus.tajweedCategories : [];
          tajweedTree.forEach((t: any) => {
            if (!t.subfolders?.length) {
              items.push({ slug: `Aid/Arabic/Tajweed/${t.id}`, name: t.name });
            }
          });
        }
      } 
      else if (Current_Depth === "Sub-Subcategory") {
        if (Drill_Step === "root") {
          items.push({ slug: "", name: "Vocabulary", isBranchTrigger: true, branchAction: () => { Set_Selected_Module("Vocabulary"); Set_Drill_Step("module-select"); } });
          items.push({ slug: "", name: "Tajweed", isBranchTrigger: true, branchAction: () => { Set_Selected_Module("Tajweed"); Set_Drill_Step("module-select"); } });
        } 
        else if (Drill_Step === "module-select") {
          if (Selected_Module === "Vocabulary") {
            const vocabTree = Array.isArray(Corpus.arabicVocabulary) ? Corpus.arabicVocabulary : [];
            vocabTree.forEach((c: any) => {
              if (!c.subfolders && !c.subFolderCategory?.length) {
                items.push({ slug: "", name: c.name, isBranchTrigger: true, branchAction: () => { Set_Selected_Category(c.id); Set_Drill_Step("Category-select"); } });
              }
            });
          } else if (Selected_Module === "Tajweed") {
            const tajweedTree = Array.isArray(Corpus.tajweedCategories) ? Corpus.tajweedCategories : [];
            tajweedTree.forEach((t: any) => {
              if (!t.subfolders?.length && t.subcategories?.length) {
                items.push({ slug: "", name: t.name, isBranchTrigger: true, branchAction: () => { Set_Selected_Category(t.id); Set_Drill_Step("Category-select"); } });
              }
            });
          }
        } 
        else if (Drill_Step === "Category-select" && Selected_Category) {
          if (Selected_Module === "Vocabulary") {
            const vocabTree = Array.isArray(Corpus.arabicVocabulary) ? Corpus.arabicVocabulary : [];
            const target = vocabTree.find((c: any) => c.id === Selected_Category);
            target?.subcategories?.forEach((sub: any) => {
              items.push({ slug: `Aid/Arabic/Vocabulary/${Selected_Category}/${sub.id}`, name: sub.name });
            });
          } else if (Selected_Module === "Tajweed") {
            const tajweedTree = Array.isArray(Corpus.tajweedCategories) ? Corpus.tajweedCategories : [];
            const target = tajweedTree.find((t: any) => t.id === Selected_Category);
            target?.subcategories?.forEach((sub: any) => {
              items.push({ slug: `Aid/Arabic/Tajweed/${Selected_Category}/${sub.id}`, name: sub.name });
            });
          }
        }
      } 
      else if (Current_Depth === "Detail") {
        if (Drill_Step === "root") {
          items.push({ slug: "", name: "Vocabulary", isBranchTrigger: true, branchAction: () => { Set_Selected_Module("Vocabulary"); Set_Drill_Step("module-select"); } });
          items.push({ slug: "", name: "Tajweed", isBranchTrigger: true, branchAction: () => { Set_Selected_Module("Tajweed"); Set_Drill_Step("module-select"); } });
          items.push({ slug: "", name: "Alphabet", isBranchTrigger: true, branchAction: () => { Set_Selected_Module("Alphabet"); Set_Drill_Step("module-select"); } });
        } 
        else if (Drill_Step === "module-select") {
          if (Selected_Module === "Alphabet") {
            const alphabet = Corpus.alphabet || Corpus.Letters_List || [];
            alphabet.forEach((l: any, Index: number) => {
              items.push({ slug: `Aid/Arabic/Alphabet/${Index + 1}`, name: `Letter_Record ${l.name}` });
            });
          } else if (Selected_Module === "Vocabulary") {
            const vocabTree = Array.isArray(Corpus.arabicVocabulary) ? Corpus.arabicVocabulary : [];
            vocabTree.forEach((c: any) => {
              if (!c.subfolders && !c.subFolderCategory?.length) {
                items.push({ slug: "", name: c.name, isBranchTrigger: true, branchAction: () => { Set_Selected_Category(c.id); Set_Drill_Step("Category-select"); } });
              }
            });
          } else if (Selected_Module === "Tajweed") {
            const tajweedTree = Array.isArray(Corpus.tajweedCategories) ? Corpus.tajweedCategories : [];
            tajweedTree.forEach((t: any) => {
              if (!t.subfolders?.length) {
                items.push({ slug: "", name: t.name, isBranchTrigger: true, branchAction: () => { Set_Selected_Category(t.id); Set_Drill_Step("Category-select"); } });
              }
            });
          }
        }
        else if (Drill_Step === "Category-select" && Selected_Category) {
          if (Selected_Module === "Vocabulary") {
            const vocabTree = Array.isArray(Corpus.arabicVocabulary) ? Corpus.arabicVocabulary : [];
            const target = vocabTree.find((c: any) => c.id === Selected_Category);
            target?.subcategories?.forEach((sub: any) => {
              items.push({ slug: "", name: sub.name, isBranchTrigger: true, branchAction: () => { Set_Selected_Category(sub.id); Set_Drill_Step("Subcategory-select"); } });
            });
          } else if (Selected_Module === "Tajweed") {
            const tajweedTree = Array.isArray(Corpus.tajweedCategories) ? Corpus.tajweedCategories : [];
            const target = tajweedTree.find((t: any) => t.id === Selected_Category);
            target?.subcategories?.forEach((sub: any) => {
              items.push({ slug: "", name: sub.name, isBranchTrigger: true, branchAction: () => { Set_Selected_Category(sub.id); Set_Drill_Step("Subcategory-select"); } });
            });
          }
        }
        else if (Drill_Step === "Subcategory-select" && Selected_Category) {
          const originalCatId = route.param1 || "";
          if (Selected_Module === "Vocabulary") {
            const vocabTree = Array.isArray(Corpus.arabicVocabulary) ? Corpus.arabicVocabulary : [];
            const parentCat = vocabTree.find((c: any) => c.id === originalCatId);
            const targetSub = parentCat?.subcategories?.find((s: any) => s.id === Selected_Category);
            targetSub?.Kalimaat?.forEach((w: any) => {
              items.push({ slug: `Aid/Arabic/Vocabulary/${originalCatId}/${Selected_Category}/${w.id}`, name: w.english });
            });
          } else if (Selected_Module === "Tajweed") {
            const tajweedTree = Array.isArray(Corpus.tajweedCategories) ? Corpus.tajweedCategories : [];
            const parentCat = tajweedTree.find((t: any) => t.id === originalCatId);
            const targetSub = parentCat?.subcategories?.find((s: any) => s.id === Selected_Category);
            targetSub?.rules?.forEach((r: any) => {
              items.push({ slug: `Aid/Arabic/Tajweed/${originalCatId}/${Selected_Category}/${r.id || r.name}`, name: r.name });
            });
          }
        }
      }
    } 
    else if (Active_Section === "Dua") {
      const duas = Corpus.duas || Corpus.duaCategories || [];
      duas.forEach((d: any) => {
        items.push({ slug: `Aid/Dua/${d.name.replace(/ /g, "-")}`, name: d.name });
      });
    } else if (Active_Section === "Prophets") {
      const prophets = Corpus.prophets || [];
      prophets.forEach((p: any) => {
        items.push({ slug: `Aid/Prophets/${encodeURIComponent(p.id)}`, name: p.title || p.name });
      });
    } else if (Active_Section === "Articles") {
      const articles = Corpus.articles || [];
      articles.forEach((a: any) => {
        items.push({ slug: `Aid/Articles/${a.id}`, name: a.name });
      });
    } else if (Active_Section === "Pillars") {
      const pillars = Corpus.pillars || [];
      pillars.forEach((p: any) => {
        items.push({ slug: `Aid/Pillars/${p.id}`, name: `${p.name} (${p.english})` });
      });
    } else if (Active_Section === "Feeling") {
      const feelings = Corpus.feelings || [];
      feelings.forEach((f: any) => {
        items.push({ slug: `Aid/Feeling/${f.id}`, name: f.name });
      });
    }
    return items;
  }, [Active_Section, Current_Depth, route, Is_Arabic_Module, Drill_Step, Selected_Module, Selected_Category, Corpus]);

  const Filtered_Items = useMemo(() => {
    const q = Search_Query.toLowerCase().trim();
    return Section_Items.filter((item) => !q || item.name.toLowerCase().includes(q));
  }, [Section_Items, Search_Query]);

  const Handle_Depth_Select = (depth: View_Depth, screenMode: "mobile" | "desktop") => {
    Is_Lock_Active.current = true;
    if (screenMode === "mobile") {
      Set_Is_Mobile_Depth_Open(false);
    } else {
      Set_Is_Desktop_Depth_Open(false);
    }
    Set_Current_Depth(depth);
    Set_Search_Query("");
  };

  const Render_Header_Left_Dropdown = (isOpenState: boolean, setOpenState: (o: boolean) => void, screenMode: "mobile" | "desktop") => {
    return (
      <div className="relative inline-block text-left max-w-full z-[10002]">
        <Button
          variant="ghost"
          size="sm"
          className={Class_Names(
            "gap-1 px-2.5 text-xs font-medium text-foreground max-w-full justify-between rounded-full bg-[#fafafa]/80 backdrop-blur-sm [.high-contrast_&]:bg-white [.high-contrast_&]:border-black",
            screenMode === "mobile" ? "h-8" : "h-7"
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (Is_Arabic_Module) setOpenState(!isOpenState);
          }}
        >
          {Is_Arabic_Module ? Current_Depth : Section_Label}
          {Is_Arabic_Module && (
            <ChevronDown className={Class_Names("h-5 w-5 ml-1 transition-transform Duration-200", isOpenState && "rotate-180")} />
          )}
        </Button>

        {isOpenState && Is_Arabic_Module && (
          <div className="absolute left-0 Top-full mt-1 min-w-[150px] border border-border/40 bg-popover text-popover-foreground z-[10003] overflow-hidden rounded-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            {(["Category", "Subcategory", "Sub-Subcategory", "Detail"] as View_Depth[]).map((depth) => (
              <button
                key={depth}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  Handle_Depth_Select(depth, screenMode);
                }}
                className={Class_Names(
                  "w-full flex items-center justify-between text-left px-4 py-2.5 text-xs font-medium rounded-none h-auto border-0 bg-transparent transition-colors Duration-200 focus:outline-none sm:hover:bg-accent sm:hover:text-accent-foreground",
                  Current_Depth === depth ? "bg-accent text-accent-foreground font-semibold" : "text-popover-foreground"
                )}
              >
                {depth}
                {Current_Depth === depth && <Check className="h-5 w-5 ml-2" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const Native_Button_Base = "w-full justify-start text-left font-normal truncate text-xs h-12 sm:h-9 rounded-lg px-3 sm:px-4 shrink-0 inline-flex items-center gap-2 py-2 transition-colors Duration-200 focus:outline-none border snap-start";

  const Get_Native_Button_Class_Name = (Is_Active: boolean) => {
    return Class_Names(
      Native_Button_Base,
      Is_Active
        ? "bg-accent text-accent-foreground font-semibold border-border/60"
        : "bg-card border-border/30 text-card-foreground sm:hover:bg-accent sm:hover:text-accent-foreground"
    );
  };

  return (
    <Navigator_Layout
      Is_Open={Is_Open}
      setIsOpen={setIsOpen}
      Is_Searching={Is_Searching}
      Set_Is_Searching={Set_Is_Searching}
      Search_Query={Search_Query}
      Set_Search_Query={Set_Search_Query}
      Button_Label={Section_Label}
      Input_Reference={Input_Reference}
      Render_Mobile_Header_Left={() => Render_Header_Left_Dropdown(Is_Mobile_Depth_Open, Set_Is_Mobile_Depth_Open, "mobile")}
      Render_Desktop_Header_Left={() => Render_Header_Left_Dropdown(Is_Desktop_Depth_Open, Set_Is_Desktop_Depth_Open, "desktop")}
      Show_Go_Back={Show_Go_Back}
      onGoBack={Handle_Go_Back}
    >
      <div className="flex flex-col gap-1.5 px-3 pt-2 sm:p-2 w-full relative">
        {Is_Loading_Corpus_Data && (
          <p className="text-xs text-muted-foreground p-8 text-center animate-pulse">
            Syncing Aid Corpus Menu entries...
          </p>
        )}
        
        {!Is_Loading_Corpus_Data && Filtered_Items.map((item, index) => {
          if (item.isBranchTrigger) {
            return (
              <button
                key={`branch-${index}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  item.branchAction?.();
                }}
                className={Get_Native_Button_Class_Name(false)}
              >
                <span className="truncate">{item.name}</span>
              </button>
            );
          }

          const Is_Selected = Location_Data.pathname.toLowerCase().endsWith(item.slug.toLowerCase());
          return (
            <button
              key={item.slug}
              type="button"
              onClick={() => {
                Is_Lock_Active.current = false;
                navigate(`/${item.slug}`);
                Close_All();
              }}
              className={Get_Native_Button_Class_Name(Is_Selected)}
            >
              <span className="truncate">{item.name}</span>
            </button>
          );
        })}

        {!Is_Loading_Corpus_Data && Filtered_Items.length === 0 && (
          <p className="text-xs text-muted-foreground p-8 text-center">
            No entries found matching specified layout
          </p>
        )}
      </div>
    </Navigator_Layout>
  );
}

export function Is_Aid_Path(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "Aid" || !parts[1]) return false;

  let section = parts[1];
  if (section === "Alphabet" || section === "Vocabulary" || section === "Tajweed") {
    section = "Arabic";
  }

  const allowed = ["Feeling", "Prophets", "Arabic", "Dua", "Pillars", "Articles"];
  if (!allowed.includes(section)) return false;

  if (section !== "Arabic") {
    const hasSubfolder = parts[2] === "Tajweed" || parts[2] === "Vocabulary" || parts[2] === "Alphabet";
    const p1 = hasSubfolder ? parts[3] : parts[2];
    if (!p1) return false;
  }

  return true;
}