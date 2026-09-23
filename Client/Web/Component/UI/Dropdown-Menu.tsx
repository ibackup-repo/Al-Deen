import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";

import { Class_Names } from "@/Library/Utility";

const Dropdown_Menu = DropdownMenuPrimitive.Root;
const Dropdown_Menu_Trigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuGroup = DropdownMenuPrimitive.Group;
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
const DropdownMenuSub = DropdownMenuPrimitive.Sub;
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={Class_Names(
      "flex cursor-default select-none items-center px-3 py-2.5 text-sm outline-none transition-colors data-[state=Open]:bg-accent focus:bg-accent first:rounded-t-[38px] last:rounded-b-[38px]",
      // High-contrast state overrides
      "[.high-contrast_&]:data-[state=Open]:bg-black [.high-contrast_&]:dark:data-[state=Open]:bg-white",
      "[.high-contrast_&]:data-[state=Open]:text-white [.high-contrast_&]:dark:data-[state=Open]:text-black",
      "[.high-contrast_&]:focus:bg-black [.high-contrast_&]:dark:focus:bg-white",
      "[.high-contrast_&]:focus:text-white [.high-contrast_&]:dark:focus:text-black",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.Display_Name = DropdownMenuPrimitive.SubTrigger.Display_Name;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={Class_Names(
      "z-50 min-w-[8rem] overflow-hidden rounded-[40px] p-0 shadow-lg data-[state=Open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=Open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=Open]:zoom-in-95 data-[side=bottom]:slide-in-from-Top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=Top]:slide-in-from-bottom-2",
      // SOFT default layout
      "bg-card text-card-foreground border border-border/30",
      // HIGH-CONTRAST override 
      "[.high-contrast_&]:bg-white [.high-contrast_&]:dark:bg-black",
      "[.high-contrast_&]:border-2 [.high-contrast_&]:border-black [.high-contrast_&]:dark:border-white",
      className,
    )}
    {...props}
  />
));
DropdownMenuSubContent.Display_Name = DropdownMenuPrimitive.SubContent.Display_Name;

const Dropdown_Menu_Content = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={Class_Names(
        "z-50 min-w-[8rem] overflow-hidden rounded-[40px] p-0 shadow-lg data-[state=Open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=Open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=Open]:zoom-in-95 data-[side=bottom]:slide-in-from-Top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=Top]:slide-in-from-bottom-2",
        // SOFT default layout
        "bg-card text-card-foreground border border-border/30",
        // HIGH-CONTRAST override
        "[.high-contrast_&]:bg-white [.high-contrast_&]:dark:bg-black",
        "[.high-contrast_&]:border-2 [.high-contrast_&]:border-black [.high-contrast_&]:dark:border-white",
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
Dropdown_Menu_Content.Display_Name = DropdownMenuPrimitive.Content.Display_Name;

const Dropdown_Menu_Item = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={Class_Names(
      "relative flex cursor-pointer select-none items-center px-3 py-2.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 first:rounded-t-[38px] last:rounded-b-[38px]",
      // SOFT default hover
      "hover:bg-black/5 dark:hover:bg-white/5 focus:bg-black/5 dark:focus:bg-white/5",
      // HIGH-CONTRAST hover inversion
      "[.high-contrast_&]:hover:bg-black [.high-contrast_&]:dark:hover:bg-white",
      "[.high-contrast_&]:hover:text-white [.high-contrast_&]:dark:hover:text-black",
      "[.high-contrast_&]:focus:bg-black [.high-contrast_&]:dark:focus:bg-white",
      "[.high-contrast_&]:focus:text-white [.high-contrast_&]:dark:focus:text-black",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
Dropdown_Menu_Item.Display_Name = Dropdown_Menu_Item.Display_Name;

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={Class_Names(
      "relative flex cursor-default select-none items-center py-2.5 pl-8 pr-3 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 first:rounded-t-[38px] last:rounded-b-[38px] group",
      // SOFT default hover
      "hover:bg-black/5 dark:hover:bg-white/5 focus:bg-black/5 dark:focus:bg-white/5",
      // HIGH-CONTRAST hover inversion
      "[.high-contrast_&]:hover:bg-black [.high-contrast_&]:dark:hover:bg-white",
      "[.high-contrast_&]:hover:text-white [.high-contrast_&]:dark:hover:text-black",
      "[.high-contrast_&]:focus:bg-black [.high-contrast_&]:dark:focus:bg-white",
      "[.high-contrast_&]:focus:text-white [.high-contrast_&]:dark:focus:text-black",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4 [.high-contrast_&]:text-white [.high-contrast_&]:dark:text-black" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.Display_Name = DropdownMenuCheckboxItem.Display_Name;

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={Class_Names(
      "relative flex cursor-default select-none items-center py-2.5 pl-8 pr-3 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 first:rounded-t-[38px] last:rounded-b-[38px] group",
      // SOFT default hover
      "hover:bg-black/5 dark:hover:bg-white/5 focus:bg-black/5 dark:focus:bg-white/5",
      // HIGH-CONTRAST hover inversion
      "[.high-contrast_&]:hover:bg-black [.high-contrast_&]:dark:hover:bg-white",
      "[.high-contrast_&]:hover:text-white [.high-contrast_&]:dark:hover:text-black",
      "[.high-contrast_&]:focus:bg-black [.high-contrast_&]:dark:focus:bg-white",
      "[.high-contrast_&]:focus:text-white [.high-contrast_&]:dark:focus:text-black",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current [.high-contrast_&]:text-white [.high-contrast_&]:dark:text-black" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.Display_Name = DropdownMenuRadioItem.Display_Name;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={Class_Names(
      "px-3 py-2 text-sm font-semibold opacity-80",
      "[.high-contrast_&]:opacity-100 [.high-contrast_&]:text-black [.high-contrast_&]:dark:text-white",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.Display_Name = DropdownMenuPrimitive.Label.Display_Name;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator 
    ref={ref} 
    className={Class_Names(
      "h-px bg-border/40 my-0",
      // High contrast thick line
      "[.high-contrast_&]:bg-black [.high-contrast_&]:dark:bg-white [.high-contrast_&]:h-[2px]",
      className
    )} 
    {...props} 
  />
));
DropdownMenuSeparator.Display_Name = DropdownMenuPrimitive.Separator.Display_Name;

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span 
      className={Class_Names(
        "ml-auto text-xs tracking-widest opacity-60",
        className
      )} 
      {...props} 
    />
  );
};
DropdownMenuShortcut.Display_Name = "DropdownMenuShortcut";

export {
  Dropdown_Menu,
  Dropdown_Menu_Trigger,
  Dropdown_Menu_Content,
  Dropdown_Menu_Item,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};