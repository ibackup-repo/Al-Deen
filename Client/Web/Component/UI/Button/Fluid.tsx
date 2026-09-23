import React, { useLayoutEffect, useRef } from "react";
import {
  Gooey_Active_Configuration,
  Gooey_Hover_Configuration,
  Gooey_Default_Configuration,
} from "./Types";

// De drie Gooey-configs delen alleen de Base-velden; Normal mist bv. Friction,
// Attraction en alle Splash-waarden. Fluid kan met elk van de drie state-configs
// worden aangeroepen, dus we typen het als union en vullen ontbrekende velden
// hieronder aan met defaults.
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
  // Wordt aangeroepen zodra de animatie na het afhoveren volledig is uitgerust
  // en het canvas is leeggemaakt. De Button schakelt dan terug naar de solide achtergrond.
  On_Settled?: () => void;
}

// Defaults voor velden die niet in elke Gooey_*_Configuration variant voorkomen
// (bijv. Gooey_Default_Configuration heeft geen Friction/Attraction/Splash-waarden).
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

// Haalt de velden op die niet in alle drie de varianten gegarandeerd zijn,
// met terugval op de defaults hierboven wanneer de meegegeven config (bv. Normal) ze niet heeft.
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
  // Afstand tot het midden waarbinnen een druppel als "terug in het lichaam"
  // geldt en begint te krimpen. Gebaseerd op de rondingsradius (Height / 2),
  // niet op de halve breedte — anders krimpen druppels al bij het spawnen.
  Absorption_Radius: number;
  Color: string;

  constructor(
    X: number,
    Y: number,
    Velocity_X: number,
    Velocity_Y: number,
    Radius: number,
    Center_X: number,
    Center_Y: number,
    Absorption_Radius: number,
    Color: string,
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
    this.Color = Color;
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

  Draw(Context: CanvasRenderingContext2D) {
    if (this.Radius < 0.5) return;
    Context.beginPath();
    Context.arc(this.X, this.Y, Math.max(0, this.Radius), 0, Math.PI * 2);
    Context.fillStyle = this.Color;
    Context.fill();
  }
}

export const Fluid: React.FC<Fluid_Properties> = ({
  Is_Hovered,
  Is_Pressed,
  Width,
  Height,
  Color,
  Configuration,
  On_Settled,
}) => {
  const Canvas_Reference = useRef<HTMLCanvasElement | null>(null);
  const Animation_Reference = useRef<number | null>(null);
  const Droplets_Reference = useRef<Droplet[]>([]);
  const Physics_Reference = useRef({
    Scale_X: 1,
    Scale_Y: 1,
    Target_X: 1,
    Target_Y: 1,
    Velocity_X: 0,
    Velocity_Y: 0,
    Time: 0,
  });

  // Refs zodat de RAF-loop nooit stale waarden leest
  const Is_Hovered_Ref = useRef(Is_Hovered);
  const Is_Pressed_Ref = useRef(Is_Pressed);
  Is_Hovered_Ref.current = Is_Hovered;
  Is_Pressed_Ref.current = Is_Pressed;

  const On_Settled_Reference = useRef(On_Settled);
  On_Settled_Reference.current = On_Settled;

  // De RAF-loop roept steeds dezelfde Render-closure aan (die van de render waarin
  // de loop startte). Zonder deze ref gebruikt de loop dus de config van dát moment,
  // bijv. de Hover-config terwijl je al in de Active-state zit.
  const Latest_Reference = useRef({ Configuration, Color, Width, Height });
  Latest_Reference.current = { Configuration, Color, Width, Height };

  // True zodra er echt iets getekend/geanimeerd is. Voorkomt dat On_Settled
  // afgaat bij een lege, idle mount (bijv. Dark-thema waar Fluid altijd gemount is).
  const Was_Active_Reference = useRef(false);

  // Beide beginnen op false: mount tijdens hover telt dan ook als "net gehoverd",
  // waardoor de hover-splash wel afvuurt.
  const Previous_Hovered = useRef(false);
  const Previous_Pressed = useRef(false);

  const { Canvas_Padding, Draw_Body, Wave_Frequency, Spring_Stiffness, Spring_Damping } =
    Configuration;

  const {
    Friction,
    Attraction,
    Attraction_Jitter,
    Wave_Amplitude,
    Rest_Outline_Amplitude,
    Scale_Breathe_Amplitude,
    Press_Scale_X,
    Press_Scale_Y,
    Droplet_Min_Radius,
    Droplet_Max_Radius,
    Hover_Splash_Min,
    Hover_Splash_Max,
    Hover_Splash_Intensity,
    Press_Splash_Min,
    Press_Splash_Max,
    Press_Splash_Intensity,
    Release_Splash_Min,
    Release_Splash_Max,
    Release_Splash_Intensity,
  } = Resolve_Optional_Fields(Configuration);

  const Total_Width = Width + Canvas_Padding * 2;
  const Total_Height = Height + Canvas_Padding * 2;
  const Center_X = Total_Width / 2;
  const Center_Y = Total_Height / 2;

  // Tekent meteen het eerste frame (synchroon) en laat Render daarna zelf
  // de volgende frames plannen. Zo is er geen paint zonder body.
  const Ensure_Loop = () => {
    if (Animation_Reference.current == null) {
      Render();
    }
  };

  const Spawn_Splash = (Count: number, Intensity: number) => {
    for (let Index = 0; Index < Count; Index++) {
      const Angle = Math.random() * Math.PI * 2;
      const Speed = (Math.random() * 6 + 2) * Intensity;
      const Offset_X = (Math.cos(Angle) * Width) / 2.2;
      const Offset_Y = (Math.sin(Angle) * Height) / 2.2;
      const Radius =
        Droplet_Min_Radius +
        Math.random() * (Droplet_Max_Radius - Droplet_Min_Radius);

      Droplets_Reference.current.push(
        new Droplet(
          Center_X + Offset_X,
          Center_Y + Offset_Y,
          Math.cos(Angle) * Speed,
          Math.sin(Angle) * Speed,
          Radius,
          Center_X,
          Center_Y,
          Height / 2,
          Color,
          Friction,
          Attraction,
          Attraction_Jitter
        )
      );
    }
  };

  const Random_Count = (Minimum: number, Maximum: number) =>
    Math.floor(Math.random() * (Maximum - Minimum + 1)) + Minimum;

  const Render = () => {
    const Canvas = Canvas_Reference.current;
    const Context = Canvas?.getContext("2d");
    if (!Canvas || !Context) {
      Animation_Reference.current = null;
      return;
    }

    const Hovered = Is_Hovered_Ref.current;
    const Pressed = Is_Pressed_Ref.current;

    // Altijd de laatste props gebruiken (schaduwt bewust de waarden uit de closure)
    const Live = Latest_Reference.current;
    const { Canvas_Padding: Live_Canvas_Padding, Draw_Body, Wave_Frequency } =
      Live.Configuration;
    const {
      Wave_Amplitude,
      Rest_Outline_Amplitude,
      Scale_Breathe_Amplitude,
      Press_Scale_X,
      Press_Scale_Y,
      Spring_Stiffness: Live_Spring_Stiffness,
      Spring_Damping: Live_Spring_Damping,
    } = { ...Resolve_Optional_Fields(Live.Configuration), ...Live.Configuration };
    const Width = Live.Width;
    const Height = Live.Height;
    const Color = Live.Color;
    const Total_Width = Width + Live_Canvas_Padding * 2;
    const Total_Height = Height + Live_Canvas_Padding * 2;
    const Center_X = Total_Width / 2;
    const Center_Y = Total_Height / 2;

    if (Hovered || Pressed || Droplets_Reference.current.length > 0) {
      Was_Active_Reference.current = true;
    }

    const Physics = Physics_Reference.current;
    Physics.Time += 0.03;
    Context.clearRect(0, 0, Total_Width, Total_Height);

    if (Pressed) {
      Physics.Target_X = Press_Scale_X;
      Physics.Target_Y = Press_Scale_Y;
    } else if (Hovered) {
      Physics.Target_X = 1 + Math.sin(Physics.Time * 2) * Scale_Breathe_Amplitude;
      Physics.Target_Y = 1 + Math.cos(Physics.Time * 2) * Scale_Breathe_Amplitude;
    } else {
      Physics.Target_X = 1;
      Physics.Target_Y = 1;
    }

    const Acceleration_X = (Physics.Target_X - Physics.Scale_X) * Live_Spring_Stiffness;
    const Acceleration_Y = (Physics.Target_Y - Physics.Scale_Y) * Live_Spring_Stiffness;
    Physics.Velocity_X = (Physics.Velocity_X + Acceleration_X) * Live_Spring_Damping;
    Physics.Velocity_Y = (Physics.Velocity_Y + Acceleration_Y) * Live_Spring_Damping;
    Physics.Scale_X += Physics.Velocity_X;
    Physics.Scale_Y += Physics.Velocity_Y;

    if (Draw_Body) {
      Context.save();
      Context.translate(Center_X, Center_Y);
      Context.fillStyle = Color;

      // Schaal de AFMETINGEN, niet de hele canvas-context. Een non-uniforme
      // context.scale rekt de ronde uiteinden uit tot ellipsen, waardoor de
      // radius aan de zijkanten kleiner (spitser) lijkt.
      const Scaled_Width = Width * Physics.Scale_X;
      const Scaled_Height = Height * Physics.Scale_Y;
      const Radius = Math.min(Scaled_Width, Scaled_Height) / 2;
      const Straight_Segment_X = Math.max(0, Scaled_Width - Radius * 2);
      const Straight_Segment_Y = Math.max(0, Scaled_Height - Radius * 2);
      const Amplitude = Hovered ? Wave_Amplitude : Rest_Outline_Amplitude;
      const Number_Of_Points = 64;

      Context.beginPath();
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
          Amplitude;
        const Normal_X = Point_X + Math.cos(Angle) * Noise;
        const Normal_Y = Point_Y + Math.sin(Angle) * Noise;

        if (Index === 0) Context.moveTo(Normal_X, Normal_Y);
        else Context.lineTo(Normal_X, Normal_Y);
      }
      Context.closePath();
      Context.fill();
      Context.restore();
    }

    for (let Index = Droplets_Reference.current.length - 1; Index >= 0; Index--) {
      const Droplet_Instance = Droplets_Reference.current[Index];
      Droplet_Instance.Update();
      Droplet_Instance.Draw(Context);
      if (Droplet_Instance.Radius < 0.5) {
        Droplets_Reference.current.splice(Index, 1);
      }
    }

    const Settled =
      Math.abs(Physics.Scale_X - 1) < 0.001 &&
      Math.abs(Physics.Scale_Y - 1) < 0.001 &&
      Math.abs(Physics.Velocity_X) < 0.001 &&
      Math.abs(Physics.Velocity_Y) < 0.001 &&
      Droplets_Reference.current.length === 0;

    if (!Hovered && Settled) {
      Context.clearRect(0, 0, Total_Width, Total_Height);
      Animation_Reference.current = null;

      // Canvas is leeg: laat de Button nu (in dezelfde frame) de solide
      // achtergrond terugzetten, zodat er geen "leeg" moment tussen zit.
      if (Was_Active_Reference.current) {
        Was_Active_Reference.current = false;
        On_Settled_Reference.current?.();
      }
    } else {
      Animation_Reference.current = requestAnimationFrame(Render);
    }
  };

  // Volgorde is belangrijk: eerst canvas-formaat, dan pas de hover/press effects.
  useLayoutEffect(() => {
    const Canvas = Canvas_Reference.current;
    if (!Canvas) return;
    const Device_Pixel_Ratio = window.devicePixelRatio || 1;
    Canvas.width = Total_Width * Device_Pixel_Ratio;
    Canvas.height = Total_Height * Device_Pixel_Ratio;
    const Context = Canvas.getContext("2d");
    Context?.scale(Device_Pixel_Ratio, Device_Pixel_Ratio);
    Ensure_Loop();
    return () => {
      if (Animation_Reference.current) cancelAnimationFrame(Animation_Reference.current);
      Animation_Reference.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Total_Width, Total_Height]);

  useLayoutEffect(() => {
    if (Is_Hovered && !Previous_Hovered.current) {
      Spawn_Splash(
        Random_Count(Hover_Splash_Min, Hover_Splash_Max),
        Hover_Splash_Intensity
      );
      Ensure_Loop();
    } else if (!Is_Hovered && Previous_Hovered.current) {
      // Zorg dat de loop draait, zodat de "uitrust"-animatie en On_Settled altijd volgen
      Ensure_Loop();
    }
    Previous_Hovered.current = Is_Hovered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Is_Hovered]);

  useLayoutEffect(() => {
    if (Is_Pressed && !Previous_Pressed.current) {
      Spawn_Splash(
        Random_Count(Press_Splash_Min, Press_Splash_Max),
        Press_Splash_Intensity
      );
      Ensure_Loop();
    } else if (!Is_Pressed && Previous_Pressed.current && Is_Hovered_Ref.current) {
      Spawn_Splash(
        Random_Count(Release_Splash_Min, Release_Splash_Max),
        Release_Splash_Intensity
      );
      Ensure_Loop();
    }
    Previous_Pressed.current = Is_Pressed;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Is_Pressed]);

  return (
    <canvas
      ref={Canvas_Reference}
      style={{
        width: `${Total_Width}px`,
        height: `${Total_Height}px`,
        display: "block",
      }}
    />
  );
};

export default Fluid;