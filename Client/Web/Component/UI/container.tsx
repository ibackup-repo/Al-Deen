import { Class_Names } from "@/Library/Utility";
import { ReactNode } from "react";

interface ContainerProperties {
  children: ReactNode;
  className?: string;
}

/**
 * Non-interactable container surface.
 * White background, black border, black text. No hover, no scale.
 */
export function Container({ children, className }: ContainerProperties) {
  return (
    <div
      className={Class_Names(
        "rounded-[20px] bg-background border-2 border-border text-foreground p-4",
        className
      )}
    >
      {children}
    </div>
  );
}