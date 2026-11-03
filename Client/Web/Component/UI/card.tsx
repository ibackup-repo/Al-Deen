import * as React from "react";

import { Class_Names } from "@/Library/Utility";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={Class_Names("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
));
Card.Display_Name = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={Class_Names("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.Display_Name = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={Class_Names("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
CardTitle.Display_Name = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={Class_Names("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.Display_Name = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={Class_Names("p-6 pt-0", className)} {...props} />,
);
CardContent.Display_Name = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={Class_Names("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.Display_Name = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };