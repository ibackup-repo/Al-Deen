import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: ReactNode;
}

export function Page_Transition({ children }: PageTransitionProps) {
  const Location_Data = useLocation();
  const [Is_Visible, setIsVisible] = useState(false);
  const [displaychildren, setDisplaychildren] = useState(children);

  // Animate only on page navigation
  useEffect(() => {
    setIsVisible(false);
    
    const Timeout = setTimeout(() => {
      setDisplaychildren(children);
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(Timeout);
  }, [Location_Data.pathname]);

  // Update content without animation when children change within same page
  useEffect(() => {
    if (Is_Visible) {
      setDisplaychildren(children);
    }
  }, [children]);

  return (
    <div
      className={` Duration-300 ease-out ${
        Is_Visible 
          ? "opacity-100" 
          : "opacity-0"
      }`}
    >
      {displaychildren}
    </div>
  );
}