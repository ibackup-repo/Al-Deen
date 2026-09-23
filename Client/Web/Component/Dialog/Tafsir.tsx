import { useRef, useState, memo, useEffect } from "react";
import DOMPurify from "dompurify";
import { Scroll_Area } from "@Web/Component/UI/Scroll-Area";
import { Container } from "@Web/Component/UI/Container";
import { Button } from "@Web/Component/UI/Button";
import { 
  ChevronLeft, ChevronRight, 
  AlertCircle, BookOpen 
} from "lucide-react";
import { Use_Is_Mobile } from "@/Hook/Use-Mobile";
import { Use_App } from "@Web/Context/App";
import { Use_Back_Handler } from "@/Hook/Use-Back-Handler";

interface Tafsir_Dialog_Properties {
  Open: boolean;
  On_Open_Change: (Open: boolean) => void;
  Surah_ID: number;
  Ayah_ID?: number;
  Total_Ayaat?: number;
}

async function Fetch_Custom_Tafsir(
  Provider: string,
  Surah_ID: number,
  Ayah_ID: number
): Promise<string | null> {
  try {
    const Tafsir_Module = await import(
      `Server/Data/Quran/Surah/Tafsir/${Provider}/${Surah_ID}/${Ayah_ID}.json`
    );
    const Data = Tafsir_Module.default;
    
    if (typeof Data === "string") {
      return Data;
    }
    
    if (Array.isArray(Data) && Data.length > 0) {
      return Data[0];
    }
    
    return null;
  } catch (Error_Context) {
    console.error(`error Loading tafsir for ${Provider}/${Surah_ID}:${Ayah_ID}`, Error_Context);
    return null;
  }
}

export const Tafsir_Dialog = memo(function Tafsir_Dialog({
  Open,
  On_Open_Change,
  Surah_ID,
  Ayah_ID = 1,
  Total_Ayaat,
}: Tafsir_Dialog_Properties) {
  const Is_Mobile = Use_Is_Mobile();
  const Scroll_Reference = useRef<HTMLDivElement>(null);
  const { Tafsir_Provider, Tafsir_Text_Size } = Use_App();
  Use_Back_Handler(Open, () => On_Open_Change(false));
  
  const [Current_Ayah, Set_Current_Ayah] = useState(Ayah_ID);
  const [Tafsir_Text, Set_Tafsir_Text] = useState<string | null>(null);
  const [Is_Loading_Tafsir, Set_Is_Loading_Tafsir] = useState(false);
  const [Tafsir_Error, Set_Tafsir_Error] = useState<string | null>(null);

  useEffect(() => {
    if (Open) {
      Set_Current_Ayah(Ayah_ID);
    }
  }, [Open, Ayah_ID, Surah_ID]);

  useEffect(() => {
    if (Open && Tafsir_Provider) {
      Set_Is_Loading_Tafsir(true);
      Set_Tafsir_Error(null);
      
      Fetch_Custom_Tafsir(Tafsir_Provider, Surah_ID, Current_Ayah)
        .then((text) => {
          Set_Tafsir_Text(text);
          Set_Is_Loading_Tafsir(false);
        })
        .catch((Error_Context) => {
          console.error("error Loading tafsir:", Error_Context);
          Set_Tafsir_Error("Failed to load Tafsir");
          Set_Is_Loading_Tafsir(false);
        });
    }
  }, [Open, Tafsir_Provider, Surah_ID, Current_Ayah]);

  const Go_To_Previous_Ayah = () => {
    if (Current_Ayah > 1) {
      Set_Current_Ayah((Previous) => Previous - 1);
      Scroll_Reference.current?.scrollTo({ Top: 0, behavior: "smooth" });
    }
  };

  const Go_To_Next_Ayah = () => {
    if (!Total_Ayaat || Current_Ayah < Total_Ayaat) {
      Set_Current_Ayah((Previous) => Previous + 1);
      Scroll_Reference.current?.scrollTo({ Top: 0, behavior: "smooth" });
    }
  };

  const Handle_Backdrop_Click = (Event_Parameter: React.MouseEvent) => {
    if (Event_Parameter.target === Event_Parameter.currentTarget) {
      On_Open_Change(false);
    }
  };

  const Get_Text_Size_Class = () => {
    switch (Tafsir_Text_Size) {
      case 2: return "text-xs";
      case 3: return "text-sm";
      case 4: return "text-base";
      case 5: return "text-lg";
      default: return "text-sm";
    }
  };

  if (!Open) return null;

  const Render_Content = () => (
    <div className="space-y-6">
      <Container className="!py-3 !px-6">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={Go_To_Previous_Ayah}
            disabled={Current_Ayah <= 1}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            Ayah {Current_Ayah} {Total_Ayaat ? `/ ${Total_Ayaat}` : ""}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={Go_To_Next_Ayah}
            disabled={Total_Ayaat ? Current_Ayah >= Total_Ayaat : false}
            className="gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </Container>

      <Container className="!py-5 !px-6">
        {Tafsir_Error ? (
          <div className="text-center py-8 text-destructive flex flex-col items-center gap-2">
            <AlertCircle className="h-8 w-8" />
            <p>{Tafsir_Error}</p>
          </div>
        ) : Tafsir_Text ? (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Commentary by {Tafsir_Provider}
            </h3>
            <div
              className={`prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap ${Get_Text_Size_Class()}`}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(Tafsir_Text) }}
            />
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No Tafsir available for this Ayah from {Tafsir_Provider}.</p>
          </div>
        )}
      </Container>
    </div>
  );

  if (Is_Mobile) {
    return (
      <div 
        className="fixed inset-0 z-40 bg-background"
        onClick={Handle_Backdrop_Click}
      >
        <div
          ref={Scroll_Reference}
          className="h-full overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="p-4 pt-[72px]">
            {Render_Content()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-40 bg-background"
      onClick={Handle_Backdrop_Click}
    >
      <Scroll_Area className="h-full" ref={Scroll_Reference}>
        <div className="p-6 pt-[72px] mx-auto max-w-2xl">
          {Render_Content()}
        </div>
      </Scroll_Area>
    </div>
  );
});