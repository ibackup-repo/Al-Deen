import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { Class_Names } from "@/Library/Utility";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  Active_Class_Name?: string;
  Pending_Class_Name?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, Active_Class_Name, Pending_Class_Name, to, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ Is_Active, isPending }) =>
          Class_Names(className, Is_Active && Active_Class_Name, isPending && Pending_Class_Name)
        }
        {...props}
      />
    );
  },
);

NavLink.Display_Name = "NavLink";

export { NavLink };
