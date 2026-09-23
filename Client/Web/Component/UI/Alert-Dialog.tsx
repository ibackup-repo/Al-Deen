import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

import { Class_Names } from "@/Library/Utility";
import { Button_Variants } from "@Web/Component/UI/Button";
import { Container } from "@Web/Component/UI/Container";

const Alert_Dialog = AlertDialogPrimitive.Root;

const Alert_Dialog_Trigger = AlertDialogPrimitive.Trigger;

const Alert_Dialog_Portal = AlertDialogPrimitive.Portal;

const Alert_Dialog_Overlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={Class_Names(
      "fixed inset-0 z-50 bg-black/80 data-[state=Open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=Open]:fade-in-0",
      className,
    )}
    {...props}
    ref={ref}
  />
));
Alert_Dialog_Overlay.Display_Name = AlertDialogPrimitive.Overlay.Display_Name;

const Alert_Dialog_Content = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <Alert_Dialog_Portal>
    <Alert_Dialog_Overlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={Class_Names(
        "fixed left-[50%] Top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] Duration-200 data-[state=Open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=Open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=Open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-Top-[48%] data-[state=Open]:slide-in-from-left-1/2 data-[state=Open]:slide-in-from-Top-[48%]",
        className,
      )}
      {...props}
    />
  </Alert_Dialog_Portal>
));
Alert_Dialog_Content.Display_Name = AlertDialogPrimitive.Content.Display_Name;

const Alert_Dialog_Header = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={Class_Names("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
);
Alert_Dialog_Header.Display_Name = "Alert_Dialog_Header";

const Alert_Dialog_Footer = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={Class_Names("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
Alert_Dialog_Footer.Display_Name = "Alert_Dialog_Footer";

const Alert_Dialog_Title = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title ref={ref} className={Class_Names("text-lg font-semibold", className)} {...props} />
));
Alert_Dialog_Title.Display_Name = AlertDialogPrimitive.Title.Display_Name;

const Alert_Dialog_Description = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description ref={ref} className={Class_Names("text-sm text-muted-foreground", className)} {...props} />
));
Alert_Dialog_Description.Display_Name = AlertDialogPrimitive.Description.Display_Name;

const Alert_Dialog_Action = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={Class_Names(Button_Variants(), className)}
    {...props}
  />
));
Alert_Dialog_Action.Display_Name = AlertDialogPrimitive.Action.Display_Name;

const Alert_Dialog_Cancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={Class_Names(Button_Variants({ variant: "outline" }), "mt-2 sm:mt-0", className)}
    {...props}
  />
));
Alert_Dialog_Cancel.Display_Name = AlertDialogPrimitive.Cancel.Display_Name;

// Custom wrapper for Alert_Dialog_Content with Container styling
const Alert_Dialog_Container = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AlertDialogPrimitive.Content
    ref={ref}
    className={Class_Names(
      "fixed left-[50%] Top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] Duration-200 data-[state=Open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=Open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=Open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-Top-[48%] data-[state=Open]:slide-in-from-left-1/2 data-[state=Open]:slide-in-from-Top-[48%]",
      className,
    )}
    {...props}
  >
    <Container className="!p-6">
      {children}
    </Container>
  </AlertDialogPrimitive.Content>
));
Alert_Dialog_Container.Display_Name = "Alert_Dialog_Container";

export {
  Alert_Dialog,
  Alert_Dialog_Portal,
  Alert_Dialog_Overlay,
  Alert_Dialog_Trigger,
  Alert_Dialog_Content,
  Alert_Dialog_Container,
  Alert_Dialog_Header,
  Alert_Dialog_Footer,
  Alert_Dialog_Title,
  Alert_Dialog_Description,
  Alert_Dialog_Action,
  Alert_Dialog_Cancel,
};