import { Format_Time } from "./Utility";
import { Container } from "@Web/Component/UI/Container";
import type { Prayer_Times, Prayer_Settings } from "./Types";

interface Additional_Times_Properties {
  Timings: Prayer_Times;
  Settings: Prayer_Settings;
}

export function Additional_Times({
  Timings,
  Settings,
}: Additional_Times_Properties) {
  if (!Timings.Imsak && !Timings.Midnight) return null;

  return (
    <Container className="!p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
        Additional Times
      </p>
      <div className="grid grid-cols-2 gap-4">
        {Timings.Imsak && (
          <div>
            <p className="text-xs text-muted-foreground">Imsak</p>
            <p className="font-semibold tabular-nums">
              {Format_Time(Timings.Imsak, Settings.Time_Format)}
            </p>
          </div>
        )}
        {Timings.Midnight && (
          <div>
            <p className="text-xs text-muted-foreground">Midnight</p>
            <p className="font-semibold tabular-nums">
              {Format_Time(Timings.Midnight, Settings.Time_Format)}
            </p>
          </div>
        )}
      </div>
    </Container>
  );
}