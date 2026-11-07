import React, { ReactNode } from "react";

import {
  View,
  SafeAreaView,
  Platform,
} from "react-native";

import { Header } from "@/Component/Layout/Header/Index";

import {
  Page_Transition_Viewport,
} from "@/Component/Layout/Navigation/Page_Transition/Viewport";

/* -------------------------------------------------------------------------- */
/* Properties                                                                 */
/* -------------------------------------------------------------------------- */

interface LayoutProps {
  children: ReactNode;
  subHeader?: ReactNode;
  hideHeader?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Layout                                                                     */
/* -------------------------------------------------------------------------- */

export function Layout({
  children,
  subHeader,
  hideHeader = false,
}: LayoutProps) {
  return (
    <SafeAreaView
      className="flex-1 bg-gray-100"
      style={{
        overflow: "visible",
        backgroundColor: "#ffffff",

        ...Platform.select({
          ios: {
            paddingTop: 40,
          },

          android: {
            paddingTop: 40,
          },

          default: {},
        }),
      }}
    >
      {/* -------------------------------------------------------------- */}
      {/* Header                                                         */}
      {/* -------------------------------------------------------------- */}

      {!hideHeader && (
        <View
          className="w-full"
          style={{
            overflow: "visible",
            backgroundColor: "transparent",
          }}
        >
          <Header />
        </View>
      )}

      {/* -------------------------------------------------------------- */}
      {/* Sub Header                                                     */}
      {/* -------------------------------------------------------------- */}

      {subHeader && (
        <View
          className="bg-transparent border-b border-gray-100 px-4 py-2"
          style={{
            overflow: "visible",
            backgroundColor: "transparent",
          }}
        >
          {subHeader}
        </View>
      )}

      {/* -------------------------------------------------------------- */}
      {/* Page Content (onder de header, hier tekent de overlay)         */}
      {/* -------------------------------------------------------------- */}

      <Page_Transition_Viewport
        style={{
          overflow: "hidden",
          backgroundColor: "transparent",
        }}
      >
        {children}
      </Page_Transition_Viewport>
    </SafeAreaView>
  );
}

export default Layout;