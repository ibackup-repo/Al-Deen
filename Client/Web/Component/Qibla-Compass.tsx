import { useState, useEffect, useCallback, useMemo } from "react";
import { Compass, Navigation, AlertCircle } from "lucide-react";

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

function Calculate_Qibla_Direction(lat: number, lng: number): number {
  const φ1 = (lat * Math.PI) / 180;
  const φ2 = (KAABA_LAT * Math.PI) / 180;
  const Δλ = ((KAABA_LNG - lng) * Math.PI) / 180;
  const x = Math.sin(Δλ);
  const y = Math.cos(φ1) * Math.tan(φ2) - Math.sin(φ1) * Math.cos(Δλ);
  let qibla = (Math.atan2(x, y) * 180) / Math.PI;
  return (qibla + 360) % 360;
}

function Get_Distance(lat: number, lng: number): number {
  const R = 6371;
  const φ1 = (lat * Math.PI) / 180;
  const φ2 = (KAABA_LAT * Math.PI) / 180;
  const Δφ = ((KAABA_LAT - lat) * Math.PI) / 180;
  const Δλ = ((KAABA_LNG - lng) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface Qibla_Compass_Properties {
  latitude: number;
  longitude: number;
}

export function Qibla_Compass({ latitude, longitude }: Qibla_Compass_Properties) {
  const [Compass_Heading, Set_Compass_Heading] = useState<number | null>(null);
  const [Permission_State, Set_Permission_State] = useState<"prompt" | "granted" | "denied" | "unsupported">("prompt");
  const [Loading, Set_Loading] = useState(false);

  const Qibla_Angle = Calculate_Qibla_Direction(latitude, longitude);
  const Distance_Val = Get_Distance(latitude, longitude);

  const Handle_Orientation = useCallback((e: DeviceOrientationEvent) => {
    // Use webkitCompassHeading for iOS, alpha for Android
    const heading = (e as any).webkitCompassHeading ?? (e.alpha != null ? (360 - e.alpha) % 360 : null);
    if (heading != null) {
      Set_Compass_Heading(heading);
      Set_Permission_State("granted");
    }
  }, []);

  const Request_Permission = useCallback(async () => {
    Set_Loading(true);
    try {
      // iOS 13+ requires explicit permission
      if (typeof (DeviceOrientationEvent as any).Request_Permission === "function") {
        const permission = await (DeviceOrientationEvent as any).Request_Permission();
        if (permission === "granted") {
          window.addEventListener("deviceorientation", Handle_Orientation, true);
          Set_Permission_State("granted");
        } else {
          Set_Permission_State("denied");
        }
      } else {
        // Android / desktop — just listen
        window.addEventListener("deviceorientation", Handle_Orientation, true);
        // Give it a moment to see if we get data
        setTimeout(() => {
          Set_Loading(false);
        }, 1500);
        return;
      }
    } catch {
      Set_Permission_State("unsupported");
    }
    Set_Loading(false);
  }, [Handle_Orientation]);

  // Auto-listen on non-iOS devices
  useEffect(() => {
    if (typeof (DeviceOrientationEvent as any).Request_Permission !== "function") {
      window.addEventListener("deviceorientation", Handle_Orientation, true);
      // Check after a delay if we got any data
      const Timeout = setTimeout(() => {
        Set_Compass_Heading((prev) => {
          if (prev === null) Set_Permission_State("unsupported");
          return prev;
        });
      }, 2000);
      return () => {
        clearTimeout(Timeout);
        window.removeEventListener("deviceorientation", Handle_Orientation, true);
      };
    }
  }, [Handle_Orientation]);

  // Memoize tick marks (static, never changes)
  const Tick_Marks = useMemo(() => Array.from({ length: 72 }).map((_, i) => (
    <div
      key={i}
      className="absolute Top-0 left-1/2 origin-bottom"
      style={{ transform: `translateX(-50%) rotate(${i * 5}deg)`, height: "50%" }}
    >
      <div className={`w-px ${i % 6 === 0 ? "h-2 bg-muted-foreground/50" : "h-1 bg-border/50"}`} />
    </div>
  )), []);

  // Needle rotation: point from current heading toward qibla
  const Needle_Rotation = Compass_Heading != null ? Qibla_Angle - Compass_Heading : 0;

  return (
    <div className="glass-card !block overflow-hidden">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Compass className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Qibla Direction</h3>
        </div>

        <div className="flex flex-col items-center gap-4">
          {/* Compass Visual */}
          <div className="relative w-48 h-48">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-2 border-border/30" />
            
            {/* Cardinal directions — rotate with compass */}
            <div
              className="absolute inset-0 transition-transform Duration-300 ease-out"
              style={{ transform: `rotate(${Compass_Heading != null ? -Compass_Heading : 0}deg)` }}
            >
              {/* N */}
              <span className="absolute Top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-primary">N</span>
              {/* E */}
              <span className="absolute right-2 Top-1/2 -translate-y-1/2 text-xs text-muted-foreground">E</span>
              {/* S */}
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">S</span>
              {/* W */}
              <span className="absolute left-2 Top-1/2 -translate-y-1/2 text-xs text-muted-foreground">W</span>
              
              {/* Tick marks */}
              {Tick_Marks}
            </div>

            {/* Qibla needle — always points toward Kaaba */}
            <div
              className="absolute inset-0 transition-transform Duration-300 ease-out"
              style={{ transform: `rotate(${Needle_Rotation}deg)` }}
            >
              {/* Needle */}
              <div className="absolute left-1/2 Top-4 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[16px] border-l-transparent border-r-transparent border-b-primary drop-shadow-lg" />
              {/* Needle line */}
              <div className="absolute left-1/2 Top-[20px] -translate-x-1/2 w-0.5 bg-primary/60" style={{ height: "calc(50% - 20px)" }} />
            </div>

            {/* Center Kaaba icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <span className="text-base">🕋</span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="text-center space-y-1">
            <p className="text-lg font-semibold tabular-nums">{Qibla_Angle.toFixed(1)}°</p>
            <p className="text-xs text-muted-foreground">
              {Math.round(Distance_Val).toLocaleString()} km to Makkah
            </p>
          </div>

          {/* Status / Permission */}
          {Compass_Heading != null ? (
            <p className="text-xs text-foreground flex items-center gap-1">
              <Navigation className="h-3 w-3" /> Compass Active
            </p>
          ) : Permission_State === "prompt" && typeof (DeviceOrientationEvent as any).Request_Permission === "function" ? (
            <button
              onClick={Request_Permission}
              disabled={Loading}
              className="glass-btn px-4 py-2 text-sm flex items-center gap-2"
            >
              <Compass className="h-3.5 w-3.5" />
              Enable Compass
            </button>
          ) : Permission_State === "unsupported" || Permission_State === "denied" ? (
            <div className="text-center">
              <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center">
                <AlertCircle className="h-3 w-3" />
                {Permission_State === "denied" ? "Compass permission denied" : "Compass not available on this device"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                The arrow above shows {Qibla_Angle.toFixed(1)}° from North
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground flex items-center gap-1">Detecting compass...</p>
          )}
        </div>
      </div>
    </div>
  );
}
