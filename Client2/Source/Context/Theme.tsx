import { createContext, useContext } from "react";

import type { Theme_Mode } from "@/Component/UI/Button/Types";

// Standaard Light. Alles buiten een provider (zoals de header)
// blijft dus automatisch Light.
export const Theme_Context = createContext<Theme_Mode>("Light");

export const Use_Theme = () => useContext(Theme_Context);

export default Theme_Context;