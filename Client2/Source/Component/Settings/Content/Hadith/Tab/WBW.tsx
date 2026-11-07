import { useState, useEffect } from "react";
import { Search, Download, ChevronDown, Loader2, Trash2, Check } from "lucide-react";
import { Card } from "@Web/Component/UI/Card";
import { Container } from "@Web/Component/UI/Container";
import { Button } from "@Web/Component/UI/Button";
import { Slider } from "@Web/Component/UI/Slider";
import { Input } from "@Web/Component/UI/Input";
import {
  Dropdown_Menu,
  Dropdown_Menu_Content,
  Dropdown_Menu_Item,
  Dropdown_Menu_Trigger,
} from "@Web/Component/UI/Dropdown-Menu";
import { Use_Is_Mobile } from "@/Hook/Use-Mobile";
import { Mobile_Navigator } from "../Utility";
import { Use_App } from "@Web/Context/App";

import {
  Fetch_Word_Translation_List,
  Fetch_Transliteration_List,
  Fetch_Hadith_Translation,
  Fetch_Collections,
  Get_Chapters,
  Get_Chapter,
  type Translation_List_Entry,
  type Transliteration_List_Entry,
} from "@/Library/Hadith-API";

import {
  Get_Saved_Kalimaat,
  Save_Kalimaat_Locally,
  Delete_Saved_Kalimaat,
} from "@/Library/Service-Worker-Cache-Store";

type Display_Mode = "hover" | "inline" | "both";
type WBW_Translation_Item = Translation_List_Entry;

const Build_Word_By_Word_Translation_Marker_Key = (Edition_ID: string) => `Hadith-WBW-Translation-Download::${Edition_ID}`;

const Is_WBW_Downloaded = async (Marker_Key: string): Promise<boolean> => {
  const Marker = await Get_Saved_Kalimaat<boolean>(Marker_Key);
  return Marker === true;
};

const Get_All_Hadith_Ids = async (): Promise<number[]> => {
  const Hadith_Collections_List = await Fetch_Collections();
  const All_Hadith_IDs: number[] = [];

  for (const collection of Hadith_Collections_List) {
    const chapters = await Get_Chapters(collection.ID);
    if (!chapters) continue;

    for (const chapter of chapters) {
      const Chapter_Data = await Get_Chapter(collection.ID, chapter.ID);
      if (Chapter_Data?.Narrations) {
        for (const Narration of Chapter_Data.Narrations) {
          All_Hadith_IDs.push(Narration.ID);
        }
      }
    }
  }

  return Array.from(new Set(All_Hadith_IDs));
};

const Download_Word_By_Word_Translation = async (Edition_ID: string): Promise<void> => {
  const hadithIds = await Get_All_Hadith_Ids();

  if (hadithIds.length > 0) {
    await Fetch_Hadith_Translation(
      hadithIds,
      Edition_ID,
      /* Need_Verse */ false,
      /* Need_Word */ true
    );
  }

  await Save_Kalimaat_Locally(Build_Word_By_Word_Translation_Marker_Key(Edition_ID), true);
};

export function WBW_Section() {
  const Is_Mobile = Use_Is_Mobile();

  const {
    // Selected Edition_Name state for Kalimah-by-Kalimah
    Selected_Hadith_Hover_Translation_Edition,
    Set_Selected_Hadith_Hover_Translation_Edition,
    Selected_Hadith_Inline_Translation_Edition,
    Set_Selected_Hadith_Inline_Translation_Edition,

    Selected_Hadith_Hover_Transliteration_Edition,
    Set_Selected_Hadith_Hover_Transliteration_Edition,
    Selected_Hadith_Inline_Transliteration_Edition,
    Set_Selected_Hadith_Inline_Transliteration_Edition,

    // Size state
    Hadith_Inline_Translation_Font_Size,
    Set_Hadith_Inline_Translation_Font_Size,
    Hadith_Inline_Transliteration_Font_Size,
    Set_Hadith_Inline_Transliteration_Font_Size,
  } = Use_App();

  const [WBW_Translations, Set_WBW_Translations] = useState<WBW_Translation_Item[]>([]);
  const [Available_Transliterations, Set_Available_Transliterations] = useState<
    { id: string; label: string }[]
  >([{ id: "None", label: "None" }]);
  const [Is_Loading_List, Set_Is_Loading_List] = useState<boolean>(true);

  const [Search_Query, Set_Search_Query] = useState("");
  const [Downloaded_IDs, Set_Downloaded_IDs] = useState<string[]>([]);
  const [Downloading_IDs, Set_Downloading_IDs] = useState<string[]>([]);

  const [Show_Hover_Transliteration_List, Set_Show_Hover_Transliteration_List] = useState(false);
  const [Show_Inline_Transliteration_List, Set_Show_Inline_Transliteration_List] = useState(false);

  const Active_IDs = Array.from(
    new Set(
      [Selected_Hadith_Hover_Translation_Edition, Selected_Hadith_Inline_Translation_Edition].filter(
        (id): id is string => Boolean(id) && id !== "None"
      )
    )
  );

  const Get_Display_Mode = (id: string): Display_Mode => {
    const isHover = Selected_Hadith_Hover_Translation_Edition === id;
    const isInline = Selected_Hadith_Inline_Translation_Edition === id;

    if (isHover && isInline) return "both";
    if (isHover) return "hover";
    if (isInline) return "inline";
    return "both";
  };

  const Has_Inline_Translation =
    Selected_Hadith_Inline_Translation_Edition &&
    Selected_Hadith_Inline_Translation_Edition !== "None";

  const Has_Inline_Transliteration =
    Selected_Hadith_Inline_Transliteration_Edition &&
    Selected_Hadith_Inline_Transliteration_Edition !== "None";

  const Handle_Set_Mode = (id: string, Mode: Display_Mode) => {
    if (Mode === "hover") {
      Set_Selected_Hadith_Hover_Translation_Edition(id);
      if (Selected_Hadith_Inline_Translation_Edition === id) {
        Set_Selected_Hadith_Inline_Translation_Edition("None");
      }
    } else if (Mode === "inline") {
      Set_Selected_Hadith_Inline_Translation_Edition(id);
      if (Selected_Hadith_Hover_Translation_Edition === id) {
        Set_Selected_Hadith_Hover_Translation_Edition("None");
      }
    } else if (Mode === "both") {
      Set_Selected_Hadith_Hover_Translation_Edition(id);
      Set_Selected_Hadith_Inline_Translation_Edition(id);
    }
  };

  const Toggle_Active = (id: string) => {
    if (Active_IDs.includes(id)) {
      if (Selected_Hadith_Hover_Translation_Edition === id)
        Set_Selected_Hadith_Hover_Translation_Edition("None");
      if (Selected_Hadith_Inline_Translation_Edition === id)
        Set_Selected_Hadith_Inline_Translation_Edition("None");
    } else {
      Set_Selected_Hadith_Hover_Translation_Edition(id);
      Set_Selected_Hadith_Inline_Translation_Edition(id);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function Load_Options() {
      Set_Is_Loading_List(true);
      try {
        const [Translations, Transliterations] = await Promise.all([
          Fetch_Word_Translation_List(),
          // Uses the exact same Transliteration list API as Transliteration_Section
          Fetch_Transliteration_List(),
        ]);

        if (isMounted) {
          if (Translations && Array.isArray(Translations) && Translations.length > 0) {
            Set_WBW_Translations(Translations);
          }

          if (Transliterations && Array.isArray(Transliterations) && Transliterations.length > 0) {
            const Mapped_Transliterations = Transliterations.map(
              (n: Transliteration_List_Entry) => ({
                id: n.ID,
                label: n.Name ? `${n.Language} - ${n.Name}` : n.Language,
              })
            );

            Set_Available_Transliterations([
              { id: "None", label: "None" },
              ...Mapped_Transliterations,
            ]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch Hadith WBW metadata:", err);
      } finally {
        if (isMounted) Set_Is_Loading_List(false);
      }
    }

    Load_Options();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let Cancelled = false;

    async function Check_Existing_Downloads() {
      if (WBW_Translations.length === 0) return;

      const Checks = await Promise.all(
        WBW_Translations.map(async (item) => {
          const Downloaded = await Is_WBW_Downloaded(
            Build_Word_By_Word_Translation_Marker_Key(item.ID)
          );
          return Downloaded ? item.ID : null;
        })
      );

      if (!Cancelled) {
        Set_Downloaded_IDs((prev) =>
          Array.from(
            new Set([...prev, ...Checks.filter((id): id is string => id !== null)])
          )
        );
      }
    }

    Check_Existing_Downloads();
    return () => {
      Cancelled = true;
    };
  }, [WBW_Translations]);

  const Handle_Download = async (id: string) => {
    Set_Downloading_IDs((prev) => [...prev, id]);

    try {
      await Download_Word_By_Word_Translation(id);
      Set_Downloaded_IDs((prev) => [...prev, id]);
    } catch (err) {
      console.error(`Failed to download Hadith WBW Translation "${id}":`, err);
    } finally {
      Set_Downloading_IDs((prev) => prev.filter((item) => item !== id));
    }
  };

  const Handle_Delete_Download = async (id: string) => {
    try {
      await Delete_Saved_Kalimaat(Build_Word_By_Word_Translation_Marker_Key(id));
      Set_Downloaded_IDs((prev) => prev.filter((item) => item !== id));
    } catch (err) {
      console.error(`Failed to delete Hadith WBW Translation "${id}":`, err);
    }
  };

  const Filtered_Items = WBW_Translations.filter(
    (item) =>
      item.Name.toLowerCase().includes(Search_Query.toLowerCase()) ||
      item.Language.toLowerCase().includes(Search_Query.toLowerCase())
  );

  const Active_List = Filtered_Items.filter((item) => Active_IDs.includes(item.ID));
  const Inactive_List = Filtered_Items.filter((item) => !Active_IDs.includes(item.ID));

  const Render_Dropdown = (
    items: { id: string; label: string }[],
    Current_Value: string,
    Current_Label: string,
    On_Change: (value: string) => void,
    label: string
  ) => (
    <Dropdown_Menu>
      <Dropdown_Menu_Trigger asChild>
        <Button
          variant="secondary"
          className="w-full flex items-center justify-between px-4 py-2 h-auto group bg-card hover:bg-muted"
          fullWidth
        >
          <span className="text-sm font-medium">{label}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{Current_Label}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </Button>
      </Dropdown_Menu_Trigger>
      <Dropdown_Menu_Content align="end" className="w-56 bg-card">
        {items.map((item) => (
          <Dropdown_Menu_Item
            key={item.id}
            onClick={() => On_Change(item.id)}
            className="flex items-center justify-between cursor-pointer hover:bg-muted"
          >
            <span>{item.label}</span>
            {String(Current_Value) === String(item.id) && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </Dropdown_Menu_Item>
        ))}
      </Dropdown_Menu_Content>
    </Dropdown_Menu>
  );

  const Render_Mobile_Button = (onClick: () => void, Current_Label: string, label: string) => (
    <Button
      onClick={onClick}
      variant="secondary"
      className="w-full flex items-center justify-between px-4 py-2 h-auto group bg-card hover:bg-muted"
      fullWidth
    >
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">{Current_Label}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </div>
    </Button>
  );

  // Loose ID comparisons prevent mismatching values when fetching entries
  const Current_Hover_Transliteration_Label =
    Available_Transliterations.find(
      (t) => String(t.id).toLowerCase() === String(Selected_Hadith_Hover_Transliteration_Edition).toLowerCase()
    )?.label || (Selected_Hadith_Hover_Transliteration_Edition || "None");

  const Current_Inline_Transliteration_Label =
    Available_Transliterations.find(
      (t) => String(t.id).toLowerCase() === String(Selected_Hadith_Inline_Transliteration_Edition).toLowerCase()
    )?.label || (Selected_Hadith_Inline_Transliteration_Edition || "None");

  if (Is_Mobile && Show_Hover_Transliteration_List) {
    return (
      <Mobile_Navigator
        Is_Open={Show_Hover_Transliteration_List}
        On_Close={() => Set_Show_Hover_Transliteration_List(false)}
        title="Select Hover Transliteration"
        options={Available_Transliterations}
        Selected_ID={Selected_Hadith_Hover_Transliteration_Edition}
        onSelect={(id) => Set_Selected_Hadith_Hover_Transliteration_Edition(id)}
      />
    );
  }

  if (Is_Mobile && Show_Inline_Transliteration_List) {
    return (
      <Mobile_Navigator
        Is_Open={Show_Inline_Transliteration_List}
        On_Close={() => Set_Show_Inline_Transliteration_List(false)}
        title="Select Inline Transliteration"
        options={Available_Transliterations}
        Selected_ID={Selected_Hadith_Inline_Transliteration_Edition}
        onSelect={(id) => Set_Selected_Hadith_Inline_Transliteration_Edition(id)}
      />
    );
  }

  const Has_Active = Active_List.length > 0;

  return (
    <div className="space-y-6">
      {/* WBW Translation Section */}
      <div className="space-y-4">
        <div className="relative rounded-[40px] bg-card border-2 border-black dark:border-white transition-all Duration-200 py-1 px-3 inline-flex">
          <p className="text-xs font-medium text-foreground">WBW Translation</p>
        </div>

        {Has_Inline_Translation && (
          <Card className="py-2.5 px-4 bg-card">
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold text-sm whitespace-nowrap">
                Inline Translation Size: {Hadith_Inline_Translation_Font_Size || 5}
              </span>
              <Slider
                value={[Hadith_Inline_Translation_Font_Size || 5]}
                onValueChange={(value) => Set_Hadith_Inline_Translation_Font_Size(value[0])}
                min={1}
                max={10}
                Step={1}
                className="flex-1"
              />
            </div>
          </Card>
        )}

        <div className="relative">
          <Search className="absolute left-4 Top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Languages or WBW translators..."
            value={Search_Query}
            On_Change={(e) => Set_Search_Query(e.target.value)}
            className="pl-10 bg-card border-2 border-black dark:border-white rounded-full focus:border-primary transition-colors"
          />
        </div>

        {Has_Active && (
          <Container className="p-4 space-y-3 bg-card">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Active
            </h3>

            <div className="space-y-2">
              {Active_List.map((item) => {
                const Is_Downloaded = Downloaded_IDs.includes(item.ID);
                const Is_Downloading = Downloading_IDs.includes(item.ID);
                const Current_Mode = Get_Display_Mode(item.ID);

                return (
                  <div
                    key={item.ID}
                    onClick={() => Toggle_Active(item.ID)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 rounded-[20px] sm:rounded-full border-2 border-primary bg-card hover:bg-muted cursor-pointer transition-all"
                  >
                    <span className="text-sm font-medium">{item.Language}</span>

                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center bg-muted p-1 rounded-full text-xs border border-border">
                        <button
                          type="button"
                          onClick={() => Handle_Set_Mode(item.ID, "hover")}
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${
                            Current_Mode === "hover"
                              ? "bg-card text-foreground font-semibold shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Hover
                        </button>
                        <button
                          type="button"
                          onClick={() => Handle_Set_Mode(item.ID, "inline")}
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${
                            Current_Mode === "inline"
                              ? "bg-card text-foreground font-semibold shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Inline
                        </button>
                        <button
                          type="button"
                          onClick={() => Handle_Set_Mode(item.ID, "both")}
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-all ${
                            Current_Mode === "both"
                              ? "bg-card text-foreground font-semibold shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          Both
                        </button>
                      </div>

                      {Is_Downloading ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled
                          className="rounded-full gap-1.5 px-3 py-1 text-xs bg-card hover:bg-muted"
                        >
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Downloading...</span>
                        </Button>
                      ) : Is_Downloaded ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-full gap-1.5 px-3 py-1 text-xs text-destructive bg-card hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            Handle_Delete_Download(item.ID);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full gap-1.5 px-3 py-1 text-xs bg-card hover:bg-muted"
                          onClick={(e) => {
                            e.stopPropagation();
                            Handle_Download(item.ID);
                          }}
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Container>
        )}

        <Container className="p-4 space-y-3 bg-card">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Inactive
          </h3>

          {Is_Loading_List ? (
            <div className="flex items-center justify-center py-4 text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading available Translations...</span>
            </div>
          ) : Inactive_List.length === 0 ? (
            <div className="text-sm text-muted-foreground italic text-center py-2">
              All available WBW Translations are Active.
            </div>
          ) : (
            <div className="space-y-2">
              {Inactive_List.map((item) => {
                const Is_Downloaded = Downloaded_IDs.includes(item.ID);
                const Is_Downloading = Downloading_IDs.includes(item.ID);

                return (
                  <div
                    key={item.ID}
                    onClick={() => Toggle_Active(item.ID)}
                    className="flex items-center justify-between px-4 py-2.5 rounded-full border border-border bg-card hover:bg-muted cursor-pointer transition-all"
                  >
                    <span className="text-sm font-medium">{item.Language}</span>

                    <div onClick={(e) => e.stopPropagation()}>
                      {Is_Downloading ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled
                          className="rounded-full gap-1.5 px-3 py-1 text-xs bg-card hover:bg-muted"
                        >
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Downloading...</span>
                        </Button>
                      ) : Is_Downloaded ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-full gap-1.5 px-3 py-1 text-xs text-destructive bg-card hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            Handle_Delete_Download(item.ID);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full gap-1.5 px-3 py-1 text-xs bg-card hover:bg-muted"
                          onClick={(e) => {
                            e.stopPropagation();
                            Handle_Download(item.ID);
                          }}
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Container>
      </div>

      {/* WBW Transliteration Section */}
      <div className="space-y-4">
        <div className="relative rounded-[40px] bg-card border-2 border-black dark:border-white transition-all Duration-200 py-1 px-3 inline-flex">
          <p className="text-xs font-medium text-foreground">WBW Transliteration</p>
        </div>

        <Container className="p-4 space-y-3 bg-card">
          {/* Hover Transliteration Selection */}
          {Is_Mobile
            ? Render_Mobile_Button(
                () => Set_Show_Hover_Transliteration_List(true),
                Current_Hover_Transliteration_Label,
                "Hover Transliteration"
              )
            : Render_Dropdown(
                Available_Transliterations,
                Selected_Hadith_Hover_Transliteration_Edition,
                Current_Hover_Transliteration_Label,
                Set_Selected_Hadith_Hover_Transliteration_Edition,
                "Hover Transliteration"
              )}

          {/* Inline Transliteration Selection */}
          {Is_Mobile
            ? Render_Mobile_Button(
                () => Set_Show_Inline_Transliteration_List(true),
                Current_Inline_Transliteration_Label,
                "Inline Transliteration"
              )
            : Render_Dropdown(
                Available_Transliterations,
                Selected_Hadith_Inline_Transliteration_Edition,
                Current_Inline_Transliteration_Label,
                Set_Selected_Hadith_Inline_Transliteration_Edition,
                "Inline Transliteration"
              )}

          {Has_Inline_Transliteration && (
            <Card className="py-2.5 px-4 bg-card mt-2">
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-sm whitespace-nowrap">
                  Inline Transliteration Size: {Hadith_Inline_Transliteration_Font_Size || 5}
                </span>
                <Slider
                  value={[Hadith_Inline_Transliteration_Font_Size || 5]}
                  onValueChange={(value) => Set_Hadith_Inline_Transliteration_Font_Size(value[0])}
                  min={1}
                  max={10}
                  Step={1}
                  className="flex-1"
                />
              </div>
            </Card>
          )}
        </Container>
      </div>
    </div>
  );
}