// @Web/Component/Dialog/Render-Processor.ts
import { type Config } from "./Types";
import { Page_Font_Family } from "./Types";

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

interface Render_Ayah_Input {
  Ayah_ID: number;
  Arabic: string;
  Kalimaat: string[];
  Translation?: string;
  Transliteration?: string;
  Arabic_Font_Family: string;
  Mushaf_Page: number;
}

interface Render_Scene_Input {
  width: number;
  height: number;
  Arabic_Font_Family: string;
  Arabic_Size: number;
  Translation_Size: number;
  Transliteration_Size: number;
  Arabic_Color: string;
  Translation_Color: string;
  Transliteration_Color: string;
  Highlight_Color: string;
  Ayaat: Render_Ayah_Input[];
  Arabic_Position: Config["Arabic_Position"];
  Translation_Position: Config["Translation_Position"];
  Transliteration_Position: Config["Transliteration_Position"];
}

interface Render_Arguments {
  Configuration: Config;
  Effective_Configuration: Config & Record<string, any>;
  Ayaat: Assembled_Ayah[];
  Extra_Translations: Record<string, string[]>;
  Extra_Transliterations: Record<string, string[]>;
  Preview_Size: { w: number; h: number };
  colors: { Arabic_Color: string; Translation_Color: string; Transliteration_Color: string; Highlight_Color: string };
  Set_Progress: (Progress_Value: number) => void;
  Should_Cancel: () => boolean;
}

const Backend_Base_URL = "https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev";
const RENDER_SERVICE_URL = (import.meta.env.VITE_RENDER_SERVICE_URL as string | undefined)?.replace(/\/+$/, "");

const DEBUG = true;
function Debug_Log(...Arguments_List: any[]) {
  if (DEBUG) console.log("[render-processor]", ...Arguments_List);
}

function Parse_Range(Range_String: string): { start: number; end: number } {
  const [Start_Val, End_Val] = Range_String.split("-").map(Number);
  return { start: Start_Val, end: End_Val };
}

async function Fetch_Page_For_Verse(Surah_ID: number, Ayah_ID: number): Promise<number> {
  const Response_Context = await fetch(`${Backend_Base_URL}/api/Quran/page-lookup?Surah=${Surah_ID}&Ayah=${Ayah_ID}`);
  if (!Response_Context.ok) return 1;
  const Data_Context = await Response_Context.json();
  return Data_Context.page || 1;
}

async function Fetch_Surah_Timestamps(Surah_ID: number, Reciter_Key: string): Promise<string[][] | null> {
  try {
    const Response_Context = await fetch(`${Backend_Base_URL}/api/audio/timestamps?Surah=${Surah_ID}&Reciter=${encodeURIComponent(Reciter_Key)}`);
    if (!Response_Context.ok) return null;
    return await Response_Context.json();
  } catch {
    return null;
  }
}

async function Fetch_Surah_Audio_Url(Surah_ID: number, Reciter_Key: string): Promise<string | null> {
  try {
    const Response_Context = await fetch(`${Backend_Base_URL}/api/audio/url?Surah=${Surah_ID}&Reciter=${encodeURIComponent(Reciter_Key)}`);
    if (!Response_Context.ok) return null;
    const Data_Context = await Response_Context.json();
    return Data_Context.url || null;
  } catch {
    return null;
  }
}

export async function Process_Video_Render({
  Configuration, 
  Effective_Configuration, 
  Ayaat, 
  Extra_Translations, 
  Extra_Transliterations, 
  Preview_Size, 
  colors, 
  Set_Progress, 
  Should_Cancel
}: Render_Arguments): Promise<{ url: string; ext: string; size: number }> {

  Debug_Log("Configuration.Surah_ID:", Configuration.Surah_ID, "Configuration.Ayah_Start:", Configuration.Ayah_Start, "Configuration.Ayah_End:", Configuration.Ayah_End);
  Debug_Log("Configuration.Reciter (Raw_Storage_Data):", JSON.stringify(Configuration.Reciter));
  Debug_Log("Ayaat received:", Ayaat.length, "first Ayah#:", Ayaat[0]?.Ayah_ID, "last Ayah#:", Ayaat[Ayaat.length - 1]?.Ayah_ID);

  if (!RENDER_SERVICE_URL) {
    throw new Error("VITE_RENDER_SERVICE_URL is not set — check your .env and restart the dev server.");
  }

  const Primary_Translation = Effective_Configuration.Translations.find((Item: string) => Item !== "None");
  const Primary_Transliteration = Effective_Configuration.Transliterations.find((Item: string) => Item !== "None");
  const Translation_Array = Primary_Translation ? (Extra_Translations[Primary_Translation] ?? []) : [];
  const Transliteration_Array = Primary_Transliteration ? (Extra_Transliterations[Primary_Transliteration] ?? []) : [];

  const Render_Verses: Render_Ayah_Input[] = await Promise.all(
    Ayaat.map(async (Verse_Item, Index) => {
      const Page_Number = await Fetch_Page_For_Verse(Configuration.Surah_ID, Verse_Item.Ayah_ID);
      const Arabic_Font_Family = Page_Font_Family(Effective_Configuration.font, Configuration.Surah_ID, Verse_Item.Ayah_ID) ?? Effective_Configuration.font;

      return {
        Ayah_ID: Verse_Item.Ayah_ID,
        Arabic: Verse_Item.Arabic,
        Kalimaat: Verse_Item.Kalimaat,
        Translation: Primary_Translation ? (Translation_Array[Index] ?? Verse_Item.Translation) : Verse_Item.Translation,
        Transliteration: Primary_Transliteration ? (Transliteration_Array[Index] ?? Verse_Item.Transliteration) : Verse_Item.Transliteration,
        Arabic_Font_Family: Arabic_Font_Family,
        Mushaf_Page: Page_Number,
      };
    })
  );

  Debug_Log("Render_Verses built:", Render_Verses.length, "sample[0]:", Render_Verses[0]);

  const Reciter_Key = Configuration.Reciter.replace(/\s+/g, "_").replace(/'/g, "");
  const Full_Surah_Timestamps = await Fetch_Surah_Timestamps(Configuration.Surah_ID, Reciter_Key);

  const Range_Timestamps: string[][] | null =
    Full_Surah_Timestamps?.slice(Configuration.Ayah_Start - 1, Configuration.Ayah_End) ?? null;

  let Audio_URL: string | undefined;
  let Audio_Start_Ms: number | undefined;
  let Audio_End_Ms: number | undefined;
  let Per_Verse_Timestamps: (string[] | null)[];

  if (Range_Timestamps && Range_Timestamps.length === Render_Verses.length) {
    Debug_Log("taking REAL timestamp path");

    const First_Range = Parse_Range(Range_Timestamps[0][0]);
    const Last_Verse_Ranges = Range_Timestamps[Range_Timestamps.length - 1];
    const Last_Range = Parse_Range(Last_Verse_Ranges[Last_Verse_Ranges.length - 1]);
    Audio_Start_Ms = First_Range.start;
    Audio_End_Ms = Last_Range.end;

    Per_Verse_Timestamps = Range_Timestamps.map((Verse_Ranges) =>
      Verse_Ranges.map((Range_Item) => {
        const { start, end } = Parse_Range(Range_Item);
        return `${start - (Audio_Start_Ms as number)}-${end - (Audio_Start_Ms as number)}`;
      }),
    );

    const Raw_Url = await Fetch_Surah_Audio_Url(Configuration.Surah_ID, Reciter_Key);
    Audio_URL = Raw_Url ? new URL(Raw_Url, window.location.origin).toString() : undefined;
  } else {
    Debug_Log("taking FALLBACK path — no real timestamps/audio, using linear per-Kalimah timing");
    Per_Verse_Timestamps = Render_Verses.map(() => null);
  }

  const Scene_Payload: Render_Scene_Input = {
    width: Preview_Size.w,
    height: Preview_Size.h,
    Arabic_Font_Family: Page_Font_Family(Effective_Configuration.font, Configuration.Surah_ID, Render_Verses[0]?.Ayah_ID ?? 1) ?? Effective_Configuration.font ?? "Uthmani",
    Arabic_Size: Math.round((Preview_Size.h / 1080) * Effective_Configuration.Arabic_Size * 3),
    Translation_Size: Math.round((Preview_Size.h / 1080) * Effective_Configuration.Translation_Size * 2),
    Transliteration_Size: Math.round((Preview_Size.h / 1080) * Effective_Configuration.Transliteration_Size * 2),
    Arabic_Color: colors.Arabic_Color,
    Translation_Color: colors.Translation_Color,
    Transliteration_Color: colors.Transliteration_Color,
    Highlight_Color: colors.Highlight_Color,
    Ayaat: Render_Verses,
    Arabic_Position: Configuration.Arabic_Position,
    Translation_Position: Configuration.Translation_Position,
    Transliteration_Position: Configuration.Transliteration_Position,
  };

  const Has_Local_Bg_File = !!Configuration.Bg_File;
  const Bg_Is_Remote_Url = !Has_Local_Bg_File && !!Configuration.Bg_Url && !Configuration.Bg_Url.startsWith("blob:");
  if (!Has_Local_Bg_File && !Bg_Is_Remote_Url) {
    throw new Error("No background video/image set.");
  }

  if (Should_Cancel()) throw new Error("Render Cancelled");

  const Form_Data_Payload = new FormData();
  Form_Data_Payload.append("scene", JSON.stringify(Scene_Payload));
  Form_Data_Payload.append("timestamps", JSON.stringify(Per_Verse_Timestamps));
  Form_Data_Payload.append("Fallback_Per_Word_Ms", "450");
  Form_Data_Payload.append("fps", String(Configuration.Export_Format === "mp4" ? 30 : 24));
  
  if (Has_Local_Bg_File) {
    Form_Data_Payload.append("background", Configuration.Bg_File as File);
  } else {
    Form_Data_Payload.append("Background_Video_Url", Configuration.Bg_Url);
  }
  
  if (Audio_URL && Audio_Start_Ms !== undefined && Audio_End_Ms !== undefined) {
    Form_Data_Payload.append("Audio_URL", Audio_URL);
    Form_Data_Payload.append("Audio_Start_Ms", String(Audio_Start_Ms));
    Form_Data_Payload.append("Audio_End_Ms", String(Audio_End_Ms));
  }

  Debug_Log("POSTing to:", `${RENDER_SERVICE_URL}/api/renderSurah`);

  const Response_Stream = await fetch(`${RENDER_SERVICE_URL}/api/renderSurah`, {
    method: "POST",
    body: Form_Data_Payload,
  });

  if (!Response_Stream.ok) {
    let Error_Detail = "";
    try {
      const Error_Body = await Response_Stream.json();
      Error_Detail = Error_Body?.error ?? "";
    } catch {}
    throw new Error(`Render failed (${Response_Stream.status})${Error_Detail ? `: ${Error_Detail}` : ""}`);
  }

  const Output_Blob = await Response_Stream.blob();
  const Output_Url = URL.createObjectURL(Output_Blob);
  Set_Progress(1);

  return { url: Output_Url, ext: "mp4", size: Output_Blob.size };
}