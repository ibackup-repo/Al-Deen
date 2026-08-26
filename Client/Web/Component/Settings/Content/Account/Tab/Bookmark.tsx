import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@Web/Component/UI/Button";
import { Container } from "@Web/Component/UI/Container";
import { Bookmark, Trash2 } from "lucide-react";

const Backend_Base_URL = "https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev";

interface Bookmarks_Tab_Properties {
  Bookmarks: any[];
  Is_Loading_Corpus_Data: boolean;
  Remove_Bookmark: (id: string) => Promise<void>;
  Set_Settings_Sidebar_Open: (Open: boolean) => void;
}

async function Fetch_Quran_Corpus_From_Backend() {
  const response = await fetch(`${Backend_Base_URL}/api/Quran-Corpus`);
  if (!response.ok) throw new Error("Failed to load unified Quran Corpus data map");
  return response.json();
}

export function Bookmarks_Tab({
  Bookmarks,
  Is_Loading_Corpus_Data,
  Remove_Bookmark,
  Set_Settings_Sidebar_Open,
}: Bookmarks_Tab_Properties) {
  // Ingest structural data maps from the centralized layout cache
  const { data: Corpus, Is_Loading_Corpus_Data: Is_Corpus_Loading } = useQuery({
    queryKey: ["Quran_Corpus_Backend"],
    queryFn: Fetch_Quran_Corpus_From_Backend,
    staleTime: 1000 * 60 * 30,
  });

  const Surah_List = useMemo(() => Corpus?.Suwar || [], [Corpus]);

  if (Is_Loading_Corpus_Data || Is_Corpus_Loading) return null;

  if (Bookmarks.length === 0) {
    return (
      <Container className="text-center py-6">
        <Bookmark className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No Bookmarks yet</p>
      </Container>
    );
  }

  return (
    <div className="space-y-2">
      {Bookmarks.map((bookmark) => {
        const Surah = Surah_List.find((s: any) => s.id === bookmark.Surah_ID);
        return (
          <Container key={bookmark.id} className="!p-3 group">
            <div className="flex items-center gap-3">
              <Link
                to={`/Quran/Surah/${bookmark.Surah_ID}${bookmark.Ayah_ID ? `?Ayah=${bookmark.Ayah_ID}` : ""}`}
                onClick={() => Set_Settings_Sidebar_Open(false)}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium truncate">
                  {Surah?.English_Name || `Surah ${bookmark.Surah_ID}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {bookmark.Ayah_ID ? `Ayah ${bookmark.Ayah_ID}` : "Surah"}
                </p>
              </Link>
              <Button
                onClick={() => Remove_Bookmark(bookmark.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 p-0 rounded-full"
                size="sm"
                variant="secondary"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          </Container>
        );
      })}
    </div>
  );
}