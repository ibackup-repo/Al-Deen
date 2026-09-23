import { Default_Settings, Main_Prayers } from "./Constant";
import type { Prayer_Times, Main_Prayer, Prayer_Settings } from "./Types";

export function Load_Prayer_Settings(): Prayer_Settings {
  try {
    const Saved = localStorage.getItem("prayer-settings");
    if (Saved) {
      return {
        ...Default_Settings,
        ...JSON.parse(Saved),
      };
    }
  } catch {}
  return Default_Settings;
}

export function Save_Prayer_Settings(Settings: Prayer_Settings): void {
  localStorage.setItem("prayer-settings", JSON.stringify(Settings));
}

export function Get_Next_Prayer(Timings: Prayer_Times): Main_Prayer {
  const Now = new Date();
  const Current_Minutes = Now.getHours() * 60 + Now.getMinutes();

  for (const Prayer of Main_Prayers) {
    const [Hours, Minutes] = Timings[Prayer].split(":").map(Number);
    if (Hours * 60 + Minutes > Current_Minutes) {
      return Prayer;
    }
  }
  return "Fajr";
}

export function Get_Previous_Prayer(
  Timings: Prayer_Times,
  Next_Prayer: Main_Prayer
): Main_Prayer {
  const Index = Main_Prayers.indexOf(Next_Prayer);
  return Index <= 0 ? "Isha" : Main_Prayers[Index - 1];
}

export function Time_To_Minutes(Time_Str: string): number {
  const [Hours, Minutes] = Time_Str.split(":").map(Number);
  return Hours * 60 + Minutes;
}

export function Get_Time_Remaining(Target_Time_Str: string): string {
  const Now = new Date();
  let Diff =
    Time_To_Minutes(Target_Time_Str) -
    (Now.getHours() * 60 + Now.getMinutes());

  if (Diff < 0) Diff += 24 * 60;

  const Hours = Math.floor(Diff / 60);
  const Minutes = Diff % 60;

  return Hours > 0 ? `${Hours}h ${Minutes}m` : `${Minutes}m`;
}

export function Format_Time(
  Time_24: string,
  Format: "12h" | "24h"
): string {
  if (Format === "24h") return Time_24;

  const [Hours, Minutes] = Time_24.split(":").map(Number);
  const Period = Hours >= 12 ? "PM" : "AM";
  const Hours_12 = Hours === 0 ? 12 : Hours > 12 ? Hours - 12 : Hours;

  return `${Hours_12}:${String(Minutes).padStart(2, "0")} ${Period}`;
}

export function Get_Elapsed_Progress(
  Timings: Prayer_Times,
  Next_Prayer: Main_Prayer
): number {
  const Now = new Date();
  const Current_Minutes = Now.getHours() * 60 + Now.getMinutes();
  const Next_Minutes = Time_To_Minutes(Timings[Next_Prayer]);

  const Prev_Prayer = Get_Previous_Prayer(Timings, Next_Prayer);
  const Prev_Minutes = Time_To_Minutes(Timings[Prev_Prayer]);

  let Total_Duration = Next_Minutes - Prev_Minutes;
  let Elapsed_Duration = Current_Minutes - Prev_Minutes;

  if (Total_Duration <= 0) Total_Duration += 24 * 60;
  if (Elapsed_Duration < 0) Elapsed_Duration += 24 * 60;

  return Math.min(
    100,
    Math.max(0, (Elapsed_Duration / Total_Duration) * 100)
  );
}