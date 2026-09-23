import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@Web/Component/Layout/Index";
import { Container } from "@Web/Component/UI/Container";
import { Fetch_Prophets } from "@Web/../Source/Library/Aid-API";
import type { Prophet_Record } from "@Web/../Source/Library/Aid-Types";

export default function Prophets() {
  const { data: Prophets_List_Collection, Is_Loading_Corpus_Data: Is_Prophets_Loading, isError: Has_Prophets_Error } = useQuery<Prophet_Record[]>({
    queryKey: ["Aid_Prophets"],
    queryFn: Fetch_Prophets,
    staleTime: 1000 * 60 * 15,
  });

  if (Is_Prophets_Loading) {
    return (
      <Layout>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[...Array(12)].map((_, Index_Position) => (
            <Container key={Index_Position} className="!p-4 text-center animate-pulse">
              <div className="h-3 bg-muted rounded w-6 mx-auto mb-2"></div>
              <div className="h-5 bg-muted rounded w-20 mx-auto"></div>
            </Container>
          ))}
        </div>
      </Layout>
    );
  }

  if (Has_Prophets_Error || !Prophets_List_Collection || Prophets_List_Collection.length === 0) {
    return (
      <Layout>
        <Container className="!p-8 text-center">
          <p className="text-muted-foreground font-semibold">
            {Has_Prophets_Error ? "Failed to load prophets." : "No prophets found."}
          </p>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Prophets_List_Collection.map((Prophet_Item: Prophet_Record, Index_Position: number) => (
          <Link key={Prophet_Item.ID} to={`/Aid/Prophets/${Prophet_Item.ID}`}>
            <Container className="!p-4 text-center hover:bg-accent transition-colors">
              <p className="text-xs text-muted-foreground">{Index_Position + 1}</p>
              <p className="font-semibold mt-1">{Prophet_Item.Prophet_Name}</p>
            </Container>
          </Link>
        ))}
      </div>
    </Layout>
  );
}