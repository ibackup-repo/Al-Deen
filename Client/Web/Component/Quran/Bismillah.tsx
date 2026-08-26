import { Use_App } from "@Web/Context/App";
import { Word_Tooltip, Use_Audio_Playback } from "@Web/Component/Quran/Layout/Utility";
import type { Bismillah_Kalimah } from "./Layout/Types";

interface Bismillah_Properties {
  Kalimaat: Bismillah_Kalimah[];
  Font_Class: string;
  fontSize: string;
  fontFamily?: string;               // optional override (e.g., "Uthmani-V2-1")
  wordSpacing?: string;
  Show_Inline_Translation?: boolean;
  Show_Inline_Transliteration?: boolean;
  Hover_Translation_Enabled?: boolean;
  Inline_Translation_Size?: number;
  Inline_Transliteration_Size?: number;
}

export function Bismillah({
  Kalimaat,
  Font_Class,
  fontSize,
  fontFamily,
  wordSpacing = "1.8px",
  Show_Inline_Translation = false,
  Show_Inline_Transliteration = false,
  Hover_Translation_Enabled = false,
  Inline_Translation_Size = 12,
  Inline_Transliteration_Size = 12,
}: Bismillah_Properties) {
  const { Hover_Recitation } = Use_App();
  const { Play_Kalimah_Audio, Is_Playing } = Use_Audio_Playback(1); // Surah 1 for Kalimah audio

  const Latin_Font_Style = {
    fontFamily: "var(--font-sans, ui-sans-serif, system-ui, sans-serif)",
    fontFeatureSettings: "normal",
    fontVariant: "normal",
    fontWeight: 400,
  };

  return (
    <div
      className={Font_Class}
      style={{ fontSize, lineHeight: 1.8, wordSpacing, fontFamily }}
      dir="rtl"
    >
      <div className="flex justify-center items-start flex-wrap gap-x-0" dir="rtl">
        {Kalimaat.map((Kalimah, Index) => {
          const Kalimah_Key = `bismillah-${Index}`;
          const Handle_Click = () => {
            if (Hover_Recitation) {
              // Kalimah audio for Surah 1, Ayah 1, Kalimah Index+1 (if available)
              Play_Kalimah_Audio(1, Index);
            }
          };

          return (
            <div key={Index} className="flex flex-col items-center">
              <Word_Tooltip
                Translation={Hover_Translation_Enabled ? Kalimah.Translation : undefined}
                Transliteration={Hover_Translation_Enabled ? Kalimah.Transliteration : undefined}
                enabled={Hover_Translation_Enabled}
                onClick={Handle_Click}
              >
                <span
                  className="select-text transition-colors Duration-200 inline text-foreground hover:text-primary cursor-pointer"
                  onClick={Handle_Click}
                >
                  {Kalimah.Glyph}{" "}
                </span>
              </Word_Tooltip>

              {(Show_Inline_Translation || Show_Inline_Transliteration) && (
                <div
                  className="flex flex-col items-center gap-y-0.5 mt-1 w-full"
                  dir="ltr"
                  style={Latin_Font_Style}
                >
                  {Show_Inline_Translation && (
                    <span
                      className="text-black dark:text-white text-center leading-tight block w-full"
                      style={{ fontSize: Inline_Translation_Size }}
                    >
                      {Kalimah.Translation}
                    </span>
                  )}
                  {Show_Inline_Transliteration && (
                    <span
                      className="text-gray-500 dark:text-gray-400 text-center leading-tight block w-full"
                      style={{ fontSize: Inline_Transliteration_Size }}
                    >
                      {Kalimah.Transliteration}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}