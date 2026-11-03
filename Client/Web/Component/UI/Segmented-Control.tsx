import React, { useState, useRef, useLayoutEffect } from "react";
import { Class_Names } from "@/Library/Utility";

export interface SegmentOption<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
  height?: number;
}

let filterIdCounter = 0;

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className,
  height = 42,
}: SegmentedControlProps<T>) {
  const [filterId] = useState(() => `segmented-goo-${++filterIdCounter}`);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [itemWidths, setItemWidths] = useState<number[]>([]);

  const activeIndex = options.findIndex((opt) => opt.id === value);
  const uiRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Measure button widths on mount and window resize
  useLayoutEffect(() => {
    const updateWidths = () => {
      const widths = uiRefs.current.map((el) => el?.offsetWidth || 0);
      setItemWidths(widths);
    };

    updateWidths();
    window.addEventListener("resize", updateWidths);
    return () => window.removeEventListener("resize", updateWidths);
  }, [options]);

  const GAP_SIZE = 12; // Gap separation in pixels
  const totalItems = options.length;

  // The *active* item is the primary, permanent anchor — it never moves,
  // regardless of what's hovered elsewhere. Its neighbors separate away
  // from it to form the base gaps.
  //
  // Hovering a different item only opens ONE additional gap, and only on
  // the side of that item that isn't already separated by the active gap
  // (e.g. active=Dark, hover=Light → Light is already next to Dark's gap,
  // so only Auto moves further away; Light itself stays put). If the
  // hovered item already has gaps on both sides from the active selection
  // (e.g. active is in the middle and you hover either neighbor), hovering
  // changes nothing — it's already fully separated.
  const shifts = new Array(totalItems).fill(0);

  if (activeIndex !== -1) {
    for (let j = 0; j < activeIndex; j++) shifts[j] -= GAP_SIZE;
    for (let j = activeIndex + 1; j < totalItems; j++) shifts[j] += GAP_SIZE;

    if (hoverIndex !== null && hoverIndex !== activeIndex) {
      if (hoverIndex > activeIndex) {
        for (let j = hoverIndex + 1; j < totalItems; j++) shifts[j] += GAP_SIZE;
      } else {
        for (let j = 0; j < hoverIndex; j++) shifts[j] -= GAP_SIZE;
      }
    }
  } else if (hoverIndex !== null) {
    // No active selection at all — hover alone acts as the anchor.
    for (let j = 0; j < hoverIndex; j++) shifts[j] -= GAP_SIZE;
    for (let j = hoverIndex + 1; j < totalItems; j++) shifts[j] += GAP_SIZE;
  }

  return (
    <div
      className={Class_Names("relative inline-flex items-center select-none", className)}
      style={{ height: `${height}px` }}
    >
      {/* SVG Gooey Matrix Filter */}
      <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden="true">
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 18 -8"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Liquid Backings Layer */}
      <div
        className="relative flex items-center h-full pointer-events-none"
        style={{ filter: `url(#${filterId})` }}
      >
        {options.map((_, k) => {
          const myShift = shifts[k] || 0;
          const prevShift = k > 0 ? shifts[k - 1] : myShift;
          const nextShift = k + 1 < totalItems ? shifts[k + 1] : myShift;

          const hasGapLeft = k > 0 && myShift > prevShift;
          const hasGapRight = k + 1 < totalItems && nextShift > myShift;

          // Determine border radiuses based on gaps
          let borderRadiusStyle: React.CSSProperties = { borderRadius: 0 };

          if (hasGapLeft && hasGapRight) {
            borderRadiusStyle = { borderRadius: "16px" };
          } else {
            if (hasGapLeft || k === 0) {
              borderRadiusStyle = {
                ...borderRadiusStyle,
                borderTopLeftRadius: "16px",
                borderBottomLeftRadius: "16px",
              };
            }
            if (hasGapRight || k === totalItems - 1) {
              borderRadiusStyle = {
                ...borderRadiusStyle,
                borderTopRightRadius: "16px",
                borderBottomRightRadius: "16px",
              };
            }
          }

          const width = itemWidths[k] || 0;

          return (
            <div
              key={k}
              className="bg-black transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] shrink-0"
              style={{
                height: `${height}px`,
                width: `${width}px`,
                transform: `translateX(${myShift}px)`,
                marginRight: k === totalItems - 1 ? 0 : -1,
                ...borderRadiusStyle,
              }}
            />
          );
        })}
      </div>

      {/* Foreground UI Layer */}
      <div className="absolute top-0 left-0 h-full flex items-center z-10">
        {options.map((opt, k) => {
          const isSelected = value === opt.id;
          const shift = shifts[k] || 0;

          return (
            <button
              key={opt.id}
              ref={(el) => {
                uiRefs.current[k] = el;
              }}
              type="button"
              onClick={() => onChange(opt.id)}
              onMouseEnter={() => setHoverIndex(k)}
              onMouseLeave={() => setHoverIndex(null)}
              className={Class_Names(
                "flex items-center justify-center gap-2 px-4 h-full text-xs font-semibold whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer outline-none focus:outline-none",
                isSelected
                  ? "text-white font-bold"
                  : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              )}
              style={{
                transform: `translateX(${shift}px)`,
              }}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}