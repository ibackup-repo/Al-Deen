import React, {
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
} from "react";
import { View } from "react-native";
import {
  Canvas,
  Group,
  Paint,
  Blur,
  ColorMatrix,
  Path,
  Skia,
  useCanvasRef,
  ColorType,
  AlphaType,
} from "@shopify/react-native-skia";
import type { SkPath } from "@shopify/react-native-skia";
import { useSharedValue } from "react-native-reanimated";
import {
  Gooey_Active_Configuration,
  Gooey_Hover_Configuration,
  Gooey_Default_Configuration,
} from "./Types";

// useLayoutEffect tekent vóór de eerste paint (geen lege frame).
const Use_Isomorphic_Layout_Effect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Na het detecteren van de eerste echte pixel wachten we nog dit aantal
// animatieframes, zodat de draw zeker gepresenteerd is.
const Frames_After_Draw = 2;

// Noodgrens: als er na zoveel frames (~5s bij 60fps) nog geen pixel gezien
// is, melden we toch klaar. Zo blijft de knop nooit hangen.
const Maximum_Wait_Frames = 300;

export type Gooey_Configuration =
  | Gooey_Default_Configuration
  | Gooey_Hover_Configuration
  | Gooey_Active_Configuration;

export interface Fluid_Properties {
  Is_Hovered: boolean;
  Is_Pressed: boolean;
  Width: number;
  Height: number;
  Color: string;
  Configuration: Gooey_Configuration;
  // Zelfde Border_Radius als de knop. Standaard: maximaal (pill).
  Border_Radius?: number;
  // Wordt aangeroepen wanneer de animatie tot rust is gekomen.
  On_Settled?: () => void;
  // Wordt aangeroepen als het canvas echt getekend en zichtbaar is.
  On_Ready?: () => void;
}

const Default_Optional_Gooey_Values = {
  Wave_Amplitude: 2.5,
  Rest_Outline_Amplitude: 0.4,
  Scale_Breathe_Amplitude: 0.02,
  Friction: 0.88,
  Attraction: 0.03,
  Attraction_Jitter: 0.02,
  Droplet_Min_Radius: 4,
  Droplet_Max_Radius: 14,
  Press_Scale_X: 1.08,
  Press_Scale_Y: 0.88,
  Hover_Splash_Min: 2,
  Hover_Splash_Max: 4,
  Hover_Splash_Intensity: 0.8,
  Press_Splash_Min: 4,
  Press_Splash_Max: 7,
  Press_Splash_Intensity: 1.8,
  Release_Splash_Min: 1,
  Release_Splash_Max: 2,
  Release_Splash_Intensity: 0.6,
};

type Optional_Gooey_Fields = typeof Default_Optional_Gooey_Values;

function Resolve_Optional_Fields(
  Configuration: Gooey_Configuration
): Optional_Gooey_Fields {
  const Partial_Configuration = Configuration as Partial<Optional_Gooey_Fields>;
  const Resolved = { ...Default_Optional_Gooey_Values };
  for (const Key of Object.keys(Default_Optional_Gooey_Values) as Array<
    keyof Optional_Gooey_Fields
  >) {
    const Value = Partial_Configuration[Key];
    if (typeof Value === "number") {
      Resolved[Key] = Value;
    }
  }
  return Resolved;
}

class Droplet {
  X: number;
  Y: number;
  Velocity_X: number;
  Velocity_Y: number;
  Radius: number;
  Friction: number;
  Attraction: number;
  Center_X: number;
  Center_Y: number;
  Absorption_Radius: number;

  constructor(
    X: number,
    Y: number,
    Velocity_X: number,
    Velocity_Y: number,
    Radius: number,
    Center_X: number,
    Center_Y: number,
    Absorption_Radius: number,
    Friction: number,
    Attraction: number,
    Attraction_Jitter: number
  ) {
    this.X = X;
    this.Y = Y;
    this.Velocity_X = Velocity_X;
    this.Velocity_Y = Velocity_Y;
    this.Radius = Radius;
    this.Center_X = Center_X;
    this.Center_Y = Center_Y;
    this.Absorption_Radius = Absorption_Radius;
    this.Friction = Friction;
    this.Attraction = Attraction + Math.random() * Attraction_Jitter;
  }

  Update() {
    const Delta_X = this.Center_X - this.X;
    const Delta_Y = this.Center_Y - this.Y;
    this.Velocity_X += Delta_X * this.Attraction * 0.1;
    this.Velocity_Y += Delta_Y * this.Attraction * 0.1;
    this.Velocity_X *= this.Friction;
    this.Velocity_Y *= this.Friction;
    this.X += this.Velocity_X;
    this.Y += this.Velocity_Y;

    const Distance_To_Center = Math.hypot(Delta_X, Delta_Y);
    if (Distance_To_Center < this.Absorption_Radius) {
      this.Radius *= 0.92;
    }
  }
}

function Random_Between(Minimum: number, Maximum: number) {
  return Minimum + Math.random() * Math.max(0, Maximum - Minimum);
}

function Random_Integer_Between(Minimum: number, Maximum: number) {
  return Math.round(Random_Between(Minimum, Maximum));
}

/**
 * Fluid tekent met Skia op ALLE platformen (web, iOS, Android), dus het gedrag
 * is overal identiek.
 *
 * - De fysica (veer, golf, druppels) draait in een requestAnimationFrame-lus.
 *   Elke frame wordt één SkPath (lichaam + druppels) opgebouwd en in een
 *   shared value gezet; Skia tekent die zonder React-rerender.
 * - Het gooey-effect is een laag met Blur + alpha-ColorMatrix (zoals in de
 *   Skia-documentatie).
 * - Bij "settled" stopt de lus, maar de laatste frame blijft staan.
 * - On_Ready wordt pas gemeld als er echt een pixel in het midden van het
 *   canvas getekend is (zie Check_Ready).
 *
 * Web: Skia heeft daar CanvasKit (WASM) nodig. Die moet geladen zijn voordat
 * deze component voor het eerst rendert (zie de Skia-documentatie voor web).
 */
export const Fluid: React.FC<Fluid_Properties> = ({
  Is_Hovered,
  Is_Pressed,
  Width,
  Height,
  Color,
  Configuration,
  Border_Radius,
  On_Settled,
  On_Ready,
}) => {
  const Canvas_Reference = useCanvasRef();
  const Animation_Reference = useRef<number | null>(null);
  const Start_Loop_Reference = useRef<(() => void) | null>(null);

  const Initial_Path = useMemo(() => Skia.PathBuilder.Make().build(), []);
  const Path_Value = useSharedValue<SkPath>(Initial_Path);

  const Droplets_Reference = useRef<Droplet[]>([]);
  const Physics_Reference = useRef({
    Scale_X: 1,
    Scale_Y: 1,
    Target_X: 1,
    Target_Y: 1,
    Velocity_X: 0,
    Velocity_Y: 0,
    Time: 0,
    Amplitude: 0,
  });

  const Is_Hovered_Ref = useRef(Is_Hovered);
  const Is_Pressed_Ref = useRef(Is_Pressed);
  Is_Hovered_Ref.current = Is_Hovered;
  Is_Pressed_Ref.current = Is_Pressed;

  const On_Settled_Reference = useRef(On_Settled);
  On_Settled_Reference.current = On_Settled;

  const On_Ready_Reference = useRef(On_Ready);
  On_Ready_Reference.current = On_Ready;

  const Latest_Reference = useRef({ Configuration, Width, Height, Border_Radius });
  Latest_Reference.current = { Configuration, Width, Height, Border_Radius };

  const Previous_Hovered_Reference = useRef(false);
  const Previous_Pressed_Reference = useRef(false);
  const Previous_Enabled_Reference = useRef(false);

  const { Canvas_Padding } = Configuration;
  const Blur_Value = (Configuration as { Blur?: number }).Blur ?? 5;
  const Contrast_Value = (Configuration as { Contrast?: number }).Contrast ?? 19;

  const Total_Width = Width + Canvas_Padding * 2;
  const Total_Height = Height + Canvas_Padding * 2;

  // Gooey-laag: blur + alpha-contrast.
  const Layer = useMemo(() => {
    const Alpha_Offset = -(Contrast_Value - 1) / 2;
    return (
      <Paint>
        <Blur blur={Blur_Value} />
        <ColorMatrix
          matrix={[
            1, 0, 0, 0, 0,
            0, 1, 0, 0, 0,
            0, 0, 1, 0, 0,
            0, 0, 0, Contrast_Value, Alpha_Offset,
          ]}
        />
      </Paint>
    );
  }, [Blur_Value, Contrast_Value]);

  // Effect 1: animatielus definiëren (herstart alleen bij andere afmetingen).
  Use_Isomorphic_Layout_Effect(() => {
    const Center_X = Total_Width / 2;
    const Center_Y = Total_Height / 2;

    const Spawn_Droplets = (
      Minimum_Count: number,
      Maximum_Count: number,
      Intensity: number
    ) => {
      const Live = Latest_Reference.current;
      const Optional = Resolve_Optional_Fields(Live.Configuration);
      const Count = Random_Integer_Between(Minimum_Count, Maximum_Count);
      const Absorption_Radius = Math.min(Live.Width, Live.Height) / 2;

      for (let Index = 0; Index < Count; Index++) {
        const Angle = Math.random() * Math.PI * 2;
        const Start_X = Center_X + Math.cos(Angle) * (Live.Width / 2);
        const Start_Y = Center_Y + Math.sin(Angle) * (Live.Height / 2);
        const Speed = Intensity * Random_Between(2, 5);
        Droplets_Reference.current.push(
          new Droplet(
            Start_X,
            Start_Y,
            Math.cos(Angle) * Speed,
            Math.sin(Angle) * Speed,
            Random_Between(
              Optional.Droplet_Min_Radius,
              Optional.Droplet_Max_Radius
            ),
            Center_X,
            Center_Y,
            Absorption_Radius,
            Optional.Friction,
            Optional.Attraction,
            Optional.Attraction_Jitter
          )
        );
      }
    };

    const Render = () => {
      const Pressed = Is_Pressed_Ref.current;
      // Ingedrukt telt als hover: op web houd je tijdens het vasthouden ook
      // nog steeds de muis boven de knop. Zo gedraagt touch zich hetzelfde
      // (golf, ademen, hover-druppels).
      const Hovered = Is_Hovered_Ref.current || Pressed;

      const Live = Latest_Reference.current;
      const Optional = Resolve_Optional_Fields(Live.Configuration);
      const { Draw_Body, Wave_Frequency, Spring_Stiffness, Spring_Damping } =
        Live.Configuration;
      // Enabled=false: gewone statische vorm, geen druppels, geen schaal-effect.
      const Enabled =
        (Live.Configuration as { Enabled?: boolean }).Enabled !== false;
      const Physics = Physics_Reference.current;

      // Overgangen detecteren en druppels afvuren
      if (Enabled && Pressed && !Previous_Pressed_Reference.current) {
        Spawn_Droplets(
          Optional.Press_Splash_Min,
          Optional.Press_Splash_Max,
          Optional.Press_Splash_Intensity
        );
      } else if (
        !Pressed &&
        Previous_Pressed_Reference.current &&
        (Enabled || Previous_Enabled_Reference.current)
      ) {
        // Bij loslaten wisselt de config vaak naar Default (Enabled: false);
        // daarom telt ook de vorige frame mee.
        Spawn_Droplets(
          Optional.Release_Splash_Min,
          Optional.Release_Splash_Max,
          Optional.Release_Splash_Intensity
        );
      }
      if (Enabled && Hovered && !Previous_Hovered_Reference.current) {
        Spawn_Droplets(
          Optional.Hover_Splash_Min,
          Optional.Hover_Splash_Max,
          Optional.Hover_Splash_Intensity
        );
      }
      Previous_Hovered_Reference.current = Hovered;
      Previous_Pressed_Reference.current = Pressed;
      Previous_Enabled_Reference.current = Enabled;

      Physics.Time += 0.03;

      if (Enabled && Pressed) {
        Physics.Target_X = Optional.Press_Scale_X;
        Physics.Target_Y = Optional.Press_Scale_Y;
      } else if (Enabled && Hovered) {
        Physics.Target_X =
          1 + Math.sin(Physics.Time * 2) * Optional.Scale_Breathe_Amplitude;
        Physics.Target_Y =
          1 + Math.cos(Physics.Time * 2) * Optional.Scale_Breathe_Amplitude;
      } else {
        Physics.Target_X = 1;
        Physics.Target_Y = 1;
      }

      const Acceleration_X = (Physics.Target_X - Physics.Scale_X) * Spring_Stiffness;
      const Acceleration_Y = (Physics.Target_Y - Physics.Scale_Y) * Spring_Stiffness;
      Physics.Velocity_X = (Physics.Velocity_X + Acceleration_X) * Spring_Damping;
      Physics.Velocity_Y = (Physics.Velocity_Y + Acceleration_Y) * Spring_Damping;
      Physics.Scale_X += Physics.Velocity_X;
      Physics.Scale_Y += Physics.Velocity_Y;

      // Golfamplitude zacht laten in- en uitlopen (geen sprong bij hover-uit)
      const Target_Amplitude = !Enabled
        ? 0
        : Hovered
        ? Optional.Wave_Amplitude
        : Optional.Rest_Outline_Amplitude;
      Physics.Amplitude += (Target_Amplitude - Physics.Amplitude) * 0.15;

      // Eén pad per frame: lichaam + druppels
      // Paden zijn onveranderbaar: bouwen met PathBuilder, daarna .build().
      const Frame_Builder = Skia.PathBuilder.Make();

      if (Draw_Body) {
        const Scaled_Width = Live.Width * Physics.Scale_X;
        const Scaled_Height = Live.Height * Physics.Scale_Y;
        // Maximale radius = halve hoogte (pill); nooit groter dan dat.
        const Maximum_Radius = Math.min(Scaled_Width, Scaled_Height) / 2;
        const Radius = Math.min(
          Live.Border_Radius === undefined ? Maximum_Radius : Live.Border_Radius,
          Maximum_Radius
        );
        const Straight_Segment_X = Math.max(0, Scaled_Width - Radius * 2);
        const Straight_Segment_Y = Math.max(0, Scaled_Height - Radius * 2);
        const Number_Of_Points = 64;

        for (let Index = 0; Index <= Number_Of_Points; Index++) {
          const Step = Index / Number_Of_Points;
          const Angle = Step * Math.PI * 2;
          let Point_X = Math.cos(Angle) * Radius;
          let Point_Y = Math.sin(Angle) * Radius;
          if (Math.cos(Angle) > 0) Point_X += Straight_Segment_X / 2;
          else Point_X -= Straight_Segment_X / 2;
          if (Math.sin(Angle) > 0) Point_Y += Straight_Segment_Y / 2;
          else Point_Y -= Straight_Segment_Y / 2;

          const Noise =
            Math.sin(Physics.Time * 3 + Index * Wave_Frequency) *
            Math.cos(Physics.Time * 2 + Index * 0.5) *
            Physics.Amplitude;
          const Normal_X = Center_X + Point_X + Math.cos(Angle) * Noise;
          const Normal_Y = Center_Y + Point_Y + Math.sin(Angle) * Noise;

          if (Index === 0) Frame_Builder.moveTo(Normal_X, Normal_Y);
          else Frame_Builder.lineTo(Normal_X, Normal_Y);
        }
        Frame_Builder.close();
      }

      // Druppels updaten en aan hetzelfde pad toevoegen
      const Droplets = Droplets_Reference.current;
      for (let Index = Droplets.length - 1; Index >= 0; Index--) {
        const Current_Droplet = Droplets[Index];
        Current_Droplet.Update();
        if (Current_Droplet.Radius < 0.5) {
          Droplets.splice(Index, 1);
          continue;
        }
        // Druppel als veelhoek (alleen moveTo/lineTo/close); de blur in de
        // gooey-laag maakt de randen vloeiend.
        const Droplet_Segments = 16;
        for (let Segment = 0; Segment < Droplet_Segments; Segment++) {
          const Segment_Angle = (Segment / Droplet_Segments) * Math.PI * 2;
          const Droplet_X =
            Current_Droplet.X + Math.cos(Segment_Angle) * Current_Droplet.Radius;
          const Droplet_Y =
            Current_Droplet.Y + Math.sin(Segment_Angle) * Current_Droplet.Radius;
          if (Segment === 0) Frame_Builder.moveTo(Droplet_X, Droplet_Y);
          else Frame_Builder.lineTo(Droplet_X, Droplet_Y);
        }
        Frame_Builder.close();
      }

      Path_Value.value = Frame_Builder.build();

      const Settled =
        Math.abs(Physics.Scale_X - 1) < 0.001 &&
        Math.abs(Physics.Scale_Y - 1) < 0.001 &&
        Math.abs(Physics.Velocity_X) < 0.001 &&
        Math.abs(Physics.Velocity_Y) < 0.001 &&
        Math.abs(Physics.Amplitude - Target_Amplitude) < 0.01 &&
        Droplets.length === 0;

      if (!Hovered && !Pressed && Settled) {
        // Lus stoppen, maar de laatste frame (rustvorm) blijft staan.
        Animation_Reference.current = null;
        // Altijd melden: de knop beslist zelf of de overdracht mag.
        On_Settled_Reference.current?.();
      } else {
        Animation_Reference.current = requestAnimationFrame(Render);
      }
    };

    // (Her)start: teken meteen synchroon, zodat er nooit een lege frame is.
    Start_Loop_Reference.current = () => {
      if (Animation_Reference.current === null) {
        Render();
      }
    };
    Start_Loop_Reference.current();

    // Controleren of het canvas ECHT getekend is: snapshot nemen en de pixel
    // in het midden lezen. Alpha > 0 betekent dat Skia daar iets getekend
    // heeft. Pas dan (plus een paar frames voor de presentatie) melden we
    // On_Ready.
    let Ready_Frame_Handle: number | null = null;
    let Frames_Waited = 0;
    let Frames_Left_After_Draw: number | null = null;

    const Is_Center_Pixel_Drawn = (): boolean => {
      try {
        const Image = Canvas_Reference.current?.makeImageSnapshot();
        if (!Image) return false;
        const Pixels = Image.readPixels(
          Math.floor(Image.width() / 2),
          Math.floor(Image.height() / 2),
          {
            width: 1,
            height: 1,
            colorType: ColorType.RGBA_8888,
            alphaType: AlphaType.Premul,
          }
        );
        Image.dispose?.();
        return !!Pixels && Pixels[3] > 0;
      } catch {
        return false;
      }
    };

    const Check_Ready = () => {
      Frames_Waited += 1;

      if (Frames_Left_After_Draw === null) {
        if (Is_Center_Pixel_Drawn()) {
          Frames_Left_After_Draw = Frames_After_Draw;
        } else if (Frames_Waited >= Maximum_Wait_Frames) {
          // Noodgrens: nooit blijven hangen.
          Ready_Frame_Handle = null;
          On_Ready_Reference.current?.();
          return;
        }
      } else {
        Frames_Left_After_Draw -= 1;
        if (Frames_Left_After_Draw <= 0) {
          Ready_Frame_Handle = null;
          On_Ready_Reference.current?.();
          return;
        }
      }

      Ready_Frame_Handle = requestAnimationFrame(Check_Ready);
    };
    Ready_Frame_Handle = requestAnimationFrame(Check_Ready);

    return () => {
      if (Ready_Frame_Handle !== null) {
        cancelAnimationFrame(Ready_Frame_Handle);
      }
      if (Animation_Reference.current !== null) {
        cancelAnimationFrame(Animation_Reference.current);
      }
      Animation_Reference.current = null;
      Start_Loop_Reference.current = null;
    };
  }, [Total_Width, Total_Height]);

  // Effect 2: lus (her)starten bij hover/press, en één frame hertekenen als
  // vorm of configuratie verandert terwijl de knop in rust is.
  Use_Isomorphic_Layout_Effect(() => {
    Start_Loop_Reference.current?.();
  }, [Is_Hovered, Is_Pressed, Border_Radius, Configuration]);

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: -Canvas_Padding,
        top: -Canvas_Padding,
        width: Total_Width,
        height: Total_Height,
        zIndex: 0,
      }}
    >
      <Canvas
        ref={Canvas_Reference}
        style={{ width: Total_Width, height: Total_Height }}
      >
        <Group layer={Layer}>
          <Path path={Path_Value} color={Color} />
        </Group>
      </Canvas>
    </View>
  );
};

export default Fluid;