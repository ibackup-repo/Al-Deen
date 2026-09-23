import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@Web/Component/Layout/Index";
import { Card } from "@Web/Component/UI/Card";
import { Button } from "@Web/Component/UI/Button";
import { Fetch_Pillars } from "@Web/../Source/Library/Aid-API";
import type { Pillar_Record, Pillar_Detail_Record } from "@Web/../Source/Library/Aid-Types";

export default function Pillar_Detail() {
  const { id: Target_Pillar_ID = "" } = useParams<{ id: string }>();

  const { data: Pillar_Record_Data, Is_Loading_Corpus_Data } = useQuery<Pillar_Record | undefined>({
    queryKey: ["aidPillar", Target_Pillar_ID],
    queryFn: async () => {
      const Pillars_Collection_List = await Fetch_Pillars();
      return Pillars_Collection_List.find(
        (Pillar_Item) =>
          String(Pillar_Item.ID) === Target_Pillar_ID ||
          Pillar_Item.Pillar_Name.toLowerCase().replace(/\s+/g, "-") === Target_Pillar_ID.toLowerCase()
      );
    },
    staleTime: 1000 * 60 * 15,
    enabled: !!Target_Pillar_ID,
  });

  if (Is_Loading_Corpus_Data) {
    return (
      <Layout>
        <Card className="p-8 text-center" Is_Hoverable={false}>
          <p className="text-muted-foreground animate-pulse">Loading pillar details...</p>
        </Card>
      </Layout>
    );
  }

  if (!Pillar_Record_Data) {
    return (
      <Layout>
        <div className="py-16 text-center">
          <Card className="max-w-md mx-auto p-8" Is_Hoverable={false}>
            <h1 className="text-2xl font-semibold mb-4">Pillar Not Found</h1>
            <Link to="/Aid/Pillars">
              <Button>Back to Pillars</Button>
            </Link>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
        <Card className="p-5" Is_Hoverable={false}>
          <h1 className="text-2xl font-bold">{Pillar_Record_Data.Pillar_Name}</h1>
          {Pillar_Record_Data.Subtitle_Text && (
            <p className="text-sm text-muted-foreground mt-1">{Pillar_Record_Data.Subtitle_Text}</p>
          )}
        </Card>

        {Pillar_Record_Data.Key_Hadith_Text && (
          <Card className="p-5" Is_Hoverable={false}>
            <p className="font-semibold">Key Hadith / Context</p>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {Pillar_Record_Data.Key_Hadith_Text}
            </p>
          </Card>
        )}

        {Pillar_Record_Data.Details_Collection?.map((Detail_Item: Pillar_Detail_Record) => (
          <Card key={Detail_Item.ID} className="p-5" Is_Hoverable={false}>
            <p className="font-semibold">{Detail_Item.Heading_Text}</p>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {Detail_Item.Content_Text}
            </p>
          </Card>
        ))}
      </div>
    </Layout>
  );
}