import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { Class_Names } from "@/Library/Utility";

const Popover = PopoverPrimitive.Root;

const Popover_Trigger = PopoverPrimitive.Trigger;

const Popover_Content = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={Class_Names(
        "z-50 w-72 rounded-xl border border-border/30 p-4 text-popover-foreground shadow-lg outline-none backdrop-blur-xl bg-popover/95 data-[state=Open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=Open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=Open]:zoom-in-95 data-[side=bottom]:slide-in-from-Top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=Top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
Popover_Content.Display_Name = PopoverPrimitive.Content.Display_Name;

export { Popover, Popover_Trigger, Popover_Content };
