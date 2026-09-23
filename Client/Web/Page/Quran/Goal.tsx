import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@Web/Component/Layout/Index";
import { Use_Auth } from "@Web/Context/Auth";
import { Use_Quran_Goals } from "@/Hook/Use-Quran-Goals";
import { Use_Reading_Progress } from "@/Hook/Use-Reading-Progress";
import { supabase } from "@/Integration/supabase/client";
import { Container } from "@Web/Component/UI/Container";
import { Active } from "@Web/Component/Quran/Goal/Active";
import { Creation } from "@Web/Component/Quran/Goal/Creation";
import type { Goal_Progress } from "@Web/Component/Quran/Goal/Types";
import { useQuery } from "@tanstack/react-query";

const Total_Ayaat = 6236;

// ============================================================================
// Network Fetch Client Handler
// ============================================================================
async function Fetch_Quran_Corpus_From_Backend() {
  const response = await fetch("https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev/api/Quran-Corpus");
  if (!response.ok) throw new Error("Failed to stream Quran Corpus database over the network");
  return response.json();
}

export default function Goal() {
  const { User, Is_Loading_Corpus_Data: Is_Auth_Loading } = Use_Auth();
  const navigate = useNavigate();
  const { Active_Goal, Week_Progress, Is_Loading_Corpus_Data: goalsLoading, Create_Goal, Delete_Goal } = Use_Quran_Goals();
  const { Render_Progress } = Use_Reading_Progress();

  // 🌟 Ingest entire data block from the distributed backend network cache
  const { data: Corpus, Is_Loading_Corpus_Data: Is_Corpus_Loading } = useQuery({
    queryKey: ["Quran_Corpus_Backend"],
    queryFn: Fetch_Quran_Corpus_From_Backend,
    staleTime: 1000 * 60 * 30, // 30 Minutes client cache
  });

  const [showCreation, setShowCreation] = useState(false);
  const [Total_Minutes_Read, setTotalMinutesRead] = useState(0);
  const [Today_Minutes, setTodayMinutes] = useState(0);
  const [Today_Seconds, setTodaySeconds] = useState(0);

  useEffect(() => {
    if (!Is_Auth_Loading && !User) navigate("/Sign-Up");
  }, [User, Is_Auth_Loading, navigate]);

  useEffect(() => {
    if (!User || !Active_Goal) return;
    
    const fetchStats = async () => {
      try {
        const { data: allProgress } = await supabase
          .from("goal_progress")
          .select("Minutes_Read, Seconds_Read, date")
          .eq("Goal_ID", Active_Goal.id);
        
        if (allProgress) {
          const total = allProgress.reduce((Sum, p) => Sum + ((p as any).Minutes_Read || 0), 0);
          setTotalMinutesRead(total);
          
          const today = new Date().toISOString().split("T")[0];
          const todayEntry = allProgress.find((p) => (p as any).date === today);
          
          if (todayEntry) {
            const Minutes = (todayEntry as any).Minutes_Read || 0;
            const Seconds = (todayEntry as any).Seconds_Read || 0;
            setTodayMinutes(Minutes);
            setTodaySeconds(Seconds);
          } else {
            setTodayMinutes(0);
            setTodaySeconds(0);
          }
        }
      } catch (error) {
        console.error("error fetching Dashboard_Stats:", error);
      }
    };
    
    fetchStats();
  }, [User, Active_Goal, Week_Progress]);

  // Client-side mapping calculations based on Active stream metrics
  const versesBeforeSurah = useMemo(() => {
    return (Surah_ID: number): number => {
      if (!Corpus?.Suwar) return 0;
      return Corpus.Suwar
        .filter((s: any) => s.id < Surah_ID)
        .reduce((Sum: number, s: any) => Sum + (s.Number_Of_Ayaat || 0), 0);
    };
  }, [Corpus]);

  const Current_Surah = useMemo(() => {
    if (!Render_Progress || !Corpus?.Suwar) return null;
    return Corpus.Suwar.find((s: any) => s.id === Render_Progress.Last_Surah_ID) || null;
  }, [Render_Progress, Corpus]);

  const Current_Juz = useMemo(() => {
    if (!Render_Progress) return 1;
    if (Render_Progress.Last_Juz_ID) return Render_Progress.Last_Juz_ID;
    if (Corpus?.juzData) {
      const juzInfo = Corpus.juzData.find((j: any) => j.Suwar.some((s: any) => s.id === Render_Progress.Last_Surah_ID));
      if (juzInfo) return juzInfo.juzNumber;
    }
    return 1;
  }, [Render_Progress, Corpus]);

  const Current_Page = Render_Progress?.Last_Page_ID || 1;
  const Current_Ayah = Render_Progress?.Last_Ayah_ID || 1;

  const Ayaat_Read = useMemo(() => {
    if (!Render_Progress) return 0;
    return versesBeforeSurah(Render_Progress.Last_Surah_ID) + (Render_Progress.Last_Ayah_ID || 0);
  }, [Render_Progress, versesBeforeSurah]);

  const Overall_Progress = Math.round((Ayaat_Read / Total_Ayaat) * 100);
  const Daily_Target = Active_Goal?.Daily_Target;
  
  const Total_Today_Seconds = (Today_Minutes * 60) + Today_Seconds;
  const Target_Seconds = (Daily_Target || 0) * 60;
  const Today_Percentage = Target_Seconds > 0 ? Math.min(100, Math.round((Total_Today_Seconds / Target_Seconds) * 100)) : 0;

  const Day_Progress = useMemo<Goal_Progress | null>(() => {
    if (!Active_Goal || Active_Goal.Goal_Type !== "khatm" || !Active_Goal.Target_Duration || !Corpus?.Suwar) return null;

    const Start_Date = new Date(Active_Goal.Start_Date);
    const today = new Date();
    const Day_Number = Math.max(1, Math.ceil((today.getTime() - Start_Date.getTime()) / 86400000));
    const Ayaat_Per_Day = Math.ceil(Total_Ayaat / Active_Goal.Target_Duration);
    const dayStartVerse = (Day_Number - 1) * Ayaat_Per_Day;
    const dayEndVerse = Math.min(Day_Number * Ayaat_Per_Day, Total_Ayaat);

    const findPosition = (Ayah_Count: number) => {
      let remaining = Ayah_Count;
      for (const s of Corpus.Suwar) {
        if (remaining <= s.Number_Of_Ayaat) {
          return { Surah_ID: s.id, Surah_Name: s.English_Name_Transliteration || s.English_Name, Ayah: Math.max(1, remaining) };
        }
        remaining -= s.Number_Of_Ayaat;
      }
      return { Surah_ID: 114, Surah_Name: "An-Nas", Ayah: 6 };
    };

    const Start_Position = findPosition(dayStartVerse + 1);
    const End_Position = findPosition(dayEndVerse);
    const Today_Ayaat_Target = dayEndVerse - dayStartVerse;
    const Completed_Today = Math.max(0, Ayaat_Read - dayStartVerse);
    const Today_Percent = Math.min(100, Math.round((Completed_Today / Today_Ayaat_Target) * 100));

    return {
      Day_Number,
      Total_Days: Active_Goal.Target_Duration,
      Start_Position,
      End_Position,
      Today_Ayaat_Target,
      Completed_Today: Math.min(Completed_Today, Today_Ayaat_Target),
      Today_Percent,
    };
  }, [Active_Goal, Ayaat_Read, Corpus]);

  const handleDeleteGoal = async () => {
    if (Active_Goal && window.confirm("Are you sure you want to delete this goal?")) {
      await Delete_Goal(Active_Goal.id);
    }
  };

  const handleCreateGoal = async (goalData: any) => {
    await Create_Goal(
      goalData.id,
      goalData.Goal_Type,
      goalData.Frequency,
      goalData.Daily_Target,
      goalData.Duration
    );
    setShowCreation(false);
  };

  if (Is_Auth_Loading || goalsLoading || Is_Corpus_Loading) return null;

  if (!User) return null;

  if (Active_Goal) {
    return (
      <Layout>
        <Active
          Active_Goal={Active_Goal}
          Week_Progress={Week_Progress}
          Total_Minutes_Read={Total_Minutes_Read}
          Today_Minutes={Today_Minutes}
          Today_Seconds={Today_Seconds}
          Today_Percentage={Today_Percentage}
          Day_Progress={Day_Progress}
          Overall_Progress={Overall_Progress}
          Ayaat_Read={Ayaat_Read}
          Total_Ayaat={Total_Ayaat}
          Current_Surah={Current_Surah}
          Current_Ayah={Current_Ayah}
          Current_Juz={Current_Juz}
          Current_Page={Current_Page}
          On_Delete_Goal={handleDeleteGoal}
          On_Create_New_Goal={() => setShowCreation(true)}
        />
        {showCreation && (
          <Creation
            On_Create_Goal={handleCreateGoal}
            On_Close={() => setShowCreation(false)}
          />
        )}
      </Layout>
    );
  }

  return (
    <Layout>
      <Creation
        On_Create_Goal={handleCreateGoal}
        On_Close={() => navigate("/Quran")}
      />
    </Layout>
  );
}