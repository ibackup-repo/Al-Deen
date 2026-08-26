import { useState, useEffect } from "react";
import { Search, Download, Loader2, Trash2 } from "lucide-react";
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
  Fetch_Hadith_Translation,
  Fetch_Collections,
  Get_Chapters,
  Get_Chapter,
  type Translation_List_Entry,
} from "@/Library/Hadith-API";

import {
  Get_Saved_Kalimaat,
  Save_Kalimaat_Locally,
  Delete_Saved_Kalimaat,
} from "@/Library/Service-Worker-Cache-Store";

const Build_Download_Marker_Key = (Edition_ID: string) =>
  `Hadith-Translation-Download::${Edition_ID}`;

const Is_Translation_Downloaded = async (Edition_ID: string): Promise<boolean> => {
  const Marker = await Get_Saved_Kalimaat<boolean>(Build_Download_Marker_Key(Edition_ID));
  return Marker === true;
};

const Download_Translation = async (Edition_ID: string): Promise<void> => {
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

  const Unique_Hadith_IDs = Array.from(new Set(All_Hadith_IDs));

  if (Unique_Hadith_IDs.length > 0) {
    await Fetch_Hadith_Translation(
      Unique_Hadith_IDs,
      Edition_ID,
      true,
      false
    );
  }

  await Save_Kalimaat_Locally(Build_Download_Marker_Key(Edition_ID), true);
};

const Remove_Translation_Download = (Edition_ID: string): Promise<void> =>
  Delete_Saved_Kalimaat(Build_Download_Marker_Key(Edition_ID));

export function Translation_Section() {
  const Is_Mobile = Use_Is_Mobile();
  const [Is_Loading_Corpus_Data, Set_Is_Loading] = useState(true);
  const [Show_Translator_List, Set_Show_Translator_List] = useState(false);
  const [Search_Query, Set_Search_Query] = useState("");

  const [Available_Editions, Set_Available_Editions] = useState<Translation_List_Entry[]>([]);
  const [Downloaded_IDs, Set_Downloaded_IDs] = useState<string[]>([]);
  const [Downloading_IDs, Set_Downloading_IDs] = useState<string[]>([]);

  const {
    Hadith_Translation_Font_Size,
    Set_Hadith_Translation_Font_Size,
    Selected_Hadith_Translation_Edition,
    Set_Selected_Hadith_Translation_Edition,
  } = Use_App();

  useEffect(() => {
    async function Load_Editions() {
      try {
        const list = await Fetch_Translation_List();
        Set_Available_Editions(list);
      } catch (err) {
        console.error("error fetching Hadith Translation list:", err);
      } finally {
        Set_Is_Loading(false);
      }
    }

    Load_Editions();
  }, []);

  useEffect(() => {
    let Cancelled = false;

    async function Check_Existing_Downloads() {
      if (Available_Editions.length === 0) return;

      const Checks = await Promise.all(
        Available_Editions.map(async (item) => {
          const Downloaded = await Is_Translation_Downloaded(item.ID);
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
  }, [Available_Editions]);

  const Handle_Download = async (item: Translation_List_Entry) => {
    Set_Downloading_IDs((prev) => [...prev, item.ID]);

    try {
      await Download_Translation(item.ID);
      Set_Downloaded_IDs((prev) => [...prev, item.ID]);
    } catch (err) {
      console.error(`Failed to download Translation "${item.ID}":`, err);
    } finally {
      Set_Downloading_IDs((prev) => prev.filter((i) => i !== item.ID));
    }
  };

  const Handle_Delete_Download = async (id: string) => {
    try {
      await Remove_Translation_Download(id);
      Set_Downloaded_IDs((prev) => prev.filter((item) => item !== id));
    } catch (err) {
      console.error(`Failed to delete Translation "${id}":`, err);
    }
  };

  const Toggle_Edition = (id: string) => {
    if (Selected_Hadith_Translation_Edition === id) {
      Set_Selected_Hadith_Translation_Edition("");
    } else {
      Set_Selected_Hadith_Translation_Edition(id);
    }
  };

  const Filtered_Items = Available_Editions.filter(
    (item) =>
      item.Name.toLowerCase().includes(Search_Query.toLowerCase()) ||
      item.Language.toLowerCase().includes(Search_Query.toLowerCase())
  );

  const Active_List = Filtered_Items.filter(
    (item) => item.ID === Selected_Hadith_Translation_Edition
  );
  const Inactive_List = Filtered_Items.filter(
    (item) => item.ID !== Selected_Hadith_Translation_Edition
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
        options={Available_Editions.map((t) => ({
          id: t.ID,
          label: `${t.Language} - ${t.Name}`,
        }))}
        Selected_ID={Selected_Hadith_Translation_Edition}
        onSelect={(id) => Set_Selected_Hadith_Translation_Edition(id)}
      />
    );
  }

  const Has_Active = Active_List.length > 0;

  return (
    <div className="space-y-4">
      <div className="relative rounded-[40px] bg-white dark:bg-black border-2 border-black dark:border-white transition-all Duration-200 py-1 px-3 inline-flex">
        <p className="text-xs font-medium text-foreground">Translation</p>
      </div>

      {/* font Size Slider */}
      <Card className="py-2.5 px-4 bg-card">
        <div className="flex items-center justify-between gap-4">
          <span className="font-semibold text-sm whitespace-nowrap">
            font Size: {Hadith_Translation_Font_Size}
          </span>
          <Slider
            value={[Hadith_Translation_Font_Size]}
            onValueChange={(value) => Set_Hadith_Translation_Font_Size(value[0])}
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

          <div className="space-y-2">
            {Active_List.map((item) => {
              const Is_Downloaded = Downloaded_IDs.includes(item.ID);
              const Is_Downloading = Downloading_IDs.includes(item.ID);

              return (
                <div
                  key={item.ID}
                  onClick={() => Toggle_Edition(item.ID)}
                  className="flex items-center justify-between px-4 py-2.5 rounded-full border-2 border-primary bg-card hover:bg-muted cursor-pointer transition-all"
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
                          Handle_Download(item);
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

      {/* Inactive Container */}
      <Container className="p-4 space-y-3 bg-card">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Inactive
        </h3>

        {Inactive_List.length === 0 ? (
          <div className="text-sm text-muted-foreground italic text-center py-2">
            All available Translations are Active.
          </div>
        ) : (
          <div className="space-y-2">
            {Inactive_List.map((item) => {
              const Is_Downloaded = Downloaded_IDs.includes(item.ID);
              const Is_Downloading = Downloading_IDs.includes(item.ID);

              return (
                <div
                  key={item.ID}
                  onClick={() => Toggle_Edition(item.ID)}
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
                          Handle_Download(item);
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
  );
}