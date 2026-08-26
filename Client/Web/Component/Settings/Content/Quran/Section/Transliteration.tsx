// Component/Settings/Content/Quran/Section/Transliteration.tsx
import { useState, useEffect } from "react";
import { Search, Download, ChevronDown, ChevronRight, Loader2, Trash2, Check } from "lucide-react";
import { Card } from "@Web/Component/UI/Card";
import { Container } from "@Web/Component/UI/Container";
import { Button } from "@Web/Component/UI/Button";
import { Slider } from "@Web/Component/UI/Slider";
import { Input } from "@Web/Component/UI/Input";
import { Use_Is_Mobile } from "@/Hook/Use-Mobile";
import { Mobile_Navigator } from "../Utility";
import { Use_App } from "@Web/Context/App";

// FIX: the previous import used camelCase names (`fetchTransliterationList`,
// `TransliterationListEntry`) that don't exist in Quran-API.ts. The real
// exports are `Fetch_Transliteration_List` and `Transliteration_List_Entry`,
// and the entry shape is capitalized: { ID, Name, Language }.
import {
  Fetch_Transliteration_List,
  Fetch_Surah_Transliteration,
  type Transliteration_List_Entry,
} from "@Web/../Source/Library/Quran-API";

// FIX: Offline-DB.ts (buildTransliterationPath / isAvailableOffline /
// downloadForOfflineUse) isn't a real module — there's no standalone
// offline-file abstraction. Service-Worker-Cache-Store.ts is what actually
// persists data, and it only exposes namespaced get/save/delete helpers
// (Suwar-Metadata, Surah, Ayaat, Kalimaat), keyed via Build_Surah_Key.
//
// "Downloading" a transliterator Now means: fetch that Edition_Name's Ayah
// text for every Surah (which Fetch_Surah_Transliteration already caches
// into the "Ayaat" namespace via Save_Ayaat_Locally internally), then
// record a completion marker under the "Kalimaat" namespace since that's
// the only generic write-a-value-under-a-key primitive that's exported.
//
// NOTE: there is no Delete_Saved_Ayaat export, so deleting a download can
// only remove the completion marker below — it can't purge the underlying
// per-Surah Ayah cache entries. That's a real gap in Service-Worker-Cache-Store,
// not an oversight here.
import {
  Get_Saved_Kalimaat,
  Save_Kalimaat_Locally,
  Delete_Saved_Kalimaat,
} from "@Web/../Source/Library/Service-Worker-Cache-Store";

const NONE_ID = "None";
const TOTAL_SURAH_COUNT = 114;

const Build_Download_Marker_Key = (Edition_ID: string) => `Transliteration-Download::${Edition_ID}`;

const Is_Transliterator_Downloaded = async (Edition_ID: string): Promise<boolean> => {
  const Marker = await Get_Saved_Kalimaat<boolean>(Build_Download_Marker_Key(Edition_ID));
  return Marker === true;
};

const Download_Transliterator = async (Edition_ID: string): Promise<void> => {
  const Surah_Numbers = Array.from({ length: TOTAL_SURAH_COUNT }, (_, Idx) => Idx + 1);

  const Results = await Promise.allSettled(
    Surah_Numbers.map((Surah_Number) =>
      Fetch_Surah_Transliteration(Surah_Number, Edition_ID, /* Need_Ayah */ true, /* Need_Word */ false)
    )
  );

  const Failed = Results.filter((R) => R.status === "rejected");
  if (Failed.length > 0) {
    throw new Error(`Failed to cache ${Failed.length}/${TOTAL_SURAH_COUNT} Surahs for "${Edition_ID}".`);
  }

  await Save_Kalimaat_Locally(Build_Download_Marker_Key(Edition_ID), true);
};

const Remove_Transliterator_Download = (Edition_ID: string): Promise<void> =>
  Delete_Saved_Kalimaat(Build_Download_Marker_Key(Edition_ID));

export function Transliteration() {
  const Is_Mobile = Use_Is_Mobile();
  const [Is_Loading_Corpus_Data, Set_Is_Loading] = useState(true);
  const [Show_Transliterator_List, Set_Show_Transliterator_List] = useState(false);
  const [Search_Query, Set_Search_Query] = useState("");

  const [Available_Transliterators, Set_Available_Transliterators] = useState<Transliteration_List_Entry[]>([]);

  const [Downloaded_IDs, Set_Downloaded_IDs] = useState<string[]>([]);
  const [Downloading_IDs, Set_Downloading_IDs] = useState<string[]>([]);

  const [Expanded_Active_Langs, Set_Expanded_Active_Langs] = useState<string[]>([]);
  const [Expanded_Inactive_Langs, Set_Expanded_Inactive_Langs] = useState<string[]>([]);

  const {
    Selected_Ayah_Transliterator,
    Set_Selected_Ayah_Transliterator,
    Transliteration_Size,
    Set_Transliteration_Size,
  } = Use_App();

  useEffect(() => {
    async function Load_Transliterators() {
      try {
        const list = await Fetch_Transliteration_List();
        Set_Available_Transliterators(list);

        if (list.length > 0) {
          Set_Expanded_Inactive_Langs([list[0].Language]);
        }
      } catch (err) {
        console.error("error fetching transliterator list:", err);
      } finally {
        Set_Is_Loading(false);
      }
    }

    if (Available_Transliterators.length === 0) {
      Load_Transliterators();
    } else {
      Set_Is_Loading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // FIX: check the real completion marker in Service-Worker-Cache-Store
  // instead of assuming everything starts "not Downloaded" after remount.
  useEffect(() => {
    let Cancelled = false;

    async function Check_Existing_Downloads() {
      if (Available_Transliterators.length === 0) return;

      const Checks = await Promise.all(
        Available_Transliterators.map(async (item) => {
          const Downloaded = await Is_Transliterator_Downloaded(item.ID);
          return Downloaded ? item.ID : null;
        })
      );

      if (!Cancelled) {
        Set_Downloaded_IDs(Checks.filter((id): id is string => id !== null));
      }
    }

    Check_Existing_Downloads();
    return () => {
      Cancelled = true;
    };
  }, [Available_Transliterators]);

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

  // FIX: real download — pulls every Surah's Ayah text through
  // Fetch_Surah_Transliteration (which caches via Save_Ayaat_Locally),
  // then writes a completion marker, instead of faking a delay.
  const Handle_Download = async (item: Transliteration_List_Entry) => {
    Set_Downloading_IDs((prev) => [...prev, item.ID]);

    try {
      await Download_Transliterator(item.ID);
      Set_Downloaded_IDs((prev) => [...prev, item.ID]);
    } catch (err) {
      console.error(`Failed to download transliterator "${item.ID}":`, err);
    } finally {
      Set_Downloading_IDs((prev) => prev.filter((i) => i !== item.ID));
    }
  };

  // FIX: clears the real completion marker via Delete_Saved_Kalimaat.
  // (Underlying per-Surah Ayaat cache entries aren't purged — see the
  // Note above on the missing Delete_Saved_Ayaat export.)
  const Handle_Delete_Download = async (id: string) => {
    try {
      await Remove_Transliterator_Download(id);
    } catch (err) {
      console.error(`Failed to remove download marker for "${id}":`, err);
    } finally {
      Set_Downloaded_IDs((prev) => prev.filter((item) => item !== id));
    }
  };

  const Filtered_Items = Available_Transliterators.filter(
    (item) =>
      item.Name.toLowerCase().includes(Search_Query.toLowerCase()) ||
      item.Language.toLowerCase().includes(Search_Query.toLowerCase())
  );

  // Single-select: "Active" is just the one currently selected transliterator.
  const Active_List = Filtered_Items.filter((item) => item.ID === Selected_Ayah_Transliterator);
  const Inactive_List = Filtered_Items.filter((item) => item.ID !== Selected_Ayah_Transliterator);

  const Active_By_Language = Active_List.reduce<Record<string, Transliteration_List_Entry[]>>(
    (acc, item) => {
      acc[item.Language] = acc[item.Language] || [];
      acc[item.Language].push(item);
      return acc;
    },
    {}
  );

  const Inactive_By_Language = Inactive_List.reduce<Record<string, Transliteration_List_Entry[]>>(
    (acc, item) => {
      acc[item.Language] = acc[item.Language] || [];
      acc[item.Language].push(item);
      return acc;
    },
    {}
  );

  if (Is_Loading_Corpus_Data) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading transliterators...</span>
      </div>
    );
  }

  if (Is_Mobile && Show_Transliterator_List) {
    return (
      <Mobile_Navigator
        Is_Open={Show_Transliterator_List}
        On_Close={() => Set_Show_Transliterator_List(false)}
        title="Select Transliterator"
        options={Available_Transliterators.map((t) => ({
          id: t.ID,
          label: `${t.Language} - ${t.Name}`,
        }))}
        Selected_ID={Selected_Ayah_Transliterator}
        onSelect={Set_Selected_Ayah_Transliterator}
      />
    );
  }

  const Has_Active = Active_List.length > 0 && Selected_Ayah_Transliterator !== NONE_ID;

  return (
    <div className="space-y-4">
      {/* font Size Slider */}
      {Selected_Ayah_Transliterator !== NONE_ID && (
        <Card className="py-2.5 px-4 bg-card">
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-sm whitespace-nowrap">
              font Size: {Transliteration_Size}
            </span>
            <Slider
              value={[Transliteration_Size]}
              onValueChange={(value) => Set_Transliteration_Size(value[0])}
              min={1}
              max={10}
              Step={1}
              className="flex-1"
            />
          </div>
        </Card>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 Top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search Languages or transliterators..."
          value={Search_Query}
          On_Change={(e) => Set_Search_Query(e.target.value)}
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

                          return (
                            <div
                              key={item.ID}
                              onClick={() =>
                                Set_Selected_Ayah_Transliterator(
                                  item.ID === Selected_Ayah_Transliterator ? NONE_ID : item.ID
                                )
                              }
                              className="flex items-center justify-between px-4 py-2.5 rounded-full border-2 border-primary bg-card hover:bg-muted cursor-pointer transition-all"
                            >
                              <div className="flex items-center gap-2">
                                <Check className="h-3.5 w-3.5 text-primary" />
                                <span className="text-sm font-medium">{item.Name}</span>
                              </div>

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
                                    onClick={() => Handle_Download(item)}
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
            No other transliterators available.
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
                              onClick={() => Set_Selected_Ayah_Transliterator(item.ID)}
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
                                    onClick={() => Handle_Download(item)}
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