// Component/Settings/Content/Quran/Section/Kalimah-Bi-Kalimah.tsx
import { useState, useEffect } from "react";
import { Search, Download, ChevronDown, ChevronRight, Loader2, Trash2, Check } from "lucide-react";
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
  Fetch_Word_Transliteration_List,
  Fetch_Surah_Translation,
  Fetch_Surah_Transliteration,
  type Translation_List_Entry,
  type Transliteration_List_Entry,
} from "@Web/../Source/Library/Quran-API";

import {
  Get_Saved_Kalimaat,
  Save_Kalimaat_Locally,
  Delete_Saved_Kalimaat,
} from "@Web/../Source/Library/Service-Worker-Cache-Store";

type Display_Mode = "hover" | "inline" | "both";
type WBW_Translation_Item = Translation_List_Entry;

const TOTAL_SURAH_COUNT = 114;

const Build_Word_By_Word_Translation_Marker_Key = (Edition_ID: string) => `WBW-Translation-Download::${Edition_ID}`;
const Build_Word_By_Word_Transliteration_Marker_Key = (Edition_ID: string) => `WBW-Transliteration-Download::${Edition_ID}`;

const Is_WBW_Downloaded = async (Marker_Key: string): Promise<boolean> => {
  const Marker = await Get_Saved_Kalimaat<boolean>(Marker_Key);
  return Marker === true;
};

const Download_Word_By_Word_Translation = async (Edition_ID: string): Promise<void> => {
  const Surah_Numbers = Array.from({ length: TOTAL_SURAH_COUNT }, (_, Idx) => Idx + 1);

  const Results = await Promise.allSettled(
    Surah_Numbers.map((Surah_Number) =>
      Fetch_Surah_Translation(Surah_Number, Edition_ID, false, true)
    )
  );

  const Failed = Results.filter((R) => R.status === "rejected");
  if (Failed.length > 0) {
    throw new Error(`Failed to cache ${Failed.length}/${TOTAL_SURAH_COUNT} Surahs for "${Edition_ID}".`);
  }

  await Save_Kalimaat_Locally(Build_Word_By_Word_Translation_Marker_Key(Edition_ID), true);
};

const Download_Word_By_Word_Transliteration = async (Edition_ID: string): Promise<void> => {
  const Surah_Numbers = Array.from({ length: TOTAL_SURAH_COUNT }, (_, Idx) => Idx + 1);

  const Results = await Promise.allSettled(
    Surah_Numbers.map((Surah_Number) =>
      Fetch_Surah_Transliteration(Surah_Number, Edition_ID, false, true)
    )
  );

  const Failed = Results.filter((R) => R.status === "rejected");
  if (Failed.length > 0) {
    throw new Error(`Failed to cache ${Failed.length}/${TOTAL_SURAH_COUNT} Surahs for "${Edition_ID}".`);
  }

  await Save_Kalimaat_Locally(Build_Word_By_Word_Transliteration_Marker_Key(Edition_ID), true);
};

export function WBW() {
  const Is_Mobile = Use_Is_Mobile();

  const {
    Hover_Transliteration,
    Set_Hover_Transliteration,
    Inline_Transliteration,
    Set_Inline_Transliteration,
    Inline_Transliteration_Size,
    Set_Inline_Transliteration_Size,

    Hover_Translation,
    Set_Hover_Translation,
    Inline_Translation,
    Set_Inline_Translation,
    Inline_Translation_Size,
    Set_Inline_Translation_Size,
  } = Use_App();

  const [WBW_Translations, Set_WBW_Translations] = useState<WBW_Translation_Item[]>([]);
  const [Available_Transliterations, Set_Available_Transliterations] = useState<
  { id: string; label: string }[]
>([{ id: "None", label: "None" }]);
  const [Is_Loading_List, Set_Is_Loading_List] = useState<boolean>(true);

  const [Search_Query, Set_Search_Query] = useState("");
  const [Downloaded_IDs, Set_Downloaded_IDs] = useState<string[]>([]);
  const [Downloading_IDs, Set_Downloading_IDs] = useState<string[]>([]);

  const [Expanded_Active_Langs, Set_Expanded_Active_Langs] = useState<string[]>(["English"]);
  const [Expanded_Inactive_Langs, Set_Expanded_Inactive_Langs] = useState<string[]>(["English"]);

  const [Show_Hover_Transliteration_List, Set_Show_Hover_Transliteration_List] = useState(false);
  const [Show_Inline_Transliteration_List, Set_Show_Inline_Transliteration_List] = useState(false);

  const Active_IDs = Array.from(
    new Set(
      [Hover_Translation, Inline_Translation].filter(
        (id): id is string => Boolean(id) && id !== "None"
      )
    )
  );

  const Get_Display_Mode = (id: string): Display_Mode => {
    const isHover = Hover_Translation === id;
    const isInline = Inline_Translation === id;

    if (isHover && isInline) return "both";
    if (isHover) return "hover";
    if (isInline) return "inline";
    return "both";
  };

  const Has_Inline_Translation = Inline_Translation && Inline_Translation !== "None";

  const Handle_Set_Mode = (id: string, Mode: Display_Mode) => {
    if (Mode === "hover") {
      Set_Hover_Translation(id);
      if (Inline_Translation === id) {
        Set_Inline_Translation("None");
      }
    } else if (Mode === "inline") {
      Set_Inline_Translation(id);
      if (Hover_Translation === id) {
        Set_Hover_Translation("None");
      }
    } else if (Mode === "both") {
      Set_Hover_Translation(id);
      Set_Inline_Translation(id);
    }
  };

  const Toggle_Active = (id: string) => {
    if (Active_IDs.includes(id)) {
      if (Hover_Translation === id) Set_Hover_Translation("None");
      if (Inline_Translation === id) Set_Inline_Translation("None");
    } else {
      Set_Hover_Translation(id);
      Set_Inline_Translation(id);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function Load_Options() {
      Set_Is_Loading_List(true);
      try {
        const [Translations, Transliterations] = await Promise.all([
          Fetch_Word_Translation_List(),
          Fetch_Word_Transliteration_List(),
        ]);

        if (isMounted) {
          if (Translations && Array.isArray(Translations) && Translations.length > 0) {
            Set_WBW_Translations(Translations);
          }

          if (Transliterations && Array.isArray(Transliterations) && Transliterations.length > 0) {
            const Mapped_Transliterations = Transliterations.map(
              (n: Transliteration_List_Entry) => ({
                id: n.ID,
                label: n.Name,
              })
            );

            Set_Available_Transliterations([
              { id: "None", label: "None" },
              ...Mapped_Transliterations,
            ]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch WBW metadata:", err);
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
          const Downloaded = await Is_WBW_Downloaded(Build_Word_By_Word_Translation_Marker_Key(item.ID));
          return Downloaded ? item.ID : null;
        })
      );

      if (!Cancelled) {
        Set_Downloaded_IDs((prev) => Array.from(new Set([...prev, ...Checks.filter((id): id is string => id !== null)])));
      }
    }

    Check_Existing_Downloads();
    return () => {
      Cancelled = true;
    };
  }, [WBW_Translations]);

  const Toggle_Active_Lang = (Language: string) => {
    Set_Expanded_Active_Langs((prev) =>
      prev.includes(Language) ? prev.filter((l) => l !== Language) : [...prev, Language]
    );
  };

  const Toggle_Inactive_Lang = (Language: string) => {
    Set_Expanded_Inactive_Langs((prev) =>
      prev.includes(Language) ? prev.filter((l) => l !== Language) : [...prev, Language]
    );
  };

  const Handle_Download = async (id: string) => {
    Set_Downloading_IDs((prev) => [...prev, id]);

    try {
      await Download_Word_By_Word_Translation(id);
      Set_Downloaded_IDs((prev) => [...prev, id]);
    } catch (err) {
      console.error(`Failed to download WBW Translation "${id}":`, err);
    } finally {
      Set_Downloading_IDs((prev) => prev.filter((item) => item !== id));
    }
  };

  const Handle_Delete_Download = async (id: string) => {
    try {
      await Delete_Saved_Kalimaat(Build_Word_By_Word_Translation_Marker_Key(id));
      Set_Downloaded_IDs((prev) => prev.filter((item) => item !== id));
    } catch (err) {
      console.error(`Failed to delete WBW Translation "${id}":`, err);
    }
  };

  const Filtered_Items = WBW_Translations.filter(
    (item) =>
      item.Name.toLowerCase().includes(Search_Query.toLowerCase()) ||
      item.Language.toLowerCase().includes(Search_Query.toLowerCase())
  );

  const Active_List = Filtered_Items.filter((item) => Active_IDs.includes(item.ID));
  const Inactive_List = Filtered_Items.filter((item) => !Active_IDs.includes(item.ID));

  const Active_By_Language = Active_List.reduce<Record<string, WBW_Translation_Item[]>>((acc, item) => {
    acc[item.Language] = acc[item.Language] || [];
    acc[item.Language].push(item);
    return acc;
  }, {});

  const Inactive_By_Language = Inactive_List.reduce<Record<string, WBW_Translation_Item[]>>((acc, item) => {
    acc[item.Language] = acc[item.Language] || [];
    acc[item.Language].push(item);
    return acc;
  }, {});

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
            {Current_Value === item.id && <Check className="h-4 w-4 text-primary" />}
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

  const Current_Hover_Transliteration_Label =
    Available_Transliterations.find((t) => t.id === Hover_Transliteration)?.label || "None";
  const Current_Inline_Transliteration_Label =
    Available_Transliterations.find((t) => t.id === Inline_Transliteration)?.label || "None";

  if (Is_Mobile && Show_Hover_Transliteration_List) {
    return (
      <Mobile_Navigator
        Is_Open={Show_Hover_Transliteration_List}
        On_Close={() => Set_Show_Hover_Transliteration_List(false)}
        title="Select Hover Transliteration"
        options={Available_Transliterations}
        Selected_ID={Hover_Transliteration}
        onSelect={(id) => Set_Hover_Transliteration(id)}
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
        Selected_ID={Inline_Transliteration}
        onSelect={(id) => Set_Inline_Transliteration(id)}
      />
    );
  }

  const Has_Active = Active_List.length > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="relative rounded-[40px] bg-card border-2 border-black dark:border-white transition-all Duration-200 py-1 px-3 inline-flex">
          <p className="text-xs font-medium text-foreground">WBW Translation</p>
        </div>

        {Has_Inline_Translation && (
          <Card className="py-2.5 px-4 bg-card">
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold text-sm whitespace-nowrap">
                Inline Translation Size: {Inline_Translation_Size || 5}
              </span>
              <Slider
                value={[Inline_Translation_Size || 5]}
                onValueChange={(value) => Set_Inline_Translation_Size(value[0])}
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

            <div className="space-y-3">
              {Object.entries(Active_By_Language).map(([Language, items]) => {
                const Is_Expanded = Expanded_Active_Langs.includes(Language);

                return (
                  <div
                    key={Language}
                    className={`border border-border bg-card transition-all Duration-150 overflow-hidden ${
                      Is_Expanded ? "rounded-2xl shadow-sm" : "rounded-full hover:bg-muted"
                    }`}
                  >
                    <button
                      onClick={() => Toggle_Active_Lang(Language)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{Language}</span>
                        <span className="flex items-center justify-center text-xs font-semibold h-5 min-w-[20px] px-1.5 rounded-full border border-border bg-card text-muted-foreground">
                          {items.length}
                        </span>
                      </div>
                      {Is_Expanded ? (
                        <ChevronDown className="h-4 w-4 transition-transform Duration-300" />
                      ) : (
                        <ChevronRight className="h-4 w-4 transition-transform Duration-300" />
                      )}
                    </button>

                    <div
                      className={`grid transition-[grid-template-rows] Duration-300 ease-in-out ${
                        Is_Expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-3 pb-3 pt-1 space-y-2">
                          {items.map((item) => {
                            const Is_Downloaded = Downloaded_IDs.includes(item.ID);
                            const Is_Downloading = Downloading_IDs.includes(item.ID);
                            const Current_Mode = Get_Display_Mode(item.ID);

                            return (
                              <div
                                key={item.ID}
                                onClick={() => Toggle_Active(item.ID)}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 rounded-[20px] sm:rounded-full border-2 border-primary bg-card hover:bg-muted cursor-pointer transition-all"
                              >
                                <span className="text-sm font-medium">{item.Name}</span>

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
                                      onClick={() => Handle_Delete_Download(item.ID)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      <span>Delete</span>
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="rounded-full gap-1.5 px-3 py-1 text-xs bg-card hover:bg-muted"
                                      onClick={() => Handle_Download(item.ID)}
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
                      </div>
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
          ) : Object.keys(Inactive_By_Language).length === 0 ? (
            <div className="text-sm text-muted-foreground italic text-center py-2">
              All available WBW Translations are Active.
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(Inactive_By_Language).map(([Language, items]) => {
                const Is_Expanded = Expanded_Inactive_Langs.includes(Language);

                return (
                  <div
                    key={Language}
                    className={`border border-border bg-card transition-all Duration-150 overflow-hidden ${
                      Is_Expanded ? "rounded-2xl shadow-sm" : "rounded-full hover:bg-muted"
                    }`}
                  >
                    <button
                      onClick={() => Toggle_Inactive_Lang(Language)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{Language}</span>
                        <span className="flex items-center justify-center text-xs font-semibold h-5 min-w-[20px] px-1.5 rounded-full border border-border bg-card text-muted-foreground">
                          {items.length}
                        </span>
                      </div>
                      {Is_Expanded ? (
                        <ChevronDown className="h-4 w-4 transition-transform Duration-300" />
                      ) : (
                        <ChevronRight className="h-4 w-4 transition-transform Duration-300" />
                      )}
                    </button>

                    <div
                      className={`grid transition-[grid-template-rows] Duration-300 ease-in-out ${
                        Is_Expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-3 pb-3 pt-1 space-y-2">
                          {items.map((item) => {
                            const Is_Downloaded = Downloaded_IDs.includes(item.ID);
                            const Is_Downloading = Downloading_IDs.includes(item.ID);

                            return (
                              <div
                                key={item.ID}
                                onClick={() => Toggle_Active(item.ID)}
                                className="flex items-center justify-between px-4 py-2 rounded-full border border-border bg-card hover:bg-muted cursor-pointer transition-all"
                              >
                                <span className="text-sm font-medium">{item.Name}</span>

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
                                      onClick={() => Handle_Delete_Download(item.ID)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      <span>Delete</span>
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="rounded-full gap-1.5 px-3 py-1 text-xs bg-card hover:bg-muted"
                                      onClick={() => Handle_Download(item.ID)}
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
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Container>
      </div>

      <div className="space-y-3">
        <div className="relative rounded-[40px] bg-card border-2 border-black dark:border-white transition-all Duration-200 py-1 px-3 inline-flex">
          <p className="text-xs font-medium text-foreground">WBW Transliteration</p>
        </div>

        {Is_Mobile
          ? Render_Mobile_Button(
              () => Set_Show_Hover_Transliteration_List(true),
              Current_Hover_Transliteration_Label,
              "Hover Transliteration"
            )
          : Render_Dropdown(
              Available_Transliterations,
              Hover_Transliteration,
              Current_Hover_Transliteration_Label,
              (id) => Set_Hover_Transliteration(id),
              "Hover Transliteration"
            )}

        {Is_Mobile
          ? Render_Mobile_Button(
              () => Set_Show_Inline_Transliteration_List(true),
              Current_Inline_Transliteration_Label,
              "Inline Transliteration"
            )
          : Render_Dropdown(
              Available_Transliterations,
              Inline_Transliteration,
              Current_Inline_Transliteration_Label,
              (id) => Set_Inline_Transliteration(id),
              "Inline Transliteration"
            )}

        {Inline_Transliteration !== "None" && (
          <Card className="py-2.5 px-4 bg-card">
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold text-sm whitespace-nowrap">
                Transliteration Size: {Inline_Transliteration_Size || 5}
              </span>
              <Slider
                value={[Inline_Transliteration_Size || 5]}
                onValueChange={(val) => Set_Inline_Transliteration_Size(val[0])}
                min={1}
                max={10}
                Step={1}
                className="flex-1"
              />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}