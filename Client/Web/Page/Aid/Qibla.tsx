import { useState, useEffect } from "react";
import { Layout } from "@Web/Component/Layout/Index";
import { Qibla_Compass } from "@Web/Component/Qibla-Compass";
import { Container } from "@Web/Component/UI/Container";

type Geographic_Coordinates_Record = {
  Latitude_Coordinate_Number: number;
  Longitude_Coordinate_Number: number;
};

type IP_Location_API_Response_Record = {
  latitude: number;
  longitude: number;
};

export default function Qibla() {
  const [User_Coordinates_State, Set_User_Coordinates_State] = useState<Geographic_Coordinates_Record | null>(null);
  const [Is_Loading_State_Flag, Set_Is_Loading_State_Flag] = useState(true);
  const [Error_Message_State, Set_Error_Message_State] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      Set_Error_Message_State("Geolocation is not supported by your browser.");
      Set_Is_Loading_State_Flag(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (Position_Object) => {
        Set_User_Coordinates_State({
          Latitude_Coordinate_Number: Position_Object.Coords.latitude,
          Longitude_Coordinate_Number: Position_Object.Coords.longitude,
        });
        Set_Is_Loading_State_Flag(false);
      },
      () => {
        fetch("https://ipapi.co/json/")
          .then((Response_Object) => Response_Object.json())
          .then((API_Response_Data: IP_Location_API_Response_Record) => {
            Set_User_Coordinates_State({
              Latitude_Coordinate_Number: API_Response_Data.latitude,
              Longitude_Coordinate_Number: API_Response_Data.longitude,
            });
            Set_Is_Loading_State_Flag(false);
          })
          .catch(() => {
            Set_Error_Message_State("Unable to determine your Location_Data.");
            Set_Is_Loading_State_Flag(false);
          });
      },
      { Timeout: 5000 }
    );
  }, []);

  return (
    <Layout>
      <Container className="w-full !rounded-[48px]">
        {Is_Loading_State_Flag ? null : Error_Message_State ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">{Error_Message_State}</p>
          </div>
        ) : User_Coordinates_State ? (
          <Qibla_Compass
            latitude={User_Coordinates_State.Latitude_Coordinate_Number}
            longitude={User_Coordinates_State.Longitude_Coordinate_Number}
          />
        ) : null}
      </Container>
    </Layout>
  );
}