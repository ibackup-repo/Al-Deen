import { useEffect, useState, type ReactNode } from "react";
import Settings, { Get_End_Rect } from "./Settings";
import { Use_Page_Transition } from "./Provider";

// Tekent de blijvende zwarte laag onder de paginainhoud. De laag is `fixed`,
// zodat hij op exact dezelfde plek staat als de overlay op het einde.
// Op een "covered" pagina krijgt de wrapper de class `dark` en een witte
// tekstkleur, zodat tekst leesbaar blijft op de zwarte laag.
export const Page_Transition_Viewport = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const { Is_Covered } = Use_Page_Transition();

  // Herberekenen bij resize (header-hoogte hangt van de breedte af).
  const [, Set_Tick] = useState(0);

  useEffect(() => {
    const On_Resize = () => Set_Tick((Tick) => Tick + 1);
    window.addEventListener("resize", On_Resize);
    return () => window.removeEventListener("resize", On_Resize);
  }, []);

  const Rect = Get_End_Rect();

  return (
    <div
      className={`${className ?? ""} ${Is_Covered ? "dark" : ""}`.trim()}
      data-covered={Is_Covered ? "true" : "false"}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        color: Is_Covered ? "#ffffff" : undefined,
      }}
    >
      {Is_Covered && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            left: Rect.X,
            top: Rect.Y,
            width: Rect.Width,
            height: Rect.Height,
            borderRadius: Settings.Border_Radius_End,
            backgroundColor: Settings.End_Color,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      )}

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Page_Transition_Viewport;