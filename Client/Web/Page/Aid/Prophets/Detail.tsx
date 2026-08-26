import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@Web/Component/Layout/Index";
import { Container } from "@Web/Component/UI/Container";
import { Button } from "@Web/Component/UI/Button";
import { Get_Prophet_By_ID } from "@Web/../Source/Library/Aid-API";
import type { Prophet_Record, Prophet_Section_Record } from "@Web/../Source/Library/Aid-Types";

export default function Prophet_Detail() {
  const { id: Target_ID_Param_String = "" } = useParams<{ id: string }>();
  const Target_Prophet_ID = Number(Target_ID_Param_String);

  const { data: Prophet_Record_Data, Is_Loading_Corpus_Data: Is_Prophet_Loading, isError: Has_Prophet_Error } = useQuery<Prophet_Record | null>({
    queryKey: ["Aid_Prophet", Target_Prophet_ID],
    queryFn: () => Get_Prophet_By_ID(Target_Prophet_ID),
    staleTime: 1000 * 60 * 15,
    enabled: !isNaN(Target_Prophet_ID),
  });

  if (Is_Prophet_Loading) {
    return (
      <Layout>
        <Container className="!p-8 text-center">
          <p className="text-muted-foreground animate-pulse">Loading prophet details...</p>
        </Container>
      </Layout>
    );
  }

  if (Has_Prophet_Error || !Prophet_Record_Data) {
    return (
      <Layout>
        <div className="py-16 text-center">
          <Container className="max-w-md mx-auto !p-8">
            <h1 className="text-2xl font-semibold mb-4">Prophet Not Found</h1>
            <Link to="/Aid/Prophets">
              <Button>Back to 25 Prophets</Button>
            </Link>
          </Container>
        </div>
      </Layout>
    );
  }

  const Prophet_Sections_Collection: Prophet_Section_Record[] = Prophet_Record_Data.Sections_Collection || [];

  return (
    <Layout>
      <div className="space-y-4">
        {Prophet_Sections_Collection.length > 0 ? (
          <>
            <Container className="!p-5">
              <h1 className="text-2xl font-bold">{Prophet_Record_Data.Prophet_Name}</h1>
            </Container>

            {Prophet_Sections_Collection.map((Section_Item: Prophet_Section_Record) => (
              <Container key={Section_Item.ID} className="!p-5">
                <p className="font-semibold">{Section_Item.Heading_Text}</p>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{Section_Item.Content_Text}</p>
              </Container>
            ))}
          </>
        ) : (
          <Container className="!p-6 text-center">
            <h1 className="text-xl font-bold">{Prophet_Record_Data.Prophet_Name}</h1>
            <p className="text-sm text-muted-foreground mt-2">Detailed content coming soon.</p>
          </Container>
        )}
      </div>
    </Layout>
  );
}