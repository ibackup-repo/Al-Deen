import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
} from "react";

import {
  View,
  LayoutChangeEvent,
} from "react-native";

import {
  usePathname,
} from "expo-router";

import {
  Easing,
  ReduceMotion,
  runOnJS,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import Settings from "./Settings";

import {
  Page_Transition_Actions_Context,
  Page_Transition_Context,
  Page_Transition_Overlay_Context,
} from "./Context";

import type {
  Page_Transition_Origin,
  Page_Transition_Entry,
  Page_Transition_Actions_Type,
  Page_Transition_Context_Type,
  Page_Transition_Overlay_State,
} from "./Types";

interface Provider_Properties {
  children: React.ReactNode;
}

interface Viewport_Size_Type {
  Width: number;
  Height: number;
}

const Normalize_Path = (Path: string) => {
  const Clean_Path = Path.split("?")[0].replace(/\/+$/, "");

  return Clean_Path || "/";
};

// ReduceMotion.Never: animatie draait ook als "Reduce motion" aanstaat.
const Move_Config = {
  duration: Settings.Duration,
  easing: Easing.inOut(Easing.cubic),
  reduceMotion: ReduceMotion.Never,
};

const Fade_Config = {
  duration: Settings.Fade_Duration,
  easing: Easing.out(Easing.cubic),
  reduceMotion: ReduceMotion.Never,
};

export const Page_Transition_Provider = ({
  children,
}: Provider_Properties) => {

  /* ---------------------------------------------------------- */
  /* Router                                                     */
  /* ---------------------------------------------------------- */

  const Current_Pathname = usePathname();

  /* ---------------------------------------------------------- */
  /* Refs                                                       */
  /* ---------------------------------------------------------- */

  const Viewport_Ref = useRef<View>(null);

  // Opslag: welke knop leidde van welke pagina naar welke pagina.
  const History_Ref = useRef<Page_Transition_Entry[]>([]);

  const Last_Pathname = useRef(Normalize_Path(Current_Pathname));

  const Pending_Navigation = useRef<(() => void) | null>(null);

  const Pending_Path = useRef<string | null>(null);

  const Is_Transitioning_Ref = useRef(false);

  const Animation_Frame = useRef<number | null>(null);

  const Open_Animation_Started = useRef(false);

  const Route_Fade_Started = useRef(false);

  // true zolang de overlay na een navigatie blijft staan.
  const Kept_Overlay_Ref = useRef(false);

  /* ---------------------------------------------------------- */
  /* State                                                      */
  /* ---------------------------------------------------------- */

  const [Visible, Set_Visible] = useState(false);

  const [Is_Transitioning, Set_Is_Transitioning] =
    useState(false);

  const [Origin, Set_Origin] =
    useState<Page_Transition_Origin | null>(null);

  const [Label, Set_Label] = useState("");

  // Startkleur van de overlay: hangt af van de pagina waar de knop op staat.
  const [Start_Color, Set_Start_Color] = useState<string>(
    Settings.Start_Color_On_Light_Page
  );

  // true: de pagina staat op de blijvende achtergrond (overlay vervangen).
  const [Is_Covered, Set_Is_Covered] = useState(false);

  const [Navigation_Started, Set_Navigation_Started] =
    useState(false);

  const [Viewport_Size, Set_Viewport_Size] =
    useState<Viewport_Size_Type>({
      Width: 0,
      Height: 0,
    });

  /* ---------------------------------------------------------- */
  /* Shared values                                              */
  /* ---------------------------------------------------------- */

  const Progress = useSharedValue(0);

  const Opacity = useSharedValue(1);

  /* ---------------------------------------------------------- */
  /* Helpers                                                    */
  /* ---------------------------------------------------------- */

  const Set_Transitioning = useCallback((Value: boolean) => {
    Is_Transitioning_Ref.current = Value;
    Set_Is_Transitioning(Value);
  }, []);

  // true als deze pagina via een overlay-transitie is bereikt en dus
  // op de blijvende achtergrond hoort te staan. Dit leest de history,
  // zodat het ook klopt als je terugkeert naar een tussenliggende pagina
  // (bijv. Aid, die zelf via root -> Aid is geopend).
  const Is_Destination_Path = useCallback((Path: string) => {

    return History_Ref.current.some((Entry) =>
      Path === Entry.To_Path ||
      Path.startsWith(Entry.To_Path + "/")
    );

  }, []);

  const Wait_Frames = useCallback(
    (Callback: () => void, Count: number = 2) => {

      const Step = (Remaining: number) => {

        Animation_Frame.current = requestAnimationFrame(() => {

          if (Remaining <= 1) {
            Animation_Frame.current = null;
            Callback();
          } else {
            Step(Remaining - 1);
          }

        });

      };

      Step(Count);

    },
    []
  );

  const Handle_Viewport_Layout = useCallback(
    (Event: LayoutChangeEvent) => {
      const { width, height } = Event.nativeEvent.layout;

      Set_Viewport_Size({
        Width: width,
        Height: height,
      });
    },
    []
  );

  /* ---------------------------------------------------------- */
  /* Vooruit: afronden (overlay verbergen)                      */
  /* ---------------------------------------------------------- */

  const Finish_Open = useCallback(() => {

    Set_Visible(false);

    Set_Transitioning(false);

    Set_Navigation_Started(false);

    Pending_Path.current = null;

    Route_Fade_Started.current = false;

    Kept_Overlay_Ref.current = false;

  }, [
    Set_Transitioning,
  ]);

  /* ---------------------------------------------------------- */
  /* Vooruit: afronden maar overlay laten staan                 */
  /* ---------------------------------------------------------- */

  const Finish_Open_Keep = useCallback(() => {

    // Eerst de achtergrond onder de pagina zetten...
    Set_Is_Covered(true);

    Set_Transitioning(false);

    Set_Navigation_Started(false);

    Pending_Path.current = null;

    Route_Fade_Started.current = false;

    Kept_Overlay_Ref.current = true;

    // ...en de overlay pas daarna weghalen, zodat er geen flits is.
    Wait_Frames(() => {

      if (Kept_Overlay_Ref.current && !Is_Transitioning_Ref.current) {
        Set_Visible(false);
      }

    }, 2);

  }, [
    Set_Transitioning,
    Wait_Frames,
  ]);

  /* ---------------------------------------------------------- */
  /* Vooruit: afhandelen zodra de bestemming staat              */
  /* ---------------------------------------------------------- */

  useEffect(() => {

    if (
      !Navigation_Started ||
      !Pending_Path.current ||
      !Visible ||
      Route_Fade_Started.current
    ) {
      return;
    }

    const Target_Path = Normalize_Path(
      Pending_Path.current
    );

    const Active_Path = Normalize_Path(
      Current_Pathname
    );

    // Wacht tot Expo Router echt op de bestemming staat.
    if (Active_Path !== Target_Path) {
      return;
    }

    Route_Fade_Started.current = true;

    // Geef de bestemmingspagina twee frames om te renderen.
    Wait_Frames(() => {

      if (Settings.Keep_Overlay_After_Navigation) {
        Finish_Open_Keep();
        return;
      }

      Opacity.value = withTiming(
        0,
        Fade_Config,
        (Finished) => {

          if (Finished) {
            runOnJS(Finish_Open)();
          }

        }
      );

    }, 2);

  }, [
    Current_Pathname,
    Navigation_Started,
    Visible,
    Opacity,
    Finish_Open,
    Finish_Open_Keep,
    Wait_Frames,
  ]);

  /* ---------------------------------------------------------- */
  /* Vooruit: vergroten klaar -> navigeren                      */
  /* ---------------------------------------------------------- */

  const Complete_Open = useCallback(() => {

    const Navigate = Pending_Navigation.current;

    Pending_Navigation.current = null;

    if (!Navigate) {
      Set_Visible(false);
      Set_Transitioning(false);
      return;
    }

    // Overlay blijft fullscreen zichtbaar tot de route gewisseld is.
    Opacity.value = 1;

    Set_Navigation_Started(true);

    Navigate();

  }, [
    Opacity,
    Set_Transitioning,
  ]);

  /* ---------------------------------------------------------- */
  /* Vooruit: vergrotingsanimatie starten                       */
  /* ---------------------------------------------------------- */

  useEffect(() => {

    if (
      !Visible ||
      !Origin ||
      Viewport_Size.Width <= 0 ||
      Viewport_Size.Height <= 0 ||
      !Pending_Navigation.current ||
      Open_Animation_Started.current
    ) {
      return;
    }

    Open_Animation_Started.current = true;

    Wait_Frames(() => {

      Progress.value = withTiming(
        1,
        Move_Config,
        (Finished) => {

          if (Finished) {
            runOnJS(Complete_Open)();
          }

        }
      );

    }, 1);

  }, [
    Visible,
    Origin,
    Viewport_Size,
    Progress,
    Complete_Open,
    Wait_Frames,
  ]);

  /* ---------------------------------------------------------- */
  /* Vooruit: starten                                           */
  /* ---------------------------------------------------------- */

  const Navigate_With_Transition = useCallback(
    (
      Path: string,
      New_Origin: Page_Transition_Origin,
      New_Label: string,
      Navigate: () => void
    ) => {

      if (!Settings.Enabled || !Viewport_Ref.current) {
        Navigate();
        return;
      }

      if (Is_Transitioning_Ref.current) {
        return;
      }

      Set_Transitioning(true);

      Open_Animation_Started.current = false;

      Route_Fade_Started.current = false;

      Pending_Navigation.current = Navigate;

      Pending_Path.current = Normalize_Path(Path);

      Set_Navigation_Started(false);

      Set_Label(New_Label);

      Viewport_Ref.current.measureInWindow(
        (Viewport_X, Viewport_Y, Viewport_Width, Viewport_Height) => {

          if (Viewport_Width <= 0 || Viewport_Height <= 0) {
            Pending_Navigation.current = null;
            Pending_Path.current = null;
            Set_Transitioning(false);
            Navigate();
            return;
          }

          const Local_Origin: Page_Transition_Origin = {
            X: New_Origin.X - Viewport_X,
            Y: New_Origin.Y - Viewport_Y,
            Width: New_Origin.Width,
            Height: New_Origin.Height,
            Border_Radius: New_Origin.Border_Radius,
          };

          // Staat de knop op een pagina die zelf op de blijvende zwarte
          // laag staat (bijv. Aid)? Dan start de overlay wit, anders zwart.
          const On_Dark_Page =
            Settings.Keep_Overlay_After_Navigation &&
            Is_Destination_Path(Last_Pathname.current);

          const Entry_Start_Color = On_Dark_Page
            ? Settings.Start_Color_On_Dark_Page
            : Settings.Start_Color_On_Light_Page;

          // Opslaan: vanaf deze pagina, via deze knop, naar die pagina.
          // De startkleur wordt meegenomen, zodat de terug-animatie
          // weer naar precies dezelfde kleur krimpt.
          History_Ref.current.push({
            From_Path: Last_Pathname.current,
            To_Path: Normalize_Path(Path),
            Origin: Local_Origin,
            Label: New_Label,
            Start_Color: Entry_Start_Color,
          });

          Set_Start_Color(Entry_Start_Color);

          Set_Viewport_Size({
            Width: Viewport_Width,
            Height: Viewport_Height,
          });

          Set_Origin(Local_Origin);

          Progress.value = 0;

          Opacity.value = 1;

          Set_Visible(true);

        }
      );

    },
    [
      Progress,
      Opacity,
      Set_Transitioning,
      Is_Destination_Path,
    ]
  );

  /* ---------------------------------------------------------- */
  /* Terug: afronden                                            */
  /* ---------------------------------------------------------- */

  const Finish_Back = useCallback(() => {

    // Staan we na het terugkeren nog op een pagina die zelf via een
    // transitie is geopend (bijv. Aid), dan moet de achtergrond blijven.
    const Still_Covered = Is_Destination_Path(
      Last_Pathname.current
    );

    Set_Visible(false);

    Set_Transitioning(false);

    Kept_Overlay_Ref.current = Still_Covered;

    Set_Is_Covered(Still_Covered);

    Progress.value = 0;

    Opacity.value = 1;

  }, [
    Progress,
    Opacity,
    Set_Transitioning,
    Is_Destination_Path,
  ]);

  /* ---------------------------------------------------------- */
  /* Terug: detecteren via pathname                             */
  /* ---------------------------------------------------------- */

  useLayoutEffect(() => {

    const Previous = Last_Pathname.current;

    const Current = Normalize_Path(Current_Pathname);

    Last_Pathname.current = Current;

    if (Previous === Current) {
      return;
    }

    // Tijdens een vooruit-animatie verandert de route ook; negeren.
    if (Is_Transitioning_Ref.current) {
      return;
    }

    if (!Settings.Enabled || Viewport_Size.Width <= 0) {
      return;
    }

    const History = History_Ref.current;

    // Zoek het laatste item waar we nu naar teruggekeerd zijn.
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

      // Blijvende overlay, maar we verlaten de bestemming op een manier
      // die niet in de history staat (tab-wissel, replace, ...).
      // Dan ruimen we de overlay meteen op zodat hij niet blijft hangen.
      if (Kept_Overlay_Ref.current) {
        Kept_Overlay_Ref.current = false;
        Set_Is_Covered(false);
        Set_Visible(false);
        Progress.value = 0;
        Opacity.value = 1;
      }

      return;
    }

    const Entry = History[Found_Index];

    // Dit item en alles daarna is nu afgehandeld.
    History_Ref.current = History.slice(0, Found_Index);

    // Is de pagina waar we naartoe gaan zelf een bestemming (Aid)?
    // Dan blijft de achtergrond eronder staan.
    const Still_Covered = Is_Destination_Path(Current);

    Set_Transitioning(true);

    Set_Label(Entry.Label);

    Set_Origin(Entry.Origin);

    // Krimp terug naar de kleur waarmee deze transitie startte.
    Set_Start_Color(Entry.Start_Color);

    // Start fullscreen, zodat de pagina eronder niet zichtbaar flitst.
    Progress.value = 1;

    Opacity.value = 1;

    Set_Visible(true);

    // Geef de vorige pagina twee frames om te renderen...
    Wait_Frames(() => {

      // De overlay ligt nu fullscreen erover: achtergrond veilig aanpassen.
      Set_Is_Covered(Still_Covered);

      Kept_Overlay_Ref.current = Still_Covered;

      // ...en wacht nog even tot die thema-wissel gerenderd is, zodat het
      // hertekenen van de pagina niet samenvalt met het begin van het krimpen.
      Wait_Frames(() => {

        Progress.value = withTiming(
          0,
          Move_Config,
          (Finished) => {

            if (Finished) {
              runOnJS(Finish_Back)();
            }

          }
        );

      }, 3);

    }, 2);

  }, [
    Current_Pathname,
    Viewport_Size.Width,
    Progress,
    Opacity,
    Set_Transitioning,
    Finish_Back,
    Wait_Frames,
    Is_Destination_Path,
  ]);

  /* ---------------------------------------------------------- */
  /* Cleanup                                                    */
  /* ---------------------------------------------------------- */

  useEffect(() => {

    return () => {

      if (Animation_Frame.current !== null) {
        cancelAnimationFrame(Animation_Frame.current);
      }

    };

  }, []);

  /* ---------------------------------------------------------- */
  /* Context                                                    */
  /* ---------------------------------------------------------- */

  // Drie gememoriseerde contexten. Een knop die alleen navigeert gebruikt
  // de Actions-context en rendert dan nooit opnieuw door een transitie.
  // Overlay_State verandert tijdens een transitie meerdere keren, en wordt
  // alleen door Overlay_Host gelezen.
  const Actions_Value = useMemo<Page_Transition_Actions_Type>(
    () => ({
      Navigate_With_Transition,
      Viewport_Ref,
      Handle_Viewport_Layout,
    }),
    [
      Navigate_With_Transition,
      Handle_Viewport_Layout,
    ]
  );

  const Context_Value = useMemo<Page_Transition_Context_Type>(
    () => ({
      Is_Transitioning,
      Is_Covered,
      Navigate_With_Transition,
      Viewport_Ref,
      Handle_Viewport_Layout,
    }),
    [
      Is_Transitioning,
      Is_Covered,
      Navigate_With_Transition,
      Handle_Viewport_Layout,
    ]
  );

  const Overlay_Value = useMemo<Page_Transition_Overlay_State>(
    () => ({
      Visible,
      Origin,
      Label,
      Start_Color,
      Progress,
      Opacity,
      Width: Viewport_Size.Width,
      Height: Viewport_Size.Height,
    }),
    [
      Visible,
      Origin,
      Label,
      Start_Color,
      Progress,
      Opacity,
      Viewport_Size.Width,
      Viewport_Size.Height,
    ]
  );

  return (
    <Page_Transition_Actions_Context.Provider value={Actions_Value}>
      <Page_Transition_Context.Provider value={Context_Value}>
        <Page_Transition_Overlay_Context.Provider value={Overlay_Value}>
          {children}
        </Page_Transition_Overlay_Context.Provider>
      </Page_Transition_Context.Provider>
    </Page_Transition_Actions_Context.Provider>
  );
};

export default Page_Transition_Provider;