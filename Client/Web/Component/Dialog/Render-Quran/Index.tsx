// @Web/Component/Dialog/Render-Surah-Dialog.tsx
import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { Render_Surah_Preview } from "./Preview";
import { Render_Surah_Sidebar } from "./Sidebar";
import { type Properties, type Config, Resolutions, Ensure_Readable, Font_Class, Pos_Classes } from "./Types";
import { Use_Render_Surah_State } from "./State";
import { Process_Video_Render } from "./Processor";
import { useQuery } from "@tanstack/react-query";
import { Use_Back_Handler } from "@/Hook/Use-Back-Handler";
import { Use_App } from "@Web/Context/App";
import { Toast } from "@/Hook/Use-Toast";
import { Class_Names } from "@/Library/Utility";

const Backend_Base_URL = "https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev";

async function Fetch_Quran_Corpus_From_Backend() {
  const Response_Context = await fetch(`${Backend_Base_URL}/api/Quran-Corpus`);
  if (!Response_Context.ok) throw new Error("Failed to load unified Quran Corpus data map");
  return Response_Context.json();
}

export function Render_Surah_Dialog({ Open, On_Open_Change, Surah_ID, Ayah_ID, Mode = "render" }: Properties) {
  Use_Back_Handler(Open, () => On_Open_Change(false));
  const App_Context = Use_App();
  const Preview_Wrap_Ref = useRef<HTMLDivElement>(null);
  const Cancel_Reference = useRef(false);

  const { data: Corpus_Data } = useQuery({
    queryKey: ["Quran_Corpus_Backend"],
    queryFn: Fetch_Quran_Corpus_From_Backend,
    staleTime: 1000 * 60 * 30,
    enabled: Open,
  });

  const Surah_List = useMemo(() => Corpus_Data?.Suwar || [], [Corpus_Data]);

  const { Config_Settings, Set_Configuration, ecfg, Surah_Data, Extra_Translations, Extra_Transliterations } = 
    Use_Render_Surah_State(Surah_ID, Ayah_ID, Mode, App_Context, Open);

  const [fullscreen, Set_Is_Fullscreen] = useState(false);
  const [Is_Rendering, Set_Is_Rendering] = useState(false);
  const [Render_Progress, Set_Render_Progress] = useState(0);
  const [Result_Url, Set_Result_Url] = useState<string | null>(null);
  const [Result_Extension, Set_Result_Extension] = useState("webm");
  const [Result_Size, Set_Result_Size] = useState(0);

  useEffect(() => () => { if (Result_Url) URL.revokeObjectURL(Result_Url); }, [Result_Url]);

  useEffect(() => {
    if (Open) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [Open]);

  // Safe Ayah Range resolution
  const Start_Range = Config_Settings?.Ayah_Start ?? 1;
  const End_Range = Config_Settings?.Ayah_End ?? 999;

  const Filtered_Verses = useMemo(() => 
    (Surah_Data?.Ayaat ?? []).filter((Verse_Item) => {
      if (!Verse_Item) return false;
      const verseNum = Verse_Item.Ayah_ID ?? Verse_Item.Ayah ?? 0;
      return verseNum >= Start_Range && verseNum <= End_Range;
    }),
    [Surah_Data, Start_Range, End_Range]
  );

  const Container_Bg_Color_For_Contrast = Config_Settings?.Container_Bg_Kind === "color" 
    ? (Config_Settings?.Container_Bg ?? "#000000") 
    : (Config_Settings?.Bg_Color ?? "#000000");

  const colors = useMemo(() => ({
    Arabic_Color: Config_Settings?.Auto_Contrast ? Ensure_Readable(Config_Settings?.Arabic_Color ?? "#FFFFFF", Container_Bg_Color_For_Contrast) : (Config_Settings?.Arabic_Color ?? "#FFFFFF"),
    Translation_Color: Config_Settings?.Auto_Contrast ? Ensure_Readable(Config_Settings?.Translation_Color ?? "#FFFFFF", Container_Bg_Color_For_Contrast) : (Config_Settings?.Translation_Color ?? "#FFFFFF"),
    Transliteration_Color: Config_Settings?.Auto_Contrast ? Ensure_Readable(Config_Settings?.Transliteration_Color ?? "#FFFFFF", Container_Bg_Color_For_Contrast) : (Config_Settings?.Transliteration_Color ?? "#FFFFFF"),
    Highlight_Color: Config_Settings?.Auto_Contrast ? Ensure_Readable(Config_Settings?.Highlight_Color ?? "#FF0000", Container_Bg_Color_For_Contrast) : (Config_Settings?.Highlight_Color ?? "#FF0000"),
  }), [Config_Settings, Container_Bg_Color_For_Contrast]);

  const Preview_Size = useMemo(() => {
    if (Mode === "embed") {
      return { w: Config_Settings?.width ?? 1280, h: Config_Settings?.height ?? 720 };
    }
    const resKey = Config_Settings?.resolution ?? "1080p";
    const resObj = Resolutions[resKey] ?? { w: 1920, h: 1080 };
    return { w: resObj.w, h: resObj.h };
  }, [Mode, Config_Settings]);

  const Preview_Aspect_Ratio = (Preview_Size.w || 1920) / (Preview_Size.h || 1080);
  const Embed_Snippet = useMemo(() => { return `<iframe>...</iframe>` }, [Config_Settings, ecfg]);

  const On_File_Change = (field: "Bg_Url" | "Logo_Url" | "Container_Bg_Url", kindField?: "image" | "video") => (Event_Payload: React.ChangeEvent<HTMLInputElement>) => {
    const Uploaded_File = Event_Payload.target.files?.[0]; if (!Uploaded_File) return;
    Set_Configuration((Previous_Config) => ({
      ...Previous_Config,
      [field]: URL.createObjectURL(Uploaded_File),
      ...(kindField && field === "Bg_Url" ? { Bg_Kind: kindField, Bg_File: Uploaded_File } : {}),
    }));
  };

  const Handle_Render = useCallback(async () => {
    if (Is_Rendering) return;
    if (!Surah_Data || Filtered_Verses.length === 0) return Toast({ title: "Content Loading" });

    Cancel_Reference.current = false; 
    Set_Is_Rendering(true); 
    Set_Render_Progress(0);

    try {
      const Render_Output = await Process_Video_Render({ 
        Configuration: Config_Settings, 
        Effective_Configuration: ecfg, 
        Ayaat: Filtered_Verses, 
        Extra_Translations, 
        Extra_Transliterations, 
        Preview_Size, 
        colors: colors, 
        Set_Progress: Set_Render_Progress, 
        Should_Cancel: () => Cancel_Reference.current 
      });

      Set_Result_Url(Render_Output.url);
      Set_Result_Extension(Render_Output.ext);
      Set_Result_Size(Render_Output.size);

      const Anchor_Element = document.createElement("a");
      Anchor_Element.href = Render_Output.url; 
      Anchor_Element.download = `Surah-${Config_Settings?.Surah_ID ?? Surah_ID}.${Render_Output.ext}`;
      document.body.appendChild(Anchor_Element); 
      Anchor_Element.click(); 
      Anchor_Element.remove();
    } catch (Error_Context) {
      Toast({ title: "Render failed", variant: "destructive" });
    } finally { 
      Set_Is_Rendering(false); 
    }
  }, [Is_Rendering, Surah_Data, Filtered_Verses, Config_Settings, ecfg, Extra_Translations, Extra_Transliterations, Preview_Size, colors, Surah_ID]);

  if (!Config_Settings) return null;

  const Preview_Component = (
    <Render_Surah_Preview 
      Mode={Mode} 
      Config_Settings={Config_Settings} 
      ecfg={ecfg} 
      Ayaat={Filtered_Verses} 
      Current_Verse_Idx={0} 
      Preview_Wrap_Ref={Preview_Wrap_Ref} 
      Preview_Aspect_Ratio={Preview_Aspect_Ratio} 
      fullscreen={fullscreen} 
      Set_Is_Fullscreen={Set_Is_Fullscreen} 
      Embed_Snippet={Embed_Snippet} 
      Is_Intro_Visible={Boolean(Config_Settings?.Add_Intro)} 
      Is_Outro_Visible={Boolean(Config_Settings?.Add_Outro)} 
      colors={colors} 
      Page_Font_Family={() => "Uthmani"} 
      Font_Class={Font_Class} 
      Pos_Classes={Pos_Classes} 
      cornerCls={{tl:"Top-3 left-3", tr:"Top-3 right-3", bl:"bottom-3 left-3", br:"bottom-3 right-3"}} 
      Our_Logo_Corner="tr" 
    />
  );

  return (
    Open ? (
    <div className="fixed inset-0 z-40 bg-background overflow-y-auto lg:overflow-hidden w-screen h-screen m-0 p-0 overscroll-behavior-contain">
      <div className="w-full h-full box-border m-0 p-0 px-2 sm:px-4 pb-0">
        <div className={Class_Names(
          "grid gap-3 h-auto lg:h-full items-stretch w-full m-0 p-0", 
          fullscreen ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[360px_1fr]"
        )}>
          {!fullscreen && (
            <div className="h-auto lg:h-full w-full m-0 p-0 overflow-visible lg:overflow-hidden">
              <Render_Surah_Sidebar 
                Mode={Mode} 
                Config_Settings={Config_Settings} 
                Set_Configuration={Set_Configuration} 
                Surah_List={Surah_List} 
                All_Ayaat={Surah_Data?.Ayaat ?? []} 
                Is_Rendering={Is_Rendering} 
                Render_Progress={Render_Progress} 
                Result_Url={Result_Url} 
                Result_Size={Result_Size} 
                Result_Extension={Result_Extension} 
                Embed_Snippet={Embed_Snippet} 
                Cancel_Reference={Cancel_Reference} 
                Handle_Render={Handle_Render} 
                On_File_Change={On_File_Change}
              >
                {Preview_Component}
              </Render_Surah_Sidebar>
            </div>
          )}
          
          <div className="hidden lg:block h-full w-full pt-14 pb-0 pl-0 pr-0 m-0 overflow-hidden box-border">
            {Preview_Component}
          </div>
        </div>
      </div>
    </div>
    ) : null
  );
}