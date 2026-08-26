// @Web/Component/Quran/Surah/Header
import { Info, Play, Pause, BookOpen, Video } from "lucide-react";
import { Tooltip, Tooltip_Content, Tooltip_Provider, Tooltip_Trigger } from "@Web/Component/UI/Tooltip";
import { Use_Audio } from "@Web/Context/Audio";
import { Use_Translation } from "@/Hook/Use-Translation";
import { Container } from "@Web/Component/UI/Container";
import { Button } from "@Web/Component/UI/Button";
import type { Surah_Metadata } from "@/Library/Quran-Types";

interface Surah_Header_Properties {
  Surah?: Partial<Surah_Metadata>;
  Arabic_Font_Size: string;
  On_Info_Click: () => void;
  On_Tafsir_Click: () => void;
  On_Audio_Click: () => void;
  On_Render_Click?: () => void;
}

export function Surah_Header({
  Surah,
  Arabic_Font_Size,
  On_Info_Click,
  On_Tafsir_Click,
  On_Audio_Click,
  On_Render_Click,
}: Surah_Header_Properties) {
  const { t } = Use_Translation();
  const {
    Is_Playing: Is_Audio_Playing,
    Is_Loading_Corpus_Data: Is_Audio_Loading,
    Current_Surah: Audio_Current_Surah,
    Play_Full_Surah,
    Toggle_Play_Pause,
  } = Use_Audio();

  if (!Surah || !Surah.Surah) return null;

  const Surah_ID = Surah.Surah;
  const Font_Glyph = String(Surah_ID).padStart(3, "0");
  const Is_This_Surah_Playing = Audio_Current_Surah === Surah_ID && Is_Audio_Playing;

  const Handle_Audio_Click = () => {
    On_Audio_Click();
    if (Audio_Current_Surah === Surah_ID) {
      Toggle_Play_Pause();
    } else {
      Play_Full_Surah(Surah_ID);
    }
  };

  return (
    <Container className="!px-6 !py-4 rounded-t-[40px] rounded-b-none">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Surah Number */}
          <span className="text-sm font-medium text-muted-foreground">
            {Surah_ID}
          </span>

          {/* Surah Font Character */}
          <div
            dir="rtl"
            className="font-surah leading-tight"
            style={{ fontSize: `calc(${Arabic_Font_Size} * 1.2)` }}
          >
            {Font_Glyph}
          </div>

          {/* Transliteration STACKED ABOVE Translation (No Parentheses) */}
          <div className="flex flex-col">
            {Surah.Transliteration && (
              <span className="text-base font-semibold text-foreground leading-snug">
                {Surah.Transliteration}
              </span>
            )}
            {Surah.Translation && (
              <span className="text-xs text-muted-foreground leading-none">
                {Surah.Translation}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Tooltip_Provider>
            <Tooltip>
              <Tooltip_Trigger asChild>
                <Button size="sm" onClick={On_Info_Click} aria-label="Surah info">
                  <Info className="h-4 w-4" />
                </Button>
              </Tooltip_Trigger>
              <Tooltip_Content side="bottom">{t.Quran.Surah_Info}</Tooltip_Content>
            </Tooltip>

            {On_Render_Click && (
              <Tooltip>
                <Tooltip_Trigger asChild>
                  <Button size="sm" onClick={On_Render_Click} aria-label="Render video">
                    <Video className="h-4 w-4" />
                  </Button>
                </Tooltip_Trigger>
                <Tooltip_Content side="bottom">Render Video</Tooltip_Content>
              </Tooltip>
            )}

            <Tooltip>
              <Tooltip_Trigger asChild>
                <Button size="sm" onClick={On_Tafsir_Click} aria-label="View Tafsir">
                  <BookOpen className="h-4 w-4" />
                </Button>
              </Tooltip_Trigger>
              <Tooltip_Content side="bottom">Tafsir (Ayah 1)</Tooltip_Content>
            </Tooltip>

            <Tooltip>
              <Tooltip_Trigger asChild>
                <Button
                  size="sm"
                  disabled={Is_Audio_Loading}
                  onClick={Handle_Audio_Click}
                  aria-label={Is_This_Surah_Playing ? "Pause" : "Play Surah"}
                >
                  {Is_This_Surah_Playing ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </Tooltip_Trigger>
              <Tooltip_Content side="bottom">
                {Is_This_Surah_Playing ? t.Quran.Pause_Audio : t.Quran.Play_Audio}
              </Tooltip_Content>
            </Tooltip>
          </Tooltip_Provider>
        </div>
      </div>
    </Container>
  );
}