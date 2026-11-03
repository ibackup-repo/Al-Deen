// @Web/Component/Word/Buttons/AddWord.tsx
import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { Use_Custom_Words, type Word_Detail } from "@/Hook/Use-Custom-Words";
import { Navigator_Layout } from "@Web/Component/Layout/Utility";
import { Button } from "@Web/Component/UI/Button"; 
import { Container } from "@Web/Component/UI/container";
import { Input } from "@Web/Component/UI/Input";
import { Textarea } from "@Web/Component/UI/textarea";

function Make_ID(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `w-${Date.now()}`;
}

export function AddWord() {
  const { Category_ID, Subcategory_ID } = useParams<{ Category_ID: string; Subcategory_ID: string }>();
  const { t } = Use_Course_Language();
  
  const { Add_Custom_Word } = Use_Custom_Words(
    Category_ID || "", 
    Subcategory_ID || ""
  );

  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [Search_Query, Set_Search_Query] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Embedded Form State ---
  const [Nl_Word, Set_Nl_Word] = useState("");
  const [Nl_Def, Set_Nl_Def] = useState("");
  const [En_Word, Set_En_Word] = useState("");
  const [En_Def, Set_En_Def] = useState("");
  const [Pron, Set_Pron] = useState("");
  const [example, Set_Example] = useState("");

  // Clear the inline form whenever the dropdown opens/closes
  useEffect(() => {
    if (!isOpen) {
      Set_Nl_Word("");
      Set_Nl_Def("");
      Set_En_Word("");
      Set_En_Def("");
      Set_Pron("");
      Set_Example("");
    }
  }, [isOpen]);

  const Handle_Save = () => {
    if (!Nl_Word && !En_Word) return;

    const Generated_Id = `c-${Make_ID(En_Word || Nl_Word)}-${Date.now().toString(36)}`;
    const New_Word: Word_Detail = {
      id: Generated_Id,
      nl: {
        word: Nl_Word || En_Word,
        Definitie: Nl_Def || undefined,
        Voorbeeld: example || undefined,
        Pronunciation: Pron || undefined,
      },
      en: {
        word: En_Word || Nl_Word,
        Definition: En_Def || undefined,
        example: example || undefined,
        Pronunciation: Pron || undefined,
      },
    };

    Add_Custom_Word(New_Word);
    setIsOpen(false); // Close dropdown on successful save
  };

  const Render_Header = () => {
    const Container_Classes = "flex items-center justify-center h-7 w-9 rounded-full bg-muted border border-border/40 text-muted-foreground/80 !py-0 !px-0";
    return (
      <Container className={Container_Classes}>
        <Plus className="h-4 w-4 stroke-[2.5]" />
      </Container>
    );
  };

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
      height="sm:h-[460px]"
      Closed_Icon={<Plus />} // <-- Clean, declarative customized icon placement
    >
      <div className="flex flex-col gap-4 px-3 py-3 sm:p-4 w-full md:min-w-[360px] relative">
        
        {/* INLINE FORM SECTIONS */}
        <div className="space-y-3">
          <p className="text-xs font-bold tracking-wider text-muted-foreground/80 uppercase px-1">
            {t("addWord") || "Add Word"}
          </p>

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