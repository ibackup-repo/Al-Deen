import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { Class_Names } from "@/Library/Utility";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors Duration-200",
  {
    variants: {
      variant: {
        default: "text-foreground",
        muted: "text-muted-foreground",
        primary: "text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
  withHover?: boolean;
}

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, variant, withHover = true, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={Class_Names(
      labelVariants({ variant }),
      withHover && "[.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black",
      className,
    )}
    {...props}
  />
));
Label.Display_Name = LabelPrimitive.Root.Display_Name;

export { Label };