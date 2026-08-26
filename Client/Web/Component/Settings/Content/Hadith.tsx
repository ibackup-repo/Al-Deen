// Component/Settings/Content/Hadith.tsx
import { Languages } from "lucide-react";
import { Switch } from "@Web/Component/UI/Switch";
import { Card } from "@Web/Component/UI/Card";
import { Slider } from "@Web/Component/UI/Slider";
import { Use_App } from "@Web/Context/App";

export function Hadith_Section() {
  const {
    // Hadith Settings - General (toggles)
    Show_Hadith_Translation,
    Set_Show_Hadith_Translation,
    Show_Hadith_Transliteration,
    Set_Show_Hadith_Transliteration,
    
    // Hadith Settings - Inline (toggles)
    Show_Hadith_Inline_Translation,
    Set_Show_Hadith_Inline_Translation,
    Show_Hadith_Inline_Transliteration,
    Set_Show_Hadith_Inline_Transliteration,
    
    // Hadith Settings - Hover (toggles)
    Show_Hadith_Hover_Translation,
    Set_Show_Hadith_Hover_Translation,
    Show_Hadith_Hover_Transliteration,
    Set_Show_Hadith_Hover_Transliteration,
    
    // font sizes
    Hadith_Arabic_Font_Size,
    Set_Hadith_Arabic_Font_Size,
    Hadith_Translation_Font_Size,
    Set_Hadith_Translation_Font_Size,
    Hadith_Transliteration_Font_Size,
    Set_Hadith_Transliteration_Font_Size,
    Hadith_Inline_Translation_Font_Size,
    Set_Hadith_Inline_Translation_Font_Size,
    Hadith_Inline_Transliteration_Font_Size,
    Set_Hadith_Inline_Transliteration_Font_Size,
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
      {/* Section Header */}
      <div className="relative rounded-[40px] bg-white dark:bg-black border-2 border-black dark:border-white transition-all Duration-200 py-1 px-3 inline-flex">
        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm text-foreground">Hadith Display</h3>
        </div>
      </div>

      {/* General Section */}
      <div className="space-y-1.5">
        <div className="relative rounded-[40px] bg-white dark:bg-black border-2 border-black dark:border-white transition-all Duration-200 py-1 px-3 inline-flex">
          <p className="text-xs font-medium text-foreground">General</p>
        </div>

        {/* Arabic font Size */}
        {Render_Slider(Hadith_Arabic_Font_Size, Set_Hadith_Arabic_Font_Size, "Arabic Size")}

        {/* Translation Toggle + font Size */}
        <div className="cursor-pointer">
          <Card 
            onClick={() => Set_Show_Hadith_Translation(!Show_Hadith_Translation)}
            className="py-2.5 px-4 flex items-center justify-between transition-all group"
          >
            <span className="font-semibold text-sm [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
              Translation
            </span>
            <Switch
              checked={Show_Hadith_Translation}
              onCheckedChange={Set_Show_Hadith_Translation}
              size="md"
            />
          </Card>
        </div>
        {Show_Hadith_Translation && Render_Slider(Hadith_Translation_Font_Size, Set_Hadith_Translation_Font_Size, "Translation Size")}

        {/* Transliteration Toggle + font Size */}
        <div className="cursor-pointer">
          <Card 
            onClick={() => Set_Show_Hadith_Transliteration(!Show_Hadith_Transliteration)}
            className="py-2.5 px-4 flex items-center justify-between transition-all group"
          >
            <span className="font-semibold text-sm [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
              Transliteration
            </span>
            <Switch
              checked={Show_Hadith_Transliteration}
              onCheckedChange={Set_Show_Hadith_Transliteration}
              size="md"
            />
          </Card>
        </div>
        {Show_Hadith_Transliteration && Render_Slider(Hadith_Transliteration_Font_Size, Set_Hadith_Transliteration_Font_Size, "Transliteration Size")}
      </div>

      {/* Inline Section */}
      <div className="space-y-1.5">
        <div className="relative rounded-[40px] bg-white dark:bg-black border-2 border-black dark:border-white transition-all Duration-200 py-1 px-3 inline-flex">
          <p className="text-xs font-medium text-foreground">Inline</p>
        </div>

        {/* Inline Translation Toggle + font Size */}
        <div className="cursor-pointer">
          <Card 
            onClick={() => Set_Show_Hadith_Inline_Translation(!Show_Hadith_Inline_Translation)}
            className="py-2.5 px-4 flex items-center justify-between transition-all group"
          >
            <span className="font-semibold text-sm [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
              Translation
            </span>
            <Switch
              checked={Show_Hadith_Inline_Translation}
              onCheckedChange={Set_Show_Hadith_Inline_Translation}
              size="md"
            />
          </Card>
        </div>
        {Show_Hadith_Inline_Translation && Render_Slider(Hadith_Inline_Translation_Font_Size, Set_Hadith_Inline_Translation_Font_Size, "Translation Size")}

        {/* Inline Transliteration Toggle + font Size */}
        <div className="cursor-pointer">
          <Card 
            onClick={() => Set_Show_Hadith_Inline_Transliteration(!Show_Hadith_Inline_Transliteration)}
            className="py-2.5 px-4 flex items-center justify-between transition-all group"
          >
            <span className="font-semibold text-sm [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
              Transliteration
            </span>
            <Switch
              checked={Show_Hadith_Inline_Transliteration}
              onCheckedChange={Set_Show_Hadith_Inline_Transliteration}
              size="md"
            />
          </Card>
        </div>
        {Show_Hadith_Inline_Transliteration && Render_Slider(Hadith_Inline_Transliteration_Font_Size, Set_Hadith_Inline_Transliteration_Font_Size, "Transliteration Size")}
      </div>

      {/* Hover Section (no font sizes – tooltip uses default styles) */}
      <div className="space-y-1.5">
        <div className="relative rounded-[40px] bg-white dark:bg-black border-2 border-black dark:border-white transition-all Duration-200 py-1 px-3 inline-flex">
          <p className="text-xs font-medium text-foreground">Hover</p>
        </div>

        {/* Hover Translation Toggle */}
        <div className="cursor-pointer">
          <Card 
            onClick={() => Set_Show_Hadith_Hover_Translation(!Show_Hadith_Hover_Translation)}
            className="py-2.5 px-4 flex items-center justify-between transition-all group"
          >
            <span className="font-semibold text-sm [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
              Translation
            </span>
            <Switch
              checked={Show_Hadith_Hover_Translation}
              onCheckedChange={Set_Show_Hadith_Hover_Translation}
              size="md"
            />
          </Card>
        </div>

        {/* Hover Transliteration Toggle */}
        <div className="cursor-pointer">
          <Card 
            onClick={() => Set_Show_Hadith_Hover_Transliteration(!Show_Hadith_Hover_Transliteration)}
            className="py-2.5 px-4 flex items-center justify-between transition-all group"
          >
            <span className="font-semibold text-sm [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
              Transliteration
            </span>
            <Switch
              checked={Show_Hadith_Hover_Transliteration}
              onCheckedChange={Set_Show_Hadith_Hover_Transliteration}
              size="md"
            />
          </Card>
        </div>
      </div>
    </div>
  );
}