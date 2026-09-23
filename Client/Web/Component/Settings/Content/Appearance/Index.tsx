import { Button_Appearance } from "./Tab/Button";
import { Theme_Section } from "./Tab/General";
import type { Appearance_Subcategory } from "./Types";

interface Appearance_Section_Properties {
  Active_Subcategory: Appearance_Subcategory;
}

export function Appearance_Section({ Active_Subcategory }: Appearance_Section_Properties) {
  const Render_Active_Content = () => {
    switch (Active_Subcategory) {
      case "General":
        return <Theme_Section />;
      case "Button":
        return <Button_Appearance />;
      default:
        return null;
    }
  };

  return <div className="space-y-4">{Render_Active_Content()}</div>;
}