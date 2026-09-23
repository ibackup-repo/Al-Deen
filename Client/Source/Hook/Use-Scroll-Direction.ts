import { useState, useEffect, useRef } from "react";

export function Use_Scroll_Direction() {
  const [Scroll_Direction, Set_Scroll_Direction] = useState<"up" | "down">("up");
  const [Is_At_Top, Set_Is_At_Top] = useState(true);
  const Last_Scroll_Y = useRef(0);

  useEffect(() => {
    const Handle_Window_Scroll_Event = () => {
      const Current_Scroll_Y = window.scrollY;

      Set_Is_At_Top(Current_Scroll_Y < 10);
      
      if (Math.abs(Current_Scroll_Y - Last_Scroll_Y.current) < 3) {
        return;
      }
      
      if (Current_Scroll_Y > Last_Scroll_Y.current) {
        Set_Scroll_Direction("down");
      } else {
        Set_Scroll_Direction("up");
      }
      
      Last_Scroll_Y.current = Current_Scroll_Y;
    };

    window.addEventListener("scroll", Handle_Window_Scroll_Event, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", Handle_Window_Scroll_Event);
    };
  }, []);

  return { Scroll_Direction, Is_At_Top };
}