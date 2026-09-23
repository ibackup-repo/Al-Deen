// Client/Web/Component/Quran/Layout/Page/Page_Card.tsx
import React, { memo, useMemo, useState, useRef, useLayoutEffect } from "react";
import { Container } from "@Web/Component/UI/Container";
import { Use_App } from "@Web/Context/App";
import { Use_Audio } from "@Web/Context/Audio";
import { Word_Tooltip, Use_Audio_Playback, Extract_Ayah_Number_From_Marker } from "../Utility";
import { Bismillah } from "@Web/Component/Quran/Bismillah";
import type { Page_Lines_Properties, Resolved_Kalimah, Page_Card_Properties } from "../Types";

const LATIN_TEXT_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-sans, ui-sans-serif, system-ui, sans-serif)",
  fontFeatureSettings: "normal",
  fontVariant: "normal",
  fontWeight: 400,
};

const Arabic_Font_Fallback = "'Uthmani', 'Amiri', 'Traditional Arabic', serif";

export const Page_Lines = memo(function Page_Lines({
  Resolved_Lines,
  Font_Class,
  Arabic_Font_Size,
  Kalimah_Spacing = "1.8px",
  Surah_Number,
  Ayah_Reference,
  Highlighted_Ayah,
  Set_Highlighted_Ayah,
  Show_Transliteration,
  Transliteration_Font_Size,
  Hover_Translation,
  Hover_Transliteration,
  Inline_Translation,
  Inline_Transliteration,
  Hide_Ayaat = false,
  Hide_Ayah_Markers = false,
  Basmalah_Kalimaat = [],
  Basmalah_Font_Family,
  Basmalah_Font_Class = Font_Class,
  Basmalah_Font_Size = Arabic_Font_Size,
  Page_Font_Family,
  Is_Indo_Pak_Font = false,
  Ayah_Marker_Overrides = [],
  Is_Uthmani_V4_Font = false,
  Justify_Lines = true,
  Show_Basmalah = false,
}: Page_Lines_Properties & { Show_Basmalah?: boolean }) {
  const { Hifz } = Use_App();
  const { Active_Ayah, Active_Kalimah, Play_Ayah_Audio } = Use_Audio();
  const { Play_Kalimah_Audio, Is_Playing } = Use_Audio_Playback(Surah_Number);

  const Inline_Translation_Font_Size = 12;
  const Inline_Transliteration_Font_Size = 12;

  const Is_Hover_Translation_Enabled = useMemo(
    () => Hover_Translation !== "None" && Hover_Translation !== false && Hover_Translation !== undefined,
    [Hover_Translation]
  );

  const Is_Hover_Transliteration_Enabled = useMemo(
    () =>
      Hover_Transliteration !== "None" &&
      Hover_Transliteration !== false &&
      Hover_Transliteration !== undefined,
    [Hover_Transliteration]
  );

  const Show_Inline_Translation = Inline_Translation !== "None" && !!Inline_Translation;
  const Show_Inline_Transliteration = Inline_Transliteration !== "None" && !!Inline_Transliteration;
  const Has_Active_Inline = Show_Inline_Translation || Show_Inline_Transliteration;

  const Page_Font_Family_With_Fallback = useMemo(() => {
    const base = Page_Font_Family || Font_Class;
    return base ? `${base}, ${Arabic_Font_Fallback}` : Arabic_Font_Fallback;
  }, [Page_Font_Family, Font_Class]);

  const Is_Kalimah_Completed = (Ayah: any, Kalimah_Index: number): boolean => {
    if (!Ayah) return false;
    const Ayah_ID = Number(Ayah["Al-Ayah"] ?? Ayah.Ayah_ID ?? Ayah.Ayah);
    return Hifz.Is_Kalimah_Completed(Surah_Number, Ayah_ID, Kalimah_Index);
  };

  const Build_Kalimah_Class_Name = (
    Is_Ayah_Highlighted: boolean,
    Is_Ayah_Marker: boolean,
    Is_Ayah_End: boolean,
    Is_Active: boolean,
    Is_Audio_Playing: boolean
  ): string => {
    let className = "select-text transition-colors Duration-200 inline print:text-black ";
    if (Is_Ayah_Highlighted && !Is_Ayah_Marker) {
      className += "text-[hsl(var(--Quran-hover))]";
    } else if (Is_Active) {
      className += "text-foreground animate-pulse print:animate-none";
    } else if (Is_Audio_Playing) {
      className += "text-[hsl(var(--Quran-hover))] animate-pulse print:animate-none";
    } else if (Is_Ayah_End || Is_Ayah_Marker) {
      className += "text-muted-foreground hover:text-[hsl(var(--Quran-hover))] cursor-pointer print:text-black";
    } else {
      if (!Is_Uthmani_V4_Font) {
        className += "text-foreground hover:text-[hsl(var(--Quran-hover))]";
      }
    }
    return className;
  };

  const Build_Event_Handlers = (Kalimah: Resolved_Kalimah) => {
    const { Glyph, Ayah, Kalimah_Index, Is_Ayah_End, Is_Ayah_Marker, Ayah_ID } = Kalimah;

    const Resolved_Ayah_Number = Ayah
      ? Number((Ayah as any)["Al-Ayah"] ?? (Ayah as any).Ayah_ID ?? Ayah.Ayah)
      : Ayah_ID;

    let onClick: (() => void) | undefined;
    if (Ayah && Resolved_Ayah_Number !== null && Resolved_Ayah_Number !== undefined) {
      onClick = Is_Ayah_End
        ? () => Play_Ayah_Audio(Surah_Number, Resolved_Ayah_Number)
        : () => Play_Kalimah_Audio(Resolved_Ayah_Number, Kalimah_Index);
    } else if (Is_Ayah_Marker) {
      const Ayah_ID = Extract_Ayah_Number_From_Marker(Glyph);
      if (Ayah_ID !== null) onClick = () => Play_Ayah_Audio(Surah_Number, Ayah_ID);
    }

    const onMouseEnter = () => {
      if (Is_Ayah_Marker) {
        const Ayah_ID = Extract_Ayah_Number_From_Marker(Glyph);
        if (Ayah_ID !== null) Set_Highlighted_Ayah(Ayah_ID);
      } else if (Is_Ayah_End && Resolved_Ayah_Number !== null && Resolved_Ayah_Number !== undefined) {
        Set_Highlighted_Ayah(Resolved_Ayah_Number);
      }
    };

    const onMouseLeave = () => {
      if (Is_Ayah_Marker || Is_Ayah_End) {
        Set_Highlighted_Ayah(null);
      }
    };

    return { onClick, onMouseEnter, onMouseLeave };
  };

  const Render_Kalimah = (Kalimah: Resolved_Kalimah, index: number, Is_First_In_Line = false) => {
    const { Glyph, Ayah, Kalimah_Index, Is_Ayah_End, Is_Ayah_Marker, Ayah_ID } = Kalimah;

    const Resolved_Ayah_Number = Ayah
      ? Number((Ayah as any)["Al-Ayah"] ?? (Ayah as any).Ayah_ID ?? Ayah.Ayah)
      : Ayah_ID;

    const Is_Marker = Is_Ayah_End || Is_Ayah_Marker;
    const Should_Hide = (Hide_Ayaat && !Is_Marker) || (Hide_Ayah_Markers && Is_Marker);
    const Is_Kalimah_Complete = Ayah ? Is_Kalimah_Completed(Ayah, Kalimah_Index) : false;
    const Should_Be_Visible = !Should_Hide || Is_Kalimah_Complete;
    const Opacity_Class = Should_Be_Visible ? "opacity-100" : "opacity-0 print:opacity-100";
    const Transition_Class = "transition-opacity Duration-300";

    const Is_Ayah_Highlighted = Highlighted_Ayah !== null && Resolved_Ayah_Number === Highlighted_Ayah;

    const Raw_Translation = !Is_Ayah_End && Ayah
      ? (Ayah as any).KBK_Translation?.[Kalimah_Index] ?? (Ayah as any).Text?.[Kalimah_Index]
      : undefined;

    const Raw_Transliteration = !Is_Ayah_End && Ayah
      ? (Ayah as any).KBK_Transliteration?.[Kalimah_Index] ?? (Ayah as any).Text_Content?.[Kalimah_Index]
      : undefined;

    const Inline_Translation_Text = Show_Inline_Translation ? Raw_Translation : undefined;
    const Inline_Transliteration_Text = Show_Inline_Transliteration ? Raw_Transliteration : undefined;

    const Kalimah_Key = Resolved_Ayah_Number !== undefined ? `Kalimah-${Resolved_Ayah_Number}-${Kalimah_Index}` : null;
    const Ayah_Key = Resolved_Ayah_Number !== undefined ? `Ayah-${Resolved_Ayah_Number}` : null;
    const Is_Audio_Playing =
      (Kalimah_Key !== null && Is_Playing(Kalimah_Key)) ||
      (Ayah_Key !== null && Is_Playing(Ayah_Key));

    const Is_Active =
      !Is_Ayah_End &&
      !Is_Ayah_Marker &&
      Resolved_Ayah_Number === Active_Ayah &&
      Kalimah_Index === Active_Kalimah;

    const { onClick, onMouseEnter, onMouseLeave } = Build_Event_Handlers(Kalimah);

    const Handle_Kalimah_Click = (event: React.MouseEvent) => {
      event.stopPropagation();
      if (Hide_Ayaat && Ayah && Resolved_Ayah_Number !== null && Resolved_Ayah_Number !== undefined && !Is_Marker) {
        if (Is_Kalimah_Complete) {
          Hifz.Unmark_Kalimah_Completed(Surah_Number, Resolved_Ayah_Number, Kalimah_Index);
        } else {
          Hifz.Mark_Kalimah_Completed(Surah_Number, Resolved_Ayah_Number, Kalimah_Index);
        }
      }
      if (onClick) onClick();
    };

    let Element_Class_Name = Build_Kalimah_Class_Name(
      Is_Ayah_Highlighted,
      Is_Ayah_Marker,
      Is_Ayah_End,
      Is_Active,
      Is_Audio_Playing
    );

    if (Is_Uthmani_V4_Font && (Is_Active || Is_Audio_Playing)) {
      Element_Class_Name += " Uthmani-Glyph-highlighted";
    }

    const Element_Reference = (el: HTMLSpanElement | null) => {
      if (el && Is_First_In_Line && Resolved_Ayah_Number && index === 0) {
        if (Ayah_Reference?.current) {
          Ayah_Reference.current.set(Resolved_Ayah_Number, el as unknown as HTMLDivElement);
        }
      }
    };

    const Show_Inline_Translation_Column = Show_Inline_Translation && !!Inline_Translation_Text;
    const Show_Inline_Transliteration_Column = Show_Inline_Transliteration && !!Inline_Transliteration_Text;
    const Has_Inline = Show_Inline_Translation_Column || Show_Inline_Transliteration_Column;

    const dataAttributes: Record<string, string | number | undefined> = {
      "data-Ayah": Resolved_Ayah_Number,
      "data-Kalimah": Kalimah_Index,
    };
    if (Is_Marker) dataAttributes["data-is-Ayah-marker"] = "true";

    let Display_Text = Glyph;
    if (Is_Indo_Pak_Font && Is_Marker && Resolved_Ayah_Number) {
      const override = Ayah_Marker_Overrides[Resolved_Ayah_Number - 1];
      if (override && override !== "") {
        Display_Text = override;
      }
    }

    return (
      <div
        key={index}
        className={`relative flex flex-col items-center ${Opacity_Class} ${Transition_Class} print:break-inside-avoid`}
        style={Has_Active_Inline ? { minWidth: "2rem" } : undefined}
        data-Kalimah={Kalimah_Index}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
       <Word_Tooltip
  Translation={Raw_Translation}
  Transliteration={Raw_Transliteration}
  enabled={Is_Hover_Translation_Enabled || Is_Hover_Transliteration_Enabled}
  onClick={Handle_Kalimah_Click}
>
          <span
            ref={Element_Reference}
            className={Element_Class_Name}
            style={{ cursor: "pointer" }}
            {...dataAttributes}
          >
            {Display_Text}{" "}
          </span>
        </Word_Tooltip>

        {Has_Inline && (
          <div
            className="flex flex-col items-center gap-y-0.5 mt-1 w-full print:text-black"
            dir="ltr"
            style={LATIN_TEXT_STYLE}
          >
            {Show_Inline_Translation_Column && (
              <span
                className="text-black dark:text-white print:text-black text-center leading-tight block w-full"
                style={{ ...LATIN_TEXT_STYLE, fontSize: `${Inline_Translation_Font_Size}px` }}
              >
                {Inline_Translation_Text}
              </span>
            )}
            {Show_Inline_Transliteration_Column && (
              <span
                className="text-gray-500 dark:text-gray-400 print:text-gray-700 text-center leading-tight block w-full"
                style={{ ...LATIN_TEXT_STYLE, fontSize: `${Inline_Transliteration_Font_Size}px` }}
              >
                {Inline_Transliteration_Text}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  const Justify_Class = Justify_Lines ? "justify-between" : "justify-center";
  const Container_Reference = useRef<HTMLDivElement>(null);
  const [Is_Wrap_Mode, Set_Is_Wrap_Mode] = useState(false);
  const [Min_Width_Threshold, Set_Min_Width_Threshold] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = Container_Reference.current;
    if (!el) return;
    const Check_Overflow = () => {
      const width = el.clientWidth;
      if (Is_Wrap_Mode) {
        if (Min_Width_Threshold !== null && width >= Min_Width_Threshold) {
          Set_Is_Wrap_Mode(false);
          Set_Min_Width_Threshold(null);
        }
        return;
      }
      const Lines_Data = el.querySelectorAll<HTMLElement>("[data-line-Container]");
      let Has_Overflow = false;
      Lines_Data.forEach((line) => {
        const firstElement = line.firstElementChild as HTMLElement | null;
        if (!firstElement) return;
        if (line.offsetHeight > firstElement.offsetHeight * 1.4) Has_Overflow = true;
      });
      if (Has_Overflow) {
        Set_Min_Width_Threshold(width + 60);
        Set_Is_Wrap_Mode(true);
      }
    };
    Check_Overflow();
    const resizeObserver = new ResizeObserver(Check_Overflow);
    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, [Is_Wrap_Mode, Min_Width_Threshold, Resolved_Lines]);

  const Flattened_Kalimaat = useMemo(() => Resolved_Lines.flat(), [Resolved_Lines]);

  return (
    <div className="space-y-2 p-4 print:p-0 print:space-y-0">
      {Show_Basmalah && (
        <div className="my-4 text-center">
          {Basmalah_Kalimaat && Basmalah_Kalimaat.length > 0 ? (
            <Bismillah
              Kalimaat={Basmalah_Kalimaat}
              Font_Class={Basmalah_Font_Class}
              fontSize={Basmalah_Font_Size}
              fontFamily={Basmalah_Font_Family}
              wordSpacing={Kalimah_Spacing}
              Show_Inline_Translation={Show_Inline_Translation}
              Show_Inline_Transliteration={Show_Inline_Transliteration}
              Hover_Translation_Enabled={Is_Hover_Translation_Enabled}
              Hover_Transliteration_Enabled={Is_Hover_Transliteration_Enabled}
              Inline_Translation_Size={Inline_Translation_Font_Size}
              Inline_Transliteration_Size={Inline_Transliteration_Font_Size}
            />
          ) : (
            <div
              className={`text-center my-2 text-foreground ${Basmalah_Font_Class || Font_Class || ""}`}
              style={{
                fontSize: Arabic_Font_Size || "1.75rem",
                fontFamily: Basmalah_Font_Family || Page_Font_Family_With_Fallback,
              }}
              dir="rtl"
            >
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </div>
          )}
        </div>
      )}

      <div
        ref={Container_Reference}
        className={`${Font_Class} print:text-black`}
        style={{
          fontSize: Arabic_Font_Size,
          lineHeight: 1.8,
          fontFamily: Page_Font_Family_With_Fallback,
        }}
        dir="rtl"
      >
        {Is_Wrap_Mode ? (
          <div
            className={`flex flex-wrap items-start ${Has_Active_Inline ? "gap-x-3" : ""}`}
            style={{ width: "100%" }}
            dir="rtl"
          >
            {Flattened_Kalimaat.map((Kalimah, index) => Render_Kalimah(Kalimah, index, false))}
          </div>
        ) : (
          Resolved_Lines.map((line, lineIndex) => (
            <div
              key={lineIndex}
              className={`flex ${Justify_Class} items-start flex-wrap ${Has_Active_Inline ? "gap-x-3 mb-6" : "mb-0"} print:break-inside-avoid`}
              style={{ width: "100%" }}
              dir="rtl"
              data-line-Container
            >
              {line.map((Kalimah, Kalimah_Index) => Render_Kalimah(Kalimah, Kalimah_Index, true))}
            </div>
          ))
        )}
      </div>
    </div>
  );
});

export const Page_Card = memo(function Page_Card({
  Page_Data,
  Raw_Page_Data,
  Page_Index,
  Surah_Number,
  Resolved_Lines = [],
  Container_Class,
  Show_Arabic_Text = true,
  Show_Transliteration,
  Show_Basmalah_On_Page: Provided_Show_Basmalah,
  Basmalah_Kalimaat = [],
  Page_Font_Family,
  Basmalah_Font_Family,
  Font_Class,
  Arabic_Font_Size,
  Kalimah_Spacing,
  Ayah_Reference,
  Highlighted_Ayah,
  Set_Highlighted_Ayah,
  Transliteration_Font_Size,
  Hover_Translation,
  Hover_Transliteration,
  Inline_Translation,
  Inline_Transliteration,
  Hide_Ayaat,
  Hide_Ayah_Markers,
  Is_Indo_Pak_Font,
  Ayah_Marker_Overrides,
  Is_Uthmani_V4_Font,
  Page_Footer,
  Layout,
}: Page_Card_Properties) {
  const Page_Number = Number((Page_Data as any)?.Page_Number ?? (Page_Data as any)?.Page ?? Page_Index ?? 0);

  const Inferred_Surah_Number = useMemo(() => {
    if (Surah_Number) return Number(Surah_Number);
    if ((Page_Data as any)?.Surah_Number) return Number((Page_Data as any).Surah_Number);
    if ((Page_Data as any)?.Ayaat?.[0]?.Surah_Number) return Number((Page_Data as any).Ayaat[0].Surah_Number);
    return 1;
  }, [Surah_Number, Page_Data]);

  const Should_Show_Basmalah = useMemo(() => {
    if (Provided_Show_Basmalah !== undefined) {
      return Provided_Show_Basmalah;
    }
    const Is_Not_Tawbah_Or_Fatihah = Inferred_Surah_Number !== 1 && Inferred_Surah_Number !== 9;
    const First_Ayah_Number =
      (Page_Data as any)?.Ayaat?.[0]?.Ayah_ID ??
      (Page_Data as any)?.Ayaat?.[0]?.Ayah ??
      Resolved_Lines[0]?.[0]?.Ayah_ID;

    return Number(First_Ayah_Number) === 1 && Is_Not_Tawbah_Or_Fatihah;
  }, [Provided_Show_Basmalah, Inferred_Surah_Number, Page_Data, Resolved_Lines]);

  return (
    <Container className={`w-full ${Container_Class} print:bg-white print:text-black print:shadow-none print:border-none print:m-0 print:p-0 print:break-after-page`}>
      <div className="relative print:static">
        {Show_Arabic_Text && Resolved_Lines.length > 0 ? (
          <Page_Lines
            Resolved_Lines={Resolved_Lines}
            Font_Class={Font_Class || ""}
            Arabic_Font_Size={Arabic_Font_Size || "1.5rem"}
            Kalimah_Spacing={Kalimah_Spacing || "1.8px"}
            Surah_Number={Inferred_Surah_Number}
            Ayah_Reference={Ayah_Reference}
            Highlighted_Ayah={Highlighted_Ayah ?? null}
            Set_Highlighted_Ayah={Set_Highlighted_Ayah || (() => {})}
            Show_Transliteration={Show_Transliteration}
            Hover_Translation={Hover_Translation || false}
            Hover_Transliteration={Hover_Transliteration || false}
            Inline_Translation={Inline_Translation || "None"}
            Inline_Transliteration={Inline_Transliteration || "None"}
            Hide_Ayaat={Hide_Ayaat}
            Hide_Ayah_Markers={Hide_Ayah_Markers}
            Basmalah_Kalimaat={Basmalah_Kalimaat}
            Show_Basmalah={Should_Show_Basmalah}
            Basmalah_Font_Family={Should_Show_Basmalah ? (Basmalah_Font_Family || Page_Font_Family) : undefined}
            Basmalah_Font_Class={Font_Class}
            Basmalah_Font_Size={Arabic_Font_Size}
            Page_Font_Family={Page_Font_Family}
            Is_Indo_Pak_Font={Is_Indo_Pak_Font}
            Ayah_Marker_Overrides={Ayah_Marker_Overrides}
            Is_Uthmani_V4_Font={Is_Uthmani_V4_Font}
            Justify_Lines={false}
          />
        ) : (
          <div className="p-4 text-xs font-mono bg-red-500/10 text-red-500 border border-red-500/30 rounded my-2">
            ⚠️ Page_Lines Failed to Render! 
            {!Show_Arabic_Text && " (Reason: Show_Arabic_Text is false)"}
            {Resolved_Lines.length === 0 && " (Reason: Resolved_Lines is empty)"}
          </div>
        )}

        {!Show_Arabic_Text && Show_Transliteration && Page_Data && (
          <div className="space-y-1 p-4 print:p-0">
            {(Page_Data as any).Ayaat?.map((Ayah: any) => {
              const Ayah_ID = Number(Ayah["Al-Ayah"] ?? Ayah.Ayah_ID ?? Ayah.Ayah);
              const Ayah_Text_Content = Ayah["Text_Content"] || Ayah["Al-Arabiyyah"] || Ayah.Text || Ayah.Arabic;
              if (!Ayah_Text_Content) return null;
              return (
                <p
                  key={`translit-${Ayah_ID}`}
                  className={`text-muted-foreground print:text-black leading-relaxed text-center transition-colors Duration-200 ${
                    Highlighted_Ayah === Ayah_ID ? "bg-primary/10 print:bg-transparent rounded px-1" : ""
                  }`}
                  style={{ fontSize: Transliteration_Font_Size }}
                  onMouseEnter={() => Set_Highlighted_Ayah && Set_Highlighted_Ayah(Ayah_ID)}
                  onMouseLeave={() => Set_Highlighted_Ayah && Set_Highlighted_Ayah(null)}
                >
                  {Ayah_Text_Content}
                </p>
              );
            })}
          </div>
        )}
      </div>

      {Page_Footer && (
        <div className="flex items-center justify-center pb-2 pt-1 print:pb-0 print:pt-2">
          {typeof Page_Footer === "function" ? Page_Footer((Page_Data as any)?.Page_Number) : Page_Footer}
        </div>
      )}
    </Container>
  );
});