import { useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { Layout } from "@Web/Component/Layout/Index";
import { AlertCircle, Play, Pause } from "lucide-react";
import { Alert, Alert_Description } from "@Web/Component/UI/Alert";
import { Container } from "@Web/Component/UI/Container";
import { Button } from "@Web/Component/UI/Button";
import { Segment_Renderer } from "@Web/Component/Quran/Segment-Renderer";
import { Audio_Player } from "@Web/Component/Audio-Player/Index";
import { Use_Audio } from "@Web/Context/Audio";
import { useQuery } from "@tanstack/react-query";

// ============================================================================
// Network Fetch Client Handler
// ============================================================================
async function Fetch_Quran_Corpus_From_Backend() {
  const response = await fetch("https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev/api/Quran-Corpus");
  if (!response.ok) throw new Error("Failed to stream Quran Corpus database over the network");
  return response.json();
}

// ============================================================================
// Client-Side Juz Segment Parser
// ============================================================================
function parseClientJuzSegments(juzMapEntry: string | undefined): any[] | null {
  if (!juzMapEntry) return null;
  
  const Segments = juzMapEntry.split('|');
  const result: any[] = [];
  
  for (const Segment of Segments) {
    const [start, end] = Segment.split('-');
    if (!start || !end) continue;
    
    const [Start_Surah, Start_Ayah] = start.split(':').map(Number);
    const [End_Surah, End_Ayah] = end.split(':').map(Number);
    
    result.push({
      Surah: Start_Surah,
      Start_Ayah,
      End_Surah,
      End_Ayah
    });
  }
  
  return result.length > 0 ? result : null;
}

export default function Juz() {
  const { id: juzParam } = useParams<{ id: string }>();
  const juzNumber = parseInt(juzParam || "1", 10);

  // Ingest entire data block from the distributed backend network cache
  const { data: Corpus, Is_Loading_Corpus_Data: Is_Corpus_Loading, error } = useQuery({
    queryKey: ["Quran_Corpus_Backend"],
    queryFn: Fetch_Quran_Corpus_From_Backend,
    staleTime: 1000 * 60 * 30, // Keep cached client-side for 30 Minutes
  });

  const { Is_Playing, Is_Loading_Corpus_Data: Is_Audio_Loading, Play_Ayah_Audio, Toggle_Play_Pause, stop } = Use_Audio();
  const [showAudio, setShowAudio] = useState(false);

  // Extract structural Segments array safely from backend data string maps
  const juzSegments = useMemo(() => {
    if (!Corpus?.juzMap) return null;
    const rawJuzData = Corpus.juzMap[juzNumber - 1];
    return parseClientJuzSegments(rawJuzData);
  }, [Corpus, juzNumber]);

  // Resolve metadata out of the incoming payload array map
  const firstSurahName = useMemo(() => {
    if (!Corpus?.Suwar || !juzSegments?.[0]) return "";
    const targetId = juzSegments[0].Surah;
    const found = Corpus.Suwar.find((s: any) => s.id === targetId);
    return found ? found.English_Name_Transliteration || found.English_Name : "";
  }, [Corpus, juzSegments]);

  const handlePlay = () => {
    if (!juzSegments || !juzSegments[0]) return;
    setShowAudio(true);
    if (Is_Playing) {
      Toggle_Play_Pause();
    } else {
      const first = juzSegments[0];
      Play_Ayah_Audio(first.Surah, first.Start_Ayah);
    }
  };

  if (Is_Corpus_Loading) {
    return (
      <Layout Hide_Footer>
        <div className="w-full h-48 flex items-center justify-center animate-pulse">
          <p className="text-sm text-muted-foreground">Streaming Juz structural models...</p>
        </div>
      </Layout>
    );
  }

  if (error || !juzSegments) {
    return (
      <Layout Hide_Footer>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <Alert_Description>
            Failed to load Juz {juzNumber}. Please verify backend server state.
          </Alert_Description>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout Hide_Footer>
      <div className="w-full max-w-[19em] mx-auto pt-0 px-0">
        <Container className="!px-6 !py-4 mb-4 flex items-center justify-between">
          <h1 className="text-lg font-bold">Juz {juzNumber}</h1>
          <Button
            size="sm"
            onClick={handlePlay}
            disabled={Is_Audio_Loading}
            aria-label={Is_Playing ? "Pause Juz" : "Play Juz"}
          >
            {Is_Playing ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </Container>
        <Segment_Renderer Segments={juzSegments} />
      </div>

      <Audio_Player
        Is_Visible={showAudio}
        On_Close={() => {
          stop();
          setShowAudio(false);
        }}
        Surah_ID={juzSegments[0]?.Surah}
        Surah_Name={firstSurahName}
      />
    </Layout>
  );
}