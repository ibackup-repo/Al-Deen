// Surah/Index.tsx
import { useParams, useSearchParams, Link } from "react-router-dom";
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
import { AlertCircle, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Alert, Alert_Description } from "@Web/Component/UI/Alert";
import { Audio_Controls } from "@Web/Component/Quran/Record";
import { Use_Deepgram } from "@/Hook/Use-STT";

import { Fetch_Suwar, Fetch_Surah_Details } from "@/Library/Quran-API";
import type { Surah_Details } from "@/Library/Quran-API";
import type { Surah_Metadata, Ayah } from "@/Library/Quran-Types";

const Surah = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const Surah_ID = parseInt(id || "1", 10);
  const Target_Ayah = searchParams.get("Ayah");

  const {
    layout,
    fontSize,
    Translation_Font_Size,
    Quran_Font,
    Show_Arabic_Text,
    Ayah_Translation,
    Active_Translation_IDs,
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
    Hifz,
  } = Use_App();

  const [Surah_List, Set_Surah_List] = useState<Surah_Metadata[]>([]);
  const [Surah_Detail_Object, Set_Surah_Detail_Object] = useState<Surah_Details | null>(null);
  const [Is_Loading_Detail_State, Set_Is_Loading_Detail_State] = useState<boolean>(true);
  const [Load_Error_Message, Set_Load_Error_Message] = useState<string | null>(null);

  const Active_Translations = useMemo(() => {
    return Array.isArray(Active_Translation_IDs) ? Active_Translation_IDs : [];
  }, [Active_Translation_IDs]);

  const Active_Transliteration_Collection = useMemo(() => {
    return Selected_Ayah_Transliterator && Selected_Ayah_Transliterator !== "None"
      ? [Selected_Ayah_Transliterator]
      : [];
  }, [Selected_Ayah_Transliterator]);

  const KBK_Translation_IDs = useMemo(() => {
    return Array.from(
      new Set(
        [Hover_Translation, Inline_Translation].filter(
          (id): id is string => Boolean(id) && id !== "None"
        )
      )
    );
  }, [Hover_Translation, Inline_Translation]);

  const KBK_Transliteration_IDs = useMemo(() => {
    return Array.from(
      new Set(
        [Hover_Transliteration, Inline_Transliteration].filter(
          (id): id is string => Boolean(id) && id !== "None"
        )
      )
    );
  }, [Hover_Transliteration, Inline_Transliteration]);

  const Active_Translations_Cache_Key = Active_Translations.join(",");
  const Active_Transliteration_Cache_Key = Active_Transliteration_Collection.join(",");
  const KBK_Translations_Cache_Key = KBK_Translation_IDs.join(",");
  const KBK_Transliterations_Cache_Key = KBK_Transliteration_IDs.join(",");

  useEffect(() => {
    let Cancelled = false;
    Fetch_Suwar()
      .then((list) => {
        if (!Cancelled) Set_Surah_List(list);
      })
      .catch((err) => {
        console.warn("Could not fetch Surah list for navigation:", err);
      });

    return () => {
      Cancelled = true;
    };
  }, []);

  useEffect(() => {
    let Cancelled = false;
    Set_Load_Error_Message(null);
    Set_Is_Loading_Detail_State(true);

    Fetch_Surah_Details(
      Surah_ID,
      Active_Translations,
      Active_Transliteration_Collection,
      KBK_Translation_IDs,
      KBK_Transliteration_IDs
    )
      .then((detail) => {
        if (Cancelled) return;
        Set_Surah_Detail_Object(detail);
      })
      .catch((err) => {
        if (Cancelled) return;
        console.error(`error Loading Surah ${Surah_ID}:`, err);
        Set_Surah_Detail_Object((current) => {
          if (!current) {
            Set_Load_Error_Message(err.message || `Failed to load Surah ${Surah_ID}`);
          }
          return current;
        });
      })
      .finally(() => {
        if (!Cancelled) Set_Is_Loading_Detail_State(false);
      });

    return () => {
      Cancelled = true;
    };
  }, [
    Surah_ID,
    Active_Translations_Cache_Key,
    Active_Transliteration_Cache_Key,
    KBK_Translations_Cache_Key,
    KBK_Transliterations_Cache_Key,
  ]);

  const Show_Transliteration = Selected_Ayah_Transliterator !== "None";
  const { stop: Stop_Current_Audio, Play_Full_Surah } = Use_Audio();

  const Surah_Metadata_Object = Surah_Detail_Object?.Surah;
  const Ayaat = Surah_Detail_Object?.Ayah;
  const Kalimaat = Surah_Detail_Object?.Words;
  const Translations = Surah_Detail_Object?.Translations;
  const Transliterations = Surah_Detail_Object?.Transliterations;
  const Word_Translations = Surah_Detail_Object?.Word_Translations;
  const Word_Transliterations = Surah_Detail_Object?.Word_Transliterations;
  const Footnotes = Surah_Detail_Object?.Footnotes;

  const { Update_Progress } = Use_Reading_Progress();
  const { Start_Session, Stop_Session, Save_Seconds_To_Goal, Is_Tracking_Enabled } = Use_Reading_Session();
  const { Active_Goal } = Use_Quran_Goals();

  const [Show_Audio_Player, Set_Show_Audio_Player] = useState(false);
  const [, Set_Reading_Progress] = useState(0);
  const [Surah_Info_Dialog_State, Set_Surah_Info_Dialog_State] = useState(false);
  const [Render_Dialog, Set_Render_Dialog] = useState<{ Open: boolean; Ayah?: number; Mode: "render" | "embed" }>({ Open: false, Mode: "render" });
  const [Tafsir_Dialog_State, Set_Tafsir_Dialog_State] = useState<{ Open: boolean; Ayah_ID: number }>({ Open: false, Ayah_ID: 1 });
  const [Notes_Dialog_State, Set_Notes_Dialog_State] = useState<{ Open: boolean; Ayah_ID?: number; Ayah?: any }>({ Open: false });
  const [Share_Dialog_State, Set_Share_Dialog_State] = useState<{ Open: boolean; Ayah_ID?: number; Ayah_Text?: string; Translation?: string }>({ Open: false });

  const [Visible_Ayah_Index, Set_Visible_Ayah_Index] = useState(1);

  const Handle_Ayah_Completion = useCallback((Completed_Ayah: number) => {
    const next = Completed_Ayah + 1;
    const el = Ayah_References.current.get(next);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const {
    Toggle_Recording,
    Is_Recording: Is_Deepgram_Recording_Active,
    Transcript,
  } = Use_Deepgram({
    Surah_ID,
    Ayaat,
    Visible_Ayah_Index,
    Hifz,
    On_Ayah_Complete: Handle_Ayah_Completion,
  });

  const Send_Audio_Playback_Test = useCallback(() => {
    Set_Show_Audio_Player(true);
    Play_Full_Surah(Surah_ID);
  }, [Surah_ID, Play_Full_Surah]);

  const Handle_Audio_Recording_Toggle = () => Toggle_Recording();

  const Ayah_References = useRef<Map<number, HTMLDivElement>>(new Map());
  const Container_Reference = useRef<HTMLDivElement>(null);
  const Reading_Session_Interval_Reference = useRef<NodeJS.Timeout | null>(null);

  const Is_Page_Layout = layout === "page";
  const Is_Time_Goal_Type = Active_Goal?.Goal_Type === "time_based";
  const Should_Track_Reading_Session = Is_Tracking_Enabled && Is_Time_Goal_Type;

  const Previous_Surah = useMemo(() => {
    if (!Surah_List.length) return null;
    return Surah_List.find((s) => s.Surah === Surah_ID - 1) || null;
  }, [Surah_List, Surah_ID]);

  const Next_Surah = useMemo(() => {
    if (!Surah_List.length) return null;
    return Surah_List.find((s) => s.Surah === Surah_ID + 1) || null;
  }, [Surah_List, Surah_ID]);

  const { Current_Juz, Current_Hizb } = useMemo(() => {
    if (!Surah_Metadata_Object) return { Current_Juz: 1, Current_Hizb: 1 };
    const Page_Number = Surah_Metadata_Object.Start_Page || 1;
    const Juz_Number = Math.ceil(Page_Number / 20);
    return {
      Current_Juz: Juz_Number,
      Current_Hizb: (Juz_Number - 1) * 2 + 1,
    };
  }, [Surah_Metadata_Object]);

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

  const Handle_Window_Scroll_Event = useCallback(() => {
    if (!Container_Reference.current || !Ayaat?.length) return;
    const Container = Container_Reference.current;
    const scrollPosition = window.scrollY - Container.offsetTop + window.innerHeight;
    const Render_Progress = Math.min(100, Math.max(0, (scrollPosition / Container.scrollHeight) * 100));
    Set_Reading_Progress(Render_Progress);
    let newVisibleVerse = 1;
    Ayah_References.current.forEach((element, verseId) => {
      const rect = element.getBoundingClientRect();
      if (rect.top <= window.innerHeight / 2 && rect.bottom >= 0) {
        newVisibleVerse = verseId;
      }
    });
    Set_Visible_Ayah_Index(newVisibleVerse);
    if (newVisibleVerse > 1) Update_Progress(Surah_ID, newVisibleVerse);
  }, [Ayaat, Surah_ID, Update_Progress]);

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
      void (async () => {
        const Seconds = await Stop_Session();
        if (Seconds > 0 && Active_Goal) Save_Seconds_To_Goal(Active_Goal.id, Seconds);
      })();
    };
  }, [Should_Track_Reading_Session, Active_Goal, Start_Session, Stop_Session, Save_Seconds_To_Goal]);

  useEffect(() => {
    window.addEventListener("scroll", Handle_Window_Scroll_Event);
    return () => window.removeEventListener("scroll", Handle_Window_Scroll_Event);
  }, [Handle_Window_Scroll_Event]);

  useEffect(() => {
    if (Target_Ayah && Ayaat) {
      const Ayah_ID = parseInt(Target_Ayah, 10);
      const el = Ayah_References.current.get(Ayah_ID);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
    } else if (!Target_Ayah && !Is_Loading_Detail_State && Ayaat) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [Surah_ID, Target_Ayah, Ayaat, Is_Loading_Detail_State]);

  const Scroll_Window_To_Top = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const Render_Page_Footer_Element = useCallback(
    (Page_Number: number) => (
      <span className="text-sm text-muted-foreground font-medium">
        Juz - {Current_Juz} | Page - {Page_Number} | Hizb - {Current_Hizb}
      </span>
    ),
    [Current_Juz, Current_Hizb]
  );

  const Handle_Notes_Dialog_Open = useCallback(
    (Ayah_ID: number, Text_Arabic?: string) => {
      const Target_Verse_Object = Ayaat?.find((v: Ayah) => v.Ayah === Ayah_ID);
      Set_Notes_Dialog_State({
        Open: true,
        Ayah_ID,
        Ayah: Target_Verse_Object ?? { Surah: Surah_ID, Ayah: Ayah_ID, Text: Text_Arabic },
      });
    },
    [Ayaat, Surah_ID]
  );

  const Handle_Share_Dialog_Open = useCallback(
    (Ayah_ID: number, Text_Arabic?: string, Translation?: string) => {
      Set_Share_Dialog_State({ Open: true, Ayah_ID, Ayah_Text: Text_Arabic, Translation });
    },
    []
  );

  const Handle_Tafsir_Dialog_Open = useCallback((Ayah_ID: number) => {
    Set_Tafsir_Dialog_State({ Open: true, Ayah_ID: Ayah_ID });
  }, []);

  const Handle_Embed_Dialog_Open = useCallback((Ayah_ID: number) => {
    Set_Render_Dialog({ Open: true, Mode: "embed", Ayah: Ayah_ID });
  }, []);

  const Handle_Render_Dialog_Open = useCallback((Ayah_ID: number) => {
    Set_Render_Dialog({ Open: true, Mode: "render", Ayah: Ayah_ID });
  }, []);

  if (Load_Error_Message) {
    return (
      <Layout Hide_Footer>
        <div className="w-full max-w-[19em] mx-auto px-4 pt-28" style={{ fontSize: Arabic_Font_Size }}>
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <Alert_Description>{Load_Error_Message}</Alert_Description>
          </Alert>
          <div className="text-center space-x-4">
            <Button onClick={() => window.location.reload()}>Reload Page</Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!Surah_Metadata_Object || !Surah_Detail_Object) {
    return null;
  }

  if (!Ayaat || !Array.isArray(Ayaat) || Ayaat.length === 0) {
    return (
      <Layout Hide_Footer>
        <div className="w-full max-w-[19em] mx-auto px-4 pt-28" style={{ fontSize: Arabic_Font_Size }}>
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <Alert_Description>No Ayaat found for this Surah collection map.</Alert_Description>
          </Alert>
          <div className="text-center">
            <Button onClick={() => window.location.reload()}>Reload Page</Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Fallback transliteration text lookup
  const Transliteration_Name =
    Surah_Metadata_Object.Transliteration ||
    (Transliterations && Transliterations[0]?.Text) ||
    "";

  const Surah_Meta = {
    Surah: Surah_Metadata_Object.Surah ?? Surah_ID,
    Translation: Surah_Metadata_Object.Translation || "",
    Transliteration: Transliteration_Name,
  };

  return (
    <Layout Hide_Footer>
      <div style={{ fontSize: Arabic_Font_Size }} className="w-full max-w-[19em] mx-auto pt-0 px-0">
        <Surah_Header
          Surah={Surah_Meta}
          Arabic_Font_Size={Arabic_Font_Size}
          On_Info_Click={() => Set_Surah_Info_Dialog_State(true)}
          On_Audio_Click={() => Set_Show_Audio_Player(true)}
          On_Tafsir_Click={() => Set_Tafsir_Dialog_State({ Open: true, Ayah_ID: 1 })}
          On_Render_Click={() => Set_Render_Dialog({ Open: true, Mode: "render" })}
        />

        <div ref={Container_Reference} className="w-full">
          {Is_Page_Layout ? (
            <Page_View
              Surah={Surah_Metadata_Object}
              Show_Arabic_Text={Show_Arabic_Text}
              Hover_Translation={Hover_Translation}
              Hover_Transliteration={Hover_Transliteration}
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
              Page_Footer={Render_Page_Footer_Element}
            />
          ) : (
            <Ayah_List
              Surah={Surah_Metadata_Object}
              Ayah={Ayaat}
              Kalimah={Kalimaat}
              Translation={Translations}
              Transliteration={Transliterations}
              KBK_Translation={Word_Translations}
              KBK_Transliteration={Word_Transliterations}
              Footnote={Footnotes}
              Show_Arabic_Text={Show_Arabic_Text && !Hide_Ayaat}
              Show_Translation={Ayah_Translation}
              Show_Transliteration={Show_Transliteration}
              Translation_Font_Size={Translation_Font_Size_Value}
              Transliteration_Font_Size={Transliteration_Font_Size_Value}
              Hover_Translation={Hover_Translation}
              Hover_Transliteration={Hover_Transliteration}
              Inline_Translation={Inline_Translation}
              Inline_Transliteration={Inline_Transliteration}
              Target_Ayah={Target_Ayah}
              Ayah_Reference={Ayah_References}
              On_Notes_Click={Handle_Notes_Dialog_Open}
              On_Share_Click={Handle_Share_Dialog_Open}
              On_Tafsir_Click={Handle_Tafsir_Dialog_Open}
              On_Embed_Click={Handle_Embed_Dialog_Open}
              On_Render_Click={Handle_Render_Dialog_Open}
            />
          )}

          <div className="flex items-center justify-center gap-2 py-2">
            {Previous_Surah && (
              <Link to={`/Quran/Surah/${Previous_Surah.Surah}`}>
                <Button size="icon" className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <Button onClick={Scroll_Window_To_Top} size="icon" className="h-8 w-8">
              <ChevronUp className="h-4 w-4" />
            </Button>
            {Next_Surah && (
              <Link to={`/Quran/Surah/${Next_Surah.Surah}`}>
                <Button size="icon" className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
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
        Surah_Name={Surah_Metadata_Object.Transliteration}
      />
      <Notes_Dialog
        Open={Notes_Dialog_State.Open}
        On_Open_Change={(Open) => Set_Notes_Dialog_State((prev) => ({ ...prev, Open }))}
        Surah_ID={Surah_ID}
        Ayah_ID={Notes_Dialog_State.Ayah_ID}
        Ayah={Notes_Dialog_State.Ayah}
      />
      <Share_Dialog
        Open={Share_Dialog_State.Open}
        On_Open_Change={(Open) => Set_Share_Dialog_State((prev) => ({ ...prev, Open }))}
        Surah_ID={Surah_ID}
        Surah_Name={Surah_Metadata_Object.Transliteration}
        Ayah_ID={Share_Dialog_State.Ayah_ID}
        Ayah_Text={Share_Dialog_State.Ayah_Text}
        Translation={Share_Dialog_State.Translation}
      />
      <Surah_Info_Dialog Open={Surah_Info_Dialog_State} On_Open_Change={Set_Surah_Info_Dialog_State} Surah_ID={Surah_ID} />
      <Tafsir_Dialog Open={Tafsir_Dialog_State.Open} On_Open_Change={(Open) => Set_Tafsir_Dialog_State(prev => ({ ...prev, Open }))}
        Surah_ID={Surah_ID} Ayah_ID={Tafsir_Dialog_State.Ayah_ID} />
      <Render_Surah_Dialog
        Open={Render_Dialog.Open}
        On_Open_Change={(o) => Set_Render_Dialog((p) => ({ ...p, Open: o }))}
        Surah_ID={Surah_ID}
        Ayah_ID={Render_Dialog.Ayah}
        Mode={Render_Dialog.Mode}
      />
    </Layout>
  );
};

export default Surah;