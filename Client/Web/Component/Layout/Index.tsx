// @Web/Component/Layout/Header/Index.tsx
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  useRef,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Settings,
  ArrowLeft,
  Search,
  Home,
  X,
  Heart,
  LogIn,
} from "lucide-react";
import { Use_Scroll_Direction } from "@/Hook/Use-Scroll-Direction";
import { Use_App } from "@Web/Context/App";
import { Use_Auth } from "@Web/Context/Auth";
import { Use_Translation } from "@/Hook/Use-Translation";
import { Use_Is_Mobile } from "@/Hook/Use-Mobile";
import { Class_Names } from "@/Library/Utility";
import { Button } from "@Web/Component/UI/Button";
import type { Button_Variant } from "@Web/Component/UI/Button/Types";
import { Input } from "@Web/Component/UI/Input";
import { Container } from "@Web/Component/UI/Container";
import { Search_Input } from "../../Search/Input";
import { Use_Search } from "@/Hook/Use-Search";
import { Quran_Navigator } from "@Web/Component/Layout/Header/Navigator/Quran";
import {
  Aid_Navigator,
  Is_Aid_Path,
} from "@Web/Component/Layout/Header/Navigator/Aid";
import {
  Hadith_Navigator,
  Is_Hadith_Path,
} from "@Web/Component/Layout/Header/Navigator/Hadith";
import {
  Nav_History,
  Use_Nav_History_Tracker,
} from "@/Hook/Use-Nav-History";
import { Mobile_Settings_Store } from "@Web/Component/Settings/Mobile-Settings-Store";
import { Try_Handle_Back } from "@/Hook/Use-Back-Handler";
import { Use_PWA_Install } from "@/Hook/Use-PWA-Install";
import { Toast } from "@/Hook/Use-Toast";

interface Header_Properties {
  On_Height_Change?: (height: number) => void;
}

/* -------------------------------------------------------------------------- */
/* Header_Button: elke knop in de header is 48px hoog, met padding            */
/* 16px boven, 8px onder en 16px links/rechts.                                */
/* -------------------------------------------------------------------------- */

const Header_Button_Height = 48;

// Pas aan naar de variant die je voor doorzichtige (ghost) knoppen gebruikt.
const Header_Button_Variant: Button_Variant = "Ghost" as Button_Variant;

const Header_Button_Style: React.CSSProperties = {
  paddingTop: 16,
  paddingBottom: 8,
  paddingLeft: 16,
  paddingRight: 16,
};

interface Header_Button_Properties {
  Icon?: React.ReactNode;
  Label?: string;
  On_Click?: () => void;
  // Icon-knoppen zijn 48x48 (16px padding laat precies 16px over voor het icoon).
  Width?: number;
  Title?: string;
  "aria-label"?: string;
}

const Header_Button = ({
  Icon,
  Label,
  On_Click,
  Width = Header_Button_Height,
  Title,
  "aria-label": Aria_Label,
}: Header_Button_Properties) => {
  const { Thema } = Use_App();

  return (
    <div
      className="shrink-0"
      style={{ width: Width }}
      title={Title}
    >
      <Button
        Icon={Icon}
        Label={Label}
        On_Click={On_Click}
        Height={Header_Button_Height}
        Width={Width}
        Variant={Header_Button_Variant}
        // De header staat boven de pagina, dus volgt hij altijd het globale
        // thema en niet de zwarte laag van een transitie.
        Theme={Thema === "dark" ? "Dark" : "Light"}
        Style_Properties={Header_Button_Style}
        aria-label={Aria_Label}
      />
    </div>
  );
};

function Get_Page_Title(pathname: string): string {
  const Segments = pathname.replace(/\/$/, "").split("/").filter(Boolean);

  if (Segments.length === 0) return "";

  const lastSegment = Segments[Segments.length - 1];

  return lastSegment
    .split("-")
    .map(
      (Kalimah) =>
        Kalimah.charAt(0).toUpperCase() + Kalimah.slice(1)
    )
    .join(" ");
}

function Use_Is_Quran_Path() {
  const Location_Data = useLocation();

  return /^\/Quran\/Surah\/\d+(\/Ayah\/\d+)?/.test(
    Location_Data.pathname
  );
}

export const Header = memo(function Header({
  On_Height_Change,
}: Header_Properties) {
  const { Scroll_Direction } = Use_Scroll_Direction();
  const {
    Is_Settings_Sidebar_Open,
    Set_Settings_Sidebar_Open,
  } = Use_App();
  const { User } = Use_Auth();
  const { t, Is_RTL } = Use_Translation();
  const navigate = useNavigate();
  const Location_Data = useLocation();
  const Is_Mobile = Use_Is_Mobile();
  const { Prompt_Install } = Use_PWA_Install();

  Use_Nav_History_Tracker();

  const [Is_Search_Mode, Set_Is_Search_Mode] = useState(false);

  const {
    query,
    Set_Query,
    Category,
    Set_Category,
    Results,
    Selected_Index,
    Set_Selected_Index,
  } = Use_Search();

  const [Mobile_Settings, Set_Mobile_Settings] = useState(
    () => Mobile_Settings_Store.getState()
  );

  const [Settings_Search_Active, Set_Settings_Search_Active] =
    useState(false);

  const [Settings_Search_Value, Set_Settings_Search_Value] =
    useState("");

  const [Is_Aid_Open, Set_Is_Aid_Open] = useState(false);

  // Meet de daadwerkelijke hoogte van de Header.
  const Header_Ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const Element = Header_Ref.current;

    if (!Element) return;

    const Update_Height = () => {
      const Height = Element.getBoundingClientRect().height;
      On_Height_Change?.(Height);
    };

    Update_Height();

    const Observer = new ResizeObserver(Update_Height);
    Observer.observe(Element);

    return () => Observer.disconnect();
  }, [On_Height_Change]);

  useEffect(() => {
    const unsub = Mobile_Settings_Store.subscribe(() => {
      Set_Mobile_Settings(Mobile_Settings_Store.getState());
      Set_Settings_Search_Active(
        Mobile_Settings_Store.getState().Is_Search_Mode
      );
    });

    return unsub;
  }, []);

  const Search_Container_Ref = useRef<HTMLDivElement>(null);
  const Search_Input_Ref = useRef<HTMLInputElement>(null);
  const Settings_Search_Input_Ref = useRef<HTMLInputElement>(null);
  const Dropdown_Menu_Ref = useRef<HTMLDivElement>(null);

  const Should_Hide = Scroll_Direction === "down";
  const Is_Home = Location_Data.pathname === "/";
  const Is_Mobile_Settings_Open =
    Is_Mobile && Is_Settings_Sidebar_Open;

  const Is_Quran_Path = Use_Is_Quran_Path();
  const Aid_Path = Is_Aid_Path(Location_Data.pathname);
  const Hadith_Path = Is_Hadith_Path(Location_Data.pathname);

  useEffect(() => {
    Set_Is_Aid_Open(false);
  }, [Location_Data.pathname]);

  useEffect(() => {
    const Handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();

        if (Is_Mobile_Settings_Open) return;

        Set_Is_Search_Mode((prev) => !prev);
      }
    };

    document.addEventListener("keydown", Handler);

    return () => document.removeEventListener("keydown", Handler);
  }, [Is_Mobile_Settings_Open]);

  useEffect(() => {
    if (Is_Search_Mode && Search_Input_Ref.current) {
      Search_Input_Ref.current.focus();
    }
  }, [Is_Search_Mode]);

  useEffect(() => {
    if (
      Settings_Search_Active &&
      Settings_Search_Input_Ref.current
    ) {
      Settings_Search_Input_Ref.current.focus();
    }

    if (!Settings_Search_Active) {
      Set_Settings_Search_Value("");
    }
  }, [Settings_Search_Active]);

  useEffect(() => {
    if (!Is_Settings_Sidebar_Open && Settings_Search_Active) {
      Mobile_Settings_Store.Exit_Search_Mode();
    }
  }, [Is_Settings_Sidebar_Open, Settings_Search_Active]);

  useEffect(() => {
    if (!Is_Search_Mode) return;

    const Handle_Click_Outside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (Search_Container_Ref.current?.contains(target)) return;
      if (Dropdown_Menu_Ref.current?.contains(target)) return;

      Close_Search_Mode();
    };

    document.addEventListener("mousedown", Handle_Click_Outside);

    return () =>
      document.removeEventListener(
        "mousedown",
        Handle_Click_Outside
      );
  }, [Is_Search_Mode]);

  const Close_Search_Mode = () => {
    Set_Is_Search_Mode(false);
    Set_Query("");
    Set_Category("Pages");
  };

  const Handle_Back = useCallback(() => {
    if (Is_Search_Mode) {
      Close_Search_Mode();
      return;
    }

    if (Try_Handle_Back()) return;

    if (Is_Mobile_Settings_Open) {
      Mobile_Settings_Store.Go_Back();
      return;
    }

    if (Is_Settings_Sidebar_Open) {
      Set_Settings_Sidebar_Open(false);
      return;
    }

    if (Is_Home) return;

    const target = Nav_History.Pop_Distinct(
      Location_Data.pathname
    );

    if (target) {
      navigate(target);
      return;
    }

    const Segments = Location_Data.pathname
      .replace(/\/$/, "")
      .split("/")
      .filter(Boolean);

    if (Segments.length <= 1) {
      navigate("/");
      return;
    }

    Segments.pop();
    navigate("/" + Segments.join("/"));
  }, [
    Is_Search_Mode,
    Is_Settings_Sidebar_Open,
    Is_Mobile_Settings_Open,
    Is_Home,
    navigate,
    Set_Settings_Sidebar_Open,
    Location_Data.pathname,
  ]);

  const Show_Regular_Back =
    !Is_Home || Is_Settings_Sidebar_Open;

  const Show_Back_Button =
    Show_Regular_Back || Is_Search_Mode;

  const Handle_Result_Click = (path: string) => {
    navigate(path);
    Close_Search_Mode();
  };

  const Handle_See_All = () => {
    navigate(
      `/Search?q=${encodeURIComponent(query)}&Category=${Category}`
    );

    Close_Search_Mode();
  };

  const Handle_Key_Down = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();

      Set_Selected_Index((prev) =>
        Math.min(prev + 1, Results.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();

      Set_Selected_Index((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      if (Results.length > 0 && Selected_Index >= 0) {
        Handle_Result_Click(Results[Selected_Index].path);
      } else if (query.trim()) {
        Handle_See_All();
      }
    } else if (e.key === "Escape") {
      Close_Search_Mode();
    }
  };

  const Handle_Search_Click = () => {
    if (Is_Mobile_Settings_Open) {
      Mobile_Settings_Store.Enter_Search_Mode(() => {
        Set_Settings_Search_Value("");
      });

      return;
    }

    Set_Is_Search_Mode(true);
  };

  const Handle_Settings_Search_Change = (v: string) => {
    Set_Settings_Search_Value(v);
    Mobile_Settings_Store.Set_Search_Query(v);
  };

  const Exit_Settings_Search = () => {
    Mobile_Settings_Store.Exit_Search_Mode();
  };

  const Render_Left_Content = () => {
    if (Is_Mobile_Settings_Open) {
      if (Settings_Search_Active) {
        return (
          <>
            <Header_Button
              On_Click={Exit_Settings_Search}
              aria-label="Back"
              Icon={
                <ArrowLeft
                  className={Class_Names(
                    "h-4 w-4",
                    Is_RTL && "rotate-180"
                  )}
                />
              }
            />

            <div className="flex-1 min-w-0">
              <Input
                ref={Settings_Search_Input_Ref}
                placeholder="Search Settings"
                value={Settings_Search_Value}
                On_Change={(e) =>
                  Handle_Settings_Search_Change(e.target.value)
                }
                className="h-8 sm:h-9 text-sm"
              />
            </div>
          </>
        );
      }

      return (
        <>
          <Header_Button
            On_Click={Handle_Back}
            aria-label={
              Mobile_Settings.Show_Back_Button ? "Back" : "Close"
            }
            Icon={
              Mobile_Settings.Show_Back_Button ? (
                <ArrowLeft
                  className={Class_Names(
                    "h-4 w-4",
                    Is_RTL && "rotate-180"
                  )}
                />
              ) : (
                <X className="h-4 w-4" />
              )
            }
          />

          <Container className="!py-1 !px-3 inline-flex w-auto max-w-[70%]">
            <span className="text-sm font-medium truncate">
              {Mobile_Settings.title}
            </span>
          </Container>
        </>
      );
    }

    if (!Show_Back_Button) {
      if (!Is_Home && !Is_Search_Mode) {
        return (
          <Header_Button
            On_Click={() => navigate("/")}
            aria-label="Home"
            Icon={<Home className="h-4 w-4" />}
          />
        );
      }

      return null;
    }

    return (
      <>
        {!(Aid_Path && Is_Mobile && Is_Aid_Open) && (
          <Header_Button
            On_Click={Handle_Back}
            aria-label="Back"
            Icon={
              <ArrowLeft
                className={Class_Names(
                  "h-4 w-4",
                  Is_RTL && "rotate-180"
                )}
              />
            }
          />
        )}

        {!Is_Search_Mode &&
          (Is_Quran_Path ? (
            <Quran_Navigator />
          ) : Aid_Path ? (
            <Aid_Navigator
              On_Open_Change={Set_Is_Aid_Open}
            />
          ) : Hadith_Path ? (
            <Hadith_Navigator />
          ) : (
            <Header_Button
              Label={Get_Page_Title(Location_Data.pathname)}
              Width={Is_Mobile ? 160 : 200}
            />
          ))}
      </>
    );
  };

  const Hide_Right_Settings_Buttons =
    Is_Settings_Sidebar_Open;

  return (
    <header
      ref={Header_Ref}
      className={Class_Names(
        "fixed top-0 z-50 transition-all duration-300 flex justify-between items-start pt-1 sm:pt-2 isolate",
        Aid_Path && Is_Aid_Open
          ? "max-sm:left-0 max-sm:right-0 max-sm:pt-0 left-2 right-2 sm:left-4 sm:right-4"
          : "left-2 right-2 sm:left-4 sm:right-4",
        Should_Hide &&
          !Is_Settings_Sidebar_Open &&
          !Is_Mobile_Settings_Open &&
          !(Aid_Path && Is_Aid_Open)
          ? "-translate-y-24 opacity-0 pointer-events-none"
          : "translate-y-0 opacity-100"
      )}
      dir={Is_RTL ? "rtl" : "ltr"}
    >
      {/* Layout Wrapper Column: Uses flex layout rules so that when left content expands,
          it safely scales, and natively forces the inline layout neighbor (Donate)
          to step rightwards instead of stacking/overlapping.
      */}
      <div
        className={Class_Names(
          "flex items-center min-w-0 flex-1",
          Aid_Path && Is_Aid_Open
            ? "max-sm:gap-0 max-sm:h-auto"
            : "gap-2 h-12"
        )}
      >
        {Render_Left_Content()}

        {/* Dynamic auto-adjust Donate layout wrapper */}
        {!Is_Search_Mode &&
          !Is_Mobile_Settings_Open &&
          !(Aid_Path && Is_Aid_Open) && (
            <div className="h-12 flex items-center shrink-0 ml-auto pl-2 sm:pl-0 sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:ml-4 transition-all duration-200">
              <Header_Button
                On_Click={() => navigate("/Donate")}
                aria-label="Donate"
                Title="Donate"
                Icon={<Heart className="h-4 w-4" />}
              />
            </div>
          )}
      </div>

      <div className="flex items-start gap-1 sm:gap-2 shrink-0 ml-2">
        {Is_Search_Mode && !Is_Mobile_Settings_Open ? (
          <div
            ref={Search_Container_Ref}
            className={Class_Names(
              "transition-all duration-300 ease-out mr-1 sm:mr-2",
              Is_Mobile
                ? "w-[calc(100vw-96px)]"
                : "w-[340px]"
            )}
          >
            <Search_Input
              query={query}
              Set_Query={Set_Query}
              Category={Category}
              Set_Category={Set_Category}
              On_Search={Handle_See_All}
              Input_Reference={Search_Input_Ref}
              onKeyDown={Handle_Key_Down}
              Results={Results}
              Selected_Index={Selected_Index}
              On_Result_Click={Handle_Result_Click}
              On_See_All={Handle_See_All}
              Dropdown_Menu_Ref={Dropdown_Menu_Ref}
              Is_Mobile={false}
            />
          </div>
        ) : (
          !(Aid_Path && Is_Aid_Open) && (
            <div className="flex items-center gap-1 sm:gap-2 h-12">
              {!(Is_Mobile_Settings_Open && Settings_Search_Active) && (
                <Header_Button
                  On_Click={Handle_Search_Click}
                  aria-label="Search"
                  Icon={<Search className="h-4 w-4" />}
                />
              )}

              {!Hide_Right_Settings_Buttons && (
                <>
                  <Header_Button
                    On_Click={() => Set_Settings_Sidebar_Open(true)}
                    aria-label="Settings"
                    Icon={<Settings className="h-4 w-4" />}
                  />

                  {!User && (
                    <Header_Button
                      On_Click={() => navigate("/Sign-In")}
                      aria-label="Sign In"
                      Title="Sign In"
                      Icon={<LogIn className="h-4 w-4" />}
                    />
                  )}
                </>
              )}
            </div>
          )
        )}
      </div>
    </header>
  );
});