import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { GuessGame, BoardItem } from "./Game";

// ============================================================================
// Network Fetch Client Handler
// ============================================================================
async function Fetch_Quran_Corpus_From_Backend() {
  const response = await fetch("https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev/api/Quran-Corpus");
  if (!response.ok) throw new Error("Failed to stream Quran Corpus database over the network");
  return response.json();
}

export default function GuessSurahIndex() {
  // Ingest entire data block cleanly from the distributed backend network cache
  const { data: Corpus, Is_Loading_Corpus_Data } = useQuery({
    queryKey: ["Quran_Corpus_Backend"],
    queryFn: Fetch_Quran_Corpus_From_Backend,
    staleTime: 1000 * 60 * 30, // Cache client-side for 30 Minutes
  });

  // Dynamically assemble the game board items array once data streams in
  const Suwar = useMemo<BoardItem[]>(() => {
    if (!Corpus?.Suwar || !Array.isArray(Corpus.Suwar)) return [];

    return Corpus.Suwar.map((Surah: any) => {
      const name = Surah.English_Name_Transliteration || `Surah ${Surah.id}`;
      const meaning = Surah.English_Name_Translation || "";
      
      return {
        id: `Surah-${Surah.id - 1}`,
        name,
        rawFacts: [
          meaning,
          `translated meaning is ${meaning}`,
          `index position is ${Surah.id}`
        ]
      };
    });
  }, [Corpus]);

  if (Is_Loading_Corpus_Data) {
    return (
      <div className="w-full h-64 flex items-center justify-center animate-pulse">
        <p className="text-sm text-muted-foreground">Streaming game deck configurations...</p>
      </div>
    );
  }

  return <GuessGame deckItems={Suwar} gameType="Surah" />;
}