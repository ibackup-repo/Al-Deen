import { useRef, useEffect } from "react";
import { Class_Names } from "@/Library/Utility";

interface LiquidToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  className?: string;
}

export function LiquidToggle({ checked, onChange, className }: LiquidToggleProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const morphRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const glyphRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  const TRAVEL_DIST = 36;
  const isDragging = useRef(false);
  const startX = useRef(0);
  const lastX = useRef(0);

  const updateGlyph = (progress: number) => {
    const p = Math.max(0, Math.min(1, progress));
    const topY = 4 + p * 2;
    const bottomY = 20 - p * 2;
    const controlX = p * 8.8;
    const pathD = `M 12 ${topY} C ${12 + controlX} ${topY}, ${12 + controlX} ${bottomY}, 12 ${bottomY} C ${12 - controlX} ${bottomY}, ${12 - controlX} ${topY}, 12 ${topY}`;
    if (pathRef.current) {
      pathRef.current.setAttribute("d", pathD);
    }
  };

  const renderPosition = (x: number, stretch = 1, isHover = false) => {
    const clampedX = Math.max(0, Math.min(TRAVEL_DIST, x));
    const originX = checked ? TRAVEL_DIST : 0;
    const progress = clampedX / TRAVEL_DIST;

    updateGlyph(progress);

    if (morphRef.current && glyphRef.current && anchorRef.current) {
      if (isHover && !isDragging.current) {
        const hoverOffset = (x - (originX + 17)) * 0.25;
        const hoverClamped = Math.max(-8, Math.min(8, hoverOffset));

        morphRef.current.style.transform = `translateX(${originX + hoverClamped}px) scaleX(1.15) scaleY(0.92)`;
        glyphRef.current.style.transform = `translateX(${originX + hoverClamped}px)`;
        anchorRef.current.style.transform = `translateX(${originX}px) scale(0.95)`;
      } else {
        morphRef.current.style.transform = `translateX(${clampedX}px) scaleX(${stretch})`;
        glyphRef.current.style.transform = `translateX(${clampedX}px)`;

        const anchorLag = (clampedX - originX) * 0.3;
        anchorRef.current.style.transform = `translateX(${originX + anchorLag}px) scale(${Math.max(0.7, 1 - Math.abs(clampedX - originX) * 0.018)})`;
      }
    }
  };

  const snapToState = (targetState: boolean) => {
    isDragging.current = false;
    const springTransition = "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)";

    if (morphRef.current && anchorRef.current && glyphRef.current) {
      morphRef.current.style.transition = springTransition;
      anchorRef.current.style.transition = springTransition;
      glyphRef.current.style.transition = springTransition;
    }

    const finalX = targetState ? TRAVEL_DIST : 0;
    renderPosition(finalX, 1, false);
  };

  useEffect(() => {
    snapToState(checked);
  }, [checked]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    lastX.current = e.clientX;

    if (morphRef.current && anchorRef.current && glyphRef.current) {
      morphRef.current.style.transition = "none";
      anchorRef.current.style.transition = "none";
      glyphRef.current.style.transition = "none";
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging.current) {
      const deltaX = e.clientX - startX.current;
      const rawX = (checked ? TRAVEL_DIST : 0) + deltaX;
      const velocity = e.clientX - lastX.current;
      lastX.current = e.clientX;

      const stretchFactor = 1 + Math.min(Math.abs(velocity) * 0.035, 0.65);
      renderPosition(rawX, stretchFactor, false);
    } else if (stageRef.current) {
      const rect = stageRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      renderPosition(relativeX, 1, true);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const deltaX = e.clientX - startX.current;
    if (Math.abs(deltaX) < 4) {
      onChange(!checked);
    } else {
      const finalX = (checked ? TRAVEL_DIST : 0) + deltaX;
      onChange(finalX >= TRAVEL_DIST / 2);
    }
  };

  return (
    <div
      ref={stageRef}
      className={Class_Names(
        "relative w-[80px] h-[44px] cursor-pointer touch-none select-none scale-75 origin-right",
        className
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => snapToState(checked)}
    >
      {/* Track Background */}
      <div
        className={Class_Names(
          "absolute inset-0 rounded-full transition-colors duration-350",
          checked ? "bg-[#22c55e]" : "bg-[#ef4444]"
        )}
      />

      {/* SVG Goo Filter Defs */}
      <svg className="absolute w-0 h-0 pointer-events-none">
        <defs>
          <filter id="fluid-goo-io">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 20 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Glyph Overlay */}
      <div
        ref={glyphRef}
        className="absolute top-[5px] left-[5px] w-[34px] h-[34px] flex items-center justify-center pointer-events-none z-10"
      >
        <svg className="w-[16px] h-[16px] overflow-visible" viewBox="0 0 24 24">
          <path
            ref={pathRef}
            className={Class_Names(
              "fill-none stroke-[3] [stroke-linecap:round] [stroke-linejoin:round] transition-colors duration-350",
              checked ? "stroke-[#15803d]" : "stroke-[#0f172a]"
            )}
            d="M 12 4 L 12 20 M 12 4 L 12 20"
          />
        </svg>
      </div>

      {/* Gooey Layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ filter: "url('#fluid-goo-io')" }}
      >
        <div
          ref={anchorRef}
          className="absolute top-[5px] left-[5px] w-[34px] h-[34px] bg-white rounded-full"
        />
        <div
          ref={morphRef}
          className="absolute top-[5px] left-[5px] w-[34px] h-[34px] bg-white rounded-full"
        />
      </div>
    </div>
  );
}