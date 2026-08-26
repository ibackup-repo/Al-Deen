import { useState, useEffect } from "react";
import { Card } from "@Web/Component/UI/Card";
import { Target } from "lucide-react";

interface Goal_Card_Props {
  Surah_List: any[];
  Total_Ayaat_Count: number;
}

const Reading_Goal_Key = "Reading_Goal";

export const Goal_Card = ({ Surah_List, Total_Ayaat_Count }: Goal_Card_Props) => {
  const [Completed_Ayaat, Set_Completed_Ayaat] = useState<number>(0);
  const [Daily_Target, Set_Daily_Target] = useState<number>(10);

  useEffect(() => {
    try {
      const Stored_Progress = localStorage.getItem(Reading_Goal_Key);
      if (Stored_Progress) {
        const parsed = JSON.parse(Stored_Progress);
        Set_Completed_Ayaat(parsed.Completed_Ayaat || 0);
        Set_Daily_Target(parsed.Daily_Target || 10);
      }
    } catch (e) {
      console.warn("Failed to load daily goal state:", e);
    }
  }, []);

  const Progress_Percentage = Math.min(
    100,
    Math.round((Completed_Ayaat / (Daily_Target || 1)) * 100)
  );

  return (
    <Card className="flex-1 min-w-[280px] p-4 bg-card flex flex-col justify-between gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary flex-shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Daily Goal
            </p>
            <p className="text-xs font-semibold">
              {Completed_Ayaat} / {Daily_Target} Ayah
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-primary">
          {Progress_Percentage}%
        </span>
      </div>

      <div className="w-full bg-secondary/20 h-2 rounded-full overflow-hidden">
        <div
          className="bg-primary h-full transition-all Duration-300 ease-out"
          style={{ width: `${Progress_Percentage}%` }}
        />
      </div>
    </Card>
  );
};