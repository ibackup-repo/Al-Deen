// @Web/Component/Layout/Header/Navigator/Utility.tsx
import { useEffect, useRef, useState, ReactNode } from "react";
import { ChevronDown, Search, X, ArrowLeft } from "lucide-react";
import { Button } from "@Web/Component/UI/Button";
import { Container } from "@Web/Component/UI/Container";
import { Class_Names } from "@/Library/Utility";

export function ID_From_Name(name: string): string {
  return name.replace(/\s+/g, "-");
}

export function Name_From_ID(id: string): string {
  return id.replace(/-/g, " ");
}

interface Navigator_Layout_Properties {
  Is_Open: boolean;
  setIsOpen: (Open: boolean) => void;
  Is_Searching: boolean;
  Set_Is_Searching: (searching: boolean) => void;
  Search_Query: string;
  Set_Search_Query: (query: string) => void;
  Button_Label: string;
  Input_Reference?: React.RefObject<HTMLInputElement | null>;
  Render_Mobile_Header_Left: () => ReactNode;
  Render_Desktop_Header_Left: () => ReactNode;
  Show_Go_Back?: boolean;
  onGoBack?: () => void;
  children: ReactNode;
}

export function Navigator_Layout({
  Is_Open,
  setIsOpen,
  Is_Searching,
  Set_Is_Searching,
  Search_Query,
  Set_Search_Query,
  Button_Label,
  Input_Reference,
  Render_Mobile_Header_Left,
  Render_Desktop_Header_Left,
  Show_Go_Back = false,
  onGoBack,
  children,
}: Navigator_Layout_Properties) {
  const Dropdown_Reference = useRef<HTMLDivElement>(null);
  const Scroll_Reference = useRef<HTMLDivElement>(null);
  const Sentinel_Reference = useRef<HTMLSpanElement>(null);
  const [Is_Scrolled, Set_Is_Scrolled] = useState(false);

  const Close_All = () => {
    setIsOpen(false);
    Set_Is_Searching(false);
    Set_Search_Query("");
    Set_Is_Scrolled(false);
  };

  useEffect(() => {
    const Container = Scroll_Reference.current;
    if (!Container || !Is_Open) return;

    const Check_Scroll_Position = () => {
      const sentinel = Sentinel_Reference.current;
      if (!sentinel) return;
      
      const Has_Moved_Offset = sentinel.offsetTop < Container.scrollTop;
      Set_Is_Scrolled(Container.scrollTop > 0 || Has_Moved_Offset);
    };

    Container.addEventListener("scroll", Check_Scroll_Position, { passive: true });
    
    const Sync_Timeout = setTimeout(Check_Scroll_Position, 0);

    return () => {
      Container.removeEventListener("scroll", Check_Scroll_Position);
      clearTimeout(Sync_Timeout);
    };
  }, [Is_Open]);

  useEffect(() => {
    if (!Is_Open) {
      Set_Is_Scrolled(false);
    }
  }, [Is_Open]);

  useEffect(() => {
    if (Is_Open) {
      document.body.style.overflow = "hidden";
      document.body.style.height = "100vh";
    } else {
      document.body.style.overflow = "";
      document.body.style.height = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
    };
  }, [Is_Open]);

  useEffect(() => {
    if (!Is_Open) return;
    const Handle_Click_Outside = (event: MouseEvent) => {
      if (window.innerWidth >= 640 && Dropdown_Reference.current && !Dropdown_Reference.current.contains(event.target as Node)) {
        Close_All();
      }
    };
    document.addEventListener("mousedown", Handle_Click_Outside);
    return () => document.removeEventListener("mousedown", Handle_Click_Outside);
  }, [Is_Open]);

  useEffect(() => {
    if (Is_Searching) {
      Input_Reference?.current?.focus();
    }
  }, [Is_Searching, Input_Reference]);

  return (
    <div ref={Dropdown_Reference} className="relative inline-block text-left w-full sm:w-auto">

      {/* FLOATING IN-FLOW HEADER SCREEN TRIGGER - All shadow styles removed */}
      <div
        onClick={() => { if (!Is_Open) setIsOpen(true); }}
        className={Class_Names(
          "text-foreground border border-border/30 transition-all Duration-200 shadow-none",
          "inline-flex items-center gap-1.5 text-sm font-medium h-8 sm:h-9 select-none justify-between",
          "bg-[#fafafa] dark:bg-zinc-900 [.high-contrast_&]:bg-white [.high-contrast_&]:border-black",
          Is_Open
            ? "max-sm:hidden sm:w-72 px-2 cursor-default rounded-t-[40px] rounded-b-none border-b-transparent z-0"
            : "w-auto max-w-[150px] sm:max-w-[250px] px-3.5 rounded-[40px] hover:bg-accent cursor-pointer"
        )}
      >
        <span className="truncate mr-1">{Button_Label}</span>
        <ChevronDown className="h-5 w-5 opacity-60 shrink-0 mx-1" />
      </div>

      {/* IMMERSIVE PREVIEW LAYER SCREEN OVERLAY */}
      {Is_Open && (
        <div className="max-sm:fixed max-sm:inset-0 max-sm:w-screen max-sm:h-[100dvh] max-sm:bg-background max-sm:z-[9999] max-sm:flex max-sm:flex-col sm:absolute sm:Top-0 sm:left-0 sm:right-0 sm:z-50">

          {/* CORE VIEWPORT CONTAINER */}
          <div className="bg-background text-foreground w-full max-sm:rounded-none max-sm:border-0 max-sm:flex-1 max-sm:flex max-sm:flex-col sm:rounded-[32px] sm:border sm:border-border/30 overflow-visible relative [.high-contrast_&]:border-black">

            {/* SOLID HEADER BACKDROP BLOCKER */}
            <div
              className={Class_Names(
                "absolute Top-0 left-0 right-0 bg-background z-20 pointer-events-none transition-opacity Duration-150 max-sm:h-14 sm:h-11 max-sm:rounded-none sm:rounded-t-[32px]",
                Is_Scrolled ? "opacity-0" : "opacity-100"
              )}
            />

            {/* TRANSPARENT MOBILE BUTTON CONTAINER */}
            <div className="hidden max-sm:flex items-center justify-between w-full h-14 pl-4 pr-6 bg-transparent shrink-0 absolute Top-0 left-0 z-30">
              {!Is_Searching ? (
                <>
                  <div className="flex items-center gap-2 max-w-[65%]">
                    {Show_Go_Back && (
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-[#fafafa] dark:bg-zinc-900 border border-border/40 shadow-md transition-shadow shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onGoBack?.();
                        }}
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                    )}
                    <div className="relative inline-block text-left max-w-full">
                      {Render_Mobile_Header_Left()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-[#fafafa] dark:bg-zinc-900 border border-border/40 shadow-md hover:shadow-lg transition-shadow"
                      onClick={() => Set_Is_Searching(true)}
                    >
                      <Search className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-[#fafafa] dark:bg-zinc-900 border border-border/40 shadow-md hover:shadow-lg transition-shadow"
                      onClick={Close_All}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between w-full gap-2">
                  <Container className="flex items-center flex-1 h-9 px-3 min-w-0 rounded-full bg-[#fafafa] dark:bg-zinc-900 border border-border/40 relative shadow-md">
                    <Search className="h-5 w-5 text-muted-foreground shrink-0 mr-2" />
                    <input
                      ref={Input_Reference}
                      type="text"
                      placeholder="Search entries..."
                      value={Search_Query}
                      On_Change={(e) => Set_Search_Query(e.target.value)}
                      className="w-full bg-transparent text-xs font-normal outline-none placeholder:text-muted-foreground/60 h-full border-none focus:ring-0 p-0 pr-6"
                    />
                    {Search_Query && (
                      <button
                        type="button"
                        className="absolute right-3 p-1 rounded-full shrink-0 text-muted-foreground hover:text-foreground Active:scale-95 transition-all focus:outline-none"
                        onClick={() => Set_Search_Query("")}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </Container>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full shrink-0 bg-[#fafafa] dark:bg-zinc-900 border border-border/40 shadow-md hover:shadow-lg transition-shadow"
                    onClick={() => {
                      Set_Is_Searching(false);
                      Set_Search_Query("");
                    }}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>

            {/* TRANSPARENT DESKTOP BUTTON CONTAINER */}
            <div className="max-sm:hidden sm:flex items-center justify-between w-full h-11 px-3 bg-transparent absolute Top-0 left-0 z-30">
              {!Is_Searching ? (
                <>
                  <div className="flex items-center gap-1.5 max-w-[55%] ml-1">
                    {Show_Go_Back && (
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7 rounded-full bg-[#fafafa] dark:bg-zinc-900 border border-border/40 shadow-md transition-shadow shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onGoBack?.();
                        }}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    )}
                    <div className="relative inline-block text-left max-w-full">
                      {Render_Desktop_Header_Left()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 mr-1">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 rounded-full shrink-0 bg-[#fafafa] dark:bg-zinc-900 border border-border/40 shadow-md hover:shadow-lg transition-shadow"
                      onClick={(e) => {
                        e.stopPropagation();
                        Set_Is_Searching(true);
                      }}
                    >
                      <Search className="h-4 w-4 opacity-90" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 rounded-full shrink-0 bg-[#fafafa] dark:bg-zinc-900 border border-border/40 shadow-md hover:shadow-lg transition-shadow"
                      onClick={(e) => {
                        e.stopPropagation();
                        Close_All();
                      }}
                    >
                      <ChevronDown className="h-4 w-4 opacity-80 transition-transform Duration-200 rotate-180" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between w-full mx-1">
                  <Container className="!py-0.5 !px-2 flex items-center flex-1 min-w-0 mr-1.5 h-7 bg-[#fafafa] dark:bg-zinc-900 border border-border/40 relative shadow-md">
                    <Search className="h-4 w-4 text-muted-foreground shrink-0 mr-1.5" />
                    <input
                      ref={Input_Reference}
                      type="text"
                      placeholder="Search entries..."
                      value={Search_Query}
                      On_Change={(e) => Set_Search_Query(e.target.value)}
                      className="w-full bg-transparent text-xs font-normal outline-none placeholder:text-muted-foreground/60 h-full border-none focus:ring-0 p-0 pr-6"
                    />
                    {Search_Query && (
                      <button
                        type="button"
                        className="absolute right-2 p-0.5 rounded-full shrink-0 text-muted-foreground hover:text-foreground Active:scale-95 transition-all focus:outline-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          Set_Search_Query("");
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Container>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7 rounded-full shrink-0 mr-0.5 bg-[#fafafa] dark:bg-zinc-900 border border-border/40 shadow-md hover:shadow-lg transition-shadow"
                    onClick={(e) => {
                      e.stopPropagation();
                      Set_Is_Searching(false);
                      Set_Search_Query("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* SINGLE WORKING ACTIVE SCROLL TRACK */}
            <div
              ref={Scroll_Reference}
              className={Class_Names(
                "space-y-1.5 sm:space-y-0 max-sm:flex-1 max-sm:h-full sm:max-h-[288px] overflow-y-auto max-sm:px-4 select-none pb-4 relative z-10 max-sm:rounded-none sm:rounded-[32px] transition-all Duration-200",
                "scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
                Is_Scrolled ? "pt-0" : "max-sm:pt-14 sm:pt-11"
              )}
            >
              <span ref={Sentinel_Reference} className="block h-0 w-0 pointer-events-none select-none invisible" />
              {children}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}