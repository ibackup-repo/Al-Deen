import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@Web/Component/Layout/Index";
import { Card } from "@Web/Component/UI/Card";
import { Button } from "@Web/Component/UI/Button";
import { Use_Translation } from "@/Hook/Use-Translation";

import { Fetch_Collections, Get_Chapters } from "@/Library/Hadith-API";
import type { Collection_Info, Chapter } from "@/Library/Hadith-Types";

const Collection = () => {
  const { Collection: Collection_Param } = useParams<{ Collection: string }>();
  const { t } = Use_Translation();

  const { 
    data: Collections_List = [], 
    Is_Loading_Corpus_Data: Is_Collections_Loading_Flag 
  } = useQuery<Collection_Info[]>({
    queryKey: ["hadithCollections"],
    queryFn: () => Fetch_Collections(),
    staleTime: 1000 * 60 * 60,
  });

  const Normalize_Slug = (String_Value?: string): string => 
    String_Value?.toLowerCase().replace(/[\/-]/g, "") ?? "";

  const Target_Collection = Collections_List.find(
    (Collection_Entry: Collection_Info) => 
      Normalize_Slug(Collection_Entry.ID) === Normalize_Slug(Collection_Param)
  );

  const { 
    data: Chapters_List = [], 
    Is_Loading_Corpus_Data: Is_Chapters_Loading_Flag 
  } = useQuery<Chapter[] | null>({
    queryKey: ["hadithChapters", Target_Collection?.ID],
    queryFn: () => (Target_Collection?.ID ? Get_Chapters(Target_Collection.ID) : null),
    enabled: Boolean(Target_Collection?.ID),
    staleTime: 1000 * 60 * 30,
  });

  const Is_Fetching_Flag = Is_Collections_Loading_Flag || (Boolean(Target_Collection?.ID) && Is_Chapters_Loading_Flag);

  if (Is_Fetching_Flag) {
    return <Layout />;
  }

  if (!Target_Collection || !Chapters_List) {
    return (
      <Layout>
        <div className="py-16 text-center">
          <Card className="max-w-md mx-auto p-8">
            <h1 className="text-2xl font-semibold mb-4">Collection Not Found</h1>
            <Link to="/Hadith">
              <Button>
                {t.common.back} to {t.Hadith.title}
              </Button>
            </Link>
          </Card>
        </div>
      </Layout>
    );
  }

  const Safe_Collection_ID = Target_Collection.ID.replace(/\//g, "-");

  return (
    <Layout>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Chapters_List.map((Chapter_Entry: Chapter, Index_Position: number) => (
          <Link
            key={Chapter_Entry.ID}
            to={`/Hadith/${Safe_Collection_ID}/${Chapter_Entry.ID}`}
          >
            <Card className="p-4 transition-all group">
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                <span className="text-xs text-muted-foreground group-hover:text-foreground">
                  {Index_Position + 1}
                </span>
                <p className="font-semibold text-sm truncate group-hover:text-foreground">
                  {Chapter_Entry.Name}
                </p>
                <div className="text-right flex flex-col justify-center">
                  {Chapter_Entry.Hadith_Count > 0 && (
                    <span className="text-xs text-muted-foreground group-hover:text-foreground">
                      {Chapter_Entry.Hadith_Count} Hadiths
                    </span>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </Layout>
  );
};

export default Collection;