import { useEffect, useState } from "react";
import { FullPageDialog } from "@Web/Component/UI/full-page-dialog";
import { Button } from "@Web/Component/UI/Button";
import { Input } from "@Web/Component/UI/Input";
import { Textarea } from "@Web/Component/UI/textarea";
import type { Word_Detail } from "@/Hook/Use-Custom-Words";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";

interface Properties {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  word?: Word_Detail;          // undefined → add new
  onSave: (w: Word_Detail) => void;
  onDelete?: () => void;      // only for custom words
}

function Make_ID(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `w-${Date.now()}`;
}

export function Word_Edit_Dialog({ open, onOpenChange, word, onSave, onDelete }: Properties) {
  const { t } = Use_Course_Language();
  const [Nl_Word, Set_Nl_Word] = useState("");
  const [Nl_Def, Set_Nl_Def] = useState("");
  const [En_Word, Set_En_Word] = useState("");
  const [En_Def, Set_En_Def] = useState("");
  const [Pron, Set_Pron] = useState("");
  const [example, Set_Example] = useState("");

  useEffect(() => {
    if (!open) return;
    Set_Nl_Word(word?.nl?.word ?? "");
    Set_Nl_Def(word?.nl?.Definitie ?? "");
    Set_En_Word(word?.en?.word ?? "");
    Set_En_Def(word?.en?.Definition ?? "");
    Set_Pron(word?.nl?.Pronunciation ?? word?.en?.Pronunciation ?? "");
    Set_Example(word?.nl?.Voorbeeld ?? word?.en?.example ?? "");
  }, [open, word?.id]);

  const save = () => {
    if (!Nl_Word && !En_Word) return;
    const id = word?.id ?? `c-${Make_ID(En_Word || Nl_Word)}-${Date.now().toString(36)}`;
    const w: Word_Detail = {
      id,
      nl: {
        ...(word?.nl || { word: "" }),
        word: Nl_Word || En_Word,
        Definitie: Nl_Def || undefined,
        Voorbeeld: example || undefined,
        Pronunciation: Pron || undefined,
      },
      en: {
        ...(word?.en || { word: "" }),
        word: En_Word || Nl_Word,
        Definition: En_Def || undefined,
        example: example || undefined,
        Pronunciation: Pron || undefined,
      },
      ar: word?.ar,
    };
    onSave(w);
    onOpenChange(false);
  };

  return (
    <FullPageDialog
      open={open}
      onOpenChange={onOpenChange}
      title={word ? (t("editWord") || "Edit word") : (t("addWord") || "Add word")}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs opacity-70">NL</label>
            <Input value={Nl_Word} onChange={e => Set_Nl_Word(e.target.value)} placeholder="woord" />
          </div>
          <div className="space-y-1">
            <label className="text-xs opacity-70">EN</label>
            <Input value={En_Word} onChange={e => Set_En_Word(e.target.value)} placeholder="word" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs opacity-70">{t("Pronunciation") || "Pronunciation"}</label>
          <Input value={Pron} onChange={e => Set_Pron(e.target.value)} placeholder="[woord]" />
        </div>
        <div className="space-y-1">
          <label className="text-xs opacity-70">{t("Definition") || "Definition"} (NL)</label>
          <Textarea value={Nl_Def} onChange={e => Set_Nl_Def(e.target.value)} rows={2} />
        </div>
        <div className="space-y-1">
          <label className="text-xs opacity-70">{t("Definition") || "Definition"} (EN)</label>
          <Textarea value={En_Def} onChange={e => Set_En_Def(e.target.value)} rows={2} />
        </div>
        <div className="space-y-1">
          <label className="text-xs opacity-70">{t("example") || "Example"}</label>
          <Textarea value={example} onChange={e => Set_Example(e.target.value)} rows={2} />
        </div>
      </div>
      <div className="flex gap-2 mt-6">
        {onDelete && (
          <Button onClick={() => { onDelete(); onOpenChange(false); }} className="mr-auto">
            {t("delete") || "Delete"}
          </Button>
        )}
        <Button onClick={() => onOpenChange(false)} className="ml-auto">{t("cancel") || "Cancel"}</Button>
        <Button onClick={save} active>{t("save") || "Save"}</Button>
      </div>
    </FullPageDialog>
  );
}
