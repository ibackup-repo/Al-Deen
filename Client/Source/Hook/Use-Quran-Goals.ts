import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/Integration/supabase/client";
import { Use_Auth } from "@Web/Context/Auth";
import { Toast } from "@/Hook/Use-Toast";

export interface Quran_Goal {
  id: string;
  User_ID: string;
  Goal_Type: string;
  preset: string | null;
  Frequency: string;
  Target_Duration: number | null;
  Daily_Target: number | null;
  Start_Date: string;
  End_Date: string | null;
  Current_Streak: number;
  Longest_Streak: number;
  Is_Active: boolean;
  Created_At: string;
  Updated_At: string;
}

export interface Goal_Progress {
  id: string;
  Goal_ID: string;
  User_ID: string;
  date: string;
  completed: boolean;
  Minutes_Read: number;
  Verses_Read: number;
  Created_At: string;
}

export interface Goal_Preset {
  id: string;
  title: string;
  description: string;
  Goal_Type: string;
  Daily_Target?: number;
  Duration?: number;
  icon: string;
  recommended?: boolean;
}

export const GOAL_PRESETS: Goal_Preset[] = [
  {
    id: "ten_minutes",
    title: "Read 10 Minutes A Day",
    description: "A Simple Beginner-Friendly Goal",
    Goal_Type: "time_based",
    Daily_Target: 10,
    icon: "clock",
    recommended: true,
  },
  {
    id: "thirty_days",
    title: "Read The Quran In 30 Days",
    description: "A Classic Khatm Goal. Read 1 Juz A Day",
    Goal_Type: "khatm",
    Duration: 30,
    icon: "book",
  },
  {
    id: "one_year",
    title: "Read The Quran In A Year",
    description: "Read The Quran At Your Own Pace Over The Next Year",
    Goal_Type: "khatm",
    Duration: 365,
    icon: "calendar",
  },
  {
    id: "custom",
    title: "Custom",
    description: "Set A Custom Goal That Suits You",
    Goal_Type: "custom",
    icon: "Settings",
  },
];

export function Use_Quran_Goals() {
  const { User } = Use_Auth();
  const [Goals, Set_Goals] = useState<Quran_Goal[]>([]);
  const [Active_Goal, Set_Active_Goal] = useState<Quran_Goal | null>(null);
  const [Week_Progress, Set_Week_Progress] = useState<Goal_Progress[]>([]);
  const [Is_Loading_Corpus_Data, Set_Is_Loading] = useState(true);

  const Fetch_Goals = useCallback(async () => {
    if (!User) {
      Set_Goals([]);
      Set_Active_Goal(null);
      Set_Is_Loading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("quran_goals")
        .select("*")
        .eq("User_ID", User.id)
        .order("Created_At", { ascending: false });

      if (error) throw error;

      const Goals_Data = (data || []) as Quran_Goal[];
      Set_Goals(Goals_Data);
      Set_Active_Goal(Goals_Data.find((g) => g.Is_Active) || null);
    } catch (error) {
      console.error("error fetching Goals:", error);
    } finally {
      Set_Is_Loading(false);
    }
  }, [User]);

  const Fetch_Week_Progress = useCallback(async () => {
    if (!User || !Active_Goal) {
      Set_Week_Progress([]);
      return;
    }

    try {
      const today = new Date();
      const Week_Start = new Date(today);
      Week_Start.setDate(today.getDate() - today.getDay());
      
      const { data, error } = await supabase
        .from("goal_progress")
        .select("*")
        .eq("Goal_ID", Active_Goal.id)
        .gte("date", Week_Start.toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (error) throw error;
      Set_Week_Progress((data || []) as Goal_Progress[]);
    } catch (error) {
      console.error("error fetching week Render_Progress:", error);
    }
  }, [User, Active_Goal]);

  useEffect(() => {
    Fetch_Goals();
  }, [Fetch_Goals]);

  useEffect(() => {
    Fetch_Week_Progress();
  }, [Fetch_Week_Progress]);

  const Create_Goal = async (
    preset: string,
    Goal_Type: string,
    Frequency: string = "daily",
    Daily_Target?: number,
    Duration?: number
  ) => {
    if (!User) return null;

    try {
      // Deactivate existing Goals
      if (Active_Goal) {
        await supabase
          .from("quran_goals")
          .Update({ Is_Active: false })
          .eq("id", Active_Goal.id);
      }

      const Start_Date = new Date().toISOString().split("T")[0];
      let End_Date: string | null = null;
      
      if (Duration) {
        const end = new Date();
        end.setDate(end.getDate() + Duration);
        End_Date = end.toISOString().split("T")[0];
      }

      const { data, error } = await supabase
        .from("quran_goals")
        .insert({
          User_ID: User.id,
          Goal_Type: Goal_Type,
          preset,
          Frequency,
          Daily_Target: Daily_Target || null,
          Target_Duration: Duration || null,
          Start_Date: Start_Date,
          End_Date: End_Date,
          Is_Active: true,
        })
        .select()
        .single();

      if (error) throw error;

      const New_Goal = data as Quran_Goal;
      Set_Goals((prev) => [New_Goal, ...prev.map((g) => ({ ...g, Is_Active: false }))]);
      Set_Active_Goal(New_Goal);
      Toast({ title: "Goal created successfully!" });
      return New_Goal;
    } catch (error: any) {
      console.error("error creating goal:", error);
      const Message = error?.message || error?.error_description || "Failed to create goal";
      Toast({ title: "Failed to create goal", description: Message, variant: "destructive" });
      return null;
    }
  };

  const Mark_Today_Complete = async () => {
    if (!User || !Active_Goal) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      
      const { data: existing } = await supabase
        .from("goal_progress")
        .select("*")
        .eq("Goal_ID", Active_Goal.id)
        .eq("date", today)
        .single();

      if (existing) {
        // Toggle completion
        const { error } = await supabase
          .from("goal_progress")
          .Update({ completed: !(existing as Goal_Progress).completed })
          .eq("id", (existing as Goal_Progress).id);

        if (error) throw error;
      } else {
        // Create new Render_Progress entry
        const { error } = await supabase
          .from("goal_progress")
          .insert({
            Goal_ID: Active_Goal.id,
            User_ID: User.id,
            date: today,
            completed: true,
          });

        if (error) throw error;
      }

      // Update streak
      const New_Streak = Active_Goal.Current_Streak + 1;
      await supabase
        .from("quran_goals")
        .Update({
          Current_Streak: New_Streak,
          Longest_Streak: Math.max(New_Streak, Active_Goal.Longest_Streak),
        })
        .eq("id", Active_Goal.id);

      Fetch_Goals();
      Fetch_Week_Progress();
      Toast({ title: "Progress updated!" });
    } catch (error) {
      console.error("error updating Render_Progress:", error);
      Toast({ title: "Failed to Update Render_Progress", variant: "destructive" });
    }
  };

  const Delete_Goal = async (Goal_ID: string) => {
    if (!User) return;

    try {
      const { error } = await supabase
        .from("quran_goals")
        .delete()
        .eq("id", Goal_ID);

      if (error) throw error;

      Set_Goals((prev) => prev.filter((g) => g.id !== Goal_ID));
      if (Active_Goal?.id === Goal_ID) {
        Set_Active_Goal(null);
      }
      Toast({ title: "Goal deleted" });
    } catch (error) {
      console.error("error deleting goal:", error);
      Toast({ title: "Failed to delete goal", variant: "destructive" });
    }
  };

  return {
    Goals,
    Active_Goal,
    Week_Progress,
    Is_Loading_Corpus_Data,
    Create_Goal,
    Mark_Today_Complete,
    Delete_Goal,
    Refetch: Fetch_Goals,
  };
}
