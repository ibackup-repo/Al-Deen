
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";

/* ------------------------------------------------------------------ */
/* Button imports                                                     */
/* ------------------------------------------------------------------ */

import type {
  Button_Configuration_Map,
  Theme_Mode,
  Button_Variant,
  Button_State,
} from "@/Component/UI/Button/Types";

import {
  Default_Button_Configuration,
} from "@/Component/UI/Button/Preset/Default";

/* ------------------------------------------------------------------ */
/* Container imports                                                  */
/* ------------------------------------------------------------------ */

import type {
  Container_Configuration,
  Container_Configuration_Map,
  Container_Variant,
} from "@/Component/UI/Container/Types";

import {
  Default_Container_Configuration,
} from "@/Component/UI/Container/Preset/Default";

/* ------------------------------------------------------------------ */
/* Utilities                                                          */
/* ------------------------------------------------------------------ */

import { Storage } from "@/Library/Storage";

/* ------------------------------------------------------------------ */
/* Storage keys                                                       */
/* ------------------------------------------------------------------ */

const BUTTON_STORAGE_KEY = "ui_button_customization";
const CONTAINER_STORAGE_KEY = "ui_container_customization_v3";

/* ------------------------------------------------------------------ */
/* Context type                                                       */
/* ------------------------------------------------------------------ */

export interface UI_Context_Type {
  /* Button */

  Button_Customization: Button_Configuration_Map;

  Update_Button_Single_Property: <
    S extends Button_State,
    K extends keyof Button_Configuration_Map[Theme_Mode][Button_Variant][S]
  >(
    Theme: Theme_Mode,
    Variant: Button_Variant,
    State: S,
    Key: K,
    Value: Button_Configuration_Map[Theme_Mode][Button_Variant][S][K]
  ) => void;

  Set_Button_Full_Configuration: (
    New_Config: Button_Configuration_Map
  ) => void;

  /* Container */

  Container_Customization: Container_Configuration_Map;

  Update_Container_Single_Property: <
    K extends keyof Container_Configuration
  >(
    Theme: Theme_Mode,
    Variant: Container_Variant,
    Key: K,
    Value: Container_Configuration[K]
  ) => void;

  Set_Container_Full_Configuration: (
    New_Config: Container_Configuration_Map
  ) => void;

  /* General */

  Reset_To_Defaults: () => void;
}

/* ------------------------------------------------------------------ */
/* Context                                                            */
/* ------------------------------------------------------------------ */

// Bewaar de context op globalThis, zodat Fast Refresh geen nieuwe
// aanmaakt. Anders vindt Use_UI na het opslaan van dit bestand geen
// provider meer.
const Global_Scope = globalThis as unknown as {
  __UI_Context?: React.Context<UI_Context_Type | undefined>;
};

const UI_Context = (Global_Scope.__UI_Context ??=
  createContext<UI_Context_Type | undefined>(undefined));

/* ------------------------------------------------------------------ */
/* Configuration cloning                                             */
/* ------------------------------------------------------------------ */

const Clone_Button_Configuration = (
  Configuration: Button_Configuration_Map
): Button_Configuration_Map => {
  return JSON.parse(
    JSON.stringify(Configuration)
  ) as Button_Configuration_Map;
};

const Clone_Container_Configuration = (
  Configuration: Container_Configuration_Map
): Container_Configuration_Map => {
  return JSON.parse(
    JSON.stringify(Configuration)
  ) as Container_Configuration_Map;
};

/* ------------------------------------------------------------------ */
/* Validation utilities                                               */
/* ------------------------------------------------------------------ */

const Is_Record = (
  Value: unknown
): Value is Record<string, unknown> => {
  return (
    typeof Value === "object" &&
    Value !== null &&
    !Array.isArray(Value)
  );
};

const Is_Number = (Value: unknown): Value is number => {
  return (
    typeof Value === "number" &&
    Number.isFinite(Value)
  );
};

/* ------------------------------------------------------------------ */
/* Button configuration validation                                    */
/* ------------------------------------------------------------------ */

const Is_Button_Configuration_Map = (
  Value: unknown
): Value is Button_Configuration_Map => {
  if (!Is_Record(Value)) {
    return false;
  }

  const Themes: Theme_Mode[] = ["Light", "Dark"];

  const Variants: Button_Variant[] = [
    "Primary",
    "Secondary",
  ];

  const States: Button_State[] = [
    "Default",
    "Hover",
    "Active",
  ];

  for (const Theme of Themes) {
    const Theme_Config = Value[Theme];

    if (!Is_Record(Theme_Config)) {
      return false;
    }

    for (const Variant of Variants) {
      const Variant_Config = Theme_Config[Variant];

      if (!Is_Record(Variant_Config)) {
        return false;
      }

      for (const State of States) {
        const State_Config = Variant_Config[State];

        if (!Is_Record(State_Config)) {
          return false;
        }
      }
    }
  }

  return true;
};

/* ------------------------------------------------------------------ */
/* Container configuration validation                                 */
/* ------------------------------------------------------------------ */

const Is_Spacing_Configuration = (
  Value: unknown
): boolean => {
  if (!Is_Record(Value)) {
    return false;
  }

  return (
    Is_Number(Value.Top) &&
    Is_Number(Value.Right) &&
    Is_Number(Value.Bottom) &&
    Is_Number(Value.Left)
  );
};

const Is_Container_Configuration = (
  Value: unknown
): Value is Container_Configuration => {
  if (!Is_Record(Value)) {
    return false;
  }

  return (
    typeof Value.BG_Color === "string" &&
    (Value.Text_Color === undefined || typeof Value.Text_Color === "string") &&
    typeof Value.Border_Color === "string" &&
    Is_Number(Value.Border_Width) &&
    Is_Number(Value.Border_Radius) &&
    Is_Spacing_Configuration(Value.Padding) &&
    Is_Spacing_Configuration(Value.Margin) &&
    Is_Number(Value.Gap) &&
    typeof Value.Has_Border === "boolean"
  );
};

const Is_Container_Configuration_Map = (
  Value: unknown
): Value is Container_Configuration_Map => {
  if (!Is_Record(Value)) {
    return false;
  }

  const Themes: Theme_Mode[] = ["Light", "Dark"];

  const Variants: Container_Variant[] = [
    "Primary",
    "Secondary",
  ];

  for (const Theme of Themes) {
    const Theme_Config = Value[Theme];

    if (!Is_Record(Theme_Config)) {
      return false;
    }

    for (const Variant of Variants) {
      const Variant_Config = Theme_Config[Variant];

      if (!Is_Container_Configuration(Variant_Config)) {
        return false;
      }
    }
  }

  return true;
};

/* ------------------------------------------------------------------ */
/* UI Provider                                                        */
/* ------------------------------------------------------------------ */

export const UI: React.FC<{ children: React.ReactNode }> & {
  Provider: React.FC<{ children: React.ReactNode }>;
} = ({ children }) => {

  /* -------------------------------------------------------------- */
  /* Button state                                                   */
  /* -------------------------------------------------------------- */

  const [Button_Customization, Set_Button_Customization] =
    useState<Button_Configuration_Map>(() =>
      Clone_Button_Configuration(
        Default_Button_Configuration
      )
    );

  /* -------------------------------------------------------------- */
  /* Container state                                                */
  /* -------------------------------------------------------------- */

  const [
    Container_Customization,
    Set_Container_Customization,
  ] = useState<Container_Configuration_Map>(() =>
    Clone_Container_Configuration(
      Default_Container_Configuration
    )
  );

  /* -------------------------------------------------------------- */
  /* Configuration loading                                          */
  /* -------------------------------------------------------------- */

  const [Configuration_Loaded, Set_Configuration_Loaded] =
    useState(false);

  useEffect(() => {
    let Is_Active = true;

    const Load_Saved_Config = async (): Promise<void> => {
      try {
        const [
          Saved_Button_Config,
          Saved_Container_Config,
        ] = await Promise.all([
          Storage.getItem(BUTTON_STORAGE_KEY),
          Storage.getItem(CONTAINER_STORAGE_KEY),
        ]);

        if (!Is_Active) {
          return;
        }

        /* Button */

        if (Saved_Button_Config) {
          const Parsed_Button_Config: unknown =
            JSON.parse(Saved_Button_Config);

          if (
            Is_Button_Configuration_Map(
              Parsed_Button_Config
            )
          ) {
            Set_Button_Customization(
              Parsed_Button_Config
            );
          } else {
            console.warn(
              "De opgeslagen buttonconfiguratie heeft een ongeldig formaat."
            );
          }
        }

        /* Container */

        if (Saved_Container_Config) {
          const Parsed_Container_Config: unknown =
            JSON.parse(Saved_Container_Config);

          if (
            Is_Container_Configuration_Map(
              Parsed_Container_Config
            )
          ) {
            // Migreer oudere opgeslagen configuraties die nog geen
            // Text_Color bevatten, zonder bestaande aanpassingen te verliezen.
            const Migrated_Container_Config =
              Clone_Container_Configuration(Default_Container_Configuration);

            const Themes: Theme_Mode[] = ["Light", "Dark"];
            const Variants: Container_Variant[] = ["Primary", "Secondary"];

            for (const Theme of Themes) {
              for (const Variant of Variants) {
                Migrated_Container_Config[Theme][Variant] = {
                  ...Migrated_Container_Config[Theme][Variant],
                  ...Parsed_Container_Config[Theme][Variant],
                  Text_Color:
                    Parsed_Container_Config[Theme][Variant].Text_Color ??
                    Default_Container_Configuration[Theme][Variant].Text_Color,
                };
              }
            }

            Set_Container_Customization(Migrated_Container_Config);
          } else {
            console.warn(
              "De opgeslagen containerconfiguratie heeft een ongeldig formaat."
            );
          }
        }
      } catch (Error) {
        console.error(
          "Fout bij het laden van UI-instellingen:",
          Error
        );
      } finally {
        if (Is_Active) {
          Set_Configuration_Loaded(true);
        }
      }
    };

    Load_Saved_Config();

    return () => {
      Is_Active = false;
    };
  }, []);

  /* -------------------------------------------------------------- */
  /* Button persistence                                             */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    if (!Configuration_Loaded) {
      return;
    }

    Storage.setItem(
      BUTTON_STORAGE_KEY,
      JSON.stringify(Button_Customization)
    ).catch((Error) => {
      console.error(
        "Fout bij het opslaan van buttoninstellingen:",
        Error
      );
    });
  }, [
    Button_Customization,
    Configuration_Loaded,
  ]);

  /* -------------------------------------------------------------- */
  /* Container persistence                                          */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    if (!Configuration_Loaded) {
      return;
    }

    Storage.setItem(
      CONTAINER_STORAGE_KEY,
      JSON.stringify(Container_Customization)
    ).catch((Error) => {
      console.error(
        "Fout bij het opslaan van containerinstellingen:",
        Error
      );
    });
  }, [
    Container_Customization,
    Configuration_Loaded,
  ]);

  /* -------------------------------------------------------------- */
  /* Update Button single property                                  */
  /* -------------------------------------------------------------- */

  const Update_Button_Single_Property = useCallback(
    <
      S extends Button_State,
      K extends keyof Button_Configuration_Map[Theme_Mode][Button_Variant][S]
    >(
      Theme: Theme_Mode,
      Variant: Button_Variant,
      State: S,
      Key: K,
      Value: Button_Configuration_Map[Theme_Mode][Button_Variant][S][K]
    ): void => {
      Set_Button_Customization((Previous) => {
        return {
          ...Previous,

          [Theme]: {
            ...Previous[Theme],

            [Variant]: {
              ...Previous[Theme][Variant],

              [State]: {
                ...Previous[Theme][Variant][State],

                [Key]: Value,
              },
            },
          },
        } as Button_Configuration_Map;
      });
    },
    []
  );

  /* -------------------------------------------------------------- */
  /* Set Button full configuration                                  */
  /* -------------------------------------------------------------- */

  const Set_Button_Full_Configuration = useCallback(
    (New_Config: Button_Configuration_Map): void => {
      Set_Button_Customization(
        Clone_Button_Configuration(New_Config)
      );
    },
    []
  );

  /* -------------------------------------------------------------- */
  /* Update Container single property                               */
  /* -------------------------------------------------------------- */

  const Update_Container_Single_Property = useCallback(
    <K extends keyof Container_Configuration>(
      Theme: Theme_Mode,
      Variant: Container_Variant,
      Key: K,
      Value: Container_Configuration[K]
    ): void => {
      Set_Container_Customization((Previous) => {
        return {
          ...Previous,

          [Theme]: {
            ...Previous[Theme],

            [Variant]: {
              ...Previous[Theme][Variant],

              [Key]: Value,
            },
          },
        };
      });
    },
    []
  );

  /* -------------------------------------------------------------- */
  /* Set Container full configuration                               */
  /* -------------------------------------------------------------- */

  const Set_Container_Full_Configuration = useCallback(
    (New_Config: Container_Configuration_Map): void => {
      Set_Container_Customization(
        Clone_Container_Configuration(New_Config)
      );
    },
    []
  );

  /* -------------------------------------------------------------- */
  /* Reset all configurations                                       */
  /* -------------------------------------------------------------- */

  const Reset_To_Defaults = useCallback((): void => {
    Set_Button_Customization(
      Clone_Button_Configuration(
        Default_Button_Configuration
      )
    );

    Set_Container_Customization(
      Clone_Container_Configuration(
        Default_Container_Configuration
      )
    );
  }, []);

  /* -------------------------------------------------------------- */
  /* Context value                                                   */
  /* -------------------------------------------------------------- */

  const Context_Value = useMemo<UI_Context_Type>(
    () => ({
      /* Button */

      Button_Customization,
      Update_Button_Single_Property,
      Set_Button_Full_Configuration,

      /* Container */

      Container_Customization,
      Update_Container_Single_Property,
      Set_Container_Full_Configuration,

      /* General */

      Reset_To_Defaults,
    }),
    [
      Button_Customization,
      Update_Button_Single_Property,
      Set_Button_Full_Configuration,

      Container_Customization,
      Update_Container_Single_Property,
      Set_Container_Full_Configuration,

      Reset_To_Defaults,
    ]
  );

  /* -------------------------------------------------------------- */
  /* Provider render                                                 */
  /* -------------------------------------------------------------- */

  return (
    <UI_Context.Provider value={Context_Value}>
      {children}
    </UI_Context.Provider>
  );
};

UI.Provider = UI;

/* ------------------------------------------------------------------ */
/* Use UI                                                              */
/* ------------------------------------------------------------------ */

export const Use_UI = (): UI_Context_Type => {
  const Context = useContext(UI_Context);

  if (!Context) {
    throw new Error(
      "Use_UI moet binnen een UI.Provider worden gebruikt."
    );
  }

  return Context;
};

export default UI;
