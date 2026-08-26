import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Class_Names } from "@/Library/Utility";
import { Container } from "@Web/Component/UI/Container";

const Alert_Variants = cva(
  "relative w-full [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:Top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof Alert_Variants>
>(({ className, variant, ...props }, ref) => (
  <Container
    ref={ref}
    role="alert"
    className={Class_Names(
      Alert_Variants({ variant }),
      "!py-4 !px-5 group",
      variant === "destructive" && "border-destructive/50",
      className
    )}
    {...props}
  />
));
Alert.Display_Name = "Alert";

const Alert_Title = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={Class_Names(
        "mb-1 font-medium leading-none tracking-tight text-foreground",
        "[.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black",
        className
      )}
      {...props}
    />
  ),
);
Alert_Title.Display_Name = "Alert_Title";

const Alert_Description = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={Class_Names(
        "text-sm text-muted-foreground [&_p]:leading-relaxed",
        "[.high-contrast_&]:group-hover:text-white/70 [.high-contrast_&]:dark:group-hover:text-black/70",
        className
      )}
      {...props}
    />
  ),
);
Alert_Description.Display_Name = "Alert_Description";

export { Alert, Alert_Title, Alert_Description };