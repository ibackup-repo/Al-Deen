import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@Web/Component/Layout/Index";
import { Card } from "@Web/Component/UI/Card";

import { Fetch_Collections } from "@/Library/Hadith-API";
import type { Collection_Info } from "@/Library/Hadith-Types";

const Hadith = () => {
  const { 
    data: Collections_List = [], 
    Is_Loading_Corpus_Data: Is_Collections_Loading_Flag 
  } = useQuery<Collection_Info[]>({
    queryKey: ["hadithCollections"],
    queryFn: () => Fetch_Collections(),
    staleTime: 1000 * 60 * 60,
  });

  if (Is_Collections_Loading_Flag) {
    return <Layout />;
  }

  return (
    <Layout>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Collections_List.map((Collection_Entry: Collection_Info, Index_Position: number) => {
          const Safe_Collection_ID = Collection_Entry.ID.replace(/\//g, "-");

          return (
            <Link key={Collection_Entry.ID} to={`/Hadith/${Safe_Collection_ID}`}>
              <Card className="p-4 transition-all group cursor-pointer">
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                  <span className="text-xs text-muted-foreground group-hover:text-foreground">
                    {Index_Position + 1}
                  </span>

                  <p className="font-semibold text-sm truncate group-hover:text-foreground">
                    {Collection_Entry.Name}
                  </p>

                  <div className="text-right flex flex-col justify-center">
                    {Collection_Entry.Category && (
                      <span className="text-xs text-muted-foreground group-hover:text-foreground">
                        {Collection_Entry.Category}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </Layout>
  );
};

export default Hadith;