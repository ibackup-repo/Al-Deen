// Client/Render/Engine/CanvasFallback.ts
import { type Assembled_Ayah } from "Server/API/Quran";
import { 
  type Config, 
  Resolutions, 
  Reciters, 
  Page_Font_Family 
} from "./Types";

// ====================== Real render (canvas + MediaRecorder → webm download) ======================
export async function Render_To_Webm(Arguments_Payload: {
  Ayaat: Assembled_Ayah[];
  Config_Settings: Config & Record<string, any>;
  Arabic_Color: string;
  Translation_Color: string;
  Transliteration_Color: string;
  Highlight_Color: string;
  Extra_Translations: Record<string, string[]>;
  Extra_Transliterations: Record<string, string[]>;
}): Promise<void> {
  const { 
    Ayaat, 
    Config_Settings, 
    Arabic_Color, 
    Translation_Color, 
    Transliteration_Color, 
    Highlight_Color, 
    Extra_Translations, 
    Extra_Transliterations 
  } = Arguments_Payload;

  if (!Ayaat.length) throw new Error("No ayahs in Range");

  const Resolution_Config = Resolutions[Config_Settings.resolution];
  const Frame_Width = Resolution_Config.w;
  const Frame_Height = Resolution_Config.h;

  const Canvas_Element = document.createElement("canvas");
  Canvas_Element.width = Frame_Width; 
  Canvas_Element.height = Frame_Height;

  const Canvas_Context = Canvas_Element.getContext("2d");
  if (!Canvas_Context) throw new Error("Canvas not supported");

  // Pre-load background images if present
  let Background_Image: HTMLImageElement | null = null;
  if (Config_Settings.Bg_Kind === "image" && Config_Settings.Bg_Url) {
    Background_Image = await Load_Image_Resource(Config_Settings.Bg_Url);
  }

  let Container_Image: HTMLImageElement | null = null;
  if (Config_Settings.Container_Bg_Kind === "image" && Config_Settings.Container_Bg_Url) {
    Container_Image = await Load_Image_Resource(Config_Settings.Container_Bg_Url);
  }

  let Logo_Image: HTMLImageElement | null = null;
  if (Config_Settings.Logo_Url) {
    Logo_Image = await Load_Image_Resource(Config_Settings.Logo_Url).catch(() => null);
  }

  const Frames_Per_Second = 30;
  const Media_Stream = Canvas_Element.captureStream(Frames_Per_Second);
  const Wants_Mp4 = (Config_Settings as any).Export_Format === "mp4";
  const Mp4_Mime_Type = "video/mp4;codecs=avc1.42E01E";

  let Selected_Mime_Type: string;
  if (Wants_Mp4 && MediaRecorder.isTypeSupported(Mp4_Mime_Type)) {
    Selected_Mime_Type = Mp4_Mime_Type;
  } else if (Wants_Mp4 && MediaRecorder.isTypeSupported("video/mp4")) {
    Selected_Mime_Type = "video/mp4";
  } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
    Selected_Mime_Type = "video/webm;codecs=vp9";
  } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
    Selected_Mime_Type = "video/webm;codecs=vp8";
  } else {
    Selected_Mime_Type = "video/webm";
  }

  const File_Extension = Selected_Mime_Type.startsWith("video/mp4") ? "mp4" : "webm";
  const Stream_Chunks: BlobPart[] = [];
  const Media_Recorder_Instance = new MediaRecorder(Media_Stream, { mimeType: Selected_Mime_Type });

  Media_Recorder_Instance.ondataavailable = (Event_Data) => { 
    if (Event_Data.data.size) Stream_Chunks.push(Event_Data.data); 
  };

  const Recording_Completed_Promise = new Promise<Blob>((Resolve_Promise) => {
    Media_Recorder_Instance.onstop = () => Resolve_Promise(new Blob(Stream_Chunks, { type: Selected_Mime_Type.split(";")[0] }));
  });

  Media_Recorder_Instance.start();

  const Seconds_Per_Word = 0.6;
  const Total_Words_Count = Ayaat.reduce((Accumulator, Verse_Item) => Accumulator + Verse_Item.Kalimaat.length, 0);
  const Intro_Duration_Seconds = Config_Settings.Add_Intro ? 1.2 : 0;
  const Outro_Duration_Seconds = Config_Settings.Add_Outro ? 1.2 : 0;
  const Total_Duration_Seconds = Intro_Duration_Seconds + Total_Words_Count * Seconds_Per_Word + Outro_Duration_Seconds;
  const Total_Frames_Count = Math.ceil(Total_Duration_Seconds * Frames_Per_Second);

  const Draw_Background_Layer = () => {
    if (Background_Image) {
      Canvas_Context.drawImage(Background_Image, 0, 0, Frame_Width, Frame_Height);
    } else {
      Canvas_Context.fillStyle = Config_Settings.Bg_Color;
      Canvas_Context.fillRect(0, 0, Frame_Width, Frame_Height);
    }
    Canvas_Context.fillStyle = "rgba(0,0,0,0.3)";
    Canvas_Context.fillRect(0, 0, Frame_Width, Frame_Height);
  };

  const Draw_Container_Card_Layer = (Card_X: number, Card_Y: number, Card_Width: number, Card_Height: number) => {
    Canvas_Context.save();
    Draw_Rounded_Rectangle(Canvas_Context, Card_X, Card_Y, Card_Width, Card_Height, Config_Settings.Border_Radius);
    if (Container_Image) {
      Canvas_Context.clip();
      Canvas_Context.drawImage(Container_Image, Card_X, Card_Y, Card_Width, Card_Height);
    } else {
      Canvas_Context.fillStyle = Config_Settings.Container_Bg;
      Canvas_Context.fill();
    }
    Canvas_Context.restore();

    if (Config_Settings.Border_Width > 0) {
      Canvas_Context.save();
      Canvas_Context.strokeStyle = Config_Settings.Border_Color;
      Canvas_Context.lineWidth = Config_Settings.Border_Width;
      Draw_Rounded_Rectangle(Canvas_Context, Card_X, Card_Y, Card_Width, Card_Height, Config_Settings.Border_Radius);
      Canvas_Context.stroke();
      Canvas_Context.restore();
    }
  };

  const Draw_Centered_Text_Layer = (
    Text_Content: string, 
    Position_X: number, 
    Position_Y: number, 
    Max_Width: number, 
    fontSize: number, 
    Text_Color: string, 
    Font_Family_Style: string, 
    Text_Align: CanvasTextAlign = "center"
  ) => {
    Canvas_Context.fillStyle = Text_Color;
    Canvas_Context.font = `${fontSize}px ${Font_Family_Style}`;
    Canvas_Context.textAlign = Text_Align;
    Canvas_Context.textBaseline = "middle";

    const Wrapped_Lines = Wrap_Canvas_Text(Canvas_Context, Text_Content, Max_Width);
    const Line_Height = fontSize * 1.4;
    const Starting_Y = Position_Y - ((Wrapped_Lines.length - 1) * Line_Height) / 2;

    Wrapped_Lines.forEach((Line_Text, Line_Index) => {
      Canvas_Context.fillText(Line_Text, Position_X, Starting_Y + Line_Index * Line_Height);
    });

    return Wrapped_Lines.length * Line_Height;
  };

  const Draw_Canvas_Frame = (Frame_Index: number) => {
    const Time_Elapsed_Seconds = Frame_Index / Frames_Per_Second;
    Draw_Background_Layer();

    // Branding / Logo Rendering
    if (Logo_Image) {
      const Logo_Height = 80;
      const Logo_Width = (Logo_Image.width / Logo_Image.height) * Logo_Height;
      Canvas_Context.drawImage(Logo_Image, Frame_Width - Logo_Width - 40, 40, Logo_Width, Logo_Height);
    }
    Canvas_Context.fillStyle = "rgba(255,255,255,0.85)";
    Canvas_Context.font = "bold 28px sans-serif";
    Canvas_Context.textBaseline = "Top";
    Canvas_Context.textAlign = Logo_Image ? "left" : "right";
    Canvas_Context.fillText("Al-Deen.org", Logo_Image ? 40 : Frame_Width - 40, 40);

    // Intro/Outro Frames
    if (Time_Elapsed_Seconds < Intro_Duration_Seconds && Config_Settings.Add_Intro) { 
      Canvas_Context.fillStyle = "#000"; 
      Canvas_Context.fillRect(0, 0, Frame_Width, Frame_Height); 
      return; 
    }
    if (Time_Elapsed_Seconds > Intro_Duration_Seconds + Total_Words_Count * Seconds_Per_Word && Config_Settings.Add_Outro) { 
      Canvas_Context.fillStyle = "#000"; 
      Canvas_Context.fillRect(0, 0, Frame_Width, Frame_Height); 
      return; 
    }

    const Active_Tick = Math.min(Total_Words_Count - 1, Math.max(0, Math.floor((Time_Elapsed_Seconds - Intro_Duration_Seconds) / Seconds_Per_Word)));
    let Active_Verse_Index = 0;
    let Words_Before_Count = 0;

    for (let Index = 0; Index < Ayaat.length; Index++) {
      if (Active_Tick < Words_Before_Count + Ayaat[Index].Kalimaat.length) { 
        Active_Verse_Index = Index; 
        break; 
      }
      Words_Before_Count += Ayaat[Index].Kalimaat.length;
    }

    const Current_Ayah = Ayaat[Active_Verse_Index];
    const Active_Kalimah_Index = Active_Tick - Words_Before_Count;

    // Card Dimensions
    const Card_Width = Math.min(Frame_Width * 0.85, 1400);
    const Card_Height = Frame_Height * 0.7;
    const Card_Position_X = (Frame_Width - Card_Width) / 2;
    const Card_Position_Y = (Frame_Height - Card_Height) / 2;
    Draw_Container_Card_Layer(Card_Position_X, Card_Position_Y, Card_Width, Card_Height);

    // Arabic Rendering
    const Font_Family = Page_Font_Family(Config_Settings.font, Config_Settings.Surah_ID, Current_Ayah.Ayah_ID) || "serif";
    Canvas_Context.save();
    Canvas_Context.font = `${Config_Settings.Arabic_Size * 2}px ${Font_Family}, serif`;
    Canvas_Context.textAlign = "center";
    Canvas_Context.textBaseline = "middle";

    const Arabic_Center_Y = Card_Position_Y + Card_Height * 0.35;
    const Full_Verse_Text = Current_Ayah.Kalimaat.join(Config_Settings.font === "Uthmani_V1" ? "" : " ");
    Canvas_Context.fillStyle = Arabic_Color;

    const Arabic_Lines = Wrap_Canvas_Text(Canvas_Context, Full_Verse_Text, Card_Width - 80);
    const Arabic_Line_Height = Config_Settings.Arabic_Size * 2 * 1.4;

    Arabic_Lines.forEach((Line_Text, Line_Index) => {
      Canvas_Context.fillText(
        Line_Text, 
        Frame_Width / 2, 
        Arabic_Center_Y - ((Arabic_Lines.length - 1) * Arabic_Line_Height) / 2 + Line_Index * Arabic_Line_Height
      );
    });

    // Highlight Current Active Kalimah
    Canvas_Context.fillStyle = Highlight_Color;
    Canvas_Context.font = `${Config_Settings.Arabic_Size * 2}px ${Font_Family}, serif`;
    Canvas_Context.fillText(Current_Ayah.Kalimaat[Active_Kalimah_Index] || "", Frame_Width / 2, Card_Position_Y + 60);
    Canvas_Context.restore();

    // Translations & Transliterations
    let Vertical_Y_Cursor = Card_Position_Y + Card_Height * 0.62;
    const Active_Translations = Config_Settings.Translations.filter((Translation_Item) => Translation_Item !== "None");
    const Active_Transliterations = Config_Settings.Transliterations.filter((Transliteration_Item) => Transliteration_Item !== "None");

    Active_Transliterations.forEach((Source_Key) => {
      const Transliteration_Text = Extra_Transliterations[Source_Key]?.[Current_Ayah.Ayah_ID - 1] ?? "";
      if (!Transliteration_Text) return;

      const Used_Height = Draw_Centered_Text_Layer(
        Transliteration_Text, 
        Frame_Width / 2, 
        Vertical_Y_Cursor, 
        Card_Width - 80, 
        Config_Settings.Transliteration_Size * 2, 
        Transliteration_Color, 
        "italic sans-serif"
      );
      Vertical_Y_Cursor += Used_Height + 16;
    });

    Active_Translations.forEach((Source_Key) => {
      const Translation_Text = Extra_Translations[Source_Key]?.[Current_Ayah.Ayah_ID - 1] ?? "";
      if (!Translation_Text) return;

      const Used_Height = Draw_Centered_Text_Layer(
        Translation_Text, 
        Frame_Width / 2, 
        Vertical_Y_Cursor, 
        Card_Width - 80, 
        Config_Settings.Translation_Size * 2, 
        Translation_Color, 
        "sans-serif"
      );
      Vertical_Y_Cursor += Used_Height + 16;
    });
  };

  for (let Frame_Index = 0; Frame_Index < Total_Frames_Count; Frame_Index++) {
    Draw_Canvas_Frame(Frame_Index);
    await new Promise((Resolve_Delay) => setTimeout(Resolve_Delay, 1000 / Frames_Per_Second));
  }

  Media_Recorder_Instance.stop();
  const Output_Blob = await Recording_Completed_Promise;
  const Download_Url = URL.createObjectURL(Output_Blob);

  const Download_Anchor = document.createElement("a");
  Download_Anchor.href = Download_Url;
  Download_Anchor.download = `Surah-${Config_Settings.Surah_ID}-${Config_Settings.Ayah_Start}-${Config_Settings.Ayah_End}.${File_Extension}`;
  document.body.appendChild(Download_Anchor);
  Download_Anchor.click();
  Download_Anchor.remove();

  setTimeout(() => URL.revokeObjectURL(Download_Url), 5000);
}

function Load_Image_Resource(Source_Url: string): Promise<HTMLImageElement> {
  return new Promise((Resolve_Promise, Reject_Promise) => {
    const Image_Instance = new Image();
    Image_Instance.crossOrigin = "anonymous";
    Image_Instance.onload = () => Resolve_Promise(Image_Instance);
    Image_Instance.onerror = Reject_Promise;
    Image_Instance.src = Source_Url;
  });
}

function Wrap_Canvas_Text(Canvas_Context: CanvasRenderingContext2D, Text_Content: string, Max_Width: number): string[] {
  const Kalimaat_List = Text_Content.split(/\s+/);
  const Lines_Result: string[] = [];
  let Current_Line = "";

  for (const Word_Item of Kalimaat_List) {
    const Test_Line = Current_Line ? Current_Line + " " + Word_Item : Word_Item;
    if (Canvas_Context.measureText(Test_Line).width > Max_Width && Current_Line) { 
      Lines_Result.push(Current_Line); 
      Current_Line = Word_Item; 
    } else {
      Current_Line = Test_Line;
    }
  }
  if (Current_Line) Lines_Result.push(Current_Line);
  return Lines_Result;
}

function Draw_Rounded_Rectangle(
  Canvas_Context: CanvasRenderingContext2D, 
  Position_X: number, 
  Position_Y: number, 
  width: number, 
  height: number, 
  Radius: number
) {
  const Effective_Radius = Math.min(Radius, width / 2, height / 2);
  Canvas_Context.beginPath();
  Canvas_Context.moveTo(Position_X + Effective_Radius, Position_Y);
  Canvas_Context.arcTo(Position_X + width, Position_Y, Position_X + width, Position_Y + height, Effective_Radius);
  Canvas_Context.arcTo(Position_X + width, Position_Y + height, Position_X, Position_Y + height, Effective_Radius);
  Canvas_Context.arcTo(Position_X, Position_Y + height, Position_X, Position_Y, Effective_Radius);
  Canvas_Context.arcTo(Position_X, Position_Y, Position_X + width, Position_Y, Effective_Radius);
  Canvas_Context.closePath();
}

export function Make_Defaults(Surah_ID: number, Ayah_ID: number | undefined, Mode: "render" | "embed"): Config {
  return {
    resolution: "1080p",
    width: 600,
    height: 480,
    Export_Format: "webm",
    Reciter: Reciters[0],
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
  };
}