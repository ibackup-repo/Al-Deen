import { Prayer_Times_Tab } from "./Tab/PrayerTimes";
import { Dua_Tab } from "./Tab/Dua";
import type { Aid_Subcategory } from "./Types";

interface Aid_Section_Properties {
  Active_Subcategory: Aid_Subcategory;
}

export function Aid_Section({ Active_Subcategory }: Aid_Section_Properties) {
  const Render_Active_Content = () => {
    switch (Active_Subcategory) {
      case "Dua":
        return <Dua_Tab />;
      case "Prayer-Times":
        return <Prayer_Times_Tab />;
      default:
        return null;
    }
  };

  return <div className="space-y-4">{Render_Active_Content()}</div>;
}