export type Theme_Mode = "Light" | "Dark";
export type Button_Variant = "Primary" | "Secondary";
export type Button_State = "Default" | "Hover" | "Active";

export interface Spacing_Configuration {
  Top: number;
  Right: number;
  Bottom: number;
  Left: number;
}

interface Gooey_Configuration {
  Enabled: boolean;
  Blur: number;
  Contrast: number;

  Canvas_Padding: number;
  Draw_Body: boolean;
  Wave_Frequency: number;
  Spring_Stiffness: number;
  Spring_Damping: number;
}

export interface Gooey_Default_Configuration extends Gooey_Configuration {
  Rest_Outline_Amplitude: number;
}

export interface Gooey_Hover_Configuration extends Gooey_Configuration {
  Wave_Amplitude: number;
  Rest_Outline_Amplitude: number;
  Scale_Breathe_Amplitude: number;
  Friction: number;
  Attraction: number;
  Attraction_Jitter: number;
  Droplet_Min_Radius: number;
  Droplet_Max_Radius: number;
  Hover_Splash_Min: number;
  Hover_Splash_Max: number;
  Hover_Splash_Intensity: number;
  Release_Splash_Min: number;
  Release_Splash_Max: number;
  Release_Splash_Intensity: number;
}

export interface Gooey_Active_Configuration extends Gooey_Configuration {
  Wave_Amplitude: number;
  Press_Scale_X: number;
  Press_Scale_Y: number;
  Friction: number;
  Attraction: number;
  Attraction_Jitter: number;
  Droplet_Min_Radius: number;
  Droplet_Max_Radius: number;
  Press_Splash_Min: number;
  Press_Splash_Max: number;
  Press_Splash_Intensity: number;
}

interface Button_Fields {
  BG_Color: string;
  Text_Color: string;
  Border_Radius: number;
  Has_Border: boolean;
  Border_Color: string;
  Padding: Spacing_Configuration;
  Margin: Spacing_Configuration;
}

export interface Button_Default_Configuration extends Button_Fields {
  Gooey: Gooey_Default_Configuration;
}

export interface Button_Hover_Configuration extends Button_Fields {
  Gooey: Gooey_Hover_Configuration;
}

export interface Button_Active_Configuration extends Button_Fields {
  Gooey: Gooey_Active_Configuration;
}

export type Button_Configuration_Map = {
  [Theme in Theme_Mode]: {
    [Variant in Button_Variant]: {
      Default: Button_Default_Configuration;
      Hover: Button_Hover_Configuration;
      Active: Button_Active_Configuration;
    };
  };
};