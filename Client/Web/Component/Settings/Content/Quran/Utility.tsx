import { useState } from "react";
import { Minus, Plus, Check, ChevronDown, ArrowLeft } from "lucide-react";
import { Button } from "@Web/Component/UI/Button";
import { Container } from "@Web/Component/UI/Container";
import { Tooltip, Tooltip_Content, Tooltip_Trigger, Tooltip_Provider } from "@Web/Component/UI/Tooltip";
import { Class_Names } from "@/Library/Utility";
import {
  Dropdown_Menu, Dropdown_Menu_Content,
  Dropdown_Menu_Item, Dropdown_Menu_Trigger,
} from "@Web/Component/UI/Dropdown-Menu";
import type { Preview_Word_Properties, Selector_Bar_Properties, Size_Control_Properties } from "./Types";

// ============= Helper Functions =============

export const Resolve_Font_Family_Class_Name = (Quran_Font: string) => {
  switch (Quran_Font) {
    case "IndoPak":    return "Font-IndoPak";
    case "Uthmani_V1": return "Font-Uthmani_V1";
    case "Uthmani_V2": return "Font-Uthmani_V2";
    case "Uthmani_V4": return "Font-Uthmani_V4";
    default:           return "Font-Uthmani";
  }
};

export const Get_Preview_Font_Size = (fontSize: number) => `${(1.5 * fontSize) / 5}rem`;

// ============= Mobile Navigator Component =============

interface Mobile_Navigator_Properties {
  Is_Open: boolean;
  On_Close: () => void;
  title: string;
  options: { id: string; label: string }[];
  Selected_ID: string;
  onSelect: (id: string) => void;
  children?: React.ReactNode;
}

export function Mobile_Navigator({
  Is_Open,
  On_Close,
  title,
  options,
  Selected_ID,
  onSelect,
  children,
}: Mobile_Navigator_Properties) {
  if (!Is_Open) return null;

  const Option_List = () => (
    <div className="space-y-1">
      {options.map((option) => (
        <Button
          key={option.id}
          onClick={() => {
            onSelect(option.id);
            On_Close();
          }}
          className="w-full flex items-center justify-between px-4 py-3 h-auto group"
          variant="secondary"
          fullWidth
        >
          <span className="text-sm text-foreground [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
            {option.label}
          </span>
          {Selected_ID === option.id && (
            <Check className="h-4 w-4 text-primary [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black" />
          )}
        </Button>
      ))}
    </div>
  );

  // Only the content – Top bar is managed externally (via store)
  return (
    <div>
      {children || <Option_List />}
    </div>
  );
}

// ============= Reusable Components =============

export function Selector_Bar<T extends string>({
  label, value, options, onSelect,
}: Selector_Bar_Properties<T>) {
  const Current_Label = options.find(o => o.id === value)?.label || options[0].label;
  return (
    <Container className="!py-2.5 !px-3 flex items-center justify-between">
      <span className="font-medium text-sm text-foreground [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">{label}</span>
      <Dropdown_Menu>
        <Dropdown_Menu_Trigger asChild>
          <Button
            size="sm"
            variant="secondary"
            className="gap-1.5 px-2.5 py-1 h-auto text-xs font-medium"
          >
            {Current_Label}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </Dropdown_Menu_Trigger>
        <Dropdown_Menu_Content align="end" className="w-52">
          {options.map((opt) => (
            <Dropdown_Menu_Item
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className="flex items-center justify-between cursor-pointer"
            >
              <span>{opt.label}</span>
              {value === opt.id && <Check className="h-3.5 w-3.5 text-primary" />}
            </Dropdown_Menu_Item>
          ))}
        </Dropdown_Menu_Content>
      </Dropdown_Menu>
    </Container>
  );
}

export function Preview_Word({
  Arabic, Translation,
  Show_Translation, Show_Tooltip, Show_Inline,
  Recitation_Enabled, Font_Class, fontSize,
}: Preview_Word_Properties) {
  const [isHovered, setIsHovered] = useState(false);
  const [Is_Playing, Set_Is_Playing] = useState(false);

  const Handle_Click = () => {
    if (!Recitation_Enabled) return;
    Set_Is_Playing(true);
    setTimeout(() => Set_Is_Playing(false), 600);
  };

  return (
    <div className="flex flex-col items-center group">
      <Tooltip_Provider>
        <Tooltip Open={isHovered && Show_Tooltip && Show_Translation}>
          <Tooltip_Trigger asChild>
            <button
              className={Class_Names(
                "transition-all Duration-200 cursor-pointer relative",
                Font_Class,
                isHovered && !Is_Playing ? "text-primary scale-105" : "",
                Is_Playing ? "text-primary" : "text-foreground [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black"
              )}
              style={{ fontSize }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={Handle_Click}
            >
              <span>{Arabic}</span>
              {Is_Playing && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary Kalimah-playing" />
              )}
            </button>
          </Tooltip_Trigger>
          <Tooltip_Content side="Top" className="max-w-xs bg-white dark:bg-black border-2 border-black dark:border-white rounded-[40px]">
            {Show_Translation && <p className="text-sm font-medium text-center">{Translation}</p>}
          </Tooltip_Content>
        </Tooltip>
      </Tooltip_Provider>
      {Show_Inline && Show_Translation && (
        <p className="text-[10px] text-muted-foreground [.high-contrast_&]:group-hover:text-white/70 [.high-contrast_&]:dark:group-hover:text-black/70 mt-1">{Translation}</p>
      )}
    </div>
  );
}

export function Size_Control({ value, On_Increase, On_Decrease, min = 1, max = 10 }: Size_Control_Properties) {
  return (
    <Container className="!py-2.5 !px-3 flex items-center justify-between">
      <span className="text-sm text-foreground [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">Size</span>
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          className="w-8 h-8 p-0 rounded-full"
          onClick={On_Decrease}
          disabled={value <= min}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="w-8 text-center font-semibold text-sm text-foreground [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">{value}</span>
        <Button
          size="sm"
          className="w-8 h-8 p-0 rounded-full"
          onClick={On_Increase}
          disabled={value >= max}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Container>
  );
}