import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@Web/Component/Layout/Index";
import { Card } from "@Web/Component/UI/Card";
import { Button } from "@Web/Component/UI/Button";
import { Get_Article_Topic } from "@Web/../Source/Library/Aid-API";
import type { Article_Topic_Output_Payload, Article_Record } from "@Web/../Source/Library/Aid-Types";

export default function Article_Detail() {
  const { id = "" } = useParams<{ id: string }>();

  const { data: Topic_Data_Payload, Is_Loading_Corpus_Data } = useQuery<Article_Topic_Output_Payload | null>({
    queryKey: ["aidArticleTopic", id],
    queryFn: async () => {
      const Target_Topic_ID_Number = Number(id);
      if (isNaN(Target_Topic_ID_Number)) return null;
      return Get_Article_Topic(Target_Topic_ID_Number);
    },
    staleTime: 1000 * 60 * 15,
    enabled: !!id,
  });

  if (Is_Loading_Corpus_Data) {
    return (
      <Layout>
        <Card className="p-8 text-center" Is_Hoverable={false}>
          <p className="text-muted-foreground animate-pulse">Loading article...</p>
        </Card>
      </Layout>
    );
  }

  if (!Topic_Data_Payload) {
    return (
      <Layout>
        <div className="py-16 text-center">
          <Card className="max-w-md mx-auto p-8" Is_Hoverable={false}>
            <h1 className="text-2xl font-semibold mb-4">Article Not Found</h1>
            <Link to="/Aid/Articles">
              <Button>Back to Articles</Button>
            </Link>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
        {/* Topic Title */}
        <Card className="p-5" Is_Hoverable={false}>
          <h1 className="text-2xl font-bold capitalize">
            {Topic_Data_Payload.Topic_Information.Topic_Name}
          </h1>
        </Card>

        {/* List of Articles in Topic */}
        {Topic_Data_Payload.Articles_Collection?.map((Article_Item: Article_Record) => (
          <Card key={Article_Item.ID} className="p-5" Is_Hoverable={false}>
            {Article_Item.Article_Title ? (
              <p className="font-semibold text-lg mb-2">{Article_Item.Article_Title}</p>
            ) : null}
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {Article_Item.Article_Content_Text}
            </p>
          </Card>
        ))}
      </div>
    </Layout>
  );
}