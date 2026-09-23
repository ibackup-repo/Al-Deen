// @Web/Component/Layout/Header/Navigator/Hadith.tsx
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query"; // 🌟 Swapped for global state query engine
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@Web/Component/UI/Button";
import { Container } from "@Web/Component/UI/Container";
import { Class_Names } from "@/Library/Utility";
import { Navigator_Layout } from "./Utility";

type Hadith_Level = "collection" | "chapter" | "Hadith";

// 🌟 Local placeholder tracking array for immediate client fallback structures
const Baseline_Fallback_Collections = [
  {
    id: "Sahih-Muslim",
    slug: "Sahih-Muslim",
    name: "Sahih Muslim",
    author: "Muslim",
    topFolder: "Sahih",
    authorFolder: "Muslim",
    hadithCount: 0, 
    description: "Sahih collection compiled by Muslim."
  }
];

// Fetch matching endpoint declared on your central Node infrastructure instance
async function Fetch_Corpus_From_Backend() {
  const response = await fetch("http://localhost:8081/api/Hadith-Corpus");
  if (!response.ok) throw new Error("Failed to load backend Corpus data");
  return response.json();
}

function Parse_Route(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "Hadith") {
    return {
      collectionSlug: parts[1],
      Chapter_ID: parts[2],
      hadithId: parts[3],
    };
  }
  return null;
}

export function Is_Hadith_Path(pathname: string) {
  return Parse_Route(pathname) !== null;
}

export function Hadith_Navigator() {
  const navigate = useNavigate();
  const Location_Data = useLocation();
  const route = Parse_Route(Location_Data.pathname);

  const [Is_Open, setIsOpen] = useState(false);
  const [Is_Searching, Set_Is_Searching] = useState(false);
  const [Search_Query, Set_Search_Query] = useState("");

  const [Is_Mobile_Category_Open, Set_Is_Mobile_Category_Open] = useState(false);
  const [Is_Desktop_Category_Open, Set_Is_Desktop_Category_Open] = useState(false);

  const [Active_Tab, Set_Active_Tab] = useState<Hadith_Level>(() => {
    if (route?.hadithId) return "Hadith";
    if (route?.Chapter_ID) return "chapter";
    return "collection";
  });

  const [Drill_Collection, Set_Drill_Collection] = useState<string | undefined>(route?.collectionSlug);
  const [Drill_Chapter, Set_Drill_Chapter] = useState<string | undefined>(route?.Chapter_ID);
  
  const [Drill_Step, Set_Drill_Step] = useState<Hadith_Level>(() => {
    if (route?.hadithId) return "Hadith";
    if (route?.Chapter_ID) return "chapter";
    return "collection";
  });

  const Input_Reference = useRef<HTMLInputElement>(null);

  // 🌟 Read data directly from Node backend query engine
  const { data: Corpus } = useQuery({
    queryKey: ["hadithCorpusBackend"],
    queryFn: Fetch_Corpus_From_Backend,
    staleTime: 1000 * 60 * 15,
  });

  useEffect(() => {
    const activeRoute = Parse_Route(Location_Data.pathname);
    Set_Drill_Collection(activeRoute?.collectionSlug);
    Set_Drill_Chapter(activeRoute?.Chapter_ID);

    if (activeRoute?.hadithId) {
      Set_Active_Tab("Hadith");
      Set_Drill_Step("Hadith");
    } else if (activeRoute?.Chapter_ID) {
      Set_Active_Tab("chapter");
      Set_Drill_Step("chapter");
    } else {
      Set_Active_Tab("collection");
      Set_Drill_Step("collection");
    }
  }, [Location_Data.pathname]);

  useEffect(() => {
    if (!Is_Mobile_Category_Open && !Is_Desktop_Category_Open) return;

    const handleOutsideClick = () => {
      Set_Is_Mobile_Category_Open(false);
      Set_Is_Desktop_Category_Open(false);
    };

    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [Is_Mobile_Category_Open, Is_Desktop_Category_Open]);

  const Handle_Open_Change = (Open: boolean) => {
    if (Open) {
      Set_Search_Query("");
      const activeRoute = Parse_Route(Location_Data.pathname);

      Set_Drill_Collection(activeRoute?.collectionSlug);
      Set_Drill_Chapter(activeRoute?.Chapter_ID);
      
      if (activeRoute?.hadithId) {
        Set_Active_Tab("Hadith");
        Set_Drill_Step("Hadith");
      } else if (activeRoute?.Chapter_ID) {
        Set_Active_Tab("chapter");
        Set_Drill_Step("chapter");
      } else {
        Set_Active_Tab("collection");
        Set_Drill_Step("collection");
      }
    }
    setIsOpen(Open);
  };

  const Close_All = () => {
    setIsOpen(false);
    Set_Is_Searching(false);
    Set_Search_Query("");
    Set_Is_Mobile_Category_Open(false);
    Set_Is_Desktop_Category_Open(false);
  };

  const Commit_Collection = useCallback((slug: string) => {
    Set_Drill_Collection(slug);
    if (Active_Tab === "collection") {
      navigate(`/Hadith/${slug}`);
      Close_All();
    } else {
      Set_Drill_Step("chapter");
    }
  }, [Active_Tab, navigate]);

  const Commit_Chapter = useCallback((Chapter_ID: string) => {
    Set_Drill_Chapter(Chapter_ID);
    if (Active_Tab === "chapter") {
      if (!Drill_Collection) return;
      navigate(`/Hadith/${Drill_Collection}/${Chapter_ID}`);
      Close_All();
    } else {
      Set_Drill_Step("Hadith");
    }
  }, [Active_Tab, Drill_Collection, navigate]);

  const Commit_Hadith = useCallback((hadithId: string) => {
    if (!Drill_Collection || !Drill_Chapter) return;
    navigate(`/Hadith/${Drill_Collection}/${Drill_Chapter}/${hadithId}`);
    Close_All();
  }, [Drill_Collection, Drill_Chapter, navigate]);

  const Handle_Go_Back = useCallback(() => {
    if (Drill_Step === "Hadith") {
      Set_Drill_Step("chapter");
    } else if (Drill_Step === "chapter") {
      Set_Drill_Step("collection");
    }
  }, [Drill_Step]);

  const Show_Go_Back = useMemo(() => {
    return Drill_Step !== "collection";
  }, [Drill_Step]);

  const Filtered_Collections = useMemo(() => {
    const q = Search_Query.toLowerCase().trim();
    // 🌟 Safely point source mapping parameters to cache or fallback array
    const Source_Collections = Corpus?.Hadith_Collections_List || Baseline_Fallback_Collections;
    return Source_Collections.filter((c: any) =>
      !q ? true : c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
    );
  }, [Corpus, Search_Query]);

  const Chapters_For_Drill = useMemo(() => {
    if (!Drill_Collection || !Corpus?.Hadith_Collections_List) return [];
    const targetColl = Corpus.Hadith_Collections_List.find((c: any) => c.slug.toLowerCase() === Drill_Collection.toLowerCase());
    const list = targetColl?.chapters || [];
    const q = Search_Query.toLowerCase().trim();
    return q ? list.filter((c: any) => c.name.toLowerCase().includes(q) || c.id.toString().includes(q)) : list;
  }, [Drill_Collection, Corpus, Search_Query]);

  const Hadith_Ids_For_Drill = useMemo(() => {
    if (!Drill_Collection || !Drill_Chapter || !Corpus?.Hadith_Collections_List) return [];
    const targetColl = Corpus.Hadith_Collections_List.find((c: any) => c.slug.toLowerCase() === Drill_Collection.toLowerCase());
    const targetChap = targetColl?.chapters?.find((ch: any) => ch.id === Drill_Chapter);
    return targetChap?.hadiths?.map((h: any) => h.id) ?? [];
  }, [Drill_Collection, Drill_Chapter, Corpus]);

  const Button_Label = useMemo(() => {
    if (route?.hadithId) return `Hadith ${route.hadithId}`;
    if (route?.Chapter_ID) {
      const targetColl = Corpus?.Hadith_Collections_List?.find((c: any) => c.slug.toLowerCase() === route.collectionSlug?.toLowerCase());
      const targetChap = targetColl?.chapters?.find((ch: any) => ch.id === route.Chapter_ID);
      return targetChap?.name ?? `Chapter ${route.Chapter_ID}`;
    }
    if (route?.collectionSlug) {
      // 🌟 Point inline label compiler to correct data source safely
      const Source_Collections = Corpus?.Hadith_Collections_List || Baseline_Fallback_Collections;
      const c = Source_Collections.find((x: any) => x.slug.toLowerCase() === route.collectionSlug?.toLowerCase());
      return c?.name ?? route.collectionSlug;
    }
    return "Hadith";
  }, [route, Corpus]);

  const Tab_Options = useMemo(() => [
    { id: "collection" as Hadith_Level, label: "Collection" },
    { id: "chapter" as Hadith_Level, label: "Chapter" },
    { id: "Hadith" as Hadith_Level, label: "Hadith" }
  ], []);

  const Native_Button_Base = "w-full justify-start text-left font-normal truncate text-xs h-12 sm:h-9 rounded-lg px-3 sm:px-4 shrink-0 inline-flex items-center gap-2 py-2 transition-colors Duration-200 focus:outline-none border snap-start";

  const Get_Native_Button_Class_Name = (Is_Active: boolean) => {
    return Class_Names(
      Native_Button_Base,
      Is_Active
        ? "bg-accent text-accent-foreground font-semibold border-border/60"
        : "bg-card border-border/30 text-card-foreground sm:hover:bg-accent sm:hover:text-accent-foreground"
    );
  };

  const Render_Mobile_Header_Left = () => {
    return (
      <div className="relative inline-block text-left max-w-full z-[10002]">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2.5 text-xs font-medium text-foreground max-w-full justify-between rounded-full bg-[#fafafa]/80 backdrop-blur-sm shadow-sm [.high-contrast_&]:bg-white [.high-contrast_&]:border-black"
          onClick={(e) => {
            e.stopPropagation();
            Set_Is_Mobile_Category_Open((prev) => !prev);
          }}
        >
          {Tab_Options.find((o) => o.id === Active_Tab)?.label ?? "Browse"}
          <ChevronDown className={Class_Names("h-5 w-5 ml-1 transition-transform Duration-200", Is_Mobile_Category_Open && "rotate-180")} />
        </Button>

        {Is_Mobile_Category_Open && (
          <div
            className="absolute left-0 Top-full mt-1 min-w-[140px] border border-border/40 bg-popover text-popover-foreground shadow-md z-[10003] overflow-hidden rounded-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {Tab_Options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  Handle_Category_Select(opt.id, "mobile");
                }}
                className={Class_Names(
                  "w-full flex items-center justify-between text-left px-4 py-2.5 text-xs font-medium rounded-none h-auto border-0 bg-transparent transition-colors Duration-200 focus:outline-none",
                  Active_Tab === opt.id ? "bg-accent text-accent-foreground font-semibold" : "text-popover-foreground hover:bg-accent/50"
                )}
              >
                {opt.label}
                {Active_Tab === opt.id && <Check className="h-5 w-5 ml-2" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const Render_Desktop_Header_Left = () => {
    return (
      <div className="relative inline-block text-left max-w-full z-[10002]">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2.5 text-xs font-medium text-foreground max-w-full justify-between rounded-full bg-[#fafafa]/80 backdrop-blur-sm shadow-sm [.high-contrast_&]:bg-white [.high-contrast_&]:border-black"
          onClick={(e) => {
            e.stopPropagation();
            Set_Is_Desktop_Category_Open((prev) => !prev);
          }}
        >
          {Tab_Options.find((o) => o.id === Active_Tab)?.label ?? "Browse"}
          <ChevronDown className={Class_Names("h-5 w-5 ml-1 transition-transform Duration-200", Is_Desktop_Category_Open && "rotate-180")} />
        </Button>

        {Is_Desktop_Category_Open && (
          <div
            className="absolute left-0 Top-full mt-1 min-w-[140px] border border-border/40 bg-popover text-popover-foreground shadow-md z-[10003] overflow-hidden rounded-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {Tab_Options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  Handle_Category_Select(opt.id, "desktop");
                }}
                className={Class_Names(
                  "w-full flex items-center justify-between text-left px-4 py-2.5 text-xs font-medium rounded-none h-auto border-0 bg-transparent transition-colors Duration-200 focus:outline-none sm:hover:bg-accent sm:hover:text-accent-foreground",
                  Active_Tab === opt.id && "bg-accent text-accent-foreground font-semibold"
                )}
              >
                {opt.label}
                {Active_Tab === opt.id && <Check className="h-5 w-5 ml-2" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const Handle_Category_Select = (optId: Hadith_Level, screenMode: "mobile" | "desktop") => {
    if (screenMode === "mobile") {
      Set_Is_Mobile_Category_Open(false);
    } else {
      Set_Is_Desktop_Category_Open(false);
    }

    Set_Active_Tab(optId);
    Set_Search_Query("");
    Set_Drill_Step("collection");
  };

  if (route && !route.collectionSlug) {
    return (
      <Container className="!py-1 !px-3 inline-flex w-auto max-w-[70%]">
        <span className="text-sm font-medium truncate">{Button_Label}</span>
      </Container>
    );
  }

  return (
    <Navigator_Layout
      Is_Open={Is_Open}
      setIsOpen={Handle_Open_Change}
      Is_Searching={Is_Searching}
      Set_Is_Searching={Set_Is_Searching}
      Search_Query={Search_Query}
      Set_Search_Query={Set_Search_Query}
      Button_Label={Button_Label}
      Input_Reference={Input_Reference}
      Render_Mobile_Header_Left={Render_Mobile_Header_Left}
      Render_Desktop_Header_Left={Render_Desktop_Header_Left}
      Show_Go_Back={Show_Go_Back}
      onGoBack={Handle_Go_Back}
    >
      <div className="w-full relative">
        {Drill_Step === "collection" ? (
          <div className="flex flex-col gap-1.5 px-3 pt-2 sm:p-2">
            {Filtered_Collections.map((c: any) => {
              const Is_Active = Drill_Collection?.toLowerCase() === c.slug.toLowerCase();
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => Commit_Collection(c.slug)}
                  className={Get_Native_Button_Class_Name(Is_Active)}
                >
                  <span className="truncate">{c.name}</span>
                </button>
              );
            })}
          </div>
        ) : Drill_Step === "chapter" ? (
          <div className="flex flex-col gap-1.5 px-3 pt-2 sm:p-2">
            {Chapters_For_Drill.map((c: any) => {
              const Is_Active = Drill_Chapter === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => Commit_Chapter(c.id)}
                  className={Get_Native_Button_Class_Name(Is_Active)}
                >
                  <span className="truncate">{c.name}</span>
                </button>
              );
            })}
            {Chapters_For_Drill.length === 0 && (
              <p className="text-xs text-muted-foreground p-8 text-center">No Results found</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col px-3 pt-2 sm:p-2 snap-start">
            <div className="grid grid-cols-5 gap-2 p-2 bg-background rounded-xl shadow-sm">
              {Hadith_Ids_For_Drill.map((id: string) => {
                const Is_Active = route?.hadithId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => Commit_Hadith(id)}
                    className={Class_Names(
                      "h-9 w-full min-w-0 flex items-center justify-center text-xs font-normal focus:outline-none transition-colors Duration-200 rounded-full aspect-square",
                      Is_Active
                        ? "bg-accent text-accent-foreground font-semibold border border-border/60"
                        : "bg-card border border-border/30 text-card-foreground sm:hover:bg-accent sm:hover:text-accent-foreground"
                    )}
                  >
                    {id}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Navigator_Layout>
  );
}