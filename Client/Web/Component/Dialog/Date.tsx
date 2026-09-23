import { Dialog, Dialog_Content, Dialog_Header, Dialog_Title } from "@Web/Component/UI/Dialog";
import { Button } from "@Web/Component/UI/Button";

interface Hijri_Date {
  day: string;
  weekday: { en: string; ar: string };
  month: { number: number; en: string; ar: string };
  year: string;
  designation: { abbreviated: string };
}

interface Calendar_Day {
  Hijri: Hijri_Date;
  gregorian: {
    date: string;
    day: string;
    weekday: { en: string };
    month: { number: number; en: string };
    year: string;
  };
}

interface Islamic_Holiday {
  Hijri_Day: number;
  Hijri_Month: number;
  gregorianDate: string;
  name: string;
  type: string;
  description?: string;
}

interface Date_Dialog_Properties {
  Open: boolean;
  On_Close: () => void;
  Day: Calendar_Day | null;
  Hijri_Month: number;
  Hijri_Year: number;
  Holiday?: Islamic_Holiday;
}

export function Date_Dialog({
  Open,
  On_Close,
  Day,
  Hijri_Month,
  Hijri_Year,
  Holiday,
}: Date_Dialog_Properties) {
  if (!Day) return null;

  const Has_Holiday = Boolean(Holiday);

  return (
    <Dialog Open={Open} On_Open_Change={On_Close}>
      <Dialog_Content className="bg-white dark:bg-black border-2 border-black dark:border-white rounded-[40px] max-w-md">
        <Dialog_Header>
          <Dialog_Title className="text-xl font-bold text-center">
            {Day.Hijri.month.en} {Day.Hijri.day}, {Day.Hijri.year} AH
          </Dialog_Title>
        </Dialog_Header>

        <div className="space-y-4">
          {/* Islamic Holiday Section */}
          {Has_Holiday ? (
            <div className="space-y-2 p-3 rounded-[40px] bg-accent border border-border/40">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1">
                🕌 Islamic Holiday
              </h3>
              <p className="font-medium text-base">{Holiday.name}</p>
              {Holiday.description && (
                <p className="text-sm text-muted-foreground">{Holiday.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {Holiday.type === "islamic" ? "Major observance" : "Optional observance"}
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-[40px] bg-muted/30 text-center">
              <p className="text-sm text-muted-foreground">No Islamic holiday on this day.</p>
            </div>
          )}

          {/* Gregorian Date */}
          <div className="pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Gregorian Date</p>
            <p className="text-sm font-medium">
              {Day.gregorian.weekday.en}, {Day.gregorian.month.en} {Day.gregorian.day}, {Day.gregorian.year}
            </p>
          </div>

          {/* Hijri Details */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <p className="text-xs text-muted-foreground">Hijri Month</p>
              <p className="text-sm font-medium">{Day.Hijri.month.en}</p>
              <p className="text-xs text-muted-foreground font-Arabic">{Day.Hijri.month.ar}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Weekday</p>
              <p className="text-sm font-medium">{Day.Hijri.weekday.en}</p>
              <p className="text-xs text-muted-foreground font-Arabic">{Day.Hijri.weekday.ar}</p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Button onClick={On_Close} fullWidth>
            Close
          </Button>
        </div>
      </Dialog_Content>
    </Dialog>
  );
}