import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { Class_Names } from "@/Library/Utility";
import { Container } from "@Web/Component/UI/Container";

const Dialog = DialogPrimitive.Root;
const Dialog_Trigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={Class_Names(
      "fixed inset-0 z-50 bg-black/80 data-[state=Open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=Open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.Display_Name = DialogPrimitive.Overlay.Display_Name;

const Dialog_Content = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={Class_Names(
        "fixed left-[50%] Top-[50%] z-50 w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 shadow-xl Duration-200 data-[state=Open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=Open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=Open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-Top-[48%] data-[state=Open]:slide-in-from-left-1/2 data-[state=Open]:slide-in-from-Top-[48%]",
        className,
      )}
      {...props}
    >
      <Container className="!p-6 relative">
        {children}
        <DialogPrimitive.Close className="absolute right-4 Top-4 rounded-full p-1.5 opacity-70 ring-offset-background transition-opacity hover:bg-muted hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none group">
          <X className="h-4 w-4 [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </Container>
    </DialogPrimitive.Content>
  </DialogPortal>
));
Dialog_Content.Display_Name = DialogPrimitive.Content.Display_Name;

const Dialog_Header = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={Class_Names("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
Dialog_Header.Display_Name = "Dialog_Header";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={Class_Names("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
DialogFooter.Display_Name = "DialogFooter";

const Dialog_Title = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={Class_Names(
      "text-lg font-semibold leading-none tracking-tight [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black",
      className
    )}
    {...props}
  />
));
Dialog_Title.Display_Name = DialogPrimitive.Title.Display_Name;

const Dialog_Description = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={Class_Names(
      "text-sm text-muted-foreground [.high-contrast_&]:group-hover:text-white/70 [.high-contrast_&]:dark:group-hover:text-black/70",
      className
    )}
    {...props}
  />
));
Dialog_Description.Display_Name = DialogPrimitive.Description.Display_Name;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  Dialog_Trigger,
  Dialog_Content,
  Dialog_Header,
  DialogFooter,
  Dialog_Title,
  Dialog_Description,
};