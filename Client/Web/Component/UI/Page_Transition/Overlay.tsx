import { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Settings, { Get_End_Rect } from "./Settings";

export interface Page_Transition_Origin {
  X: number;
  Y: number;
  Width: number;
  Height: number;
  Border_Radius: number;
}

export type Overlay_Mode = "open" | "hold" | "close";

interface Overlay_Properties {
  Origin: Page_Transition_Origin;
  Label: string;
  Start_Color: string;
  Mode: Overlay_Mode;
  On_Open_Done: () => void;
  On_Close_Done: () => void;
}

const Get_Contrast_Color = (Color: string) => {
  const Hex = Color.replace("#", "");
  const Full = Hex.length === 3
    ? Hex.split("").map((Char) => Char + Char).join("")
    : Hex;

  const R = parseInt(Full.slice(0, 2), 16);
  const G = parseInt(Full.slice(2, 4), 16);
  const B = parseInt(Full.slice(4, 6), 16);

  if (Number.isNaN(R) || Number.isNaN(G) || Number.isNaN(B)) {
    return "#FFFFFF";
  }

  return (0.299 * R + 0.587 * G + 0.114 * B) / 255 > 0.5
    ? "#000000"
    : "#FFFFFF";
};

const To_Style = (
  Rect: { X: number; Y: number; Width: number; Height: number },
  Radius: number,
  Color: string
) => ({
  left: `${Rect.X}px`,
  top: `${Rect.Y}px`,
  width: `${Rect.Width}px`,
  height: `${Rect.Height}px`,
  borderRadius: `${Radius}px`,
  backgroundColor: Color,
});

export const Page_Transition_Overlay = ({
  Origin,
  Label,
  Start_Color,
  Mode,
  On_Open_Done,
  On_Close_Done,
}: Overlay_Properties) => {
  const Box_Ref = useRef<HTMLDivElement>(null);
  const Label_Ref = useRef<HTMLSpanElement>(null);

  // Callbacks via ref, zodat de effect niet opnieuw start als ze wisselen.
  const Latest = useRef({ On_Open_Done, On_Close_Done });
  Latest.current = { On_Open_Done, On_Close_Done };

  useLayoutEffect(() => {
    const Box = Box_Ref.current;
    const Text = Label_Ref.current;
    if (!Box || !Text) return;

    const Start_Radius = Math.min(
      Origin.Border_Radius,
      Origin.Width / 2,
      Origin.Height / 2
    );

    const Start = To_Style(Origin, Start_Radius, Start_Color);
    const End = To_Style(
      Get_End_Rect(),
      Settings.Border_Radius_Min,
      Settings.End_Color
    );

    const Label_Start = Get_Contrast_Color(Start_Color);
    const Label_End = Get_Contrast_Color(Settings.End_Color);

    // Beginstand direct zetten (nog voor de eerste paint).
    Object.assign(Box.style, Mode === "open" ? Start : End);
    Text.style.color = Mode === "open" ? Label_Start : Label_End;
    Text.style.opacity = Mode === "open" ? "1" : "0";

    if (Mode === "hold") return;

    const Options: KeyframeAnimationOptions = {
      duration: Settings.Duration,
      easing: Settings.Easing,
      fill: "forwards",
      // Terug = dezelfde animatie omgekeerd.
      direction: Mode === "close" ? "reverse" : "normal",
    };

    const Box_Animation = Box.animate([Start, End], Options);

    const Text_Animation = Text.animate(
      [
        { offset: 0, opacity: 1, color: Label_Start },
        { offset: 0.2, opacity: 1 },
        { offset: 1, opacity: 0, color: Label_End },
      ],
      Options
    );

    Box_Animation.onfinish = () => {
      if (Mode === "open") Latest.current.On_Open_Done();
      else Latest.current.On_Close_Done();
    };

    return () => {
      Box_Animation.onfinish = null;
      Box_Animation.cancel();
      Text_Animation.cancel();
    };
  }, [Mode, Origin, Start_Color]);

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
      <div
        ref={Box_Ref}
        style={{
          position: "absolute",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: Settings.Disable_Click_During_Transition
            ? "auto"
            : "none",
          willChange: "left, top, width, height",
        }}
      >
        <span
          ref={Label_Ref}
          style={{
            fontSize: 14,
            fontWeight: 700,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {Label}
        </span>
      </div>
    </div>,
    document.body
  );
};

export default Page_Transition_Overlay;