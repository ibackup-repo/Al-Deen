import { ReactNode, useState, useEffect } from "react";
import { Header } from "./Header/Index.tsx";
import { Page_Transition } from "@Web/Component/Page-Transition";
import { Class_Names } from "@/Library/Utility";

import { Settings_Sidebar } from "@Web/Component/Settings/Index";
import Spotlight_Search from "@Web/Component/Search/Index";

interface Layout_Properties {
  children: ReactNode;
  Hide_Footer?: boolean;
}

export function Layout({ children, Hide_Footer = false }: Layout_Properties) {
  const [Show_Header, Set_Show_Header] = useState(true);

  useEffect(() => {
    // Custom event handlers to toggle visibility dynamically
    const Handle_Hide = () => Set_Show_Header(false);
    const Handle_Show = () => Set_Show_Header(true);

    window.addEventListener("hide-header", Handle_Hide);
    window.addEventListener("show-header", Handle_Show);

    return () => {
      window.removeEventListener("hide-header", Handle_Hide);
      window.removeEventListener("show-header", Handle_Show);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Conditionally render the header based on received global layout events */}
      {Show_Header && <Header />}
      
      <Page_Transition>
        {/* Dynamic padding adjustment when the header is hidden 
            to prevent layout content shifts or giant white spaces */}
        <main className={Class_Names(
          "flex-1 px-2 sm:px-4 pb-6 transition-all Duration-150", 
          Show_Header ? "pt-12 md:pt-16" : "pt-0"
        )}>
          {children}
        </main>
      </Page_Transition>
      
      <Settings_Sidebar />
      <Spotlight_Search />
    </div>
  );
}