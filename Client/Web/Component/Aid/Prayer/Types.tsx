export interface Prayer_Times {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  Imsak?: string;
  Midnight?: string;
}

export interface Hijri_Date {
  Day: string;
  Weekday: { En: string; Ar: string };
  Month: { Number: number; En: string; Ar: string };
  Year: string;
  Designation: { Abbreviated: string; Expanded: string };
}

export interface Location_Data {
  Latitude: number;
  Longitude: number;
  City?: string;
  Country?: string;
}

export interface Prayer_Settings {
  Method: number;
  School: number;
  Latitude_Adjustment_Method: number;
  Time_Format: "12h" | "24h";
}

export type Main_Prayer =
  | "Fajr"
  | "Sunrise"
  | "Dhuhr"
  | "Asr"
  | "Maghrib"
  | "Isha";