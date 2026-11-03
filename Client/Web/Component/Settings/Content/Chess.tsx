import { Use_Chess_Settings, type Input_Mode } from "@/Library/Chess-Settings";
import { Container } from "@Web/Component/UI/container";
import { TitleBar } from "@Web/Component/UI/title-bar";
import { Switch } from "@Web/Component/UI/switch";
import { Slider } from "@Web/Component/UI/slider";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { Class_Names } from "@/Library/Utility";

export function ChessSection() {
  const [s, set] = Use_Chess_Settings();
  const { UI_Language } = Use_Course_Language();

  // Helper function to safely pull translated copy based on UI_Language key fallback to English
  const tr = (dict: Record<string, string>) => dict[UI_Language] || dict["en"];

  return (
    <div className="space-y-4">
      <TitleBar>
        {tr({ nl: "Schaken", en: "Chess", ar: "الشطرنج" })}
      </TitleBar>

      {/* Input Selection */}
      <Container className="space-y-2">
        <p className="text-sm font-medium">
          {tr({ nl: "Invoer", en: "Input", ar: "الإدخال" })}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(["click", "drag", "both"] as Input_Mode[]).map(m => (
            <button
              key={m}
              onClick={() => set({ Input_Mode: m })}
              className={Class_Names(
                "px-3 py-2 rounded-[10px] border-2 border-border text-xs font-medium transition-colors",
                s.Input_Mode === m ? "bg-foreground text-background" : "bg-background hover:bg-muted"
              )}
            >
              {m === "click" && tr({ nl: "Klik", en: "Click", ar: "نقر" })}
              {m === "drag" && tr({ nl: "Slepen", en: "Drag", ar: "سحب" })}
              {m === "both" && tr({ nl: "Beide", en: "Both", ar: "كلاهما" })}
            </button>
          ))}
        </div>
      </Container>

      {/* Premoves Option */}
      <Container className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">
            {tr({ nl: "Pre-zetten toestaan", en: "Allow Premoves", ar: "السماح بالحركات المسبقة" })}
          </p>
          <p className="text-xs opacity-60">
            {tr({ nl: "Plan een zet voor je beurt.", en: "Plan a move before your turn.", ar: "" })}
          </p>
        </div>
        <Switch checked={s.Allow_Premove} onCheckedChange={v => set({ Allow_Premove: v })} />
      </Container>

      {/* Piece Animations Toggle */}
      <Container className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">
            {tr({ nl: "Animatie", en: "Animate pieces", ar: "حركة القطع" })}
          </p>
        </div>
        <Switch checked={s.Animate_Pieces} onCheckedChange={v => set({ Animate_Pieces: v })} />
      </Container>

      {/* Animation Speed Slider */}
      <Container className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">
            {tr({ nl: "Animatiesnelheid", en: "Animation speed", ar: "سرعة الحركة" })}
          </p>
          <span className="text-xs opacity-60 font-mono">{s.Animation_Speed} ms</span>
        </div>
        <Slider
          min={50}
          max={600}
          step={10}
          value={[s.Animation_Speed]}
          onValueChange={v => set({ Animation_Speed: v[0] })}
          disabled={!s.Animate_Pieces}
        />
      </Container>

      {/* Move Hints Toggle */}
      <Container className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">
            {tr({ nl: "Hints tonen", en: "Show hints", ar: "إظهار التلميحات" })}
          </p>
        </div>
        <Switch checked={s.Show_Hints} onCheckedChange={v => set({ Show_Hints: v })} />
      </Container>

      {/* Audio Narration Toggle */}
      <Container className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">
            {tr({ nl: "Spraakuitleg", en: "Speak narration", ar: "نطق الشرح" })}
          </p>
          <p className="text-xs opacity-60">
            {tr({ nl: "Lees lesuitleg hardop voor.", en: "Read lesson narration aloud.", ar: "" })}
          </p>
        </div>
        <Switch checked={s.Speak_Narration} onCheckedChange={v => set({ Speak_Narration: v })} />
      </Container>
    </div>
  );
}