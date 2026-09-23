import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@Web/Component/Layout/Index";
import { Card } from "@Web/Component/UI/Card";
import { Fetch_Article_Topics } from "@Web/../Source/Library/Aid-API";
import type { Article_Topic_Record } from "@Web/../Source/Library/Aid-Types";

const Articles_Hadith_Source_Text =
  "Faith is that you believe in Allah, His Angels, His Books, His Messengers, the Last Day, and that you believe in Fate (Qadar), both its good and its bad. (Sahih Muslim)";

export default function Articles() {
  const { data: Topics_List_Collection, Is_Loading_Corpus_Data, isError } = useQuery<Article_Topic_Record[]>({
    queryKey: ["aidArticleTopics"],
    queryFn: Fetch_Article_Topics,
    staleTime: 1000 * 60 * 15,
  });

  if (Is_Loading_Corpus_Data) {
    return (
      <Layout>
        <div className="space-y-4">
          <Card className="p-5" Is_Hoverable={false}>
            <p className="font-semibold">Hadith Source</p>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed animate-pulse">
              Loading source citation...
            </p>
          </Card>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[...Array(6)].map((_, Index_Position) => (
              <Card key={Index_Position} className="p-4 animate-pulse" Is_Hoverable={false}>
                <div className="h-5 bg-muted rounded w-3/4"></div>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (isError || !Topics_List_Collection || Topics_List_Collection.length === 0) {
    return (
      <Layout>
        <div className="space-y-4">
          <Card className="p-5" Is_Hoverable={false}>
            <p className="font-semibold">Hadith Source</p>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {Articles_Hadith_Source_Text}
            </p>
          </Card>
          <Card className="p-8 text-center" Is_Hoverable={false}>
            <p className="text-muted-foreground font-semibold">
              {isError ? "Failed to load topics." : "No article topics found."}
            </p>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
        <Card className="p-5" Is_Hoverable={false}>
          <p className="font-semibold">Hadith Source</p>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {Articles_Hadith_Source_Text}
          </p>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Topics_List_Collection.map((Topic_Item: Article_Topic_Record) => (
            <Link key={Topic_Item.ID} to={`/Aid/Articles/${Topic_Item.ID}`}>
              <Card className="p-4 group">
                <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                  <p className="text-xs text-muted-foreground [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                    {Topic_Item.ID}
                  </p>
                  <p className="font-semibold capitalize [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                    {Topic_Item.Topic_Name}
                  </p>
                  {Topic_Item.Article_Count_Number > 0 && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-medium">
                      {Topic_Item.Article_Count_Number}
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
}