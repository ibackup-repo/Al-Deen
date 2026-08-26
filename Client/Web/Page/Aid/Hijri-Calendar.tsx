import { useState, useMemo } from "react";
import { Layout } from "@Web/Component/Layout/Index";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@Web/Component/UI/Button";
import { Container } from "@Web/Component/UI/Container";
import { Date_Dialog } from "@Web/Component/Dialog/Date";
import uq from "@umalqura/core";
import { Compute_Hijri } from "@/Hook/Use_Prayer_Times";

// --- Types ---
type Calendar_Day_Record = {
  Hijri_Details: {
    Day_Text: string;
    Month_Details: { Month_Number: number; English_Name: string; Arabic_Name: string };
    Year_Text: string;
    Weekday_Details: { English_Name: string; Arabic_Name: string };
    Designation_Details: { Abbreviation_Text: string };
  };
  Gregorian_Details: {
    Formatted_Date: string; // "DD-MM-YYYY"
    Day_Text: string;
    Month_Details: { Month_Number: number; English_Name: string };
    Year_Text: string;
    Weekday_Details: { English_Name: string };
  };
};

type Holiday_Record = {
  Name_Text: string;
  Gregorian_Date_ISO: string; // "YYYY-MM-DD" for logic
  Hijri_Day_Number: number;
  Hijri_Month_Number: number;
  Type_Category: string;
};

type Islamic_Holiday_Definition = {
  Hijri_Month_Number: number;
  Hijri_Day_Number: number;
  Name_Text: string;
};

const HIJRI_MONTHS_ENGLISH = [
  "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani",
  "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
  "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
];

const HIJRI_MONTHS_ARABIC = [
  "محرم", "صفر", "ربيع الأول", "ربيع الثاني",
  "جمادى الأولى", "جمادى الثانية", "رجب", "شعبان",
  "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
];

const GREGORIAN_MONTHS_ENGLISH = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS_FULL_ENGLISH = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

// Fixed-date Islamic holidays (Hijri month, day)
const ISLAMIC_HOLIDAYS_COLLECTION: Islamic_Holiday_Definition[] = [
  { Hijri_Month_Number: 1, Hijri_Day_Number: 1, Name_Text: "Islamic New Year" },
  { Hijri_Month_Number: 1, Hijri_Day_Number: 10, Name_Text: "Day of Ashura" },
  { Hijri_Month_Number: 3, Hijri_Day_Number: 12, Name_Text: "Mawlid al-Nabi" },
  { Hijri_Month_Number: 7, Hijri_Day_Number: 27, Name_Text: "Isra and Mi'raj" },
  { Hijri_Month_Number: 8, Hijri_Day_Number: 15, Name_Text: "Shab-e-Barat" },
  { Hijri_Month_Number: 9, Hijri_Day_Number: 1, Name_Text: "First day of Ramadan" },
  { Hijri_Month_Number: 9, Hijri_Day_Number: 27, Name_Text: "Laylat al-Qadr" },
  { Hijri_Month_Number: 10, Hijri_Day_Number: 1, Name_Text: "Eid al-Fitr" },
  { Hijri_Month_Number: 12, Hijri_Day_Number: 8, Name_Text: "Day of Tarwiyah" },
  { Hijri_Month_Number: 12, Hijri_Day_Number: 9, Name_Text: "Day of Arafah" },
  { Hijri_Month_Number: 12, Hijri_Day_Number: 10, Name_Text: "Eid al-Adha" },
];

function Format_Padded_Number(Target_Number: number): string {
  return String(Target_Number).padStart(2, "0");
}

function Build_Month_Grid(Hijri_Year_Number: number, Hijri_Month_Number: number): Calendar_Day_Record[] {
  const First_Day_Instance = uq(Hijri_Year_Number, Hijri_Month_Number, 1);
  const Total_Days_In_Month = First_Day_Instance.daysInMonth;
  const Days_Collection: Calendar_Day_Record[] = [];

  for (let Day_Index = 1; Day_Index <= Total_Days_In_Month; Day_Index++) {
    const Hijri_Instance = uq(Hijri_Year_Number, Hijri_Month_Number, Day_Index);
    const Gregorian_Date_Object = Hijri_Instance.date as Date;

    Days_Collection.push({
      Hijri_Details: {
        Day_Text: String(Day_Index),
        Month_Details: {
          Month_Number: Hijri_Month_Number,
          English_Name: HIJRI_MONTHS_ENGLISH[Hijri_Month_Number - 1],
          Arabic_Name: HIJRI_MONTHS_ARABIC[Hijri_Month_Number - 1],
        },
        Year_Text: String(Hijri_Year_Number),
        Weekday_Details: {
          English_Name: WEEKDAYS_FULL_ENGLISH[Gregorian_Date_Object.getDay()],
          Arabic_Name: "",
        },
        Designation_Details: { Abbreviation_Text: "AH" },
      },
      Gregorian_Details: {
        Formatted_Date: `${Format_Padded_Number(Gregorian_Date_Object.getDate())}-${Format_Padded_Number(Gregorian_Date_Object.getMonth() + 1)}-${Gregorian_Date_Object.getFullYear()}`,
        Day_Text: String(Gregorian_Date_Object.getDate()),
        Month_Details: {
          Month_Number: Gregorian_Date_Object.getMonth() + 1,
          English_Name: GREGORIAN_MONTHS_ENGLISH[Gregorian_Date_Object.getMonth()],
        },
        Year_Text: String(Gregorian_Date_Object.getFullYear()),
        Weekday_Details: { English_Name: WEEKDAYS_FULL_ENGLISH[Gregorian_Date_Object.getDay()] },
      },
    });
  }

  return Days_Collection;
}

export default function Hijri_Calendar() {
  const Current_Date_Object = new Date();
  const Today_Formatted_Date = `${Format_Padded_Number(Current_Date_Object.getDate())}-${Format_Padded_Number(Current_Date_Object.getMonth() + 1)}-${Current_Date_Object.getFullYear()}`;
  const Today_ISO_String = Current_Date_Object.toISOString().slice(0, 10);
  const Short_Weekdays_List = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const Initial_Hijri_Details = useMemo(() => Compute_Hijri(Current_Date_Object), []);
  const [Active_Hijri_Month, Set_Active_Hijri_Month] = useState<number>(Initial_Hijri_Details.month.number);
  const [Active_Hijri_Year, Set_Active_Hijri_Year] = useState<number>(parseInt(Initial_Hijri_Details.year));
  const [Holidays_Page_Index, Set_Holidays_Page_Index] = useState(0);
  const HOLIDAYS_PER_PAGE_COUNT = 7;

  // Dialog State
  const [Selected_Calendar_Day, Set_Selected_Calendar_Day] = useState<Calendar_Day_Record | null>(null);
  const [Is_Modal_Open, Set_Is_Modal_Open] = useState(false);

  // Compute month grid locally
  const Days_Collection_List: Calendar_Day_Record[] = useMemo(
    () => Build_Month_Grid(Active_Hijri_Year, Active_Hijri_Month),
    [Active_Hijri_Year, Active_Hijri_Month]
  );

  // Compute holidays for the year locally
  const Holidays_Collection_List: Holiday_Record[] = useMemo(() => {
    return ISLAMIC_HOLIDAYS_COLLECTION.map((Holiday_Item) => {
      const Gregorian_Date_Instance = uq(
        Active_Hijri_Year,
        Holiday_Item.Hijri_Month_Number,
        Holiday_Item.Hijri_Day_Number
      ).date as Date;

      return {
        Name_Text: Holiday_Item.Name_Text,
        Gregorian_Date_ISO: `${Gregorian_Date_Instance.getFullYear()}-${Format_Padded_Number(Gregorian_Date_Instance.getMonth() + 1)}-${Format_Padded_Number(Gregorian_Date_Instance.getDate())}`,
        Hijri_Day_Number: Holiday_Item.Hijri_Day_Number,
        Hijri_Month_Number: Holiday_Item.Hijri_Month_Number,
        Type_Category: "Religious",
      };
    }).sort((Item_A, Item_B) => Item_A.Gregorian_Date_ISO.localeCompare(Item_B.Gregorian_Date_ISO));
  }, [Active_Hijri_Year]);

  // Pagination Logic
  const Upcoming_Holidays_List = useMemo(() => {
    return Holidays_Collection_List.filter((Holiday_Item) => Holiday_Item.Gregorian_Date_ISO >= Today_ISO_String);
  }, [Holidays_Collection_List, Today_ISO_String]);

  const Current_Holidays_Batch_List = useMemo(() => {
    const Start_Index = Holidays_Page_Index * HOLIDAYS_PER_PAGE_COUNT;
    return Upcoming_Holidays_List.slice(Start_Index, Start_Index + HOLIDAYS_PER_PAGE_COUNT);
  }, [Upcoming_Holidays_List, Holidays_Page_Index]);

  // Navigation
  const Navigate_To_Next_Month = () => {
    if (Active_Hijri_Month === 12) {
      Set_Active_Hijri_Month(1);
      Set_Active_Hijri_Year((Previous_Year) => Previous_Year + 1);
    } else {
      Set_Active_Hijri_Month((Previous_Month) => Previous_Month + 1);
    }
  };

  const Navigate_To_Previous_Month = () => {
    if (Active_Hijri_Month === 1) {
      Set_Active_Hijri_Month(12);
      Set_Active_Hijri_Year((Previous_Year) => Previous_Year - 1);
    } else {
      Set_Active_Hijri_Month((Previous_Month) => Previous_Month - 1);
    }
  };

  // Grid Logic
  const Get_Weekday_Offset = () => {
    if (Days_Collection_List.length === 0) return 0;
    const First_Day_Name = Days_Collection_List[0].Gregorian_Details.Weekday_Details.English_Name;
    return Short_Weekdays_List.indexOf(First_Day_Name.substring(0, 3));
  };

  const Find_Holiday_For_Date = (Formatted_Gregorian_Date: string) => {
    const [Day_Text, Month_Text, Year_Text] = Formatted_Gregorian_Date.split("-");
    const Target_ISO_Date = `${Year_Text}-${Month_Text}-${Day_Text}`;
    return Holidays_Collection_List.find((Holiday_Item) => Holiday_Item.Gregorian_Date_ISO === Target_ISO_Date);
  };

  return (
    <Layout>
      <section className="py-6">
        <div className="Container max-w-2xl mx-auto">
          {/* Calendar Header */}
          <Container className="!py-3 !px-4 mb-4">
            <div className="flex items-center justify-between">
              <Button size="sm" className="w-9 h-9 p-0 rounded-full" onClick={Navigate_To_Previous_Month}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <p className="text-lg font-semibold">
                  {Days_Collection_List[0]?.Hijri_Details.Month_Details.English_Name || "..."} {Active_Hijri_Year} AH
                </p>
                <p className="text-xs text-muted-foreground">
                  {Days_Collection_List[0]?.Gregorian_Details.Month_Details.English_Name} {Days_Collection_List[0]?.Gregorian_Details.Year_Text}
                </p>
              </div>
              <Button size="sm" className="w-9 h-9 p-0 rounded-full" onClick={Navigate_To_Next_Month}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </Container>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {Short_Weekdays_List.map((Weekday_Name) => (
              <Container key={Weekday_Name} className="!py-1 !px-0 text-center">
                <span className="text-xs text-muted-foreground font-medium">{Weekday_Name}</span>
              </Container>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: Get_Weekday_Offset() }).map((_, Index_Position) => (
              <div key={`empty-${Index_Position}`} />
            ))}
            {Days_Collection_List.map((Day_Item) => {
              const Is_Today_Flag = Day_Item.Gregorian_Details.Formatted_Date === Today_Formatted_Date;
              const Associated_Holiday = Find_Holiday_For_Date(Day_Item.Gregorian_Details.Formatted_Date);

              return (
                <button
                  key={Day_Item.Gregorian_Details.Formatted_Date}
                  onClick={() => {
                    Set_Selected_Calendar_Day(Day_Item);
                    Set_Is_Modal_Open(true);
                  }}
                  className={`
                    group relative rounded-[40px] transition-all Duration-200 py-2 px-1 text-center border-2
                    ${Is_Today_Flag
                      ? "bg-black dark:bg-white border-white dark:border-black"
                      : "bg-white dark:bg-black border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                    }
                  `}
                >
                  <div className="flex items-center justify-center gap-0.5">
                    <p className={`text-sm font-semibold leading-tight ${Is_Today_Flag ? "text-white dark:text-black" : "text-black dark:text-white [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black"}`}>
                      {Day_Item.Hijri_Details.Day_Text}
                    </p>
                    {Associated_Holiday && <span className="text-[10px] text-yellow-500">★</span>}
                  </div>
                  <p className={`text-xs leading-tight mt-0.5 ${Is_Today_Flag ? "text-white/70 dark:text-black/70" : "text-muted-foreground"}`}>
                    {Day_Item.Gregorian_Details.Day_Text}
                  </p>
                </button>
              );
            })}
          </div>

          {/* ----- Upcoming Islamic Holidays ----- */}
          <Container className="mt-8 !py-5 !px-4">
            <div className="flex items-center justify-between mb-4 gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-base sm:text-lg leading-tight truncate">
                  Upcoming Islamic Holidays
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {Upcoming_Holidays_List.length} remaining in {Active_Hijri_Year} AH
                </p>
              </div>
              {Upcoming_Holidays_List.length > HOLIDAYS_PER_PAGE_COUNT && (
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className={`rounded-full w-8 h-8 p-0 ${Holidays_Page_Index === 0 ? "opacity-40 pointer-events-none" : ""}`}
                    onClick={() => Set_Holidays_Page_Index((Previous_Page) => Previous_Page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground tabular-nums w-10 text-center">
                    {Holidays_Page_Index + 1}/{Math.ceil(Upcoming_Holidays_List.length / HOLIDAYS_PER_PAGE_COUNT)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`rounded-full w-8 h-8 p-0 ${(Holidays_Page_Index + 1) * HOLIDAYS_PER_PAGE_COUNT >= Upcoming_Holidays_List.length ? "opacity-40 pointer-events-none" : ""}`}
                    onClick={() => Set_Holidays_Page_Index((Previous_Page) => Previous_Page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {Upcoming_Holidays_List.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No upcoming holidays found for this year.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {Current_Holidays_Batch_List.map((Holiday_Item, Index_Position) => {
                  const Date_Instance = new Date(Holiday_Item.Gregorian_Date_ISO);
                  const Formatted_Date_Text = Date_Instance.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  });
                  const Days_Remaining_Count = Math.max(
                    0,
                    Math.ceil((Date_Instance.getTime() - Current_Date_Object.getTime()) / 86400000)
                  );

                  return (
                    <div
                      key={`${Holiday_Item.Gregorian_Date_ISO}-${Index_Position}`}
                      className="p-3 rounded-2xl bg-accent/60 border border-border/40 hover:bg-accent transition-colors flex flex-col gap-1"
                    >
                      <p className="font-semibold text-xs leading-tight line-clamp-2 min-h-[2rem]">
                        {Holiday_Item.Name_Text}
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-1">
                        <span className="text-[10px] text-muted-foreground">{Formatted_Date_Text}</span>
                        <span className="text-[10px] font-medium text-foreground/80">
                          {Days_Remaining_Count === 0 ? "Today" : `${Days_Remaining_Count}d`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Container>
        </div>
      </section>

      <Date_Dialog
        Open={Is_Modal_Open}
        On_Close={() => Set_Is_Modal_Open(false)}
        Day={Selected_Calendar_Day ? {
          Hijri: {
            day: Selected_Calendar_Day.Hijri_Details.Day_Text,
            month: {
              number: Selected_Calendar_Day.Hijri_Details.Month_Details.Month_Number,
              en: Selected_Calendar_Day.Hijri_Details.Month_Details.English_Name,
              ar: Selected_Calendar_Day.Hijri_Details.Month_Details.Arabic_Name,
            },
            year: Selected_Calendar_Day.Hijri_Details.Year_Text,
            weekday: {
              en: Selected_Calendar_Day.Hijri_Details.Weekday_Details.English_Name,
              ar: Selected_Calendar_Day.Hijri_Details.Weekday_Details.Arabic_Name,
            },
            designation: { abbreviated: Selected_Calendar_Day.Hijri_Details.Designation_Details.Abbreviation_Text },
          },
          gregorian: {
            date: Selected_Calendar_Day.Gregorian_Details.Formatted_Date,
            day: Selected_Calendar_Day.Gregorian_Details.Day_Text,
            month: {
              number: Selected_Calendar_Day.Gregorian_Details.Month_Details.Month_Number,
              en: Selected_Calendar_Day.Gregorian_Details.Month_Details.English_Name,
            },
            year: Selected_Calendar_Day.Gregorian_Details.Year_Text,
            weekday: { en: Selected_Calendar_Day.Gregorian_Details.Weekday_Details.English_Name },
          },
        } : null}
        Hijri_Month={Active_Hijri_Month || 1}
        Hijri_Year={Active_Hijri_Year || 1447}
        holiDay={
          Selected_Calendar_Day
            ? (() => {
                const Matched_Holiday = Find_Holiday_For_Date(Selected_Calendar_Day.Gregorian_Details.Formatted_Date);
                if (!Matched_Holiday) return undefined;
                return {
                  name: Matched_Holiday.Name_Text,
                  gregorianDate: Matched_Holiday.Gregorian_Date_ISO,
                  Hijri_Day: Matched_Holiday.Hijri_Day_Number,
                  Hijri_Month: Matched_Holiday.Hijri_Month_Number,
                  type: Matched_Holiday.Type_Category,
                };
              })()
            : undefined
        }
      />
    </Layout>
  );
}