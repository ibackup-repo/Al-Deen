// @Web/Component/Layout/Header/Navigator/Quran.tsx
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@Web/Component/UI/Button";
import { Container } from "@Web/Component/UI/Container";
import { Class_Names } from "@/Library/Utility";
import { Navigator_Layout } from "./Utility";

const Backend_Base_URL = "https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev";

type Picker_Level = "Surah" | "Ayah" | "kalima" | "juz" | "hizb";

async function Fetch_Quran_Corpus_From_Backend() {
  const response = await fetch(`${Backend_Base_URL}/api/Quran-Corpus`);
  if (!response.ok) throw new Error("Failed to load unified Quran Corpus data map");
  return response.json();
}

async function Fetch_Ayah_Details(Surah: number, Ayah: number): Promise<{ Kalimaat: any[] } | null> {
  try {
    const response = await fetch(`${Backend_Base_URL}/api/Surah/${Surah}/Ayah/${Ayah}?wbw=true`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function Parse_Quran_Route(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const result: {
    Surah?: number;
    Ayah?: number;
    kalima?: number;
    juz?: number;
    hizb?: number;
    Mode: "Surah" | "juz" | "hizb" | "unknown";
  } = { Mode: "unknown" };

  if (parts.includes("Juz")) {
    result.juz = parseInt(parts[parts.indexOf("Juz") + 1]) || undefined;
    result.Mode = "juz";
  } else if (parts.includes("Hizb")) {
    result.hizb = parseInt(parts[parts.indexOf("Hizb") + 1]) || undefined;
    result.Mode = "hizb";
  } else if (parts.includes("Surah")) {
    const Index = parts.indexOf("Surah");
    result.Surah = parseInt(parts[Index + 1]) || undefined;
    result.Mode = "Surah";
    if (parts.includes("Ayah")) {
      const ayahIdx = parts.indexOf("Ayah");
      result.Ayah = parseInt(parts[ayahIdx + 1]) || undefined;
      if (parts.includes("Kalima")) {
        result.kalima = parseInt(parts[parts.indexOf("Kalima") + 1]) || undefined;
      }
    }
  }
  return result;
}

export function Quran_Navigator() {
  const navigate = useNavigate();
  const Location_Data = useLocation();
  const Route_Info = Parse_Quran_Route(Location_Data.pathname);

  const [Is_Open, setIsOpen] = useState(false);
  const [Is_Searching, Set_Is_Searching] = useState(false);
  const [Search_Query, Set_Search_Query] = useState("");

  const [Is_Mobile_Category_Open, Set_Is_Mobile_Category_Open] = useState(false);
  const [Is_Desktop_Category_Open, Set_Is_Desktop_Category_Open] = useState(false);

  const [Active_Tab, Set_Active_Tab] = useState<Picker_Level>(() => {
    if (Route_Info.Mode === "juz") return "juz";
    if (Route_Info.Mode === "hizb") return "hizb";
    if (Route_Info.kalima) return "kalima";
    if (Route_Info.Ayah) return "Ayah";
    return "Surah";
  });

  const [Drill_Surah, Set_Drill_Surah] = useState<number | undefined>(Route_Info.Surah || 1);
  const [Drill_Ayah, Set_Drill_Ayah] = useState<number | undefined>(Route_Info.Ayah || 1);
  const [Drill_Step, Set_Drill_Step] = useState<Picker_Level>(() => {
    if (Route_Info.Mode === "juz") return "juz";
    if (Route_Info.Mode === "hizb") return "hizb";
    if (Route_Info.kalima) return "kalima";
    if (Route_Info.Ayah) return "Ayah";
    return "Surah";
  });
  
  const [Kalimah_List, Set_Kalimah_List] = useState<number[]>([]);
  const [Loading_Words, Set_Loading_Words] = useState(false);
  const Input_Reference = useRef<HTMLInputElement>(null);

  // Ingest structural database maps over unified reactive query cache
  const { data: Corpus } = useQuery({
    queryKey: ["Quran_Corpus_Backend"],
    queryFn: Fetch_Quran_Corpus_From_Backend,
    staleTime: 1000 * 60 * 30,
    enabled: Is_Open || !!Route_Info.Surah,
  });

  const Surah_List = useMemo(() => Corpus?.Suwar || [], [Corpus]);

  useEffect(() => {
    const activeRoute = Parse_Quran_Route(Location_Data.pathname);
    Set_Drill_Surah(activeRoute.Surah || 1);
    Set_Drill_Ayah(activeRoute.Ayah || 1);

    if (activeRoute.Mode === "juz") {
      Set_Active_Tab("juz");
      Set_Drill_Step("juz");
    } else if (activeRoute.Mode === "hizb") {
      Set_Active_Tab("hizb");
      Set_Drill_Step("hizb");
    } else if (activeRoute.kalima) {
      Set_Active_Tab("kalima");
      Set_Drill_Step("kalima");
    } else if (activeRoute.Ayah) {
      Set_Active_Tab("Ayah");
      Set_Drill_Step("Ayah");
    } else {
      Set_Active_Tab("Surah");
      Set_Drill_Step("Surah");
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

  useEffect(() => {
    if (Drill_Step !== "kalima" || !Drill_Surah || !Drill_Ayah) return;
    let Cancelled = false;
    Set_Loading_Words(true);
    
    Fetch_Ayah_Details(Drill_Surah, Drill_Ayah)
      .then((Ayah) => {
        if (!Cancelled && Ayah?.Kalimaat) {
          Set_Kalimah_List(Array.from({ length: Ayah.Kalimaat.length }, (_, i) => i + 1));
        }
      })
      .finally(() => {
        if (!Cancelled) Set_Loading_Words(false);
      });
      
    return () => { Cancelled = true; };
  }, [Drill_Step, Drill_Surah, Drill_Ayah]);

  const Handle_Open_Change = (Open: boolean) => {
    if (Open) {
      Set_Search_Query("");
      const activeRoute = Parse_Quran_Route(Location_Data.pathname);

      Set_Drill_Surah(activeRoute.Surah || 1);
      Set_Drill_Ayah(activeRoute.Ayah || 1);
      
      if (activeRoute.Mode === "juz") {
        Set_Active_Tab("juz");
        Set_Drill_Step("juz");
      } else if (activeRoute.Mode === "hizb") {
        Set_Active_Tab("hizb");
        Set_Drill_Step("hizb");
      } else if (activeRoute.kalima) {
        Set_Active_Tab("kalima");
        Set_Drill_Step("kalima");
      } else if (activeRoute.Ayah) {
        Set_Active_Tab("Ayah");
        Set_Drill_Step("Ayah");
      } else {
        Set_Active_Tab("Surah");
        Set_Drill_Step("Surah");
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

  const Commit_Surah = useCallback((id: number) => {
    Set_Drill_Surah(id);
    if (Active_Tab === "Surah") {
      navigate(`/Quran/Surah/${id}`);
      Close_All();
    } else {
      Set_Drill_Step("Ayah");
    }
  }, [Active_Tab, navigate]);

  const Commit_Ayah = useCallback((Ayah: number) => {
    if (!Drill_Surah) return;
    Set_Drill_Ayah(Ayah);
    if (Active_Tab === "Ayah") {
      navigate(`/Quran/Surah/${Drill_Surah}/Ayah/${Ayah}`);
      Close_All();
    } else {
      Set_Drill_Step("kalima");
    }
  }, [Active_Tab, Drill_Surah, navigate]);

  const Handle_Go_Back = useCallback(() => {
    if (Drill_Step === "kalima") {
      Set_Drill_Step("Ayah");
    } else if (Drill_Step === "Ayah") {
      Set_Drill_Step("Surah");
    }
  }, [Drill_Step]);

  const Show_Go_Back = useMemo(() => {
    return (Active_Tab === "Surah" || Active_Tab === "Ayah" || Active_Tab === "kalima") && Drill_Step !== "Surah";
  }, [Active_Tab, Drill_Step]);

  const Filtered_Suwar = useMemo(() => {
    const q = Search_Query.toLowerCase().trim();
    if (!q) return Surah_List;
    return Surah_List.filter((s: any) =>
      s.id.toString().includes(q) ||
      (s.English_Name_Transliteration || s.English_Name).toLowerCase().includes(q)
    );
  }, [Search_Query, Surah_List]);

  const Button_Label = useMemo(() => {
    if (Route_Info.Surah && Surah_List.length > 0) {
      const meta = Surah_List.find((s: any) => s.id === Route_Info.Surah);
      const base = meta ? meta.English_Name_Transliteration || meta.English_Name : "Surah";
      if (Route_Info.kalima) return `${base} · ${Route_Info.Ayah}:${Route_Info.kalima}`;
      if (Route_Info.Ayah) return `${base} · ${Route_Info.Ayah}`;
      return base;
    }
    if (Route_Info.juz) return `Juz ${Route_Info.juz}`;
    if (Route_Info.hizb) return `Hizb ${Route_Info.hizb}`;
    return "Quran";
  }, [Route_Info, Surah_List]);

  const Picker_Options = useMemo(() => [
    { id: "Surah" as Picker_Level, label: "Surah" },
    { id: "Ayah" as Picker_Level, label: "Ayah" },
    { id: "kalima" as Picker_Level, label: "Kalimah" },
    { id: "juz" as Picker_Level, label: "Juz" },
    { id: "hizb" as Picker_Level, label: "Hizb" },
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

  const Handle_Category_Select = (optId: Picker_Level, screenMode: "mobile" | "desktop") => {
    if (screenMode === "mobile") {
      Set_Is_Mobile_Category_Open(false);
    } else {
      Set_Is_Desktop_Category_Open(false);
    }

    Set_Active_Tab(optId);
    Set_Search_Query("");
    
    if (optId === "juz" || optId === "hizb") {
      Set_Drill_Step(optId);
    } else {
      Set_Drill_Step("Surah");
    }
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
          {Picker_Options.find((o) => o.id === Active_Tab)?.label ?? "Browse"}
          <ChevronDown className={Class_Names("h-5 w-5 ml-1 transition-transform Duration-200", Is_Mobile_Category_Open && "rotate-180")} />
        </Button>

        {Is_Mobile_Category_Open && (
          <div
            className="absolute left-0 Top-full mt-1 min-w-[140px] border border-border/40 bg-popover text-popover-foreground shadow-md z-[10003] overflow-hidden rounded-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {Picker_Options.map((opt) => (
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
          {Picker_Options.find((o) => o.id === Active_Tab)?.label ?? "Browse"}
          <ChevronDown className={Class_Names("h-5 w-5 ml-1 transition-transform Duration-200", Is_Desktop_Category_Open && "rotate-180")} />
        </Button>

        {Is_Desktop_Category_Open && (
          <div
            className="absolute left-0 Top-full mt-1 min-w-[140px] border border-border/40 bg-popover text-popover-foreground shadow-md z-[10003] overflow-hidden rounded-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {Picker_Options.map((opt) => (
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
        {Drill_Step === "Surah" ? (
          <div className="flex flex-col gap-1.5 px-3 pt-2 sm:p-2">
            {Filtered_Suwar.map((s: any) => {
              const Is_Active = Route_Info.Surah === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => Commit_Surah(s.id)}
                  className={Get_Native_Button_Class_Name(Is_Active)}
                >
                  <span className="truncate">
                    {s.id}. {s.English_Name_Transliteration || s.English_Name}
                  </span>
                </button>
              );
            })}
          </div>
        ) : Drill_Step === "Ayah" ? (
          (() => {
            const meta = Surah_List.find((s: any) => s.id === Drill_Surah);
            if (!meta) return <p className="text-xs text-muted-foreground p-8 text-center">Select a Surah first.</p>;
            return (
              <div className="flex flex-col px-3 pt-2 sm:p-2 snap-start">
                <div className="grid grid-cols-5 gap-2 p-2 bg-background rounded-xl shadow-sm">
                  {Array.from({ length: meta.Number_Of_Ayaat }, (_, i) => i + 1).map((Ayah) => {
                    const Is_Active = Route_Info.Ayah === Ayah && Route_Info.Surah === Drill_Surah;
                    return (
                      <button
                        key={Ayah}
                        type="button"
                        onClick={() => Commit_Ayah(Ayah)}
                        className={Class_Names(
                          "h-9 w-full min-w-0 flex items-center justify-center text-xs font-normal focus:outline-none transition-colors Duration-200 rounded-full aspect-square",
                          Is_Active
                            ? "bg-accent text-accent-foreground font-semibold border border-border/60"
                            : "bg-card border border-border/30 text-card-foreground sm:hover:bg-accent sm:hover:text-accent-foreground"
                        )}
                      >
                        {Ayah}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()
        ) : Drill_Step === "kalima" ? (
          Loading_Words ? (
            <p className="text-xs text-muted-foreground p-8 text-center animate-pulse">Loading Kalimaat…</p>
          ) : (
            <div className="flex flex-col px-3 pt-2 sm:p-2 snap-start">
              <div className="grid grid-cols-5 gap-2 p-2 bg-background rounded-xl shadow-sm">
                {Kalimah_List.map((Kalimah) => {
                  const Is_Active = Route_Info.kalima === Kalimah && Route_Info.Ayah === Drill_Ayah && Route_Info.Surah === Drill_Surah;
                  return (
                    <button
                      key={Kalimah}
                      type="button"
                      onClick={() => {
                        navigate(`/Quran/Surah/${Drill_Surah}/Ayah/${Drill_Ayah}/Kalima/${Kalimah}`);
                        Close_All();
                      }}
                      className={Class_Names(
                        "h-9 w-full min-w-0 flex items-center justify-center text-xs font-normal focus:outline-none transition-colors Duration-200 rounded-full aspect-square",
                        Is_Active
                          ? "bg-accent text-accent-foreground font-semibold border border-border/60"
                          : "bg-card border border-border/30 text-card-foreground sm:hover:bg-accent sm:hover:text-accent-foreground"
                      )}
                    >
                      {Kalimah}
                    </button>
                  );
                })}
              </div>
            </div>
          )
        ) : Active_Tab === "juz" ? (
          <div className="flex flex-col px-3 pt-2 sm:p-2 snap-start">
            <div className="grid grid-cols-5 gap-2 p-2 bg-background rounded-xl shadow-sm">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => {
                const Is_Active = Route_Info.juz === juz;
                return (
                  <button
                    key={juz}
                    type="button"
                    onClick={() => {
                      navigate(`/Quran/Juz/${juz}`);
                      Close_All();
                    }}
                    className={Class_Names(
                      "h-9 w-full min-w-0 flex items-center justify-center text-xs font-normal focus:outline-none transition-colors Duration-200 rounded-full aspect-square",
                      Is_Active
                        ? "bg-accent text-accent-foreground font-semibold border border-border/60"
                        : "bg-card border border-border/30 text-card-foreground sm:hover:bg-accent sm:hover:text-accent-foreground"
                    )}
                  >
                    {juz}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col px-3 pt-2 sm:p-2 snap-start">
            <div className="grid grid-cols-5 gap-2 p-2 bg-background rounded-xl shadow-sm">
              {Array.from({ length: 60 }, (_, i) => i + 1).map((hizb) => {
                const Is_Active = Route_Info.hizb === hizb;
                return (
                  <button
                    key={hizb}
                    type="button"
                    onClick={() => {
                      navigate(`/Quran/Hizb/${hizb}`);
                      Close_All();
                    }}
                    className={Class_Names(
                      "h-9 w-full min-w-0 flex items-center justify-center text-xs font-normal focus:outline-none transition-colors Duration-200 rounded-full aspect-square",
                      Is_Active
                        ? "bg-accent text-accent-foreground font-semibold border border-border/60"
                        : "bg-card border border-border/30 text-card-foreground sm:hover:bg-accent sm:hover:text-accent-foreground"
                    )}
                  >
                    {hizb}
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