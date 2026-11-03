import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { Button } from "@Web/Component/UI/Button";
import { CardButton } from "@Web/Component/UI/card-button";
import { FullPageDialog } from "@Web/Component/UI/full-page-dialog";
import { Use_App } from "@Web/Context/App";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { Use_Custom_Collections } from "@/Hook/Use-Custom-Collections";
import { Supported_Language, International_Language } from "@/Library/Language-Types";
import { Get_Full_Language_Corpus, Get_Vocabulary_List } from "@/Library/Language-API";

// Legacy short-code → International_Language map used by the UI layer
const TO_I18N: Record<string, International_Language> = {
  nl: "Dutch",
  en: "English",
  ar: "Arabic",
};

/**
 * Resolve a localized name from a word-entry name field.
 */
function Localized_Name(name: Record<string, string> | string | undefined, lang: string): string {
  if (!name) return "";
  if (typeof name === "string") return name;
  const i18n = TO_I18N[lang] ?? lang;
  return name[i18n] ?? name[lang] ?? name["English"] ?? Object.values(name)[0] ?? "";
}

/* ─────────────────────────── Language_Root_View ─────────────────────────── */

export function Language_Root_View({ Target_Lang, Target_Lang_Code }: { Target_Lang: Supported_Language; Target_Lang_Code: string }) {
  const { International_Language: Course_I18n_Lang } = Use_Course_Language();
  const { Push_Browse } = Use_App();

  const { data: Corpus } = useQuery({
    queryKey: ["languageCorpusBackend", Course_I18n_Lang],
    queryFn: () => Get_Full_Language_Corpus(Course_I18n_Lang as Supported_Language),
    staleTime: 1000 * 60 * 30,
  });

  // Fallbacks for button labels
  const Lessons_Text    = "Lessons";
  const Dictionary_Text = "Dictionary";

  return (
    <div className="grid grid-cols-2 gap-3 w-full px-4">
      <CardButton
        onClick={() => Push_Browse("lessons")}
        className="min-h-[64px] py-3 flex items-center justify-center text-center"
      >
        <span className="font-semibold">{Lessons_Text}</span>
      </CardButton>

      <CardButton
        onClick={() => Push_Browse("dictionary")}
        className="min-h-[64px] py-3 flex items-center justify-center text-center"
      >
        <span className="font-semibold">{Dictionary_Text}</span>
      </CardButton>
    </div>
  );
}

/* ─────────────────────────── Dictionary_Browse_View ─────────────────────────── */

export function Dictionary_Browse_View({ Target_Lang, Target_Lang_Code }: { Target_Lang: Supported_Language; Target_Lang_Code: string }) {
  const { UI_Language, t } = Use_Course_Language();
  const { Set_Browse_Path } = Use_App();

  const Root_Key = `__lang_${Target_Lang}`;
  const { collections, Add_Collection, Remove_Collection } = Use_Custom_Collections(Root_Key);
  const [Menu_Open, Set_Menu_Open] = useState(false);
  const [Add_Open, Set_Add_Open]   = useState(false);
  const [name, setName]             = useState("");

  const Active_I18n: International_Language = TO_I18N[UI_Language] ?? "English";

  const { data: Vocabulary_Records } = useQuery({
    queryKey: ["languageVocabularyBackend", Target_Lang],
    queryFn: () => Get_Vocabulary_List(Target_Lang),
    staleTime: 1000 * 60 * 30,
  });

  // Extract unique built-in categories and their respective counts
  const categories = useMemo(() => {
    const builtInCategoriesMap = new Map<string, number>();

    (Vocabulary_Records || []).forEach((item) => {
      if (item.category) {
        const count = builtInCategoriesMap.get(item.category) || 0;
        builtInCategoriesMap.set(item.category, count + 1);
      }
    });

    const Built_Ins = Array.from(builtInCategoriesMap.entries()).map(([catId, count]) => ({
      id: catId,
      label: catId,
      count,
      custom: false,
    }));

    const Custom_Categories = collections.map((col) => ({
      id: col.id,
      label: Localized_Name(col.name, UI_Language) || col.id,
      count: col.words?.length ?? 0,
      custom: true,
    }));

    return [...Built_Ins, ...Custom_Categories];
  }, [Vocabulary_Records, collections, UI_Language]);

  return (
    <div className="px-4 w-full space-y-3">
      {/* ── Toolbar ── */}
      <div className="flex justify-end relative">
        <Button onClick={() => Set_Menu_Open((o) => !o)} aria-label="Add">
          <Plus className="h-4 w-4 mr-1" /> {t("add") || "Add"}
        </Button>
        {Menu_Open && (
          <div className="absolute right-0 top-full mt-2 z-20 rounded-[12px] border-2 border-border bg-background shadow-lg overflow-hidden">
            <button
              className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
              onClick={() => { Set_Menu_Open(false); Set_Add_Open(true); }}
            >
              {t("collection") || "Collection"}
            </button>
          </div>
        )}
      </div>

      <section>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat) => (
            <CardButton
              key={cat.id}
              onClick={() => Set_Browse_Path(["language", Target_Lang_Code, "dictionary", "vocabulary", cat.id])}
              className="min-h-[64px] py-3 px-3 flex items-center justify-center text-center relative"
            >
              {cat.custom && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Remove custom Category?")) Remove_Collection(Root_Key, cat.id);
                  }}
                  className="absolute top-2 right-2 opacity-50 hover:opacity-100"
                  aria-label="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <span className="font-semibold">{cat.label}</span>
            </CardButton>
          ))}
        </div>
      </section>

      {/* ── Add collection dialog ── */}
      <FullPageDialog
        open={Add_Open}
        onOpenChange={Set_Add_Open}
        title={t("Add_Collection") || "Add Collection"}
      >
        <div className="space-y-3">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("name") || "Name"}
            className="w-full px-3 py-2 rounded-[10px] border-2 border-border bg-background text-sm"
          />
          <div className="flex gap-2 justify-end">
            <Button onClick={() => { Set_Add_Open(false); setName(""); }}>
              {t("cancel") || "Cancel"}
            </Button>
            <Button active onClick={() => { Add_Collection(Root_Key, name); Set_Add_Open(false); setName(""); }}>
              {t("save") || "Save"}
            </Button>
          </div>
        </div>
      </FullPageDialog>
    </div>
  );
}

/* ─────────────────────────── Language_Dictionary_View ─────────────────────────── */

export function Language_Dictionary_View({ Target_Lang, Target_Lang_Code }: { Target_Lang: Supported_Language; Target_Lang_Code: string }) {
  return <Dictionary_Browse_View Target_Lang={Target_Lang} Target_Lang_Code={Target_Lang_Code} />;
}