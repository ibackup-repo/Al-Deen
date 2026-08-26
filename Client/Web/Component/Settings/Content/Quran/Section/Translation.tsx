// Component/Settings/Content/Quran/Section/Translation.tsx
import { useState, useEffect } from "react";
import { Search, Download, ChevronDown, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { Card } from "@Web/Component/UI/Card";
import { Container } from "@Web/Component/UI/Container";
import { Button } from "@Web/Component/UI/Button";
import { Slider } from "@Web/Component/UI/Slider";
import { Input } from "@Web/Component/UI/Input";
import { Use_Is_Mobile } from "@/Hook/Use-Mobile";
import { Mobile_Navigator } from "../Utility";
import { Use_App } from "@Web/Context/App";

import {
  Fetch_Translation_List,
  Fetch_Surah_Translation,
  type Translation_List_Entry,
} from "@Web/../Source/Library/Quran-API";

import {
  Get_Saved_Kalimaat,
  Save_Kalimaat_Locally,
  Delete_Saved_Kalimaat,
} from "@Web/../Source/Library/Service-Worker-Cache-Store";

const Total_Surah_Count = 114;

const Build_Download_Marker_Key = (Edition_ID: string) => `Translation-Download::${Edition_ID}`;

const Is_Translation_Downloaded = async (Edition_ID: string): Promise<boolean> => {
  const Marker = await Get_Saved_Kalimaat<boolean>(Build_Download_Marker_Key(Edition_ID));
  return Marker === true;
};

const Download_Translation = async (Edition_ID: string): Promise<void> => {
  const Surah_Numbers = Array.from({ length: Total_Surah_Count }, (_, Idx) => Idx + 1);

  const Results = await Promise.allSettled(
    Surah_Numbers.map((Surah_Number) =>
      Fetch_Surah_Translation(Surah_Number, Edition_ID, /* Need_Ayah */ true, /* Need_Word */ false)
    )
  );

  const Failed = Results.filter((R) => R.status === "rejected");
  if (Failed.length > 0) {
    throw new Error(`Failed to cache ${Failed.length}/${Total_Surah_Count} Surahs for "${Edition_ID}".`);
  }

  await Save_Kalimaat_Locally(Build_Download_Marker_Key(Edition_ID), true);
};

const Remove_Translation_Download = (Edition_ID: string): Promise<void> =>
  Delete_Saved_Kalimaat(Build_Download_Marker_Key(Edition_ID));

export function Translation() {
  const Is_Mobile = Use_Is_Mobile();
  const [Is_Loading_Corpus_Data, Set_Is_Loading] = useState(true);
  const [Show_Translator_List, Set_Show_Translator_List] = useState(false);
  const [Search_Query, Set_Search_Query] = useState("");

  const [Downloaded_IDs, Set_Downloaded_IDs] = useState<string[]>([]);
  const [Downloading_IDs, Set_Downloading_IDs] = useState<string[]>([]);

  const [Expanded_Active_Langs, Set_Expanded_Active_Langs] = useState<string[]>([]);
  const [Expanded_Inactive_Langs, Set_Expanded_Inactive_Langs] = useState<string[]>([]);

  const {
    Translation_Font_Size,
    Set_Translation_Font_Size,
    Available_Translations,
    Set_Available_Translations,
    Active_Translation_IDs,
    Toggle_Translation,
  } = Use_App();

  useEffect(() => {
    async function Load_Translations() {
      try {
        const List = await Fetch_Translation_List();
        Set_Available_Translations(List);

        if (List.length > 0) {
          Set_Expanded_Inactive_Langs([List[0].Language]);
        }
      } catch (Err) {
        console.error("error fetching Translation list:", Err);
      } finally {
        Set_Is_Loading(false);
      }
    }

    if (Available_Translations.length === 0) {
      Load_Translations();
    } else {
      Set_Is_Loading(false);
    }
  }, [Available_Translations.length, Set_Available_Translations]);

  useEffect(() => {
    let Cancelled = false;

    async function Check_Existing_Downloads() {
      if (Available_Translations.length === 0) return;

      const Checks = await Promise.all(
        Available_Translations.map(async (Item) => {
          const Downloaded = await Is_Translation_Downloaded(Item.ID);
          return Downloaded ? Item.ID : null;
        })
      );

      if (!Cancelled) {
        Set_Downloaded_IDs(Checks.filter((ID): ID is string => ID !== null));
      }
    }

    Check_Existing_Downloads();
    return () => {
      Cancelled = true;
    };
  }, [Available_Translations]);

  const Toggle_Active_Lang = (Language: string) => {
    Set_Expanded_Active_Langs((Prev) =>
      Prev.includes(Language) ? Prev.filter((L) => L !== Language) : [...Prev, Language]
    );
  };

  const Toggle_Inactive_Lang = (Language: string) => {
    Set_Expanded_Inactive_Langs((Prev) =>
      Prev.includes(Language) ? Prev.filter((L) => L !== Language) : [...Prev, Language]
    );
  };

  const Handle_Download = async (Item: Translation_List_Entry) => {
    Set_Downloading_IDs((Prev) => [...Prev, Item.ID]);

    try {
      await Download_Translation(Item.ID);
      Set_Downloaded_IDs((Prev) => [...Prev, Item.ID]);
    } catch (Err) {
      console.error(`Failed to download Translation "${Item.ID}":`, Err);
    } finally {
      Set_Downloading_IDs((Prev) => Prev.filter((I) => I !== Item.ID));
    }
  };

  const Handle_Delete_Download = async (ID: string) => {
    try {
      await Remove_Translation_Download(ID);
      Set_Downloaded_IDs((Prev) => Prev.filter((Item) => Item !== ID));
    } catch (Err) {
      console.error(`Failed to delete Translation "${ID}":`, Err);
    }
  };

  const Filtered_Items = Available_Translations.filter(
    (Item) =>
      Item.Name.toLowerCase().includes(Search_Query.toLowerCase()) ||
      Item.Language.toLowerCase().includes(Search_Query.toLowerCase())
  );

  const Active_List = Filtered_Items.filter((Item) =>
    Active_Translation_IDs.includes(Item.ID)
  );
  const Inactive_List = Filtered_Items.filter(
    (Item) => !Active_Translation_IDs.includes(Item.ID)
  );

  const Active_By_Language = Active_List.reduce<Record<string, Translation_List_Entry[]>>(
    (Acc, Item) => {
      Acc[Item.Language] = Acc[Item.Language] || [];
      Acc[Item.Language].push(Item);
      return Acc;
    },
    {}
  );

  const Inactive_By_Language = Inactive_List.reduce<Record<string, Translation_List_Entry[]>>(
    (Acc, Item) => {
      Acc[Item.Language] = Acc[Item.Language] || [];
      Acc[Item.Language].push(Item);
      return Acc;
    },
    {}
  );

  if (Is_Loading_Corpus_Data) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading Translations...</span>
      </div>
    );
  }

  if (Is_Mobile && Show_Translator_List) {
    return (
      <Mobile_Navigator
        Is_Open={Show_Translator_List}
        On_Close={() => Set_Show_Translator_List(false)}
        title="Select Translators"
        options={Available_Translations.map((T) => ({
          id: T.ID,
          label: `${T.Language} - ${T.Name}`,
        }))}
        Selected_ID={Active_Translation_IDs[0]}
        onSelect={Toggle_Translation}
      />
    );
  }

  const Has_Active = Active_List.length > 0;

  return (
    <div className="space-y-4">
      {/* Text Size Slider */}
      <Card className="py-2.5 px-4 bg-card">
        <div className="flex items-center justify-between gap-4">
          <span className="font-semibold text-sm whitespace-nowrap">
            Text Size: {Translation_Font_Size}
          </span>
          <Slider
            value={[Translation_Font_Size]}
            onValueChange={(Value) => Set_Translation_Font_Size(Value[0])}
            min={1}
            max={10}
            Step={1}
            className="flex-1"
          />
        </div>
      </Card>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 Top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search Languages or translators..."
          value={Search_Query}
          On_Change={(E) => Set_Search_Query(E.target.value)}
          className="pl-10 bg-card border-2 border-black dark:border-white rounded-full focus:border-primary transition-colors"
        />
      </div>

      {/* Active Container */}
      {Has_Active && (
        <Container className="p-4 space-y-3 bg-card">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Active
          </h3>

          <div className="space-y-3">
            {Object.entries(Active_By_Language).map(([Language, Items]) => {
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
                        {Items.length}
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
                        {Items.map((Item) => {
                          const Is_Downloaded = Downloaded_IDs.includes(Item.ID);
                          const Is_Downloading = Downloading_IDs.includes(Item.ID);

                          return (
                            <div
                              key={Item.ID}
                              onClick={() => Toggle_Translation(Item.ID)}
                              className="flex items-center justify-between px-4 py-2.5 rounded-full border-2 border-primary bg-card hover:bg-muted cursor-pointer transition-all"
                            >
                              <span className="text-sm font-medium">{Item.Name}</span>

                              <div onClick={(E) => E.stopPropagation()}>
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
                                    onClick={() => Handle_Delete_Download(Item.ID)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Delete</span>
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-full gap-1.5 px-3 py-1 text-xs bg-card hover:bg-muted"
                                    onClick={() => Handle_Download(Item)}
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

      {/* Inactive Container */}
      <Container className="p-4 space-y-3 bg-card">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Inactive
        </h3>

        {Object.keys(Inactive_By_Language).length === 0 ? (
          <div className="text-sm text-muted-foreground italic text-center py-2">
            All available Translations are Active.
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(Inactive_By_Language).map(([Language, Items]) => {
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
                        {Items.length}
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
                        {Items.map((Item) => {
                          const Is_Downloaded = Downloaded_IDs.includes(Item.ID);
                          const Is_Downloading = Downloading_IDs.includes(Item.ID);

                          return (
                            <div
                              key={Item.ID}
                              onClick={() => Toggle_Translation(Item.ID)}
                              className="flex items-center justify-between px-4 py-2 rounded-full border border-border bg-card hover:bg-muted cursor-pointer transition-all"
                            >
                              <span className="text-sm font-medium">{Item.Name}</span>

                              <div onClick={(E) => E.stopPropagation()}>
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
                                    onClick={() => Handle_Delete_Download(Item.ID)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Delete</span>
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-full gap-1.5 px-3 py-1 text-xs bg-card hover:bg-muted"
                                    onClick={() => Handle_Download(Item)}
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
  );
}