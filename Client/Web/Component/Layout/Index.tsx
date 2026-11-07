import { ReactNode, useState, useEffect, useCallback } from "react";

import { Header } from "./Header/Index.tsx";
import { Page_Transition_Viewport } from "@Web/Component/UI/Page_Transition/Viewport";
import { Class_Names } from "@/Library/Utility";

import { Settings_Sidebar } from "@Web/Component/Settings/Index";
import Spotlight_Search from "@Web/Component/Search/Index";

interface Layout_Properties {
  children: ReactNode;
  Hide_Footer?: boolean;
}

// Elke pagina rendert zelf <Layout> en mount dus opnieuw bij navigatie.
// Daarom onthouden we de laatst gemeten headerhoogte buiten de component:
// een nieuwe pagina begint meteen op de juiste hoogte in plaats van op 0px
// en daarna omlaag te springen. 72 = pt-4 + knop van 48 + pb-2.
let Last_Header_Height = 72;

export function Layout({
  children,
  Hide_Footer = false
}: Layout_Properties) {
  const [Show_Header, Set_Show_Header] = useState(true);
  const [Header_Height, Set_Header_Height] = useState(Last_Header_Height);

  // Alleen animeren als de header verborgen/getoond wordt, nooit bij het laden.
  const [Animate_Spacer, Set_Animate_Spacer] = useState(false);

  const Handle_Header_Height = useCallback((Height: number) => {
    Last_Header_Height = Height;

    Set_Header_Height((Previous) =>
      Math.abs(Previous - Height) > 0.5 ? Height : Previous
    );
  }, []);

  useEffect(() => {
    const Handle_Hide = () => {
      Set_Animate_Spacer(true);
      Set_Show_Header(false);
    };

    const Handle_Show = () => {
      Set_Animate_Spacer(true);
      Set_Show_Header(true);
    };

    window.addEventListener("hide-header", Handle_Hide);
    window.addEventListener("show-header", Handle_Show);

    return () => {
      window.removeEventListener("hide-header", Handle_Hide);
      window.removeEventListener("show-header", Handle_Show);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">

      {/* Fixed Header */}
      {Show_Header && (
        <Header On_Height_Change={Handle_Header_Height} />
      )}

      {/* Dynamic Header Spacer */}
      <div
        aria-hidden="true"
        style={{
          height: Show_Header ? `${Header_Height}px` : "0px",
          flexShrink: 0,
          transition: Animate_Spacer ? "height 150ms ease" : "none"
        }}
      />

      {/* Main Content */}
      <Page_Transition_Viewport className="flex-1">

        <main
          className={Class_Names(
            "flex-1 px-4 pb-4 pt-2"
          )}
        >
          {children}
        </main>

      </Page_Transition_Viewport>

      <Settings_Sidebar />
      <Spotlight_Search />

    </div>
  );
}