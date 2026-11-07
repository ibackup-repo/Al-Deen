import type React from "react";
import type { View } from "react-native";
import type { SharedValue } from "react-native-reanimated";

export interface Page_Transition_Origin {
  X: number;
  Y: number;
  Width: number;
  Height: number;
  Border_Radius: number;
}

export interface Page_Transition_Entry {
  From_Path: string;
  To_Path: string;
  Origin: Page_Transition_Origin;
  Label: string;

  // Kleur van de overlay aan de startkant (de kleur van de knop).
  Start_Color: string;
}

export interface Page_Transition_Overlay_State {
  Visible: boolean;
  Origin: Page_Transition_Origin | null;
  Label: string;
  Start_Color: string;
  Progress: SharedValue<number>;
  Opacity: SharedValue<number>;
  Width: number;
  Height: number;
}

// Stabiel: deze waarden veranderen nooit. Een component die alleen dit
// gebruikt, rendert dus nooit opnieuw door een transitie.
export interface Page_Transition_Actions_Type {
  Navigate_With_Transition: (
    Path: string,
    Origin: Page_Transition_Origin,
    Label: string,
    Navigate: () => void
  ) => void;

  Viewport_Ref: React.RefObject<View | null>;

  Handle_Viewport_Layout: (Event: any) => void;
}

// Verandert twee keer per transitie (Is_Transitioning) en bij het wisselen
// van de achtergrond (Is_Covered). Bevat ook alle stabiele acties.
export interface Page_Transition_Context_Type
  extends Page_Transition_Actions_Type {
  Is_Transitioning: boolean;

  // true: de pagina staat op de blijvende (donkere) achtergrond.
  Is_Covered: boolean;
}