import React, { useState, useCallback } from "react";
import { Use_App } from "@Web/Context/App";
import { Use_UI, UI_Provider, UI_Context_Type } from "@Web/Context/UI";
import {
  Button_Variant,
  Button_State,
  Theme_Mode,
  Button_Configuration_Map,
  Gooey_Default_Configuration,
  Gooey_Hover_Configuration,
  Gooey_Active_Configuration,
} from "@Web/Component/UI/Button/Types";
import { Default_Button_Configuration } from "@Web/Component/UI/Button/Preset/Default";
import { Gooey_Configuration } from "@Web/Component/UI/Button/Fluid";
import { Button as CustomButton } from "@Web/Component/UI/Button/Index";
import { Accordion_Item } from "@Web/Component/UI/Accordion/Index";

const Variants: Button_Variant[] = ["Primary", "Secondary"];
const States: Button_State[] = ["Default", "Hover", "Active"];
const Directions = ["Top", "Right", "Bottom", "Left"] as const;

type Preset_Option = "Default" | "Glassmorphism" | "Flat";

type All_Gooey_Fields = Gooey_Default_Configuration &
  Gooey_Hover_Configuration &
  Gooey_Active_Configuration;

type Fluid_Number_Key = Exclude<keyof All_Gooey_Fields, "Enabled" | "Draw_Body">;

interface Fluid_Field {
  Key: Fluid_Number_Key;
  Label: string;
  Min: number;
  Max: number;
  Step: number;
}

const Fluid_Groups: { Title: string; Fields: Fluid_Field[] }[] = [
  {
    Title: "Shape",
    Fields: [
      { Key: "Canvas_Padding", Label: "Canvas Padding", Min: 0, Max: 100, Step: 1 },
      { Key: "Wave_Amplitude", Label: "Wave Amplitude (hover)", Min: 0, Max: 10, Step: 0.1 },
      { Key: "Rest_Outline_Amplitude", Label: "Rest Amplitude", Min: 0, Max: 5, Step: 0.1 },
      { Key: "Wave_Frequency", Label: "Wave Frequency", Min: 0, Max: 0.2, Step: 0.01 },
      { Key: "Scale_Breathe_Amplitude", Label: "Breathe Amplitude", Min: 0, Max: 0.2, Step: 0.01 },
    ],
  },
  {
    Title: "Droplets",
    Fields: [
      { Key: "Droplet_Min_Radius", Label: "Min Radius", Min: 0, Max: 30, Step: 1 },
      { Key: "Droplet_Max_Radius", Label: "Max Radius", Min: 0, Max: 40, Step: 1 },
      { Key: "Friction", Label: "Friction", Min: 0, Max: 1, Step: 0.01 },
      { Key: "Attraction", Label: "Attraction", Min: 0, Max: 0.2, Step: 0.005 },
      { Key: "Attraction_Jitter", Label: "Attraction Jitter", Min: 0, Max: 0.2, Step: 0.005 },
    ],
  },
  {
    Title: "Spring (Press)",
    Fields: [
      { Key: "Press_Scale_X", Label: "Press Scale X", Min: 0.5, Max: 1.5, Step: 0.01 },
      { Key: "Press_Scale_Y", Label: "Press Scale Y", Min: 0.5, Max: 1.5, Step: 0.01 },
      { Key: "Spring_Stiffness", Label: "Spring Stiffness", Min: 0, Max: 0.5, Step: 0.01 },
      { Key: "Spring_Damping", Label: "Spring Damping", Min: 0, Max: 1, Step: 0.01 },
    ],
  },
  {
    Title: "Splash",
    Fields: [
      { Key: "Hover_Splash_Min", Label: "Hover Min", Min: 0, Max: 10, Step: 1 },
      { Key: "Hover_Splash_Max", Label: "Hover Max", Min: 0, Max: 10, Step: 1 },
      { Key: "Hover_Splash_Intensity", Label: "Hover Intensity", Min: 0, Max: 5, Step: 0.1 },
      { Key: "Press_Splash_Min", Label: "Press Min", Min: 0, Max: 10, Step: 1 },
      { Key: "Press_Splash_Max", Label: "Press Max", Min: 0, Max: 10, Step: 1 },
      { Key: "Press_Splash_Intensity", Label: "Press Intensity", Min: 0, Max: 5, Step: 0.1 },
      { Key: "Release_Splash_Min", Label: "Release Min", Min: 0, Max: 10, Step: 1 },
      { Key: "Release_Splash_Max", Label: "Release Max", Min: 0, Max: 10, Step: 1 },
      { Key: "Release_Splash_Intensity", Label: "Release Intensity", Min: 0, Max: 5, Step: 0.1 },
    ],
  },
];

function Button_Appearance_Content() {
  const { Thema } = Use_App();
  const {
    Button_Customization = Default_Button_Configuration,
    Update_Button_Single_Property,
    Reset_To_Defaults,
  } = Use_UI();

  const [Open_Preset, Set_Open_Preset] = useState<boolean>(true);
  const [Selected_Preset, Set_Selected_Preset] = useState<Preset_Option | null>("Default");

  const [Open_Variant, Set_Open_Variant] = useState<Button_Variant | null>("Primary");
  const [Open_Sub_State, Set_Open_Sub_State] = useState<string | null>("Primary-Default");
  const [Open_Sub_Sections, Set_Open_Sub_Sections] = useState<Record<string, boolean>>({});

  const Active_Theme_Mode: Theme_Mode = Thema === "dark" ? "Dark" : "Light";

  const Handle_Update = useCallback(
    <
      S extends Button_State,
      K extends keyof Button_Configuration_Map[Theme_Mode][Button_Variant][S]
    >(
      Variant: Button_Variant,
      State: S,
      Key: K,
      Value: Button_Configuration_Map[Theme_Mode][Button_Variant][S][K]
    ) => {
      // Zodra er een instelling wordt gewijzigd, vervalt het actieve preset
      Set_Selected_Preset(null);

      if (Update_Button_Single_Property) {
        Update_Button_Single_Property(Active_Theme_Mode, Variant, State, Key, Value);
      }
    },
    [Update_Button_Single_Property, Active_Theme_Mode]
  );

  const Handle_Select_Preset = useCallback(
    (Preset: Preset_Option) => {
      if (Preset === "Default") {
        Reset_To_Defaults();
        Set_Selected_Preset("Default");
      } else {
        // Placeholder voor toekomstige presets
        console.log(`Preset ${Preset} gekozen - nog niet functioneel.`);
      }
    },
    [Reset_To_Defaults]
  );

  const Handle_Reset = useCallback(() => {
    Reset_To_Defaults();
    Set_Selected_Preset("Default");
  }, [Reset_To_Defaults]);

  const Toggle_Sub_Section = useCallback((Key: string) => {
    Set_Open_Sub_Sections((Prev) => ({ ...Prev, [Key]: !Prev[Key] }));
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full bg-transparent">
      <div className="md:col-span-7 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="text-sm font-semibold">Button Settings</span>
          <button
            onClick={Handle_Reset}
            className="px-3 py-1.5 text-xs font-medium bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-md transition-colors border border-red-500/20 cursor-pointer"
          >
            Reset to Defaults
          </button>
        </div>

        {/* Presets Accordion */}
        <Accordion_Item
          Title="Presets"
          IsOpen={Open_Preset}
          On_Toggle={() => Set_Open_Preset((Prev) => !Prev)}
        >
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => Handle_Select_Preset("Default")}
              className={`p-2.5 text-xs font-medium rounded-lg border text-center transition-all cursor-pointer ${
                Selected_Preset === "Default"
                  ? "bg-foreground text-background border-foreground shadow-sm font-semibold"
                  : "bg-muted/30 border-border hover:bg-muted text-foreground"
              }`}
            >
              Default
            </button>

            <button
              onClick={() => Handle_Select_Preset("Glassmorphism")}
              className={`p-2.5 text-xs font-medium rounded-lg border text-center transition-all cursor-pointer opacity-60 hover:opacity-100 ${
                Selected_Preset === "Glassmorphism"
                  ? "bg-foreground text-background border-foreground shadow-sm font-semibold"
                  : "bg-muted/30 border-border hover:bg-muted text-foreground"
              }`}
            >
              Glassmorphism
            </button>

            <button
              onClick={() => Handle_Select_Preset("Flat")}
              className={`p-2.5 text-xs font-medium rounded-lg border text-center transition-all cursor-pointer opacity-60 hover:opacity-100 ${
                Selected_Preset === "Flat"
                  ? "bg-foreground text-background border-foreground shadow-sm font-semibold"
                  : "bg-muted/30 border-border hover:bg-muted text-foreground"
              }`}
            >
              Flat
            </button>
          </div>
        </Accordion_Item>

        {/* Variants */}
        {Variants.map((Variant) => (
          <Accordion_Item
            key={Variant}
            Title={`${Variant} Variant`}
            IsOpen={Open_Variant === Variant}
            On_Toggle={() => Set_Open_Variant((Prev) => (Prev === Variant ? null : Variant))}
          >
            {States.map((State) => {
              const Sub_Key = `${Variant}-${State}`;
              const Default_Config =
                Default_Button_Configuration[Active_Theme_Mode][Variant][State];
              const Config =
                Button_Customization?.[Active_Theme_Mode]?.[Variant]?.[State] || Default_Config;

              const Gooey: All_Gooey_Fields = {
                ...(Default_Config.Gooey as All_Gooey_Fields),
                ...(Config.Gooey as All_Gooey_Fields),
              };

              return (
                <Accordion_Item
                  key={State}
                  Title={`${State} State`}
                  IsOpen={Open_Sub_State === Sub_Key}
                  On_Toggle={() =>
                    Set_Open_Sub_State((Prev) => (Prev === Sub_Key ? null : Sub_Key))
                  }
                  Size="small"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">BG Color</label>
                      <input
                        type="color"
                        value={Config.BG_Color}
                        onChange={(E) => Handle_Update(Variant, State, "BG_Color", E.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Text Color</label>
                      <input
                        type="color"
                        value={Config.Text_Color}
                        onChange={(E) => Handle_Update(Variant, State, "Text_Color", E.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Border Radius</span>
                        <span>{Config.Border_Radius}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={Config.Border_Radius}
                        onChange={(E) =>
                          Handle_Update(Variant, State, "Border_Radius", Number(E.target.value))
                        }
                        className="w-full accent-foreground"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Has Border</label>
                      <input
                        type="checkbox"
                        checked={Config.Has_Border}
                        onChange={(E) =>
                          Handle_Update(Variant, State, "Has_Border", E.target.checked)
                        }
                        className="h-4 w-4 rounded accent-foreground cursor-pointer"
                      />
                    </div>

                    {Config.Has_Border && (
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Border Color</label>
                        <input
                          type="color"
                          value={Config.Border_Color}
                          onChange={(E) =>
                            Handle_Update(Variant, State, "Border_Color", E.target.value)
                          }
                          className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                        />
                      </div>
                    )}
                  </div>

                  <Accordion_Item
                    Title="Gooey Effect"
                    IsOpen={!!Open_Sub_Sections[`${Sub_Key}-gooey`]}
                    On_Toggle={() => Toggle_Sub_Section(`${Sub_Key}-gooey`)}
                    Size="small"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Enabled</label>
                        <input
                          type="checkbox"
                          checked={Gooey.Enabled}
                          onChange={(E) =>
                            Handle_Update(Variant, State, "Gooey", {
                              ...Gooey,
                              Enabled: E.target.checked,
                            } as Gooey_Configuration)
                          }
                          className="h-4 w-4 rounded accent-foreground cursor-pointer"
                        />
                      </div>

                      {Gooey.Enabled && (
                        <>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm font-medium">
                              <span>Blur</span>
                              <span>{Gooey.Blur}</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="20"
                              value={Gooey.Blur}
                              onChange={(E) =>
                                Handle_Update(Variant, State, "Gooey", {
                                  ...Gooey,
                                  Blur: Number(E.target.value),
                                } as Gooey_Configuration)
                              }
                              className="w-full"
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm font-medium">
                              <span>Contrast</span>
                              <span>{Gooey.Contrast}</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="50"
                              value={Gooey.Contrast}
                              onChange={(E) =>
                                Handle_Update(Variant, State, "Gooey", {
                                  ...Gooey,
                                  Contrast: Number(E.target.value),
                                } as Gooey_Configuration)
                              }
                              className="w-full"
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Draw Body</label>
                            <input
                              type="checkbox"
                              checked={Gooey.Draw_Body}
                              onChange={(E) =>
                                Handle_Update(Variant, State, "Gooey", {
                                  ...Gooey,
                                  Draw_Body: E.target.checked,
                                } as Gooey_Configuration)
                              }
                              className="h-4 w-4 rounded accent-foreground cursor-pointer"
                            />
                          </div>

                          {Fluid_Groups.map((Group) => (
                            <div
                              key={Group.Title}
                              className="space-y-2 pt-2 border-t border-border"
                            >
                              <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                                {Group.Title}
                              </span>
                              {Group.Fields.map((Field) => (
                                <div key={Field.Key} className="space-y-1">
                                  <div className="flex justify-between text-sm font-medium">
                                    <span>{Field.Label}</span>
                                    <span>{Gooey[Field.Key]}</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={Field.Min}
                                    max={Field.Max}
                                    step={Field.Step}
                                    value={Gooey[Field.Key]}
                                    onChange={(E) =>
                                      Handle_Update(Variant, State, "Gooey", {
                                        ...Gooey,
                                        [Field.Key]: Number(E.target.value),
                                      } as Gooey_Configuration)
                                    }
                                    className="w-full accent-foreground"
                                  />
                                </div>
                              ))}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </Accordion_Item>

                  <Accordion_Item
                    Title="Padding (Inner)"
                    IsOpen={!!Open_Sub_Sections[`${Sub_Key}-padding`]}
                    On_Toggle={() => Toggle_Sub_Section(`${Sub_Key}-padding`)}
                    Size="small"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {Directions.map((Side) => (
                        <div key={Side} className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                            {Side}
                          </span>
                          <input
                            type="number"
                            value={Config.Padding[Side]}
                            onChange={(E) =>
                              Handle_Update(Variant, State, "Padding", {
                                ...Config.Padding,
                                [Side]: Number(E.target.value),
                              })
                            }
                            className="w-full p-1 border border-border rounded bg-transparent text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </Accordion_Item>

                  <Accordion_Item
                    Title="Margin (Outer)"
                    IsOpen={!!Open_Sub_Sections[`${Sub_Key}-margin`]}
                    On_Toggle={() => Toggle_Sub_Section(`${Sub_Key}-margin`)}
                    Size="small"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {Directions.map((Side) => (
                        <div key={Side} className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                            {Side}
                          </span>
                          <input
                            type="number"
                            value={Config.Margin[Side]}
                            onChange={(E) =>
                              Handle_Update(Variant, State, "Margin", {
                                ...Config.Margin,
                                [Side]: Number(E.target.value),
                              })
                            }
                            className="w-full p-1 border border-border rounded bg-transparent text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </Accordion_Item>
                </Accordion_Item>
              );
            })}
          </Accordion_Item>
        ))}
      </div>

      <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-xl border border-border bg-transparent gap-4 h-fit sticky top-4">
        <h3 className="w-full text-center text-sm font-semibold mb-4 text-muted-foreground">
          Preview Buttons
        </h3>
        <div className="w-full flex flex-col items-center space-y-8">
          <CustomButton Variant="Primary" Label="Primary Button" />
          <CustomButton Variant="Secondary" Label="Secondary Button" />
        </div>
      </div>
    </div>
  );
}

export function Button_Appearance() {
  return (
    <UI_Provider>
      <Button_Appearance_Content />
    </UI_Provider>
  );
}

export default Button_Appearance;