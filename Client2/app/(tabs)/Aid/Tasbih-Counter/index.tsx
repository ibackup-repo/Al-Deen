import React, { useContext, useEffect, useRef, useState } from "react";

import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  Platform,
  ScrollView,
  useWindowDimensions,
  type TextStyle,
} from "react-native";

import Svg, { Circle } from "react-native-svg";

import {
  RotateCcw,
  Fingerprint,
  Edit2,
  Check,
  Repeat,
} from "lucide-react-native";

import { Container } from "@/Component/UI/Container/Index";
import { Button } from "@/Component/UI/Button/Index";
import { Theme_Context } from "@/Context/Theme";

const HOLD_DURATION = 1000;
const INTERVAL_STEP = 10;

// Ontwerpmaten (de ruimste uitvoering). Alles schaalt hier vanaf.
const DESIGN_CIRCLE_SIZE = 224;
const DESIGN_ICON_SIZE = 160;
const DESIGN_COUNTER_FONT = 68;

const MAX_CONTENT_WIDTH = 448;
const PAGE_PADDING_HORIZONTAL = 16;

// De svg tekent altijd in een vaste viewBox, dus de cirkelwiskunde
// blijft hetzelfde, ook als de cirkel kleiner wordt getoond.
const CIRCLE_RADIUS = 104;
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

const Clamp = (Value: number, Min: number, Max: number) =>
  Math.max(Min, Math.min(Max, Value));

const Aid_Tasbih_Counter = () => {
  const { width: Screen_Width, height: Screen_Height } =
    useWindowDimensions();

  // Op gsm staat de vingerafdruk onderaan, binnen bereik van de duim.
  const Is_Mobile = Screen_Width < 768;

  /* -------------------------------------------------------------- */
  /* Thema                                                          */
  /* De pagina is transparant. Het zwarte vlak wordt door           */
  /* Page_Transition_Viewport eronder getekend, dus in "Dark"       */
  /* gebruiken we lichte kleuren.                                   */
  /* -------------------------------------------------------------- */

  const Theme = useContext(Theme_Context);
  const Is_Dark = Theme === "Dark";

  const Primary_Color = Is_Dark ? "#FFFFFF" : "#111111";
  const Muted_Color = Is_Dark ? "#666666" : "#CCCCCC";
  const Fingerprint_Base_Color = Is_Dark ? "#555555" : "#888888";
  const Circle_Track_Color = Is_Dark ? "#333333" : "#DDDDDD";
  const Circle_Progress_Color = Is_Dark ? "#FFFFFF" : "#222222";

  const Action_Button_Color = Is_Dark ? "#FFFFFF" : "#222222";
  const Action_Icon_Color = Is_Dark ? "#111111" : "#FFFFFF";

  /* -------------------------------------------------------------- */
  /* Responsive maten                                               */
  /* -------------------------------------------------------------- */

  const Content_Width =
    Math.min(Screen_Width, MAX_CONTENT_WIDTH) -
    PAGE_PADDING_HORIZONTAL * 2;

  // Cirkel: past in de breedte én in de hoogte van het scherm.
  const Circle_Size = Clamp(
    Math.min(
      DESIGN_CIRCLE_SIZE,
      Content_Width * 0.75,
      Screen_Height * 0.3
    ),
    140,
    DESIGN_CIRCLE_SIZE
  );

  const Scale = Circle_Size / DESIGN_CIRCLE_SIZE;

  const Icon_Size = Math.round(DESIGN_ICON_SIZE * Scale);

  const Counter_Font = Clamp(
    Content_Width * 0.2,
    40,
    DESIGN_COUNTER_FONT
  );

  const Font_Scale = Counter_Font / DESIGN_COUNTER_FONT;

  const [Count, Set_Count] = useState(0);
  const [Target, Set_Target] = useState(33);
  const [Loops, Set_Loops] = useState(0);

  const [Is_Editing_Target, Set_Is_Editing_Target] = useState(false);
  const [Temp_Target, Set_Temp_Target] = useState("33");

  const [Render_Progress, Set_Render_Progress] = useState(0);
  const [Is_Locked, Set_Is_Locked] = useState(false);

  const Timer_Ref = useRef<ReturnType<typeof setInterval> | null>(null);
  const Progress_Ref = useRef(0);
  const Count_Ref = useRef(0);

  const Is_Valid_Target =
    Temp_Target.trim() !== "" && Number(Temp_Target) > 0;

  /* -------------------------------------------------------------- */
  /* Hold timer                                                     */
  /* -------------------------------------------------------------- */

  const Clear_Hold_Timer = () => {
    if (Timer_Ref.current) {
      clearInterval(Timer_Ref.current);
      Timer_Ref.current = null;
    }
  };

  const Handle_Success = () => {
    Clear_Hold_Timer();

    const Next_Count = Count_Ref.current + 1;

    if (Next_Count > Target) {
      Set_Loops((Previous_Loops) => Previous_Loops + 1);
      Count_Ref.current = 1;
    } else {
      Count_Ref.current = Next_Count;
    }

    Set_Count(Count_Ref.current);
    Set_Render_Progress(100);
    Set_Is_Locked(true);
  };

  const Start_Holding = () => {
    if (Is_Locked || Timer_Ref.current || Is_Editing_Target) {
      return;
    }

    Progress_Ref.current = 0;
    Set_Render_Progress(0);

    Timer_Ref.current = setInterval(() => {
      const Next_Progress =
        Progress_Ref.current + 100 / (HOLD_DURATION / INTERVAL_STEP);

      Progress_Ref.current = Next_Progress;

      Set_Render_Progress(Math.min(Next_Progress, 100));

      if (Next_Progress >= 100) {
        Handle_Success();
      }
    }, INTERVAL_STEP);
  };

  const Stop_Holding = () => {
    Clear_Hold_Timer();

    Progress_Ref.current = 0;

    Set_Render_Progress(0);
    Set_Is_Locked(false);
  };

  /* -------------------------------------------------------------- */
  /* Target editing                                                 */
  /* -------------------------------------------------------------- */

  const Start_Editing_Target = () => {
    Set_Temp_Target(Target.toString());
    Set_Is_Editing_Target(true);
  };

  const Save_Target = () => {
    const Parsed_Target = parseInt(Temp_Target, 10);

    if (!isNaN(Parsed_Target) && Parsed_Target > 0) {
      Set_Target(Parsed_Target);
      Set_Is_Editing_Target(false);
    }
  };

  /* -------------------------------------------------------------- */
  /* Reset                                                          */
  /* -------------------------------------------------------------- */

  const Reset_Counter = () => {
    const Perform_Reset = () => {
      Clear_Hold_Timer();

      Count_Ref.current = 0;
      Progress_Ref.current = 0;

      Set_Count(0);
      Set_Loops(0);
      Set_Render_Progress(0);
      Set_Is_Locked(false);
    };

    if (Platform.OS === "web") {
      if (
        typeof window !== "undefined" &&
        window.confirm("Wil je de teller en rondes resetten?")
      ) {
        Perform_Reset();
      }
    } else {
      Alert.alert(
        "Reset Tasbih",
        "Weet je zeker dat je alles wilt resetten?",
        [
          {
            text: "Annuleren",
            style: "cancel",
          },
          {
            text: "Reset",
            style: "destructive",
            onPress: Perform_Reset,
          },
        ]
      );
    }
  };

  /* -------------------------------------------------------------- */
  /* Cleanup                                                        */
  /* -------------------------------------------------------------- */

  useEffect(() => {
    return () => {
      Clear_Hold_Timer();
    };
  }, []);

  /* -------------------------------------------------------------- */
  /* Render                                                         */
  /* Vaste opmaak staat in className (NativeWind). Waarden die      */
  /* meeschalen met het scherm of met het thema staan in style.     */
  /* -------------------------------------------------------------- */

  const Counter_Text_Style: TextStyle = {
    fontSize: Counter_Font,
    letterSpacing: -3 * Font_Scale,
    fontVariant: ["tabular-nums"],
    color: Primary_Color,
  };

  return (
    <ScrollView
      style={{
        flex: 1,
        width: "100%",
        backgroundColor: "transparent",
      }}
      contentContainerStyle={{
        flexGrow: 1,
        backgroundColor: "transparent",
      }}
    >
      <View
        className="w-full max-w-[448px] self-center items-center px-4 pt-6 pb-8"
        style={{
          flexGrow: 1,
          backgroundColor: "transparent",
          justifyContent: Is_Mobile ? "space-between" : "flex-start",
          minHeight: Is_Mobile
            ? undefined
            : Math.min(650, Screen_Height),
        }}
      >

        <View className="w-full items-center">

          {/* Header */}

          <View className="w-full flex-row items-center justify-between gap-1.5">

            {/* Cycles */}

            <Container
              Padding={10}
              Gap={0}
              Style_Properties={{ width: "auto", flexShrink: 0 }}
            >
              <View className="min-h-[22px] flex-row items-center justify-center gap-[7px]">
                <Repeat size={16} color="#FFFFFF" />

                <Text className="text-white text-sm font-bold">
                  {Loops}
                </Text>
              </View>
            </Container>

            {/* Actions */}

            <View className="flex-row items-center gap-[7px] shrink-0">

              {/* Edit / Save */}

              <View className="w-12 h-12">
                {Is_Editing_Target ? (
                  <Button
                    Variant="Primary"
                    Size="icon"
                    Color={Action_Button_Color}
                    Icon={
                      <Check
                        size={19}
                        color={Action_Icon_Color}
                      />
                    }
                    On_Click={Save_Target}
                    Active={true}
                    Style_Properties={
                      !Is_Valid_Target
                        ? { opacity: 0.35 }
                        : undefined
                    }
                    aria-label="Doel opslaan"
                  />
                ) : (
                  <Button
                    Variant="Primary"
                    Size="icon"
                    Color={Action_Button_Color}
                    Icon={
                      <Edit2
                        size={18}
                        color={Action_Icon_Color}
                      />
                    }
                    On_Click={Start_Editing_Target}
                    aria-label="Doel aanpassen"
                  />
                )}
              </View>

              {/* Reset */}

              <View className="w-12 h-12">
                <Button
                  Variant="Primary"
                  Size="icon"
                  Color={Action_Button_Color}
                  Icon={
                    <RotateCcw
                      size={18}
                      color={Action_Icon_Color}
                    />
                  }
                  On_Click={Reset_Counter}
                  aria-label="Reset teller"
                />
              </View>

            </View>
          </View>

          {/* Counter */}

          <View
            className="w-full items-center justify-center"
            style={{
              marginTop: Math.round(50 * Scale),
              marginBottom: Math.round(30 * Scale),
            }}
          >
            <View className="flex-row items-center justify-center">

              <Text
                className="font-extrabold"
                style={Counter_Text_Style}
              >
                {Count}
              </Text>

              <Text
                style={{
                  fontSize: Counter_Font * 0.8,
                  marginHorizontal: 12 * Font_Scale,
                  color: Muted_Color,
                }}
              >
                /
              </Text>

              {Is_Editing_Target ? (
                <TextInput
                  value={Temp_Target}
                  onChangeText={(Value) =>
                    Set_Temp_Target(
                      Value.replace(/\D/g, "").slice(0, 3)
                    )
                  }
                  keyboardType="numeric"
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={Save_Target}
                  maxLength={3}
                  autoFocus
                  className="font-extrabold p-0 text-center"
                  style={[
                    Counter_Text_Style,
                    {
                      minWidth: Counter_Font * 0.9,
                      maxWidth: Counter_Font * 1.8,
                    },
                  ]}
                  selectTextOnFocus
                />
              ) : (
                <Text
                  className="font-extrabold"
                  style={Counter_Text_Style}
                >
                  {Target}
                </Text>
              )}

            </View>
          </View>

        </View>

        {/* Fingerprint */}

        <View
          className="items-center justify-center"
          style={{
            marginTop: Math.round(20 * Scale),
            marginBottom: Math.round(24 * Scale),
          }}
        >
          <View
            className="items-center justify-center"
            style={{
              width: Circle_Size,
              height: Circle_Size,
            }}
          >

            {/* Pressable met style-functie: bewust zonder className */}

            <Pressable
              onPressIn={Start_Holding}
              onPressOut={Stop_Holding}
              disabled={Is_Editing_Target}
              style={({ pressed }) => [
                {
                  width: Icon_Size,
                  height: Icon_Size,
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 2,
                },
                pressed && { transform: [{ scale: 0.95 }] },
              ]}
            >
              <Fingerprint
                size={Icon_Size}
                color={Fingerprint_Base_Color}
                strokeWidth={1.5}
              />

              <View
                pointerEvents="none"
                className="absolute bottom-0 left-0 right-0 overflow-hidden"
                style={{ height: `${Render_Progress}%` }}
              >
                {/* Vast onderaan geplaatst met vaste maat. Zonder deze
                    wrapper krimpt de svg op web mee met de hoogte van
                    de container (flex-shrink), in plaats van afgeknipt
                    te worden. */}
                <View
                  className="absolute bottom-0 left-0"
                  style={{
                    width: Icon_Size,
                    height: Icon_Size,
                  }}
                >
                  <Fingerprint
                    size={Icon_Size}
                    color={Primary_Color}
                    strokeWidth={1.5}
                  />
                </View>
              </View>
            </Pressable>

            {/* Progress Circle */}

            <View
              pointerEvents="none"
              className="absolute items-center justify-center"
              style={{
                width: Circle_Size,
                height: Circle_Size,
              }}
            >
              <Svg
                width={Circle_Size}
                height={Circle_Size}
                viewBox={`0 0 ${DESIGN_CIRCLE_SIZE} ${DESIGN_CIRCLE_SIZE}`}
                style={{ transform: [{ rotate: "-90deg" }] }}
              >
                <Circle
                  cx="112"
                  cy="112"
                  r={CIRCLE_RADIUS}
                  stroke={Circle_Track_Color}
                  strokeWidth="2"
                  fill="transparent"
                />

                <Circle
                  cx="112"
                  cy="112"
                  r={CIRCLE_RADIUS}
                  stroke={Circle_Progress_Color}
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={CIRCLE_CIRCUMFERENCE}
                  strokeDashoffset={
                    CIRCLE_CIRCUMFERENCE -
                    (CIRCLE_CIRCUMFERENCE * Render_Progress) / 100
                  }
                  strokeLinecap="round"
                />
              </Svg>
            </View>

          </View>
        </View>

      </View>
    </ScrollView>
  );
};

export default Aid_Tasbih_Counter;