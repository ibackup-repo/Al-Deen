import { Card } from "@Web/Component/UI/Card";
import { Slider } from "@Web/Component/UI/Slider";
import { Use_App } from "@Web/Context/App";

interface Font_Size_Slider_Properties {
  value: number;
  On_Change: (size: number) => void;
  label: string;
}

function Font_Size_Slider({ value, On_Change, label }: Font_Size_Slider_Properties) {
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
}

export function Arabic_Section() {
  const {
    Hadith_Arabic_Font_Size,
    Set_Hadith_Arabic_Font_Size,
  } = Use_App();

  return (
    <div className="space-y-1.5">
      <div className="relative rounded-[40px] bg-white dark:bg-black border-2 border-black dark:border-white transition-all Duration-200 py-1 px-3 inline-flex">
        <p className="text-xs font-medium text-foreground">Arabic Settings</p>
      </div>

      <Font_Size_Slider
        value={Hadith_Arabic_Font_Size}
        On_Change={Set_Hadith_Arabic_Font_Size}
        label="Arabic Size"
      />
    </div>
  );
}