// @Web/Component/Word/Buttons/EditButton.tsx
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { Use_Custom_Words, type Word_Detail } from "@/Hook/Use-Custom-Words";
import { Navigator_Layout } from "@Web/Component/Layout/Utility";
import { Button } from "@Web/Component/UI/Button"; 
import { Container } from "@Web/Component/UI/container";
import { Input } from "@Web/Component/UI/Input";
import { Textarea } from "@Web/Component/UI/textarea";
import { BACKEND_BASE_URL, DEFAULT_SECTION, Word_Detail_From_API, Supported_Language } from "@/Library/Language";

export function EditButton() {
  const { Lang_Name, Category_ID, Subcategory_ID, Word_ID } = useParams<{
    Lang_Name: string;
    Category_ID: string;
    Subcategory_ID: string;
    Word_ID: string;
  }>();

  const navigate = useNavigate();
  const { t } = Use_Course_Language();
  const Active_Lang_Name = (Lang_Name || "English") as Supported_Language;

  const { Custom_Words, Update_Custom_Word, Remove_Custom_Word, Set_Override } = Use_Custom_Words(
    Category_ID || "", 
    Subcategory_ID || ""
  );

  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [Search_Query, Set_Search_Query] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Core Word Data State ---
  const [word, setWord] = useState<Word_Detail | null>(null);

  // --- Embedded Form State ---
  const [Nl_Word, Set_Nl_Word] = useState("");
  const [Nl_Def, Set_Nl_Def] = useState("");
  const [En_Word, Set_En_Word] = useState("");
  const [En_Def, Set_En_Def] = useState("");
  const [Pron, Set_Pron] = useState("");
  const [example, Set_Example] = useState("");

  const Is_Custom = Custom_Words.some(w => w.id === Word_ID);

  // Fetch target word data to populate the edit form when the dropdown opens
  useEffect(() => {
    if (!isOpen || !Category_ID || !Subcategory_ID || !Word_ID) return;

    // Check if it's a custom word first
    const localWord = Custom_Words.find(w => w.id === Word_ID);
    if (localWord) {
      setWord(localWord);
      populateForm(localWord);
      return;
    }

    // Fallback to fetch from Corpus API
    fetch(`${BACKEND_BASE_URL}/api/language-Corpus?lang=${encodeURIComponent(Active_Lang_Name)}`)
      .then(res => res.ok ? res.json() : null)
      .then(Corpus => {
        const Subcategory_Data = Corpus?.vocabularyGrammar?.[DEFAULT_SECTION]?.[Category_ID]?.[Subcategory_ID] || {};
        const Raw_Word = Subcategory_Data[Word_ID];

        if (Raw_Word) {
          const compiled = Word_Detail_From_API(Word_ID, Raw_Word, Active_Lang_Name);
          setWord(compiled);
          populateForm(compiled);
        }
      })
      .catch((err) => {
        console.error("Failed Loading word details in EditButton dropdown:", err);
      });
  }, [isOpen, Active_Lang_Name, Category_ID, Subcategory_ID, Word_ID, Custom_Words]);

  const populateForm = (w: Word_Detail) => {
    Set_Nl_Word(w.nl?.word || "");
    Set_Nl_Def(w.nl?.Definitie || "");
    Set_En_Word(w.en?.word || "");
    Set_En_Def(w.en?.Definition || "");
    Set_Pron(w.nl?.Pronunciation || w.en?.Pronunciation || "");
    Set_Example(w.nl?.Voorbeeld || w.en?.example || "");
  };

  const Handle_Save = () => {
    if (!word || (!Nl_Word && !En_Word)) return;

    const updatedFields: Partial<Word_Detail> = {
      nl: {
        ...word.nl,
        word: Nl_Word || word.nl?.word || "",
        Definitie: Nl_Def || undefined,
        Voorbeeld: example || undefined,
        Pronunciation: Pron || undefined,
      },
      en: {
        ...word.en,
        word: En_Word || word.en?.word || "",
        Definition: En_Def || undefined,
        example: example || undefined,
        Pronunciation: Pron || undefined,
      }
    };

    if (Is_Custom) {
      Update_Custom_Word(word.id, updatedFields);
    } else {
      Set_Override(word.id, updatedFields);
    }
    setIsOpen(false);
  };

  const Handle_Delete = () => {
    if (!word) return;
    if (Is_Custom) {
      Remove_Custom_Word(word.id);
      setIsOpen(false);
      navigate(-1); // Go back as the word is deleted
    }
  };

  const Render_Header = () => {
    const Container_Classes = "flex items-center justify-center h-7 w-9 rounded-full bg-muted border border-border/40 text-muted-foreground/80 !py-0 !px-0";
    return (
      <Container className={Container_Classes}>
        <Pencil className="h-4 w-4 stroke-[2.5]" />
      </Container>
    );
  };

  if (!Word_ID) return null;

  return (
    <Navigator_Layout
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      isSearching={isSearching}
      setIsSearching={setIsSearching}
      Search_Query={Search_Query}
      Set_Search_Query={Set_Search_Query}
      inputRef={inputRef}
      Button_Label="" 
      Render_Mobile_Header_Left={Render_Header}
      Render_Desktop_Header_Left={Render_Header}
      Show_Go_Back={false}
      Disable_Header_Container={true}
      width="sm:w-[420px]"
      height="sm:h-[480px]"
      Closed_Icon={<Pencil />} // <-- Clean, customized icon config
    >
      <div className="flex flex-col gap-4 px-3 py-3 sm:p-4 w-full md:min-w-[360px] relative">
        
        {/* EDIT FORM SECTIONS */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <p className="text-xs font-bold tracking-wider text-muted-foreground/80 uppercase">
              {t("editWord") || "Edit Word"}
            </p>
            {Is_Custom && (
              <button 
                onClick={Handle_Delete}
                className="text-destructive hover:text-destructive/80 transition-colors"
                title="Delete Word"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider opacity-70 px-1">NL</label>
              <Input 
                value={Nl_Word} 
                onChange={e => Set_Nl_Word(e.target.value)} 
                placeholder="woord" 
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider opacity-70 px-1">EN</label>
              <Input 
                value={En_Word} 
                onChange={e => Set_En_Word(e.target.value)} 
                placeholder="word" 
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider opacity-70 px-1">
              {t("Pronunciation") || "Pronunciation"}
            </label>
            <Input 
              value={Pron} 
              onChange={e => Set_Pron(e.target.value)} 
              placeholder="[woord]" 
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider opacity-70 px-1">
              {t("Definition") || "Definition"} (NL)
            </label>
            <Textarea 
              value={Nl_Def} 
              onChange={e => Set_Nl_Def(e.target.value)} 
              rows={2} 
              className="text-sm min-h-[50px] resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider opacity-70 px-1">
              {t("Definition") || "Definition"} (EN)
            </label>
            <Textarea 
              value={En_Def} 
              onChange={e => Set_En_Def(e.target.value)} 
              rows={2} 
              className="text-sm min-h-[50px] resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider opacity-70 px-1">
              {t("example") || "Example"}
            </label>
            <Textarea 
              value={example} 
              onChange={e => Set_Example(e.target.value)} 
              rows={2} 
              className="text-sm min-h-[50px] resize-none"
            />
          </div>
        </div>

        {/* FORM CONTROLS */}
        <div className="flex gap-2 pt-2 border-t border-border/40">
          <Button 
            type="button"
            variant="ghost" 
            onClick={() => setIsOpen(false)} 
            className="flex-1 h-9 rounded-full text-sm font-medium"
          >
            {t("cancel") || "Cancel"}
          </Button>
          <Button 
            type="button"
            onClick={Handle_Save} 
            active 
            className="flex-1 h-9 rounded-full text-sm font-medium bg-foreground text-background hover:bg-foreground/90"
          >
            {t("save") || "Save"}
          </Button>
        </div>
      </div>
    </Navigator_Layout>
  );
}