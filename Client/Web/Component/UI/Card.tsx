import { Class_Names } from "@/Library/Utility";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  Active?: boolean;
  Is_Hoverable?: boolean;
}

export function Card({ children, className, onClick, Active, Is_Hoverable = true }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={Class_Names(
        "relative rounded-[40px] transition-all Duration-200",
        // SOFT defaults
        "bg-card text-card-foreground border border-border/30",
        Is_Hoverable && "group hover:bg-accent hover:border-border/50",
        Active && "bg-accent border-border/60",
        // HIGH-CONTRAST override
        "[.high-contrast_&]:bg-white [.high-contrast_&]:dark:bg-black",
        "[.high-contrast_&]:border-2 [.high-contrast_&]:border-black [.high-contrast_&]:dark:border-white",
        "[.high-contrast_&]:text-black [.high-contrast_&]:dark:text-white",
        Is_Hoverable && "[.high-contrast_&]:hover:bg-black [.high-contrast_&]:dark:hover:bg-white",
        Is_Hoverable && "[.high-contrast_&]:hover:border-white [.high-contrast_&]:dark:hover:border-black",
        Is_Hoverable && "[.high-contrast_&]:hover:text-white [.high-contrast_&]:dark:hover:text-black",
        Active && "[.high-contrast_&]:bg-black [.high-contrast_&]:dark:bg-white",
        Active && "[.high-contrast_&]:border-white [.high-contrast_&]:dark:border-black",
        Active && "[.high-contrast_&]:text-white [.high-contrast_&]:dark:text-black",
        className
      )}
    >
      {children}
    </div>
  );
}
