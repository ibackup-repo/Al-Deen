import { useState, useEffect, useRef, memo, useMemo } from "react";
import { Textarea } from "@Web/Component/UI/Textarea";
import { Use_Notes } from "@/Hook/Use-Notes";
import { Use_Auth } from "@Web/Context/Auth";
import { useQuery } from "@tanstack/react-query";
import { Save, Trash2, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Use_Is_Mobile } from "@/Hook/Use-Mobile";
import { Use_Translation } from "@/Hook/Use-Translation";
import { Scroll_Area } from "@Web/Component/UI/Scroll-Area";
import { Container } from "@Web/Component/UI/Container";
import { Button } from "@Web/Component/UI/Button";
import { Use_App } from "@Web/Context/App";
import { Use_Audio } from "@Web/Context/Audio";
import { Use_Back_Handler } from "@/Hook/Use-Back-Handler";
import { Word_Tooltip, Use_Audio_Playback } from "../Quran/Layout/Utility";

const Backend_Base_URL = "https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev";

async function Fetch_Quran_Corpus_From_Backend() {
  const Response = await fetch(`${Backend_Base_URL}/api/Quran-Corpus`);
  if (!Response.ok) throw new Error("Failed to load unified Quran Corpus data map");
  return Response.json();
}

export interface Assembled_Ayah {
  Ayah_ID: number;
  Arabic: string;
  Translation?: string;
  Transliteration?: string;
  Kalimaat: string[];
  KBK_Translation?: string[];
  KBK_Translation_Hover?: string[];
  KBK_Translation_Inline?: string[];
}

interface Notes_Dialog_Properties {
  Open: boolean;
  On_Open_Change: (Open: boolean) => void;
  Surah_ID: number;
  Ayah_ID?: number;
  Ayah?: Assembled_Ayah; 
}

export const Notes_Dialog = memo(function Notes_Dialog({ 
  Open, 
  On_Open_Change, 
  Surah_ID, 
  Ayah_ID, 
  Ayah 
}: Notes_Dialog_Properties) {
  const { User_State } = Use_Auth();
  const { Save_Note, Get_Note, Delete_Note, Is_Loading_Corpus_Data } = Use_Notes();
  const Navigate = useNavigate();
  const Is_Mobile = Use_Is_Mobile();
  const { Translation } = Use_Translation();
  const { Hover_Translation, Hover_Recitation, fontSize, Quran_Font } = Use_App();
  const { Active_Ayah, Active_Kalimah, Play_Ayah_Audio } = Use_Audio();
  const { Playing_Key, Play_Kalimah_Audio, Is_Playing } = Use_Audio_Playback(Surah_ID);
  const [Content, Set_Content] = useState("");
  const [Is_Saving, Set_Is_Saving] = useState(false);
  const [Is_Deleting, Set_Is_Deleting] = useState(false);
  const [Hovered_Ayah, Set_Hovered_Ayah] = useState<number | null>(null);
  const Textarea_Reference = useRef<HTMLTextAreaElement>(null);
  const Scroll_Reference = useRef<HTMLDivElement>(null);
  Use_Back_Handler(Open, () => On_Open_Change(false));

  const { data: Corpus } = useQuery({
    queryKey: ["Quran_Corpus_Backend"],
    queryFn: Fetch_Quran_Corpus_From_Backend,
    staleTime: 1000 * 60 * 30,
    enabled: Open && !User_State,
  });

  const Surah_List = useMemo(() => Corpus?.Suwar || [], [Corpus]);

  const Surah = useMemo(() => {
    if (Surah_List.length === 0) return null;
    return Surah_List.find((Item: any) => Item.id === Surah_ID) || null;
  }, [Surah_List, Surah_ID]);

  const Existing_Note = Get_Note(Surah_ID, Ayah_ID);

  const Computed_Font_Class = (() => {
    switch (Quran_Font) {
      case "IndoPak":    return "Font-IndoPak";
      case "Uthmani_V1": return "Font-Uthmani_V1";
      case "Uthmani_V2": return "Font-Uthmani_V2";
      case "Uthmani_V4": return "Font-Uthmani_V4";
      default:           return "Font-Uthmani";
    }
  })();

  const Arabic_Font_Size = `${(1.5 * fontSize) / 5}rem`;

  useEffect(() => {
    if (Open && Existing_Note) {
      Set_Content(Existing_Note.content);
    } else if (Open) {
      Set_Content("");
    }
  }, [Open, Existing_Note]);

  const Handle_Save = async () => {
    if (!Content.trim()) return;
    Set_Is_Saving(true);
    const Success = await Save_Note(Surah_ID, Content, Ayah_ID);
    Set_Is_Saving(false);
    if (Success) On_Open_Change(false);
  };

  const Handle_Delete = async () => {
    if (!Existing_Note) return;
    Set_Is_Deleting(true);
    const Success = await Delete_Note(Existing_Note.id);
    Set_Is_Deleting(false);
    if (Success) {
      Set_Content("");
      On_Open_Change(false);
    }
  };

  if (!Open) return null;

  if (!User_State) {
    setTimeout(() => {
      On_Open_Change(false);
    }, 0);
    import("@/Hook/Use-Toast").then(({ Toast }) =>
      Toast({
        title: "Sign in required",
        description: "Please sign in to save your Notes.",
        variant: "destructive",
      })
    );
    return null;
  }

  const Render_Ayah_With_Tooltips = () => {
    if (!Ayah) return null;
    
    return (
      <div className={Computed_Font_Class} style={{ fontSize: Arabic_Font_Size, lineHeight: 1.8 }} dir="rtl">
        {Ayah.Kalimaat.map((Glyph, Index) => {
          const Is_Ayah_End = Index === Ayah.Kalimaat.length - 1;
          const Belongs_To_Ayah = Ayah.Ayah_ID;
          const Is_Ayah_Highlighted = Hovered_Ayah !== null && Belongs_To_Ayah === Hovered_Ayah;

          const KBK_Translation = (!Is_Ayah_End && Ayah.KBK_Translation?.[Index]) || undefined;
          const Kalimah_Key = `Kalimah-${Ayah.Ayah_ID}-${Index}`;
          const Ayah_Key = `Ayah-${Ayah.Ayah_ID}`;
          const Is_Playing_Audio = Is_Playing(Kalimah_Key) || Is_Playing(Ayah_Key);
          const Is_Active = !Is_Ayah_End && Ayah.Ayah_ID === Active_Ayah && Index === Active_Kalimah;

          let Handle_Click: (() => void) | undefined;
          if (Is_Ayah_End) {
            Handle_Click = () => Play_Ayah_Audio(Surah_ID, Ayah.Ayah_ID);
          } else {
            Handle_Click = () => Play_Kalimah_Audio(Ayah.Ayah_ID, Index);
          }

          const Handle_Mouse_Enter = () => {
            if (Is_Ayah_End) {
              Set_Hovered_Ayah(Ayah.Ayah_ID);
            }
          };

          const Handle_Mouse_Leave = () => {
            if (Is_Ayah_End) {
              Set_Hovered_Ayah(null);
            }
          };

          let className = "inline select-text transition-colors Duration-200 ";
          if (Is_Ayah_Highlighted && !Is_Ayah_End) {
            className += "text-primary";
          } else if (Is_Active) {
            className += "text-foreground animate-pulse";
          } else if (Is_Playing_Audio) {
            className += "text-primary animate-pulse";
          } else if (Is_Ayah_End) {
            className += "text-muted-foreground hover:text-primary cursor-pointer";
          } else {
            className += "text-foreground hover:text-primary";
          }

          let Cursor_Style = "text";
          if (Is_Ayah_End) {
            Cursor_Style = "pointer";
          } else if (Hover_Recitation) {
            Cursor_Style = "pointer";
          }

          return (
            <Word_Tooltip
              key={Index}
              Translation={KBK_Translation}
              enabled={Hover_Translation}
              onClick={Handle_Click}
              onMouseEnter={Handle_Mouse_Enter}
              onMouseLeave={Handle_Mouse_Leave}
            >
              <span
                className={className}
                style={{ cursor: Cursor_Style }}
                onClick={Handle_Click}
              >
                {Glyph}{' '}
              </span>
            </Word_Tooltip>
          );
        })}
      </div>
    );
  };

  const Render_Content = () => (
    <div className="space-y-4">
      {Ayah && (
        <Container className="!py-4 !px-5">
          {Render_Ayah_With_Tooltips()}
        </Container>
      )}

      <div className="space-y-2">
        <Container className="!p-0 overflow-hidden">
          <Textarea
            ref={Textarea_Reference}
            value={Content}
            On_Change={(Event_Parameter) => Set_Content(Event_Parameter.target.value)}
            placeholder="Use this space to save general Notes, or to write a reflection..."
            className="min-h-[200px] resize-none bg-transparent border-0 p-4 focus:outline-none focus:ring-0"
          />
        </Container>
      </div>

      <div className="flex items-center justify-between pt-4">
        {Existing_Note ? (
          <Button 
            variant="secondary" 
            onClick={Handle_Delete} 
            disabled={Is_Deleting}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {Translation.Common.Delete}
          </Button>
        ) : <div />}
        <Button 
          onClick={Handle_Save} 
          disabled={Is_Saving || !Content.trim()}
        >
          <Save className="h-4 w-4 mr-2" />
          {Translation.Common.Save} Privately
        </Button>
      </div>
    </div>
  );

  if (Is_Mobile) {
    return (
      <div className="fixed inset-0 z-40 bg-background pt-12 md:pt-16">
        <div ref={Scroll_Reference} className="h-full overflow-y-auto overscroll-contain">
          <div className="px-2 sm:px-4 pb-6">
            {Render_Content()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 bg-background pt-12 md:pt-16">
      <Scroll_Area className="h-full" ref={Scroll_Reference}>
        <div className="px-2 sm:px-4 pb-6">
          {Render_Content()}
        </div>
      </Scroll_Area>
    </div>
  );
});