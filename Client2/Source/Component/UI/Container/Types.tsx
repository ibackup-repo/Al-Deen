import React from "react";

export type Container_Variant = "Primary" | "Secondary";

export type Container_Preset_Name = "Default";

export interface Spacing_Configuration {
  Top: number;
  Right: number;
  Bottom: number;
  Left: number;
}

export interface Container_Configuration {
  BG_Color: string;
  Text_Color: string;

  Border_Color: string;
  Border_Width: number;
  Border_Radius: number;

  Padding: Spacing_Configuration;
  Margin: Spacing_Configuration;

  Gap: number;

  Has_Border: boolean;
}

export type Container_Configuration_Map = Record<
  Container_Variant,
  Container_Configuration
>;

export interface Container_Properties {
  children?: React.ReactNode;

  Variant?: Container_Variant;

  Width?: React.CSSProperties["width"];
  Height?: React.CSSProperties["height"];

  Padding?: number;
  Padding_Horizontal?: number;
  Padding_Vertical?: number;

  Margin?: number;
  Gap?: number;

  Background_Color?: string;
  Text_Color?: string;

  Border_Color?: string;
  Border_Width?: number;
  Border_Radius?: number;

  Class_Name_String?: string;
  Style_Properties?: React.CSSProperties;
}