import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Coordinates, CalculationMethod, PrayerTimes as Adhan_Prayer_Times, Madhab, HighLatitudeRule, SunnahTimes } from "adhan";
import uq from "@umalqura/core";
import { Use_App } from "@Web/Context/App";
import type { Prayer_Times_Data, Hijri_Date, Location_Data, Prayer_Settings } from "@Web/Component/Aid/Prayer/Types";

function Method_From_ID(id: number) {
  switch (id) {
    case 1: return CalculationMethod.Karachi();
    case 2: return CalculationMethod.NorthAmerica();
    case 3: return CalculationMethod.MuslimWorldLeague();
    case 4: return CalculationMethod.UmmAlQura();
    case 5: return CalculationMethod.Egyptian();
    case 7: case 0: return CalculationMethod.Tehran();
    case 8: case 16: return CalculationMethod.Dubai();
    case 9: return CalculationMethod.Kuwait();
    case 10: return CalculationMethod.Qatar();
    case 11: return CalculationMethod.Singapore();
    case 13: return CalculationMethod.Turkey();
    case 15: return CalculationMethod.MoonsightingCommittee();
    case 12: { // Union Organization Islamic de France ~ 12° / 12°
      const p = CalculationMethod.Other();
      p.fajrAngle = 12; p.ishaAngle = 12; return p;
    }
    case 14: { // Russia (Spiritual Board) ~ 16° / 15°
      const p = CalculationMethod.Other();
      p.fajrAngle = 16; p.ishaAngle = 15; return p;
    }
    case 17: { // JAKIM Malaysia ~ 20° / 18°
      const p = CalculationMethod.Other();
      p.fajrAngle = 20; p.ishaAngle = 18; return p;
    }
    case 18: { // Tunisia ~ 18° / 18°
      const p = CalculationMethod.Other();
      p.fajrAngle = 18; p.ishaAngle = 18; return p;
    }
    case 19: { // Algeria ~ 18° / 17°
      const p = CalculationMethod.Other();
      p.fajrAngle = 18; p.ishaAngle = 17; return p;
    }
    case 20: { // KEMENAG Indonesia ~ 20° / 18°
      const p = CalculationMethod.Other();
      p.fajrAngle = 20; p.ishaAngle = 18; return p;
    }
    case 21: { // Morocco ~ 19° / 17°
      const p = CalculationMethod.Other();
      p.fajrAngle = 19; p.ishaAngle = 17; return p;
    }
    case 22: { // Lisboa ~ 18° / 17°
      const p = CalculationMethod.Other();
      p.fajrAngle = 18; p.ishaAngle = 17; return p;
    }
    case 23: { // Jordan Awqaf ~ 18° / 18°
      const p = CalculationMethod.Other();
      p.fajrAngle = 18; p.ishaAngle = 18; return p;
    }
    default: return CalculationMethod.MuslimWorldLeague();
  }
}

function Format_Time(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const Hijri_Months_EN = ["Muharram","Safar","Rabi' al-Awwal","Rabi' al-Thani","Jumada al-Awwal","Jumada al-Thani","Rajab","Sha'ban","Ramadan","Shawwal","Dhu al-Qi'dah","Dhu al-Hijjah"];
const Hijri_Months_AR = ["محرم","صفر","ربيع الأول","ربيع الثاني","جمادى الأولى","جمادى الثانية","رجب","شعبان","رمضان","شوال","ذو القعدة","ذو الحجة"];
const Weekdays_EN = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const Weekdays_AR = ["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];

export function Compute_Hijri(date: Date): Hijri_Date {
  const h = uq(date);
  return {
    day: String(h.hd),
    month: { number: h.hm, en: Hijri_Months_EN[h.hm - 1], ar: Hijri_Months_AR[h.hm - 1] },
    year: String(h.hy),
    weekday: { en: Weekdays_EN[date.getDay()], ar: Weekdays_AR[date.getDay()] },
    designation: { abbreviated: "AH", expanded: "Anno Hegirae" },
  };
}

export function Use_Prayer_Times() {
  const {
    Prayer_Calculation_Method,
    Prayer_School,
    Prayer_Latitude_Method,
    Prayer_Time_Format,
    Prayer_Auto_Location,
    Prayer_Saved_Location,
    Set_Prayer_Saved_Location,
  } = Use_App();

  const [Location_Data, Set_Location] = useState<Location_Data | null>(null);
  const [Timings, Set_Timings] = useState<Prayer_Times_Data | null>(null);
  const [Hijri, Set_Hijri] = useState<Hijri_Date | null>(null);
  const [Loading, Set_Loading] = useState(true);
  const [error, Set_Error] = useState<string | null>(null);
  const [Date_Str, Set_Date_String] = useState("");

  // Ref to prevent multiple simultaneous fetches
  const Is_Fetching_Reference = useRef(false);
  const Initial_Fetch_Done_Reference = useRef(false);

  // Memoize Settings
  const Settings = useMemo<Prayer_Settings>(() => ({
    method: Prayer_Calculation_Method,
    school: Prayer_School,
    Latitude_Adjustment_Method: Prayer_Latitude_Method,
    Time_Format: Prayer_Time_Format,
  }), [Prayer_Calculation_Method, Prayer_School, Prayer_Latitude_Method, Prayer_Time_Format]);

  const Fetch_Prayer_Times = useCallback(async (lat: number, lng: number) => {
    if (Is_Fetching_Reference.current) return;
    Is_Fetching_Reference.current = true;
    Set_Loading(true);
    Set_Error(null);

    try {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const yyyy = today.getFullYear();
      Set_Date_String(`${dd}-${mm}-${yyyy}`);

      const Coords = new Coordinates(lat, lng);
      const params = Method_From_ID(Settings.method);
      params.madhab = Settings.school === 1 ? Madhab.Hanafi : Madhab.Shafi;
      const hl = [HighLatitudeRule.MiddleOfTheNight, HighLatitudeRule.SeventhOfTheNight, HighLatitudeRule.TwilightAngle];
      params.highLatitudeRule = hl[Math.max(0, Math.min(2, Settings.Latitude_Adjustment_Method - 1))] ?? HighLatitudeRule.MiddleOfTheNight;

      const pt = new Adhan_Prayer_Times(Coords, today, params);
      const Sunnah = new SunnahTimes(pt);
      // Imsak ≈ Fajr - 10 Minutes
      const Imsak = new Date(pt.fajr.getTime() - 10 * 60 * 1000);

      Set_Timings({
        Fajr: Format_Time(pt.fajr),
        Sunrise: Format_Time(pt.sunrise),
        Dhuhr: Format_Time(pt.dhuhr),
        Asr: Format_Time(pt.asr),
        Maghrib: Format_Time(pt.maghrib),
        Isha: Format_Time(pt.isha),
        Imsak: Format_Time(Imsak),
        Midnight: Format_Time(Sunnah.middleOfTheNight),
      });

      Set_Hijri(Compute_Hijri(today));
    } catch (err) {
      console.error(err);
      Set_Error("Failed to compute prayer times.");
    } finally {
      Set_Loading(false);
      Is_Fetching_Reference.current = false;
    }
  }, [Settings]);

  // Separate function to get Location_Data and then fetch
  const Request_Location = useCallback(() => {
    if (Is_Fetching_Reference.current) return;

    // Use saved Location_Data if auto-Location_Data is disabled and saved Location_Data exists
    if (!Prayer_Auto_Location && Prayer_Saved_Location) {
      const loc = { 
        latitude: Prayer_Saved_Location.lat, 
        longitude: Prayer_Saved_Location.lng,
        city: Prayer_Saved_Location.city,
        country: Prayer_Saved_Location.country
      };
      Set_Location(loc);
      Fetch_Prayer_Times(loc.latitude, loc.longitude);
      return;
    }

    if (!navigator.geolocation) {
      Set_Error("Geolocation is not supported by your browser.");
      Set_Loading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
        const city = tz.split("/").pop()?.replace(/_/g, " ") || "";
        const loc = {
          latitude: position.Coords.latitude,
          longitude: position.Coords.longitude,
          city,
        };
        Set_Location(loc);
        Fetch_Prayer_Times(loc.latitude, loc.longitude);
        if (Prayer_Auto_Location && !Prayer_Saved_Location) {
          Set_Prayer_Saved_Location({ city, country: "", lat: loc.latitude, lng: loc.longitude });
        }
      },
      () => {
        Set_Error("Unable to determine your Location_Data. Please select a Location_Data in Settings.");
        Set_Loading(false);
      },
      { Timeout: 5000 }
    );
  }, [Fetch_Prayer_Times, Prayer_Auto_Location, Prayer_Saved_Location, Set_Prayer_Saved_Location]);

  const Set_Manual_Location = useCallback((lat: number, lng: number, city: string, country: string) => {
    const loc = { latitude: lat, longitude: lng, city, country };
    Set_Location(loc);
    Set_Error(null);
    Fetch_Prayer_Times(lat, lng);
    
    if (!Prayer_Auto_Location) {
      Set_Prayer_Saved_Location({ city, country, lat, lng });
    }
  }, [Fetch_Prayer_Times, Prayer_Auto_Location, Set_Prayer_Saved_Location]);

  // One-time initial fetch
  useEffect(() => {
    if (!Initial_Fetch_Done_Reference.current) {
      Initial_Fetch_Done_Reference.current = true;
      Request_Location();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array ensures it runs once

  // Re-fetch when calculation Settings change, but only if we have a Location_Data
  const Previous_Settings_Reference = useRef(Settings);
  useEffect(() => {
    if (Location_Data && (
      Previous_Settings_Reference.current.method !== Settings.method ||
      Previous_Settings_Reference.current.school !== Settings.school ||
      Previous_Settings_Reference.current.Latitude_Adjustment_Method !== Settings.Latitude_Adjustment_Method
    )) {
      Previous_Settings_Reference.current = Settings;
      Fetch_Prayer_Times(Location_Data.latitude, Location_Data.longitude);
    }
  }, [Settings.method, Settings.school, Settings.Latitude_Adjustment_Method, Location_Data, Fetch_Prayer_Times]);

  const Method_Label = useMemo(() => {
    const methods: Record<number, string> = {
      0: "Shia Ithna-Ashari",
      1: "University of Islamic Sciences, Karachi",
      2: "Islamic Society of North America (ISNA)",
      3: "Muslim World League (MWL)",
      4: "Umm Al-Qura University, Makkah",
      5: "Egyptian General Authority of Survey",
      7: "Institute of Geophysics, Tehran",
      8: "Gulf Region",
      9: "Kuwait",
      10: "Qatar",
      11: "Majlis Ugama Islam Singapura",
      12: "Union Organization Islamic de France",
      13: "Diyanet İşleri Başkanlığı, Turkey",
      14: "Spiritual Board of Russia",
      15: "Moonsighting Committee Worldwide",
      16: "Dubai",
      17: "JAKIM, Malaysia",
      18: "Tunisia",
      19: "Algeria",
      20: "KEMENAG, Indonesia",
      21: "Morocco",
      22: "Comunidade Islâmica de Lisboa",
      23: "Ministry of Awqaf, Jordan",
    };
    return methods[Settings.method] || "Unknown";
  }, [Settings.method]);

  return {
    Location_Data,
    Timings,
    Hijri,
    Loading,
    error,
    Date_Str,
    Settings,
    Request_Location,
    Set_Manual_Location,
    Method_Label,
    Is_Using_Saved_Location: !Prayer_Auto_Location && !!Prayer_Saved_Location,
  };
}