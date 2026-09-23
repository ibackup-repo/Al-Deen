import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import {
  Button_Configuration_Map,
  Theme_Mode,
  Button_Variant,
  Button_State,
} from "@Web/Component/UI/Button/Types";
import { Default_Button_Configuration } from "@Web/Component/UI/Button/Preset/Default";

export interface UI_Context_Type {
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
  Reset_To_Defaults: () => void;
}

const LOCAL_STORAGE_KEY = "ui_button_customization";

const UI_Context = createContext<UI_Context_Type | undefined>(undefined);

export const UI_Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [Button_Customization, Set_Button_Customization] = useState<Button_Configuration_Map>(
    Default_Button_Configuration
  );

  useEffect(() => {
    try {
      const Saved_Config = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (Saved_Config) {
        Set_Button_Customization(JSON.parse(Saved_Config));
      }
    } catch (Error) {
      console.error("Fout bij het laden van UI instellingen uit LocalStorage:", Error);
    }
  }, []);

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
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(Updated));
        } catch (Error) {
          console.error("Fout bij opslaan in LocalStorage:", Error);
        }

        return Updated;
      });
    },
    []
  );

  const Reset_To_Defaults = useCallback(() => {
    Set_Button_Customization(JSON.parse(JSON.stringify(Default_Button_Configuration)));
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (Error) {
      console.error("Fout bij verwijderen uit LocalStorage:", Error);
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      Button_Customization,
      Update_Button_Single_Property,
      Reset_To_Defaults,
    }),
    [Button_Customization, Update_Button_Single_Property, Reset_To_Defaults]
  );

  return <UI_Context.Provider value={contextValue}>{children}</UI_Context.Provider>;
};

export const Use_UI = (): UI_Context_Type => {
  const Context = useContext(UI_Context);
  if (!Context) {
    throw new Error("Use_UI moet binnen een UI_Provider worden gebruikt");
  }
  return Context;
};