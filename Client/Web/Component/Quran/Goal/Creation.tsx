import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Repeat,
  Calendar,
  Clock,
  Book,
  Settings,
  Star,
} from "lucide-react";
import { Class_Names } from "@/Library/Utility";
import { Container } from "@Web/Component/UI/Container";
import { Button } from "@Web/Component/UI/Button";
import { Input } from "@Web/Component/UI/Input";
import { Label } from "@Web/Component/UI/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@Web/Component/UI/Select";
import { GOAL_PRESETS, type Goal_Preset } from "@/Hook/Use-Quran-Goals";
import { useQuery } from "@tanstack/react-query";

const Icon_Map: Record<string, any> = {
  clock: Clock,
  book: Book,
  calendar: Calendar,
  Settings: Settings,
};

const Days_Of_Week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const Total_Ayaat = 6236;
const Backend_Base_URL = "https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev";

async function Fetch_Quran_Corpus_From_Backend() {
  const response = await fetch(`${Backend_Base_URL}/api/Quran-Corpus`);
  if (!response.ok) throw new Error("Failed to load unified Quran Corpus data map");
  return response.json();
}

interface Creation_Properties {
  On_Create_Goal: (goal: any) => Promise<void>;
  On_Close: () => void;
}

type Wizard_Step = 1 | 2 | 3;

export function Creation({ On_Create_Goal, On_Close }: Creation_Properties) {
  const [Step, Set_Step] = useState<Wizard_Step>(1);
  const [Selected_Preset, Set_Selected_Preset] = useState<Goal_Preset | null>(null);
  const [Frequency, Set_Frequency] = useState<"daily" | "Duration">("daily");
  const [Is_Creating, Set_Is_Creating] = useState(false);

  const [Custom_Goal_Type, Set_Custom_Goal_Type] = useState<"time_based" | "khatm" | "Ayaat">("time_based");
  const [Custom_Daily_Target, Set_Custom_Daily_Target] = useState(15);
  const [Custom_Duration, Set_Custom_Duration] = useState(30);
  const [Custom_Ayaat_Per_Day, Set_Custom_Ayaat_Per_Day] = useState(20);

  const Total_Steps = 3;
  const Is_Custom = Selected_Preset?.id === "custom";

  // Ingest structural database maps over unified reactive client context query cache
  const { data: Corpus, Is_Loading_Corpus_Data: Is_Corpus_Loading } = useQuery({
    queryKey: ["Quran_Corpus_Backend"],
    queryFn: Fetch_Quran_Corpus_From_Backend,
    staleTime: 1000 * 60 * 30,
  });

  const Surah_List = useMemo(() => Corpus?.Suwar || [], [Corpus]);

  const Handle_Create = async () => {
    if (!Selected_Preset) return;
    Set_Is_Creating(true);
    try {
      if (Is_Custom) {
        await On_Create_Goal({
          id: "custom",
          Goal_Type: Custom_Goal_Type,
          Frequency,
          Daily_Target:
            Custom_Goal_Type === "time_based"
              ? Custom_Daily_Target
              : Custom_Goal_Type === "Ayaat"
              ? Custom_Ayaat_Per_Day
              : undefined,
          Duration:
            Custom_Goal_Type === "khatm" || Custom_Goal_Type === "Ayaat"
              ? Custom_Duration
              : undefined,
        });
      } else {
        await On_Create_Goal({
          id: Selected_Preset.id,
          Goal_Type: Selected_Preset.Goal_Type,
          Frequency,
          Daily_Target: Selected_Preset.Daily_Target,
          Duration: Selected_Preset.Duration,
        });
      }
      Set_Step(1);
      Set_Selected_Preset(null);
      On_Close();
    } catch (error) {
      console.error("error creating goal:", error);
    } finally {
      Set_Is_Creating(false);
    }
  };

  const Generate_Schedule = () => {
    if (!Selected_Preset || Surah_List.length === 0) return [];
    const schedule: Array<{ day: string; task: string }> = [];
    const today = new Date();
    let days: number;
    let Ayaat_Per_Day = 0;
    let Daily_Minutes: number | undefined;

    if (Is_Custom) {
      days = Custom_Goal_Type === "time_based" ? 7 : Custom_Duration;
      Ayaat_Per_Day =
        Custom_Goal_Type === "khatm"
          ? Math.ceil(Total_Ayaat / Custom_Duration)
          : Custom_Goal_Type === "Ayaat"
          ? Custom_Ayaat_Per_Day
          : 0;
      Daily_Minutes = Custom_Goal_Type === "time_based" ? Custom_Daily_Target : undefined;
    } else {
      days = Selected_Preset.Duration || 7;
      Ayaat_Per_Day = Selected_Preset.Goal_Type === "khatm" ? Math.ceil(Total_Ayaat / days) : 0;
      Daily_Minutes = Selected_Preset.Daily_Target;
    }

    let Current_Ayah = 1;
    const Find_Surah = (v: number) => {
      let remaining = v;
      for (const s of Surah_List) {
        if (remaining <= s.Number_Of_Ayaat) return s;
        remaining -= s.Number_Of_Ayaat;
      }
      return Surah_List[Surah_List.length - 1];
    };

    for (let i = 0; i < Math.min(days, 6); i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const Day_Name = Days_Of_Week[d.getDay()];
      if (Daily_Minutes) {
        schedule.push({ day: Day_Name, task: `${Daily_Minutes} min` });
      } else if (Ayaat_Per_Day > 0) {
        const Start_Surah = Find_Surah(Current_Ayah);
        const End_Ayah = Math.min(Current_Ayah + Ayaat_Per_Day, Total_Ayaat);
        const End_Surah = Find_Surah(End_Ayah);
        schedule.push({
          day: Day_Name,
          task: `${Start_Surah?.English_Name || "Surah"} → ${End_Surah?.English_Name || "Surah"}`,
        });
        Current_Ayah = End_Ayah;
      }
    }
    if (days > 6) schedule.push({ day: `+${days - 6}d`, task: "more" });
    return schedule;
  };

  const Can_Advance =
    (Step === 1 && !!Selected_Preset) ||
    Step === 2 ||
    Step === 3;

  const Step_Title =
    Step === 1 ? "Choose a Goal" : Step === 2 ? (Is_Custom ? "Configure" : "Frequency") : "Schedule";

  if (Is_Corpus_Loading) return null;

  return (
    <div className="Container max-w-md mx-auto select-none">
      <div className="flex flex-col items-center min-h-[580px]">
        <div className="w-full flex-grow flex flex-col pt-2">
          {/* Step title */}
          <div className="flex justify-center mt-2 mb-4">
            <span className="text-sm font-medium">{Step_Title}</span>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8 mt-2">
            {[1, 2, 3].map((s, Index) => {
              const Is_Current = Step === s;
              return (
                <React.Fragment key={s}>
                  <div
                    className={Class_Names(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all Duration-300 border-2",
                      Is_Current
                        ? "bg-foreground text-background border-foreground"
                        : Step > s
                        ? "bg-muted-foreground border-muted-foreground text-background"
                        : "bg-transparent border-border text-muted-foreground"
                    )}
                  >
                    {Step > s ? <Check className="h-4 w-4" /> : s}
                  </div>
                  {Index < 2 && (
                    <div
                      className={Class_Names(
                        "h-[2px] transition-all Duration-500 ease-in-out",
                        Is_Current ? "bg-foreground w-12 mx-2" : "bg-muted w-4 mx-1"
                      )}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Step Content */}
          <div className="flex-grow space-y-4" key={`Step-${Step}`}>
            {Step === 1 && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 Duration-300">
                {GOAL_PRESETS.map((preset) => {
                  const Icon = Icon_Map[preset.icon] || Clock;
                  const Is_Selected = Selected_Preset?.id === preset.id;
                  return (
                    <Container
                      key={preset.id}
                      className={Class_Names(
                        "!p-4 cursor-pointer transition-all",
                        Is_Selected
                          ? "ring-2 ring-foreground"
                          : "hover:bg-accent"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => Set_Selected_Preset(preset)}
                        className="w-full flex items-center gap-4 text-left"
                      >
                        <div
                          className={Class_Names(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                            Is_Selected
                              ? "bg-foreground text-background"
                              : "bg-muted text-foreground"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{preset.title}</p>
                            {preset.recommended && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] uppercase tracking-wider rounded-full bg-foreground/10 text-foreground">
                                <Star className="h-2.5 w-2.5" /> Rec
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {preset.description}
                          </p>
                        </div>
                      </button>
                    </Container>
                  );
                })}
              </div>
            )}

            {Step === 2 && !Is_Custom && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 Duration-300">
                {[
                  { id: "daily" as const, icon: Repeat, title: "Daily", desc: "Resets every day" },
                  { id: "Duration" as const, icon: Calendar, title: "Duration", desc: "Track over set days" },
                ].map((opt) => {
                  const Active = Frequency === opt.id;
                  const Icon = opt.icon;
                  return (
                    <Container
                      key={opt.id}
                      className={Class_Names(
                        "!p-4 cursor-pointer transition-all",
                        Active ? "ring-2 ring-foreground" : "hover:bg-accent"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => Set_Frequency(opt.id)}
                        className="w-full flex items-center gap-4 text-left"
                      >
                        <div
                          className={Class_Names(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                            Active ? "bg-foreground text-background" : "bg-muted text-foreground"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{opt.title}</p>
                          <p className="text-xs text-muted-foreground">{opt.desc}</p>
                        </div>
                      </button>
                    </Container>
                  );
                })}
              </div>
            )}

            {Step === 2 && Is_Custom && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 Duration-300">
                <div className="space-y-2">
                  <Label className="text-xs ml-1">Goal type</Label>
                  <Select value={Custom_Goal_Type} onValueChange={(v) => Set_Custom_Goal_Type(v as any)}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="time_based">Time-based (min/day)</SelectItem>
                      <SelectItem value="khatm">Complete Quran (Khatm)</SelectItem>
                      <SelectItem value="Ayaat">Verses per day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {Custom_Goal_Type === "time_based" && (
                  <div className="space-y-2">
                    <Label className="text-xs ml-1">Daily Minutes</Label>
                    <Input
                      type="number"
                      value={Custom_Daily_Target}
                      On_Change={(e) => Set_Custom_Daily_Target(Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-11"
                      min={1}
                      max={120}
                    />
                  </div>
                )}

                {Custom_Goal_Type === "khatm" && (
                  <div className="space-y-2">
                    <Label className="text-xs ml-1">Duration (days)</Label>
                    <Input
                      type="number"
                      value={Custom_Duration}
                      On_Change={(e) => Set_Custom_Duration(Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-11"
                      min={1}
                      max={730}
                    />
                    <p className="text-xs text-muted-foreground ml-1">
                      ≈ {Math.ceil(Total_Ayaat / Custom_Duration)} Ayaat/day
                    </p>
                  </div>
                )}

                {Custom_Goal_Type === "Ayaat" && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs ml-1">Verses per day</Label>
                      <Input
                        type="number"
                        value={Custom_Ayaat_Per_Day}
                        On_Change={(e) => Set_Custom_Ayaat_Per_Day(Math.max(1, parseInt(e.target.value) || 1))}
                        className="h-11"
                        min={1}
                        max={300}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs ml-1">Duration (days)</Label>
                      <Input
                        type="number"
                        value={Custom_Duration}
                        On_Change={(e) => Set_Custom_Duration(Math.max(1, parseInt(e.target.value) || 1))}
                        className="h-11"
                        min={1}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {Step === 3 && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 Duration-300">
                <div className="space-y-2">
                  {Generate_Schedule().map((item, index) => (
                    <Container key={index} className="!py-3 !px-4 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wide">{item.day}</span>
                      <span className="text-xs text-muted-foreground truncate ml-3">{item.task}</span>
                    </Container>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Navigation */}
          <div className="py-8 flex gap-4 mt-auto">
            <Button
              onClick={() => (Step > 1 ? Set_Step((s) => (s - 1) as Wizard_Step) : On_Close())}
              variant="secondary"
              size="icon"
              className="h-12 w-12 rounded-full shrink-0"
            >
              <ChevronLeft size={20} />
            </Button>

            {Step < Total_Steps ? (
              <Button
                onClick={() => Set_Step((s) => (s + 1) as Wizard_Step)}
                className="flex-grow font-bold uppercase tracking-widest text-[10px] h-12"
                disabled={!Can_Advance}
              >
                Continue <ChevronRight size={14} className="ml-2" />
              </Button>
            ) : (
              <Button
                onClick={Handle_Create}
                disabled={Is_Creating}
                className="flex-grow font-bold uppercase tracking-widest text-[10px] h-12"
              >
                {Is_Creating ? "Creating" : "Start Goal"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}