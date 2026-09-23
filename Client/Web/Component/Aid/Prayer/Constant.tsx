import { Sun, Sunrise, Sunset, Moon } from "lucide-react";
import type { Main_Prayer } from "./Types";

export const Default_Settings = {
  Method: 2,
  School: 0,
  Latitude_Adjustment_Method: 3,
  Time_Format: "12h" as const,
};

export const Calculation_Methods = [
  { Value: 0, Label: "Shia Ithna-Ashari" },
  { Value: 1, Label: "University of Islamic Sciences, Karachi" },
  { Value: 2, Label: "Islamic Society of North America (ISNA)" },
  { Value: 3, Label: "Muslim World League (MWL)" },
  { Value: 4, Label: "Umm Al-Qura University, Makkah" },
  { Value: 5, Label: "Egyptian General Authority of Survey" },
  { Value: 7, Label: "Institute of Geophysics, University of Tehran" },
  { Value: 8, Label: "Gulf Region" },
  { Value: 9, Label: "Kuwait" },
  { Value: 10, Label: "Qatar" },
  { Value: 11, Label: "Majlis Ugama Islam Singapura" },
  { Value: 12, Label: "Union Organization Islamic de France" },
  { Value: 13, Label: "Diyanet İşleri Başkanlığı, Turkey" },
  { Value: 14, Label: "Spiritual Administration of Muslims of Russia" },
  { Value: 15, Label: "Moonsighting Committee Worldwide" },
  { Value: 16, Label: "Dubai" },
  { Value: 17, Label: "JAKIM, Malaysia" },
  { Value: 18, Label: "Tunisia" },
  { Value: 19, Label: "Algeria" },
  { Value: 20, Label: "KEMENAG, Indonesia" },
  { Value: 21, Label: "Morocco" },
  { Value: 22, Label: "Comunidade Islamica de Lisboa" },
  { Value: 23, Label: "Ministry of Awqaf and Islamic Affairs, Jordan" },
  { Value: 99, Label: "Custom" },
];

export const Schools = [
  { Value: 0, Label: "Shafi'i / Standard" },
  { Value: 1, Label: "Hanafi" },
];

export const Latitude_Methods = [
  { Value: 1, Label: "Middle of the Night" },
  { Value: 2, Label: "One Seventh" },
  { Value: 3, Label: "Angle Based" },
];

export const Main_Prayers: Main_Prayer[] = [
  "Fajr",
  "Sunrise",
  "Dhuhr",
  "Asr",
  "Maghrib",
  "Isha",
];

export const Prayer_Icons: Record<Main_Prayer, typeof Sun> = {
  Fajr: Sunrise,
  Sunrise: Sun,
  Dhuhr: Sun,
  Asr: Sun,
  Maghrib: Sunset,
  Isha: Moon,
};

export const Prayer_Gradients: Record<Main_Prayer, string> = {
  Fajr: "from-blue-500/10 to-indigo-500/10",
  Sunrise: "from-amber-400/10 to-orange-400/10",
  Dhuhr: "from-yellow-400/10 to-amber-400/10",
  Asr: "from-orange-400/10 to-amber-500/10",
  Maghrib: "from-rose-500/10 to-orange-500/10",
  Isha: "from-indigo-600/10 to-purple-600/10",
};