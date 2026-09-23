import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@Web/Component/Layout/Index";
import { Button } from "@Web/Component/UI/Button";

// Fetch function targeting your GitHub Codespaces forwarded address
async function Fetch_Aid_Corpus_From_Backend() {
  const response = await fetch("https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev/api/Aid-Corpus");
  if (!response.ok) throw new Error("Failed to load backend Aid Corpus data");
  return response.json();
}

export default function FeelingIndex() {
  const navigate = useNavigate();

  // Pull backend data asynchronously using the React Query client cache layer
  const { data: Corpus, Is_Loading_Corpus_Data } = useQuery({
    queryKey: ["aidCorpusBackend"],
    queryFn: Fetch_Aid_Corpus_From_Backend,
    staleTime: 1000 * 60 * 15, // Cache client-side for 15 Minutes
  });

  if (Is_Loading_Corpus_Data) {
    return (
      <Layout>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {[...Array(10)].map((_, Index) => (
              <Button key={Index} fullWidth disabled className="animate-pulse opacity-50">
                Loading...
              </Button>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // Extract the expressions list array slice from the global Corpus payload
  const feelingsList = Corpus?.feelings || [];

  return (
    <Layout>
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {feelingsList.map((f: any) => {
            const feelingIdentifier = f.id || f.name;
            return (
              <Button 
                key={feelingIdentifier} 
                fullWidth
                onClick={() => navigate(`/Aid/Feeling/${feelingIdentifier}`)} 
              >
                {f.name || feelingIdentifier}
              </Button>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}