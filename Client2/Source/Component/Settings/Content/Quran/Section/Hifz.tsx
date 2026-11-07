import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Use_App } from "@Web/Context/App";
import { Card } from "@Web/Component/UI/Card";
import { Button } from "@Web/Component/UI/Button";
import { ArrowLeft, Check } from "lucide-react";

const Backend_Base_URL = "https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev";

// Dynamic types matching the updated network layout schema
export interface Surah_Metadatadata {
  id: number;
  English_Name: string;
  English_Name_Translation: string;
  Number_Of_Ayaat: number;
  Revelation_Type: string;
  Surah_Font_Name: string;
}

export interface UnifiedCorpusResponse {
  Suwar: Surah_Metadatadata[];
}

export interface VerseData {
  Ayah_ID: number;
  Kalimaat: string[];
}

export interface SurahDetailsResponse {
  id: number;
  Ayaat: VerseData[];
}

// Client-safe async fetch implementations
async function fetchQuranCorpus(): Promise<UnifiedCorpusResponse> {
  const response = await fetch(`${Backend_Base_URL}/api/Quran-Corpus`);
  if (!response.ok) throw new Error("Failed to pull unified Surah list metadata");
  return response.json();
}

async function fetchSurahVerses(Surah_ID: number): Promise<SurahDetailsResponse> {
  const response = await fetch(`${Backend_Base_URL}/api/Surah/${Surah_ID}?Font_Type=Standard`);
  if (!response.ok) throw new Error(`Failed to pull Ayaat for Surah: ${Surah_ID}`);
  return response.json();
}

// Get stroke color based on Render_Progress
const Get_Stroke_Color = (Render_Progress: number, completed: boolean): string => {
  if (completed) return "#10b981";
  if (Render_Progress >= 0.75) return "#10b981";
  if (Render_Progress >= 0.5) return "#3b82f6";
  if (Render_Progress >= 0.25) return "#eab308";
  return "#ef4444";
};

// Get text color for percentage (same ranges)
const Get_Text_Color = (Render_Progress: number, completed: boolean): string => {
  if (completed) return "#10b981";
  if (Render_Progress >= 0.75) return "#10b981";
  if (Render_Progress >= 0.5) return "#3b82f6";
  if (Render_Progress >= 0.25) return "#eab308";
  return "#ef4444";
};

// Progress Circle Component
const Progress_Circle = ({
  Render_Progress,
  size = 40,
  strokeWidth = 4,
  onClick,
  completed = false,
}: {
  Render_Progress: number;
  size?: number;
  strokeWidth?: number;
  onClick?: () => void;
  completed?: boolean;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Render_Progress);
  const Show_Percentage = Render_Progress > 0 && Render_Progress < 1;
  const Percent_Value = Math.round(Render_Progress * 100);
  const Stroke_Color = Get_Stroke_Color(Render_Progress, completed);
  const Text_Color = Get_Text_Color(Render_Progress, completed);

  return (
    <div
      className="relative inline-flex items-center justify-center cursor-pointer group/circle"
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Inner filled circle – white default, black on hover */}
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="white"
          className="group-hover/circle:fill-black transition-colors"
        />
        {/* Background stroke (unfilled) – black default, white on hover */}
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none"
          stroke="black"
          strokeWidth={strokeWidth}
          className="group-hover/circle:stroke-white transition-colors"
        />
        {/* Progress stroke – dynamic color, NO hover change */}
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none"
          stroke={Stroke_Color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      {completed && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Check
            size={size * 0.5}
            stroke="black"
            strokeWidth={3}
            className="group-hover/circle:stroke-white transition-colors"
          />
        </div>
      )}
      {Show_Percentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold" style={{ color: Text_Color }}>
            {Percent_Value}%
          </span>
        </div>
      )}
    </div>
  );
};

function Get_Non_Marker_Kalimah_Count(Ayah: any): number {
  if (!Ayah?.Kalimaat) return 0;
  return Ayah.Kalimaat.length - 1;
}

type View = "Suwar" | "Ayaat" | "Kalimaat";

export function Hifz() {
  const { Hifz } = Use_App();
  const [Current_View, Set_Current_View] = useState<View>("Suwar");
  const [Selected_Surah_ID, Set_Selected_Surah_ID] = useState<number | null>(null);
  const [Selected_Ayah_Number, Set_Selected_Ayah_Number] = useState<number | null>(null);

  // Unified global Corpus query Loop substitution
  const { data: Corpus_Data } = useQuery({
    queryKey: ["quranCorpusMetadata"],
    queryFn: fetchQuranCorpus,
    staleTime: 1000 * 60 * 60,
  });

  const Surah_List = useMemo(() => Corpus_Data?.Suwar || [], [Corpus_Data]);

  // Lazy load Ayaat details conditionally based on current structural layer depth
  const { data: Details_Data, Is_Loading_Corpus_Data } = useQuery({
    queryKey: ["surahVersesData", Selected_Surah_ID],
    queryFn: () => fetchSurahVerses(Selected_Surah_ID!),
    enabled: !!Selected_Surah_ID,
    staleTime: 1000 * 60 * 15,
  });

  const [Surah_Cache, Set_Surah_Cache] = useState<Record<number, any>>({});
  
  useEffect(() => {
    if (Selected_Surah_ID && Details_Data && !Is_Loading_Corpus_Data) {
      Set_Surah_Cache(prev => ({ ...prev, [Selected_Surah_ID]: Details_Data }));
    }
  }, [Selected_Surah_ID, Details_Data, Is_Loading_Corpus_Data]);

  const Get_Ayah_Progress = useCallback((Surah_ID: number, Ayah_ID: number, Ayah: any): number => {
    const Total_Kalimaat = Get_Non_Marker_Kalimah_Count(Ayah);
    if (Total_Kalimaat === 0) return 1;
    let completed = 0;
    for (let i = 0; i < Total_Kalimaat; i++) {
      if (Hifz.Is_Kalimah_Completed(Surah_ID, Ayah_ID, i)) completed++;
    }
    return completed / Total_Kalimaat;
  }, [Hifz]);

  const Get_Surah_Progress = useCallback((Surah_ID: number): { Render_Progress: number; completed: boolean } => {
    const data = Surah_Cache[Surah_ID];
    if (!data?.Ayaat) return { Render_Progress: 0, completed: false };
    let Completed_Ayaat = 0;
    for (let i = 0; i < data.Ayaat.length; i++) {
      const Ayah_ID = i + 1;
      const prog = Get_Ayah_Progress(Surah_ID, Ayah_ID, data.Ayaat[i]);
      if (prog === 1) Completed_Ayaat++;
    }
    const prog = data.Ayaat.length === 0 ? 0 : Completed_Ayaat / data.Ayaat.length;
    return { Render_Progress: prog, completed: prog === 1 };
  }, [Surah_Cache, Get_Ayah_Progress]);

  // Helper: mark all Kalimaat in a Ayah as completed
  const Mark_All_Kalimaat_In_Ayah = (Surah_ID: number, Ayah_ID: number, Ayah: any) => {
    const Total_Kalimaat = Get_Non_Marker_Kalimah_Count(Ayah);
    for (let i = 0; i < Total_Kalimaat; i++) {
      if (!Hifz.Is_Kalimah_Completed(Surah_ID, Ayah_ID, i)) {
        Hifz.Mark_Kalimah_Completed(Surah_ID, Ayah_ID, i);
      }
    }
  };

  // Helper: mark all Ayaat in a Surah as completed
  const Mark_All_Ayaat_In_Surah = (Surah_ID: number) => {
    const data = Surah_Cache[Surah_ID];
    if (!data?.Ayaat) return;
    for (let i = 0; i < data.Ayaat.length; i++) {
      const Ayah_ID = i + 1;
      Mark_All_Kalimaat_In_Ayah(Surah_ID, Ayah_ID, data.Ayaat[i]);
    }
  };

  // Surah circle click: if completed -> reset, else mark all Kalimaat
  const Handle_Surah_Click = (Surah_ID: number, Surah_Name: string) => {
    const { completed } = Get_Surah_Progress(Surah_ID);
    if (completed) {
      if (window.confirm(`Reset ALL memorization for ${Surah_Name}?`)) {
        Hifz.Reset_Surah(Surah_ID);
        Set_Surah_Cache(prev => ({ ...prev }));
      }
    } else {
      if (window.confirm(`Mark all Ayaat of ${Surah_Name} as memorized?`)) {
        Mark_All_Ayaat_In_Surah(Surah_ID);
        Set_Surah_Cache(prev => ({ ...prev }));
      }
    }
  };

  // Ayah circle click: if completed -> reset, else mark all Kalimaat in that Ayah
  const Handle_Ayah_Click = (Surah_ID: number, Ayah_ID: number, Surah_Name: string, Ayah: any) => {
    const Render_Progress = Get_Ayah_Progress(Surah_ID, Ayah_ID, Ayah);
    const completed = Render_Progress === 1;
    if (completed) {
      if (window.confirm(`Reset memorization for Ayah ${Ayah_ID} of ${Surah_Name}?`)) {
        Hifz.Reset_Ayah(Surah_ID, Ayah_ID);
        Set_Surah_Cache(prev => ({ ...prev }));
      }
    } else {
      if (window.confirm(`Mark Ayah ${Ayah_ID} of ${Surah_Name} as memorized?`)) {
        Mark_All_Kalimaat_In_Ayah(Surah_ID, Ayah_ID, Ayah);
        Set_Surah_Cache(prev => ({ ...prev }));
      }
    }
  };

  const Handle_Toggle_Word = (Surah_ID: number, Ayah_ID: number, Kalimah_Index: number, Is_Completed: boolean) => {
    if (Is_Completed) Hifz.Unmark_Kalimah_Completed(Surah_ID, Ayah_ID, Kalimah_Index);
    else Hifz.Mark_Kalimah_Completed(Surah_ID, Ayah_ID, Kalimah_Index);
  };

  const Go_To_Suwar = () => { Set_Current_View("Suwar"); Set_Selected_Surah_ID(null); Set_Selected_Ayah_Number(null); };
  
  const Go_To_Ayaat = async (Surah_ID: number) => {
    Set_Selected_Surah_ID(Surah_ID);
    Set_Current_View("Ayaat");
    Set_Selected_Ayah_Number(null);
  };
  
  const Go_To_Kalimaat = (Surah_ID: number, Ayah_ID: number) => { 
    Set_Selected_Surah_ID(Surah_ID); 
    Set_Selected_Ayah_Number(Ayah_ID); 
    Set_Current_View("Kalimaat"); 
  };

  // Render Surah list
  const Render_Suwar = () => (
    <div className="space-y-3">
      {Surah_List.map((Surah: Surah_Metadatadata) => {
        const { Render_Progress, completed } = Get_Surah_Progress(Surah.id);
        return (
          <Card
            key={Surah.id}
            className="cursor-pointer transition-all Duration-200 group bg-card"
            onClick={() => Go_To_Ayaat(Surah.id)}
          >
            <div className="flex items-center gap-4 p-4">
              <Progress_Circle Render_Progress={Render_Progress} size={50} strokeWidth={5} completed={completed}
                onClick={(e) => { e.stopPropagation(); Handle_Surah_Click(Surah.id, Surah.English_Name); }} />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base sm:text-lg text-foreground [.high-contrast_&]:group-hover:text-white transition-colors">
                  {Surah.English_Name}
                </h3>
                <p className="text-sm text-foreground [.high-contrast_&]:group-hover:text-white transition-colors">
                  {Surah.English_Name_Translation} <span className="text-muted-foreground [.high-contrast_&]:group-hover:text-white/70">#{Surah.id}</span>
                </p>
                <p className="text-xs text-muted-foreground [.high-contrast_&]:group-hover:text-white/70 transition-colors mt-0.5">
                  {Surah.Revelation_Type === "Meccan" ? "Meccan" : "Medinan"}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-Surah text-lg sm:text-xl text-foreground [.high-contrast_&]:group-hover:text-white transition-colors" dir="rtl">
                  {Surah.Surah_Font_Name}
                </p>
                <p className="text-xs text-muted-foreground [.high-contrast_&]:group-hover:text-white/70 transition-colors">
                  {Surah.Number_Of_Ayaat} Ayah
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );

  // Render Verses – Arabic name above Ayah Count
  const Render_Ayaat = () => {
    const data = Surah_Cache[Selected_Surah_ID!];
    const Surah = Surah_List.find((s: Surah_Metadatadata) => s.id === Selected_Surah_ID);
    if (!data?.Ayaat) return <div className="text-center py-8 text-foreground">Loading Ayaat...</div>;
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" onClick={Go_To_Suwar} className="gap-1">
              <ArrowLeft size={16} /> Back to Surahs
            </Button>
            <span className="font-bold text-xl text-foreground">{Surah?.English_Name}</span>
          </div>
          <div className="text-right">
            <p className="font-Surah text-xl text-foreground transition-colors" dir="rtl">
              {Surah?.Surah_Font_Name}
            </p>
            <p className="text-xs text-muted-foreground">{Surah?.Number_Of_Ayaat} Ayah</p>
          </div>
        </div>
        <div className="space-y-3">
          {data.Ayaat.map((Ayah: any, Index: number) => {
            const Ayah_ID = Index + 1;
            const Render_Progress = Get_Ayah_Progress(Selected_Surah_ID!, Ayah_ID, Ayah);
            const completed = Render_Progress === 1;
            return (
              <Card
                key={Ayah_ID}
                className="cursor-pointer transition-all Duration-200 group bg-card"
                onClick={() => Go_To_Kalimaat(Selected_Surah_ID!, Ayah_ID)}
              >
                <div className="flex items-center gap-4 p-4">
                  <Progress_Circle Render_Progress={Render_Progress} size={40} strokeWidth={4} completed={completed}
                    onClick={(e) => { e.stopPropagation(); Handle_Ayah_Click(Selected_Surah_ID!, Ayah_ID, Surah?.English_Name || '', Ayah); }} />
                  <div className="flex-1">
                    <div className="font-medium text-foreground [.high-contrast_&]:group-hover:text-white transition-colors">
                      {Ayah_ID}
                    </div>
                    <div className="text-right text-lg font-Arabic mt-1 text-foreground [.high-contrast_&]:group-hover:text-white transition-colors" dir="rtl">
                      {Ayah.Kalimaat?.slice(0, -1).join(' ') || ''}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Words
  const Render_Kalimaat = () => {
    const data = Surah_Cache[Selected_Surah_ID!];
    const Surah = Surah_List.find((s: Surah_Metadatadata) => s.id === Selected_Surah_ID);
    const Ayah = data?.Ayaat?.[Selected_Ayah_Number! - 1];
    if (!Ayah) return <div className="text-center py-8 text-foreground">Loading Kalimaat...</div>;
    const Kalimaat = Ayah.Kalimaat?.slice(0, -1) || [];
    return (
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Button variant="default" size="sm" onClick={() => Go_To_Ayaat(Selected_Surah_ID!)} className="gap-1">
            <ArrowLeft size={16} /> Back to Verses
          </Button>
          <span className="font-bold text-xl text-foreground">{Surah?.English_Name} - {Selected_Ayah_Number}</span>
        </div>
        <div className="space-y-2">
          {Kalimaat.map((Kalimah: string, Index: number) => {
            const Is_Completed = Hifz.Is_Kalimah_Completed(Selected_Surah_ID!, Selected_Ayah_Number!, Index);
            const Kalimah_Progress = Is_Completed ? 1 : 0;
            return (
              <Card key={Index} className="p-4 flex items-center gap-4 transition-all Duration-200 group bg-card">
                <Progress_Circle Render_Progress={Kalimah_Progress} size={32} strokeWidth={3} completed={Is_Completed}
                  onClick={() => Handle_Toggle_Word(Selected_Surah_ID!, Selected_Ayah_Number!, Index, Is_Completed)} />
                <div className="flex-1 text-right text-xl font-Arabic text-foreground [.high-contrast_&]:group-hover:text-white transition-colors" dir="rtl">
                  {Kalimah}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {Current_View === "Suwar" && Render_Suwar()}
      {Current_View === "Ayaat" && Render_Ayaat()}
      {Current_View === "Kalimaat" && Render_Kalimaat()}
    </div>
  );
}