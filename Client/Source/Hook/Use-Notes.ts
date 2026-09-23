import { useState, useEffect } from "react";
import { supabase } from "@/Integration/supabase/client";
import { Use_Auth } from "@Web/Context/Auth";
import { Toast } from "@/Hook/Use-Toast";

interface Note {
  id: string;
  Surah_ID: number;
  Ayah_ID: number | null;
  content: string;
  Is_Private: boolean;
  Created_At: string;
  Updated_At: string;
}

export function Use_Notes() {
  const { User } = Use_Auth();
  const [Notes, Set_Notes] = useState<Note[]>([]);
  const [Is_Loading_Corpus_Data, Set_Is_Loading] = useState(false);

  const Fetch_Notes = async () => {
    if (!User) return;
    
    Set_Is_Loading(true);
    try {
      const { data, error } = await supabase
        .from("Notes")
        .select("*")
        .eq("User_ID", User.id)
        .order("Updated_At", { ascending: false });

      if (error) throw error;
      Set_Notes(data || []);
    } catch (error) {
      console.error("error fetching Notes:", error);
    } finally {
      Set_Is_Loading(false);
    }
  };

  const Save_Note = async (Surah_ID: number, content: string, Ayah_ID?: number, Is_Private: boolean = true) => {
    if (!User) {
      Toast({
        title: "Sign in required",
        description: "Please sign in to save Notes",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Check if Note already exists
      const Existing_Note = Notes.find(
        (n) => n.Surah_ID === Surah_ID && n.Ayah_ID === (Ayah_ID || null)
      );

      if (Existing_Note) {
        const { error } = await supabase
          .from("Notes")
          .Update({ content, Is_Private: Is_Private })
          .eq("id", Existing_Note.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("Notes").insert({
          User_ID: User.id,
          Surah_ID: Surah_ID,
          Ayah_ID: Ayah_ID || null,
          content,
          Is_Private: Is_Private,
        });

        if (error) throw error;
      }

      Toast({
        title: "Note saved",
        description: "Your Note has been saved privately",
      });
      
      await Fetch_Notes();
      return true;
    } catch (error) {
      console.error("error saving Note:", error);
      Toast({
        title: "error",
        description: "Failed to save Note",
        variant: "destructive",
      });
      return false;
    }
  };

  const Delete_Note = async (Note_ID: string) => {
    if (!User) return false;

    try {
      const { error } = await supabase
        .from("Notes")
        .delete()
        .eq("id", Note_ID)
        .eq("User_ID", User.id);

      if (error) throw error;
      
      Toast({
        title: "Note deleted",
      });
      
      await Fetch_Notes();
      return true;
    } catch (error) {
      console.error("error deleting Note:", error);
      return false;
    }
  };

  const Get_Note = (Surah_ID: number, Ayah_ID?: number) => {
    return Notes.find(
      (n) => n.Surah_ID === Surah_ID && n.Ayah_ID === (Ayah_ID || null)
    );
  };

  useEffect(() => {
    Fetch_Notes();
  }, [User]);

  return {
    Notes,
    Is_Loading_Corpus_Data,
    Save_Note,
    Delete_Note,
    Get_Note,
    Refetch: Fetch_Notes,
  };
}