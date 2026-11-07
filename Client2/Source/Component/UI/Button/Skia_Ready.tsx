
import React, { useEffect, useState } from "react";
import { Platform } from "react-native";

// Alleen type-imports: deze laden Skia niet.
import type { Fluid_Properties } from "./Fluid";

type Fluid_Component_Type = React.ComponentType<Fluid_Properties>;

interface Skia_Components {
  Fluid: Fluid_Component_Type | null;
}

let Loaded_Components: Skia_Components | null = null;
let Load_Promise: Promise<Skia_Components | null> | null = null;

/**
 * Laadt Skia en daarna de Fluid-component.
 * Op web wordt CanvasKit eerst geïnitialiseerd.
 */
export function Preload_Skia_Components(): Promise<Skia_Components | null> {
  if (Loaded_Components) {
    return Promise.resolve(Loaded_Components);
  }

  if (!Load_Promise) {
    Load_Promise = (async () => {
      try {
        if (Platform.OS === "web") {
          const { LoadSkiaWeb } = await import(
            "@shopify/react-native-skia/lib/module/web"
          );

          await LoadSkiaWeb({
            locateFile: (File: string) =>
              File === "canvaskit.wasm"
                ? "/canvaskit-0.41.0.wasm"
                : `/${File}`,
          });
        }

        const Fluid_Module = await import("./Fluid");

        Loaded_Components = {
          Fluid: Fluid_Module.default,
        };

        return Loaded_Components;
      } catch (Error_Value) {
        console.error(
          "Skia/Fluid kon niet geladen worden:",
          Error_Value
        );

        Load_Promise = null;
        return null;
      }
    })();
  }

  return Load_Promise;
}

/** Bestaande API behouden. */
export function Preload_Skia(): Promise<Fluid_Component_Type | null> {
  return Preload_Skia_Components().then(
    (Components) => Components?.Fluid ?? null
  );
}

function Use_Skia_Component<T extends React.ComponentType<any>>(
  Select: (Components: Skia_Components) => T | null
): T | null {
  const [Component, Set_Component] = useState<T | null>(() =>
    Loaded_Components ? Select(Loaded_Components) : null
  );

  useEffect(() => {
    if (Component) return;

    let Is_Cancelled = false;

    Preload_Skia_Components().then((Components) => {
      const Next_Component = Components ? Select(Components) : null;

      if (!Is_Cancelled && Next_Component) {
        Set_Component(() => Next_Component);
      }
    });

    return () => {
      Is_Cancelled = true;
    };
  }, [Component, Select]);

  return Component;
}

const Select_Fluid = (Components: Skia_Components) =>
  Components.Fluid;

/** Fluid-component zodra Skia klaar is. */
export function Use_Fluid_Component(): Fluid_Component_Type | null {
  return Use_Skia_Component(Select_Fluid);
}
