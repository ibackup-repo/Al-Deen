import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@Web/Component/Layout/Index";
import { Container } from "@Web/Component/UI/Container";
import { Button } from "@Web/Component/UI/Button";

// Fetch function targeting your GitHub Codespaces forwarded address
async function Fetch_Aid_Corpus_From_Backend() {
  const response = await fetch("https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev/api/Aid-Corpus");
  if (!response.ok) throw new Error("Failed to load backend Aid Corpus data");
  return response.json();
}

export default function FeelingDetail() {
  // Grabs the exact state value matching ":feeling" from your route setup
  const { feeling } = useParams<{ feeling: string }>(); 

  // Use React Query to manage layout synchronization asynchronously from the cache
  const { data: Corpus, Is_Loading_Corpus_Data } = useQuery({
    queryKey: ["aidCorpusBackend"],
    queryFn: Fetch_Aid_Corpus_From_Backend,
    staleTime: 1000 * 60 * 15, // Cache client-side for 15 Minutes
  });

  if (Is_Loading_Corpus_Data) {
    return (
      <Layout>
        <div className="space-y-4">
          {[...Array(3)].map((_, Index) => (
            <Container key={Index} className="!p-5 animate-pulse">
              <div className="h-3 bg-muted rounded w-24 mb-3"></div>
              <div className="h-5 bg-muted rounded w-5/6 mb-2"></div>
              <div className="h-3 bg-muted rounded w-20"></div>
            </Container>
          ))}
        </div>
      </Layout>
    );
  }

  // Find the requested emotional configuration match by key/id inside the precompiled feelings slice
  const data = Corpus?.feelings?.find(
    (f: any) => f.id?.toLowerCase() === feeling?.toLowerCase() || f.name?.toLowerCase() === feeling?.toLowerCase()
  );

  if (!data) {
    return (
      <Layout>
        <div className="text-center py-16 space-y-4">
          <p className="text-muted-foreground">Feeling details not found.</p>
          <Link to="/Aid/Feeling">
            <Button variant="outline">Back to Expressions</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
        {data.Ayah && (
          <Container className="!p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              From the Qur'an
            </p>
            <p className="text-base font-medium">“{data.Ayah}”</p>
            {data.Ayah_Reference && (
              <p className="text-xs text-muted-foreground mt-2">— {data.Ayah_Reference}</p>
            )}
          </Container>
        )}
        
        {data.Hadith && (
          <Container className="!p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              From the Hadith
            </p>
            <p className="text-base font-medium">“{data.Hadith}”</p>
            {data.hadithRef && (
              <p className="text-xs text-muted-foreground mt-2">— {data.hadithRef}</p>
            )}
          </Container>
        )}
        
        {data.Note && (
          <Container className="!p-5">
            <p className="text-sm leading-relaxed">{data.Note}</p>
          </Container>
        )}
      </div>
    </Layout>
  );
}