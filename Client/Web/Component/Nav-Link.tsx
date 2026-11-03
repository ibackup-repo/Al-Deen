import { NavLink as RouterNavLink, NavLinkProperties } from "react-router-dom";
import { forwardRef } from "react";
import { Class_Names } from "@/Library/Utility";

interface Nav_Link_Compat_Properties extends Omit<NavLinkProperties, "className"> {
  className?: string;
  Active_Class_Name?: string;
  Pending_Class_Name?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, Nav_Link_Compat_Properties>(
  ({ className, Active_Class_Name, Pending_Class_Name, to, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          Class_Names(className, isActive && Active_Class_Name, isPending && Pending_Class_Name)
        }
        {...props}
      />
    );
  },
);

NavLink.Display_Name = "NavLink";

export { NavLink };
