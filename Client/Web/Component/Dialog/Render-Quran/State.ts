// @Web/Component/Dialog/Use-Render-Surah-State.ts
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Config, type Render_Font, Font_To_Type } from "./Types";

const Backend_Base_URL = "https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev";

export interface Assembled_Ayah {
  Ayah_ID: number;
  Arabic: string;
  Translation?: string;
  Transliteration?: string;
  Kalimaat: string[];
  KBK_Translation?: string[];
  KBK_Translation_Hover?: string[];
  KBK_Translation_Inline?: string[];
}

export interface Assembled_Surah {
  id: number;
  English_Name: string;
  English_Name_Transliteration: string;
  Number_Of_Ayaat: number;
  Ayaat: Assembled_Ayah[];
}

async function Fetch_Surah_From_Backend(
  Surah_ID: number, 
  Options: { Font_Type: string; Translation?: string; Transliteration?: string; KBK_Translation_Inline?: string; KBK_Transliteration_Inline?: string }
): Promise<Assembled_Surah> {
  const Query_Parameters = new URLSearchParams({
    Font_Type: Options.Font_Type,
    ...(Options.Translation && { Translation: Options.Translation }),
    ...(Options.Transliteration && { Transliteration: Options.Transliteration }),
    ...(Options.KBK_Translation_Inline && { KBK_Translation_Inline: Options.KBK_Translation_Inline }),
    ...(Options.KBK_Transliteration_Inline && { KBK_Transliteration_Inline: Options.KBK_Transliteration_Inline }),
  });

  const Response_Context = await fetch(`${Backend_Base_URL}/api/Surah/${Surah_ID}?${Query_Parameters.toString()}`);
  if (!Response_Context.ok) throw new Error(`Failed to fetch Surah data for ID: ${Surah_ID}`);
  return Response_Context.json();
}

export function Use_Render_Surah_State(
  Surah_ID: number, 
  Ayah_ID: number | undefined, 
  Mode: "render" | "embed", 
  App_Context: any, 
  Open: boolean
) {
  const [Configuration, Set_Configuration] = useState<Config>(() => ({
    resolution: "1080p",
    width: 600,
    height: 480,
    Export_Format: "webm",
    Reciter: "Mishari Al-Afasy",
    Surah_ID,
    Ayah_Start: Ayah_ID ?? 1,
    Ayah_End: Ayah_ID ?? 1,
    Bg_Kind: "color",
    Bg_Color: "#0b1f17",
    Bg_Url: "",
    Container_Bg_Kind: "color",
    Container_Bg: "transparent",
    Container_Bg_Url: "",
    Border_Color: "#ffffff",
    Border_Width: 0,
    Border_Radius: 24,
    Arabic_Color: "#111827",
    Translation_Color: "#374151",
    Transliteration_Color: "#6b7280",
    Highlight_Color: "#16a34a",
    Auto_Contrast: true,
    Logo_Url: "",
    Logo_Corner: "tr",
    Add_Intro: false,
    Intro_Url: "",
    Add_Outro: false,
    Outro_Url: "",
    Audio_Playback: true,
    Show_Tafsir: true,
    Show_Copy: true,
    Show_Share: false,
    Hover_Tooltip: true,
    Arabic_Position: "center",
    Translation_Position: "bottom-center",
    Transliteration_Position: "bottom-center",
    Show_Lines: false,
    Lines_Count: 8,
    Show_Watermark: true,
    Watermark_Text: "Al-Deen.org",
  }));

  const Effective_Configuration = useMemo(() => {
    const Translations_List = App_Context.Selected_Translations?.length 
      ? App_Context.Selected_Translations.map((Item: string) => Item === "Translation" ? "Direct" : Item) 
      : ["None"];
    const Transliterations_List = App_Context.Selected_Ayah_Transliterator && App_Context.Selected_Ayah_Transliterator !== "None" 
      ? [App_Context.Selected_Ayah_Transliterator] 
      : ["None"];

    return {
      ...Configuration,
      font: App_Context.Quran_Font as Render_Font,
      Translations: Translations_List,
      Transliterations: Transliterations_List,
      Show_Wbw: true,
      Arabic_Size: 16 + (App_Context.fontSize ?? 3) * 6,
      Translation_Size: 12 + (App_Context.Translation_Font_Size ?? 3) * 3,
      Transliteration_Size: 12 + (App_Context.Transliteration_Size ?? 3) * 3,
    };
  }, [
    Configuration, 
    App_Context.Quran_Font, 
    App_Context.Selected_Translations, 
    App_Context.Selected_Ayah_Transliterator, 
    App_Context.fontSize, 
    App_Context.Translation_Font_Size, 
    App_Context.Transliteration_Size
  ]);

  const Inline_Wbw_Translation = App_Context.Inline_Translation !== "None" ? App_Context.Inline_Translation : undefined;
  const Inline_Wbw_Transliteration = App_Context.Inline_Transliteration !== "None" ? App_Context.Inline_Transliteration : undefined;

  const [Extra_Translations, Set_Extra_Translations] = useState<Record<string, string[]>>({});
  const [Extra_Transliterations, Set_Extra_Transliterations] = useState<Record<string, string[]>>({});

  const { data: Surah_Data } = useQuery({
    queryKey: [
      "renderSurahData", 
      Configuration.Surah_ID, 
      Effective_Configuration.font, 
      Effective_Configuration.Translations[0], 
      Effective_Configuration.Transliterations[0], 
      Inline_Wbw_Translation, 
      Inline_Wbw_Transliteration
    ],
    queryFn: () => Fetch_Surah_From_Backend(Configuration.Surah_ID, {
      Font_Type: Font_To_Type(Effective_Configuration.font),
      Translation: Effective_Configuration.Translations.find((Item) => Item !== "None"),
      Transliteration: Effective_Configuration.Transliterations.find((Item) => Item !== "None"),
      KBK_Translation_Inline: Inline_Wbw_Translation,
      KBK_Transliteration_Inline: Inline_Wbw_Transliteration,
    }),
    enabled: Open && !!Configuration.Surah_ID,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!Open) return;
    Set_Configuration((Previous) => ({ 
      ...Previous, 
      Surah_ID, 
      Ayah_Start: Ayah_ID ?? 1, 
      Ayah_End: Ayah_ID ?? Previous.Ayah_End 
    }));
  }, [Open, Surah_ID, Ayah_ID]);

  const Total_Ayaat = Surah_Data?.Ayaat.length ?? 0;
  useEffect(() => {
    if (!Total_Ayaat) return;
    Set_Configuration((Previous) => {
      const Start_Index = Math.max(1, Math.min(Previous.Ayah_Start, Total_Ayaat));
      const End_Index = Math.max(Start_Index, Math.min(Previous.Ayah_End || Total_Ayaat, Total_Ayaat));
      if (Start_Index === Previous.Ayah_Start && End_Index === Previous.Ayah_End) return Previous;
      return { ...Previous, Ayah_Start: Start_Index, Ayah_End: End_Index };
    });
  }, [Total_Ayaat]);

  useEffect(() => {
    if (!Open || !Configuration.Surah_ID) return;
    let Is_Cancelled = false;
    const Active_Sources = Effective_Configuration.Translations.filter((Item) => Item !== "None");
    
    Promise.all(Active_Sources.map((Source) =>
      Fetch_Surah_From_Backend(Configuration.Surah_ID, { 
        Font_Type: Font_To_Type(Effective_Configuration.font), 
        Translation: Source 
      })
        .then((Response) => [Source, Response.Ayaat.map((Ayah) => Ayah.Translation ?? "")] as const)
        .catch(() => [Source, [] as string[]] as const)
    )).then((Entries) => {
      if (Is_Cancelled) return;
      const Map_Result: Record<string, string[]> = {};
      Entries.forEach(([Key, Value]) => (Map_Result[Key] = Value));
      Set_Extra_Translations(Map_Result);
    });

    return () => { Is_Cancelled = true; };
  }, [Effective_Configuration.Translations, Configuration.Surah_ID, Effective_Configuration.font, Open]);

  useEffect(() => {
    if (!Open || !Configuration.Surah_ID) return;
    let Is_Cancelled = false;
    const Active_Sources = Effective_Configuration.Transliterations.filter((Item) => Item !== "None");
    
    Promise.all(Active_Sources.map((Source) =>
      Fetch_Surah_From_Backend(Configuration.Surah_ID, { 
        Font_Type: Font_To_Type(Effective_Configuration.font), 
        Transliteration: Source 
      })
        .then((Response) => [Source, Response.Ayaat.map((Ayah) => Ayah.Transliteration ?? "")] as const)
        .catch(() => [Source, [] as string[]] as const)
    )).then((Entries) => {
      if (Is_Cancelled) return;
      const Map_Result: Record<string, string[]> = {};
      Entries.forEach(([Key, Value]) => (Map_Result[Key] = Value));
      Set_Extra_Transliterations(Map_Result);
    });

    return () => { Is_Cancelled = true; };
  }, [Effective_Configuration.Transliterations, Configuration.Surah_ID, Effective_Configuration.font, Open]);

  return { 
    Configuration, 
    Set_Configuration, 
    Effective_Configuration, 
    Surah_Data: Surah_Data || null, 
    Extra_Translations, 
    Extra_Transliterations 
  };
}