import { useRef, memo, useMemo } from "react";
import DOMPurify from "dompurify";
import { BookOpen, MapPin, FileText, Calendar, Hash } from "lucide-react";
import { Use_Is_Mobile } from "@/Hook/Use-Mobile";
import { Scroll_Area } from "@Web/Component/UI/Scroll-Area";
import { Container } from "@Web/Component/UI/Container";
import { Use_App } from "@Web/Context/App";
import { Use_Back_Handler } from "@/Hook/Use-Back-Handler";
import { useQuery } from "@tanstack/react-query";

async function Fetch_Quran_Corpus_From_Backend() {
  const Response = await fetch("https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev/api/Quran-Corpus");
  if (!Response.ok) throw new Error("Failed to stream Quran Corpus database over the network");
  return Response.json();
}

function Get_Ordinal_Suffix(Number_Value: number): string {
  const Suffixes = ["th", "st", "nd", "rd"];
  const Value = Number_Value % 100;
  return Suffixes[(Value - 20) % 10] || Suffixes[Value] || Suffixes[0];
}

interface Surah_Info_Dialog_Properties {
  Open: boolean;
  On_Open_Change: (Open: boolean) => void;
  Surah_ID: number;
}

export const Surah_Info_Dialog = memo(function Surah_Info_Dialog({ 
  Open, 
  On_Open_Change, 
  Surah_ID 
}: Surah_Info_Dialog_Properties) {
  const Is_Mobile = Use_Is_Mobile();
  const Scroll_Reference = useRef<HTMLDivElement>(null);
  Use_Back_Handler(Open, () => On_Open_Change(false));

  const { Surah_Info_Text_Size } = Use_App();

  const { data: Corpus, Is_Loading_Corpus_Data } = useQuery({
    queryKey: ["Quran_Corpus_Backend"],
    queryFn: Fetch_Quran_Corpus_From_Backend,
    staleTime: 1000 * 60 * 30,
    enabled: Open,
  });

  const Surah = useMemo(() => {
    if (!Corpus?.Suwar) return null;
    return Corpus.Suwar.find((Item: any) => Item.id === Surah_ID) || null;
  }, [Corpus, Surah_ID]);

  const Chapter_Information = useMemo(() => {
    if (!Surah) return null;
    
    return {
      Chapter_ID: Surah.id,
      Text: Surah.English_Name_Translation || "No descriptive summary compiled for this Chapter entry.",
      Source: "Clear Quran / Combined Corpus Pipeline"
    };
  }, [Surah]);

  if (!Open) return null;

  const Get_Text_Size_Class = () => {
    switch (Surah_Info_Text_Size) {
      case 2: return "text-xs";
      case 3: return "text-sm";
      case 4: return "text-base";
      case 5: return "text-lg";
      default: return "text-sm";
    }
  };

  const Render_Content = () => {
    if (Is_Loading_Corpus_Data || !Surah) {
      return (
        <Container className="!py-5 !px-6 text-center animate-pulse">
          <p className="text-sm text-muted-foreground">Streaming metadata Corpus...</p>
        </Container>
      );
    }

    return (
      <div className="space-y-6">
        <Container className="!py-6 !px-6 text-center">
          <p className="font-Surah text-4xl mb-4 text-primary">{Surah.Surah_Font_Name}</p>
          <p className="text-xl font-semibold [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
            {Surah.English_Name_Transliteration || "Surah Asset"}
          </p>
          <p className="text-sm text-muted-foreground mt-1 [.high-contrast_&]:group-hover:text-white/70 [.high-contrast_&]:dark:group-hover:text-black/70">
            {Surah.English_Name_Translation}
          </p>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="p-3 rounded-[40px] bg-muted/30 [.high-contrast_&]:group-hover:bg-black/10 [.high-contrast_&]:dark:group-hover:bg-white/10 transition-colors">
              <Hash className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Surah</p>
              <p className="font-semibold [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                {String(Surah_ID).padStart(3, '0')}
              </p>
            </div>
            <div className="p-3 rounded-[40px] bg-muted/30 [.high-contrast_&]:group-hover:bg-black/10 [.high-contrast_&]:dark:group-hover:bg-white/10 transition-colors">
              <FileText className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Ayahs</p>
              <p className="font-semibold [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                {Surah.Number_Of_Ayaat}
              </p>
            </div>
            <div className="p-3 rounded-[40px] bg-muted/30 [.high-contrast_&]:group-hover:bg-black/10 [.high-contrast_&]:dark:group-hover:bg-white/10 transition-colors">
              <MapPin className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Revealed</p>
              <p className="font-semibold [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                {Surah.Revelation_Type === "Meccan" ? "Makkah" : "Madinah"}
              </p>
            </div>
            <div className="p-3 rounded-[40px] bg-muted/30 [.high-contrast_&]:group-hover:bg-black/10 [.high-contrast_&]:dark:group-hover:bg-white/10 transition-colors">
              <Calendar className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Order</p>
              <p className="font-semibold [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                {Surah.Revelation_Order}{Get_Ordinal_Suffix(Surah.Revelation_Order)}
              </p>
            </div>
          </div>
        </Container>

        {Chapter_Information ? (
          <Container className="!py-5 !px-6">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2 [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                <BookOpen className="h-5 w-5 text-primary" />About this Surah
              </h2>
              <div
                className={`prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed [.high-contrast_&]:group-hover:text-white/80 [.high-contrast_&]:dark:group-hover:text-black/80 ${Get_Text_Size_Class()}`}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(Chapter_Information.text) }}
              />
              {Chapter_Information.Source && (
                <p className={`text-xs text-muted-foreground mt-6 pt-4 border-t border-border/50 [.high-contrast_&]:group-hover:text-white/70 [.high-contrast_&]:dark:group-hover:text-black/70 ${Get_Text_Size_Class()}`}>
                  Source: {Chapter_Information.Source}
                </p>
              )}
            </div>
          </Container>
        ) : (
          <Container className="!py-5 !px-6">
            <p className="text-muted-foreground text-center">No additional information available.</p>
          </Container>
        )}
      </div>
    );
  };

  if (Is_Mobile) {
    return (
      <div className="fixed inset-0 z-40 bg-background">
        <div ref={Scroll_Reference} className="h-full overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="p-4 pt-[72px]">
            {Render_Content()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 bg-background">
      <Scroll_Area className="h-full" ref={Scroll_Reference}>
        <div className="p-6 pt-[72px] mx-auto max-w-2xl">
          {Render_Content()}
        </div>
      </Scroll_Area>
    </div>
  );
});