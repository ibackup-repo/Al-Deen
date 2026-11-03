// @Web/Component/Header/Filter.tsx
import { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Filter, Star, Bookmark, Settings, Eye } from "lucide-react";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { Use_App } from "@Web/Context/App";
import { Navigator_Layout } from "@Web/Component/Layout/Utility";
import { Button } from "@Web/Component/UI/Button"; 
import { Container } from "@Web/Component/UI/container";

type Filter_Type = "all" | "Marked" | "favorites" | "custom";

export function Filter_Button() {
  const location = useLocation();
  const { t } = Use_Course_Language();
  const { filter = "all", setFilter } = Use_App(); // Reads active state from global context

  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [Search_Query, Set_Search_Query] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Guard: Only show filter dropdown inside /Language routes
  if (!location.pathname.toLowerCase().startsWith("/language")) {
    return null;
  }

  const Filter_Options = [
    { value: "all" as Filter_Type, label: "All Words", icon: <Eye className="h-4 w-4" /> },
    { value: "Marked" as Filter_Type, label: "Marked Items", icon: <Bookmark className="h-4 w-4" /> },
    { value: "favorites" as Filter_Type, label: "Favorites", icon: <Star className="h-4 w-4" /> },
    { value: "custom" as Filter_Type, label: "My Custom Words", icon: <Settings className="h-4 w-4" /> },
  ];

  const Handle_Pick_Filter = (Selected_Value: Filter_Type) => {
    if (typeof setFilter === "function") {
      setFilter(Selected_Value); // Updates global app state
    } else {
      console.warn("setFilter is not a function in AppContext! Check your App_Provider setup.");
    }
    setIsOpen(false); // Closes the dropdown upon click
  };

  const Render_Header = () => {
    return (
      <Container className="flex items-center justify-center h-7 w-9 rounded-full bg-muted border border-border/40 text-muted-foreground/80 !py-0 !px-0">
        <Filter className="h-4 w-4 stroke-[2.5]" />
      </Container>
    );
  };

  const Render_Trigger_Icon = () => {
    return <Filter className="h-5 w-5" />;
  };

  return (
    <Navigator_Layout
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      isSearching={isSearching}
      setIsSearching={setIsSearching}
      Search_Query={Search_Query}
      Set_Search_Query={Set_Search_Query}
      inputRef={inputRef}
      Button_Label="" 
      Render_Mobile_Header_Left={Render_Header}
      Render_Desktop_Header_Left={Render_Header}
      Show_Go_Back={false}
      Disable_Header_Container={true}
      Closed_Icon={Render_Trigger_Icon()} // Connects directly to the closed state custom icon slot
    >
      <div className="flex flex-col gap-1.5 px-3 pt-2 sm:p-2 w-full relative">
        {Filter_Options.map((opt) => {
          const isActive = filter === opt.value; // Highlights based directly on global context
          return (
            <Button
              key={opt.value}
              type="button"
              variant={isActive ? "default" : "outline"}
              className="justify-start gap-3 text-left w-full h-9 px-4 rounded-full text-sm font-medium transition-colors border border-border/50"
              onClick={() => Handle_Pick_Filter(opt.value)}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </Button>
          );
        })}
      </div>
    </Navigator_Layout>
  );
}