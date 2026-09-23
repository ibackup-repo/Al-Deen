import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function Use_Is_Mobile() {
  const [Is_Mobile, Set_Is_Mobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const Media_Query_List = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const On_Change = () => {
      Set_Is_Mobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    Media_Query_List.addEventListener("change", On_Change);
    Set_Is_Mobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => Media_Query_List.removeEventListener("change", On_Change);
  }, []);

  return !!Is_Mobile;
}
