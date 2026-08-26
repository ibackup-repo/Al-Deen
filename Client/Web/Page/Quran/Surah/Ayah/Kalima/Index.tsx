import { useParams, Link } from "react-router-dom";
import { Layout } from "@Web/Component/Layout/Index";
import { Audio_Player } from "@Web/Component/Audio-Player/Index";
import { Surah_Header } from "@Web/Component/Quran/Surah/Header";
import { Ayah_Card } from "@Web/Component/Quran/Layout/Ayah/Card";
import { Notes_Dialog } from "@Web/Component/Dialog/Notes";
import { Share_Dialog } from "@Web/Component/Dialog/Share";
import { Surah_Info_Dialog } from "@Web/Component/Dialog/Surah-Info";
import { Tafsir_Dialog } from "@Web/Component/Dialog/Tafsir";
import { Render_Surah_Dialog } from "@Web/Component/Dialog/Render-Quran/Index";

import { Use_App } from "@Web/Context/App";
import { Use_Audio } from "@Web/Context/Audio";
import { Use_Quran_Data } from "@/Hook/Use-Quran-Data";
import { Use_Reading_Session } from "@/Hook/Use-Reading-Session";
import { Use_Quran_Goals } from "@/Hook/Use-Quran-Goals";
import { Button } from "@Web/Component/UI/Button";
import { Container } from "@Web/Component/UI/Container";
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useRef, useMemo } from "react";
import { Alert, Alert_Description } from "@Web/Component/UI/Alert";
import { useQuery } from "@tanstack/react-query";
import { Fetch_Page_Sections_Corpus } from "@/Library/Quran-API";
import type { Page_Sections } from "@/Library/Quran-API";
import type { Surah_Metadata, Assembled_Ayah } from "@Web/Component/Quran/Layout/Types";

// ============================================================================
// Network Fetch Client Handler
// ============================================================================
async function Fetch_Quran_Corpus_From_Backend() {
  const Network_Response = await fetch("https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev/api/Quran-Corpus");
  if (!Network_Response.ok) throw new Error("Failed to stream Quran Corpus database over the network");
  return Network_Response.json();
}

function Find_Page_Index_For_Ayah(
  Surah_Pages_Range: [number, number] | undefined,
  Surah_ID: number,
  Verse_Number: number,
  Page_Sections_Map: Page_Sections | undefined
): number {
  if (!Surah_Pages_Range) return 1;
  if (!Page_Sections_Map) return Surah_Pages_Range[0];

  for (let Page_Index = Surah_Pages_Range[0]; Page_Index <= Surah_Pages_Range[1]; Page_Index++) {
    const Segment_Collection = Page_Sections_Map[Page_Index];
    if (!Segment_Collection) continue;

    const Segment_Match = Segment_Collection.find(
      (Single_Segment) =>
        Single_Segment["Surah"] === Surah_ID &&
        Verse_Number >= Single_Segment["Start_Ayah"] &&
        Verse_Number <= Single_Segment["End_Ayah"]
    );

    if (Segment_Match) return Page_Index;
  }

  return Surah_Pages_Range[0];
}

const Kalimah = () => {
  const { id: Surah_Route_ID, verseId: Ayah_Route_ID, kalimaId: Kalima_Route_ID } = useParams<{
    id: string;
    verseId: string;
    kalimaId: string;
  }>();
  const Surah_ID = parseInt(Surah_Route_ID || "1", 10);
  const Verse_Number = parseInt(Ayah_Route_ID || "1", 10);
  const Kalimah_Index = parseInt(Kalima_Route_ID || "1", 10) - 1;

  const {
    fontSize: Global_Font_Size,
    Translation_Font_Size: Global_Translation_Font_Size,
    Quran_Font: Active_Quran_Font,
    Show_Arabic_Text: Display_Arabic_Text_Flag,
    Hover_Translation: Active_Hover_Translation,
    Inline_Translation: Active_Inline_Translation,
    Transliteration_Size: Global_Transliteration_Size,
    Hover_Transliteration: Active_Hover_Transliteration,
    Inline_Transliteration: Active_Inline_Transliteration,
    Hide_Ayaat: Hide_Verses_Flag,
    Hide_Verse_Markers: Hide_Verse_Markers_Flag,
  } = Use_App();

  const {
    stop: Stop_Audio_Playback,
    Is_Playing: Is_Audio_Playing_Flag,
    Current_Surah: Playing_Surah_Identifier,
    Play_Full_Surah: Play_Full_Surah_Audio,
    Toggle_Play_Pause: Toggle_Play_Pause_Audio,
  } = Use_Audio();

  const { data: Backend_Corpus_Data, Is_Loading_Corpus_Data: Is_Loading_Corpus_Data } = useQuery({
    queryKey: ["Quran_Corpus_Backend"],
    queryFn: Fetch_Quran_Corpus_From_Backend,
    staleTime: 1000 * 60 * 30,
  });

  const { data: Page_Sections_Corpus_Map } = useQuery<Page_Sections>({
    queryKey: ["pageSectionsCorpus"],
    queryFn: Fetch_Page_Sections_Corpus,
    staleTime: 1000 * 60 * 60,
  });

  const { data: Surah_Data_Object, Is_Loading_Corpus_Data: Is_Loading_Surah_Data, error: Surah_Data_Error, Refetch: Refetch_Surah_Data } = Use_Quran_Data(Surah_ID);
  const Surah_Verses_Collection = Surah_Data_Object?.Ayaat;
  const Selected_Verse_Object = useMemo(() => Surah_Verses_Collection?.find((Single_Verse) => Single_Verse.Ayah_ID === Verse_Number), [Surah_Verses_Collection, Verse_Number]);
  const Selected_Word_Object = Selected_Verse_Object?.Kalimaat[Kalimah_Index];

  const { Start_Session: Start_Reading_Session, Stop_Session: Stop_Reading_Session, Save_Seconds_To_Goal: Save_Duration_To_Goal, Is_Tracking_Enabled: Reading_Tracker_enabled_Flag } = Use_Reading_Session();
  const { Active_Goal: Active_Reading_Goal } = Use_Quran_Goals();

  const [Audio_Player_Visible_Flag, Set_Audio_Player_Visible_Flag] = useState(false);
  const [Surah_Information_Dialog_Visible, Set_Surah_Information_Dialog_Visible] = useState(false);
  const [Render_Quran_Dialog_State, Set_Render_Quran_Dialog_State] = useState<{ Open: boolean; Ayah?: number; Mode: "render" | "embed" }>({ Open: false, Mode: "render" });

  const [Tafsir_Dialog_State, Set_Tafsir_Dialog_State] = useState<{ Open: boolean; Ayah_ID: number }>({ Open: false, Ayah_ID: Verse_Number });
  const [Notes_Dialog_State, Set_Notes_Dialog_State] = useState<{ Open: boolean; Ayah_ID?: number; Ayah?: any }>({ Open: false });
  const [Share_Dialog_State, Set_Share_Dialog_State] = useState<{ Open: boolean; Ayah_ID?: number; Ayah_Text?: string; Translation?: string }>({ Open: false });

  const Verse_Element_References = useRef<Map<number, HTMLDivElement>>(new Map());
  const Reading_Session_Interval_Reference = useRef<NodeJS.Timeout | null>(null);

  const Current_Surah_Metadata = useMemo(() => {
    if (!Backend_Corpus_Data?.Surahs) return null;
    return Backend_Corpus_Data.Surahs.find((Single_Surah: any) => Single_Surah.id === Surah_ID) || Backend_Corpus_Data.Surahs[0];
  }, [Backend_Corpus_Data, Surah_ID]);

  const Previous_Surah_Metadata = useMemo(() => {
    if (!Backend_Corpus_Data?.Surahs) return null;
    return Backend_Corpus_Data.Surahs.find((Single_Surah: any) => Single_Surah.id === Surah_ID - 1) || null;
  }, [Backend_Corpus_Data, Surah_ID]);

  const Next_Surah_Metadata = useMemo(() => {
    if (!Backend_Corpus_Data?.Surahs) return null;
    return Backend_Corpus_Data.Surahs.find((Single_Surah: any) => Single_Surah.id === Surah_ID + 1) || null;
  }, [Backend_Corpus_Data, Surah_ID]);

  const Active_Page_Number = useMemo(
    () => Find_Page_Index_For_Ayah(Current_Surah_Metadata?.Pages as [number, number] | undefined, Surah_ID, Verse_Number, Page_Sections_Corpus_Map),
    [Current_Surah_Metadata, Surah_ID, Verse_Number, Page_Sections_Corpus_Map]
  );

  const Resolve_Font_Family_Class_Name = () => {
    switch (Active_Quran_Font) {
      case "IndoPak":    return "Font-IndoPak";
      case "Uthmani_V1": return "Font-Uthmani_V1";
      case "Uthmani_V2": return "Font-Uthmani_V2";
      case "Uthmani_V4": return "Font-Uthmani_V4";
      default:           return "Font-Uthmani";
    }
  };

  const Calculated_Arabic_Font_Size = `${(1.5 * Global_Font_Size) / 5}rem`;
  const Calculated_Translation_Font_Size = `${(1 * Global_Translation_Font_Size) / 3}rem`;
  const Calculated_Transliteration_Font_Size = `${(1 * Global_Transliteration_Size) / 3}rem`;

  const Assembled_Surah_Metadata: Surah_Metadata | null = Current_Surah_Metadata
    ? {
        Surah: Current_Surah_Metadata.id,
        Arabic: Current_Surah_Metadata.Arabic_Name ?? "",
        Translation: Current_Surah_Metadata.English_Name ?? "",
        Transliteration: Current_Surah_Metadata.Transliteration ?? Current_Surah_Metadata.English_Name ?? "",
        Revelation_Place: Current_Surah_Metadata.revelationPlace ?? null,
        Revelation_Order: Current_Surah_Metadata.Revelation_Order ?? null,
        Ayah_Count: Current_Surah_Metadata.Number_Of_Ayaat,
        Start_Page: Current_Surah_Metadata.Pages?.[0],
        End_Page: Current_Surah_Metadata.Pages?.[1],
        Indo_Pak_Ayah_Ending: [],
        Layout: null,
      }
    : null;

  const Assembled_Verse_Object: Assembled_Ayah | null = Selected_Verse_Object
    ? {
        Surah: Surah_ID,
        Ayah: Selected_Verse_Object.Ayah_ID,
        Arabic: (Selected_Verse_Object as any).Arabic ?? (Selected_Verse_Object as any).text ?? "",
        Arabic_V1: null,
        Arabic_V2: null,
        IndoPakMarker: null,
      }
    : null;

  const Is_Time_Goal_Type = Active_Reading_Goal?.Goal_Type === "time_based";
  const Should_Track_Reading_Session = Reading_Tracker_enabled_Flag && Is_Time_Goal_Type;

  useEffect(() => {
    if (!Should_Track_Reading_Session) return;
    Start_Reading_Session();
    Reading_Session_Interval_Reference.current = setInterval(async () => {
      const Elapsed_Seconds = await Stop_Reading_Session();
      if (Elapsed_Seconds > 0 && Active_Reading_Goal) Save_Duration_To_Goal(Active_Reading_Goal.id, Elapsed_Seconds);
      Start_Reading_Session();
    }, 10000);
    return () => {
      if (Reading_Session_Interval_Reference.current) clearInterval(Reading_Session_Interval_Reference.current);
      Stop_Reading_Session().then((Elapsed_Seconds) => {
        if (Elapsed_Seconds > 0 && Active_Reading_Goal) Save_Duration_To_Goal(Active_Reading_Goal.id, Elapsed_Seconds);
      });
    };
  }, [Should_Track_Reading_Session, Active_Reading_Goal, Start_Reading_Session, Stop_Reading_Session, Save_Duration_To_Goal]);

  const Total_Words_In_Verse_Count = Selected_Verse_Object?.Kalimaat.length || 0;
  const Has_Previous_Word_Flag = Selected_Verse_Object && Kalimah_Index > 0;
  const Has_Next_Word_Flag = Selected_Verse_Object && Kalimah_Index < Total_Words_In_Verse_Count - 1;
  const Has_Previous_Verse_Flag = Verse_Number > 1;
  const Has_Next_Verse_Flag = Surah_Verses_Collection && Verse_Number < Surah_Verses_Collection.length;

  const Resolve_Previous_URL_String = (): string | null => {
    if (Has_Previous_Word_Flag)
      return `/Quran/Surah/${Surah_ID}/Ayah/${Verse_Number}/Kalima/${Kalimah_Index}`;
    if (Has_Previous_Verse_Flag && Surah_Verses_Collection) {
      const Previous_Verse_Object = Surah_Verses_Collection[Verse_Number - 2];
      const Last_Word_Index = Previous_Verse_Object.Kalimaat.length;
      return `/Quran/Surah/${Surah_ID}/Ayah/${Verse_Number - 1}/Kalima/${Last_Word_Index}`;
    }
    return null;
  };

  const Resolve_Next_URL_String = (): string | null => {
    if (Has_Next_Word_Flag)
      return `/Quran/Surah/${Surah_ID}/Ayah/${Verse_Number}/Kalima/${Kalimah_Index + 2}`;
    if (Has_Next_Verse_Flag && Surah_Verses_Collection)
      return `/Quran/Surah/${Surah_ID}/Ayah/${Verse_Number + 1}/Kalima/1`;
    return null;
  };

  const { Current_Juz: Active_Juz_Number, currentHizb: Active_Hizb_Number } = useMemo(() => {
    if (!Backend_Corpus_Data?.juzData) return { Current_Juz: 1, currentHizb: 1 };
    const Juz_Information_Object = Backend_Corpus_Data.juzData.find((Single_Juz: any) =>
      Single_Juz.Surahs.some((Single_Surah: any) => Single_Surah.id === Surah_ID)
    );
    const Calculated_Juz_Number = Juz_Information_Object?.juzNumber || 1;
    const Calculated_Hizb_Number = (Calculated_Juz_Number - 1) * 2 + 1;
    return { Current_Juz: Calculated_Juz_Number, currentHizb: Calculated_Hizb_Number };
  }, [Backend_Corpus_Data, Surah_ID]);

  const Display_Header_Flag = Verse_Number === 1 && Kalimah_Index === 0;

  const Handle_Audio_Playback_Toggle = () => {
    Set_Audio_Player_Visible_Flag(true);
    if (Playing_Surah_Identifier === Surah_ID && Is_Audio_Playing_Flag) {
      Toggle_Play_Pause_Audio();
    } else if (Playing_Surah_Identifier === Surah_ID && !Is_Audio_Playing_Flag) {
      Toggle_Play_Pause_Audio();
    } else {
      Play_Full_Surah_Audio(Surah_ID);
    }
  };

  const Is_Resource_Loading_Flag = Is_Loading_Corpus_Data || Is_Loading_Surah_Data;

  if (Is_Resource_Loading_Flag || !Current_Surah_Metadata) {
    return (
      <Layout Hide_Footer>
        <div className="w-full max-w-[17em] mx-auto px-4 pt-28" style={{ fontSize: Calculated_Arabic_Font_Size }}>
          {Display_Header_Flag && (
            <Surah_Header
              Surah={Current_Surah_Metadata || {}}
              Font_Class={Resolve_Font_Family_Class_Name()}
              Arabic_Font_Size={Calculated_Arabic_Font_Size}
              On_Info_Click={() => Set_Surah_Information_Dialog_Visible(true)}
              On_Audio_Click={Handle_Audio_Playback_Toggle}
              On_Tafsir_Click={() => Set_Tafsir_Dialog_State({ Open: true, Ayah_ID: Verse_Number })}
              On_Render_Click={() => Set_Render_Quran_Dialog_State({ Open: true, Mode: "render" })}
            />
          )}
          <Container className={`w-full ${Display_Header_Flag ? "!rounded-t-none !rounded-b-[48px]" : "!rounded-[48px]"} mb-12`} />
        </div>
      </Layout>
    );
  }

  if (Surah_Data_Error || !Selected_Verse_Object || Selected_Word_Object === undefined || !Assembled_Verse_Object || !Assembled_Surah_Metadata) {
    return (
      <Layout Hide_Footer>
        <div className="w-full max-w-[17em] mx-auto px-4 pt-28" style={{ fontSize: Calculated_Arabic_Font_Size }}>
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <Alert_Description>
              Failed to load Kalimah parameters over the network interface.
            </Alert_Description>
          </Alert>
          <div className="text-center">
            <Button onClick={() => Refetch_Surah_Data()}>Retry</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout Hide_Footer>
      <div style={{ fontSize: Calculated_Arabic_Font_Size }} className="w-full max-w-[17em] mx-auto px-4 pt-28">
        {Display_Header_Flag && (
          <Surah_Header
            Surah={Current_Surah_Metadata}
            Font_Class={Resolve_Font_Family_Class_Name()}
            Arabic_Font_Size={Calculated_Arabic_Font_Size}
            On_Info_Click={() => Set_Surah_Information_Dialog_Visible(true)}
            On_Audio_Click={Handle_Audio_Playback_Toggle}
            On_Tafsir_Click={() => Set_Tafsir_Dialog_State({ Open: true, Ayah_ID: Verse_Number })}
            On_Render_Click={() => Set_Render_Quran_Dialog_State({ Open: true, Mode: "render" })}
          />
        )}

        <Container className={`w-full ${Display_Header_Flag ? "!rounded-t-none !rounded-b-[48px]" : "!rounded-[48px]"} mb-12`}>
          <div>
            <Ayah_Card
              Ayah={Assembled_Verse_Object}
              Surah={Assembled_Surah_Metadata}
              Show_Arabic_Text={Display_Arabic_Text_Flag && !Hide_Verses_Flag}
              ShowTranslation={false}
              Show_Transliteration={false}
              Transliteration_Font_Size={Calculated_Transliteration_Font_Size}
              Translation_Font_Size={Calculated_Translation_Font_Size}
              Hover_Translation={Active_Hover_Translation !== "None" ? Active_Hover_Translation : undefined}
              Inline_Translation={Active_Inline_Translation !== "None" ? Active_Inline_Translation : undefined}
              Inline_Transliteration={Active_Inline_Transliteration !== "None" ? Active_Inline_Transliteration : undefined}
              Ayah_Reference={(DOM_Element: HTMLDivElement | null) => {
                if (DOM_Element) Verse_Element_References.current.set(Verse_Number, DOM_Element);
              }}
              On_Tafsir_Click={() => Set_Tafsir_Dialog_State({ Open: true, Ayah_ID: Verse_Number })}
            />
          </div>
          <div className="flex items-center justify-center pb-1">
            <span className="text-sm text-muted-foreground font-medium">
              Juz - {Active_Juz_Number} | Page - {Active_Page_Number} | Hizb - {Active_Hizb_Number}
            </span>
          </div>
        </Container>

        <div className="flex items-center justify-center gap-2 mt-4">
          <Button size="sm" variant="ghost" onClick={() => Set_Render_Quran_Dialog_State({ Open: true, Mode: "render" })}>
            Render Surah
          </Button>
          <Button size="sm" variant="ghost" onClick={() => Set_Render_Quran_Dialog_State({ Open: true, Mode: "embed", Ayah: Verse_Number })}>
            Embed Ayah
          </Button>
        </div>

        <div className="flex items-center justify-between gap-4 mt-6">
          {Resolve_Previous_URL_String() ? (
            <Link to={Resolve_Previous_URL_String()!}>
              <Button className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
            </Link>
          ) : (
            <div className="w-[110px]" />
          )}
          <div className="flex-1" />
          {Resolve_Next_URL_String() ? (
            <Link to={Resolve_Next_URL_String()!}>
              <Button className="gap-2">
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <div className="w-[110px]" />
          )}
        </div>

        <div className="flex items-center justify-center gap-3 py-4 mt-8">
          {Previous_Surah_Metadata && (
            <Link to={`/Quran/Surah/${Previous_Surah_Metadata.id}/Ayah/1/Kalima/1`}>
              <Button className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Previous Surah
              </Button>
            </Link>
          )}
          {Next_Surah_Metadata && (
            <Link to={`/Quran/Surah/${Next_Surah_Metadata.id}/Ayah/1/Kalima/1`}>
              <Button className="gap-2">
                Next Surah
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      <Audio_Player
        Is_Visible={Audio_Player_Visible_Flag}
        On_Close={() => {
          Stop_Audio_Playback();
          Set_Audio_Player_Visible_Flag(false);
        }}
        SurahId={Surah_ID}
        SurahName={Current_Surah_Metadata.English_Name}
      />

      <Notes_Dialog
        Open={Notes_Dialog_State.Open}
        On_Open_Change={(Open_State) => Set_Notes_Dialog_State({ ...Notes_Dialog_State, Open: Open_State })}
        Surah_ID={Surah_ID}
        Ayah_ID={Notes_Dialog_State.Ayah_ID}
        Ayah={Notes_Dialog_State.Ayah}
      />
      <Share_Dialog
        Open={Share_Dialog_State.Open}
        On_Open_Change={(Open_State) => Set_Share_Dialog_State({ ...Share_Dialog_State, Open: Open_State })}
        SurahId={Surah_ID}
        SurahName={Current_Surah_Metadata.English_Name}
        Ayah_ID={Share_Dialog_State.Ayah_ID}
        Ayah_Text={Share_Dialog_State.Ayah_Text}
        Translation={Share_Dialog_State.Translation}
      />
      <Surah_Info_Dialog
        Open={Surah_Information_Dialog_Visible}
        On_Open_Change={Set_Surah_Information_Dialog_Visible}
        SurahId={Surah_ID}
      />
      <Tafsir_Dialog
        Open={Tafsir_Dialog_State.Open}
        On_Open_Change={(Open_State) => Set_Tafsir_Dialog_State((Previous_State) => ({ ...Previous_State, Open: Open_State }))}
        SurahId={Surah_ID}
        Ayah_ID={Tafsir_Dialog_State.Ayah_ID}
      />
      <Render_Surah_Dialog
        Open={Render_Quran_Dialog_State.Open}
        On_Open_Change={(Open_State) => Set_Render_Quran_Dialog_State((Previous_State) => ({ ...Previous_State, Open: Open_State }))}
        SurahId={Surah_ID}
        Ayah_ID={Render_Quran_Dialog_State.Ayah}
        Mode={Render_Quran_Dialog_State.Mode}
      />
    </Layout>
  );
};

export default Kalimah;