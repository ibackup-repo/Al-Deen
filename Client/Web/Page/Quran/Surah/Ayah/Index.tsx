import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { Layout } from "@Web/Component/Layout/Index";
import { Audio_Player } from "@Web/Component/Audio-Player/Index";
import { Surah_Header } from "@Web/Component/Quran/Surah/Header";
import { Page_View } from "@Web/Component/Quran/Layout/Page/View";
import { Ayah_List } from "@Web/Component/Quran/Layout/Ayah/List";
import { Notes_Dialog } from "@Web/Component/Dialog/Notes";
import { Share_Dialog } from "@Web/Component/Dialog/Share";
import { Surah_Info_Dialog } from "@Web/Component/Dialog/Surah-Info";
import { Use_App } from "@Web/Context/App";
import { Use_Audio } from "@Web/Context/Audio";
import { Use_Reading_Progress } from "@/Hook/Use-Reading-Progress";
import { Use_Reading_Session } from "@/Hook/Use-Reading-Session";
import { Use_Quran_Goals } from "@/Hook/Use-Quran-Goals";
import { Button } from "@Web/Component/UI/Button";
import { Tafsir_Dialog } from "@Web/Component/Dialog/Tafsir";
import { Render_Surah_Dialog } from "@Web/Component/Dialog/Render-Quran/Index";
import { Container } from "@Web/Component/UI/Container";
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Alert, Alert_Description } from "@Web/Component/UI/Alert";
import { Audio_Controls } from "@Web/Component/Quran/Record";
import { Use_Deepgram } from "@/Hook/Use-STT";
import { useQuery } from "@tanstack/react-query";
import { Fetch_Page_Sections_Corpus } from "@/Library/Quran-API";
import type { Page_Sections } from "@/Library/Quran-API";
import type { Surah_Metadata, Assembled_Ayah } from "@Web/Component/Quran/Layout/Types";

// ============================================================================
// Network Fetch Client Handler (still the only source for the flat Surah
// list, per-Surah Ayaat and juz data used for navigation - none of the
// Takheet components fetch or expose those)
// ============================================================================
// TODO: this is a GitHub Codespaces forwarding URL (*.app.github.dev), which
// looks like a leftover local-dev address rather than a real backend host.
// Confirm the actual Corpus endpoint before shipping.
async function Fetch_Quran_Corpus_From_Backend() {
  const response = await fetch("https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev/api/Quran-Corpus");
  if (!response.ok) throw new Error("Failed to stream Quran Corpus database over the network");
  return response.json();
}

// Resolves which mushaf page a given Surah:Ayah falls on, using the same
// page-sections Corpus map Page_View/Ayah_List Read internally.
// Page_Sections[page] is an array of { Surah, Start_Ayah, End_Ayah } objects
// (see Page_Sections in Quran-API.ts) — Snake_Case fields, not the
// hyphenated "Start-Ayah"/"End-Ayah" keys used previously, which never
// matched anything and silently fell back to the Surah's first page.
function Find_Page_Index_For_Verse(
  Surah_Pages_Range: [number, number] | undefined,
  Surah_ID: number,
  Ayah_Number: number,
  Page_Sections_Map: Page_Sections | undefined
): number {
  if (!Surah_Pages_Range) return 1;
  if (!Page_Sections_Map) return Surah_Pages_Range[0];

  for (let p = Surah_Pages_Range[0]; p <= Surah_Pages_Range[1]; p++) {
    const Segments = Page_Sections_Map[p];
    if (!Segments) continue;

    const match = Segments.find(
      (Segment) =>
        Segment.Surah === Surah_ID &&
        Ayah_Number >= Segment.Start_Ayah &&
        Ayah_Number <= Segment.End_Ayah
    );

    if (match) return p;
  }

  return Surah_Pages_Range[0];
}

const Ayah = () => {
  const { id, verseId } = useParams<{ id: string; verseId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const Surah_ID = parseInt(id || "1", 10);
  const Ayah_Number = parseInt(verseId || "1", 10);
  const Target_Ayah = searchParams.get("Ayah") || Ayah_Number.toString();

  const {
    layout,
    fontSize,
    Translation_Font_Size,
    Quran_Font,
    Show_Arabic_Text,
    Ayah_Translation,
    Hover_Translation,
    Inline_Translation,
    Transliteration_Size,
    Selected_Ayah_Transliterator,
    Hover_Transliteration,
    Inline_Transliteration,
    Hide_Ayaat,
    Set_Hide_Ayaat,
    Hide_Verse_Markers,
    Record_Audio_Enabled,
  } = Use_App();

  const Show_Transliteration = Selected_Ayah_Transliterator !== "None";
  const { stop: Stop_Current_Audio, Play_Full_Surah } = Use_Audio();

  const { data: Corpus, Is_Loading_Corpus_Data, error } = useQuery({
    queryKey: ["Quran_Corpus_Backend"],
    queryFn: Fetch_Quran_Corpus_From_Backend,
    staleTime: 1000 * 60 * 30,
  });

  const { data: Page_Sections_Map } = useQuery<Page_Sections>({
    queryKey: ["pageSectionsCorpus"],
    queryFn: Fetch_Page_Sections_Corpus,
    staleTime: 1000 * 60 * 60,
  });

  const { Update_Progress } = Use_Reading_Progress();
  const { Start_Session, Stop_Session, Save_Seconds_To_Goal, Is_Tracking_Enabled } = Use_Reading_Session();
  const { Active_Goal } = Use_Quran_Goals();

  const [Show_Audio_Player, Set_Show_Audio_Player] = useState(false);
  const [Surah_Info_Dialog_State, Set_Surah_Info_Dialog_State] = useState(false);
  const [Render_Dialog, Set_Render_Dialog] = useState<{ Open: boolean; Ayah?: number; Mode: "render" | "embed" }>({ Open: false, Mode: "render" });
  const [Tafsir_Dialog_State, Set_Tafsir_Dialog_State] = useState<{ Open: boolean; Ayah_Number: number }>({ Open: false, Ayah_Number: Ayah_Number });
  const [Notes_Dialog, Set_Notes_Dialog] = useState<{ Open: boolean; Ayah_ID?: number; Ayah?: any }>({ Open: false });
  const [Share_Dialog, Set_Share_Dialog] = useState<{ Open: boolean; Ayah_ID?: number; Ayah_Text?: string; Translation?: string }>({ Open: false });

  const Ayah_References = useRef<Map<number, HTMLDivElement>>(new Map());
  const Container_Reference = useRef<HTMLDivElement>(null);
  const Reading_Session_Interval_Reference = useRef<NodeJS.Timeout | null>(null);

  const Is_Page_Layout = layout === "page";
  const Is_Time_Goal_Type = Active_Goal?.Goal_Type === "time_based";
  const Should_Track_Reading_Session = Is_Tracking_Enabled && Is_Time_Goal_Type;

  const Surah = useMemo(() => {
    if (!Corpus?.Suwar) return null;
    return Corpus.Suwar.find((s: any) => s.id === Surah_ID) || Corpus.Suwar[0];
  }, [Corpus, Surah_ID]);

  const Previous_Surah = useMemo(() => {
    if (!Corpus?.Suwar) return null;
    return Corpus.Suwar.find((s: any) => s.id === Surah_ID - 1) || null;
  }, [Corpus, Surah_ID]);

  const Next_Surah = useMemo(() => {
    if (!Corpus?.Suwar) return null;
    return Corpus.Suwar.find((s: any) => s.id === Surah_ID + 1) || null;
  }, [Corpus, Surah_ID]);

  const Ayaat = Surah?.Ayaat;
  const Ayah = useMemo(() => Ayaat?.find((v: any) => v.Ayah_Number === Ayah_Number), [Ayaat, Ayah_Number]);

  // NOTE: the field names on `Surah_Metadata` / `Assembled_Ayah` (imported from
  // @Web/Component/Quran/Layout/Types, not Quran-Types.ts) haven't been
  // cross-checked against that file the way Quran-API.ts was. `Ayah.Arabic`
  // / `Ayah.Text` below are still a best-effort guess at what the ad-hoc
  // backend actually returns.
  const Assembled_Surah_Metadata: Surah_Metadata | null = Surah
    ? {
        Surah: Surah.id,
        Arabic: Surah.Arabic_Name ?? "",
        Translation: Surah.English_Name ?? "",
        Transliteration: Surah.Transliteration ?? Surah.English_Name ?? "",
        Revelation_Place: Surah.revelationPlace ?? null,
        Revelation_Order: Surah.Revelation_Order ?? null,
        Ayah_Count: Surah.Number_Of_Ayaat,
        Start_Page: Surah.Pages?.[0],
        End_Page: Surah.Pages?.[1],
        Indo_Pak_Ayah_Ending: [],
        Layout: null,
      }
    : null;

  const Assembled_Ayah_Object: Assembled_Ayah | null = Ayah
    ? {
        Surah: Surah_ID,
        Ayah: Ayah.Ayah_Number,
        Arabic: Ayah.Arabic ?? Ayah.Text ?? "",
        Arabic_V1: null,
        Arabic_V2: null,
        IndoPakMarker: null,
      }
    : null;

  // Deepgram voice integration hook configuration
  const { Toggle_Recording, Is_Recording: Is_Deepgram_Recording_Active, Transcript } = Use_Deepgram({
    Surah_ID,
    On_Ayah_Complete: (Completed_Ayah) => {
      const next = Completed_Ayah + 1;
      if (Surah && next <= Surah.Number_Of_Ayaat) {
        navigate(`/Quran/Surah/${Surah_ID}/Ayah/${next}`);
      }
    },
  });

  const { Current_Juz, currentHizb } = useMemo(() => {
    if (!Corpus?.juzData) return { Current_Juz: 1, currentHizb: 1 };
    const juzInfo = Corpus.juzData.find((juz: any) => juz.Suwar.some((s: any) => s.id === Surah_ID));
    const juzNumber = juzInfo?.juzNumber || 1;
    const hizbNumber = (juzNumber - 1) * 2 + 1;
    return { Current_Juz: juzNumber, currentHizb: hizbNumber };
  }, [Corpus, Surah_ID]);

  const Resolve_Font_Family_Class_Name = () => {
    switch (Quran_Font) {
      case "IndoPak":    return "Font-IndoPak";
      case "Uthmani_V1": return "Font-Uthmani_V1";
      case "Uthmani_V2": return "Font-Uthmani_V2";
      case "Uthmani_V4": return "Font-Uthmani_V4";
      default:           return "Font-Uthmani";
    }
  };

  const Arabic_Font_Size = `${(1.5 * fontSize) / 5}rem`;
  const Translation_Font_Size_Value = `${(1 * Translation_Font_Size) / 3}rem`;
  const Transliteration_Font_Size_Value = `${(1 * Transliteration_Size) / 3}rem`;

  const Page_Number = useMemo(
    () => Find_Page_Index_For_Verse(Surah?.Pages as [number, number] | undefined, Surah_ID, Ayah_Number, Page_Sections_Map),
    [Surah, Surah_ID, Ayah_Number, Page_Sections_Map]
  );

  const Send_Audio_Playback_Test = useCallback(() => {
    Set_Show_Audio_Player(true);
    Play_Full_Surah(Surah_ID);
  }, [Surah_ID, Play_Full_Surah]);

  const Handle_Audio_Recording_Toggle = () => Toggle_Recording();

  useEffect(() => {
    if (!Should_Track_Reading_Session) return;
    Start_Session();
    Reading_Session_Interval_Reference.current = setInterval(async () => {
      const Seconds = await Stop_Session();
      if (Seconds > 0 && Active_Goal) Save_Seconds_To_Goal(Active_Goal.id, Seconds);
      Start_Session();
    }, 10000);
    return () => {
      if (Reading_Session_Interval_Reference.current) clearInterval(Reading_Session_Interval_Reference.current);
      Stop_Session().then((Seconds) => {
        if (Seconds > 0 && Active_Goal) Save_Seconds_To_Goal(Active_Goal.id, Seconds);
      });
    };
  }, [Should_Track_Reading_Session, Active_Goal, Start_Session, Stop_Session, Save_Seconds_To_Goal]);

  useEffect(() => {
    if (Ayah) {
      const el = Ayah_References.current.get(Ayah_Number);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
    }
  }, [Ayah, Ayah_Number]);

  useEffect(() => {
    if (Target_Ayah && Ayaat) {
      const target = parseInt(Target_Ayah, 10);
      const el = Ayah_References.current.get(target);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
    }
  }, [Target_Ayah, Ayaat]);

  const Show_Header = Ayah_Number === 1;

  if (Is_Loading_Corpus_Data || !Surah) {
    return (
      <Layout Hide_Footer>
        <div className="w-full max-w-2xl mx-auto p-8 text-center animate-pulse space-y-4">
          <div className="h-12 bg-muted rounded-xl w-3/4 mx-auto" />
          <div className="h-40 bg-muted rounded-2xl w-full" />
        </div>
      </Layout>
    );
  }

  if (error || !Ayah || !Assembled_Ayah_Object || !Assembled_Surah_Metadata) {
    return (
      <Layout Hide_Footer>
        <div className="w-full max-w-[17em] mx-auto px-4 pt-8" style={{ fontSize: Arabic_Font_Size }}>
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <Alert_Description>
              {error?.message || "Failed to resolve contextual network resources dynamically."}
            </Alert_Description>
          </Alert>
          <div className="text-center space-x-4">
            <Button onClick={() => window.location.reload()}>Reload Page</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout Hide_Footer>
      <div style={{ fontSize: Arabic_Font_Size }} className="w-full max-w-[17em] mx-auto pt-0 px-0 md:px-4">
        {Show_Header && (
          <Surah_Header
            Surah={Surah}
            Font_Class={Resolve_Font_Family_Class_Name()}
            Arabic_Font_Size={Arabic_Font_Size}
            On_Info_Click={() => Set_Surah_Info_Dialog_State(true)}
            On_Audio_Click={() => Set_Show_Audio_Player(true)}
            On_Tafsir_Click={() => Set_Tafsir_Dialog_State({ Open: true, Ayah_Number: Ayah_Number })}
            On_Render_Click={() => Set_Render_Dialog({ Open: true, Mode: "render" })}
          />
        )}

        <div ref={Container_Reference} className="w-full">
          {Is_Page_Layout ? (
            <Container className={`w-full ${Show_Header ? "!rounded-t-none !rounded-b-[48px]" : "!rounded-[48px]"} mb-12`}>
              <div>
                {/*
                  NOTE: same caveat as before - Page_View resolves its own
                  page Range from the Surah data it fetches internally, so
                  this renders every page of the Surah that has Ayaat, not
                  just the page containing `Ayah_Number`. There's no prop on
                  Page_View today to scope it to one page/Ayah; that would
                  need a change inside Page_View.tsx itself.
                */}
                <Page_View
                  Surah={Assembled_Surah_Metadata}
                  Show_Arabic_Text={Show_Arabic_Text && !Hide_Ayaat}
                  Hover_Translation={Hover_Translation}
                  Inline_Translation={Inline_Translation}
                  Inline_Transliteration={Inline_Transliteration}
                  Font_Class={Resolve_Font_Family_Class_Name()}
                  Arabic_Font_Size={Arabic_Font_Size}
                  Translation_Font_Size={Translation_Font_Size_Value}
                  Transliteration_Font_Size={Transliteration_Font_Size_Value}
                  Show_Transliteration={Show_Transliteration}
                  Ayah_Reference={Ayah_References}
                  Hide_Ayaat={Hide_Ayaat}
                  Hide_Ayah_Markers={Hide_Verse_Markers}
                />
              </div>
              <div className="flex items-center justify-center pb-1">
                <span className="text-sm text-muted-foreground font-medium">
                  Juz - {Current_Juz} | Page - {Page_Number} | Hizb - {currentHizb}
                </span>
              </div>
            </Container>
          ) : (
            <Ayah_List
              Surah={Assembled_Surah_Metadata}
              Ayah={[Assembled_Ayah_Object]}
              Kalimah={[]}
              Show_Arabic_Text={Show_Arabic_Text && !Hide_Ayaat}
              Show_Translation={Ayah_Translation}
              Show_Transliteration={Show_Transliteration}
              Translation_Font_Size={Translation_Font_Size_Value}
              Transliteration_Font_Size={Transliteration_Font_Size_Value}
              Hover_Translation={Hover_Translation !== "None" ? Hover_Translation : undefined}
              Inline_Translation={Inline_Translation !== "None" ? Inline_Translation : undefined}
              Inline_Transliteration={Inline_Transliteration !== "None" ? Inline_Transliteration : undefined}
              Target_Ayah={String(Ayah_Number)}
              Ayah_Reference={Ayah_References}
              On_Notes_Click={(Ayah_ID: number) => {
                const v = Ayaat?.find((v: any) => v.Ayah_Number === Ayah_ID);
                Set_Notes_Dialog({ Open: true, Ayah_ID, Ayah: v });
              }}
              On_Share_Click={(Ayah_ID: number, Ayah_Text?: string, Translation?: string) =>
                Set_Share_Dialog({ Open: true, Ayah_ID, Ayah_Text, Translation })
              }
              On_Tafsir_Click={(Ayah_ID: number) => Set_Tafsir_Dialog_State({ Open: true, Ayah_Number: Ayah_ID })}
              On_Render_Click={(Ayah_ID: number) => Set_Render_Dialog({ Open: true, Mode: "render", Ayah: Ayah_ID })}
              On_Embed_Click={(Ayah_ID: number) => Set_Render_Dialog({ Open: true, Mode: "embed", Ayah: Ayah_ID })}
            />
          )}

          <div className="flex items-center justify-center gap-2 py-2 mt-2">
            {Ayah_Number > 1 ? (
              <Link to={`/Quran/Surah/${Surah_ID}/Ayah/${Ayah_Number - 1}`}>
                <Button size="icon" className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>
            ) : Previous_Surah ? (
              <Link to={`/Quran/Surah/${Previous_Surah.id}/Ayah/1`}>
                <Button size="icon" className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>
            ) : null}

            {Ayah_Number < Surah.Number_Of_Ayaat ? (
              <Link to={`/Quran/Surah/${Surah_ID}/Ayah/${Ayah_Number + 1}`}>
                <Button size="icon" className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : Next_Surah ? (
              <Link to={`/Quran/Surah/${Next_Surah.id}/Ayah/1`}>
                <Button size="icon" className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {Record_Audio_Enabled && (
        <Audio_Controls
          Is_Recording={Is_Deepgram_Recording_Active}
          On_Record_Toggle={Handle_Audio_Recording_Toggle}
          On_Test_Audio={Send_Audio_Playback_Test}
          Hide_Ayaat={Hide_Ayaat}
          On_Hide_Ayaat_Toggle={Set_Hide_Ayaat}
          Transcript={Transcript}
        />
      )}

      <Audio_Player
        Is_Visible={Show_Audio_Player}
        On_Close={() => { Stop_Current_Audio(); Set_Show_Audio_Player(false); }}
        Surah_ID={Surah_ID}
        Surah_Name={Surah.English_Name}
      />
      <Notes_Dialog
        Open={Notes_Dialog.Open}
        On_Open_Change={(Open) => Set_Notes_Dialog({ ...Notes_Dialog, Open })}
        Surah_ID={Surah_ID}
        Ayah_ID={Notes_Dialog.Ayah_ID}
        Ayah={Notes_Dialog.Ayah}
      />
      <Share_Dialog
        Open={Share_Dialog.Open}
        On_Open_Change={(Open) => Set_Share_Dialog({ ...Share_Dialog, Open })}
        Surah_ID={Surah_ID}
        Surah_Name={Surah.English_Name}
        Ayah_ID={Share_Dialog.Ayah_ID}
        Ayah_Text={Share_Dialog.Ayah_Text}
        Translation={Share_Dialog.Translation}
      />
      <Surah_Info_Dialog
        Open={Surah_Info_Dialog_State}
        On_Open_Change={Set_Surah_Info_Dialog_State}
        Surah_ID={Surah_ID}
      />
      <Tafsir_Dialog
        Open={Tafsir_Dialog_State.Open}
        On_Open_Change={(Open) => Set_Tafsir_Dialog_State(prev => ({ ...prev, Open }))}
        Surah_ID={Surah_ID}
        Ayah_Number={Tafsir_Dialog_State.Ayah_Number}
      />
      <Render_Surah_Dialog
        Open={Render_Dialog.Open}
        On_Open_Change={(o) => Set_Render_Dialog((p) => ({ ...p, Open: o }))}
        Surah_ID={Surah_ID}
        Ayah_Number={Render_Dialog.Ayah}
        Mode={Render_Dialog.Mode}
      />
    </Layout>
  );
};

export default Ayah;