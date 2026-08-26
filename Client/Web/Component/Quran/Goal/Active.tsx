import { Clock, MapPin, Trash2 } from "lucide-react";
import { Class_Names } from "@/Library/Utility";
import { Container } from "@Web/Component/UI/Container";
import { Button } from "@Web/Component/UI/Button";
import { Progress_Ring } from "./Progress";
import type { Goal_Progress } from "./Types";

interface Active_Properties {
  Active_Goal: any;
  Week_Progress: any[];
  Total_Minutes_Read: number;
  Today_Minutes: number;
  Today_Seconds?: number;
  Today_Percentage: number;
  Day_Progress: Goal_Progress | null;
  Overall_Progress: number;
  Ayaat_Read: number;
  Total_Ayaat: number;
  Current_Surah: any;
  Current_Ayah: number;
  Current_Juz: number;
  Current_Page: number;
  On_Delete_Goal: () => void;
  On_Create_New_Goal: () => void;
}

export function Active({
  Active_Goal,
  Total_Minutes_Read,
  Today_Minutes,
  Today_Seconds = 0,
  Today_Percentage,
  Day_Progress,
  Overall_Progress,
  Ayaat_Read,
  Total_Ayaat,
  Current_Surah,
  Current_Ayah,
  Current_Juz,
  Current_Page,
  On_Delete_Goal,
}: Active_Properties) {
  const today = new Date();
  const End_Date = Active_Goal?.End_Date ? new Date(Active_Goal.End_Date) : null;
  const Days_Remaining = End_Date
    ? Math.max(0, Math.ceil((End_Date.getTime() - today.getTime()) / 86400000))
    : null;
  const Daily_Target = Active_Goal?.Daily_Target || 0;

  const Total_Today_Seconds = Today_Minutes * 60 + Today_Seconds;
  const Target_Seconds = Daily_Target * 60;
  const Remaining_Seconds = Math.max(0, Target_Seconds - Total_Today_Seconds);

  const Format_Time_Remaining = (Seconds: number) => {
    if (Seconds <= 0) return "0m";
    const Minutes = Math.floor(Seconds / 60);
    const Seconds_Remainder = Seconds % 60;
    if (Minutes === 0) return `${Seconds_Remainder}s`;
    return `${Minutes}m ${Seconds_Remainder}s`;
  };

  const Is_Goal_Completed = Total_Today_Seconds >= Target_Seconds && Target_Seconds > 0;
  const Ring_Value =
    Active_Goal?.Goal_Type === "time_based"
      ? Today_Percentage
      : Active_Goal?.Goal_Type === "khatm"
      ? Overall_Progress
      : Day_Progress?.Today_Percent || 0;
  const Ring_Label =
    Active_Goal?.Goal_Type === "time_based"
      ? !Is_Goal_Completed
        ? Format_Time_Remaining(Remaining_Seconds)
        : "Done"
      : `${Ring_Value}%`;
  const Ring_Sublabel =
    Active_Goal?.Goal_Type === "time_based"
      ? "Left today"
      : Day_Progress
      ? `Day ${Day_Progress.Day_Number}`
      : "Overall";

  const Subtitle =
    Active_Goal?.Goal_Type === "time_based"
      ? `${Daily_Target} min / day`
      : Active_Goal?.Goal_Type === "khatm"
      ? `Khatm${Days_Remaining !== null ? ` · ${Days_Remaining}d left` : ""}`
      : "Custom";

  if (!Active_Goal) return null;

  return (
    <div className="space-y-4">
      {/* Hero ring + Current Position + Dashboard_Stats */}
      <Container className="!p-5 sm:!p-7">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          <Progress_Ring
            Value={Ring_Value}
            Size={150}
            Stroke_Width={6}
            Label={Ring_Label}
            Sublabel={Ring_Sublabel}
            Variant="segmented"
            Segments={60}
          />
          <div className="flex-1 w-full space-y-3">
            <p className="text-xs text-muted-foreground text-center sm:text-left">{Subtitle}</p>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Current Position</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Surah", value: Current_Surah?.English_Name || "Al-Fatihah" },
                { label: "Ayah", value: Current_Ayah || 1 },
                { label: "Juz", value: Current_Juz || 1 },
                { label: "Page", value: Current_Page || 1 },
              ].map((it) => (
                <Container key={it.label} className="!p-2 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{it.label}</p>
                  <p className="font-semibold text-xs truncate mt-0.5">{it.value}</p>
                </Container>
              ))}
            </div>
            <Container className="!p-2 text-center">
              <Clock className="h-4 w-4 mx-auto mb-1 text-foreground/80" />
              <p className="text-xl font-bold tabular-nums leading-none">{Total_Minutes_Read}</p>
              <p className="text-[10px] mt-1 uppercase tracking-wider text-muted-foreground">Total min</p>
            </Container>
          </div>
        </div>
      </Container>

      {/* Khatm day */}
      {Active_Goal.Goal_Type === "khatm" && Day_Progress && (
        <Container className="!p-4 sm:!p-5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-semibold">
              Day {Day_Progress.Day_Number} / {Day_Progress.Total_Days}
            </span>
            <span className="text-xs font-bold">{Day_Progress.Today_Percent}%</span>
          </div>
          <div className="flex gap-0.5 mb-3">
            {Array.from({ length: 10 }).map((_, i) => {
              const filled = i < Math.round((Day_Progress.Today_Percent / 100) * 10);
              return (
                <div
                  key={i}
                  className={Class_Names(
                    "h-2.5 flex-1 rounded-sm transition-colors duration-500",
                    filled ? "bg-foreground" : "bg-muted"
                  )}
                />
              );
            })}
          </div>
          <div className="flex gap-2 items-stretch">
            <Container className="!p-2.5 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">From</p>
              <p className="text-xs truncate font-medium">
                {Day_Progress.Start_Position?.Surah_Name || "Start"}
              </p>
            </Container>
            <div className="flex items-center text-muted-foreground">→</div>
            <Container className="!p-2.5 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">To</p>
              <p className="text-xs truncate font-medium">
                {Day_Progress.End_Position?.Surah_Name || "End"}
                {Day_Progress.End_Position?.Ayah ? ` (${Day_Progress.End_Position.Ayah})` : ""}
              </p>
            </Container>
          </div>
          <div className="mt-4 pt-4 border-t border-border/40">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">Overall Progress</span>
              <span className="text-xs font-bold tabular-nums">{Overall_Progress}%</span>
            </div>
            <div className="flex gap-0.5">
              {Array.from({ length: 20 }).map((_, i) => {
                const filled = i < Math.round((Overall_Progress / 100) * 20);
                return (
                  <div
                    key={i}
                    className={Class_Names("h-1.5 flex-1 rounded-sm", filled ? "bg-foreground" : "bg-muted")}
                  />
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">
              {Ayaat_Read.toLocaleString()} / {Total_Ayaat.toLocaleString()} Ayaat
            </p>
          </div>
        </Container>
      )}

      {/* Delete CTA */}
      <Button
        onClick={On_Delete_Goal}
        variant="secondary"
        fullWidth
        className="h-12 text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
        Delete Goal
      </Button>
    </div>
  );
}