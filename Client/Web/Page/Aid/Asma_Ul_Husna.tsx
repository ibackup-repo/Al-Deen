import { useQuery } from "@tanstack/react-query";
import { Layout } from "@Web/Component/Layout/Index";
import { Container } from "@Web/Component/UI/Container";
import { Fetch_Asma_Ul_Husna } from "@Web/../Source/Library/Aid-API";
import type { Asma_Ul_Husna_Record } from "@Web/../Source/Library/Aid-Types";

export default function Asma_Ul_Husna() {
  const { data: Divine_Names_Collection_List, Is_Loading_Corpus_Data: Is_Loading_Data_Flag } = useQuery<Asma_Ul_Husna_Record[]>({
    queryKey: ["aidNamesOfAllah"],
    queryFn: Fetch_Asma_Ul_Husna,
    staleTime: 1000 * 60 * 15,
  });

  if (Is_Loading_Data_Flag) {
    return (
      <Layout>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[...Array(9)].map((_, Index_Position) => (
            <Container key={Index_Position} className="!p-4 text-center animate-pulse">
              <div className="h-3 bg-muted rounded w-6 mx-auto mb-2"></div>
              <div className="h-7 bg-muted rounded w-20 mx-auto mb-2"></div>
              <div className="h-5 bg-muted rounded w-24 mx-auto mb-1"></div>
              <div className="h-3 bg-muted rounded w-32 mx-auto"></div>
            </Container>
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {Divine_Names_Collection_List?.map((Divine_Name_Item: Asma_Ul_Husna_Record) => (
          <Container key={Divine_Name_Item.ID} className="!p-4 text-center">
            <p className="text-xs text-muted-foreground">{Divine_Name_Item.ID}</p>
            <p className="text-2xl font-Arabic mt-1" dir="rtl">{Divine_Name_Item.Arabic_Content_Text}</p>
            <p className="font-semibold mt-2">{Divine_Name_Item.Transliteration_Text}</p>
            <p className="text-xs text-muted-foreground">{Divine_Name_Item.Translation_Text}</p>
          </Container>
        ))}
      </div>
    </Layout>
  );
}