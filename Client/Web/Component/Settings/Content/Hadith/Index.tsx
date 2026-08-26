import { Arabic_Section } from "./Tab/Arabic";
import { Transliteration_Section } from "./Tab/Transliteration";
import { Translation_Section } from "./Tab/Translation";
import { WBW_Section } from "./Tab/WBW";
import type { Hadith_Subcategory } from "./Types";

interface Hadith_Section_Properties {
  Active_Subcategory: Hadith_Subcategory;
}

export function Hadith_Section({ Active_Subcategory }: Hadith_Section_Properties) {
  const Render_Active_Content = () => {
    switch (Active_Subcategory) {
      case "Arabic":
        return <Arabic_Section />;
      case "Translation":
        return <Translation_Section />;
      case "Transliteration":
        return <Transliteration_Section />;
      case "wbw":
        return <WBW_Section />;
      default:
        return null;
    }
  };

  return <div className="space-y-4">{Render_Active_Content()}</div>;
}