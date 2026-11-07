import { View, useWindowDimensions } from "react-native";
import { useIsFocused } from "expo-router";
import { Button } from "@/Component/UI/Button/Index";

const Index = () => {
  const { width: screenWidth } = useWindowDimensions();

  const Is_Focused = useIsFocused();

  // Schermbreekpunt voor mobiel
  const isMobile = screenWidth < 768;

  const containerPadding = 32;
  const availableWidth = screenWidth - containerPadding;

  // Desktop berekeningen
  const row1Gap = 16;
  const row1Cols = 3;
  const row1ButtonWidth =
    (availableWidth - row1Gap * (row1Cols - 1)) / row1Cols;

  const row2Gap = 32;
  const row2Cols = 2;
  const row2ButtonWidth =
    (availableWidth - row2Gap * (row2Cols - 1)) / row2Cols;

  const Button_Properties = {
    Height: 64,
    Transition_Border_Radius: 12,
  };

  // Inactieve tab-scene niet tekenen, zodat hij niet doorschijnt
  // onder andere pagina's.
  if (!Is_Focused) {
    return null;
  }

  return (
    <View className="w-full px-4 py-2" style={{ overflow: "visible" }}>
      {isMobile ? (
        /* MOBIELE LAYOUT */
        <View
          className="w-full"
          style={{ rowGap: 16, overflow: "visible" }}
        >
          <View style={{ width: "100%", overflow: "visible" }}>
            <Button
              Label="Quran"
              Path="/Quran"
              {...Button_Properties}
            />
          </View>

          <View style={{ width: "100%", overflow: "visible" }}>
            <Button
              Label="Hadith"
              Path="/Hadith"
              {...Button_Properties}
            />
          </View>

          <View style={{ width: "100%", overflow: "visible" }}>
            <Button
              Label="AI"
              Path="/AI"
              {...Button_Properties}
            />
          </View>

          <View style={{ width: "100%", overflow: "visible" }}>
            <Button
              Label="Ilm"
              Path="/Ilm"
              {...Button_Properties}
            />
          </View>

          <View style={{ width: "100%", overflow: "visible" }}>
            <Button
              Label="Aid"
              Path="/Aid"
              {...Button_Properties}
            />
          </View>
        </View>
      ) : (
        /* DESKTOP LAYOUT */
        <View
          className="w-full"
          style={{ rowGap: 16, overflow: "visible" }}
        >
          {/* EERSTE RIJ */}
          <View
            className="flex-row w-full"
            style={{
              columnGap: row1Gap,
              overflow: "visible",
            }}
          >
            <View
              style={{
                width: row1ButtonWidth,
                overflow: "visible",
              }}
            >
              <Button
                Label="Quran"
                Path="/Quran"
                {...Button_Properties}
              />
            </View>

            <View
              style={{
                width: row1ButtonWidth,
                overflow: "visible",
              }}
            >
              <Button
                Label="Hadith"
                Path="/Hadith"
                {...Button_Properties}
              />
            </View>

            <View
              style={{
                width: row1ButtonWidth,
                overflow: "visible",
              }}
            >
              <Button
                Label="AI"
                Path="/AI"
                {...Button_Properties}
              />
            </View>
          </View>

          {/* TWEEDE RIJ */}
          <View
            className="flex-row w-full"
            style={{
              columnGap: row2Gap,
              overflow: "visible",
            }}
          >
            <View
              style={{
                width: row2ButtonWidth,
                overflow: "visible",
              }}
            >
              <Button
                Label="Ilm"
                Path="/Ilm"
                {...Button_Properties}
              />
            </View>

            <View
              style={{
                width: row2ButtonWidth,
                overflow: "visible",
              }}
            >
              <Button
                Label="Aid"
                Path="/Aid"
                {...Button_Properties}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default Index;