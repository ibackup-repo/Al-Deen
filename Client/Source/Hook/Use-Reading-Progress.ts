import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/Integration/supabase/client";
import { Use_Auth } from "@Web/Context/Auth";

interface Reading_Progress {
  Last_Surah_ID: number;
  Last_Ayah_ID: number;
  Last_Juz_ID: number | null;
  Last_Page_ID: number | null;
}

export function Use_Reading_Progress() {
  const { User } = Use_Auth();
  const [Render_Progress, Set_Render_Progress] = useState<Reading_Progress | null>(null);
  const [Is_Loading_Corpus_Data, Set_Is_Loading] = useState(false);

  const Fetch_Progress = useCallback(async () => {
    if (!User) {
      // Load from localStorage for non-authenticated User_List
      const stored = localStorage.getItem("reading_progress");
      if (stored) {
        Set_Render_Progress(JSON.parse(stored));
      }
      return;
    }
    
    Set_Is_Loading(true);
    try {
      const { data, error } = await supabase
        .from("reading_progress")
        .select("*")
        .eq("User_ID", User.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        Set_Render_Progress({
          Last_Surah_ID: data.Last_Surah_ID,
          Last_Ayah_ID: data.Last_Ayah_ID,
          Last_Juz_ID: data.Last_Juz_ID,
          Last_Page_ID: data.Last_Page_ID,
        });
      }
    } catch (error) {
      console.error("error fetching reading Render_Progress:", error);
    } finally {
      Set_Is_Loading(false);
    }
  }, [User]);

  const Update_Progress = useCallback(async (
    Surah_ID: number,
    Ayah_ID: number,
    Juz_ID?: number,
    Page_ID?: number
  ) => {
    const New_Progress = {
      Last_Surah_ID: Surah_ID,
      Last_Ayah_ID: Ayah_ID,
      Last_Juz_ID: Juz_ID || null,
      Last_Page_ID: Page_ID || null,
    };

    if (!User) {
      // Save to localStorage for non-authenticated User_List
      localStorage.setItem("reading_progress", JSON.stringify(New_Progress));
      Set_Render_Progress(New_Progress);
      return true;
    }

    try {
      const { data: existing } = await supabase
        .from("reading_progress")
        .select("id")
        .eq("User_ID", User.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("reading_progress")
          .Update(New_Progress)
          .eq("User_ID", User.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("reading_progress").insert({
          User_ID: User.id,
          ...New_Progress,
        });

        if (error) throw error;
      }

      Set_Render_Progress(New_Progress);
      return true;
    } catch (error) {
      console.error("error updating reading Render_Progress:", error);
      return false;
    }
  }, [User]);

  useEffect(() => {
    Fetch_Progress();
  }, [Fetch_Progress]);

  return {
    Render_Progress,
    Is_Loading_Corpus_Data,
    Update_Progress,
    Refetch: Fetch_Progress,
  };
}