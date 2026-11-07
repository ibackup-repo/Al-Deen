import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";

import {
  Button_Configuration_Map,
  Theme_Mode,
  Button_Variant,
  Button_State,
} from "@Web/Component/UI/Button/Types";

import {
  Default_Button_Configuration,
} from "@Web/Component/UI/Button/Preset/Default";

import type {
  Container_Configuration_Map,
} from "@Web/Component/UI/Container/Types";

import {
  Default_Container_Configuration,
} from "@Web/Component/UI/Container/Preset/Default";

/* ---------------------------------------------------------- */
/* LocalStorage                                               */
/* ---------------------------------------------------------- */

const BUTTON_STORAGE_KEY = "ui_button_customization";
const CONTAINER_STORAGE_KEY = "ui_container_customization";

/* ---------------------------------------------------------- */
/* Context Type                                               */
/* ---------------------------------------------------------- */

export interface UI_Context_Type {
  Button_Customization: Button_Configuration_Map;

  Container_Customization: Container_Configuration_Map;

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

  Set_Container_Full_Configuration: (
    New_Config: Container_Configuration_Map
  ) => void;

  Reset_To_Defaults: () => void;
}

/* ---------------------------------------------------------- */
/* Context                                                    */
/* ---------------------------------------------------------- */

const UI_Context = createContext<UI_Context_Type | undefined>(
  undefined
);

/* ---------------------------------------------------------- */
/* Provider                                                   */
/* ---------------------------------------------------------- */

export const UI: React.FC<{ children: React.ReactNode }> & {
  Provider: React.FC<{ children: React.ReactNode }>;
} = ({ children }) => {

  const [Button_Customization, Set_Button_Customization] =
    useState<Button_Configuration_Map>(
      Default_Button_Configuration
    );

  const [Container_Customization, Set_Container_Customization] =
    useState<Container_Configuration_Map>(
      Default_Container_Configuration
    );

  /* -------------------------------------------------------- */
  /* Load LocalStorage                                        */
  /* -------------------------------------------------------- */

  useEffect(() => {
    try {
      const Saved_Button_Config =
        localStorage.getItem(BUTTON_STORAGE_KEY);

      if (Saved_Button_Config) {
        Set_Button_Customization(
          JSON.parse(Saved_Button_Config)
        );
      }

      const Saved_Container_Config =
        localStorage.getItem(CONTAINER_STORAGE_KEY);

      if (Saved_Container_Config) {
        Set_Container_Customization(
          JSON.parse(Saved_Container_Config)
        );
      }

    } catch (Error) {
      console.error(
        "Fout bij het laden van UI instellingen:",
        Error
      );
    }
  }, []);

  /* -------------------------------------------------------- */
  /* Update Button Property                                   */
  /* -------------------------------------------------------- */

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
    ) => {

      Set_Button_Customization((Prev) => {

        const Updated: Button_Configuration_Map = {
          ...Prev,
          [Theme]: {
            ...Prev[Theme],
            [Variant]: {
              ...Prev[Theme]?.[Variant],
              [State]: {
                ...Prev[Theme]?.[Variant]?.[State],
                [Key]: Value,
              },
            },
          },
        };

        try {
          localStorage.setItem(
            BUTTON_STORAGE_KEY,
            JSON.stringify(Updated)
          );
        } catch (Error) {
          console.error(
            "Fout bij opslaan Button instellingen:",
            Error
          );
        }

        return Updated;
      });
    },
    []
  );

  /* -------------------------------------------------------- */
  /* Set Full Button Configuration                            */
  /* -------------------------------------------------------- */

  const Set_Button_Full_Configuration = useCallback(
    (New_Config: Button_Configuration_Map) => {

      Set_Button_Customization(New_Config);

      try {
        localStorage.setItem(
          BUTTON_STORAGE_KEY,
          JSON.stringify(New_Config)
        );
      } catch (Error) {
        console.error(
          "Fout bij opslaan Button configuratie:",
          Error
        );
      }
    },
    []
  );

  /* -------------------------------------------------------- */
  /* Set Full Container Configuration                         */
  /* -------------------------------------------------------- */

  const Set_Container_Full_Configuration = useCallback(
    (New_Config: Container_Configuration_Map) => {

      Set_Container_Customization(New_Config);

      try {
        localStorage.setItem(
          CONTAINER_STORAGE_KEY,
          JSON.stringify(New_Config)
        );
      } catch (Error) {
        console.error(
          "Fout bij opslaan Container configuratie:",
          Error
        );
      }
    },
    []
  );

  /* -------------------------------------------------------- */
  /* Reset Defaults                                           */
  /* -------------------------------------------------------- */

  const Reset_To_Defaults = useCallback(() => {

    Set_Button_Customization(
      JSON.parse(
        JSON.stringify(Default_Button_Configuration)
      )
    );

    Set_Container_Customization(
      JSON.parse(
        JSON.stringify(Default_Container_Configuration)
      )
    );

    try {
      localStorage.removeItem(BUTTON_STORAGE_KEY);
      localStorage.removeItem(CONTAINER_STORAGE_KEY);
    } catch (Error) {
      console.error(
        "Fout bij resetten van UI instellingen:",
        Error
      );
    }
  }, []);

  /* -------------------------------------------------------- */
  /* Context Value                                            */
  /* -------------------------------------------------------- */

  const contextValue = useMemo(
    () => ({
      Button_Customization,
      Container_Customization,

      Update_Button_Single_Property,

      Set_Button_Full_Configuration,
      Set_Container_Full_Configuration,

      Reset_To_Defaults,
    }),
    [
      Button_Customization,
      Container_Customization,
      Update_Button_Single_Property,
      Set_Button_Full_Configuration,
      Set_Container_Full_Configuration,
      Reset_To_Defaults,
    ]
  );

  return (
    <UI_Context.Provider value={contextValue}>
      {children}
    </UI_Context.Provider>
  );
};

/* ---------------------------------------------------------- */
/* Provider Alias                                             */
/* ---------------------------------------------------------- */

UI.Provider = UI;

/* ---------------------------------------------------------- */
/* Hook                                                       */
/* ---------------------------------------------------------- */

export const Use_UI = (): UI_Context_Type => {

  const Context = useContext(UI_Context);

  if (!Context) {
    throw new Error(
      "Use_UI moet binnen een UI component worden gebruikt"
    );
  }

  return Context;
};

export default UI;