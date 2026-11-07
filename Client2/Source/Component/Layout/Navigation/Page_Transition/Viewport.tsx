import React from "react";

import {
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import {
  Use_Page_Transition,
} from "./Context";

import Settings from "./Settings";

import {
  Theme_Context,
} from "@/Context/Theme";

interface Viewport_Properties {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

// Dit is het gebied ONDER de header. De overlay zelf wordt getekend door
// Page_Transition_Overlay_Host (in _layout.tsx), die precies over dit
// gebied wordt gelegd.
//
// Laagvolgorde: achtergrond = 1, pagina-inhoud = 2. Dit werkt alleen als
// de pagina's zelf transparant zijn (geen witte contentStyle/sceneStyle).
export const Page_Transition_Viewport = ({
  children,
  style,
}: Viewport_Properties) => {

  const {
    Viewport_Ref,
    Handle_Viewport_Layout,
    Is_Covered,
  } = Use_Page_Transition();

  return (
    <View
      ref={Viewport_Ref}
      collapsable={false}
      onLayout={Handle_Viewport_Layout}
      style={[
        {
          flex: 1,
          position: "relative",
        },
        style,
      ]}
    >
      {Is_Covered && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: Settings.Padding_Horizontal,
            right: Settings.Padding_Horizontal,
            top: Settings.Padding_Top,
            bottom: Settings.Padding_Bottom,
            borderRadius: Settings.Border_Radius_Min,
            backgroundColor: Settings.End_Color,
            zIndex: 1,
          }}
        />
      )}

      <View
        style={{
          flex: 1,
          position: "relative",
          zIndex: 2,
        }}
      >
        <Theme_Context.Provider value={Is_Covered ? "Dark" : "Light"}>
          {children}
        </Theme_Context.Provider>
      </View>
    </View>
  );
};

export default Page_Transition_Viewport;