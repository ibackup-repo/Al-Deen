import React from "react";

import {
  View,
  StyleSheet,
} from "react-native";

import {
  Canvas,
  Group,
  RoundedRect,
} from "@shopify/react-native-skia";

import Animated, {
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
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

// Hoogte van het vaste vak waarin het label staat.
const Label_Box_Height = 24;

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

// De vorm wordt getekend in een Skia-canvas: x, y, breedte, hoogte en radius
// zijn gewoon getallen op de UI-thread. Er is dus geen layout per frame
// (dat was de oorzaak van de lag met left/top/width/height op een View).
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

  /* ---------------------------------------------------------- */
  /* Losse getallen (veilig voor worklets op Android/iOS)       */
  /* ---------------------------------------------------------- */

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

  // Label: leesbaar op de startvorm, en op de eindkleur.
  const Label_Start_Color = Get_Contrast_Color(Start_Color);
  const Label_End_Color = Get_Contrast_Color(End_Color);

  /* ---------------------------------------------------------- */
  /* Skia-vorm (alles op de UI-thread)                          */
  /* ---------------------------------------------------------- */

  const Shape_X = useDerivedValue(
    () => interpolate(Progress.value, [0, 1], [Start_X, End_X]),
    [Progress, Start_X, End_X]
  );

  const Shape_Y = useDerivedValue(
    () => interpolate(Progress.value, [0, 1], [Start_Y, End_Y]),
    [Progress, Start_Y, End_Y]
  );

  const Shape_Width = useDerivedValue(
    () => interpolate(Progress.value, [0, 1], [Start_Width, End_Width]),
    [Progress, Start_Width, End_Width]
  );

  const Shape_Height = useDerivedValue(
    () => interpolate(Progress.value, [0, 1], [Start_Height, End_Height]),
    [Progress, Start_Height, End_Height]
  );

  const Shape_Radius = useDerivedValue(
    () => interpolate(Progress.value, [0, 1], [Start_Radius, End_Radius]),
    [Progress, Start_Radius, End_Radius]
  );

  const Shape_Color = useDerivedValue(
    () => interpolateColor(
      Progress.value,
      [0, 1],
      [Start_Color, End_Color]
    ),
    [Progress, Start_Color, End_Color]
  );

  /* ---------------------------------------------------------- */
  /* Label (alleen transform en opacity, dus geen layout)       */
  /* ---------------------------------------------------------- */

  const Animated_Label_Box_Style = useAnimatedStyle(() => {
    const P = Progress.value;

    const Center_X = interpolate(
      P,
      [0, 1],
      [Start_X + Start_Width / 2, End_X + End_Width / 2]
    );

    const Center_Y = interpolate(
      P,
      [0, 1],
      [Start_Y + Start_Height / 2, End_Y + End_Height / 2]
    );

    return {
      transform: [
        { translateX: Center_X - Root_Width / 2 },
        { translateY: Center_Y - Label_Box_Height / 2 },
      ],

      opacity: interpolate(
        P,
        [0, 0.2, 1],
        [1, 1, 0]
      ),
    };
  });

  const Animated_Label_Style = useAnimatedStyle(() => {
    return {
      color: interpolateColor(
        Progress.value,
        [0, 1],
        [Label_Start_Color, Label_End_Color]
      ),
    };
  });

  if (!Visible || !Origin) {
    return null;
  }

  return (
    <View
      pointerEvents={
        Settings.Disable_Click_During_Transition ? "auto" : "none"
      }
      style={StyleSheet.absoluteFill}
    >
      <Canvas
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      >
        <Group opacity={Opacity}>
          <RoundedRect
            x={Shape_X}
            y={Shape_Y}
            width={Shape_Width}
            height={Shape_Height}
            r={Shape_Radius}
            color={Shape_Color}
          />
        </Group>
      </Canvas>

      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            left: 0,
            top: 0,
            width: Root_Width,
            height: Label_Box_Height,
            alignItems: "center",
            justifyContent: "center",
          },
          Animated_Label_Box_Style,
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