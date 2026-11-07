import React, {
  createContext,
  useContext,
} from "react";

import type {
  Page_Transition_Actions_Type,
  Page_Transition_Context_Type,
  Page_Transition_Overlay_State,
} from "./Types";

/* -------------------------------------------------------------------------- */
/* Drie contexten, zodat een wijziging alleen renderet wie het nodig heeft    */
/* -------------------------------------------------------------------------- */

// Stabiel, verandert nooit.
export const Page_Transition_Actions_Context =
  createContext<Page_Transition_Actions_Type | undefined>(
    undefined
  );

// Is_Transitioning en Is_Covered (plus de stabiele acties).
export const Page_Transition_Context =
  createContext<Page_Transition_Context_Type | undefined>(
    undefined
  );

// Alleen voor Overlay_Host: verandert vaak tijdens een transitie.
export const Page_Transition_Overlay_Context =
  createContext<Page_Transition_Overlay_State | undefined>(
    undefined
  );

const Fout = (Naam: string) =>
  new Error(
    `${Naam} moet binnen Page_Transition_Provider worden gebruikt.`
  );

// Voor knoppen die alleen willen navigeren: rendert nooit opnieuw
// door een transitie.
export const Use_Page_Transition_Actions = () => {
  const Context = useContext(Page_Transition_Actions_Context);

  if (!Context) {
    throw Fout("Use_Page_Transition_Actions");
  }

  return Context;
};

// Zelfde als voorheen, maar zonder Overlay_State.
export const Use_Page_Transition = () => {
  const Context = useContext(Page_Transition_Context);

  if (!Context) {
    throw Fout("Use_Page_Transition");
  }

  return Context;
};

// Alleen voor Overlay_Host.
export const Use_Page_Transition_Overlay = () => {
  const Context = useContext(Page_Transition_Overlay_Context);

  if (!Context) {
    throw Fout("Use_Page_Transition_Overlay");
  }

  return Context;
};