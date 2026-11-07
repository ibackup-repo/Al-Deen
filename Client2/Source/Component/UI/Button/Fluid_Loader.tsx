import React from "react";
import { View } from "react-native";
import { WithSkiaWeb } from "@shopify/react-native-skia/lib/module/web";
import type { Fluid_Properties } from "./Fluid";

// Gewone vorm terwijl CanvasKit nog laadt (zelfde kleur en radius).
const Fallback: React.FC<Fluid_Properties> = ({
  Width,
  Height,
  Color,
  Border_Radius,
}) => (
  <View
    pointerEvents="none"
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: Width,
      height: Height,
      backgroundColor: Color,
      borderRadius: Border_Radius ?? Math.min(Width, Height) / 2,
      zIndex: 0,
    }}
  />
);

export const Fluid_Loader: React.FC<Fluid_Properties> = (Props) => (
  <WithSkiaWeb
    opts={{
      locateFile: (File: string) =>
        File === "canvaskit.wasm" ? "/canvaskit-0.41.0.wasm" : `/${File}`,
    }}
    getComponent={() => import("./Fluid")}
    fallback={<Fallback {...Props} />}
    componentProps={Props}
  />
);

export default Fluid_Loader;