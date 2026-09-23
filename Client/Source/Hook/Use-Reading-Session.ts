import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/Integration/supabase/client";
import { Use_Auth } from "@Web/Context/Auth";
import { Use_App } from "@Web/Context/App";

export function Use_Reading_Session() {
  const { User } = Use_Auth();
  const { Reading_Idle_Timeout, Reading_Save_Interval, Reading_Tracking_Enabled } = Use_App();
  
  const [Session_Minutes, Set_Session_Minutes] = useState(0);
  const [Session_Seconds, Set_Session_Seconds] = useState(0);
  const [Is_Active, Set_Is_Active] = useState(false);
  const Start_Time_Reference = useRef<number | null>(null);
  const Last_Activity_Reference = useRef<number>(Date.now());
  const Accumulated_Seconds_Reference = useRef(0);
  
  const Idle_Timeout = (Reading_Idle_Timeout || 60) * 1000;
  const Save_Interval = (Reading_Save_Interval || 10) * 1000;
  const Is_Tracking_Enabled = Reading_Tracking_Enabled !== false;

  const Mark_Activity = useCallback(() => {
    Last_Activity_Reference.current = Date.now();
    if (!Is_Active && Is_Tracking_Enabled) Set_Is_Active(true);
  }, [Is_Active, Is_Tracking_Enabled]);

  const Start_Session = useCallback(() => {
    if (!Is_Tracking_Enabled) return;
    
    Start_Time_Reference.current = Date.now();
    Accumulated_Seconds_Reference.current = 0;
    Set_Is_Active(true);
    Set_Session_Minutes(0);
    Set_Session_Seconds(0);
  }, [Is_Tracking_Enabled]);

  const Stop_Session = useCallback(async (): Promise<number> => {
    if (!Start_Time_Reference.current || !Is_Tracking_Enabled) return 0;

    const Elapsed_Seconds = Accumulated_Seconds_Reference.current + (Is_Active ? (Date.now() - Start_Time_Reference.current) / 1000 : 0);
    const Total_Seconds = Math.round(Elapsed_Seconds);
    
    Start_Time_Reference.current = null;
    Set_Is_Active(false);
    Set_Session_Minutes(0);
    Set_Session_Seconds(0);
    Accumulated_Seconds_Reference.current = 0;

    return Total_Seconds;
  }, [Is_Active, Is_Tracking_Enabled]);

  const Save_Seconds_To_Goal = useCallback(async (Goal_ID: string, Seconds: number) => {
    if (!User || Seconds <= 0 || !Is_Tracking_Enabled) return;

    const today = new Date().toISOString().split("T")[0];

    try {
      const { data: existing, error: fetchError } = await supabase
        .from("goal_progress")
        .select("*")
        .eq("Goal_ID", Goal_ID)
        .eq("date", today)
        .maybeSingle();

      if (fetchError) {
        console.error("error fetching existing Render_Progress:", fetchError);
        return;
      }

      const Current_Seconds = existing 
        ? ((existing.Minutes_Read || 0) * 60) + (existing.Seconds_Read || 0)
        : 0;
      
      const New_Total_Seconds = Current_Seconds + Seconds;
      const New_Minutes = Math.floor(New_Total_Seconds / 60);
      const New_Seconds = New_Total_Seconds % 60;

      if (existing) {
        const { error: updateError } = await supabase
          .from("goal_progress")
          .Update({
            Minutes_Read: New_Minutes,
            Seconds_Read: New_Seconds,
            completed: true,
          })
          .eq("id", existing.id);

        if (updateError) {
          console.error("error updating goal Render_Progress:", updateError);
        }
      } else {
        const { error: insertError } = await supabase
          .from("goal_progress")
          .insert({
            Goal_ID: Goal_ID,
            User_ID: User.id,
            date: today,
            completed: true,
            Minutes_Read: New_Minutes,
            Seconds_Read: New_Seconds,
          });

        if (insertError) {
          console.error("error inserting goal Render_Progress:", insertError);
        }
      }
    } catch (error) {
      console.error("error saving reading Seconds:", error);
    }
  }, [User, Is_Tracking_Enabled]);

  const Save_Minutes_To_Goal = useCallback(async (Goal_ID: string, Minutes: number) => {
    await Save_Seconds_To_Goal(Goal_ID, Minutes * 60);
  }, [Save_Seconds_To_Goal]);

  useEffect(() => {
    if (!Start_Time_Reference.current || !Is_Tracking_Enabled) return;

    const interval = setInterval(() => {
      const Now = Date.now();
      const Idle_Time = Now - Last_Activity_Reference.current;

      if (Idle_Time > Idle_Timeout) {
        if (Is_Active) {
          Accumulated_Seconds_Reference.current += (Now - (Start_Time_Reference.current || Now)) / 1000;
          Start_Time_Reference.current = Now;
          Set_Is_Active(false);
        }
        return;
      }

      if (!Is_Active) {
        Start_Time_Reference.current = Now;
        Set_Is_Active(true);
      }

      const Total_Seconds = Accumulated_Seconds_Reference.current + (Now - (Start_Time_Reference.current || Now)) / 1000;
      Set_Session_Minutes(Math.floor(Total_Seconds / 60));
      Set_Session_Seconds(Math.floor(Total_Seconds % 60));
    }, Save_Interval);

    return () => clearInterval(interval);
  }, [Is_Active, Idle_Timeout, Save_Interval, Is_Tracking_Enabled]);

  useEffect(() => {
    if (!Is_Tracking_Enabled) return;

    const Handle_Visibility_Change = () => {
      if (document.hidden) {
        if (Is_Active && Start_Time_Reference.current) {
          Accumulated_Seconds_Reference.current += (Date.now() - Start_Time_Reference.current) / 1000;
          Start_Time_Reference.current = Date.now();
          Set_Is_Active(false);
        }
      } else {
        Mark_Activity();
        if (Start_Time_Reference.current) {
          Start_Time_Reference.current = Date.now();
          Set_Is_Active(true);
        }
      }
    };

    document.addEventListener("visibilitychange", Handle_Visibility_Change);
    window.addEventListener("scroll", Mark_Activity);
    window.addEventListener("mousemove", Mark_Activity);
    window.addEventListener("keydown", Mark_Activity);
    window.addEventListener("click", Mark_Activity);
    window.addEventListener("touchstart", Mark_Activity);

    return () => {
      document.removeEventListener("visibilitychange", Handle_Visibility_Change);
      window.removeEventListener("scroll", Mark_Activity);
      window.removeEventListener("mousemove", Mark_Activity);
      window.removeEventListener("keydown", Mark_Activity);
      window.removeEventListener("click", Mark_Activity);
      window.removeEventListener("touchstart", Mark_Activity);
    };
  }, [Is_Active, Mark_Activity, Is_Tracking_Enabled]);

  return {
    Session_Minutes,
    Session_Seconds,
    Is_Active,
    Start_Session,
    Stop_Session,
    Save_Minutes_To_Goal,
    Save_Seconds_To_Goal,
    Mark_Activity,
    Is_Tracking_Enabled,
  };
}