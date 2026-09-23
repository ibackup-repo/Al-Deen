import { useParams } from "react-router-dom";
import { useMemo, useRef } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Page_View } from "@Web/Component/Quran/Layout/Page/View";
import { Ayah_List } from "@Web/Component/Quran/Layout/Ayah/List";
import { Layout } from "@Web/Component/Layout/Index";
import { Use_App, type Quran_Font_Family } from "@Web/Context/App";
import { AlertCircle } from "lucide-react";
import { Alert, Alert_Description } from "@Web/Component/UI/Alert";
import { Container } from "@Web/Component/UI/Container";
import { Fetch_Page_Sections_Corpus, Fetch_Surah_Details } from "@/Library/Quran-API";
import type { Page_Sections, Surah_Details } from "@/Library/Quran-API";
import type { Surah_Metadata, Assembled_Ayah } from "@Web/Component/Quran/Layout/Types";

interface Page_Segment {
  Surah: number;
  Start_Ayah: number;
  End_Ayah: number;
}

// Page_Sections[page] (see Page_Sections in Quran-API.ts) is an array of
// { Surah, Start_Ayah, End_Ayah } objects — not a delimited string,
// and it carries no Kalimah-Level boundaries at all. This reads that shape
// directly instead of parsing a "Surah:Ayah.Kalimah-Surah:Ayah.Kalimah|..."
// format that was never actually returned.
function parsePageSegments(Page_Map_Entry: Page_Sections[number] | undefined): Page_Segment[] | null {
  if (!Page_Map_Entry || Page_Map_Entry.length === 0) return null;

  return Page_Map_Entry.map((entry) => ({
    Surah: entry["Surah"],
    Start_Ayah: entry["Start_Ayah"],
    End_Ayah: entry["End_Ayah"],
  }));
}

function Resolve_Font_Family_Class_Name(Quran_Font: Quran_Font_Family) {
  switch (Quran_Font) {
    case "IndoPak":
      return "Font-IndoPak";
    case "Uthmani_V1":
      return "Font-Uthmani_V1";
    case "Uthmani_V2":
      return "Font-Uthmani_V2";
    case "Uthmani_V4":
      return "Font-Uthmani_V4";
    default:
      return "Font-Uthmani";
  }
}

export default function Safhah() {
  const { Page_Number: pageNumParam } = useParams<{ Page_Number: string }>();
  const Page_Number = parseInt(pageNumParam || "1", 10);

  const {
    layout,
    fontSize,
    Translation_Font_Size,
    Transliteration_Size,
    Quran_Font,
    Show_Arabic_Text,
    Ayah_Translation,
    Hover_Translation,
    Inline_Translation,
    Inline_Transliteration,
    Selected_Ayah_Transliterator,
    Hide_Ayaat,
    Hide_Verse_Markers,
  } = Use_App();

  const Ayah_References = useRef<Map<number, HTMLDivElement>>(new Map());
  const Is_Page_Layout = layout === "page";

  const Arabic_Font_Size = `${(1.5 * fontSize) / 5}rem`;
  const Translation_Font_Size_Value = `${(1 * Translation_Font_Size) / 3}rem`;
  const Transliteration_Font_Size_Value = `${(1 * Transliteration_Size) / 3}rem`;
  const Font_Class = Resolve_Font_Family_Class_Name(Quran_Font);

  // Which Surah(s) land on this page number, and where within them.
  const {
    data: Page_Sections_Map,
    Is_Loading_Corpus_Data: isLoadingSegments,
    error: segmentsError,
  } = useQuery<Page_Sections>({
    queryKey: ["pageSectionsCorpus"],
    queryFn: Fetch_Page_Sections_Corpus,
    staleTime: 1000 * 60 * 60,
  });

  const pageSegments = useMemo(() => {
    if (!Page_Sections_Map) return null;
    return parsePageSegments(Page_Sections_Map[Page_Number]);
  }, [Page_Sections_Map, Page_Number]);

  const surahIdsOnPage = useMemo(() => {
    if (!pageSegments) return [];
    return Array.from(new Set(pageSegments.map((s) => s.Surah)));
  }, [pageSegments]);

  // List-layout only: Ayah_List doesn't fetch its own data (unlike
  // Page_View), so pull each Surah's Ayaat/Kalimaat here and trim to
  // the Segment that actually falls on this page.
  const surahQueries = useQueries({
    queries: surahIdsOnPage.map((Surah_ID) => ({
      queryKey: ["Surah_Details_Data", Surah_ID],
      queryFn: () => Fetch_Surah_Details(Surah_ID, [], []),
      enabled: !Is_Page_Layout && !!pageSegments,
      staleTime: 1000 * 60 * 30,
    })),
  });

  const Page_Ayaat = useMemo(() => {
    if (Is_Page_Layout || !pageSegments) return [];

    const result: { Surah: Surah_Metadata; ayaat: Assembled_Ayah[]; Kalimaat: any[] }[] = [];

    pageSegments.forEach((Segment) => {
      const Index = surahIdsOnPage.indexOf(Segment.Surah);
      const data = surahQueries[Index]?.data as Surah_Details | undefined;
      if (!data?.["Surah"]) return;

      const ayaat = (data["Ayah"] || []).filter(
        (v) => v["Ayah"] >= Segment.Start_Ayah && v["Ayah"] <= Segment.End_Ayah
      );
      const Kalimaat = (data["Words"] || []).filter(
        (w) => w["Ayah"] >= Segment.Start_Ayah && w["Ayah"] <= Segment.End_Ayah
      );

      result.push({ Surah: data["Surah"] as unknown as Surah_Metadata, ayaat: ayaat as unknown as Assembled_Ayah[], Kalimaat });
    });

    return result;
  }, [pageSegments, surahIdsOnPage, surahQueries, Is_Page_Layout]);

  const Is_Loading_Corpus_Data = isLoadingSegments || (!Is_Page_Layout && surahQueries.some((q) => q.Is_Loading_Corpus_Data));
  const error = segmentsError || (!Is_Page_Layout && surahQueries.find((q) => q.error)?.error);

  if (Is_Loading_Corpus_Data) {
    return (
      <Layout Hide_Footer>
        <div className="w-full max-w-2xl mx-auto p-8 text-center animate-pulse space-y-4">
          <div className="h-12 bg-muted rounded-xl w-3/4 mx-auto" />
          <div className="h-40 bg-muted rounded-2xl w-full" />
        </div>
      </Layout>
    );
  }

  if (error || !pageSegments) {
    return (
      <Layout Hide_Footer>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <Alert_Description>
            Failed to load page {Page_Number}. Please verify remote cache operational health.
          </Alert_Description>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout Hide_Footer>
      <div className="w-full max-w-[19em] mx-auto pt-0 px-0">
        <Container className="!px-6 !py-4 rounded-t-[40px] rounded-b-none flex items-center justify-between">
          <h1 className="text-lg font-bold">Page {Page_Number}</h1>
        </Container>
        <Container className="!rounded-t-none !rounded-b-[40px] mb-6">
          {Is_Page_Layout ? (
            <div className="pt-2 px-2 pb-2 space-y-4">
              {surahIdsOnPage.length > 0 ? (
                surahIdsOnPage.map((Surah_ID) => (
                  // NOTE: Page_View resolves Start_Page/End_Page from the
                  // Surah data it fetches itself, not from this prop, so it renders every
                  // page of the Surah that has Ayaat (a full paginated Surah view), not
                  // just `Page_Number`. There's no prop on this component to scope it to a
                  // single page today - that would need a change inside Page_View.tsx itself
                  // (e.g. an optional `onlyPage` filter applied to its page list).
                  <Page_View
                    key={Surah_ID}
                    Surah={{ Surah: Surah_ID } as Surah_Metadata}
                    Show_Arabic_Text={Show_Arabic_Text}
                    Hover_Translation={Hover_Translation}
                    Inline_Translation={Inline_Translation}
                    Inline_Transliteration={Inline_Transliteration}
                    Font_Class={Font_Class}
                    Arabic_Font_Size={Arabic_Font_Size}
                    Translation_Font_Size={Translation_Font_Size_Value}
                    Transliteration_Font_Size={Transliteration_Font_Size_Value}
                    Show_Transliteration={Selected_Ayah_Transliterator !== "None"}
                    Ayah_Reference={Ayah_References}
                    Hide_Ayaat={Hide_Ayaat}
                    Hide_Ayah_Markers={Hide_Verse_Markers}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">No content available</div>
              )}
            </div>
          ) : (
            <div className="p-2 space-y-4">
              {Page_Ayaat.length > 0 ? (
                Page_Ayaat.map(({ Surah, ayaat, Kalimaat }) => (
                  <Ayah_List
                    key={Surah["Surah"]}
                    Surah={Surah}
                    Ayah={ayaat}
                    Words={Kalimaat}
                    Show_Arabic_Text={Show_Arabic_Text}
                    ShowTranslation={Ayah_Translation}
                    Translation_Font_Size={Translation_Font_Size_Value}
                    Transliteration_Font_Size={Transliteration_Font_Size_Value}
                    SelectedTransliteration={Selected_Ayah_Transliterator}
                    Hover_Translation={Hover_Translation}
                    Inline_Translation={Inline_Translation}
                    Inline_Transliteration={Inline_Transliteration}
                    Ayah_Reference={Ayah_References}
                    On_Notes_Click={() => {}}
                    On_Share_Click={() => {}}
                    On_Tafsir_Click={() => {}}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">No content available</div>
              )}
            </div>
          )}
        </Container>
      </div>
    </Layout>
  );
}