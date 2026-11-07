import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  View,
  useWindowDimensions,
} from "react-native";

import {
  Use_Page_Transition_Actions,
  Use_Page_Transition_Overlay,
} from "./Context";

import {
  Page_Transition_Overlay,
} from "./Overlay";

interface Point_Type {
  X: number;
  Y: number;
}

const Same_Point = (
  Previous: Point_Type | null,
  X: number,
  Y: number
) => Previous && Previous.X === X && Previous.Y === Y
  ? Previous
  : { X, Y };

// Staat in _layout.tsx als laatste kind van de root, buiten Layout en
// buiten de Stack. Android tekent de overlay anders onder de native
// schermen. De laag wordt exact over de Viewport gelegd (onder de header)
// en knipt de overlay af, zodat die nooit over de header kan komen.
export const Page_Transition_Overlay_Host = () => {

  const { Viewport_Ref } = Use_Page_Transition_Actions();

  const Overlay_State = Use_Page_Transition_Overlay();

  const Screen = useWindowDimensions();

  const Host_Ref = useRef<View>(null);

  const [Host_Position, Set_Host_Position] =
    useState<Point_Type | null>(null);

  const [Viewport_Position, Set_Viewport_Position] =
    useState<Point_Type | null>(null);

  const Measure = useCallback(() => {

    Host_Ref.current?.measureInWindow((X, Y) => {
      Set_Host_Position((Previous) => Same_Point(Previous, X, Y));
    });

    Viewport_Ref.current?.measureInWindow((X, Y) => {
      Set_Viewport_Position((Previous) => Same_Point(Previous, X, Y));
    });

  }, [Viewport_Ref]);

  // Meten zodra de viewport zijn grootte krijgt en bij elke transitie.
  useEffect(() => {
    Measure();
  }, [
    Measure,
    Overlay_State.Width,
    Overlay_State.Height,
    Overlay_State.Visible,
  ]);

  const Ready =
    Host_Position !== null &&
    Viewport_Position !== null &&
    Overlay_State.Width > 0 &&
    Overlay_State.Height > 0;

  return (
    <View
      ref={Host_Ref}
      collapsable={false}
      pointerEvents="box-none"
      onLayout={Measure}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: Screen.width,
        height: Screen.height,
        zIndex: 1000,
        elevation: 100,
      }}
    >
      {Ready && (
        <View
          collapsable={false}
          pointerEvents="box-none"
          style={{
            position: "absolute",
            left: Viewport_Position.X - Host_Position.X,
            top: Viewport_Position.Y - Host_Position.Y,
            width: Overlay_State.Width,
            height: Overlay_State.Height,
            overflow: "hidden",
          }}
        >
          <Page_Transition_Overlay
            Visible={Overlay_State.Visible}
            Origin={Overlay_State.Origin}
            Progress={Overlay_State.Progress}
            Opacity={Overlay_State.Opacity}
            Label={Overlay_State.Label}
            Start_Color={Overlay_State.Start_Color}
            Root_Width={Overlay_State.Width}
            Root_Height={Overlay_State.Height}
          />
        </View>
      )}
    </View>
  );
};

export default Page_Transition_Overlay_Host;