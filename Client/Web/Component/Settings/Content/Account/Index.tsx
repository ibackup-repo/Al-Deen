// Component/Settings/Content/Account/Index.tsx
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@Web/Component/UI/Button";
import { Container } from "@Web/Component/UI/Container";
import { Use_App } from "@Web/Context/App";
import { Use_Bookmarks } from "@/Hook/Use-Bookmarks";
import { Use_Reading_Progress } from "@/Hook/Use-Reading-Progress";
import { Use_Notes } from "@/Hook/Use-Notes";
import { supabase } from "@/Integration/supabase/client";
import { toast as Toast } from "sonner";
import { User } from "lucide-react";
import { Credential_Modal } from "./Modal/Index";
import { Profile_Tab } from "./Tab/Profile";
import { Bookmarks_Tab } from "./Tab/Bookmark";
import { Notes_Tab } from "./Tab/Note";
import { History_Tab } from "./Tab/History";
import type { Credential_Modal_Type, Account_Subcategory } from "./Types";

const Backend_Base_URL = "https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev";

async function Fetch_Quran_Corpus_From_Backend() {
  const response = await fetch(`${Backend_Base_URL}/api/Quran-Corpus`);
  if (!response.ok) throw new Error("Failed to load unified Quran Corpus data map");
  return response.json();
}

interface Account_Section_Properties {
  User: any;
  Display_Name: string;
  Initials: string;
  Handle_Sign_Out: () => void;
  navigate: (path: string) => void;
  Set_Settings_Sidebar_Open: (Open: boolean) => void;
  Active_Subcategory: Account_Subcategory;
}

export function Account_Section({
  User,
  Display_Name,
  Initials,
  Handle_Sign_Out,
  navigate,
  Set_Settings_Sidebar_Open,
  Active_Subcategory,
}: Account_Section_Properties) {
  const { Bookmarks, Is_Loading_Corpus_Data: Is_Bookmarks_Loading, Remove_Bookmark } = Use_Bookmarks();
  const { Render_Progress } = Use_Reading_Progress();
  const { Notes, Is_Loading_Corpus_Data: Is_Notes_Loading, Delete_Note } = Use_Notes();
  const {
    Set_Theme, Set_Quran_Font, Set_Font_Size, Set_Translation_Font_Size,
    Set_Hover_Translation, Set_Hover_Recitation,
    Set_Inline_Translation, Set_Ayah_Translation,
    Set_Selected_Translations, Set_Current_Language, Set_Show_Arabic_Text,
  } = Use_App();

  const [Is_Deleting_Account, Set_Is_Deleting_Account] = useState(false);
  const [Active_Modal, Set_Active_Modal] = useState<Credential_Modal_Type>(null);

  // Ingest structural data maps over the unified query cache layer
  const { data: Corpus } = useQuery({
    queryKey: ["Quran_Corpus_Backend"],
    queryFn: Fetch_Quran_Corpus_From_Backend,
    staleTime: 1000 * 60 * 30,
    enabled: !!User && !!Render_Progress?.Last_Surah_ID,
  });

  const Surah_List = useMemo(() => Corpus?.Suwar || [], [Corpus]);

  const Continue_Reading_Surah = useMemo(() => {
    if (!Render_Progress?.Last_Surah_ID || Surah_List.length === 0) return null;
    return Surah_List.find((s: any) => s.id === Render_Progress.Last_Surah_ID) || null;
  }, [Render_Progress?.Last_Surah_ID, Surah_List]);

  if (!User) {
    return (
      <Container className="text-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm">Sign in to access your account.</p>
        <Button onClick={() => { navigate("/Sign-In"); Set_Settings_Sidebar_Open(false); }}>
          Sign In
        </Button>
      </Container>
    );
  }

  const Handle_Reset_Settings = () => {
    Set_Theme("auto");
    Set_Quran_Font("Uthmani");
    Set_Font_Size(5);
    Set_Translation_Font_Size(3);
    Set_Hover_Translation(true);
    Set_Hover_Recitation(true);
    Set_Inline_Translation(false);
    Set_Ayah_Translation(true);
    Set_Selected_Translations(["Translation"]);
    Set_Current_Language("en");
    Set_Show_Arabic_Text(true);
    Toast.success("Settings reset to defaults");
  };

  const Handle_Delete_Account = async () => {
    Set_Is_Deleting_Account(true);
    try {
      await Promise.all([
        supabase.from("Bookmarks").delete().eq("User_ID", User.id),
        supabase.from("Notes").delete().eq("User_ID", User.id),
        supabase.from("reading_progress").delete().eq("User_ID", User.id),
        supabase.from("goal_progress").delete().eq("User_ID", User.id),
        supabase.from("quran_goals").delete().eq("User_ID", User.id),
        supabase.from("profiles").delete().eq("User_ID", User.id),
      ]);
      await supabase.auth.Sign_Out();
      Toast.success("Account deleted successfully");
      Set_Settings_Sidebar_Open(false);
      navigate("/");
    } catch {
      Toast.error("Failed to delete account");
    } finally {
      Set_Is_Deleting_Account(false);
    }
  };

  const Render_Active_Content = () => {
    switch (Active_Subcategory) {
      case "profile":
        return (
          <Profile_Tab
            navigate={navigate}
            Set_Settings_Sidebar_Open={Set_Settings_Sidebar_Open}
            On_Open_Modal={Set_Active_Modal}
            On_Reset_Settings={Handle_Reset_Settings}
            On_Sign_Out={Handle_Sign_Out}
            On_Delete_Account={Handle_Delete_Account}
            Is_Deleting_Account={Is_Deleting_Account}
          />
        );
      case "Bookmarks":
        return (
          <Bookmarks_Tab
            Bookmarks={Bookmarks}
            Is_Loading_Corpus_Data={Is_Bookmarks_Loading}
            Remove_Bookmark={Remove_Bookmark}
            Set_Settings_Sidebar_Open={Set_Settings_Sidebar_Open}
          />
        );
      case "Notes":
        return (
          <Notes_Tab
            Notes={Notes}
            Is_Loading_Corpus_Data={Is_Notes_Loading}
            Delete_Note={Delete_Note}
            Set_Settings_Sidebar_Open={Set_Settings_Sidebar_Open}
          />
        );
      case "History":
        return (
          <History_Tab
            Continue_Reading_Surah={Continue_Reading_Surah}
            Render_Progress={Render_Progress}
            Set_Settings_Sidebar_Open={Set_Settings_Sidebar_Open}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Modals */}
      <Credential_Modal
        Open={Active_Modal === "Password_Val"}
        On_Close={() => Set_Active_Modal(null)}
        type="Password_Val"
        User_Email={User.Email_Address_Input}
      />
      <Credential_Modal
        Open={Active_Modal === "Email_Address_Input"}
        On_Close={() => Set_Active_Modal(null)}
        type="Email_Address_Input"
        User_Email={User.Email_Address_Input}
      />

      {/* Profile Card - responsive padding */}
      <Container className="!p-3 md:!p-4 flex items-center gap-3 md:gap-4">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm md:text-base">
          {Initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate text-sm md:text-base">{Display_Name}</p>
          <p className="text-xs text-muted-foreground truncate">{User.Email_Address_Input}</p>
        </div>
      </Container>

      {/* Active Subcategory content */}
      {Render_Active_Content()}
    </div>
  );
}