import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Home, BookOpen, BookText, MessageSquare } from "lucide-react";
import { Use_App } from "@Web/Context/App";
import { Use_Translation } from "@/Hook/Use-Translation";
import { Use_Is_Mobile } from "@/Hook/Use-Mobile";
import { Desktop } from "./Layout/Desktop";
import { Mobile } from "./Layout/Mobile";
import { Search_By_Category } from "./Utility";
import type { Search_Category, Search_Result } from "./Types";

export function Spotlight_Search() {
  const { t, Is_RTL } = Use_Translation();
  const { Is_Search_Sidebar_Open, Set_Search_Sidebar_Open } = Use_App();
  const Is_Mobile = Use_Is_Mobile();
  const navigate = useNavigate();
  
  const [query, Set_Query] = useState("");
  const [Category, Set_Category] = useState<Search_Category>("Pages");
  const [Results, Set_Results] = useState<Search_Result[]>([]);
  const [Selected_Index, Set_Selected_Index] = useState(0);
  const Input_Reference = useRef<HTMLInputElement>(null);

  const Nav_Links = useMemo(() => [
    { name: t.nav.home, path: "/", icon: Home },
    { name: t.nav.Quran, path: "/Quran", icon: BookOpen },
    { name: t.nav.Hadith, path: "/Hadith", icon: BookText },
    { name: t.nav.duas, path: "/Aid/Dua", icon: MessageSquare },
    { name: "Prayer Times", path: "/Aid/Prayers", icon: Home },
    { name: "Tajweed", path: "/Aid/Arabic/Tajweed", icon: BookOpen },
    { name: "Goals", path: "/Quran/Goal", icon: Home },
  ], [t.nav]);

  const Support_Links = useMemo(() => [
    { name: t.nav.feedback, path: "/Feedback", icon: MessageSquare },
  ], [t.nav]);

  // Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const Handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        Set_Search_Sidebar_Open(!Is_Search_Sidebar_Open);
      }
    };
    document.addEventListener("keydown", Handler);
    return () => document.removeEventListener("keydown", Handler);
  }, [Is_Search_Sidebar_Open, Set_Search_Sidebar_Open]);

  useEffect(() => {
    if (Is_Search_Sidebar_Open && Input_Reference.current) {
      setTimeout(() => Input_Reference.current?.focus(), 100);
    }
  }, [Is_Search_Sidebar_Open]);

  // Search logic
  useEffect(() => {
    if (query.length === 0) {
      Set_Results([]);
      return;
    }
    const Search_Results = Search_By_Category(query, Category, Nav_Links, Support_Links);
    Set_Results(Search_Results);
    Set_Selected_Index(0);
  }, [query, Category, Nav_Links, Support_Links]);

  const Handle_Search = useCallback(() => {
    if (query.trim()) {
      navigate(`/Search?q=${encodeURIComponent(query.trim())}&Category=${Category}`);
      Handle_Close();
    }
  }, [query, Category, navigate]);

  const Handle_Result_Click = useCallback((path: string) => {
    navigate(path);
    Handle_Close();
  }, [navigate]);

  const Handle_Link_Click = useCallback((path: string) => {
    navigate(path);
    Handle_Close();
  }, [navigate]);

  const Handle_See_All = useCallback(() => {
    Handle_Search();
  }, [Handle_Search]);

  const Handle_Close = useCallback(() => {
    Set_Search_Sidebar_Open(false);
    Set_Query("");
    Set_Category("Pages");
  }, [Set_Search_Sidebar_Open]);

  const Handle_Key_Down = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      Set_Selected_Index(prev => Math.min(prev + 1, Results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      Set_Selected_Index(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      if (Results.length > 0 && Selected_Index >= 0) {
        Handle_Result_Click(Results[Selected_Index].path);
      } else {
        Handle_Search();
      }
    } else if (e.key === "Escape") {
      Handle_Close();
    }
  };

  const Shared_Properties = {
    query,
    Set_Query,
    Category,
    Set_Category,
    Results,
    On_Search: Handle_Search,
    On_Result_Click: Handle_Result_Click,
    On_See_All: Handle_See_All,
    Input_Reference,
    onKeyDown: Handle_Key_Down,
  };

  if (Is_Mobile) {
    return (
      <Mobile
        Open={Is_Search_Sidebar_Open}
        On_Close={Handle_Close}
        {...Shared_Properties}
        On_Link_Click={Handle_Link_Click}
        Nav_Links={Nav_Links}
        Support_Links={Support_Links}
        Is_RTL={Is_RTL}
      />
    );
  }

  return (
    <Desktop
      Open={Is_Search_Sidebar_Open}
      On_Close={Handle_Close}
      {...Shared_Properties}
      Selected_Index={Selected_Index}
    />
  );
}
export default Spotlight_Search;
