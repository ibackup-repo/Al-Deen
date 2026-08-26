import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@Web/Component/UI/Button";
import { Container } from "@Web/Component/UI/Container";
import { FileText, Trash2 } from "lucide-react";

const Backend_Base_URL = "https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev";

interface Notes_Tab_Properties {
  Notes: any[];
  Is_Loading_Corpus_Data: boolean;
  Delete_Note: (id: string) => Promise<void>;
  Set_Settings_Sidebar_Open: (Open: boolean) => void;
}

async function Fetch_Quran_Corpus_From_Backend() {
  const response = await fetch(`${Backend_Base_URL}/api/Quran-Corpus`);
  if (!response.ok) throw new Error("Failed to load unified Quran Corpus data map");
  return response.json();
}

export function Notes_Tab({
  Notes,
  Is_Loading_Corpus_Data,
  Delete_Note,
  Set_Settings_Sidebar_Open,
}: Notes_Tab_Properties) {
  // Pull core structural layout map over client cache layers
  const { data: Corpus, Is_Loading_Corpus_Data: Is_Corpus_Loading } = useQuery({
    queryKey: ["Quran_Corpus_Backend"],
    queryFn: Fetch_Quran_Corpus_From_Backend,
    staleTime: 1000 * 60 * 30,
  });

  const Surah_List = useMemo(() => Corpus?.Suwar || [], [Corpus]);

  if (Is_Loading_Corpus_Data || Is_Corpus_Loading) return null;

  if (Notes.length === 0) {
    return (
      <Container className="text-center py-6">
        <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No Notes yet</p>
      </Container>
    );
  }

  return (
    <div className="space-y-2">
      {Notes.map((Note) => {
        const Surah = Surah_List.find((s: any) => s.id === Note.Surah_ID);
        return (
          <Container key={Note.id} className="!p-3 group relative">
            <Link
              to={`/Quran/Surah/${Note.Surah_ID}${Note.Ayah_ID ? `?Ayah=${Note.Ayah_ID}` : ""}`}
              onClick={() => Set_Settings_Sidebar_Open(false)}
              className="block"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-primary">
                  {Surah?.English_Name || `Surah ${Note.Surah_ID}`} {Note.Ayah_ID ? `${Note.Surah_ID}:${Note.Ayah_ID}` : ""}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(Note.Updated_At).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-foreground line-clamp-2">{Note.content}</p>
            </Link>
            <Button
              onClick={() => Delete_Note(Note.id)}
              className="absolute Top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 p-0 rounded-full"
              size="sm"
              variant="secondary"
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </Container>
        );
      })}
    </div>
  );
}