import React from "react";

import { Use_UI } from "@Web/Context/UI";
import { Use_App } from "@Web/Context/App";
import {
  Use_Page_Transition_Optional,
} from "../Page_Transition/Index";

import type {
  Container_Properties,
  Container_Theme_Mode,
  Container_Variant,
} from "./Types";

// Kiest zwart of wit als tekstkleur voor de gegeven achtergrondkleur.
// Ondersteunt #rgb, #rrggbb, #rrggbbaa en rgb()/rgba(). Geeft null terug
// als de kleur onbekend of (bijna) transparant is: dan weten we niets.
const Get_Contrast_Color = (Color: string): string | null => {
  let R: number;
  let G: number;
  let B: number;
  let A = 1;

  const Value = Color.trim().toLowerCase();

  if (Value.startsWith("#")) {
    let Hex = Value.slice(1);

    if (Hex.length === 3 || Hex.length === 4) {
      Hex = Hex.split("").map((Char) => Char + Char).join("");
    }

    if (Hex.length !== 6 && Hex.length !== 8) return null;

    R = parseInt(Hex.slice(0, 2), 16);
    G = parseInt(Hex.slice(2, 4), 16);
    B = parseInt(Hex.slice(4, 6), 16);

    if (Hex.length === 8) {
      A = parseInt(Hex.slice(6, 8), 16) / 255;
    }
  } else {
    const Match = Value.match(
      /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,/]+([\d.]+))?\s*\)$/
    );

    if (!Match) return null;

    R = Number(Match[1]);
    G = Number(Match[2]);
    B = Number(Match[3]);

    if (Match[4] !== undefined) A = Number(Match[4]);
  }

  if ([R, G, B, A].some((Part) => Number.isNaN(Part)) || A < 0.5) {
    return null;
  }

  const Luminance = (0.299 * R + 0.587 * G + 0.114 * B) / 255;

  return Luminance > 0.5 ? "#000000" : "#ffffff";
};

export const Container: React.FC<Container_Properties> = ({
  children,

  Width,
  Height,

  Variant = "Primary",
  Theme,

  Padding,
  Padding_Horizontal,
  Padding_Vertical,

  Margin,
  Gap,

  Background_Color,
  Text_Color,

  Border_Color,
  Border_Width,
  Border_Radius,

  Class_Name_String,
  Style_Properties,
}) => {
  const { Container_Customization } = Use_UI();

  // Buiten de provider is dit undefined.
  const Transition = Use_Page_Transition_Optional();

  const { Thema } = Use_App();

  // Volgorde: Theme-prop op de container, dan "Dark" als de pagina op de
  // blijvende zwarte laag staat, dan het globale thema (zelfde als Button).
  const Active_Theme_Key: Container_Theme_Mode =
    Theme ??
    (Transition?.Is_Covered
      ? "Dark"
      : Thema === "dark"
      ? "Dark"
      : "Light");

  const Current_Variant_Key: Container_Variant = Variant;

  const Configuration =
    Container_Customization[Active_Theme_Key][Current_Variant_Key];

  /* Kleuren en borders */

  const Resolved_Background_Color =
    Background_Color ?? Configuration.BG_Color;

  // Tekstkleur: expliciete Text_Color wint. Is alleen de achtergrond
  // overschreven (Background_Color), dan kiezen we automatisch zwart of wit
  // zodat tekst en iconen (currentColor) leesbaar blijven. Anders komt de
  // kleur uit de preset.
  const Auto_Text_Color =
    Background_Color !== undefined
      ? Get_Contrast_Color(Background_Color)
      : null;

  const Resolved_Text_Color =
    Text_Color ?? Auto_Text_Color ?? Configuration.Text_Color;

  const Resolved_Border_Radius =
    Border_Radius ?? Configuration.Border_Radius;

  const Resolved_Border_Color =
    Border_Color ?? Configuration.Border_Color;

  const Resolved_Border_Width =
    Border_Width ??
    (Configuration.Has_Border
      ? Configuration.Border_Width
      : 0);

  /* Padding */

  const Padding_Configuration = Configuration.Padding;
  const Margin_Configuration = Configuration.Margin;

  const Resolved_Padding = {
    Top: Padding_Vertical ?? Padding ?? Padding_Configuration.Top,
    Right: Padding_Horizontal ?? Padding ?? Padding_Configuration.Right,
    Bottom: Padding_Vertical ?? Padding ?? Padding_Configuration.Bottom,
    Left: Padding_Horizontal ?? Padding ?? Padding_Configuration.Left,
  };

  /* Margin */

  const Resolved_Margin = {
    Top: Margin ?? Margin_Configuration.Top,
    Right: Margin ?? Margin_Configuration.Right,
    Bottom: Margin ?? Margin_Configuration.Bottom,
    Left: Margin ?? Margin_Configuration.Left,
  };

  const Resolved_Gap = Gap ?? Configuration.Gap;

  /* Styling */

  const Container_Style: React.CSSProperties = {
    position: "relative",

    display: "flex",
    flexDirection: "column",

    boxSizing: "border-box",

    width: Width ?? "100%",
    height: Height,

    backgroundColor: Resolved_Background_Color,
    color: Resolved_Text_Color,

    borderRadius: Resolved_Border_Radius,

    borderWidth: Resolved_Border_Width,
    borderStyle: Resolved_Border_Width > 0 ? "solid" : "none",
    borderColor: Resolved_Border_Color,

    paddingTop: Resolved_Padding.Top,
    paddingRight: Resolved_Padding.Right,
    paddingBottom: Resolved_Padding.Bottom,
    paddingLeft: Resolved_Padding.Left,

    marginTop: Resolved_Margin.Top,
    marginRight: Resolved_Margin.Right,
    marginBottom: Resolved_Margin.Bottom,
    marginLeft: Resolved_Margin.Left,

    gap: Resolved_Gap,

    ...Style_Properties,
  };

  return (
    <div
      className={Class_Name_String}
      style={Container_Style}
    >
      {children}
    </div>
  );
};

export default Container;