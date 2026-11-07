import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Settings from "./Settings";
import {
  Page_Transition_Overlay,
  type Overlay_Mode,
  type Page_Transition_Origin,
} from "./Overlay";

/* ------------------------------ Types ------------------------------ */

interface Page_Transition_Entry {
  From_Path: string;
  To_Path: string;
  Origin: Page_Transition_Origin;
  Label: string;
  Start_Color: string;
}

interface Overlay_State {
  Origin: Page_Transition_Origin;
  Label: string;
  Start_Color: string;
  Mode: Overlay_Mode;
}

interface Actions_Type {
  Navigate_With_Transition: (
    Path: string,
    Origin: Page_Transition_Origin,
    Label: string,
    Navigate: () => void
  ) => void;
}

interface State_Type {
  Is_Transitioning: boolean;
  Is_Covered: boolean;
}

/* ----------------------------- Contexten ---------------------------- */

const Actions_Context = createContext<Actions_Type | undefined>(undefined);
const State_Context = createContext<State_Type | undefined>(undefined);

export const Use_Page_Transition = () => {
  const Context = useContext(State_Context);
  if (!Context) {
    throw new Error("Use_Page_Transition moet binnen Page_Transition_Provider.");
  }
  return Context;
};

// Veilig buiten de provider: geeft undefined terug.
export const Use_Page_Transition_Optional = () => useContext(State_Context);

// Navigeren met transitie vanaf een element (bijv. een knop).
// Zonder provider of element: gewoon navigeren.
export const Use_Transition_Navigate = () => {
  const Navigate = useNavigate();
  const Actions = useContext(Actions_Context);

  return useCallback(
    (
      Path: string,
      Element: HTMLElement | null,
      Label = "",
      Border_Radius = 12
    ) => {
      const Go = () => Navigate(Path);

      if (!Actions || !Element) {
        Go();
        return;
      }

      const Rect = Element.getBoundingClientRect();

      if (Rect.width <= 0 || Rect.height <= 0) {
        Go();
        return;
      }

      Actions.Navigate_With_Transition(
        Path,
        {
          X: Rect.left,
          Y: Rect.top,
          Width: Rect.width,
          Height: Rect.height,
          Border_Radius,
        },
        Label,
        Go
      );
    },
    [Actions, Navigate]
  );
};

/* ----------------------------- Helpers ------------------------------ */

const Normalize_Path = (Path: string) =>
  Path.split("?")[0].replace(/\/+$/, "") || "/";

const Frames = (Count: number) =>
  new Promise<void>((Resolve) => {
    const Step = (Remaining: number) =>
      requestAnimationFrame(() =>
        Remaining <= 1 ? Resolve() : Step(Remaining - 1)
      );
    Step(Count);
  });

/* ----------------------------- Provider ----------------------------- */

export const Page_Transition_Provider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const { pathname } = useLocation();

  const History_Ref = useRef<Page_Transition_Entry[]>([]);
  const Last_Pathname = useRef(Normalize_Path(pathname));
  const Pending_Navigation = useRef<(() => void) | null>(null);
  const Pending_Path = useRef<string | null>(null);
  const Waiting_Route = useRef(false);
  const Is_Transitioning_Ref = useRef(false);
  const Covered_Ref = useRef(false);

  const [Overlay, Set_Overlay] = useState<Overlay_State | null>(null);
  const [Is_Transitioning, Set_Is_Transitioning] = useState(false);
  const [Is_Covered, Set_Is_Covered] = useState(false);

  const Set_Transitioning = useCallback((Value: boolean) => {
    Is_Transitioning_Ref.current = Value;
    Set_Is_Transitioning(Value);
  }, []);

  const Set_Covered = useCallback((Value: boolean) => {
    Covered_Ref.current = Value;
    Set_Is_Covered(Value);
  }, []);

  // Staat deze pagina op de blijvende achtergrond?
  const Is_Destination_Path = useCallback(
    (Path: string) =>
      History_Ref.current.some(
        (Entry) =>
          Path === Entry.To_Path || Path.startsWith(Entry.To_Path + "/")
      ),
    []
  );

  /* ---------------------- Vooruit: afronden ---------------------- */

  const Finish_Open = useCallback(async () => {
    Waiting_Route.current = false;
    Pending_Path.current = null;

    // Bestemmingspagina twee frames geven om te renderen...
    await Frames(2);

    // ...achtergrond eronder zetten...
    Set_Covered(true);
    Set_Transitioning(false);

    // ...en de overlay pas daarna weghalen (geen flits).
    await Frames(2);

    if (!Is_Transitioning_Ref.current) {
      Set_Overlay(null);
    }
  }, [Set_Covered, Set_Transitioning]);

  // Route is gewisseld naar de bestemming.
  useEffect(() => {
    if (!Waiting_Route.current || Pending_Path.current === null) return;
    if (Normalize_Path(pathname) !== Pending_Path.current) return;

    void Finish_Open();
  }, [pathname, Finish_Open]);

  // Vergroten klaar -> navigeren.
  const Handle_Open_Done = useCallback(() => {
    const Navigate = Pending_Navigation.current;
    Pending_Navigation.current = null;

    if (!Navigate) {
      Set_Overlay(null);
      Set_Transitioning(false);
      return;
    }

    Set_Overlay((Previous) => Previous && { ...Previous, Mode: "hold" });

    Waiting_Route.current = true;
    Navigate();

    // Navigeren naar dezelfde pagina: pathname verandert niet.
    if (Last_Pathname.current === Pending_Path.current) {
      void Finish_Open();
    }
  }, [Finish_Open, Set_Transitioning]);

  /* ------------------------ Vooruit: starten ------------------------ */

  const Navigate_With_Transition = useCallback(
    (
      Path: string,
      Origin: Page_Transition_Origin,
      Label: string,
      Navigate: () => void
    ) => {
      if (!Settings.Enabled) {
        Navigate();
        return;
      }

      if (Is_Transitioning_Ref.current) return;

      const Target = Normalize_Path(Path);

      // Staat de knop op een pagina op de blijvende laag? Dan start de
      // overlay wit, anders zwart.
      const Start_Color = Is_Destination_Path(Last_Pathname.current)
        ? Settings.Start_Color_On_Dark_Page
        : Settings.Start_Color_On_Light_Page;

      History_Ref.current.push({
        From_Path: Last_Pathname.current,
        To_Path: Target,
        Origin,
        Label,
        Start_Color,
      });

      Set_Transitioning(true);
      Pending_Navigation.current = Navigate;
      Pending_Path.current = Target;

      Set_Overlay({ Origin, Label, Start_Color, Mode: "open" });
    },
    [Is_Destination_Path, Set_Transitioning]
  );

  /* -------------------------- Terug: afronden ------------------------- */

  const Finish_Back = useCallback(() => {
    Set_Overlay(null);
    Set_Transitioning(false);
    Set_Covered(Is_Destination_Path(Last_Pathname.current));
  }, [Is_Destination_Path, Set_Covered, Set_Transitioning]);

  /* ------------------- Terug: detecteren via pathname ------------------ */

  useLayoutEffect(() => {
    const Previous = Last_Pathname.current;
    const Current = Normalize_Path(pathname);
    Last_Pathname.current = Current;

    if (Previous === Current) return;

    // Tijdens een vooruit-animatie verandert de route ook; negeren.
    if (Is_Transitioning_Ref.current) return;
    if (!Settings.Enabled) return;

    const History = History_Ref.current;

    let Found_Index = -1;

    for (let Index = History.length - 1; Index >= 0; Index--) {
      const Entry = History[Index];

      const Came_From_Destination =
        Previous === Entry.To_Path ||
        Previous.startsWith(Entry.To_Path + "/");

      if (Entry.From_Path === Current && Came_From_Destination) {
        Found_Index = Index;
        break;
      }
    }

    if (Found_Index === -1) {
      // Bestemming verlaten op een manier die niet in de history staat
      // (andere link, replace, ...): achtergrond meteen opruimen.
      if (Covered_Ref.current) {
        Set_Covered(false);
        Set_Overlay(null);
      }
      return;
    }

    const Entry = History[Found_Index];
    History_Ref.current = History.slice(0, Found_Index);

    const Still_Covered = Is_Destination_Path(Current);

    Set_Transitioning(true);

    // Start fullscreen, zodat de pagina eronder niet zichtbaar flitst.
    Set_Overlay({
      Origin: Entry.Origin,
      Label: Entry.Label,
      Start_Color: Entry.Start_Color,
      Mode: "hold",
    });

    void (async () => {
      await Frames(2);
      Set_Covered(Still_Covered);

      await Frames(3);
      Set_Overlay((Previous_State) =>
        Previous_State && { ...Previous_State, Mode: "close" }
      );
    })();
  }, [pathname, Is_Destination_Path, Set_Covered, Set_Transitioning]);

  /* ------------------------------ Context ----------------------------- */

  const Actions_Value = useMemo(
    () => ({ Navigate_With_Transition }),
    [Navigate_With_Transition]
  );

  const State_Value = useMemo(
    () => ({ Is_Transitioning, Is_Covered }),
    [Is_Transitioning, Is_Covered]
  );

  return (
    <Actions_Context.Provider value={Actions_Value}>
      <State_Context.Provider value={State_Value}>
        {children}

        {Overlay && (
          <Page_Transition_Overlay
            Origin={Overlay.Origin}
            Label={Overlay.Label}
            Start_Color={Overlay.Start_Color}
            Mode={Overlay.Mode}
            On_Open_Done={Handle_Open_Done}
            On_Close_Done={Finish_Back}
          />
        )}
      </State_Context.Provider>
    </Actions_Context.Provider>
  );
};

export default Page_Transition_Provider;