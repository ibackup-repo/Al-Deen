// @Web/Page/Aid/Schools/Detail.tsx
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@Web/Component/Layout/Index";
import { Card } from "@Web/Component/UI/Card";
import { Button } from "@Web/Component/UI/Button";

type School = {
  id: string;
  name: string;
  founder: string;
  regions: string;
  description: string;
};

type Branch = {
  id: string;
  name: string;
  summary: string;
  schools: School[];
};

const Backend_Base_URL = "https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev";

async function Fetch_Aid_Corpus_From_Backend() {
  const response = await fetch(`${Backend_Base_URL}/api/Aid-Corpus`);
  if (!response.ok) throw new Error("Failed to fetch Aid Corpus database");
  return response.json();
}

const Detail = () => {
  const { branch: branchId, detail: schoolId } = useParams<{ branch: string; detail: string }>();
  const navigate = useNavigate();

  const { data: Corpus, Is_Loading_Corpus_Data } = useQuery({
    queryKey: ["aidCorpusBackend"],
    queryFn: Fetch_Aid_Corpus_From_Backend,
    staleTime: 1000 * 60 * 30, // 30-minute stale time
  });

  const branches: Branch[] = Corpus?.branches ?? [];
  const branch = branches.find((b) => b.id === branchId);
  const school = branch?.schools.find((s) => s.id === schoolId);

  if (Is_Loading_Corpus_Data) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto space-y-4 p-8 text-center animate-pulse">
          <div className="h-8 bg-muted rounded-xl w-3/4 mx-auto" />
          <div className="h-40 bg-muted rounded-2xl w-full" />
        </div>
      </Layout>
    );
  }

  if (!branch || !school) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto">
          <p className="text-sm text-muted-foreground">School not found.</p>
          <Button variant="ghost" size="sm" className="mt-4" onClick={() => navigate(`/Aid/Schools/${branchId}`)}>
            ← Back
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <Card className="p-5 space-y-4">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Founder</dt>
              <dd>{school.founder}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Regions</dt>
              <dd>{school.regions}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Branch</dt>
              <dd
                className="inline-flex items-center cursor-pointer text-foreground hover:underline"
                onClick={() => navigate(`/Aid/Schools/${branch.id}`)}
              >
                {branch.name}
              </dd>
            </div>
          </dl>

          <hr className="border-border/40" />

          <p className="text-sm leading-relaxed">{school.description}</p>
        </Card>

        <p className="text-xs text-muted-foreground text-center pt-2">
          This is an introductory overview, not a fatwa. Refer to qualified scholars for detailed rulings.
        </p>
      </div>
    </Layout>
  );
};

export default Detail;