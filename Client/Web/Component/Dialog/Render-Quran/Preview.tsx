// @Web/Component/Dialog/Render-Surah-Preview.tsx
import React, { useMemo, useEffect } from "react";
import { Button } from "@Web/Component/UI/Button";
import { Class_Names } from "@/Library/Utility";
import { Minimize2, Maximize2, Copy } from "lucide-react";
import { Toast } from "@/Hook/Use-Toast";
import { type Config, Build_Embed_Preview_Doc } from "./Types";

interface Render_Surah_Preview_Properties {
  Mode: "render" | "embed";
  Config_Settings: Config;
  ecfg: Config & Record<string, any>;
  Ayaat: any[];
  Current_Verse_Idx: number;
  Preview_Wrap_Ref: React.RefObject<HTMLDivElement | null>;
  Preview_Aspect_Ratio: number;
  fullscreen: boolean;
  Set_Is_Fullscreen: React.Dispatch<React.SetStateAction<boolean>>;
  Embed_Snippet: string;
  Is_Intro_Visible: boolean;
  Is_Outro_Visible: boolean;
  colors: {
    Arabic_Color: string;
    Translation_Color: string;
    Transliteration_Color: string;
    Highlight_Color: string;
  };
  Page_Font_Family: (Font_Name: string, Surah_ID: number, Ayah_ID: number) => string;
  Font_Class: (Font_Name: string) => string;
  Pos_Classes: (Position_Name: string) => string;
  cornerCls: Record<string, string>;
  Our_Logo_Corner: string;
}

export function Render_Surah_Preview({
  Mode, 
  Config_Settings, 
  ecfg, 
  Ayaat, 
  Current_Verse_Idx, 
  Preview_Wrap_Ref, 
  Preview_Aspect_Ratio,
  fullscreen, 
  Set_Is_Fullscreen, 
  Embed_Snippet, 
  Is_Intro_Visible, 
  Is_Outro_Visible,
  colors, 
  Page_Font_Family, 
  Font_Class, 
  Pos_Classes, 
  cornerCls, 
  Our_Logo_Corner
}: Render_Surah_Preview_Properties) {
  const { Arabic_Color: Arabic_Color, Translation_Color: Translation_Color, Transliteration_Color: Transliteration_Color, Highlight_Color: Highlight_Color } = colors;

  useEffect(() => {
    if (fullscreen) {
      window.dispatchEvent(new Event("hide-header"));
    } else {
      window.dispatchEvent(new Event("show-header"));
    }

    return () => {
      window.dispatchEvent(new Event("show-header"));
    };
  }, [fullscreen]);

  const Watermark_Placement_Class = useMemo(() => {
    const Has_Logo_At_Top_Right = Config_Settings.Logo_Url && Config_Settings.Logo_Corner === "tr";
    const Computed_Corner_Key = Has_Logo_At_Top_Right ? "tl" : "tr";
    return cornerCls[Computed_Corner_Key];
  }, [Config_Settings.Logo_Url, Config_Settings.Logo_Corner, cornerCls]);

  return (
    <div className={Class_Names("space-y-3", fullscreen ? "space-y-0" : "")}>
      <div className={Class_Names("w-full", fullscreen ? "h-screen w-screen fixed inset-0 z-50 bg-black" : "")}>
        <div
          ref={Preview_Wrap_Ref}
          className={Class_Names(
            "relative overflow-hidden transition-all Duration-150",
            fullscreen 
              ? "w-screen h-screen max-w-none max-h-none m-0 p-0 rounded-none z-50" 
              : "w-full mx-auto shadow-xl"
          )}
          style={{
            aspectRatio: fullscreen ? undefined : Preview_Aspect_Ratio,
            maxWidth: fullscreen ? "100vw" : (Preview_Aspect_Ratio >= 1 ? "100%" : "min(70vh, 100%)"),
            Border_Radius: fullscreen ? "0px" : Config_Settings.Border_Radius,
            height: fullscreen ? "100vh" : undefined,
          }}
        >
          {Mode === "embed" ? (
            <iframe
              title="Embed preview"
              srcDoc={Build_Embed_Preview_Doc(
                ecfg as unknown as Config,
                Ayaat,
                { Arabic_Color: Arabic_Color, Translation_Color: Translation_Color, Transliteration_Color: Transliteration_Color, Highlight_Color: Highlight_Color },
                ecfg.Extra_Translations || {},
                ecfg.Extra_Transliterations || {}
              )}
              className="absolute inset-0 w-full h-full bg-white"
            />
          ) : (
            <>
              {Config_Settings.Bg_Kind === "video" && Config_Settings.Bg_Url ? (
                <video src={Config_Settings.Bg_Url} autoPlay muted Loop className="absolute inset-0 w-full h-full object-cover" />
              ) : Config_Settings.Bg_Kind === "image" && Config_Settings.Bg_Url ? (
                <img src={Config_Settings.Bg_Url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0" style={{ background: Config_Settings.Bg_Color }} />
              )}

              {Config_Settings.Logo_Url && (
                <img src={Config_Settings.Logo_Url} alt="logo"
                  className={Class_Names("absolute h-10 w-auto object-contain z-10", cornerCls[Config_Settings.Logo_Corner])} />
              )}

              {Is_Intro_Visible && Config_Settings.Intro_Url && (
                <video src={Config_Settings.Intro_Url} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover bg-black" />
              )}
              {Is_Outro_Visible && Config_Settings.Outro_Url && (
                <video src={Config_Settings.Outro_Url} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover bg-black" />
              )}

              {!Is_Intro_Visible && !Is_Outro_Visible && (() => {
                const Active_Ayah = Ayaat[Current_Verse_Idx];
                if (!Active_Ayah) return null;
                
                const Current_Word_Idx = 0; 
                const Active_Translations = ecfg.Translations.filter((Translation_Item: string) => Translation_Item !== "None");
                const Active_Transliterations = ecfg.Transliterations.filter((Transliteration_Item: string) => Transliteration_Item !== "None");
                const Computed_Font_Family = Page_Font_Family(ecfg.font, Config_Settings.Surah_ID, Active_Ayah.Ayah_ID);

                return (
                  <>
                    <div className={Class_Names("absolute inset-0 flex p-6 pointer-events-none", Pos_Classes(Config_Settings.Arabic_Position))}>
                      <div dir="rtl"
                        className={Class_Names("max-w-[90%] leading-relaxed", Font_Class(ecfg.font))}
                        style={{ color: Arabic_Color, fontSize: ecfg.Arabic_Size, fontFamily: Computed_Font_Family }}>
                        {Active_Ayah.Kalimaat.map((Word_Item: string, Kalimah_Index: number) => (
                          <span key={Kalimah_Index} style={Kalimah_Index === Current_Word_Idx ? { color: Highlight_Color } : undefined}>
                            {Word_Item}{ecfg.font === "Uthmani_V1" ? "" : " "}
                          </span>
                        ))}
                      </div>
                    </div>

                    {Active_Transliterations.length > 0 && (
                      <div className={Class_Names("absolute inset-0 flex p-6 pointer-events-none", Pos_Classes(Config_Settings.Transliteration_Position))}>
                        <div className="max-w-[90%]">
                          {Active_Transliterations.map((Source_Key: string) => (
                            <div key={Source_Key} className="italic" style={{ color: Transliteration_Color, fontSize: ecfg.Transliteration_Size }}>
                              {ecfg.Extra_Transliterations?.[Source_Key]?.[Active_Ayah.Ayah_ID - 1] ?? ""}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {Active_Translations.length > 0 && (
                      <div className={Class_Names("absolute inset-0 flex p-6 pointer-events-none", Pos_Classes(Config_Settings.Translation_Position))}>
                        <div className="max-w-[90%]">
                          {Active_Translations.map((Source_Key: string) => (
                            <div key={Source_Key} style={{ color: Translation_Color, fontSize: ecfg.Translation_Size }}>
                              {ecfg.Extra_Translations?.[Source_Key]?.[Active_Ayah.Ayah_ID - 1] ?? ""}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {Config_Settings.Show_Lines && (
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between px-6 py-8">
                  {Array.from({ length: Math.max(2, Config_Settings.Lines_Count) }).map((_, Line_Index) => (
                    <div key={Line_Index} className="h-px bg-white/20" />
                  ))}
                </div>
              )}

              {Config_Settings.Show_Watermark && Config_Settings.Watermark_Text && (
                <div className={Class_Names("absolute text-[10px] sm:text-xs font-semibold text-white/85 pointer-events-none p-3 z-10", Watermark_Placement_Class)}
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>
                  {Config_Settings.Watermark_Text}
                </div>
              )}
            </>
          )}

          {Mode === "render" && (
            <button
              type="button"
              onClick={() => Set_Is_Fullscreen((Previous_State) => !Previous_State)}
              className="absolute bottom-3 right-3 z-20 inline-flex items-center justify-center h-9 w-9 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
              aria-label={fullscreen ? "Exit full screen" : "Full screen"}
            >
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {Mode === "embed" && (
        <Box>
          <div className="flex items-center justify-between mb-2">
            <Section_Title>Embed Snippet</Section_Title>
            <Button size="sm" variant="outline" className="gap-1"
              onClick={() => { navigator.clipboard?.writeText(Embed_Snippet); Toast({ title: "Copied" }); }}>
              <Copy className="h-3 w-3" /> Copy
            </Button>
          </div>
          <pre className="text-xs bg-muted/50 rounded p-3 overflow-auto whitespace-pre-wrap break-all">
            {Embed_Snippet}
          </pre>
        </Box>
      )}
    </div>
  );
}

function Box({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={Class_Names("rounded-2xl border border-border/40 bg-card/40 p-3", className)}>
      {children}
    </div>
  );
}

function Section_Title({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{children}</div>;
}