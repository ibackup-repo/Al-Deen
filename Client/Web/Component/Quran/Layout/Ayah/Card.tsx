// Ayah Card
import { Copy, MoreHorizontal, Bookmark, FileText, Share2, BookMarked, BookOpen, Video, Code2 } from "lucide-react";
import { Class_Names } from "@/Library/Utility";
import { Use_Bookmarks } from "@/Hook/Use-Bookmarks";
import { Use_Auth } from "@Web/Context/Auth";
import { Use_Translation } from "@/Hook/Use-Translation";
import { Toast } from "@/Hook/Use-Toast";
import {
  Dropdown_Menu, Dropdown_Menu_Content, Dropdown_Menu_Item, Dropdown_Menu_Trigger,
} from "@Web/Component/UI/Dropdown-Menu";
import { Tooltip, Tooltip_Content, Tooltip_Provider, Tooltip_Trigger } from "@Web/Component/UI/Tooltip";
import { Use_Audio } from "@Web/Context/Audio";
import { Use_App } from "@Web/Context/App";
import { Word_Tooltip, Use_Audio_Playback, Get_Arabic_Field, Pick_Arabic_Text } from "../Utility";
import { useState, useMemo, ReactNode } from "react";
import { Container } from "@Web/Component/UI/Container";
import { Button } from "@Web/Component/UI/Button";
import { useQuery } from "@tanstack/react-query";
import { Fetch_Page_Sections_Corpus } from "@/Library/Quran-API";
import type { Page_Sections } from "@/Library/Quran-API";
import type { Kalimah } from "@/Library/Quran-Types";
import type { Ayah_Card_Properties } from "../Types";

const Arabic_Font_Fallback = "'Uthmani', 'Amiri', 'Traditional Arabic', serif";

const Latin_Text_Style: React.CSSProperties = {
  fontFamily: "var(--font-sans, ui-sans-serif, system-ui, sans-serif)",
  fontFeatureSettings: "normal",
  fontVariant: "normal",
  fontWeight: 400,
};

function Inline_Footnote({ Index, Text }: { Index: number; Text?: string }) {
  const [Is_Open, Set_Is_Open] = useState(false);

  const Toggle_Open = (Event: React.MouseEvent | React.KeyboardEvent) => {
    Event.preventDefault();
    Event.stopPropagation();
    Set_Is_Open((Previous) => !Previous);
  };

  return (
    <span className="inline-block align-baseline my-0.5 mx-1">
      <span
        role="button"
        tabIndex={0}
        onClick={Toggle_Open}
        onKeyDown={(Event) => {
          if (Event.key === "Enter" || Event.key === " ") {
            Toggle_Open(Event);
          }
        }}
        className={Class_Names(
          "transition-all Duration-300 ease-in-out border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 select-none cursor-pointer font-semibold",
          Is_Open
            ? "block w-full mt-1.5 p-3 text-left rounded-lg text-xs font-normal text-foreground bg-muted/70 border-emerald-500/20 leading-relaxed shadow-sm animate-in fade-in Duration-200"
            : "inline-flex items-center justify-center w-5 h-5 rounded-full text-[0.7rem] p-0 shrink-0"
        )}
        title={Is_Open ? "Click to collapse" : `Expand footnote ${Index}`}
      >
        {Is_Open ? (
          <div className="flex flex-col gap-1 w-full text-left">
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
              [{Index}] Footnote:
            </span>
            <span className="text-muted-foreground">
              {Text ? Text : "Footnote content Loading..."}
            </span>
          </div>
        ) : (
          <span>{Index}</span>
        )}
      </span>
    </span>
  );
}

function Resolve_Footnote_Text(
  Footnotes_List: unknown,
  Footnote_Number: number,
  Surah_ID?: number
): string | undefined {
  if (!Array.isArray(Footnotes_List) || Footnotes_List.length === 0) return undefined;

  if (typeof Footnotes_List[0] === "string") {
    return (Footnotes_List as string[])[Footnote_Number - 1];
  }

  const Entry = (Footnotes_List as any[]).find(
    (Footnote_Entry) =>
      Number(Footnote_Entry?.Footnote) === Footnote_Number &&
      (Surah_ID === undefined || Number(Footnote_Entry?.Surah) === Surah_ID)
  );

  return Entry?.Text;
}

function Render_Parsed_Translation(
  Raw_Translation: string,
  Footnotes_List?: unknown,
  Surah_ID?: number
): ReactNode[] {
  if (!Raw_Translation) return [];

  const Pattern = /(?:Master)?Footnote-(\d+)|\[(\d+)\]/gi;

  const Elements: ReactNode[] = [];
  let lastIndex = 0;
  let Match: RegExpExecArray | null;

  while ((Match = Pattern.exec(Raw_Translation)) !== null) {
    const Match_Start = Match.index;
    const Match_End = Pattern.lastIndex;

    if (Match_Start > lastIndex) {
      Elements.push(Raw_Translation.substring(lastIndex, Match_Start));
    }

    const Footnote_Number = parseInt(Match[1] || Match[2], 10);
    const Footnote_Text = Resolve_Footnote_Text(Footnotes_List, Footnote_Number, Surah_ID);

    Elements.push(
      <Inline_Footnote
        key={`fn-${Match_Start}-${Footnote_Number}`}
        Index={Footnote_Number}
        Text={Footnote_Text}
      />
    );

    lastIndex = Match_End;
  }

  if (lastIndex < Raw_Translation.length) {
    Elements.push(Raw_Translation.substring(lastIndex));
  }

  return Elements;
}

export function Ayah_Card({
  Ayah,
  Kalimah,
  Translation,
  Translations,
  Transliteration,
  Footnote,
  Surah,
  Show_Arabic_Text = true,
  Show_Translation = true,
  Translation_Font_Size,
  Transliteration_Font_Size = "0.875rem",
  Show_Transliteration = false,
  Hover_Translation,
  Hover_Transliteration,
  Inline_Translation,
  Inline_Transliteration,
  Is_Highlighted = false,
  Ayah_Reference,
  On_Notes_Click,
  On_Share_Click,
  On_Tafsir_Click,
  On_Embed_Click,
  On_Render_Click,
}: Ayah_Card_Properties) {
  const { t: Translate } = Use_Translation();
  const { User: User } = Use_Auth();
  const {
    Add_Bookmark: Add_Bookmark,
    Remove_Bookmark: Remove_Bookmark,
    Is_Bookmarked: Is_Bookmarked,
    Get_Bookmark_ID: Get_Bookmark_Id,
  } = Use_Bookmarks();

  const Surah_Id = Number(Surah?.Surah ?? Surah?.id ?? 1);
  const Ayah_ID = Number(
    Ayah?.Ayah ??
    (Ayah as any)?.Ayah_ID ??
    (Ayah as any)?.Ayah ??
    (Ayah as any)?.verse_number ??
    1
  );

  const { Play_Ayah_Audio: Play_Ayah, Active_Ayah: Active_Ayah, Active_Kalimah: Active_Kalimah } = Use_Audio();
  const { Hover_Recitation: Hover_Recitation, fontSize: fontSize, Quran_Font: Quran_Font, Settings: Settings } = Use_App();
  const { Play_Kalimah_Audio: Play_Kalimah_Audio, Is_Playing: Is_Playing } = Use_Audio_Playback(Surah_Id);

  const [Hovered_Ayah, Set_Hovered_Ayah] = useState<number | null>(null);

  const Arabic_Field = useMemo(() => Get_Arabic_Field(Quran_Font), [Quran_Font]);

  const Active_Hover_Translation = Settings?.Hover_Translation ?? Hover_Translation;
  const Active_Hover_Transliteration = Settings?.Hover_Transliteration ?? Hover_Transliteration;

  const Active_Inline_Translation = Settings?.Inline_Translation ?? Inline_Translation;
  const Active_Inline_Transliteration = Settings?.Inline_Transliteration ?? Inline_Transliteration;

  const Hover_Translation_Enabled = useMemo(() => {
    return Active_Hover_Translation !== "None" && Boolean(Active_Hover_Translation);
  }, [Active_Hover_Translation]);

  const Hover_Transliteration_Enabled = useMemo(() => {
    return Active_Hover_Transliteration !== "None" && Boolean(Active_Hover_Transliteration);
  }, [Active_Hover_Transliteration]);

  const Is_Hover_Feature_Active = Hover_Translation_Enabled || Hover_Transliteration_Enabled;

  const Show_Inline_Translation = useMemo(() => {
    return Active_Inline_Translation !== "None" && Boolean(Active_Inline_Translation);
  }, [Active_Inline_Translation]);

  const Show_Inline_Transliteration = useMemo(() => {
    return Active_Inline_Transliteration !== "None" && Boolean(Active_Inline_Transliteration);
  }, [Active_Inline_Transliteration]);

  const Has_Any_Inline_Active = Show_Inline_Translation || Show_Inline_Transliteration;

  const { data: Page_Sections_Map } = useQuery<Page_Sections>({
    queryKey: ["pageSectionsCorpus"],
    queryFn: Fetch_Page_Sections_Corpus,
    staleTime: 1000 * 60 * 60,
  });

  const Page_Font_Family = useMemo(() => {
    if (Quran_Font === "Uthmani_V1" || Quran_Font === "Uthmani_V2" || Quran_Font === "Uthmani_V4") {
      const Version = Quran_Font === "Uthmani_V1" ? "1" : Quran_Font === "Uthmani_V2" ? "2" : "4";
      const Start_Page = Surah?.Start_Page;
      const End_Page = Surah?.End_Page;

      if (Start_Page == null || End_Page == null || !Page_Sections_Map) {
        return `Uthmani-V${Version}`;
      }

      for (let Page_Number = Number(Start_Page); Page_Number <= Number(End_Page); Page_Number++) {
        const Segments = (Page_Sections_Map as Page_Sections)[Page_Number];
        if (!Segments) continue;

        const Matching_Segment = Segments.find(
          (Segment) =>
            Segment["Surah"] === Surah_Id &&
            Ayah_ID >= Segment["Start_Ayah"] &&
            Ayah_ID <= Segment["End_Ayah"]
        );

        if (Matching_Segment) {
          return `Uthmani-V${Version}-${Page_Number}`;
        }
      }

      return `Uthmani-V${Version}-${Start_Page}`;
    }

    if (Quran_Font === "IndoPak") return "IndoPak";
    return "Uthmani";
  }, [Quran_Font, Surah, Surah_Id, Ayah_ID, Page_Sections_Map]);

  const Page_Font_Family_With_Fallback = useMemo(
    () => `${Page_Font_Family}, ${Arabic_Font_Fallback}`,
    [Page_Font_Family]
  );

  const Computed_Font_Class = useMemo(() => {
    switch (Quran_Font) {
      case "IndoPak":    return "Font-IndoPak";
      case "Uthmani_V1": return "Font-Uthmani_V1";
      case "Uthmani_V2": return "Font-Uthmani_V2";
      case "Uthmani_V4": return "Font-Uthmani_V4";
      default:           return "Font-Uthmani";
    }
  }, [Quran_Font]);

  const Arabic_Font_Size = useMemo(() => `${(1.5 * fontSize) / 5}rem`, [fontSize]);

  const Rendered_Translations_List = useMemo(() => {
    if (Array.isArray(Translations) && Translations.length > 0) {
      return Translations.map((Item, Index) => {
        const Footnotes_List = Footnote || (Ayah as any)?.Footnote || (Ayah as any)?.Footnotes;
        return {
          id: Item.id || `tr-${Index}`,
          content: Render_Parsed_Translation(Item.Text || (Item as any).text, Footnotes_List, Surah_Id),
        };
      });
    }

    if (Translation) {
      const Footnotes_List = Footnote || (Ayah as any)?.Footnote || (Ayah as any)?.Footnotes;
      return [
        {
          id: "default",
          content: Render_Parsed_Translation(Translation, Footnotes_List, Surah_Id),
        },
      ];
    }

    return [];
  }, [Translations, Translation, Footnote, Ayah, Surah_Id]);

  const Has_Translation_Block = Show_Translation && Rendered_Translations_List.length > 0;
  const Has_Transliteration_Block = Show_Transliteration && Boolean(Transliteration);

  const Handle_Bookmark = async () => {
    const Ayah_Is_Bookmarked = Is_Bookmarked(Surah_Id, Ayah_ID);
    if (Ayah_Is_Bookmarked) {
      const Bookmark_ID = Get_Bookmark_Id(Surah_Id, Ayah_ID);
      if (Bookmark_ID) await Remove_Bookmark(Bookmark_ID);
    } else {
      await Add_Bookmark(Surah_Id, Ayah_ID);
    }
  };

  const Copy_Ayah = async () => {
    let Ayah_Text = `${Pick_Arabic_Text(Ayah, Arabic_Field)}\n\n`;
    if (Rendered_Translations_List.length > 0) {
      const Translations_Text = Translations && Translations.length > 0
        ? Translations.map((Translation_Item) => Translation_Item.Text || (Translation_Item as any).text).join("\n\n")
        : Translation;
      if (Translations_Text) Ayah_Text += `${Translations_Text}\n\n`;
    }
    if (Show_Transliteration && Transliteration) {
      Ayah_Text += `${Transliteration}\n\n`;
    }
    const Surah_Title = Surah?.Transliteration || Surah?.Translation || "";
    Ayah_Text += `- ${Surah_Title} ${Surah_Id}:${Ayah_ID}`;
    try {
      await navigator.clipboard.writeText(Ayah_Text);
      Toast({ title: "Copied to clipboard" });
    } catch {
      Toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  return (
    <Container 
      ref={Ayah_Reference} 
      className={Class_Names(Is_Highlighted && "ring-2 ring-primary")}
    >
      <div className="pt-4 px-6 sm:px-8 pb-2">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => Play_Ayah(Surah_Id, Ayah_ID)}
            onMouseEnter={() => Set_Hovered_Ayah(Ayah_ID)}
            onMouseLeave={() => Set_Hovered_Ayah(null)}
            className="text-sm text-muted-foreground hover:text-primary transition-colors font-mono"
          >
            {Surah_Id}:{Ayah_ID}
          </button>

          <div className="flex items-center gap-1">
            <Tooltip_Provider>
              <Tooltip>
                <Tooltip_Trigger asChild>
                  <Button size="sm" className="p-1.5 rounded-lg" onClick={Copy_Ayah}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </Tooltip_Trigger>
                <Tooltip_Content side="bottom">{Translate?.Quran?.copy || "Copy"}</Tooltip_Content>
              </Tooltip>

              <Tooltip>
                <Tooltip_Trigger asChild>
                  <Button 
                    size="sm"
                    className="p-1.5 rounded-lg"
                    onClick={() => {
                      if (!User) {
                        Toast({ title: "Sign in required", description: "Please sign in to bookmark Ayaat" });
                        return;
                      }
                      Handle_Bookmark();
                    }}
                  >
                    {Is_Bookmarked(Surah_Id, Ayah_ID)
                      ? <BookMarked className="h-4 w-4 fill-current" />
                      : <Bookmark className="h-4 w-4" />
                    }
                  </Button>
                </Tooltip_Trigger>
                <Tooltip_Content side="bottom">{Translate?.Quran?.bookmark || "Bookmark"}</Tooltip_Content>
              </Tooltip>

              <Tooltip>
                <Tooltip_Trigger asChild>
                  <Button size="sm" className="p-1.5 rounded-lg" onClick={On_Tafsir_Click}>
                    <BookOpen className="h-4 w-4" />
                  </Button>
                </Tooltip_Trigger>
                <Tooltip_Content side="bottom">Tafsir</Tooltip_Content>
              </Tooltip>

              <Dropdown_Menu>
                <Dropdown_Menu_Trigger asChild>
                  <Button size="sm" className="p-1.5 rounded-lg">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </Dropdown_Menu_Trigger>
                <Dropdown_Menu_Content align="end" className="w-48 z-[100]">
                  <Dropdown_Menu_Item className="gap-2 cursor-pointer" onClick={On_Notes_Click}>
                    <FileText className="h-4 w-4" />
                    {Translate?.Quran?.myNotes || "My Notes"}
                  </Dropdown_Menu_Item>
                  <Dropdown_Menu_Item className="gap-2 cursor-pointer" onClick={On_Share_Click}>
                    <Share2 className="h-4 w-4" />
                    {Translate?.Quran?.share || "Share"}
                  </Dropdown_Menu_Item>
                  {On_Render_Click && (
                    <Dropdown_Menu_Item className="gap-2 cursor-pointer" onClick={On_Render_Click}>
                      <Video className="h-4 w-4" />
                      Render Ayah
                    </Dropdown_Menu_Item>
                  )}
                  {On_Embed_Click && (
                    <Dropdown_Menu_Item className="gap-2 cursor-pointer" onClick={On_Embed_Click}>
                      <Code2 className="h-4 w-4" />
                      Embed Ayah
                    </Dropdown_Menu_Item>
                  )}
                </Dropdown_Menu_Content>
              </Dropdown_Menu>
            </Tooltip_Provider>
          </div>
        </div>

        {Show_Arabic_Text && (() => {
          const Kalimaat_List: Kalimah[] = Array.isArray(Kalimah) ? Kalimah.flat() : [];

          if (Kalimaat_List.length === 0) {
            const Full_Text = Pick_Arabic_Text(Ayah, Arabic_Field);
            return (
              <div className="flex justify-start mb-4" dir="rtl">
                <div
                  className={Computed_Font_Class}
                  style={{
                    fontSize: Arabic_Font_Size,
                    lineHeight: 2.2,
                    fontFamily: Page_Font_Family_With_Fallback,
                    width: "100%",
                  }}
                >
                  <span className="text-foreground">{Full_Text}</span>
                </div>
              </div>
            );
          }

          const Kalimah_Nodes = Kalimaat_List.map((Kalimah_Row, Index) => {
            if (!Kalimah_Row) return null;

            const Is_Ayah_End = Index === Kalimaat_List.length - 1;
            const Is_Ayah_Highlighted = Hovered_Ayah !== null && Ayah_ID === Hovered_Ayah;
            const Glyph = Pick_Arabic_Text(Kalimah_Row, Arabic_Field);

            const Kalimah_Key = `Kalimah-${Surah_Id}-${Ayah_ID}-${Index}`;
            const Ayah_Key = `Ayah-${Surah_Id}-${Ayah_ID}`;
            const Is_Playing_Audio = Is_Playing(Kalimah_Key) || Is_Playing(Ayah_Key);
            const Is_Active = !Is_Ayah_End && Ayah_ID === Active_Ayah && Index === Active_Kalimah;

            const KBK_Translation = !Is_Ayah_End
              ? (Kalimah_Row.Translation ?? (Kalimah_Row as any).KBK_Translation ?? (Kalimah_Row as any).Translation)
              : undefined;

            const KBK_Transliteration = !Is_Ayah_End
              ? (Kalimah_Row.Transliteration ?? (Kalimah_Row as any).KBK_Transliteration ?? (Kalimah_Row as any).Transliteration)
              : undefined;

            const Handle_Click = Is_Ayah_End
              ? () => Play_Ayah(Surah_Id, Ayah_ID)
              : () => Play_Kalimah_Audio(Ayah_ID, Index);

            const Handle_Mouse_Enter = () => { if (Is_Ayah_End) Set_Hovered_Ayah(Ayah_ID); };
            const Handle_Mouse_Leave = () => { if (Is_Ayah_End) Set_Hovered_Ayah(null); };

            let className = "inline select-text transition-colors Duration-200 ";
            if (Is_Ayah_Highlighted && !Is_Ayah_End) className += "text-emerald-600 dark:text-emerald-400";
            else if (Is_Active) className += "text-emerald-600 dark:text-emerald-400 animate-pulse";
            else if (Is_Playing_Audio) className += "text-emerald-600 dark:text-emerald-400 animate-pulse";
            else if (Is_Ayah_End) className += "text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer";
            else className += "text-foreground hover:text-emerald-600 dark:hover:text-emerald-400";

            const Cursor_Style = Is_Ayah_End ? "pointer" : (Hover_Recitation ? "pointer" : "text");

            return (
              <div
                key={`${Surah_Id}-${Ayah_ID}-${Index}`}
                className="relative inline-flex flex-col items-center mx-1 my-1 align-Top"
                style={Has_Any_Inline_Active ? { minWidth: "2rem" } : undefined}
                onMouseEnter={Handle_Mouse_Enter}
                onMouseLeave={Handle_Mouse_Leave}
              >
                <Word_Tooltip
  Translation={Hover_Translation_Enabled ? KBK_Translation : undefined}
  Transliteration={Hover_Transliteration_Enabled ? KBK_Transliteration : undefined}
  enabled={Is_Hover_Feature_Active}
  onClick={Handle_Click}
>
                  <span
                    className={className}
                    style={{ cursor: Cursor_Style, fontSize: Arabic_Font_Size, fontFamily: Page_Font_Family_With_Fallback, lineHeight: 2.2 }}
                  >
                    {Glyph}
                  </span>
                </Word_Tooltip>

                {Has_Any_Inline_Active && !Is_Ayah_End && (
                  <div
                    className="flex flex-col items-center gap-y-0.5 mt-1 w-full"
                    dir="ltr"
                    style={Latin_Text_Style}
                  >
                    {Show_Inline_Translation && KBK_Translation && (
                      <span
                        className="text-foreground text-center leading-tight block w-full text-[12px]"
                        style={Latin_Text_Style}
                      >
                        {KBK_Translation}
                      </span>
                    )}
                    {Show_Inline_Transliteration && KBK_Transliteration && (
                      <span
                        className="text-muted-foreground text-center leading-tight block w-full text-[12px]"
                        style={Latin_Text_Style}
                      >
                        {KBK_Transliteration}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          });

          return (
            <div className="flex justify-start mb-4" dir="rtl">
              <div
                className={Class_Names(Computed_Font_Class, "flex flex-wrap justify-start gap-x-1 items-start")}
                style={{ width: "100%" }}
              >
                {Kalimah_Nodes}
              </div>
            </div>
          );
        })()}

        <div>
          {Has_Translation_Block && (
            <div className="space-y-3 mt-2">
              {Rendered_Translations_List.map((Translation_Entry) => (
                <div key={Translation_Entry.id} className="space-y-1">
                  <p className="text-foreground leading-relaxed" style={{ fontSize: Translation_Font_Size }}>
                    {Translation_Entry.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {Has_Transliteration_Block && (
            <div className="mt-2 space-y-1">
              <p
                className="text-muted-foreground leading-relaxed italic"
                style={{ fontSize: Transliteration_Font_Size }}
              >
                {Transliteration}
              </p>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}