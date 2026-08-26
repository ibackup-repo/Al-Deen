// @Web/Component/Dialog/Types.ts

export type Corner = "tl" | "tr" | "bl" | "br";
export type Render_Font = "Uthmani" | "IndoPak" | "Uthmani_V1" | "Uthmani_V2" | "Uthmani_V4";
export type Quran_Font_Type = "Standard" | "V1" | "V2";
export type Position =
  | "Top-left" | "Top-center" | "Top-right"
  | "center-left" | "center" | "center-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

export const POSITIONS: { id: Position; label: string }[] = [
  { id: "Top-left",      label: "Top Left" },
  { id: "Top-center",    label: "Top Center" },
  { id: "Top-right",     label: "Top Right" },
  { id: "center-left",   label: "Center Left" },
  { id: "center",        label: "Center" },
  { id: "center-right",  label: "Center Right" },
  { id: "bottom-left",   label: "Bottom Left" },
  { id: "bottom-center", label: "Bottom Center" },
  { id: "bottom-right",  label: "Bottom Right" },
];

export function Pos_Classes(Position_Parameter: Position): string {
  const Vertical = Position_Parameter.startsWith("Top-")
    ? "items-start"
    : Position_Parameter.startsWith("bottom-")
    ? "items-end"
    : "items-center";
  const Horizontal = Position_Parameter.endsWith("-left")
    ? "justify-start text-left"
    : Position_Parameter.endsWith("-right")
    ? "justify-end text-right"
    : "justify-center text-center";
  return `${Vertical} ${Horizontal}`;
}

export interface Config {
  resolution: "1080p" | "720p" | "vertical";
  width: number;
  height: number;
  Export_Format: "webm" | "mp4";

  Reciter: string;
  Surah_ID: number;
  Ayah_Start: number;
  Ayah_End: number;

  Bg_Kind: "color" | "image" | "video";
  Bg_Color: string;
  Bg_Url: string;
  Bg_File?: File | null;

  // Container
  Container_Bg_Kind: "color" | "image";
  Container_Bg: string;
  Container_Bg_Url: string;
  Border_Color: string;
  Border_Width: number;
  Border_Radius: number;

  Arabic_Color: string;
  Translation_Color: string;
  Transliteration_Color: string;
  Highlight_Color: string;
  Auto_Contrast: boolean;

  // Positioning
  Arabic_Position: Position;
  Translation_Position: Position;
  Transliteration_Position: Position;

  // Overlays
  Show_Lines: boolean;
  Lines_Count: number;
  Show_Watermark: boolean;
  Watermark_Text: string;

  Logo_Url: string;
  Logo_Corner: Corner;

  Add_Intro: boolean;
  Intro_Url: string;
  Add_Outro: boolean;
  Outro_Url: string;

  // Embed-only
  Audio_Playback: boolean;
  Show_Tafsir: boolean;
  Show_Copy: boolean;
  Show_Share: boolean;
  Hover_Tooltip: boolean;
}

export const Reciters = ["Mishary Rashid Alafasy", "Sa'd al-Ghamdi", "Maher al-Muaiqly"];
export const FONTS: { id: Render_Font; label: string }[] = [
  { id: "Uthmani", label: "Uthmani (Hafs)" },
  { id: "IndoPak", label: "IndoPak" },
  { id: "Uthmani_V1", label: "King Fahad Complex V1" },
  { id: "Uthmani_V2", label: "King Fahad Complex V2" },
  { id: "Uthmani_V4", label: "King Fahad Complex V4" },
];
export const TRANSLATIONS = ["None", "Direct", "Saheeh-International"];
export const TRANSLITERATIONS = ["None", "Standard"];
export const Resolutions: Record<Config["resolution"], { w: number; h: number; label: string }> = {
  "1080p": { w: 1920, h: 1080, label: "1080p (16:9)" },
  "720p": { w: 1280, h: 720, label: "720p (16:9)" },
  vertical: { w: 1080, h: 1920, label: "Vertical (9:16)" },
};

export function Font_To_Type(font: Render_Font): Quran_Font_Type {
  if (font === "Uthmani_V1") return "V1";
  if (font === "Uthmani_V2" || font === "Uthmani_V4") return "V2";
  return "Standard";
}

export function Font_Class(font: Render_Font): string {
  switch (font) {
    case "IndoPak":    return "Font-IndoPak";
    case "Uthmani_V1": return "Font-Uthmani_V1";
    case "Uthmani_V2": return "Font-Uthmani_V2";
    case "Uthmani_V4": return "Font-Uthmani_V4";
    default:           return "Font-Uthmani";
  }
}

interface Page_Segment {
  Surah: number;
  Start_Ayah: number;
  End_Ayah: number;
}

const Backend_Base_URL = "https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev";

let Cached_Segments_Map: Record<number, Page_Segment[]> | null = null;

export async function Prefetch_All_Page_Segments(): Promise<void> {
  try {
    const Response_Context = await fetch(`${Backend_Base_URL}/api/Quran/all-Segments`);
    if (Response_Context.ok) {
      Cached_Segments_Map = await Response_Context.json();
    }
  } catch {
    Cached_Segments_Map = {};
  }
}

export function Page_Font_Family(
  font: Render_Font, 
  Surah_ID: number, 
  Ayah_ID: number
): string | undefined {
  if (font === "Uthmani_V1" || font === "Uthmani_V2") {
    if (Cached_Segments_Map) {
      for (let Page_Number = 1; Page_Number <= 604; Page_Number++) {
        const Segments = Cached_Segments_Map[Page_Number];
        if (!Segments) continue;
        const Match = Segments.find((Item) => Item.Surah === Surah_ID);
        if (Match && Ayah_ID >= Match.Start_Ayah && Ayah_ID <= Match.End_Ayah) {
          return font === "Uthmani_V1"
            ? `QCF_P${String(Page_Number).padStart(3, "0")}`
            : `QCF20${String(Page_Number).padStart(2, "0")}`;
        }
      }
    }
    return "KFGQPC HAFS Uthmanic Script";
  }
  if (font === "Uthmani") return "KFGQPC HAFS Uthmanic Script";
  if (font === "IndoPak") return "AlQuran IndoPak by QuranWBW";
  return "KFGQPC HAFS Uthmanic Script";
}

function Hex_To_Rgb(Hex: string): [number, number, number] {
  const Formatted = Hex.replace("#", "");
  const Value = Formatted.length === 3 ? Formatted.split("").map((Char) => Char + Char).join("") : Formatted;
  const Integer = parseInt(Value, 16);
  return [(Integer >> 16) & 255, (Integer >> 8) & 255, Integer & 255];
}

function Rgb_To_Hex(Red: number, Green: number, Blue: number): string {
  const To_Hex_String = (Value: number) => Value.toString(16).padStart(2, "0");
  return `#${To_Hex_String(Math.round(Red))}${To_Hex_String(Math.round(Green))}${To_Hex_String(Math.round(Blue))}`;
}

function Rel_Luminance([Red, Green, Blue]: [number, number, number]): number {
  const Convert = (Value: number) => {
    const Scaled = Value / 255;
    return Scaled <= 0.03928 ? Scaled / 12.92 : Math.pow((Scaled + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * Convert(Red) + 0.7152 * Convert(Green) + 0.0722 * Convert(Blue);
}

function Contrast_Ratio(First_Color: string, Second_Color: string): number {
  const First_Luminance = Rel_Luminance(Hex_To_Rgb(First_Color));
  const Second_Luminance = Rel_Luminance(Hex_To_Rgb(Second_Color));
  const [High, Low] = First_Luminance > Second_Luminance 
    ? [First_Luminance, Second_Luminance] 
    : [Second_Luminance, First_Luminance];
  return (High + 0.05) / (Low + 0.05);
}

export function Ensure_Readable(Color: string, Background: string, Min_Ratio = 3.5): string {
  try {
    if (Contrast_Ratio(Color, Background) >= Min_Ratio) return Color;
    const Background_Luminance = Rel_Luminance(Hex_To_Rgb(Background));
    const Target_Rgb: [number, number, number] = Background_Luminance > 0.5 ? [0, 0, 0] : [255, 255, 255];
    let [Red, Green, Blue] = Hex_To_Rgb(Color);

    for (let Factor = 0.1; Factor <= 1; Factor += 0.1) {
      const Next_Red = Red + (Target_Rgb[0] - Red) * Factor;
      const Next_Green = Green + (Target_Rgb[1] - Green) * Factor;
      const Next_Blue = Blue + (Target_Rgb[2] - Blue) * Factor;
      const Candidate = Rgb_To_Hex(Next_Red, Next_Green, Next_Blue);
      if (Contrast_Ratio(Candidate, Background) >= Min_Ratio) return Candidate;
    }
    return Rgb_To_Hex(Target_Rgb[0], Target_Rgb[1], Target_Rgb[2]);
  } catch {
    return Color;
  }
}

export interface Properties {
  Open: boolean;
  On_Open_Change: (Open_State: boolean) => void;
  Surah_ID: number;
  Ayah_ID?: number;
  Mode?: "render" | "embed";
}

export function Build_Embed_Preview_Doc(
  Configuration: Config & Record<string, any>,
  Verses_List: any[],
  Colors: { Arabic_Color: string; Translation_Color: string; Transliteration_Color: string; Highlight_Color: string },
  Extra_Translations: Record<string, string[]>,
  Extra_Transliterations: Record<string, string[]>
): string {
  const Container_Background = Configuration.Container_Bg_Kind === "image" && Configuration.Container_Bg_Url
    ? `center/cover no-repeat url("${Configuration.Container_Bg_Url}")`
    : Configuration.Container_Bg;
  const Border_Style = `${Configuration.Border_Width}px solid ${Configuration.Border_Color}`;

  const Create_Card = (Ayah: any): string => {
    const Arabic_Words = Ayah.Kalimaat.map((Kalimah: string) => `<span>${Escape_Html(Kalimah)}</span>`).join(Configuration.font === "Uthmani_V1" ? "" : " ");
    const Action_Buttons: string[] = [];
    if (Configuration.Audio_Playback) Action_Buttons.push(Create_Button("▶ Play"));
    if (Configuration.Show_Tafsir)    Action_Buttons.push(Create_Button("Tafsir"));
    if (Configuration.Show_Copy)      Action_Buttons.push(Create_Button("Copy"));
    if (Configuration.Show_Share)     Action_Buttons.push(Create_Button("Share"));

    const Translation_Blocks = Configuration.Translations.filter((Item: string) => Item !== "None").map((Source: string) =>
      `<div class="tr" style="color:${Colors.Translation_Color};font-size:${Configuration.Translation_Size}px">${Escape_Html(Extra_Translations[Source]?.[Ayah.Ayah_ID - 1] ?? "")}</div>`
    ).join("");

    const Transliteration_Blocks = Configuration.Transliterations.filter((Item: string) => Item !== "None").map((Source: string) =>
      `<div class="tl" style="color:${Colors.Transliteration_Color};font-size:${Configuration.Transliteration_Size}px">${Escape_Html(Extra_Transliterations[Source]?.[Ayah.Ayah_ID - 1] ?? "")}</div>`
    ).join("");

    const Word_By_Word = Configuration.Show_Wbw
      ? `<div class="wbw" dir="rtl">${Ayah.Kalimaat.map((Kalimah: string) => `<span>${Escape_Html(Kalimah)}</span>`).join("")}</div>`
      : "";

    return `<div class="card" style="background:${Container_Background};border:${Border_Style};border-radius:${Configuration.Border_Radius}px">
      <div class="head"><span class="badge">${Configuration.Surah_ID}:${Ayah.Ayah_ID}</span><div class="acts">${Action_Buttons.join("")}</div></div>
      <div class="ar" dir="rtl" style="color:${Colors.Arabic_Color};font-size:${Configuration.Arabic_Size}px">${Arabic_Words}</div>
      ${Word_By_Word}
      ${Transliteration_Blocks}
      ${Translation_Blocks}
    </div>`;
  };

  return `<!doctype html><html><head><meta charset="utf-8"/>
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,sans-serif;background:transparent;padding:14px;display:flex;flex-direction:column;gap:14px}
  .card{padding:18px 20px;display:flex;flex-direction:column;gap:10px}
  .head{display:flex;justify-content:space-between;align-items:center}
  .badge{font-size:12px;color:#666;background:rgba(0,0,0,.05);padding:2px 8px;border-radius:999px}
  .acts{display:flex;gap:6px;flex-wrap:wrap}
  .ar{line-height:2;text-align:right}
  .wbw{display:flex;flex-wrap:wrap;gap:6px;font-size:12px;color:#666;justify-content:flex-end}
  .tl{font-style:italic;text-align:left}
  .tr{text-align:left;line-height:1.5}
</style></head><body>
  ${Verses_List.map(Create_Card).join("")}
</body></html>`;
}

function Escape_Html(Content: string): string {
  return Content.replace(/[&<>"']/g, (Char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[Char]!));
}

function Create_Button(Label: string): string {
  return `<button style="border:1px solid #ddd;background:#fff;border-radius:999px;padding:4px 10px;font-size:12px;cursor:pointer">${Label}</button>`;
}