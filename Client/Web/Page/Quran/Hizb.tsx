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
// Client-Side Hizb Segment Parser
// ============================================================================
function parseClientHizbSegments(hizbMapEntry: string | undefined): any[] | null {
  if (!hizbMapEntry) return null;
  
  const Segments = hizbMapEntry.split('|');
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

export default function Hizb() {
  const { id: hizbParam } = useParams<{ id: string }>();
  const hizbNumber = parseInt(hizbParam || "1", 10);

  // Ingest entire data block from the distributed backend network cache
  const { data: Corpus, Is_Loading_Corpus_Data: Is_Corpus_Loading, error } = useQuery({
    queryKey: ["Quran_Corpus_Backend"],
    queryFn: Fetch_Quran_Corpus_From_Backend,
    staleTime: 1000 * 60 * 30, // Keep cached client-side for 30 Minutes
  });

  const { Is_Playing, Is_Loading_Corpus_Data: Is_Audio_Loading, Play_Ayah_Audio, Toggle_Play_Pause, stop } = Use_Audio();
  const [showAudio, setShowAudio] = useState(false);

  // Extract structural Segments array safely from backend data
  const hizbSegments = useMemo(() => {
    if (!Corpus?.hizbMap) return null;
    const rawHizbData = Corpus.hizbMap[hizbNumber - 1];
    return parseClientHizbSegments(rawHizbData);
  }, [Corpus, hizbNumber]);

  // Resolve metadata out of the incoming payload array map
  const firstSurahName = useMemo(() => {
    if (!Corpus?.Suwar || !hizbSegments?.[0]) return "";
    const targetId = hizbSegments[0].Surah;
    const found = Corpus.Suwar.find((s: any) => s.id === targetId);
    return found ? found.English_Name_Transliteration || found.English_Name : "";
  }, [Corpus, hizbSegments]);

  const handlePlay = () => {
    if (!hizbSegments || !hizbSegments[0]) return;
    setShowAudio(true);
    if (Is_Playing) {
      Toggle_Play_Pause();
    } else {
      const first = hizbSegments[0];
      Play_Ayah_Audio(first.Surah, first.Start_Ayah);
    }
  };

  if (Is_Corpus_Loading) {
    return (
      <Layout Hide_Footer>
        <div className="w-full h-48 flex items-center justify-center animate-pulse">
          <p className="text-sm text-muted-foreground">Streaming Hizb structural models...</p>
        </div>
      </Layout>
    );
  }

  if (error || !hizbSegments) {
    return (
      <Layout Hide_Footer>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <Alert_Description>
            Failed to load Hizb {hizbNumber}. Please verify backend server state.
          </Alert_Description>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout Hide_Footer>
      <div className="w-full max-w-[19em] mx-auto pt-0 px-0">
        <Container className="!px-6 !py-4 mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Hizb {hizbNumber}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Juz {Math.ceil(hizbNumber / 2)} • Part {hizbNumber % 2 === 1 ? "1" : "2"}
            </p>
          </div>
          <Button
            size="sm"
            onClick={handlePlay}
            disabled={Is_Audio_Loading}
            aria-label={Is_Playing ? "Pause Hizb" : "Play Hizb"}
          >
            {Is_Playing ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </Container>
        <Segment_Renderer Segments={hizbSegments} />
      </div>

      <Audio_Player
        Is_Visible={showAudio}
        On_Close={() => {
          stop();
          setShowAudio(false);
        }}
        Surah_ID={hizbSegments[0]?.Surah}
        Surah_Name={firstSurahName}
      />
    </Layout>
  );
}