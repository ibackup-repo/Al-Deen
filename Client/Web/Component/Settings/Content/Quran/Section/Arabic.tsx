// Component/Settings/Content/Quran/Section/Arabic.tsx
import { useState } from "react";
import { Type, ChevronDown, Check } from "lucide-react";
import { Switch } from "@Web/Component/UI/Switch";
import { Card } from "@Web/Component/UI/Card";
import { Button } from "@Web/Component/UI/Button";
import { Slider } from "@Web/Component/UI/Slider";
import {
  Dropdown_Menu,
  Dropdown_Menu_Content,
  Dropdown_Menu_Item,
  Dropdown_Menu_Trigger,
} from "@Web/Component/UI/Dropdown-Menu";
import { Use_Is_Mobile } from "@/Hook/Use-Mobile";
import { Mobile_Navigator } from "../Utility";
import { KFGQPC_Variants } from "../Constant";
import { Use_App } from "@Web/Context/App";
import { Mobile_Settings_Store } from "../../../Mobile-Settings-Store";

export function Arabic() {
  const Is_Mobile = Use_Is_Mobile();
  const [Show_Font_List, Set_Show_Font_List] = useState(false);
  
  const {
    Show_Arabic_Text,
    Set_Show_Arabic_Text,
    Quran_Font,
    Set_Quran_Font,
    fontSize,
    Set_Font_Size,
  } = Use_App();
  
  const Current_Font_Label = (() => {
    if (Quran_Font === "IndoPak") return "IndoPak";
    return KFGQPC_Variants.find(o => o.id === Quran_Font)?.label || "Uthmani Hafs";
  })();

  const Font_Options = [
    { id: "Uthmani", label: "QPC Uthmani Hafs" },
    { id: "Uthmani_V1", label: "King Fahad Complex V1" },
    { id: "Uthmani_V2", label: "King Fahad Complex V2" },
    { id: "Uthmani_V4", label: "King Fahad Complex V4" },
    { id: "IndoPak", label: "IndoPak" },
  ];

  const Open_Font_Picker = () => {
    // Push modal onto Stack – saves current state and sets new Top bar
    Mobile_Settings_Store.Push_Modal(
      "Select font",
      true,
      () => Close_Font_Picker(),  // back button closes picker
      () => Close_Font_Picker()   // close button also closes picker
    );
    Set_Show_Font_List(true);
  };

  const Close_Font_Picker = () => {
    Set_Show_Font_List(false);
    // Pop modal – restores previous store state
    Mobile_Settings_Store.Pop_Modal();
  };

  if (Is_Mobile && Show_Font_List) {
    return (
      <Mobile_Navigator
        Is_Open={Show_Font_List}
        On_Close={Close_Font_Picker}
        title="Select font"
        options={Font_Options}
        Selected_ID={Quran_Font}
        onSelect={(id) => {
          Set_Quran_Font(id);
          Close_Font_Picker();
        }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="relative rounded-[40px] bg-white dark:bg-black border-2 border-black dark:border-white transition-all Duration-200 py-1 px-3 inline-flex">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm text-foreground">Arabic text</h3>
        </div>
      </div>

      {/* Show Arabic Toggle */}
      <div className="cursor-pointer">
        <Card 
          onClick={() => Set_Show_Arabic_Text(!Show_Arabic_Text)}
          className="py-2.5 px-4 flex items-center justify-between transition-all group"
        >
          <span className="font-semibold text-sm [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
            Show Arabic
          </span>
          <Switch 
            id="show-Arabic" 
            checked={Show_Arabic_Text} 
            onCheckedChange={Set_Show_Arabic_Text} 
            size="md"
          />
        </Card>
      </div>

      {/* font Selection */}
      {Is_Mobile ? (
        <Button
          onClick={Open_Font_Picker}
          variant="secondary"
          className="w-full flex items-center justify-between px-4 py-2 h-auto group"
          fullWidth
        >
          <span className="text-sm font-medium [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">font</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
              {Current_Font_Label}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black" />
          </div>
        </Button>
      ) : (
        <Dropdown_Menu>
          <Dropdown_Menu_Trigger asChild>
            <Button
              variant="secondary"
              className="w-full flex items-center justify-between px-4 py-2 h-auto group"
              fullWidth
            >
              <span className="text-sm font-medium [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">font</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                  {Current_Font_Label}
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black" />
              </div>
            </Button>
          </Dropdown_Menu_Trigger>
          <Dropdown_Menu_Content align="end" className="w-56">
            {Font_Options.map((opt) => (
              <Dropdown_Menu_Item
                key={opt.id}
                onClick={() => Set_Quran_Font(opt.id)}
                className="flex items-center justify-between cursor-pointer"
              >
                <span>{opt.label}</span>
                {Quran_Font === opt.id && <Check className="h-4 w-4 text-primary" />}
              </Dropdown_Menu_Item>
            ))}
          </Dropdown_Menu_Content>
        </Dropdown_Menu>
      )}

      {/* font Size Slider */}
      <div className="cursor-pointer">
        <Card className="py-2.5 px-4 transition-all group">
          <div className="flex items-center justify-between gap-4">
            <span className="font-semibold text-sm [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black whitespace-nowrap">
              font Size: {fontSize}
            </span>
            <Slider
              value={[fontSize]}
              onValueChange={(value) => Set_Font_Size(value[0])}
              min={1}
              max={10}
              Step={1}
              className="flex-1"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}