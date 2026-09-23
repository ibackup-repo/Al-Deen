import { Use_App } from "@Web/Context/App";
import { Get_Translation, Is_RTL_Language, Translation_Keys } from "@/Internationalization";

export function Use_Translation() {
  const { Current_Language } = Use_App();
  
  const t = Get_Translation(Current_Language);
  const Is_RTL = Is_RTL_Language(Current_Language);
  const dir = Is_RTL ? "rtl" : "ltr";
  
  return {
    t,
    Is_RTL,
    dir,
    Current_Language,
  };
}

export type { Translation_Keys };
