// @Web/Component/Dialog/Render-Surah-Sidebar.tsx
import React, { useState } from "react";
import { Button } from "@Web/Component/UI/Button";
import { Input } from "@Web/Component/UI/Input";
import { Label } from "@Web/Component/UI/Label";
import { Switch } from "@Web/Component/UI/Switch";
import { Slider } from "@Web/Component/UI/Slider";
import { Class_Names } from "@/Library/Utility";
import { Download, Copy, ChevronDown } from "lucide-react";
import { Toast } from "@/Hook/Use-Toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@Web/Component/UI/Select";
import {
  type Config,
  type Position,
  type Corner,
  Resolutions,
  Reciters,
  POSITIONS,
} from "./Types";

interface Sidebar_Properties {
  Mode: "render" | "embed";
  Configuration: Config;
  Set_Configuration: React.Dispatch<React.SetStateAction<Config>>;
  Surah_List: Array<{ id: number; English_Name: string }>;
  All_Ayaat: any[];
  Is_Rendering: boolean;
  Render_Progress: number;
  Result_Url: string | null;
  Result_Size: number;
  Result_Extension: string;
  Embed_Snippet: string;
  Cancel_Reference: React.MutableRefObject<boolean>;
  Handle_Render: () => Promise<void>;
  On_File_Change: (Field: "Bg_Url" | "Logo_Url" | "Container_Bg_Url", Kind_Field?: "image" | "video") => (Event_Parameter: React.ChangeEvent<HTMLInputElement>) => void;
  children?: React.ReactNode;
}

export function Render_Surah_Sidebar({
  Mode, Configuration, Set_Configuration, Surah_List, All_Ayaat, Is_Rendering, Render_Progress,
  Result_Url, Result_Size, Result_Extension, Embed_Snippet, Cancel_Reference, Handle_Render, On_File_Change, children
}: Sidebar_Properties) {
  
  const [Open_Sections, Set_Open_Sections] = useState<Record<string, boolean>>({
    output: true,
    background: true,
    size: true,
    colors: false,
    positioning: false,
    overlays: false,
    media: false,
    embed: false,
  });

  const Toggle_Section = (Section_Key: string) => {
    Set_Open_Sections((Previous) => ({ ...Previous, [Section_Key]: !Previous[Section_Key] }));
  };

  return (
    <div className="flex flex-col h-full w-full m-0 p-0 overflow-hidden">
      
      <div className="flex-1 w-full overflow-y-visible lg:overflow-y-auto m-0 p-0 lg:scrollbar-none lg:[&::-webkit-scrollbar]:hidden lg:[-ms-overflow-style:none] lg:[scrollbar-width:none] overscroll-contain touch-pan-y">
        
        <div className="pt-14 pb-2 lg:pb-2 pl-0 pr-0 space-y-3 w-full m-0 p-0 box-border">
          
          {/* Output Section */}
          <Dropdown_Card title="Output" Is_Open={Open_Sections.output} On_Toggle={() => Toggle_Section("output")}>
            {Mode === "render" && (
              <>
                <Row label="resolution">
                  <Select value={Configuration.resolution} onValueChange={(Value: Config["resolution"]) => Set_Configuration((Previous) => ({ ...Previous, resolution: Value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(Resolutions).map(([Key, Value]) => (
                        <SelectItem key={Key} value={Key}>{Value.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Row>
                <Row label="Format">
                  <Select value={Configuration.Export_Format} onValueChange={(Value: Config["Export_Format"]) => Set_Configuration((Previous) => ({ ...Previous, Export_Format: Value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="webm">WebM (VP9)</SelectItem>
                      <SelectItem value="mp4">MP4</SelectItem>
                    </SelectContent>
                  </Select>
                </Row>
                <Row label="Reciter">
                  <Select value={Configuration.Reciter} onValueChange={(Value) => Set_Configuration((Previous) => ({ ...Previous, Reciter: Value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Reciters.map((Item) => <SelectItem key={Item} value={Item}>{Item}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Row>
              </>
            )}
            <Row label="Surah">
              <Select value={String(Configuration.Surah_ID)} onValueChange={(Value) => Set_Configuration((Previous) => ({ ...Previous, Surah_ID: parseInt(Value), Ayah_Start: 1, Ayah_End: 1 }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {Surah_List.map((Item) => (
                    <SelectItem key={Item.id} value={String(Item.id)}>{Item.id}. {Item.English_Name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
            <Row label="From Ayah">
              <Select value={String(Configuration.Ayah_Start)} onValueChange={(Value) => Set_Configuration((Previous) => {
                const Start = parseInt(Value); return { ...Previous, Ayah_Start: Start, Ayah_End: Math.max(Start, Previous.Ayah_End) };
              })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {All_Ayaat.map((Item) => (
                    <SelectItem key={Item.Ayah_ID} value={String(Item.Ayah_ID)}>{Item.Ayah_ID}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
            <Row label="To Ayah">
              <Select value={String(Configuration.Ayah_End)} onValueChange={(Value) => Set_Configuration((Previous) => ({ ...Previous, Ayah_End: parseInt(Value) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {All_Ayaat.filter((Item) => Item.Ayah_ID >= Configuration.Ayah_Start).map((Item) => (
                    <SelectItem key={Item.Ayah_ID} value={String(Item.Ayah_ID)}>{Item.Ayah_ID}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
          </Dropdown_Card>

          {/* Background Section */}
          {Mode === "render" && (
            <Dropdown_Card title="Background" Is_Open={Open_Sections.background} On_Toggle={() => Toggle_Section("background")}>
              <Row label="Color">
                <input type="color" value={Configuration.Bg_Color}
                  On_Change={(Event) => Set_Configuration((Previous) => ({ ...Previous, Bg_Color: Event.target.value, Bg_Kind: "color" }))}
                  className="h-8 w-full rounded border-0 bg-transparent cursor-pointer" />
              </Row>
              <Row label="Image">
                <Input type="file" accept="image/*" On_Change={On_File_Change("Bg_Url", "image")} className="text-xs" />
              </Row>
              <Row label="Video">
                <Input type="file" accept="video/*" On_Change={On_File_Change("Bg_Url", "video")} className="text-xs" />
              </Row>
            </Dropdown_Card>
          )}

          {/* Embed Dimensions */}
          {Mode === "embed" && (
            <Dropdown_Card title="Size" Is_Open={Open_Sections.size} On_Toggle={() => Toggle_Section("size")}>
              <Row label="width"><Input type="number" value={Configuration.width}
                On_Change={(Event) => Set_Configuration((Previous) => ({ ...Previous, width: Math.max(120, parseInt(Event.target.value || "0") || 0) }))} /></Row>
              <Row label="height"><Input type="number" value={Configuration.height}
                On_Change={(Event) => Set_Configuration((Previous) => ({ ...Previous, height: Math.max(120, parseInt(Event.target.value || "0") || 0) }))} /></Row>
            </Dropdown_Card>
          )}

          {/* Colors */}
          <Dropdown_Card title="Colors" Is_Open={Open_Sections.colors} On_Toggle={() => Toggle_Section("colors")}>
            <Toggle_Row label="Auto contrast" value={Configuration.Auto_Contrast} On_Change={(Value) => Set_Configuration((Previous) => ({ ...Previous, Auto_Contrast: Value }))} />
            <Color_Row label="Arabic" value={Configuration.Arabic_Color} On_Change={(Value) => Set_Configuration((Previous) => ({ ...Previous, Arabic_Color: Value }))} />
            <Color_Row label="Translation" value={Configuration.Translation_Color} On_Change={(Value) => Set_Configuration((Previous) => ({ ...Previous, Translation_Color: Value }))} />
            <Color_Row label="Transliteration" value={Configuration.Transliteration_Color} On_Change={(Value) => Set_Configuration((Previous) => ({ ...Previous, Transliteration_Color: Value }))} />
            <Color_Row label="Highlight" value={Configuration.Highlight_Color} On_Change={(Value) => Set_Configuration((Previous) => ({ ...Previous, Highlight_Color: Value }))} />
          </Dropdown_Card>

          {/* Positioning */}
          <Dropdown_Card title="Positioning" Is_Open={Open_Sections.positioning} On_Toggle={() => Toggle_Section("positioning")}>
            <Row label="Arabic">
              <Select value={Configuration.Arabic_Position} onValueChange={(Value: Position) => Set_Configuration((Previous) => ({ ...Previous, Arabic_Position: Value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((Item) => <SelectItem key={Item.id} value={Item.id}>{Item.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Row>
            <Row label="Translation">
              <Select value={Configuration.Translation_Position} onValueChange={(Value: Position) => Set_Configuration((Previous) => ({ ...Previous, Translation_Position: Value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((Item) => <SelectItem key={Item.id} value={Item.id}>{Item.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Row>
            <Row label="Transliteration">
              <Select value={Configuration.Transliteration_Position} onValueChange={(Value: Position) => Set_Configuration((Previous) => ({ ...Previous, Transliteration_Position: Value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((Item) => <SelectItem key={Item.id} value={Item.id}>{Item.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Row>
          </Dropdown_Card>

          {/* Overlays */}
          <Dropdown_Card title="Overlays" Is_Open={Open_Sections.overlays} On_Toggle={() => Toggle_Section("overlays")}>
            <Toggle_Row label="Show Lines" value={Configuration.Show_Lines} On_Change={(Value) => Set_Configuration((Previous) => ({ ...Previous, Show_Lines: Value }))} />
            {Configuration.Show_Lines && (
              <Slider_Row label="Line Count" value={Configuration.Lines_Count} min={4} max={20} On_Change={(Value) => Set_Configuration((Previous) => ({ ...Previous, Lines_Count: Value }))} />
            )}
            <Toggle_Row label="Show Watermark" value={Configuration.Show_Watermark} On_Change={(Value) => Set_Configuration((Previous) => ({ ...Previous, Show_Watermark: Value }))} />
            {Configuration.Show_Watermark && (
              <Row label="text">
                <Input value={Configuration.Watermark_Text} On_Change={(Event) => Set_Configuration((Previous) => ({ ...Previous, Watermark_Text: Event.target.value }))} />
              </Row>
            )}
          </Dropdown_Card>

          {/* Media & Assets */}
          {Mode === "render" && (
            <Dropdown_Card title="Intro, Outro & Logo" Is_Open={Open_Sections.media} On_Toggle={() => Toggle_Section("media")}>
              <Toggle_Row label="Add Intro" value={Configuration.Add_Intro} On_Change={(Value) => Set_Configuration((Previous) => ({ ...Previous, Add_Intro: Value }))} />
              {Configuration.Add_Intro && (
                <Input type="file" accept="video/*" On_Change={(Event) => {
                  const Selected_File = Event.target.files?.[0]; if (!Selected_File) return;
                  Set_Configuration((Previous) => ({ ...Previous, Intro_Url: URL.createObjectURL(Selected_File) }));
                }} className="text-xs mt-1 mb-2" />
              )}
              <Toggle_Row label="Add Outro" value={Configuration.Add_Outro} On_Change={(Value) => Set_Configuration((Previous) => ({ ...Previous, Add_Outro: Value }))} />
              {Configuration.Add_Outro && (
                <Input type="file" accept="video/*" On_Change={(Event) => {
                  const Selected_File = Event.target.files?.[0]; if (!Selected_File) return;
                  Set_Configuration((Previous) => ({ ...Previous, Outro_Url: URL.createObjectURL(Selected_File) }));
                }} className="text-xs mt-1 mb-3" />
              )}
              <hr className="border-border/20 my-2" />
              <Row label="Logo Upload">
                <Input type="file" accept="image/*" On_Change={On_File_Change("Logo_Url")} className="text-xs" />
              </Row>
              <Row label="Logo Corner">
                <Select value={Configuration.Logo_Corner} onValueChange={(Value: Corner) => Set_Configuration((Previous) => ({ ...Previous, Logo_Corner: Value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tl">Top Left</SelectItem>
                    <SelectItem value="tr">Top Right</SelectItem>
                    <SelectItem value="bl">Bottom Left</SelectItem>
                    <SelectItem value="br">Bottom Right</SelectItem>
                  </SelectContent>
                </Select>
              </Row>
            </Dropdown_Card>
          )}

          {/* Embed configurations */}
          {Mode === "embed" && (
            <Dropdown_Card title="Embed Options" Is_Open={Open_Sections.embed} On_Toggle={() => Toggle_Section("embed")}>
              <Toggle_Row label="Audio Playback" value={Configuration.Audio_Playback} On_Change={(Value) => Set_Configuration((Previous) => ({ ...Previous, Audio_Playback: Value }))} />
              <Toggle_Row label="Show Tafsir Button" value={Configuration.Show_Tafsir} On_Change={(Value) => Set_Configuration((Previous) => ({ ...Previous, Show_Tafsir: Value }))} />
              <Toggle_Row label="Show Copy Button" value={Configuration.Show_Copy} On_Change={(Value) => Set_Configuration((Previous) => ({ ...Previous, Show_Copy: Value }))} />
              <Toggle_Row label="Show Share Button" value={Configuration.Show_Share} On_Change={(Value) => Set_Configuration((Previous) => ({ ...Previous, Show_Share: Value }))} />
              <Toggle_Row label="Hover Tooltip" value={Configuration.Hover_Tooltip} On_Change={(Value) => Set_Configuration((Previous) => ({ ...Previous, Hover_Tooltip: Value }))} />
            </Dropdown_Card>
          )}

          {/* Actions Panel */}
          <div className="pt-2 w-full space-y-2 m-0 p-0">
            {Mode === "render" ? (
              <>
                <Button className="w-full gap-2 font-medium shadow-sm" onClick={Handle_Render} disabled={Is_Rendering}>
                  <Download className="h-4 w-4" />
                  {Is_Rendering ? `Rendering… ${Math.round(Render_Progress * 100)}%` : "Render & Download"}
                </Button>
                {Is_Rendering && (
                  <>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-foreground transition-all" style={{ width: `${Render_Progress * 100}%` }} />
                    </div>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => { Cancel_Reference.current = true; }}>
                      Cancel
                    </Button>
                  </>
                )}
                {Result_Url && !Is_Rendering && (
                  <div className="space-y-2 pt-2 border-t border-border/20 w-full m-0 p-0">
                    <video src={Result_Url} controls className="w-full rounded-lg bg-black max-h-32 object-contain" />
                    <div className="text-[10px] text-muted-foreground text-center">
                      {(Result_Size / 1024 / 1024).toFixed(1)} MB • .{Result_Extension}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Button className="w-full gap-2 font-medium shadow-sm" onClick={() => {
                navigator.clipboard?.writeText(Embed_Snippet);
                Toast({ title: "Embed snippet copied" });
              }}><Copy className="h-4 w-4" /> Copy Embed Snippet</Button>
            )}
          </div>

          {/* Preview Section */}
          {children && (
            <div className="block lg:hidden w-full pt-6 border-t border-border/20 m-0 pb-2">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Live Preview
              </div>
              {children}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function Dropdown_Card({ 
  title, children, Is_Open, On_Toggle 
}: { title: string; children: React.ReactNode; Is_Open: boolean; On_Toggle: () => void }) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/40 overflow-hidden transition-all Duration-200 shadow-sm w-full m-0 p-0">
      <button
        type="button"
        onClick={On_Toggle}
        className="w-full flex items-center justify-between p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-card/20 hover:bg-card/50 transition-colors"
      >
        <span>{title}</span>
        <ChevronDown className={Class_Names("h-4 w-4 transition-transform Duration-200", Is_Open ? "rotate-180" : "")} />
      </button>
      
      <div className={Class_Names("transition-all Duration-200 ease-in-out w-full m-0", Is_Open ? "p-3 h-auto opacity-100 block" : "h-0 opacity-0 hidden")}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-center gap-2 mb-2 last:mb-0 w-full m-0 p-0">
      <Label className="text-xs text-foreground/80 whitespace-nowrap">{label}</Label>
      <div className="w-full min-w-0 m-0 p-0">{children}</div>
    </div>
  );
}

function Toggle_Row({ label, value, On_Change }: { label: string; value: boolean; On_Change: (Value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between mb-2 last:mb-0 w-full m-0 p-0">
      <Label className="text-xs text-foreground/80">{label}</Label>
      <Switch checked={value} onCheckedChange={On_Change} />
    </div>
  );
}

function Color_Row({ label, value, On_Change }: { label: string; value: string; On_Change: (Value: string) => void }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-center gap-2 mb-2 last:mb-0 w-full m-0 p-0">
      <Label className="text-xs text-foreground/80">{label}</Label>
      <input type="color" value={value} On_Change={(Event) => On_Change(Event.target.value)} className="h-8 w-full rounded border border-border/40 bg-transparent cursor-pointer" />
    </div>
  );
}

function Slider_Row({
  label, value, min, max, On_Change,
}: { label: string; value: number; min: number; max: number; On_Change: (Value: number) => void }) {
  return (
    <div className="mb-2 last:mb-0 w-full m-0 p-0">
      <div className="flex items-center justify-between mb-1">
        <Label className="text-xs text-foreground/80">{label}</Label>
        <span className="text-xs text-muted-foreground">{value}px</span>
      </div>
      <Slider value={[value]} min={min} max={max} Step={1} onValueChange={(Value) => On_Change(Value[0])} />
    </div>
  );
}