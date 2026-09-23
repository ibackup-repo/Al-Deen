import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import * as React from "react";

import { Class_Names } from "@/Library/Utility";
import { Container } from "@Web/Component/UI/Container";

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={Class_Names(
      "fixed inset-0 z-50 bg-black/80 data-[state=Open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=Open]:fade-in-0",
      className,
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.Display_Name = SheetPrimitive.Overlay.Display_Name;

const sheetVariants = cva(
  "fixed z-50 gap-4 shadow-lg transition ease-in-out data-[state=Open]:animate-in data-[state=closed]:animate-out data-[state=closed]:Duration-300 data-[state=Open]:Duration-500",
  {
    variants: {
      side: {
        Top: "inset-x-0 Top-0 data-[state=closed]:slide-out-to-Top data-[state=Open]:slide-in-from-Top",
        bottom:
          "inset-x-0 bottom-0 data-[state=closed]:slide-out-to-bottom data-[state=Open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-full data-[state=closed]:slide-out-to-left data-[state=Open]:slide-in-from-left sm:w-[var(--sidebar-width)] sm:max-w-[420px]",
        right:
          "inset-y-0 right-0 h-full w-full data-[state=closed]:slide-out-to-right data-[state=Open]:slide-in-from-right sm:w-[var(--sidebar-width)] sm:max-w-[420px]",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  hideCloseButton?: boolean;
}

const SheetContent = React.forwardRef<React.ElementRef<typeof SheetPrimitive.Content>, SheetContentProps>(
  ({ side = "right", className, children, hideCloseButton = false, ...props }, ref) => (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content ref={ref} className={Class_Names(sheetVariants({ side }), className)} {...props}>
        <Container className="h-full w-full !rounded-none flex flex-col overflow-hidden">
          {children}
          {!hideCloseButton && (
            <SheetPrimitive.Close className="absolute right-4 Top-4 rounded-full p-1.5 opacity-70 ring-offset-background transition-opacity hover:bg-black/10 dark:hover:bg-white/10 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none group">
              <X className="h-4 w-4 [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black" />
              <span className="sr-only">Close</span>
            </SheetPrimitive.Close>
          )}
        </Container>
      </SheetPrimitive.Content>
    </SheetPortal>
  ),
);
SheetContent.Display_Name = SheetPrimitive.Content.Display_Name;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={Class_Names("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
);
SheetHeader.Display_Name = "SheetHeader";

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={Class_Names("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
SheetFooter.Display_Name = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={Class_Names(
      "text-lg font-semibold [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black",
      className,
    )}
    {...props}
  />
));
SheetTitle.Display_Name = SheetPrimitive.Title.Display_Name;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={Class_Names(
      "text-sm text-muted-foreground [.high-contrast_&]:group-hover:text-white/70 [.high-contrast_&]:dark:group-hover:text-black/70",
      className,
    )}
    {...props}
  />
));
SheetDescription.Display_Name = SheetPrimitive.Description.Display_Name;

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};