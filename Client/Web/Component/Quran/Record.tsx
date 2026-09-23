import { Mic, MicOff, Eye, EyeOff, Play } from "lucide-react";
import { Card } from "@Web/Component/UI/Card";
import { Class_Names } from "@/Library/Utility";

interface Audio_Controls_Properties {
  Is_Recording?: boolean;
  On_Record_Toggle?: () => void;
  On_Test_Audio?: () => void;
  Hide_Ayaat?: boolean;
  On_Hide_Ayaat_Toggle?: (checked: boolean) => void;
  Transcript?: string;
  className?: string;
}

export function Audio_Controls({
  Is_Recording = false,
  On_Record_Toggle,
  On_Test_Audio,
  Hide_Ayaat = false,
  On_Hide_Ayaat_Toggle,
  Transcript = "",
  className,
}: Audio_Controls_Properties) {
  const Handle_Eye_Click = () => {
    On_Hide_Ayaat_Toggle?.(!Hide_Ayaat);
  };

  return (
    <div className={Class_Names("fixed right-4 bottom-24 z-40 flex flex-col gap-3", className)}>
      {/* Record Button */}
      <Card
        className={Class_Names(
          "p-3 rounded-full cursor-pointer transition-all group inline-flex items-center justify-center w-fit",
          Is_Recording
            ? "bg-red-500 hover:bg-red-600 border-red-500"
            : ""
        )}
        onClick={On_Record_Toggle}
      >
        {Is_Recording ? (
          <MicOff className="h-6 w-6 text-white" />
        ) : (
          <Mic className="h-6 w-6 text-foreground [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black" />
        )}
      </Card>

      {/* Play Surah Button */}
      {On_Test_Audio && (
        <Card
          className="p-3 rounded-full cursor-pointer transition-all inline-flex items-center justify-center w-fit group"
          onClick={On_Test_Audio}
        >
          <Play className="h-6 w-6 text-foreground [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black" />
        </Card>
      )}

      {/* Hide Verses toggle — uses Card for consistent (gray) hover styling */}
      <Card
        Active={Hide_Ayaat}
        className="p-3 rounded-full cursor-pointer inline-flex items-center justify-center w-fit group"
        onClick={Handle_Eye_Click}
      >
        {Hide_Ayaat ? (
          <EyeOff className="h-6 w-6 text-foreground [.high-contrast_&]:text-white [.high-contrast_&]:dark:text-black [.high-contrast_&]:group-hover:text-black [.high-contrast_&]:dark:group-hover:text-white" />
        ) : (
          <Eye className="h-6 w-6 text-foreground [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black" />
        )}
      </Card>

      {/* Transcript */}
      {Transcript && (
        <Card className="p-3 max-w-[200px] backdrop-blur-sm" Is_Hoverable={false}>
          <p className="text-xs text-foreground break-Kalimaat">{Transcript}</p>
        </Card>
      )}
    </div>
  );
}
