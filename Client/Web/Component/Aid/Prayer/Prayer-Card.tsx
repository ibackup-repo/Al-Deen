import { Class_Names } from "@/Library/Utility";
import { Format_Time } from "./Utility";
import { Container } from "@Web/Component/UI/Container";
import type { Prayer_Times, Main_Prayer, Prayer_Settings } from "./Types";

interface Prayer_Card_Properties {
  Prayer: Main_Prayer;
  Timings: Prayer_Times;
  Settings: Prayer_Settings;
  Is_Next: boolean;
}

export function Prayer_Card({
  Prayer,
  Timings,
  Settings,
  Is_Next,
}: Prayer_Card_Properties) {
  return (
    <Container
      className={Class_Names(
        "!p-4 transition-all",
        Is_Next &&
          "!bg-black dark:!bg-white !border-white dark:!border-black !text-white dark:!text-black"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={Class_Names("font-medium", Is_Next && "text-white dark:text-black")}>
            {Prayer}
          </p>
        </div>
        <p
          className={Class_Names(
            "text-lg font-semibold tabular-nums",
            Is_Next && "text-white dark:text-black"
          )}
        >
          {Format_Time(Timings[Prayer], Settings.Time_Format)}
        </p>
      </div>
    </Container>
  );
}