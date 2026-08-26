import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { Class_Names } from "@/Library/Utility";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={Class_Names(
      "inline-flex items-center justify-center rounded-[40px] bg-muted/30 p-1",
      className,
    )}
    {...props}
  />
));
TabsList.Display_Name = TabsPrimitive.List.Display_Name;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={Class_Names(
      "inline-flex items-center justify-center whitespace-nowrap rounded-[40px] px-4 py-2 text-sm font-medium transition-all Duration-200",
      "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "data-[state=Active]:bg-white dark:data-[state=Active]:bg-black data-[state=Active]:text-foreground data-[state=Active]:shadow-sm",
      "data-[state=Active]:border-2 data-[state=Active]:border-black dark:data-[state=Active]:border-white",
      "hover:bg-black/5 dark:hover:bg-white/5",
      className,
    )}
    {...props}
  />
));
TabsTrigger.Display_Name = TabsPrimitive.Trigger.Display_Name;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={Class_Names(
      "mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.Display_Name = TabsPrimitive.Content.Display_Name;

export { Tabs, TabsList, TabsTrigger, TabsContent };