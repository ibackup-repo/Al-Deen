import { useEffect, useState, type ReactNode } from "react";
import Settings, { Get_End_Rect } from "./Settings";
import { Use_Page_Transition } from "./Provider";

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
      className={className}
      data-covered={Is_Covered ? "true" : "false"}
      style={{ position: "relative" }}
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
            borderRadius: Settings.Border_Radius_Min,
            backgroundColor: Settings.End_Color,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      )}

      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
};

export default Page_Transition_Viewport;