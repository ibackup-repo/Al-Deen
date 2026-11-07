import React from "react";

import {
  View,
  useWindowDimensions,
} from "react-native";

import { useIsFocused } from "expo-router";

import {
  Button,
} from "@/Component/UI/Button/Index";

/* ---------------------------------------------------------- */
/* Button component                                           */
/* Staat buiten Aid, zodat React hem niet bij elke render     */
/* opnieuw opbouwt.                                           */
/* ---------------------------------------------------------- */

const Aid_Button = ({
  Label,
  Path,
  Width,
}: {
  Label: string;
  Path: string;
  Width?: number | string;
}) => {

  return (
    <View
      style={{
        width: Width ?? "100%",
        overflow: "visible",
      }}
    >
      <Button
        Label={Label}
        Navigate_To={Path}
        Height={64}
        Transition_Border_Radius={12}
      />
    </View>
  );
};

const Aid = () => {

  const { width: screenWidth } = useWindowDimensions();

  const Is_Focused = useIsFocused();

  // Mobiel: 1 kolom (zelfde breekpunt als de homepagina)
  const isMobile = screenWidth < 768;

  // px-8 = 32 links + 32 rechts
  const containerPadding = 64;

  const availableWidth =
    screenWidth - containerPadding;

  // Rij 1: 3 kolommen
  const row1Gap = 16;
  const row1Cols = 3;

  const row1ButtonWidth =
    (availableWidth - row1Gap * (row1Cols - 1)) /
    row1Cols;

  // Rij 2: 2 kolommen
  const row2Gap = 32;
  const row2Cols = 2;

  const row2ButtonWidth =
    (availableWidth - row2Gap * (row2Cols - 1)) /
    row2Cols;

  // Inactieve scene niet tekenen, zodat hij niet doorschijnt
  // onder andere pagina's.
  if (!Is_Focused) {
    return null;
  }

  /* ---------------------------------------------------------- */
  /* Render                                                     */
  /* ---------------------------------------------------------- */

  return (
    <View
      className="w-full px-8 py-8"
      style={{
        overflow: "visible",
      }}
    >

      {isMobile ? (

        /* ---------------------------------------------------- */
        /* Mobile: 1 column                                     */
        /* ---------------------------------------------------- */

        <View
          className="w-full"
          style={{
            rowGap: 16,
            overflow: "visible",
          }}
        >

          <Aid_Button
            Label="Hijri Calendar"
            Path="/Aid/Hijri-Calendar"
          />

          <Aid_Button
            Label="Prayer Time"
            Path="/Aid/Prayer-Time"
          />

          <Aid_Button
            Label="Masjid Finder"
            Path="/Aid/Masjid-Finder"
          />

          <Aid_Button
            Label="Tasbih Counter"
            Path="/Aid/Tasbih-Counter"
          />

          <Aid_Button
            Label="Qibla Direction"
            Path="/Aid/Qibla-Direction"
          />

        </View>

      ) : (

        /* ---------------------------------------------------- */
        /* Desktop / Tablet                                     */
        /* ---------------------------------------------------- */

        <View
          className="w-full"
          style={{
            rowGap: 16,
            overflow: "visible",
          }}
        >

          {/* Eerste rij */}

          <View
            className="flex-row w-full"
            style={{
              columnGap: row1Gap,
              overflow: "visible",
            }}
          >

            <Aid_Button
              Label="Hijri Calendar"
              Path="/Aid/Hijri-Calendar"
              Width={row1ButtonWidth}
            />

            <Aid_Button
              Label="Prayer Time"
              Path="/Aid/Prayer-Time"
              Width={row1ButtonWidth}
            />

            <Aid_Button
              Label="Masjid Finder"
              Path="/Aid/Masjid-Finder"
              Width={row1ButtonWidth}
            />

          </View>

          {/* Tweede rij */}

          <View
            className="flex-row w-full"
            style={{
              columnGap: row2Gap,
              overflow: "visible",
            }}
          >

            <Aid_Button
              Label="Tasbih Counter"
              Path="/Aid/Tasbih-Counter"
              Width={row2ButtonWidth}
            />

            <Aid_Button
              Label="Qibla Direction"
              Path="/Aid/Qibla-Direction"
              Width={row2ButtonWidth}
            />

          </View>

        </View>

      )}

    </View>
  );
};

export default Aid;