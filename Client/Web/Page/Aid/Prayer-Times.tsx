import { useState, useEffect } from "react";
import { Layout } from "@Web/Component/Layout/Index";
import { MapPin } from "lucide-react";
import { Container } from "@Web/Component/UI/Container";
import { Button } from "@Web/Component/UI/Button";
import { Use_Prayer_Times } from "@/Hook/Use-Prayer-Times";
import { Header } from "@Web/Component/Aid/Prayer/Header";
import { Prayer_Card } from "@Web/Component/Aid/Prayer/Prayer-Card";
import { Additional_Times } from "@Web/Component/Aid/Prayer/Additional-Times";
import { Get_Next_Prayer } from "@Web/Component/Aid/Prayer/Utility";
import { Main_Prayers } from "@Web/Component/Aid/Prayer/Constant";

export default function Prayer_Times() {
  const {
    Location: User_Location,
    Timings: Prayer_Timings,
    Hijri: Hijri_Date,
    Loading: Is_Loading_Corpus_Data,
    error: Location_Error,
    Settings: User_Settings,
    Request_Location: On_Request_Location,
    Method_Label,
    Is_Using_Saved_Location,
  } = Use_Prayer_Times();

  const [, Set_Tick] = useState(0);

  useEffect(() => {
    const Timer = setInterval(
      () => Set_Tick((Current) => Current + 1),
      60000
    );
    return () => clearInterval(Timer);
  }, []);

  const Next_Prayer = Prayer_Timings
    ? Get_Next_Prayer(Prayer_Timings)
    : null;

  if (Is_Loading_Corpus_Data) return null;

  if (Location_Error) {
    return (
      <Layout>
        <Container className="w-full !rounded-[48px] p-8 text-center space-y-4">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">{Location_Error}</p>
          <p className="text-sm text-muted-foreground">
            Please select a location in Settings to get prayer times.
          </p>
          <Button onClick={On_Request_Location} variant="secondary">
            Try Auto Location Again
          </Button>
        </Container>
      </Layout>
    );
  }

  if (!Prayer_Timings) return null;

  return (
    <Layout>
      <Header
        Location={User_Location}
        Hijri_Date={Hijri_Date}
        On_Refresh={On_Request_Location}
      />

      <Container className="w-full !rounded-[48px] p-6 space-y-3">
        {Main_Prayers.map((Prayer) => (
          <Prayer_Card
            key={Prayer}
            Prayer={Prayer}
            Timings={Prayer_Timings}
            Settings={User_Settings}
            Is_Next={Prayer === Next_Prayer}
          />
        ))}

        <Additional_Times
          Timings={Prayer_Timings}
          Settings={User_Settings}
        />

        <p className="text-xs text-muted-foreground text-center pt-2">
          {Method_Label}
          {Is_Using_Saved_Location && " • Manual Location"}
        </p>
      </Container>
    </Layout>
  );
}