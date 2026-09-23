import React, { useState, useRef, useId, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { motion } from "framer-motion";
import { Class_Names } from "@/Library/Utility";
import { Use_UI } from "@Web/Context/UI";
import { Use_App } from "@Web/Context/App";
import {
  Button_Variant,
  Button_State,
  Theme_Mode,
} from "./Types";
import { Default_Button_Configuration } from "./Preset/Default"
import { Fluid, Gooey_Configuration } from "./Fluid";

export interface Button_Properties {
  Label?: string | React.ReactNode;
  Icon?: React.ReactNode;
  On_Click?: (Event?: React.MouseEvent<HTMLDivElement>) => void;
  Height?: number;
  Width?: number;
  Variant?: Button_Variant;
  Color?: string;
  Text_Color?: string;
  Size?: "default" | "icon" | "sm" | "lg";
  Class_Name_String?: string;
  Style_Properties?: React.CSSProperties;
  "aria-label"?: string;
}

// Gooey en Fluid zijn in Configuration.ts samengevoegd tot één veld (Gooey) per
// state: dat object stuurt zowel het SVG-blur/contrast-filter als de canvas-
// druppelanimatie aan. In plaats van deze defaults hier los te dupliceren (en
// weer te laten verouderen), pakken we gewoon een volledig ingevulde variant
// uit de canonieke Default_Button_Configuration.
const Default_Fluid: Gooey_Configuration =
  Default_Button_Configuration.Light.Primary.Hover.Gooey;

// Vangnet: als On_Settled om wat voor reden dan ook nooit komt,
// gaat het Fluid-effect na deze tijd (ms) alsnog uit.
const FLUID_FALLBACK_TIMEOUT = 1500;

export const Button: React.FC<Button_Properties> = ({
  Label,
  Icon,
  On_Click,
  Height = 48,
  Width,
  Variant = "Primary",
  Color,
  Text_Color,
  Size = "default",
  Class_Name_String,
  Style_Properties,
  "aria-label": Aria_Label,
}) => {
  const [Is_Hovered, Set_Is_Hovered] = useState(false);
  const [Is_Pressed, Set_Is_Pressed] = useState(false);
  // True zolang de Fluid-body zichtbaar is (hover + de uitrust-animatie na afhoveren).
  const [Is_Fluid_Active, Set_Is_Fluid_Active] = useState(false);
  const [Measured_Width, Set_Measured_Width] = useState<number>(Width || 180);
  const Container_Reference = useRef<HTMLDivElement>(null);
  const Is_Hovered_Reference = useRef(false);
  Is_Hovered_Reference.current = Is_Hovered;
  const Last_Fluid_Configuration_Reference = useRef<Gooey_Configuration | null>(null);

  const Filter_Identifier = useId().replace(/:/g, "");

  let Button_Customization = null;
  try {
    const UI = Use_UI();
    Button_Customization = UI?.Button_Customization ?? null;
  } catch {}

  const { Thema } = Use_App();

  const Active_Theme_Key: Theme_Mode = Thema === "dark" ? "Dark" : "Light";
  const Current_State_Key: Button_State = Is_Pressed
    ? "Active"
    : Is_Hovered
    ? "Hover"
    : "Default";

  const Configuration =
    Button_Customization?.[Active_Theme_Key]?.[Variant]?.[Current_State_Key];

  const Resolved_Background_Color = Color || Configuration?.BG_Color || "#ffffff";
  const Resolved_Text_Color = Text_Color || Configuration?.Text_Color || "#0f172a";
  const Resolved_Border_Radius = Configuration?.Border_Radius ?? 12;
  const Resolved_Has_Border = Configuration?.Has_Border ?? false;
  const Resolved_Border_Color = Configuration?.Border_Color || "transparent";

  // --- Fluid / Gooey -------------------------------------------------------
  // Fluid_Wanted: staat het Gooey-effect (filter + canvas-body) aan in de
  // HUIDIGE state (Normal/Hover/Active)?
  const Fluid_Wanted = !!Configuration?.Gooey?.Enabled;

  // Onthoud de laatste actieve Gooey-config. Na het afhoveren valt de state terug
  // naar Normal (waar Gooey uit kan staan), maar de uitrust-animatie moet nog
  // met de hover-config afgemaakt worden.
  if (Fluid_Wanted && Configuration?.Gooey) {
    Last_Fluid_Configuration_Reference.current = Configuration.Gooey;
  }

  // Zodra het effect gewenst is én de knop gehoverd wordt: body zichtbaar maken.
  // (setState tijdens render is toegestaan voor de eigen component; React
  // rendert meteen opnieuw, vóór de commit, dus zonder tussenframe.)
  if (Fluid_Wanted && Is_Hovered && !Is_Fluid_Active) {
    Set_Is_Fluid_Active(true);
  }

  // Blijft gemount zolang het gewenst is OF de animatie nog uitrust.
  const Show_Fluid = Fluid_Wanted || Is_Fluid_Active;

  const Fluid_Configuration_Data: Gooey_Configuration =
    (Fluid_Wanted ? Configuration?.Gooey : Last_Fluid_Configuration_Reference.current) ??
    Default_Fluid;

  // Wordt door Fluid aangeroepen als het canvas leeg is. flushSync zorgt dat de
  // solide achtergrond in dezelfde frame terugkomt als waarin het canvas leeg wordt.
  const Handle_Fluid_Settled = useCallback(() => {
    if (Is_Hovered_Reference.current) return;
    flushSync(() => Set_Is_Fluid_Active(false));
  }, []);

  // Vangnet voor het geval On_Settled nooit komt.
  useEffect(() => {
    if (!Is_Hovered && Is_Fluid_Active) {
      const Timeout_Identifier = setTimeout(
        () => Set_Is_Fluid_Active(false),
        FLUID_FALLBACK_TIMEOUT
      );
      return () => clearTimeout(Timeout_Identifier);
    }
  }, [Is_Hovered, Is_Fluid_Active]);

  // Achtergrond is alleen transparant zolang de Fluid-body zelf tekent.
  const Body_Is_Drawn = Is_Fluid_Active && Fluid_Configuration_Data.Draw_Body;
  // Het Gooey-filter is nu hetzelfde veld als Fluid_Wanted, dus dit valt samen
  // met Show_Fluid (gewenst, of nog aan het uitrusten na afhoveren).
  const Use_Gooey_Filter = Show_Fluid;
  // -----------------------------------------------------------------------

  const Padding = Configuration?.Padding ?? {
    Top: 12,
    Right: 16,
    Bottom: 12,
    Left: 16,
  };
  const Margin = Configuration?.Margin ?? {
    Top: 0,
    Right: 0,
    Bottom: 0,
    Left: 0,
  };

  const Is_Icon_Only = Size === "icon" || (!Label && !!Icon);
  const Actual_Height =
    Size === "sm" ? 32 : Size === "lg" ? 48 : Size === "icon" ? 48 : Height;
  const Actual_Width = Is_Icon_Only ? Actual_Height : Width;

  const Padding_Key = `${Padding.Top}-${Padding.Right}-${Padding.Bottom}-${Padding.Left}`;
  useEffect(() => {
    if (Container_Reference.current && !Width) {
      const Bounding_Rectangle =
        Container_Reference.current.getBoundingClientRect();
      if (Bounding_Rectangle.width > 0) {
        Set_Measured_Width(Bounding_Rectangle.width);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Label, Icon, Size, Padding_Key]);

  const Resolved_Aria_Label =
    Aria_Label || (typeof Label === "string" ? Label : undefined);

  return (
    <div className="relative inline-block w-full">
      {Use_Gooey_Filter && (
        <svg className="hidden absolute w-0 h-0" aria-hidden="true">
          <defs>
            <filter
              id={`gooey-filter-${Filter_Identifier}`}
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation={Fluid_Configuration_Data.Blur}
                result="blur"
              />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${Fluid_Configuration_Data.Contrast} -9`}
                result="gooey"
              />
              <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
            </filter>
          </defs>
        </svg>
      )}

      {Show_Fluid && (
        <div
          style={{
            position: "absolute",
            top: -Fluid_Configuration_Data.Canvas_Padding,
            left: -Fluid_Configuration_Data.Canvas_Padding,
            filter: `url(#gooey-filter-${Filter_Identifier})`,
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <Fluid
            Is_Hovered={Is_Hovered}
            Is_Pressed={Is_Pressed}
            Width={Actual_Width || Measured_Width}
            Height={Actual_Height}
            Color={Resolved_Background_Color}
            Configuration={Fluid_Configuration_Data}
            On_Settled={Handle_Fluid_Settled}
          />
        </div>
      )}

      <motion.div
        ref={Container_Reference}
        role="button"
        tabIndex={0}
        aria-label={Resolved_Aria_Label}
        className={Class_Names(
          "flex items-center justify-center shrink-0 relative select-none cursor-pointer overflow-hidden",
          Class_Name_String
        )}
        style={{
          width: Actual_Width ? `${Actual_Width}px` : "100%",
          height: `${Actual_Height}px`,
          borderRadius: `${Resolved_Border_Radius}px`,
          backgroundColor: Body_Is_Drawn ? "transparent" : Resolved_Background_Color,
          border: Resolved_Has_Border
            ? `2px solid ${Resolved_Border_Color}`
            : "none",
          paddingTop: `${Padding.Top}px`,
          paddingRight: `${Padding.Right}px`,
          paddingBottom: `${Padding.Bottom}px`,
          paddingLeft: `${Padding.Left}px`,
          marginTop: `${Margin.Top}px`,
          marginRight: `${Margin.Right}px`,
          marginBottom: `${Margin.Bottom}px`,
          marginLeft: `${Margin.Left}px`,
          filter:
            Fluid_Configuration_Data.Enabled && !Show_Fluid
              ? `url(#gooey-filter-${Filter_Identifier})`
              : "none",
          // Bewust GEEN transition op background-color: een fade van transparant
          // naar solide veroorzaakte de flikker bij het afhoveren.
          transition:
            "width 150ms ease, height 150ms ease, border-radius 150ms ease",
          ...Style_Properties,
        }}
        onMouseEnter={() => Set_Is_Hovered(true)}
        onMouseLeave={() => {
          Set_Is_Hovered(false);
          Set_Is_Pressed(false);
        }}
        onMouseDown={() => Set_Is_Pressed(true)}
        onMouseUp={() => Set_Is_Pressed(false)}
        onTouchStart={() => {
          Set_Is_Hovered(true);
          Set_Is_Pressed(true);
        }}
        onTouchEnd={() => {
          Set_Is_Hovered(false);
          Set_Is_Pressed(false);
        }}
        onClick={On_Click}
      >
        <span
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            width: "100%",
            height: "100%",
            color: Resolved_Text_Color,
            fontWeight: 700,
            fontSize: "14px",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            textAlign: "center",
            transform: Is_Pressed ? "scale(0.94)" : "scale(1)",
            transition: "transform 0.15s ease",
            pointerEvents: "none",
          }}
        >
          {Icon}
          {Label && <span>{Label}</span>}
        </span>
      </motion.div>
    </div>
  );
};

export default Button;