import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { Class_Names } from "@/Library/Utility";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={Class_Names(
      "fixed Top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:Top-auto sm:flex-col md:max-w-[420px]",
      className,
    )}
    {...props}
  />
));
ToastViewport.Display_Name = ToastPrimitives.Viewport.Display_Name;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-[40px] border-2 p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-Toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-Toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=Open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=Open]:slide-in-from-Top-full data-[state=Open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "bg-white dark:bg-black border-black dark:border-white text-foreground",
        destructive: "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return <ToastPrimitives.Root ref={ref} className={Class_Names(toastVariants({ variant }), className)} {...props} />;
});
Toast.Display_Name = ToastPrimitives.Root.Display_Name;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={Class_Names(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-[40px] border-2 border-black dark:border-white bg-transparent px-3 text-sm font-medium transition-all Duration-200",
      "ring-offset-background hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black",
      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground",
      className,
    )}
    {...props}
  />
));
ToastAction.Display_Name = ToastPrimitives.Action.Display_Name;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={Class_Names(
      "absolute right-2 Top-2 rounded-full p-1.5 text-foreground/50 opacity-0 transition-all Duration-200 group-hover:opacity-100",
      "hover:bg-black/10 dark:hover:bg-white/10 hover:text-foreground",
      "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary",
      "group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50",
      className,
    )}
    Toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.Display_Name = ToastPrimitives.Close.Display_Name;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={Class_Names(
      "text-sm font-semibold [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black",
      className,
    )}
    {...props}
  />
));
ToastTitle.Display_Name = ToastPrimitives.Title.Display_Name;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={Class_Names(
      "text-sm opacity-90 [.high-contrast_&]:group-hover:text-white/70 [.high-contrast_&]:dark:group-hover:text-black/70",
      className,
    )}
    {...props}
  />
));
ToastDescription.Display_Name = ToastPrimitives.Description.Display_Name;

type Toast_Props = React.ComponentPropsWithoutRef<typeof Toast>;

type Toast_Action_Element = React.ReactElement<typeof ToastAction>;

export {
  type Toast_Props,
  type Toast_Action_Element,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};