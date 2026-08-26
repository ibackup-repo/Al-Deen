import React, { useRef } from "react";
import { Use_App } from "@Web/Context/App";
import { Tooltip, Tooltip_Trigger, Tooltip_Content } from "@Web/Component/UI/Tooltip";
import type { Word_Tooltip_Properties } from "./Types";

const Audio_Service_Base_Url = "https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev";

export type Arabic_Script_Field = "Arabic" | "Presentation_Form_A_Ligature_Based" | "Presentation_Form_A_Glyph_Based";

export function Get_Arabic_Field(Quran_Font: string): Arabic_Script_Field {
  switch (Quran_Font) {
    case "Uthmani_V1":
      return "Presentation_Form_A_Glyph_Based";
    case "Uthmani_V2":
    case "Uthmani_V4":
      return "Presentation_Form_A_Ligature_Based";
    default:
      return "Arabic";
  }
}

export function Pick_Arabic_Text<Type_Generic extends Record<string, any>>(
  Item: Type_Generic,
  Field: Arabic_Script_Field
): string {
  if (!Item) return "";
  if (Item[Field]) return String(Item[Field]);
  return String(Item.Arabic ?? "");
}
export function Word_Tooltip({
  Translation,
  Transliteration,
  enabled = true,
  onClick,
  onMouseEnter,
  onMouseLeave,
  children,
}: Word_Tooltip_Properties) {
  const Latin_Tooltip_Style: React.CSSProperties = {
    fontFamily: "var(--font-sans, ui-sans-serif, system-ui, sans-serif)",
    fontFeatureSettings: "normal",
    fontVariant: "normal",
    fontWeight: 400,
  };

  let Tooltip_Body: React.ReactNode = null;

  if (Translation && Transliteration) {
    Tooltip_Body = (
      <div className="space-y-0.5 pointer-events-none select-none" style={Latin_Tooltip_Style}>
        <div className="text-black dark:text-white text-sm font-medium">
          {Translation}
        </div>
        <div className="text-gray-500 dark:text-gray-400 text-xs">
          {Transliteration}
        </div>
      </div>
    );
  } else if (Translation) {
    Tooltip_Body = (
      <div className="text-black dark:text-white text-sm font-medium pointer-events-none select-none" style={Latin_Tooltip_Style}>
        {Translation}
      </div>
    );
  } else if (Transliteration) {
    Tooltip_Body = (
      <div className="text-gray-500 dark:text-gray-400 text-sm pointer-events-none select-none" style={Latin_Tooltip_Style}>
        {Transliteration}
      </div>
    );
  }

  const Is_Enabled = Boolean(enabled && Tooltip_Body);

  const Trigger_Span = (
    <span
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="inline-block cursor-pointer"
    >
      {children}
    </span>
  );

  if (!Is_Enabled) {
    return Trigger_Span;
  }

  return (
    <Tooltip>
      <Tooltip_Trigger asChild>
        {Trigger_Span}
      </Tooltip_Trigger>
      <Tooltip_Content side="top" sideOffset={8}>
        {Tooltip_Body}
      </Tooltip_Content>
    </Tooltip>
  );
}

function Parse_Time_Segment(Segment: string): { Start_Time: number; End_Time: number } {
  const [Start, End] = Segment.split("-").map(Number);
  return { Start_Time: Start || 0, End_Time: End || 0 };
}

async function Fetch_Ayah_Timestamps(
  Surah_ID: number,
  Ayah_ID: number,
  Reciter: string
): Promise<string[] | null> {
  try {
    const Formatted_Reciter = Reciter.replace(/\s+/g, "_").replace(/'/g, "");
    const Response = await fetch(
      `${Audio_Service_Base_Url}/api/audio/timestamps/Ayah?Surah=${Surah_ID}&Ayah=${Ayah_ID}&Reciter=${encodeURIComponent(Formatted_Reciter)}`
    );
    if (!Response.ok) return null;
    return await Response.json();
  } catch {
    return null;
  }
}

async function Fetch_Surah_Audio_Url(Surah_ID: number, Reciter: string): Promise<string | null> {
  try {
    const Formatted_Reciter = Reciter.replace(/\s+/g, "_").replace(/'/g, "");
    const Response = await fetch(
      `${Audio_Service_Base_Url}/api/audio/url?Surah=${Surah_ID}&Reciter=${encodeURIComponent(Formatted_Reciter)}`
    );
    if (!Response.ok) return null;
    const Data = await Response.json();
    return Data.url || null;
  } catch {
    return null;
  }
}

export function Use_Audio_Playback(Surah_ID: number) {
  const { Hover_Recitation, Selected_Reciter } = Use_App();
  const [Active_Key, Set_Active_Key] = React.useState<string | null>(null);
  const Audio_Reference = useRef<HTMLAudioElement | null>(null);

  const Stop_Current_Audio = () => {
    if (Audio_Reference.current) {
      Audio_Reference.current.pause();
      Audio_Reference.current = null;
    }
  };

  const Play_Segment = (Uniform_Resource_Locator: string, Key: string, Start_Milliseconds: number, End_Milliseconds: number) => {
    Stop_Current_Audio();
    const Audio_Instance = new Audio(Uniform_Resource_Locator);
    Audio_Reference.current = Audio_Instance;
    Audio_Instance.currentTime = Start_Milliseconds / 1000;

    const Handle_Time_Update = () => {
      if (Audio_Instance.currentTime * 1000 >= End_Milliseconds) {
        Cleanup();
      }
    };

    const Cleanup = () => {
      Audio_Instance.removeEventListener("timeupdate", Handle_Time_Update);
      Audio_Instance.pause();
      if (Audio_Reference.current === Audio_Instance) {
        Audio_Reference.current = null;
      }
      Set_Active_Key(null);
    };

    Audio_Instance.addEventListener("timeupdate", Handle_Time_Update);
    Audio_Instance.onended = Cleanup;
    Audio_Instance.onerror = Cleanup;
    Audio_Instance.play().catch(Cleanup);
  };

  const Play_Ayah_Audio = async (Ayah_ID: number) => {
    const Key = `Ayah-${Surah_ID}-${Ayah_ID}`;
    if (Active_Key === Key) return;

    Set_Active_Key(Key);
    const Timestamps = await Fetch_Ayah_Timestamps(Surah_ID, Ayah_ID, Selected_Reciter);
    if (!Timestamps || Timestamps.length === 0) {
      Set_Active_Key(null);
      return;
    }

    const { Start_Time } = Parse_Time_Segment(Timestamps[0]);
    const { End_Time } = Parse_Time_Segment(Timestamps[Timestamps.length - 1]);

    const Audio_URL = await Fetch_Surah_Audio_Url(Surah_ID, Selected_Reciter);
    if (!Audio_URL) {
      Set_Active_Key(null);
      return;
    }

    const Full_URL = Audio_URL.startsWith("http")
      ? Audio_URL
      : new URL(Audio_URL, window.location.origin).toString();

    Play_Segment(Full_URL, Key, Start_Time, End_Time);
  };

  const Play_Kalimah_Audio = async (Ayah_ID: number, Kalimah_Index: number) => {
    if (!Hover_Recitation) return;
    const Key = `Kalimah-${Surah_ID}-${Ayah_ID}-${Kalimah_Index}`;
    if (Active_Key === Key) return;

    Set_Active_Key(Key);
    const Timestamps = await Fetch_Ayah_Timestamps(Surah_ID, Ayah_ID, Selected_Reciter);
    const Word_Segment = Timestamps?.[Kalimah_Index];

    if (!Word_Segment) {
      Set_Active_Key(null);
      return;
    }

    const { Start_Time, End_Time } = Parse_Time_Segment(Word_Segment);
    const Audio_URL = await Fetch_Surah_Audio_Url(Surah_ID, Selected_Reciter);

    if (!Audio_URL) {
      Set_Active_Key(null);
      return;
    }

    const Full_URL = Audio_URL.startsWith("http")
      ? Audio_URL
      : new URL(Audio_URL, window.location.origin).toString();

    Play_Segment(Full_URL, Key, Start_Time, End_Time);
  };

  const Is_Playing = (Key: string) => Active_Key === Key;

  return {
    Active_Key,
    Play_Kalimah_Audio,
    Play_Ayah_Audio,
    Is_Playing,
  };
}

export const Extract_Ayah_Number_From_Marker = (Marker: string): number | null => {
  if (!Marker) return null;
  if (Marker.includes(":")) {
    const Parts = Marker.split(":");
    const Number_Value = parseInt(Parts[0], 10);
    return isNaN(Number_Value) ? null : Number_Value;
  }
  const Number_Value = parseInt(Marker, 10);
  return isNaN(Number_Value) ? null : Number_Value;
};