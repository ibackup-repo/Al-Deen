import { Slider } from "@Web/Component/UI/Slider";
import {
  Repeat,
  ChevronLeft,
  Gauge,
  Check,
  Volume2,
  VolumeX,
  Settings2,
} from "lucide-react";
import { Class_Names } from "@/Library/Utility";
import {
  Popover,
  Popover_Content,
  Popover_Trigger,
} from "@Web/Component/UI/Popover";
import { Button } from "@Web/Component/UI/Button"; // updated Button
import type { Settings_Menu } from "./Types";
import { Get_Repeat_Label, Playback_Speeds } from "./Utility";

interface Settings_Properties {
  Open: boolean;
  On_Open_Change: (Open: boolean) => void;
  Menu: Settings_Menu;
  On_Settings_Menu_Change: (Menu: Settings_Menu) => void;
  Repeat_Mode: "none" | "Surah" | "page";
  On_Repeat_Mode_Change: (Mode: "none" | "Surah" | "page") => void;
  Playback_Speed: number;
  On_Playback_Speed_Change: (Speed: number) => void;
  Playback_Mode: "Surah" | "page";
  Volume: number;
  Is_Muted: boolean;
  On_Volume_Change: (value: number[]) => void;
  On_Toggle_Mute: () => void;
}

export const Settings = ({
  Open,
  On_Open_Change,
  Menu,
  On_Settings_Menu_Change,
  Repeat_Mode,
  On_Repeat_Mode_Change,
  Playback_Speed,
  On_Playback_Speed_Change,
  Playback_Mode,
  Volume,
  Is_Muted,
  On_Volume_Change,
  On_Toggle_Mute,
}: Settings_Properties) => {
  const Repeat_Options =
    Playback_Mode === "Surah"
      ? [
          { value: "none" as const, label: "Off" },
          { value: "Surah" as const, label: "Surah" },
        ]
      : [
          { value: "none" as const, label: "Off" },
          { value: "page" as const, label: "Page" },
        ];

  return (
    <Popover Open={Open} On_Open_Change={On_Open_Change}>
      <Popover_Trigger asChild>
        <Button
          size="sm"
          className={Class_Names(
            "w-8 h-8 p-0 rounded-full",
            Repeat_Mode !== "none" && "text-primary"
          )}
        >
          <Settings2 className="h-3.5 w-3.5" />
        </Button>
      </Popover_Trigger>

      <Popover_Content
        align="center"
        className="w-56 p-0 overflow-hidden bg-white dark:bg-black border-2 border-black dark:border-white rounded-[40px] z-[10000]"
      >
        <div className="p-1">
          {/* Main Menu */}
          {Menu === "main" && (
            <div className="py-1">
              {/* Volume slider */}
              <div className="px-3 py-2 flex items-center gap-2">
                <Button
                  size="sm"
                  className="w-6 h-6 p-0 rounded-full shrink-0"
                  onClick={On_Toggle_Mute}
                >
                  {Is_Muted || Volume === 0 ? (
                    <VolumeX className="h-3 w-3" />
                  ) : (
                    <Volume2 className="h-3 w-3" />
                  )}
                </Button>
                <Slider
                  value={[Is_Muted ? 0 : Volume]}
                  max={100}
                  Step={1}
                  onValueChange={On_Volume_Change}
                  className={Class_Names(
                    "flex-1 cursor-pointer",
                    "[&>span:first-child]:h-1",
                    "[&>span:first-child]:bg-muted",
                    "[&>span:first-child>span]:bg-primary",
                    "[&_[role=slider]]:h-3",
                    "[&_[role=slider]]:w-3",
                    "[&_[role=slider]]:border-0",
                    "[&_[role=slider]]:bg-primary"
                  )}
                />
              </div>

              {/* Repeat button */}
              <button
                className="w-full flex items-center justify-between px-3 py-2 rounded-[40px] hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-sm"
                onClick={() => On_Settings_Menu_Change("repeat")}
              >
                <div className="flex items-center gap-2">
                  <Repeat className="h-3.5 w-3.5" />
                  <span className="text-sm">Repeat</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {Get_Repeat_Label(Repeat_Mode)}
                </span>
              </button>

              {/* Speed button */}
              <button
                className="w-full flex items-center justify-between px-3 py-2 rounded-[40px] hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-sm"
                onClick={() => On_Settings_Menu_Change("Speed")}
              >
                <div className="flex items-center gap-2">
                  <Gauge className="h-3.5 w-3.5" />
                  <span className="text-sm">Speed</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {Playback_Speed}x
                </span>
              </button>
            </div>
          )}

          {/* Repeat submenu */}
          {Menu === "repeat" && (
            <div>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 rounded-[40px] hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                onClick={() => On_Settings_Menu_Change("main")}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">Repeat</span>
              </button>
              <div className="py-1">
                {Repeat_Options.map(({ value, label }) => (
                  <button
                    key={value}
                    className={Class_Names(
                      "w-full flex items-center justify-between px-3 py-2 rounded-[40px] hover:bg-black/10 dark:hover:bg-white/10 transition-colors",
                      Repeat_Mode === value && "bg-black/10 dark:bg-white/10"
                    )}
                    onClick={() => {
                      On_Repeat_Mode_Change(value);
                      On_Settings_Menu_Change("main");
                    }}
                  >
                    <span className="text-sm">{label}</span>
                    {Repeat_Mode === value && (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Speed submenu */}
          {Menu === "Speed" && (
            <div>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 rounded-[40px] hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                onClick={() => On_Settings_Menu_Change("main")}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">Speed</span>
              </button>
              <div className="py-1">
                {Playback_Speeds.map((Speed) => (
                  <button
                    key={Speed}
                    className={Class_Names(
                      "w-full flex items-center justify-between px-3 py-2 rounded-[40px] hover:bg-black/10 dark:hover:bg-white/10 transition-colors",
                      Playback_Speed === Speed && "bg-black/10 dark:bg-white/10"
                    )}
                    onClick={() => {
                      On_Playback_Speed_Change(Speed);
                      On_Settings_Menu_Change("main");
                    }}
                  >
                    <span className="text-sm">{Speed}x</span>
                    {Playback_Speed === Speed && (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Popover_Content>
    </Popover>
  );
};