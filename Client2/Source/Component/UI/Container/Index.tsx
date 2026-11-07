import React from "react";

import { Use_UI } from "@/Context/UI";

import type {
  Container_Properties,
  Container_Variant,
} from "./Types";

export const Container: React.FC<Container_Properties> = ({
  children,

  Width,
  Height,

  Variant = "Primary",

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

  const Current_Variant_Key: Container_Variant = Variant;

  const Configuration =
    Container_Customization[Current_Variant_Key];

  /* Kleuren en borders */

  const Resolved_Background_Color =
    Background_Color ?? Configuration.BG_Color;

  const Resolved_Text_Color =
    Text_Color ?? Configuration.Text_Color;

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