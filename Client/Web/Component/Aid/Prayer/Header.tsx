import { MapPin, RefreshCw } from "lucide-react";
import { Button } from "@Web/Component/UI/Button";
import { Container } from "@Web/Component/UI/Container";
import type { Location_Data, Hijri_Date } from "./Types";

interface Header_Properties {
  Location: Location_Data | null;
  Hijri_Date: Hijri_Date | null;
  On_Refresh: () => void;
}

export function Header({
  Location,
  Hijri_Date,
  On_Refresh,
}: Header_Properties) {
  return (
    <>
      <div className="md:hidden flex flex-col gap-3 mb-2">
        {Location?.City && (
          <Container className="flex items-center justify-between gap-3 py-2 px-4">
            <div className="flex items-center gap-1.5 text-foreground min-w-0">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-base font-medium truncate">
                {Location.City}
                {Location.Country ? `, ${Location.Country}` : ""}
              </span>
            </div>
            <Button
              size="sm"
              className="w-9 h-9 p-0 rounded-full flex-shrink-0"
              onClick={On_Refresh}
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </Container>
        )}
        {Hijri_Date && (
          <div className="flex justify-center">
            <Container className="shrink-0 w-auto py-1.5 px-3">
              <p className="text-sm text-muted-foreground whitespace-nowrap font-sans">
                {Hijri_Date.Day} {Hijri_Date.Month.En}{" "}
                {Hijri_Date.Year} {Hijri_Date.Designation.Abbreviated}
              </p>
            </Container>
          </div>
        )}
      </div>

      <div className="hidden md:flex items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          {Location?.City && (
            <Container className="shrink-0 w-auto py-2 px-4">
              <div className="flex items-center gap-1.5 text-foreground">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-base font-medium">
                  {Location.City}
                  {Location.Country ? `, ${Location.Country}` : ""}
                </span>
              </div>
            </Container>
          )}
          {Hijri_Date && (
            <Container className="shrink-0 w-auto py-1.5 px-3">
              <p className="text-sm text-muted-foreground whitespace-nowrap font-sans">
                {Hijri_Date.Day} {Hijri_Date.Month.En}{" "}
                {Hijri_Date.Year} {Hijri_Date.Designation.Abbreviated}
              </p>
            </Container>
          )}
        </div>
        <Button
          size="sm"
          className="w-9 h-9 p-0 rounded-full shrink-0"
          onClick={On_Refresh}
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
}