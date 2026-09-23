// Component/Settings/Content/Quran/Section/Tafsir.tsx
import { BookOpen, Type } from "lucide-react";
import { Card } from "@Web/Component/UI/Card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@Web/Component/UI/Select";
import { Use_App } from "@Web/Context/App";

const Tafsir_Providers = [
  { value: "Ibn-Kathir", label: "Ibn Kathir" },
  { value: "Maurif-Quran", label: "Mau'if Al-Qu'ran"}
  // Add more tafsir providers as you add them
];

const Text_Sizes = [
  { value: 2, label: "Small" },
  { value: 3, label: "Normal" },
  { value: 4, label: "Large" },
  { value: 5, label: "Extra Large" },
];

export function Tafsir() {
  const {
    Tafsir_Text_Size,
    Set_Tafsir_Text_Size,
    Tafsir_Provider,
    Set_Tafsir_Provider,
  } = Use_App();

  return (
    <div className="space-y-3">
      <div className="relative rounded-[40px] bg-white dark:bg-black border-2 border-black dark:border-white transition-all Duration-200 py-1 px-3 inline-flex">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm text-foreground">Tafsir</h3>
        </div>
      </div>

      {/* Provider Selection */}
      <div className="space-y-1.5">
        <div className="relative rounded-[40px] bg-white dark:bg-black border-2 border-black dark:border-white transition-all Duration-200 py-1 px-3 inline-flex">
          <p className="text-xs font-medium text-foreground">Tafsir Provider</p>
        </div>
        <Card className="py-2.5 px-4 transition-all group">
          <Select 
            value={Tafsir_Provider} 
            onValueChange={Set_Tafsir_Provider}
          >
            <SelectTrigger className="bg-transparent border-0 p-0 h-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Tafsir_Providers.map((provider) => (
                <SelectItem key={provider.value} value={provider.value}>
                  {provider.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>
      </div>

      {/* text Size */}
      <div className="space-y-1.5">
        <div className="relative rounded-[40px] bg-white dark:bg-black border-2 border-black dark:border-white transition-all Duration-200 py-1 px-3 inline-flex">
          <div className="flex items-center gap-2">
            <Type className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs font-medium text-foreground">text Size</p>
          </div>
        </div>
        <div className="flex gap-2">
          {Text_Sizes.map((size) => (
            <Card
              key={size.value}
              onClick={() => Set_Tafsir_Text_Size(size.value)}
              className={`
                flex-1 py-2.5 px-4 text-center cursor-pointer transition-all group
                ${Tafsir_Text_Size === size.value ? "bg-black dark:bg-white text-white dark:text-black" : ""}
              `}
            >
              <span className={`text-sm font-medium ${Tafsir_Text_Size === size.value ? "text-white dark:text-black" : "text-foreground [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black"}`}>
                {size.label}
              </span>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}