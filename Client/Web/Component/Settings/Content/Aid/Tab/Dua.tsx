// Component/Settings/Content/Aid/Tab/Dua.tsx
import { Languages } from "lucide-react";
import { Switch } from "@Web/Component/UI/Switch";
import { Card } from "@Web/Component/UI/Card";
import { Slider } from "@Web/Component/UI/Slider";
import { Use_App } from "@Web/Context/App";

export function Dua_Tab() {
  const {
    // Toggles
    Show_Dua_Translation,
    Set_Show_Dua_Translation,
    Show_Dua_Transliteration,
    Set_Show_Dua_Transliteration,
    Show_Dua_Inline_Translation,
    Set_Show_Dua_Inline_Translation,
    Show_Dua_Inline_Transliteration,
    Set_Show_Dua_Inline_Transliteration,
    Show_Dua_Hover_Translation,
    Set_Show_Dua_Hover_Translation,
    Show_Dua_Hover_Transliteration,
    Set_Show_Dua_Hover_Transliteration,
    // font sizes
    Dua_Arabic_Font_Size,
    Set_Dua_Arabic_Font_Size,
    Dua_Translation_Font_Size,
    Set_Dua_Translation_Font_Size,
    Dua_Transliteration_Font_Size,
    Set_Dua_Transliteration_Font_Size,
    Dua_Inline_Translation_Font_Size,
    Set_Dua_Inline_Translation_Font_Size,
    Dua_Inline_Transliteration_Font_Size,
    Set_Dua_Inline_Transliteration_Font_Size,
  } = Use_App();

  const Render_Slider = (value: number, On_Change: (size: number) => void, label: string) => {
    const Safe_Value = typeof value === 'number' && !isNaN(value) && value >= 1 && value <= 10 ? value : 5;
    return (
      <div className="cursor-pointer">
        <Card className="py-2.5 px-4 transition-all group">
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-sm [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black whitespace-nowrap">
              {label}: {Safe_Value}
            </span>
            <Slider
              value={[Safe_Value]}
              onValueChange={(val) => On_Change(val[0])}
              min={1}
              max={10}
              Step={1}
              className="flex-1"
            />
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="relative rounded-[40px] bg-white dark:bg-black border-2 border-black dark:border-white transition-all Duration-200 py-1 px-3 inline-flex">
        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm text-foreground">Dua Display</h3>
        </div>
      </div>

      {/* General Section */}
      <div className="space-y-1.5">
        <div className="relative rounded-[40px] bg-white dark:bg-black border-2 border-black dark:border-white transition-all Duration-200 py-1 px-3 inline-flex">
          <p className="text-xs font-medium text-foreground">General</p>
        </div>
        {Render_Slider(Dua_Arabic_Font_Size, Set_Dua_Arabic_Font_Size, "Arabic Size")}
        <div className="cursor-pointer">
          <Card onClick={() => Set_Show_Dua_Translation(!Show_Dua_Translation)} className="py-2.5 px-4 flex items-center justify-between transition-all group">
            <span className="font-semibold text-sm [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">Translation</span>
            <Switch checked={Show_Dua_Translation} onCheckedChange={Set_Show_Dua_Translation} size="md" />
          </Card>
        </div>
        {Show_Dua_Translation && Render_Slider(Dua_Translation_Font_Size, Set_Dua_Translation_Font_Size, "Translation Size")}
        <div className="cursor-pointer">
          <Card onClick={() => Set_Show_Dua_Transliteration(!Show_Dua_Transliteration)} className="py-2.5 px-4 flex items-center justify-between transition-all group">
            <span className="font-semibold text-sm [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">Transliteration</span>
            <Switch checked={Show_Dua_Transliteration} onCheckedChange={Set_Show_Dua_Transliteration} size="md" />
          </Card>
        </div>
        {Show_Dua_Transliteration && Render_Slider(Dua_Transliteration_Font_Size, Set_Dua_Transliteration_Font_Size, "Transliteration Size")}
      </div>

      {/* Inline Section */}
      <div className="space-y-1.5">
        <div className="relative rounded-[40px] bg-white dark:bg-black border-2 border-black dark:border-white transition-all Duration-200 py-1 px-3 inline-flex">
          <p className="text-xs font-medium text-foreground">Inline</p>
        </div>
        <div className="cursor-pointer">
          <Card onClick={() => Set_Show_Dua_Inline_Translation(!Show_Dua_Inline_Translation)} className="py-2.5 px-4 flex items-center justify-between transition-all group">
            <span className="font-semibold text-sm [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">Translation</span>
            <Switch checked={Show_Dua_Inline_Translation} onCheckedChange={Set_Show_Dua_Inline_Translation} size="md" />
          </Card>
        </div>
        {Show_Dua_Inline_Translation && Render_Slider(Dua_Inline_Translation_Font_Size, Set_Dua_Inline_Translation_Font_Size, "Translation Size")}
        <div className="cursor-pointer">
          <Card onClick={() => Set_Show_Dua_Inline_Transliteration(!Show_Dua_Inline_Transliteration)} className="py-2.5 px-4 flex items-center justify-between transition-all group">
            <span className="font-semibold text-sm [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">Transliteration</span>
            <Switch checked={Show_Dua_Inline_Transliteration} onCheckedChange={Set_Show_Dua_Inline_Transliteration} size="md" />
          </Card>
        </div>
        {Show_Dua_Inline_Transliteration && Render_Slider(Dua_Inline_Transliteration_Font_Size, Set_Dua_Inline_Transliteration_Font_Size, "Transliteration Size")}
      </div>

      {/* Hover Section */}
      <div className="space-y-1.5">
        <div className="relative rounded-[40px] bg-white dark:bg-black border-2 border-black dark:border-white transition-all Duration-200 py-1 px-3 inline-flex">
          <p className="text-xs font-medium text-foreground">Hover</p>
        </div>
        <div className="cursor-pointer">
          <Card onClick={() => Set_Show_Dua_Hover_Translation(!Show_Dua_Hover_Translation)} className="py-2.5 px-4 flex items-center justify-between transition-all group">
            <span className="font-semibold text-sm [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">Translation</span>
            <Switch checked={Show_Dua_Hover_Translation} onCheckedChange={Set_Show_Dua_Hover_Translation} size="md" />
          </Card>
        </div>
        <div className="cursor-pointer">
          <Card onClick={() => Set_Show_Dua_Hover_Transliteration(!Show_Dua_Hover_Transliteration)} className="py-2.5 px-4 flex items-center justify-between transition-all group">
            <span className="font-semibold text-sm [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">Transliteration</span>
            <Switch checked={Show_Dua_Hover_Transliteration} onCheckedChange={Set_Show_Dua_Hover_Transliteration} size="md" />
          </Card>
        </div>
      </div>
    </div>
  );
}