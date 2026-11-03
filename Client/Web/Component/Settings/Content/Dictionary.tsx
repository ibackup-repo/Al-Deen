import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Use_App } from "@Web/Context/App";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { Use_Marked_Words } from "@/Hook/Use-Marked-Words";
import { Button } from "@Web/Component/UI/Button";
import { Container } from "@Web/Component/UI/container";
import { TitleBar } from "@Web/Component/UI/title-bar";

// Fully localized layout map mapping supported target track values
const LANG_LABELS: Record<string, string> = {
  nl: "Nederlands",
  en: "English",
  ar: "العربية",
  ps: "Pashto",
};

/**
 * Lists Marked word slugs grouped by language track. The underlying store
 * holds slug strings only (no cat/sub metadata), so this view shows the
 * slug names and lets the user open the broader dictionary view.
 */
export function DictionarySection() {
  const { map } = Use_Marked_Words();
  const { Set_Browse_Path } = Use_App();
  const { t } = Use_Course_Language();
  const navigate = useNavigate();

  const langs = useMemo(
    () => Object.keys(map).filter(l => (map[l] || []).length > 0),
    [map],
  );

  const [Active_Lang, Set_Active_Language] = useState<string | null>(null);
  const Current_Language = Active_Lang && map[Active_Lang] ? Active_Lang : (langs[0] || null);

  if (langs.length === 0 || !Current_Language) {
    return (
      <Container>
        <p className="text-sm opacity-70">{t("noMarkedWords") || "No Marked words found."}</p>
      </Container>
    );
  }

  const slugs: string[] = map[Current_Language] || [];

  const Handle_Open_Dictionary = () => {
    Set_Browse_Path(["language", Current_Language]);
    navigate("/");
  };

  return (
    <div className="space-y-3">
      {/* Language switch tabs */}
      <div className="flex flex-wrap gap-2">
        {langs.map(l => (
          <Button
            key={l}
            active={l === Current_Language}
            onClick={() => Set_Active_Language(l)}
          >
            {LANG_LABELS[l] || l.toUpperCase()}
          </Button>
        ))}
      </div>

      <TitleBar>{t("Marked") || "Marked Items"}</TitleBar>

      {/* Marked slugs — display only, no per-item navigation since the */}
      {/* current store doesn't keep Category/subcategory metadata. */}
      <div className="space-y-2">
        {slugs.map(slug => (
          <Container key={slug} className="py-2">
            <span className="text-sm font-medium">{slug}</span>
          </Container>
        ))}
      </div>

      <Button onClick={Handle_Open_Dictionary} className="w-full" active>
        {t("openDictionary") || "Open dictionary"}
      </Button>
    </div>
  );
}
