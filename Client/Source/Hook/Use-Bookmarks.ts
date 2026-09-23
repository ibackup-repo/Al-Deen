import { useState, useEffect } from "react";
import { supabase } from "@/Integration/supabase/client";
import { Use_Auth } from "@Web/Context/Auth";
import { Toast } from "@/Hook/Use-Toast";

interface Bookmark {
  id: string;
  Surah_ID: number;
  Ayah_ID: number | null;
  Note: string | null;
  Created_At: string;
}

export function Use_Bookmarks() {
  const { User } = Use_Auth();
  const [Bookmarks, Set_Bookmarks] = useState<Bookmark[]>([]);
  const [Is_Loading_Corpus_Data, Set_Is_Loading] = useState(false);

  const Fetch_Bookmarks = async () => {
    if (!User) return;
    
    Set_Is_Loading(true);
    try {
      const { data, error } = await supabase
        .from("Bookmarks")
        .select("*")
        .eq("User_ID", User.id)
        .order("Created_At", { ascending: false });

      if (error) throw error;
      Set_Bookmarks(data || []);
    } catch (error) {
      console.error("error fetching Bookmarks:", error);
    } finally {
      Set_Is_Loading(false);
    }
  };

  const Add_Bookmark = async (Surah_ID: number, Ayah_ID?: number, Note?: string) => {
    if (!User) {
      Toast({
        title: "Sign in required",
        description: "Please sign in to bookmark Ayaat",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase.from("Bookmarks").insert({
        User_ID: User.id,
        Surah_ID: Surah_ID,
        Ayah_ID: Ayah_ID || null,
        Note: Note || null,
      });

      if (error) throw error;
      
      Toast({
        title: "Bookmark added",
        description: "Ayah has been bookmarked",
      });
      
      await Fetch_Bookmarks();
      return true;
    } catch (error) {
      console.error("error adding bookmark:", error);
      Toast({
        title: "error",
        description: "Failed to add bookmark",
        variant: "destructive",
      });
      return false;
    }
  };

  const Remove_Bookmark = async (Bookmark_ID: string) => {
    if (!User) return false;

    try {
      const { error } = await supabase
        .from("Bookmarks")
        .delete()
        .eq("id", Bookmark_ID)
        .eq("User_ID", User.id);

      if (error) throw error;
      
      Toast({
        title: "Bookmark removed",
      });
      
      await Fetch_Bookmarks();
      return true;
    } catch (error) {
      console.error("error removing bookmark:", error);
      return false;
    }
  };

  const Is_Bookmarked = (Surah_ID: number, Ayah_ID?: number) => {
    return Bookmarks.some(
      (b) => b.Surah_ID === Surah_ID && (Ayah_ID ? b.Ayah_ID === Ayah_ID : true)
    );
  };

  const Get_Bookmark_ID = (Surah_ID: number, Ayah_ID?: number) => {
    const bookmark = Bookmarks.find(
      (b) => b.Surah_ID === Surah_ID && (Ayah_ID ? b.Ayah_ID === Ayah_ID : true)
    );
    return bookmark?.id;
  };

  useEffect(() => {
    Fetch_Bookmarks();
  }, [User]);

  return {
    Bookmarks,
    Is_Loading_Corpus_Data,
    Add_Bookmark,
    Remove_Bookmark,
    Is_Bookmarked,
    Get_Bookmark_ID,
    Refetch: Fetch_Bookmarks,
  };
}