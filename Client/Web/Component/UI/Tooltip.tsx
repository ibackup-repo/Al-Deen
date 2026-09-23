import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { Class_Names } from "@/Library/Utility";

const Tooltip_Provider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const Tooltip_Trigger = TooltipPrimitive.Trigger;

const Tooltip_Content = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={Class_Names(
      "z-50 px-3 py-1.5 text-xs font-medium text-center rounded-full",
      "bg-card text-card-foreground border border-border/40 shadow-md backdrop-blur-sm",
      "[.high-contrast_&]:bg-white [.high-contrast_&]:dark:bg-black",
      "[.high-contrast_&]:text-black [.high-contrast_&]:dark:text-white",
      "[.high-contrast_&]:border-2 [.high-contrast_&]:border-black [.high-contrast_&]:dark:border-white",
      "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-Top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=Top]:slide-in-from-bottom-2",
      className,
    )}
    {...props}
  />
));
Tooltip_Content.Display_Name = TooltipPrimitive.Content.Display_Name;

export { Tooltip, Tooltip_Trigger, Tooltip_Content, Tooltip_Provider };
