import { useMemo, useRef, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Ayah_Card } from "@Web/Component/Quran/Layout/Ayah/Card";
import { Page_Card } from "@Web/Component/Quran/Layout/Page/Card";
import { Surah_Header } from "@Web/Component/Quran/Surah/Header";
import { Surah_Info_Dialog } from "@Web/Component/Dialog/Surah-Info";
import { Tafsir_Dialog } from "@Web/Component/Dialog/Tafsir";
import { Audio_Player } from "@Web/Component/Audio-Player/Index";
import { Use_Audio } from "@Web/Context/Audio";
import { Use_App, type Quran_Font_Family } from "@Web/Context/App";
import type { Resolved_Kalimah, Surah_Metadata, Assembled_Ayah, Page_Ayaat } from "@Web/Component/Quran/Layout/Types";

interface Segment_Range {
  Surah: number;
  Start_Ayah: number;
  End_Ayah: number;
}

interface Properties {
  Segments: Segment_Range[];
}

type Quran_Font_Type = "V1" | "V2" | "Standard";

// ============= API Configuration and Endpoint Handlers =============
const Backend_Base_URL = "https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev";

async function Fetch_Quran_Corpus_From_Backend() {
  const response = await fetch(`${Backend_Base_URL}/api/Quran-Corpus`);
  if (!response.ok) throw new Error("Failed to load unified Quran Corpus data map");
  return response.json();
}

function Map_Font_To_Data_Type(font: Quran_Font_Family): Quran_Font_Type {
  switch (font) {
    case "Uthmani_V1":
      return "V1";
    case "Uthmani_V2":
    case "Uthmani_V4":
      return "V2";
    default:
      return "Standard";
  }
}

function Resolve_Font_Family_Class_Name(Quran_Font: Quran_Font_Family) {
  switch (Quran_Font) {
    case "IndoPak":
      return "Font-IndoPak";
    case "Uthmani_V1":
      return "Font-Uthmani_V1";
    case "Uthmani_V2":
      return "Font-Uthmani_V2";
    case "Uthmani_V4":
      return "Font-Uthmani_V4";
    default:
      return "Font-Uthmani";
  }
}

function Get_Segment_Page_Range(
  Surah: any,
  Start_Ayah: number,
  End_Ayah: number,
  Page_Segments_Map: any[] = []
): [number, number] {
  let start = Surah.Pages?.[0] || 1;
  let end = Surah.Pages?.[1] || 604;
  let found = false;

  for (let p = start; p <= end; p++) {
    const segs = Page_Segments_Map?.[p] || [];
    const seg = segs.find((s: any) => s.Surah === Surah.id);
    if (!seg) continue;
    if (seg.End_Ayah < Start_Ayah || seg.Start_Ayah > End_Ayah) continue;
    if (!found) {
      start = p;
      found = true;
    }
    end = p;
  }
  return [start, end];
}

// ============= Adapters: legacy fetch shape -> real component prop shape =============

/** Ayah_Card/Page_Card Read the real Assembled_Ayah / Surah_Metadata field names
 *  (Surah, Ayah, Arabic, ...). This ad-hoc backend's Ayah/Surah objects use
 *  their own camelCase shape though (Ayah_ID, Arabic, footnotes, ...),
 *  so these helpers translate field-by-field rather than relying on the
 *  loose fallback chains Ayah_Card/Page_Card use internally. */
function To_Resolved_Ayah(Ayah: any): Assembled_Ayah {
  return {
    Surah: Ayah.Surah ?? Ayah.Surah,
    Ayah: Ayah.Ayah_ID ?? Ayah.Ayah,
    Arabic: Ayah.Arabic ?? Ayah.Arabic ?? "",
    Arabic_V1: Ayah.Arabic_V1 ?? null,
    Arabic_V2: Ayah.Arabic_V2 ?? null,
    IndoPakMarker: Ayah.indoPakMarker ?? null,
  };
}

function To_Card_Surah(Surah: any, Adjusted_Surah: any): Surah_Metadata {
  return {
    Surah: Surah.id,
    Arabic: Surah.Arabic_Name ?? "",
    Translation: Surah.English_Name ?? "",
    Transliteration: Surah.Transliteration ?? Surah.English_Name ?? "",
    Revelation_Place: Surah.revelationPlace ?? null,
    Revelation_Order: Surah.Revelation_Order ?? null,
    Ayah_Count: Surah.Number_Of_Ayaat,
    Start_Page: Adjusted_Surah.Pages?.[0],
    End_Page: Adjusted_Surah.Pages?.[1],
    Indo_Pak_Ayah_Ending: [],
    Layout: null,
  };
}

const Kalimaat_Per_Synthetic_Line = 12;

/**
 * Groups the flat Ayah->Kalimah list into the line-based structure Page_Card
 * expects (Resolved_Lines: Resolved_Kalimah[][]).
 *
 * If the backend ever starts returning real mushaf line numbers per Kalimah
 * (e.g. Kalimah.line), this will pick them up automatically. Until then it falls
 * back to a synthetic Kalimah-Count-based wrap so the page layout still renders.
 */
function Build_Resolved_Lines(Ayaat: any[]): Resolved_Kalimah[][] {
  const flatWords: Array<Resolved_Kalimah & { __line?: number }> = [];

  for (const Ayah of Ayaat) {
    const Kalimaat: any[] = Ayah.Kalimaat || Ayah.Words || [];
    const resolvedVerse = To_Resolved_Ayah(Ayah);

    Kalimaat.forEach((Kalimah: any, i: number) => {
      flatWords.push({
        Glyph: Kalimah.text ?? Kalimah.Arabic ?? Kalimah.Arabic ?? "",
        Ayah: resolvedVerse,
        Kalimah_Index: i,
        Is_Ayah_End: i === Kalimaat.length - 1,
        Is_Ayah_Marker: false,
        Ayah_ID: Ayah.Ayah_ID,
        __line: Kalimah.line ?? Kalimah.Line_Number,
      } as Resolved_Kalimah & { __line?: number });
    });
  }

  const byLine = new Map<number, Resolved_Kalimah[]>();
  let syntheticLine = 0;
  let cursorInLine = 0;

  flatWords.forEach((w) => {
    let lineKey = w.__line;
    if (lineKey == null) {
      lineKey = syntheticLine;
      cursorInLine++;
      if (cursorInLine >= Kalimaat_Per_Synthetic_Line) {
        cursorInLine = 0;
        syntheticLine++;
      }
    }
    if (!byLine.has(lineKey)) byLine.set(lineKey, []);
    byLine.get(lineKey)!.push(w);
  });

  return Array.from(byLine.keys())
    .sort((a, b) => a - b)
    .map((k) => byLine.get(k)!);
}

export function Segment_Renderer({ Segments }: Properties) {
  const {
    layout,
    fontSize,
    Translation_Font_Size,
    Transliteration_Size,
    Quran_Font,
    Show_Arabic_Text,
    Ayah_Translation,
    Hover_Translation,
    Inline_Translation,
    Inline_Transliteration,
    Hover_Transliteration,
    Selected_Ayah_Transliterator,
    Hide_Ayaat,
    Hide_Verse_Markers,
    Selected_Translator,
  } = Use_App();

  const { stop: Stop_Current_Audio } = Use_Audio();
  const Ayah_References = useRef<Map<number, HTMLDivElement>>(new Map());

  const [Surah_Info_Dialog_State, Set_Surah_Info_Dialog_State] = useState<{ Open: boolean; Surah_ID: number }>({
    Open: false,
    Surah_ID: 1,
  });
  const [Tafsir_Dialog_State, Set_Tafsir_Dialog_State] = useState<{
    Open: boolean;
    Surah_ID: number;
    Ayah_ID: number;
  }>({ Open: false, Surah_ID: 1, Ayah_ID: 1 });
  const [Audio_Player_State, Set_Audio_Player_State] = useState<{ Open: boolean; Surah_ID?: number }>({
    Open: false,
  });
  const [Highlighted_Ayah, Set_Highlighted_Ayah] = useState<number | null>(null);

  const { data: Corpus, Is_Loading_Corpus_Data: Is_Corpus_Loading } = useQuery({
    queryKey: ["Quran_Corpus_Backend"],
    queryFn: Fetch_Quran_Corpus_From_Backend,
    staleTime: 1000 * 60 * 30,
  });

  const Surah_List = useMemo(() => Corpus?.Suwar || [], [Corpus]);
  const Page_Segments_Map = useMemo(() => Corpus?.pageSegments || [], [Corpus]);

  const Is_Page_Layout = layout === "page";
  const Show_Transliteration = Selected_Ayah_Transliterator !== "None";
  const Font_Class = Resolve_Font_Family_Class_Name(Quran_Font);
  const Font_Type = Map_Font_To_Data_Type(Quran_Font);

  const Arabic_Font_Size = `${(1.5 * fontSize) / 5}rem`;
  const Translation_Font_Size_Value = `${(1 * Translation_Font_Size) / 3}rem`;
  const Transliteration_Font_Size_Value = `${(1 * Transliteration_Size) / 3}rem`;

  const Grouped_Segments = useMemo(() => {
    const map = new Map<number, { Start_Ayah: number; End_Ayah: number }>();
    for (const s of Segments) {
      const cur = map.get(s.Surah);
      if (!cur) map.set(s.Surah, { Start_Ayah: s.Start_Ayah, End_Ayah: s.End_Ayah });
      else {
        cur.Start_Ayah = Math.min(cur.Start_Ayah, s.Start_Ayah);
        cur.End_Ayah = Math.max(cur.End_Ayah, s.End_Ayah);
      }
    }
    return Array.from(map.entries()).map(([Surah_ID, Range]) => ({
      Surah_ID,
      ...Range,
    }));
  }, [Segments]);

  const KBK_Translation_Hover = Hover_Translation !== "None" ? Hover_Translation : undefined;
  const KBK_Translation_Inline = Inline_Translation !== "None" ? Inline_Translation : undefined;
  const KBK_Transliteration_Hover = Hover_Transliteration !== "None" ? Hover_Transliteration : undefined;
  const KBK_Transliteration_Inline = Inline_Transliteration !== "None" ? Inline_Transliteration : undefined;
  const Transliteration_Style = Selected_Ayah_Transliterator !== "None" ? Selected_Ayah_Transliterator : undefined;
  const Translation_Source = Ayah_Translation && Selected_Translator ? Selected_Translator : undefined;

  const queries = useQueries({
    queries: Grouped_Segments.map((g) => ({
      queryKey: [
        "Surah",
        g.Surah_ID,
        Translation_Source,
        KBK_Translation_Hover,
        KBK_Translation_Inline,
        Font_Type,
        Transliteration_Style,
        KBK_Transliteration_Hover,
        KBK_Transliteration_Inline,
      ],
      queryFn: async () => {
        const queryParams = new URLSearchParams({
          Font_Type,
          wbw: "true",
        });
        if (Translation_Source) queryParams.append("Translation", Translation_Source);
        if (Transliteration_Style) queryParams.append("Transliteration", Transliteration_Style);

        const response = await fetch(`${Backend_Base_URL}/api/Surah/${g.Surah_ID}?${queryParams.toString()}`);
        if (!response.ok) throw new Error(`Failed to load Surah data for index ${g.Surah_ID}`);
        return response.json();
      },
      staleTime: 1000 * 60 * 60,
      enabled: !!Corpus,
    })),
  });

  if (Is_Corpus_Loading) {
    return (
      <div className="w-full h-48 flex items-center justify-center animate-pulse">
        <p className="text-sm text-muted-foreground">Loading structural Segments mapping data...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {Grouped_Segments.map((g, Index) => {
          const Surah = Surah_List.find((s: any) => s.id === g.Surah_ID);
          const data = queries[Index]?.data;
          if (!Surah || !data) return null;

          const Trimmed_Verses: any[] = data.Ayaat.filter(
            (v: any) => v.Ayah_ID >= g.Start_Ayah && v.Ayah_ID <= g.End_Ayah
          );

          const [Start_Page, End_Page] = Get_Segment_Page_Range(
            Surah,
            g.Start_Ayah,
            g.End_Ayah,
            Page_Segments_Map
          );
          const Adjusted_Surah = { ...Surah, Pages: [Start_Page, End_Page] };
          const Card_Surah = To_Card_Surah(Surah, Adjusted_Surah);

          const Page_Data_Object: Page_Ayaat = {
            Page_Number: Start_Page,
            Ayah: Trimmed_Verses.map(To_Resolved_Ayah),
          };

          return (
            <div key={g.Surah_ID} className="w-full">
              <Surah_Header
                Surah={Surah}
                Font_Class={Font_Class}
                Arabic_Font_Size={Arabic_Font_Size}
                On_Info_Click={() => Set_Surah_Info_Dialog_State({ Open: true, Surah_ID: Surah.id })}
                On_Tafsir_Click={() =>
                  Set_Tafsir_Dialog_State({ Open: true, Surah_ID: Surah.id, Ayah_ID: g.Start_Ayah })
                }
                On_Audio_Click={() => Set_Audio_Player_State({ Open: true, Surah_ID: Surah.id })}
              />

              {Is_Page_Layout ? (
                <Page_Card
                  // NOTE: several of the props below are required by
                  // Page_Card_Properties but have no source in this ad-hoc
                  // Corpus (no basmalah Kalimaat, no mushaf Layout, no
                  // per-page font-family resolution) - these are the same
                  // safe defaults Page_View.tsx falls back to when that
                  // data is missing, not derived values. Worth revisiting
                  // once this route has a real data source for them.
                  Page_Index={0}
                  Surah_Number={Surah.id}
                  Resolved_Lines={Build_Resolved_Lines(Trimmed_Verses)}
                  Container_Class="rounded-[48px] mb-2"
                  Font_Class={Font_Class}
                  Arabic_Font_Size={Arabic_Font_Size}
                  Show_Arabic_Text={Show_Arabic_Text && !Hide_Ayaat}
                  Show_Transliteration={Show_Transliteration}
                  Page_Data={Page_Data_Object}
                  Raw_Page_Data={null}
                  Show_Basmalah_On_Page={false}
                  Basmalah_Kalimaat={[]}
                  Page_Font_Family={Font_Class}
                  Ayah_Reference={Ayah_References}
                  Highlighted_Ayah={Highlighted_Ayah}
                  Set_Highlighted_Ayah={Set_Highlighted_Ayah}
                  Transliteration_Font_Size={Transliteration_Font_Size_Value}
                  Translation_Font_Size={Translation_Font_Size_Value}
                  Hover_Translation={KBK_Translation_Hover ?? false}
                  Inline_Translation={KBK_Translation_Inline ?? ""}
                  Inline_Transliteration={KBK_Transliteration_Inline ?? ""}
                  Hide_Ayaat={false}
                  Hide_Ayah_Markers={Hide_Verse_Markers}
                  Is_Indo_Pak_Font={Quran_Font === "IndoPak"}
                  Ayah_Marker_Overrides={[]}
                  Is_Uthmani_V4_Font={Quran_Font === "Uthmani_V4"}
                  Kalimah_Spacing="1.8px"
                  Layout={null}
                />
              ) : (
                <div className="space-y-4">
                  {Trimmed_Verses.map((Ayah) => (
                    <Ayah_Card
                      key={Ayah.Ayah_ID}
                      Ayah={To_Resolved_Ayah(Ayah)}
                      Words={Ayah.Kalimaat || Ayah.Words}
                      Translation={Ayah.Translation}
                      Surah={Card_Surah}
                      Show_Arabic_Text={Show_Arabic_Text && !Hide_Ayaat}
                      ShowTranslation={Ayah_Translation}
                      Translation_Font_Size={Translation_Font_Size_Value}
                      Transliteration_Font_Size={Transliteration_Font_Size_Value}
                      Show_Transliteration={Show_Transliteration}
                      Hover_Translation={KBK_Translation_Hover}
                      Inline_Translation={KBK_Translation_Inline}
                      Inline_Transliteration={KBK_Transliteration_Inline}
                      Ayah_Reference={(el: HTMLDivElement | null) => {
                        if (el) Ayah_References.current.set(Ayah.Ayah_ID, el);
                      }}
                      On_Tafsir_Click={() =>
                        Set_Tafsir_Dialog_State({ Open: true, Surah_ID: Surah.id, Ayah_ID: Ayah.Ayah_ID })
                      }
                      On_Notes_Click={() => {}}
                      On_Share_Click={() => {}}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Surah_Info_Dialog
        Open={Surah_Info_Dialog_State.Open}
        On_Open_Change={(Open) => Set_Surah_Info_Dialog_State((p) => ({ ...p, Open }))}
        Surah_ID={Surah_Info_Dialog_State.Surah_ID}
        Surah={Surah_List.find((s: any) => s.id === Surah_Info_Dialog_State.Surah_ID) || Surah_List[0] || {}}
      />
      <Tafsir_Dialog
        Open={Tafsir_Dialog_State.Open}
        On_Open_Change={(Open) => Set_Tafsir_Dialog_State((p) => ({ ...p, Open }))}
        Surah_ID={Tafsir_Dialog_State.Surah_ID}
        Ayah_ID={Tafsir_Dialog_State.Ayah_ID}
      />
      <Audio_Player
        Is_Visible={Audio_Player_State.Open}
        On_Close={() => {
          Stop_Current_Audio();
          Set_Audio_Player_State({ Open: false });
        }}
        Surah_ID={Audio_Player_State.Surah_ID}
        Surah_Name={
          Audio_Player_State.Surah_ID
            ? Surah_List.find((s: any) => s.id === Audio_Player_State.Surah_ID)?.English_Name
            : undefined
        }
      />
    </>
  );
}