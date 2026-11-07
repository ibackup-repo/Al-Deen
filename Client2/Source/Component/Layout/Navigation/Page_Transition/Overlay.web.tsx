import React from "react";

import {
  View,
  StyleSheet,
} from "react-native";

import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  interpolateColor,
} from "react-native-reanimated";

import type {
  Page_Transition_Origin,
} from "./Types";

import Settings from "./Settings";

interface Overlay_Properties {
  Visible: boolean;
  Origin: Page_Transition_Origin | null;
  Progress: SharedValue<number>;
  Opacity: SharedValue<number>;
  Label: string;
  Start_Color: string;
  Root_Width: number;
  Root_Height: number;
}

// Kiest zwart of wit als tekstkleur, zodat het label leesbaar is
// op een vorm met de gegeven (hex) achtergrondkleur.
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

  const Luminance = (0.299 * R + 0.587 * G + 0.114 * B) / 255;

  return Luminance > 0.5 ? "#000000" : "#FFFFFF";

};

// Web-versie: gewone Views, zonder Skia. Metro kiest dit bestand automatisch
// op web (Overlay.web.tsx), en Overlay.tsx (Skia) op iOS en Android.
// Zo komt @shopify/react-native-skia niet in de hoofd-bundel van web, en
// blijft jouw eigen lazy laden van CanvasKit voor Fluid ongemoeid.
export const Page_Transition_Overlay = ({
  Visible,
  Origin,
  Progress,
  Opacity,
  Label,
  Start_Color,
  Root_Width,
  Root_Height,
}: Overlay_Properties) => {

  const Start_X = Origin?.X ?? 0;
  const Start_Y = Origin?.Y ?? 0;
  const Start_Width = Origin?.Width ?? 0;
  const Start_Height = Origin?.Height ?? 0;

  const End_X = Settings.Padding_Horizontal;
  const End_Y = Settings.Padding_Top;

  const End_Width = Math.max(
    0,
    Root_Width - Settings.Padding_Horizontal * 2
  );

  const End_Height = Math.max(
    0,
    Root_Height -
      Settings.Padding_Top -
      Settings.Padding_Bottom
  );

  const Start_Radius = Origin
    ? Math.min(
        Settings.Border_Radius_Max,
        Origin.Width / 2,
        Origin.Height / 2
      )
    : Settings.Border_Radius_Min;

  const End_Radius = Settings.Border_Radius_Min;

  const End_Color = Settings.End_Color;

  const Label_Start_Color = Get_Contrast_Color(Start_Color);
  const Label_End_Color = Get_Contrast_Color(End_Color);

  const Animated_Style = useAnimatedStyle(() => {
    const P = Progress.value;

    return {
      left: interpolate(P, [0, 1], [Start_X, End_X]),
      top: interpolate(P, [0, 1], [Start_Y, End_Y]),
      width: interpolate(P, [0, 1], [Start_Width, End_Width]),
      height: interpolate(P, [0, 1], [Start_Height, End_Height]),

      borderRadius: interpolate(
        P,
        [0, 1],
        [Start_Radius, End_Radius]
      ),

      backgroundColor: interpolateColor(
        P,
        [0, 1],
        [Start_Color, End_Color]
      ),

      opacity: Opacity.value,
    };
  });

  const Animated_Label_Style = useAnimatedStyle(() => {
    return {
      color: interpolateColor(
        Progress.value,
        [0, 1],
        [Label_Start_Color, Label_End_Color]
      ),

      opacity: interpolate(
        Progress.value,
        [0, 0.2, 1],
        [1, 1, 0]
      ),
    };
  });

  if (!Visible || !Origin) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={StyleSheet.absoluteFillObject}
    >
      <Animated.View
        pointerEvents="auto"
        style={[
          {
            position: "absolute",
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
          },
          Animated_Style,
        ]}
      >
        <Animated.Text
          numberOfLines={1}
          style={[
            {
              fontSize: 14,
              fontWeight: "700",
              textTransform: "uppercase",
            },
            Animated_Label_Style,
          ]}
        >
          {Label}
        </Animated.Text>
      </Animated.View>
    </View>
  );
};

export default Page_Transition_Overlay;