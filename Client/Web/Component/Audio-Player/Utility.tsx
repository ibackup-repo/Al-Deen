export const Format_Time = (Seconds: number): string => {
  if (!Seconds || isNaN(Seconds)) return "00:00";
  const Minutes = Math.floor(Seconds / 60);
  const Seconds_Remainder = Math.floor(Seconds % 60);
  return `${Minutes.toString().padStart(2, "0")}:${Seconds_Remainder.toString().padStart(2, "0")}`;
};

export const Get_Repeat_Label = (Mode: "none" | "Surah" | "Page"): string => {
  switch (Mode) {
    case "Surah":
      return "Surah";
    case "Page":
      return "Page";
    default:
      return "Off";
  }
};

export const Playback_Speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];