import React, {
  useState,
  useRef,
  useCallback,
  useContext,
  useEffect,
} from "react";

import {
  View,
  Text,
  Pressable,
} from "react-native";

import { useRouter, type Href } from "expo-router";

import { Class_Names } from "@/Library/Utility";

import {
  Page_Transition_Context,
} from "@/Component/Layout/Navigation/Page_Transition/Context";

import Page_Transition_Settings from "@/Component/Layout/Navigation/Page_Transition/Settings";

import { Use_Theme } from "@/Context/Theme";

import {
  Button_Variant,
  Button_State,
  Theme_Mode,
} from "./Types";

import {
  Default_Button_Configuration,
} from "./Preset/Default";

import type {
  Gooey_Configuration,
} from "./Fluid";

import {
  Use_Fluid_Component,
} from "./Skia_Ready";

export interface Button_Properties {
  Label?: string | React.ReactNode;
  Icon?: React.ReactNode;
  On_Click?: () => void;

  // Navigatie met paginatransitie. Beide namen werken.
  Navigate_To?: string;
  Path?: string;
  Transition_Border_Radius?: number;

  Height?: number;
  Width?: number;
  Variant?: Button_Variant;

  // Overschrijft het thema uit Theme_Context voor alleen deze knop.
  Theme?: Theme_Mode;

  Color?: string;
  Text_Color?: string;
  Size?: "default" | "icon" | "sm" | "lg";
  Class_Name_String?: string;
  Style_Properties?: any;
  Active?: boolean;
  "aria-label"?: string;
}

const Default_Fluid: Gooey_Configuration =
  Default_Button_Configuration.Light.Primary.Hover.Gooey;

export const Button: React.FC<Button_Properties> = ({
  Label,
  Icon,
  On_Click,
  Navigate_To,
  Path,
  Transition_Border_Radius,
  Height = 48,
  Width,
  Variant = "Primary",
  Theme,
  Color,
  Text_Color,
  Size = "default",
  Class_Name_String,
  Style_Properties,
  Active = false,
  "aria-label": Aria_Label,
}) => {
  /* -------------------------------------------------------------- */
  /* Navigatie en paginatransitie                                   */
  /* -------------------------------------------------------------- */

  const Router = useRouter();

  // Bewust useContext: buiten de provider is dit undefined en
  // navigeert de knop gewoon zonder animatie.
  const Transition = useContext(Page_Transition_Context);

  const Container_Ref = useRef<View>(null);

  const Destination = Navigate_To ?? Path;

  /* -------------------------------------------------------------- */
  /* Interactie                                                     */
  /* -------------------------------------------------------------- */

  const [Is_Hovered, Set_Is_Hovered] = useState(false);
  const [Is_Pressed, Set_Is_Pressed] = useState(false);

  const Is_Visually_Active = Active || Is_Hovered;

  /* -------------------------------------------------------------- */
  /* Afmetingen                                                     */
  /* -------------------------------------------------------------- */

  const [Measured_Width, Set_Measured_Width] =
    useState<number | null>(null);

  /* -------------------------------------------------------------- */
  /* Gooey-status                                                   */
  /* -------------------------------------------------------------- */

  const [Gooey_Mode, Set_Gooey_Mode] = useState(false);
  const [Fluid_Ready, Set_Fluid_Ready] = useState(false);

  /* -------------------------------------------------------------- */
  /* Configuratie                                                   */
  /* -------------------------------------------------------------- */

  // Volgorde: Theme-prop op de knop, dan Theme_Context, dan "Light".
  const Context_Theme = Use_Theme();

  const Active_Theme_Key: Theme_Mode = Theme ?? Context_Theme;

  const Current_State_Key: Button_State = Is_Pressed
    ? "Active"
    : Is_Visually_Active
    ? "Hover"
    : "Default";

  const Configuration =
    Default_Button_Configuration[Active_Theme_Key][Variant][
      Current_State_Key
    ];

  /* -------------------------------------------------------------- */
  /* Opgeloste eigenschappen                                        */
  /* -------------------------------------------------------------- */

  const Resolved_Background_Color =
    Color || Configuration.BG_Color || "#ffffff";

  const Resolved_Text_Color =
    Text_Color || Configuration.Text_Color || "#0f172a";

  const Resolved_Border_Radius =
    Configuration.Border_Radius ?? 12;

  const Resolved_Has_Border =
    Configuration.Has_Border ?? false;

  const Resolved_Border_Color =
    Configuration.Border_Color || "transparent";

  // Iconen (lucide) die geen eigen kleur hebben krijgen de tekstkleur van
  // de knop. Web erft die via CSS (currentColor), Android niet. Zo is het
  // op beide platformen hetzelfde.
  const Tint = (Node: React.ReactNode): React.ReactNode =>
    React.isValidElement<{ color?: string }>(Node) &&
    Node.props.color === undefined
      ? React.cloneElement(Node, { color: Resolved_Text_Color })
      : Node;

  /* -------------------------------------------------------------- */
  /* Klik: gewoon, of navigeren met transitie                       */
  /* -------------------------------------------------------------- */

  const Handle_Press = () => {

    // Geen bestemming: een gewone knop.
    if (!Destination) {
      On_Click?.();
      return;
    }

    if (
      Transition?.Is_Transitioning &&
      Page_Transition_Settings.Disable_Click_During_Transition
    ) {
      return;
    }

    if (!Destination.startsWith("/")) {
      console.warn("Ongeldige bestemming voor knop:", Destination);
      return;
    }

    On_Click?.();

    const Go = () => {
      Router.push(Destination as Href);
    };

    // Geen provider, transitie uit, of nog niet gemeten: direct navigeren.
    if (
      !Transition ||
      !Page_Transition_Settings.Enabled ||
      !Container_Ref.current
    ) {
      Go();
      return;
    }

    Container_Ref.current.measureInWindow(
      (X, Y, Measured_W, Measured_H) => {

        if (Measured_W <= 0 || Measured_H <= 0) {
          Go();
          return;
        }

        Transition.Navigate_With_Transition(
          Destination,
          {
            X,
            Y,
            Width: Measured_W,
            Height: Measured_H,
            Border_Radius:
              Transition_Border_Radius ?? Resolved_Border_Radius,
          },
          typeof Label === "string" ? Label : "",
          Go
        );

      }
    );
  };

  /* -------------------------------------------------------------- */
  /* Skia-component                                                 */
  /* -------------------------------------------------------------- */

  const Fluid_Component = Use_Fluid_Component();

  /* -------------------------------------------------------------- */
  /* Effect-activering                                              */
  /* -------------------------------------------------------------- */

  const Gooey_Enabled =
    Fluid_Component !== null &&
    Configuration.Gooey?.Enabled === true;

  useEffect(() => {
    if (Gooey_Enabled) {
      Set_Gooey_Mode(true);
    } else {
      Set_Gooey_Mode(false);
      Set_Fluid_Ready(false);
    }
  }, [Gooey_Enabled]);

  const Fluid_Configuration_Data: Gooey_Configuration =
    Configuration.Gooey ?? Default_Fluid;

  /* -------------------------------------------------------------- */
  /* Laatste status voor callbacks                                  */
  /* -------------------------------------------------------------- */

  const Latest_Reference = useRef({
    Gooey_Enabled,
    Is_Hovered,
    Is_Pressed,
    Active,
  });

  Latest_Reference.current = {
    Gooey_Enabled,
    Is_Hovered,
    Is_Pressed,
    Active,
  };

  /* -------------------------------------------------------------- */
  /* Gooey callbacks                                                */
  /* -------------------------------------------------------------- */

  const Handle_Fluid_Ready = useCallback(() => {
    Set_Fluid_Ready(true);
  }, []);

  const Handle_Fluid_Settled = useCallback(() => {
    const Latest = Latest_Reference.current;

    if (
      Latest.Gooey_Enabled ||
      Latest.Is_Hovered ||
      Latest.Is_Pressed ||
      Latest.Active
    ) {
      return;
    }

    Set_Gooey_Mode(false);
    Set_Fluid_Ready(false);
  }, []);

  /* -------------------------------------------------------------- */
  /* Afmetingen en spacing                                          */
  /* -------------------------------------------------------------- */

  const Padding = Configuration.Padding ?? {
    Top: 12,
    Right: 16,
    Bottom: 12,
    Left: 16,
  };

  const Margin = Configuration.Margin ?? {
    Top: 0,
    Right: 0,
    Bottom: 0,
    Left: 0,
  };

  const Is_Icon_Only =
    Size === "icon" || (!Label && !!Icon);

  const Actual_Height =
    Size === "sm"
      ? 32
      : Size === "lg"
      ? 48
      : Size === "icon"
      ? 48
      : Height;

  const Actual_Width =
    Is_Icon_Only ? Actual_Height : Width;

  const Effective_Canvas_Width =
    Actual_Width ?? Measured_Width;

  /* -------------------------------------------------------------- */
  /* Canvas-weergave                                                */
  /* -------------------------------------------------------------- */

  const Show_Fluid =
    Gooey_Enabled &&
    Gooey_Mode &&
    Fluid_Component !== null &&
    Effective_Canvas_Width !== null &&
    Effective_Canvas_Width > 0;

  const Background_Is_Fluid =
    Show_Fluid && Fluid_Ready;

  /* -------------------------------------------------------------- */
  /* Accessibility                                                  */
  /* -------------------------------------------------------------- */

  const Resolved_Aria_Label =
    Aria_Label ||
    (typeof Label === "string" ? Label : undefined);

  /* -------------------------------------------------------------- */
  /* Render                                                         */
  /* -------------------------------------------------------------- */

  return (
    <View
      ref={Container_Ref}
      collapsable={false}
      style={{
        position: "relative",
        width: "100%",
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={Resolved_Aria_Label}
        accessibilityState={{
          selected: Active,
        }}
        className={Class_Names(
          "flex-row items-center justify-center relative select-none",
          Class_Name_String
        )}
        style={[
          {
            width: Actual_Width ? Actual_Width : "100%",
            height: Actual_Height,
            borderRadius: Resolved_Border_Radius,

            backgroundColor: Background_Is_Fluid
              ? "transparent"
              : Resolved_Background_Color,

            borderWidth: Resolved_Has_Border ? 2 : 0,
            borderColor: Resolved_Border_Color,

            paddingTop: Padding.Top,
            paddingRight: Padding.Right,
            paddingBottom: Padding.Bottom,
            paddingLeft: Padding.Left,

            marginTop: Margin.Top,
            marginRight: Margin.Right,
            marginBottom: Margin.Bottom,
            marginLeft: Margin.Left,
          },
          Style_Properties,
        ]}
        onLayout={(Event) => {
          if (Actual_Width === undefined) {
            const New_Width = Event.nativeEvent.layout.width;

            if (New_Width > 0) {
              Set_Measured_Width(New_Width);
            }
          }
        }}
        onHoverIn={() => Set_Is_Hovered(true)}
        onHoverOut={() => {
          Set_Is_Hovered(false);
          Set_Is_Pressed(false);
        }}
        onPressIn={() => Set_Is_Pressed(true)}
        onPressOut={() => Set_Is_Pressed(false)}
        onPress={Handle_Press}
      >
        {/* Gooey / Fluid */}

        {Show_Fluid &&
          Fluid_Component &&
          Effective_Canvas_Width !== null && (
            <Fluid_Component
              Is_Hovered={Is_Visually_Active}
              Is_Pressed={Is_Pressed}
              Width={Effective_Canvas_Width}
              Height={Actual_Height}
              Color={Resolved_Background_Color}
              Configuration={Fluid_Configuration_Data}
              Border_Radius={Resolved_Border_Radius}
              On_Settled={Handle_Fluid_Settled}
              On_Ready={Handle_Fluid_Ready}
            />
          )}

        {/* Knoptekst en icoon */}

        <View
          style={{
            position: "relative",
            zIndex: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            width: "100%",
            height: "100%",
          }}
        >
          {Tint(Icon)}

          {Label && (
            <Text
              style={{
                color: Resolved_Text_Color,
                fontWeight: "700",
                fontSize: 14,
                letterSpacing: 0.5,
                textAlign: "center",
                textTransform: "uppercase",
              }}
            >
              {Tint(Label)}
            </Text>
          )}
        </View>
      </Pressable>
    </View>
  );
};

export default Button;