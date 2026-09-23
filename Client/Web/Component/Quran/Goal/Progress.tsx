interface Progress_Ring_Properties {
  Value: number;
  Size?: number;
  Stroke_Width?: number;
  Label: string;
  Sublabel?: string;
  Color?: string;
  Variant?: "solid" | "segmented";
  Segments?: number;
}

export function Progress_Ring({
  Value,
  Size = 120,
  Stroke_Width = 8,
  Label,
  Sublabel,
  Color = "hsl(var(--primary))",
  Variant = "solid",
  Segments = 48,
}: Progress_Ring_Properties) {
  const Radius = (Size - Stroke_Width) / 2;
  const Circumference = 2 * Math.PI * Radius;
  const Percentage = Math.min(Math.max(Value, 0), 100) / 100;
  const Offset = Circumference - Percentage * Circumference;

  const Segment_Length = Circumference / Segments;
  const Dash_On = Segment_Length * 0.62;
  const Dash_Off = Segment_Length - Dash_On;

  return (
    <div className="relative" style={{ width: Size, height: Size }}>
      <svg width={Size} height={Size} className="-rotate-90 absolute inset-0">
        {Variant === "segmented" ? (
          <>
            {/* faint segmented track */}
            <circle
              cx={Size / 2}
              cy={Size / 2}
              r={Radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={Stroke_Width}
              strokeDasharray={`${Dash_On} ${Dash_Off}`}
              opacity={0.55}
            />
            {/* Active arc */}
            <circle
              cx={Size / 2}
              cy={Size / 2}
              r={Radius}
              fill="none"
              stroke={Color}
              strokeWidth={Stroke_Width}
              strokeDasharray={`${Dash_On} ${Dash_Off}`}
              strokeDashoffset={Offset}
              className="transition-all duration-700 ease-out"
              style={{ strokeDashoffset: -((1 - Percentage) * Circumference) }}
            />
          </>
        ) : (
          <>
            <circle
              cx={Size / 2}
              cy={Size / 2}
              r={Radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={Stroke_Width}
            />
            <circle
              cx={Size / 2}
              cy={Size / 2}
              r={Radius}
              fill="none"
              stroke={Color}
              strokeWidth={Stroke_Width}
              strokeDasharray={Circumference}
              strokeDashoffset={Offset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </>
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums">
          {Label}
        </span>
        {Sublabel && (
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-0.5">
            {Sublabel}
          </span>
        )}
      </div>
    </div>
  );
}