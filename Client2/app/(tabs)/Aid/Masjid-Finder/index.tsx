
import React, {
  useEffect,
  useState,
  useCallback,
} from "react";

import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Linking,
  Alert,
  Platform,
  ScrollView,
} from "react-native";

import * as Location from "expo-location";
import { Picker } from "@react-native-picker/picker";

import { Container } from "@/Component/UI/Container/Index";
import { Button } from "@/Component/UI/Button/Index";

import {
  MapPin,
  Navigation,
  AlertCircle,
  ExternalLink,
} from "lucide-react-native";

// ============================================================
// TYPES
// ============================================================

type Masjid_Location_Record = {
  Masjid_ID_Number: number;
  Masjid_Name_Text: string;
  Latitude_Coordinate_Number: number;
  Longitude_Coordinate_Number: number;
  Distance_Kilometers_Number: number;
  Street_Address_Text?: string;
};

type Geographic_Coordinates_Record = {
  Latitude_Coordinate_Number: number;
  Longitude_Coordinate_Number: number;
};

type Overpass_Element_Record = {
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: {
    name?: string;
    "name:en"?: string;
    "addr:street"?: string;
    "addr:housenumber"?: string;
    "addr:city"?: string;
  };
};

type Overpass_Response_Record = {
  elements?: Overpass_Element_Record[];
};

// ============================================================
// DISTANCE CALCULATION
// ============================================================

function Calculate_Haversine_Distance_Kilometers(
  Start_Latitude_Number: number,
  Start_Longitude_Number: number,
  End_Latitude_Number: number,
  End_Longitude_Number: number
): number {
  const EARTH_RADIUS_KILOMETERS = 6371;

  const Latitude_Delta_Radians =
    ((End_Latitude_Number - Start_Latitude_Number) * Math.PI) / 180;

  const Longitude_Delta_Radians =
    ((End_Longitude_Number - Start_Longitude_Number) * Math.PI) / 180;

  const Trigonometric_Calculation_A =
    Math.sin(Latitude_Delta_Radians / 2) ** 2 +
    Math.cos((Start_Latitude_Number * Math.PI) / 180) *
      Math.cos((End_Latitude_Number * Math.PI) / 180) *
      Math.sin(Longitude_Delta_Radians / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_KILOMETERS *
    Math.asin(Math.sqrt(Trigonometric_Calculation_A))
  );
}

// ============================================================
// BROWSER GEOLOCATION
// ============================================================

function Get_Browser_Geolocation(): Promise<Geographic_Coordinates_Record> {
  return new Promise((Resolve, Reject) => {
    if (
      typeof navigator === "undefined" ||
      !navigator.geolocation
    ) {
      Reject(
        new Error(
          "Your browser does not support geolocation."
        )
      );

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (Position_Object) => {
        Resolve({
          Latitude_Coordinate_Number:
            Position_Object.coords.latitude,

          Longitude_Coordinate_Number:
            Position_Object.coords.longitude,
        });
      },

      (Error_Object) => {
        let Error_Message_String =
          "Could not determine your location.";

        switch (Error_Object.code) {
          case Error_Object.PERMISSION_DENIED:
            Error_Message_String =
              "Location access was denied. Please allow location access in your browser settings and try again.";
            break;

          case Error_Object.POSITION_UNAVAILABLE:
            Error_Message_String =
              "Your current location is unavailable. Please try again.";
            break;

          case Error_Object.TIMEOUT:
            Error_Message_String =
              "The location request timed out. Please try again.";
            break;
        }

        Reject(new Error(Error_Message_String));
      },

      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  });
}

// ============================================================
// NATIVE GEOLOCATION
// ============================================================

async function Get_Native_Geolocation(): Promise<Geographic_Coordinates_Record> {
  const Permission_Result =
    await Location.requestForegroundPermissionsAsync();

  if (Permission_Result.status !== "granted") {
    throw new Error(
      "Location permission was denied. Please enable location access in your device settings."
    );
  }

  const Position_Object =
    await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

  return {
    Latitude_Coordinate_Number:
      Position_Object.coords.latitude,

    Longitude_Coordinate_Number:
      Position_Object.coords.longitude,
  };
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function Masjid_Finder() {
  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------

  const [
    User_Coordinates_State,
    Set_User_Coordinates_State,
  ] = useState<Geographic_Coordinates_Record | null>(null);

  const [
    Nearby_Masjids_List,
    Set_Nearby_Masjids_List,
  ] = useState<Masjid_Location_Record[]>([]);

  const [
    Is_Loading_State_Flag,
    Set_Is_Loading_State_Flag,
  ] = useState(true);

  const [
    Error_Message_State,
    Set_Error_Message_State,
  ] = useState<string | null>(null);

  const [
    Search_Radius_Kilometers,
    Set_Search_Radius_Kilometers,
  ] = useState(5);

  // ----------------------------------------------------------
  // FETCH NEARBY MASJIDS
  // ----------------------------------------------------------

  const Fetch_Nearby_Masjids_Data = useCallback(
    async (
      Target_Latitude_Number: number,
      Target_Longitude_Number: number,
      Radius_Kilometers_Number: number
    ) => {
      Set_Is_Loading_State_Flag(true);
      Set_Error_Message_State(null);

      try {
        const Radius_Meters_Value =
          Radius_Kilometers_Number * 1000;

        const Overpass_Query_String = `
          [out:json][timeout:25];
          (
            node["amenity"="place_of_worship"]["religion"="muslim"]
              (around:${Radius_Meters_Value},${Target_Latitude_Number},${Target_Longitude_Number});

            way["amenity"="place_of_worship"]["religion"="muslim"]
              (around:${Radius_Meters_Value},${Target_Latitude_Number},${Target_Longitude_Number});

            relation["amenity"="place_of_worship"]["religion"="muslim"]
              (around:${Radius_Meters_Value},${Target_Latitude_Number},${Target_Longitude_Number});
          );
          out center tags;
        `;

        const Response_Object = await fetch(
          "https://overpass-api.de/api/interpreter",
          {
            method: "POST",
            body:
              "data=" +
              encodeURIComponent(Overpass_Query_String),
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded",
            },
          }
        );

        if (!Response_Object.ok) {
          throw new Error(
            "The Overpass API request failed."
          );
        }

        const Response_JSON_Data: Overpass_Response_Record =
          await Response_Object.json();

        const Elements_Collection_List =
          Response_JSON_Data.elements || [];

        // ----------------------------------------------------
        // FORMAT RESULTS
        // ----------------------------------------------------

        const Filtered_Masjids_List: Masjid_Location_Record[] =
          Elements_Collection_List
            .map((Element_Item) => {
              const Element_Latitude_Number =
                Element_Item.lat ??
                Element_Item.center?.lat;

              const Element_Longitude_Number =
                Element_Item.lon ??
                Element_Item.center?.lon;

              if (
                typeof Element_Latitude_Number !== "number" ||
                typeof Element_Longitude_Number !== "number"
              ) {
                return null;
              }

              const Tags_Record =
                Element_Item.tags || {};

              const Formatted_Address_String = [
                Tags_Record["addr:street"],
                Tags_Record["addr:housenumber"],
                Tags_Record["addr:city"],
              ]
                .filter(Boolean)
                .join(" ");

              return {
                Masjid_ID_Number: Element_Item.id,

                Masjid_Name_Text:
                  Tags_Record.name ||
                  Tags_Record["name:en"] ||
                  "Unnamed Masjid",

                Latitude_Coordinate_Number:
                  Element_Latitude_Number,

                Longitude_Coordinate_Number:
                  Element_Longitude_Number,

                Distance_Kilometers_Number:
                  Calculate_Haversine_Distance_Kilometers(
                    Target_Latitude_Number,
                    Target_Longitude_Number,
                    Element_Latitude_Number,
                    Element_Longitude_Number
                  ),

                Street_Address_Text:
                  Formatted_Address_String || undefined,
              } as Masjid_Location_Record;
            })
            .filter(
              (
                Masjid_Item
              ): Masjid_Item is Masjid_Location_Record =>
                Masjid_Item !== null
            );

        // ----------------------------------------------------
        // SORT BY DISTANCE
        // ----------------------------------------------------

        Filtered_Masjids_List.sort(
          (Masjid_A, Masjid_B) =>
            Masjid_A.Distance_Kilometers_Number -
            Masjid_B.Distance_Kilometers_Number
        );

        Set_Nearby_Masjids_List(
          Filtered_Masjids_List.slice(0, 50)
        );
      } catch (Error_Context) {
        console.error(
          "Masjid Finder Error:",
          Error_Context
        );

        Set_Error_Message_State(
          "Failed to load nearby masjids. Please try again later."
        );
      } finally {
        Set_Is_Loading_State_Flag(false);
      }
    },
    []
  );

  // ----------------------------------------------------------
  // LOCATE USER
  // ----------------------------------------------------------

  const Locate_User_Geolocation = useCallback(
    async () => {
      Set_Is_Loading_State_Flag(true);
      Set_Error_Message_State(null);

      try {
        let Current_Coordinates_Record: Geographic_Coordinates_Record;

        // WEB: USE BROWSER GEOLOCATION
        if (Platform.OS === "web") {
          Current_Coordinates_Record =
            await Get_Browser_Geolocation();
        }

        // ANDROID / IOS: USE EXPO LOCATION
        else {
          Current_Coordinates_Record =
            await Get_Native_Geolocation();
        }

        Set_User_Coordinates_State(
          Current_Coordinates_Record
        );

        await Fetch_Nearby_Masjids_Data(
          Current_Coordinates_Record.Latitude_Coordinate_Number,
          Current_Coordinates_Record.Longitude_Coordinate_Number,
          Search_Radius_Kilometers
        );
      } catch (Error_Context) {
        console.error(
          "Location Error:",
          Error_Context
        );

        const Error_Message_String =
          Error_Context instanceof Error
            ? Error_Context.message
            : "Could not determine your location.";

        Set_Error_Message_State(
          Error_Message_String
        );

        Set_Is_Loading_State_Flag(false);
      }
    },
    [
      Fetch_Nearby_Masjids_Data,
      Search_Radius_Kilometers,
    ]
  );

  // ----------------------------------------------------------
  // CHANGE SEARCH RADIUS
  // ----------------------------------------------------------

  const Handle_Radius_Change = useCallback(
    (Radius_Selection_Value: number) => {
      Set_Search_Radius_Kilometers(
        Radius_Selection_Value
      );

      if (User_Coordinates_State) {
        Fetch_Nearby_Masjids_Data(
          User_Coordinates_State.Latitude_Coordinate_Number,
          User_Coordinates_State.Longitude_Coordinate_Number,
          Radius_Selection_Value
        );
      }
    },
    [
      User_Coordinates_State,
      Fetch_Nearby_Masjids_Data,
    ]
  );

  // ----------------------------------------------------------
  // OPEN MASJID MAP
  // ----------------------------------------------------------

  const Open_Masjid_Map = useCallback(
    async (
      Masjid_Item: Masjid_Location_Record
    ) => {
      const Map_URL =
        `https://www.openstreetmap.org/?mlat=${Masjid_Item.Latitude_Coordinate_Number}` +
        `&mlon=${Masjid_Item.Longitude_Coordinate_Number}` +
        `#map=18/${Masjid_Item.Latitude_Coordinate_Number}/${Masjid_Item.Longitude_Coordinate_Number}`;

      try {
        await Linking.openURL(Map_URL);
      } catch (Error_Context) {
        console.error(
          "Map Error:",
          Error_Context
        );

        Alert.alert(
          "Unable to open map",
          "Please try again."
        );
      }
    },
    []
  );

  // ----------------------------------------------------------
  // INITIAL LOCATION
  // ----------------------------------------------------------

  useEffect(() => {
    Locate_User_Geolocation();

    // Only request location when the screen is first mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <ScrollView
      style={Styles.Screen}
      contentContainerStyle={Styles.Screen_Content}
    >
      {/* HEADER */}

      <Container
        Padding={12}
        Gap={12}
      >
        <View style={Styles.Header_Container}>
          <View style={Styles.Header_Title_Container}>
            <Navigation
              size={18}
              color="#64748b"
            />

            <Text style={Styles.Header_Title_Text}>
              Masjid Finder
            </Text>
          </View>

          <View style={Styles.Header_Actions_Container}>
            {/* SEARCH RADIUS */}

            <View style={Styles.Picker_Container}>
              <Picker
                selectedValue={Search_Radius_Kilometers}
                onValueChange={Handle_Radius_Change}
                style={Styles.Picker}
                mode="dropdown"
              >
                {[2, 5, 10, 25, 50].map(
                  (Radius_Option_Number) => (
                    <Picker.Item
                      key={Radius_Option_Number}
                      label={`${Radius_Option_Number} km`}
                      value={Radius_Option_Number}
                    />
                  )
                )}
              </Picker>
            </View>

            {/* REFRESH */}

            <Button
              Label="Refresh"
              On_Click={Locate_User_Geolocation}
            />
          </View>
        </View>
      </Container>

      {/* LOADING */}

      {Is_Loading_State_Flag ? (
        <Container
          Padding={32}
          Gap={12}
        >
          <View style={Styles.Centered_Content}>
            <ActivityIndicator
              size="large"
              color="#64748b"
            />

            <Text style={Styles.Secondary_Text}>
              Finding nearby masjids...
            </Text>
          </View>
        </Container>
      ) : Error_Message_State ? (

        // ERROR

        <Container
          Padding={24}
          Gap={12}
        >
          <View style={Styles.Centered_Content}>
            <AlertCircle
              size={26}
              color="#ef4444"
            />

            <Text style={Styles.Error_Text}>
              {Error_Message_State}
            </Text>

            {Platform.OS === "web" && (
              <Text style={Styles.Permission_Hint}>
                Allow location access for this website in your browser settings.
                Make sure the website uses HTTPS.
              </Text>
            )}

            <Button
              Label="Try Again"
              On_Click={Locate_User_Geolocation}
            />
          </View>
        </Container>

      ) : Nearby_Masjids_List.length === 0 ? (

        // EMPTY STATE

        <Container
          Padding={24}
          Gap={12}
        >
          <Text style={Styles.Centered_Text}>
            No masjids found within{" "}
            {Search_Radius_Kilometers} km. Try increasing the radius.
          </Text>
        </Container>

      ) : (

        // MASJID RESULTS

        <View style={Styles.Masjid_List_Container}>
          {Nearby_Masjids_List.map(
            (Masjid_Item) => (
              <Container
                key={Masjid_Item.Masjid_ID_Number}
                Padding={16}
                Gap={8}
              >
                <View style={Styles.Masjid_Row}>
                  {/* MASJID INFORMATION */}

                  <View style={Styles.Masjid_Information}>
                    <Text
                      style={Styles.Masjid_Name_Text}
                      numberOfLines={1}
                    >
                      {Masjid_Item.Masjid_Name_Text}
                    </Text>

                    {/* ADDRESS */}

                    {Masjid_Item.Street_Address_Text && (
                      <View style={Styles.Address_Row}>
                        <MapPin
                          size={13}
                          color="#64748b"
                        />

                        <Text
                          style={Styles.Secondary_Text}
                          numberOfLines={1}
                        >
                          {Masjid_Item.Street_Address_Text}
                        </Text>
                      </View>
                    )}

                    {/* DISTANCE */}

                    <Text style={Styles.Secondary_Text}>
                      {Masjid_Item.Distance_Kilometers_Number.toFixed(2)} km away
                    </Text>
                  </View>

                  {/* MAP LINK */}

                  <Pressable
                    style={Styles.Map_Link}
                    onPress={() =>
                      Open_Masjid_Map(Masjid_Item)
                    }
                  >
                    <Text style={Styles.Map_Link_Text}>
                      Map
                    </Text>

                    <ExternalLink
                      size={13}
                      color="#64748b"
                    />
                  </Pressable>
                </View>
              </Container>
            )
          )}
        </View>
      )}
    </ScrollView>
  );
}

// ============================================================
// STYLES
// ============================================================

const Styles = StyleSheet.create({
  Screen: {
    flex: 1,
    width: "100%",
  },

  Screen_Content: {
    width: "100%",
    maxWidth: 672,
    alignSelf: "center",
    padding: 16,
    gap: 12,
  },

  // HEADER

  Header_Container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  Header_Title_Container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },

  Header_Title_Text: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },

  Header_Actions_Container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },

  // PICKER

  Picker_Container: {
    minWidth: 90,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 24,
    overflow: "hidden",
  },

  Picker: {
    height: 42,
    width: 105,
  },

  // CENTERED CONTENT

  Centered_Content: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  Centered_Text: {
    textAlign: "center",
    color: "#64748b",
  },

  // ERROR

  Error_Text: {
    textAlign: "center",
    color: "#ef4444",
  },

  Permission_Hint: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    color: "#64748b",
  },

  // MASJID LIST

  Masjid_List_Container: {
    gap: 8,
  },

  Masjid_Row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  Masjid_Information: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },

  Masjid_Name_Text: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },

  // ADDRESS

  Address_Row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  // SECONDARY TEXT

  Secondary_Text: {
    fontSize: 12,
    color: "#64748b",
    flexShrink: 1,
  },

  // MAP LINK

  Map_Link: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    padding: 8,
  },

  Map_Link_Text: {
    fontSize: 12,
    textDecorationLine: "underline",
    color: "#64748b",
  },
});
