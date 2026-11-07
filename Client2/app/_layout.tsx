
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
} from "expo-router";

import * as SplashScreen from "expo-splash-screen";

import {
  useEffect,
  useState,
} from "react";

import "react-native-reanimated";
import "@/../global.css";

import { useColorScheme } from "@/Component/useColorScheme";
import { Layout } from "@/Component/Layout/Index";
import { UI } from "@/Context/UI";

import {
  Page_Transition_Provider,
} from "@/Component/Layout/Navigation/Page_Transition/Provider";
import {
  Page_Transition_Overlay_Host,
} from "@/Component/Layout/Navigation/Page_Transition/Overlay_Host";
import { Register_Service_Worker } from "@/Library/Register_Service_Worker.web";

Register_Service_Worker();

export {
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  anchor: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {

  const [Loaded, Set_Loaded] = useState(false);

  useEffect(() => {

    async function Prepare() {

      try {

        // Wacht op eventuele benodigde componenten.

      } catch (Error_Value) {

        console.warn(
          "Skia preload mislukt:",
          Error_Value
        );

      } finally {

        Set_Loaded(true);

        await SplashScreen.hideAsync();

      }

    }

    Prepare();

  }, []);

  if (!Loaded) {
    return null;
  }

  return (
    <UI>
  <Page_Transition_Provider>
    <Layout>
      <RootLayoutNav />
    </Layout>
    <Page_Transition_Overlay_Host />
  </Page_Transition_Provider>
</UI>
  );
}

function RootLayoutNav() {

  const Color_Scheme = useColorScheme();

  const Base_Theme =
    Color_Scheme === "dark"
      ? DarkTheme
      : DefaultTheme;

  const Theme = {
    ...Base_Theme,

    colors: {
      ...Base_Theme.colors,
      background: "transparent",
      card: "transparent",
    },
  };

  return (
    <ThemeProvider value={Theme}>
      <Stack
        screenOptions={{
          headerShown: false,

          contentStyle: {
            backgroundColor: "transparent",
          },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="modal"
          options={{
            presentation: "modal",
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
