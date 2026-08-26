import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { Class_Names } from "@/Library/Utility";

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={Class_Names(
      "shrink-0 bg-border/50 transition-all Duration-200",
      orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
      className,
    )}
    {...props}
  />
));
Separator.Display_Name = SeparatorPrimitive.Root.Display_Name;

export { Separator };