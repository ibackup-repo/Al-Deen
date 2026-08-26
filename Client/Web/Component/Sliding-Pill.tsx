import { Class_Names } from "@/Library/Utility";
import { useRef, useEffect, useState, ReactNode } from "react";

interface SlidingPillOption {
  id: string;
  icon?: ReactNode;
  label?: string;
}

interface SlidingPillProps {
  options: SlidingPillOption[];
  value: string;
  On_Change: (value: string) => void;
  className?: string;
  size?: "sm" | "md";
}

export function SlidingPill({ options, value, On_Change, className, size = "sm" }: SlidingPillProps) {
  const Container_Reference = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  useEffect(() => {
    const activeBtn = buttonRefs.current.get(value);
    const Container = Container_Reference.current;
    if (activeBtn && Container) {
      const containerRect = Container.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      setIndicatorStyle({
        left: btnRect.left - containerRect.left,
        width: btnRect.width,
      });
    }
  }, [value, options]);

  const hasLabels = options.some(o => o.label);

  return (
    <div
      ref={Container_Reference}
      className={Class_Names(
        "relative inline-flex items-center p-1 rounded-full bg-muted/60 backdrop-blur-sm",
        className
      )}
    >
      {/* Sliding indicator */}
      <div
        className="absolute Top-1 rounded-full bg-foreground/10 backdrop-blur-sm shadow-sm transition-all Duration-300 ease-in-out"
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
          height: `calc(100% - 8px)`,
        }}
      />

      {options.map((option) => (
        <button
          key={option.id}
          ref={(el) => {
            if (el) buttonRefs.current.set(option.id, el);
          }}
          onClick={() => On_Change(option.id)}
          className={Class_Names(
            "relative z-10 flex items-center justify-center gap-1.5 rounded-full transition-colors Duration-300",
            hasLabels
              ? Class_Names("px-3 py-1.5", size === "md" ? "px-4 py-2" : "")
              : Class_Names(size === "sm" ? "w-8 h-8" : "w-9 h-9"),
            value === option.id
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.icon}
          {option.label && <span className={Class_Names("font-medium", size === "sm" ? "text-xs" : "text-sm")}>{option.label}</span>}
        </button>
      ))}
    </div>
  );
}
