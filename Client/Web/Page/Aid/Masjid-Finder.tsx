import { useEffect, useState, useCallback } from "react";
import { Layout } from "@Web/Component/Layout/Index";
import { Container } from "@Web/Component/UI/Container";
import { Button } from "@Web/Component/UI/Button";
import { MapPin, Navigation, AlertCircle, ExternalLink } from "lucide-react";

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
  center?: { lat: number; lon: number };
  tags?: {
    name?: string;
    "name:en"?: string;
    "addr:street"?: string;
    "addr:housenumber"?: string;
    "addr:city"?: string;
  };
};

function Calculate_Haversine_Distance_Kilometers(
  Start_Latitude_Number: number,
  Start_Longitude_Number: number,
  End_Latitude_Number: number,
  End_Longitude_Number: number
): number {
  const EARTH_RADIUS_KILOMETERS = 6371;
  const Latitude_Delta_Radians = ((End_Latitude_Number - Start_Latitude_Number) * Math.PI) / 180;
  const Longitude_Delta_Radians = ((End_Longitude_Number - Start_Longitude_Number) * Math.PI) / 180;
  const Trigonometric_Calculation_A =
    Math.sin(Latitude_Delta_Radians / 2) ** 2 +
    Math.cos((Start_Latitude_Number * Math.PI) / 180) *
      Math.cos((End_Latitude_Number * Math.PI) / 180) *
      Math.sin(Longitude_Delta_Radians / 2) ** 2;
  return 2 * EARTH_RADIUS_KILOMETERS * Math.asin(Math.sqrt(Trigonometric_Calculation_A));
}

export default function Masjid_Finder() {
  const [User_Coordinates_State, Set_User_Coordinates_State] = useState<Geographic_Coordinates_Record | null>(null);
  const [Nearby_Masjids_List, Set_Nearby_Masjids_List] = useState<Masjid_Location_Record[]>([]);
  const [Is_Loading_State_Flag, Set_Is_Loading_State_Flag] = useState(true);
  const [Error_Message_State, Set_Error_Message_State] = useState<string | null>(null);
  const [Search_Radius_Kilometers, Set_Search_Radius_Kilometers] = useState(5);

  const Fetch_Nearby_Masjids_Data = useCallback(async (
    Target_Latitude_Number: number,
    Target_Longitude_Number: number,
    Radius_Kilometers_Number: number
  ) => {
    Set_Is_Loading_State_Flag(true);
    Set_Error_Message_State(null);
    try {
      const Radius_Meters_Value = Radius_Kilometers_Number * 1000;
      const Overpass_Query_String = `[out:json][Timeout:25];(
        node["amenity"="place_of_worship"]["religion"="muslim"](around:${Radius_Meters_Value},${Target_Latitude_Number},${Target_Longitude_Number});
        way["amenity"="place_of_worship"]["religion"="muslim"](around:${Radius_Meters_Value},${Target_Latitude_Number},${Target_Longitude_Number});
        relation["amenity"="place_of_worship"]["religion"="muslim"](around:${Radius_Meters_Value},${Target_Latitude_Number},${Target_Longitude_Number});
      );out center tags;`;
      const Response_Object = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: "data=" + encodeURIComponent(Overpass_Query_String),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const Response_JSON_Data = await Response_Object.json();
      const Elements_Collection_List: Overpass_Element_Record[] = Response_JSON_Data.elements || [];
      
      const Filtered_Masjids_List: Masjid_Location_Record[] = Elements_Collection_List
        .map((Element_Item) => {
          const Element_Latitude_Number = Element_Item.lat ?? Element_Item.center?.lat;
          const Element_Longitude_Number = Element_Item.lon ?? Element_Item.center?.lon;
          if (typeof Element_Latitude_Number !== "number" || typeof Element_Longitude_Number !== "number") return null;
          
          const Tags_Record = Element_Item.tags || {};
          const Formatted_Address_String = [
            Tags_Record["addr:street"],
            Tags_Record["addr:housenumber"],
            Tags_Record["addr:city"]
          ]
            .filter(Boolean)
            .join(" ");

          return {
            Masjid_ID_Number: Element_Item.id,
            Masjid_Name_Text: Tags_Record.name || Tags_Record["name:en"] || "Unnamed Masjid",
            Latitude_Coordinate_Number: Element_Latitude_Number,
            Longitude_Coordinate_Number: Element_Longitude_Number,
            Distance_Kilometers_Number: Calculate_Haversine_Distance_Kilometers(
              Target_Latitude_Number,
              Target_Longitude_Number,
              Element_Latitude_Number,
              Element_Longitude_Number
            ),
            Street_Address_Text: Formatted_Address_String || undefined,
          } as Masjid_Location_Record;
        })
        .filter(Boolean) as Masjid_Location_Record[];

      Filtered_Masjids_List.sort((Masjid_A, Masjid_B) => Masjid_A.Distance_Kilometers_Number - Masjid_B.Distance_Kilometers_Number);
      Set_Nearby_Masjids_List(Filtered_Masjids_List.slice(0, 50));
    } catch (Error_Context) {
      console.error(Error_Context);
      Set_Error_Message_State("Failed to load nearby masjids. Try again later.");
    } finally {
      Set_Is_Loading_State_Flag(false);
    }
  }, []);

  const Locate_User_Geolocation = useCallback(() => {
    if (!navigator.geolocation) {
      Set_Error_Message_State("Geolocation is not supported.");
      Set_Is_Loading_State_Flag(false);
      return;
    }
    Set_Is_Loading_State_Flag(true);
    navigator.geolocation.getCurrentPosition(
      (Position_Object) => {
        const Current_Coordinates_Record = {
          Latitude_Coordinate_Number: Position_Object.Coords.latitude,
          Longitude_Coordinate_Number: Position_Object.Coords.longitude,
        };
        Set_User_Coordinates_State(Current_Coordinates_Record);
        Fetch_Nearby_Masjids_Data(
          Current_Coordinates_Record.Latitude_Coordinate_Number,
          Current_Coordinates_Record.Longitude_Coordinate_Number,
          Search_Radius_Kilometers
        );
      },
      () => {
        Set_Error_Message_State("Could not determine your Location_Data.");
        Set_Is_Loading_State_Flag(false);
      },
      { Timeout: 8000 }
    );
  }, [Fetch_Nearby_Masjids_Data, Search_Radius_Kilometers]);

  useEffect(() => {
    Locate_User_Geolocation();
  }, []); // eslint-disable-line

  return (
    <Layout>
      <div className="Container max-w-2xl mx-auto py-6 space-y-4">
        <Container className="!py-3 !px-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Navigation className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold truncate">Masjid Finder</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <select
              className="bg-background border rounded-full text-xs px-3 py-1.5"
              value={Search_Radius_Kilometers}
              On_Change={(Event_Object) => {
                const Radius_Selection_Value = Number(Event_Object.target.value);
                Set_Search_Radius_Kilometers(Radius_Selection_Value);
                if (User_Coordinates_State) {
                  Fetch_Nearby_Masjids_Data(
                    User_Coordinates_State.Latitude_Coordinate_Number,
                    User_Coordinates_State.Longitude_Coordinate_Number,
                    Radius_Selection_Value
                  );
                }
              }}
            >
              {[2, 5, 10, 25, 50].map((Radius_Option_Number) => (
                <option key={Radius_Option_Number} value={Radius_Option_Number}>
                  {Radius_Option_Number} km
                </option>
              ))}
            </select>
            <Button size="sm" onClick={Locate_User_Geolocation} className="rounded-full">
              Refresh
            </Button>
          </div>
        </Container>

        {Is_Loading_State_Flag ? null : Error_Message_State ? (
          <Container className="p-8 text-center flex flex-col items-center gap-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <p className="text-muted-foreground">{Error_Message_State}</p>
            <Button onClick={Locate_User_Geolocation} variant="outline">
              Try Again
            </Button>
          </Container>
        ) : Nearby_Masjids_List.length === 0 ? (
          <Container className="p-8 text-center text-muted-foreground">
            No masjids found within {Search_Radius_Kilometers} km. Try increasing the radius.
          </Container>
        ) : (
          <div className="space-y-2">
            {Nearby_Masjids_List.map((Masjid_Item) => (
              <Container key={Masjid_Item.Masjid_ID_Number} className="!p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{Masjid_Item.Masjid_Name_Text}</p>
                  {Masjid_Item.Street_Address_Text && (
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {Masjid_Item.Street_Address_Text}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {Masjid_Item.Distance_Kilometers_Number.toFixed(2)} km away
                  </p>
                </div>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${Masjid_Item.Latitude_Coordinate_Number}&mlon=${Masjid_Item.Longitude_Coordinate_Number}#map=18/${Masjid_Item.Latitude_Coordinate_Number}/${Masjid_Item.Longitude_Coordinate_Number}`}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 inline-flex items-center gap-1 text-xs underline"
                >
                  Map <ExternalLink className="h-3 w-3" />
                </a>
              </Container>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}