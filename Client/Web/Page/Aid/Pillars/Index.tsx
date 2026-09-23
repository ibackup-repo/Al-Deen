import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@Web/Component/Layout/Index";
import { Card } from "@Web/Component/UI/Card";
import { Fetch_Pillars } from "@Web/../Source/Library/Aid-API";
import type { Pillar_Record } from "@Web/../Source/Library/Aid-Types";

export default function Pillars() {
  const { data: Pillars_Collection_List, Is_Loading_Corpus_Data: Is_Loading_Data_Flag } = useQuery<Pillar_Record[]>({
    queryKey: ["Aid_Pillars"],
    queryFn: Fetch_Pillars,
    staleTime: 1000 * 60 * 15,
  });

  if (Is_Loading_Data_Flag) {
    return (
      <Layout>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[...Array(5)].map((_, Index_Position) => (
            <Card key={Index_Position} className="p-4 animate-pulse" Is_Hoverable={false}>
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                <div className="h-4 bg-muted rounded w-4"></div>
                <div className="h-5 bg-muted rounded w-24"></div>
                <div className="h-4 bg-muted rounded w-16 justify-self-end"></div>
              </div>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {Pillars_Collection_List?.map((Pillar_Item: Pillar_Record) => (
          <Link key={Pillar_Item.ID} to={`/Aid/Pillars/${Pillar_Item.ID}`}>
            <Card className="p-4 group">
              <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                <p className="text-xs text-muted-foreground [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                  {Pillar_Item.ID}
                </p>
                <p className="font-semibold [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                  {Pillar_Item.Pillar_Name}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </Layout>
  );
}