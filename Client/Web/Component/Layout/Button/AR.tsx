// @Web/Component/Word/Buttons/Recall-Queue-Button.tsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Clock, Play, Trash2, Layers } from "lucide-react";
import { Use_App } from "@Web/Context/App";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { Navigator_Layout } from "@Web/Component/Layout/Utility";
import { Button } from "@Web/Component/UI/Button";
import { Container } from "@Web/Component/UI/container";
import { SlidingPill } from "@Web/Component/UI/Sliding-Pill";

type Tab_Mode = "active" | "recall";

export function Recall_Queue_Button() {
  const navigate = useNavigate();
  const { t } = Use_Course_Language();
  const { 
    Recall_Queue = [], 
    Remove_Recall_Item, 
    Set_Active_Recall, 
    Browse_Path, 
    Set_Recall_Return_Path 
  } = Use_App();

  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [Search_Query, Set_Search_Query] = useState("");
  const [mode, setMode] = useState<Tab_Mode>("recall");
  const [Has_Seen_Notification, Set_Has_Seen_Notification] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [, Set_Tick] = useState(0);
  useEffect(() => {
    if (!isOpen) return;
    const id = setInterval(() => Set_Tick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [isOpen]);

  const now = Date.now();
  
  const Is_Ready_Item = (item: any) => {
    if (typeof item.Ready_At !== "number") return false;
    return now >= item.Ready_At;
  };

  const Active_Items = Recall_Queue.filter((i) => !Is_Ready_Item(i)).sort((a, b) => a.Ready_At - b.Ready_At);
  const Ready_Items = Recall_Queue.filter((i) => Is_Ready_Item(i)).sort((a, b) => a.Ready_At - b.Ready_At);
  const Has_Ready = Ready_Items.length > 0;
  const Has_Active = Active_Items.length > 0;

  // Set notification as seen when the layout panel gets opened
  useEffect(() => {
    if (isOpen) {
      Set_Has_Seen_Notification(true);
    }
  }, [isOpen]);

  // If the user clears their queue, reset tracking so future items trigger a new notification
  useEffect(() => {
    if (!Has_Ready) {
      Set_Has_Seen_Notification(false);
    }
  }, [Has_Ready]);

  useEffect(() => {
    if (isOpen) {
      if (Ready_Items.length > 0) {
        setMode("recall");
      } else if (Active_Items.length > 0) {
        setMode("active");
      }
    }
  }, [isOpen, Ready_Items.length, Active_Items.length]);

  const Target_Source = mode === "active" ? Active_Items : Ready_Items;

  const Filtered_Items = Target_Source.filter((item) =>
    !Search_Query || item.title?.toLowerCase().includes(Search_Query.toLowerCase().trim())
  );

  const Handle_Open_Item = (item: any) => {
    setIsOpen(false);
    setIsSearching(false);
    Set_Search_Query("");
    Set_Recall_Return_Path(Browse_Path);
    Set_Active_Recall({
      Scope: item.Scope,
      Category_ID: item.Category_ID,
      Subcategory_ID: item.Subcategory_ID,
      Word_ID: item.Word_ID,
    });
    navigate("/Recall");
  };

  const Format_Countdown = (targetTime: number) => {
    const diff = targetTime - Date.now();
    if (diff <= 0) return "Ready";
    const mins = Math.ceil(diff / 60_000);
    if (mins < 60) return `${mins}m left`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h left`;
    return `${Math.floor(hrs / 24)}d left`;
  };

  const Pill_Options = [
    { value: "active" as Tab_Mode, label: "", icon: <Clock className="h-4 w-4 stroke-[2.5]" /> },
    { value: "recall" as Tab_Mode, label: "", icon: <Brain className="h-4 w-4 stroke-[2.5]" /> }
  ];

  const Render_Sliding_Pill = () => {
    const Container_Classes = "flex items-center justify-center h-7 w-9 rounded-full bg-muted border border-border/40 text-muted-foreground/80 !py-0 !px-0";

    if (!Has_Active) {
      return (
        <Container className={Container_Classes}>
          <Brain className="h-4 w-4 stroke-[2.5]" />
        </Container>
      );
    }
    if (!Has_Ready) {
      return (
        <Container className={Container_Classes}>
          <Clock className="h-4 w-4 stroke-[2.5]" />
        </Container>
      );
    }
    return (
      <SlidingPill
        options={Pill_Options}
        selectedValue={mode}
        onChange={setMode}
        width="w-20"
        height="h-7"
      />
    );
  };

  const Show_Notification_Badge = Has_Ready && !Has_Seen_Notification;

  // Custom trigger icon with conditional notification badge, perfectly matched 
  // to render cleanly directly inside the Navigator_Layout Closed_Icon wrapper
  const Closed_Icon = (
    <div className="relative h-5 w-5 flex items-center justify-center">
      <Layers className="h-5 w-5" />
      {Show_Notification_Badge && (
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-foreground text-background flex items-center justify-center ring-1 ring-background">
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="4" 
            strokeLinecap="round" 
            className="h-2 w-2"
          >
            <line x1="12" y1="5" x2="12" y2="14" />
            <line x1="12" y1="19" x2="12" y2="19" />
          </svg>
        </span>
      )}
    </div>
  );

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
      Render_Mobile_Header_Left={Render_Sliding_Pill}
      Render_Desktop_Header_Left={Render_Sliding_Pill}
      Show_Go_Back={false}
      Disable_Header_Container={true}
      Closed_Icon={Closed_Icon} // <-- Clean, unified trigger element config
    >
      <div className="flex flex-col gap-1.5 px-3 pt-2 sm:p-2 w-full relative">
        {Filtered_Items.map((item) => (
          <div 
            key={item.id} 
            className="flex items-center justify-between gap-2 p-2 pl-4 pr-3 rounded-full hover:bg-muted/40 border border-transparent transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Clock className="h-3 w-3 opacity-70" />
                <span>{mode === "recall" ? "Ready" : Format_Countdown(item.Ready_At)}</span>
                <span className="opacity-40">·</span>
                <span className="opacity-80">★ {item.Last_Rating ?? 0}</span>
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {mode === "recall" && (
                <Button 
                  size="icon" 
                  variant="secondary"
                  className="h-8 w-8 rounded-full bg-foreground text-background hover:bg-foreground/90"
                  onClick={() => Handle_Open_Item(item)}
                  aria-label={t("startRecall") || "Start recall"}
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                </Button>
              )}
              <Button 
                size="icon" 
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                onClick={() => Remove_Recall_Item(item.id)}
                aria-label={t("deleteItem") || "Delete"}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}

        {Filtered_Items.length === 0 && (
          <p className="text-xs text-muted-foreground p-8 text-center">
            {mode === "active" 
              ? (t("noActive") || "Nothing cooling down.") 
              : (t("noReady") || "Nothing to recall yet.")}
          </p>
        )}
      </div>
    </Navigator_Layout>
  );
}