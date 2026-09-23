import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Container } from "@Web/Component/UI/Container";
import { Button } from "@Web/Component/UI/Button";
import { Class_Names } from "@/Library/Utility";

const Backend_Base_URL = "https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev";

async function Fetch_Quran_Corpus_From_Backend() {
  const response = await fetch(`${Backend_Base_URL}/api/Quran-Corpus`);
  if (!response.ok) throw new Error("Failed to load unified Quran Corpus data map");
  return response.json();
}

type Surah_Sort_Order = "ascending" | "descending" | "revelation";

interface Filter_Properties {
  Is_Open: boolean;
  On_Close: () => void;
  Filter_Type: "Surah" | "juz" | "hizb" | "page" | null;
  Set_Filter_Type: (type: "Surah" | "juz" | "hizb" | "page" | null) => void;

  Selected_Surah: number | null;
  Set_Selected_Surah: (Surah: number | null) => void;
  Selected_Ayah: number | null;
  Set_Selected_Ayah: (Ayah: number | null) => void;
  Surah_Sort_Order_State: Surah_Sort_Order;
  Set_Surah_Sort_Order: (order: Surah_Sort_Order) => void;

  Selected_Juz?: number | null;
  Selected_Hizb?: number | null;
  Selected_Page?: number | null;

  On_Apply: () => void;
  On_Reset: () => void;
}

function Use_Click_Outside(ref: React.RefObject<HTMLElement>, Handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      Handler();
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, Handler]);
}

export function Filter({
  Is_Open,
  On_Close,
  Filter_Type,
  Set_Filter_Type,
  Selected_Surah,
  Set_Selected_Surah,
  Selected_Ayah,
  Set_Selected_Ayah,
  Surah_Sort_Order_State,
  Set_Surah_Sort_Order,
  Selected_Juz,
  Selected_Hizb,
  Selected_Page,
  On_Apply,
  On_Reset,
}: Filter_Properties) {
  const [Show_Surah_Dropdown, Set_Show_Surah_Dropdown] = useState(false);
  const [Show_Ayah_Dropdown, Set_Show_Ayah_Dropdown] = useState(false);
  const [Show_Filter_Type_Dropdown, Set_Show_Filter_Type_Dropdown] = useState(false);
  const [Show_Sort_Dropdown, Set_Show_Sort_Dropdown] = useState(false);

  const Surah_Dropdown_Reference = useRef<HTMLDivElement>(null);
  const Ayah_Dropdown_Reference = useRef<HTMLDivElement>(null);
  const Filter_Type_Dropdown_Reference = useRef<HTMLDivElement>(null);
  const Sort_Dropdown_Reference = useRef<HTMLDivElement>(null);
  const Panel_Reference = useRef<HTMLDivElement>(null);   // whole filter panel

  // Ingest structural database maps over unified reactive query cache
  const { data: Corpus } = useQuery({
    queryKey: ["Quran_Corpus_Backend"],
    queryFn: Fetch_Quran_Corpus_From_Backend,
    staleTime: 1000 * 60 * 30,
    enabled: Is_Open,
  });

  const Surah_List = useMemo(() => Corpus?.Suwar || [], [Corpus]);

  Use_Click_Outside(Surah_Dropdown_Reference, () => Set_Show_Surah_Dropdown(false));
  Use_Click_Outside(Ayah_Dropdown_Reference, () => Set_Show_Ayah_Dropdown(false));
  Use_Click_Outside(Filter_Type_Dropdown_Reference, () => Set_Show_Filter_Type_Dropdown(false));
  Use_Click_Outside(Sort_Dropdown_Reference, () => Set_Show_Sort_Dropdown(false));

  // Close the whole filter panel when clicking outside of it
  Use_Click_Outside(Panel_Reference, On_Close);

  const Selected_Surah_Metadata = useMemo(() => {
    if (!Selected_Surah || Surah_List.length === 0) return null;
    return Surah_List.find((s: any) => s.id === Selected_Surah) || null;
  }, [Selected_Surah, Surah_List]);

  const ayahs = useMemo(() => {
    return Selected_Surah_Metadata
      ? Array.from({ length: Selected_Surah_Metadata.Number_Of_Ayaat }, (_, i) => i + 1)
      : [];
  }, [Selected_Surah_Metadata]);

  const Has_Active_Filter = (() => {
    if (Filter_Type === "Surah") return Selected_Surah !== null;
    if (Filter_Type === "juz") return Selected_Juz !== null && Selected_Juz !== undefined;
    if (Filter_Type === "hizb") return Selected_Hizb !== null && Selected_Hizb !== undefined;
    if (Filter_Type === "page") return Selected_Page !== null && Selected_Page !== undefined;
    return false;
  })();

  if (!Is_Open) return null;

  const Handle_Filter_Type_Change = (type: typeof Filter_Type) => {
    Set_Filter_Type(type);
    Set_Show_Filter_Type_Dropdown(false);
    if (type !== "Surah") {
      Set_Selected_Surah(null);
      Set_Selected_Ayah(null);
    }
  };

  const Get_Filter_Type_Label = () => {
    if (Filter_Type === "Surah") return "Surah";
    if (Filter_Type === "juz") return "Juz";
    if (Filter_Type === "hizb") return "Hizb";
    if (Filter_Type === "page") return "Page";
    return "Select type";
  };

  const Get_Sort_Label = () => {
    if (Surah_Sort_Order_State === "ascending") return "Ascending";
    if (Surah_Sort_Order_State === "descending") return "Descending";
    return "Revelation";
  };

  const Sort_Options = [
    { id: "ascending", label: "Ascending" },
    { id: "descending", label: "Descending" },
    { id: "revelation", label: "Revelation" },
  ];

  // Custom reset that preserves Filter_Type = "Surah"
  const Handle_Reset = () => {
    On_Reset();
    Set_Filter_Type("Surah");
    Set_Selected_Surah(null);
    Set_Selected_Ayah(null);
  };

  return (
    <>
      {/* Backdrop overlay – closes filter on click, blocks interaction */}
      <div
        className="fixed inset-0 z-999"
        onClick={On_Close}
      />

      {/* Filter panel */}
      <div
        ref={Panel_Reference}
        className="absolute right-0 mt-2 w-80 z-50"
      >
        <Container className="!p-4 space-y-2">
          {/* Show section with clear button */}
          <div className="flex items-center justify-between">
            <Container className="!p-0 !bg-transparent inline-block w-auto">
              <p className="text-xs font-medium text-muted-foreground px-1">Show</p>
            </Container>
            {(Filter_Type || Selected_Surah || Selected_Ayah) && (
              <Button onClick={Handle_Reset} size="sm" className="text-xs">
                Clear
              </Button>
            )}
          </div>

          {/* Dropdown for filter type */}
          <div ref={Filter_Type_Dropdown_Reference} className="relative">
            <Button
              onClick={() => Set_Show_Filter_Type_Dropdown(!Show_Filter_Type_Dropdown)}
              className="w-full justify-between"
              fullWidth
              Active={Filter_Type !== null}
            >
              <span>{Get_Filter_Type_Label()}</span>
              <ChevronDown
                className={Class_Names("h-4 w-4 transition-transform", Show_Filter_Type_Dropdown && "rotate-180")}
              />
            </Button>
            {Show_Filter_Type_Dropdown && (
              <div className="absolute left-0 right-0 Top-full mt-1 z-[100]">
                <Container className="!p-1">
                  {[
                    { id: "Surah", label: "Surah" },
                    { id: "juz", label: "Juz" },
                    { id: "hizb", label: "Hizb" },
                    { id: "page", label: "Page" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => Handle_Filter_Type_Change(option.id as any)}
                      className={Class_Names(
                        "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors",
                        "text-black dark:text-white",
                        Filter_Type === option.id
                          ? "bg-black dark:bg-white text-white dark:text-black"
                          : "hover:bg-black/10 dark:hover:bg-white/10"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </Container>
              </div>
            )}
          </div>

          {/* Conditional UI (Surah/Ayah) - above Sort */}
          {Filter_Type === "Surah" && (
            <div className="space-y-2">
              {/* Surah Dropdown */}
              <div ref={Surah_Dropdown_Reference} className="relative">
                <Button
                  onClick={() => Set_Show_Surah_Dropdown(!Show_Surah_Dropdown)}
                  className="w-full justify-between"
                  fullWidth
                >
                  <span>
                    {Selected_Surah_Metadata
                      ? `${Selected_Surah_Metadata.id} ${Selected_Surah_Metadata.English_Name}`
                      : "Select Surah"}
                  </span>
                  <ChevronDown
                    className={Class_Names("h-4 w-4 transition-transform", Show_Surah_Dropdown && "rotate-180")}
                  />
                </Button>
                {Show_Surah_Dropdown && (
                  <div className="absolute left-0 right-0 Top-full mt-1 max-h-60 overflow-y-auto z-[100]">
                    <Container className="!p-1">
                      {Surah_List.map((Surah: any) => (
                        <button
                          key={Surah.id}
                          onClick={() => {
                            Set_Selected_Surah(Surah.id);
                            Set_Selected_Ayah(null);
                            Set_Show_Surah_Dropdown(false);
                          }}
                          className={Class_Names(
                            "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors",
                            "text-black dark:text-white",
                            Selected_Surah === Surah.id
                              ? "bg-black dark:bg-white text-white dark:text-black"
                              : "hover:bg-black/10 dark:hover:bg-white/10"
                          )}
                        >
                          {Surah.id} {Surah.English_Name}
                        </button>
                      ))}
                    </Container>
                  </div>
                )}
              </div>

              {/* Ayah Dropdown */}
              {Selected_Surah && (
                <div ref={Ayah_Dropdown_Reference} className="relative">
                  <Button
                    onClick={() => Set_Show_Ayah_Dropdown(!Show_Ayah_Dropdown)}
                    className="w-full justify-between"
                    fullWidth
                  >
                    <span>{Selected_Ayah ? `Ayah ${Selected_Ayah}` : "All Ayah"}</span>
                    <ChevronDown
                      className={Class_Names("h-4 w-4 transition-transform", Show_Ayah_Dropdown && "rotate-180")}
                    />
                  </Button>
                  {Show_Ayah_Dropdown && (
                    <div className="absolute left-0 right-0 Top-full mt-1 max-h-60 overflow-y-auto z-[100]">
                      <Container className="!p-1">
                        <button
                          onClick={() => {
                            Set_Selected_Ayah(null);
                            Set_Show_Ayah_Dropdown(false);
                          }}
                          className={Class_Names(
                            "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors",
                            "text-black dark:text-white",
                            Selected_Ayah === null
                              ? "bg-black dark:bg-white text-white dark:text-black"
                              : "hover:bg-black/10 dark:hover:bg-white/10"
                          )}
                        >
                          All Ayah
                        </button>
                        {ayahs.map((Ayah) => (
                          <button
                            key={Ayah}
                            onClick={() => {
                              Set_Selected_Ayah(Ayah);
                              Set_Show_Ayah_Dropdown(false);
                            }}
                            className={Class_Names(
                              "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors",
                              "text-black dark:text-white",
                              Selected_Ayah === Ayah
                                ? "bg-black dark:bg-white text-white dark:text-black"
                                : "hover:bg-black/10 dark:hover:bg-white/10"
                            )}
                          >
                            Ayah {Ayah}
                          </button>
                        ))}
                      </Container>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Sort By section - dropdown */}
          <div className="space-y-1">
            <Container className="!p-0 !bg-transparent inline-block w-auto">
              <p className="text-xs font-medium text-muted-foreground px-1">Sort By</p>
            </Container>
            <div ref={Sort_Dropdown_Reference} className="relative">
              <Button
                onClick={() => Set_Show_Sort_Dropdown(!Show_Sort_Dropdown)}
                className="w-full justify-between"
                fullWidth
              >
                <span>{Get_Sort_Label()}</span>
                <ChevronDown
                  className={Class_Names("h-4 w-4 transition-transform", Show_Sort_Dropdown && "rotate-180")}
                />
              </Button>
              {Show_Sort_Dropdown && (
                <div className="absolute left-0 right-0 Top-full mt-1 z-[100]">
                  <Container className="!p-1">
                    {Sort_Options.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          Set_Surah_Sort_Order(option.id as Surah_Sort_Order);
                          Set_Show_Sort_Dropdown(false);
                        }}
                        className={Class_Names(
                          "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors",
                          "text-black dark:text-white",
                          Surah_Sort_Order_State === option.id
                            ? "bg-black dark:bg-white text-white dark:text-black"
                            : "hover:bg-black/10 dark:hover:bg-white/10"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </Container>
                </div>
              )}
            </div>
          </div>

          {/* Apply button */}
          {Has_Active_Filter && (
            <Button onClick={On_Apply} fullWidth className="mt-2">
              Apply
            </Button>
          )}
        </Container>
      </div>
    </>
  );
}