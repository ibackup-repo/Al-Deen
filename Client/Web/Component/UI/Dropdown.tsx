import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Class_Names } from "@/Library/Utility";
import { Button } from "./Button";
import { Card } from "./Card";

interface DropdownProps<T> {
  value: T | null;
  On_Change: (value: T) => void;
  options: { value: T; label: string }[];
  placeholder?: string;
  renderOption?: (option: { value: T; label: string }) => ReactNode;
  className?: string;
}

export function Dropdown<T>({
  value,
  On_Change,
  options,
  placeholder = "Select...",
  renderOption,
  className,
}: DropdownProps<T>) {
  const [Is_Open, setIsOpen] = useState(false);
  const Dropdown_Reference = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const Handle_Click_Outside = (event: MouseEvent) => {
      if (Dropdown_Reference.current && !Dropdown_Reference.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", Handle_Click_Outside);
    return () => document.removeEventListener("mousedown", Handle_Click_Outside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);
  const Display_Text = selectedOption?.label || placeholder;

  return (
    <div ref={Dropdown_Reference} className={Class_Names("relative", className)}>
      <Button
        onClick={() => setIsOpen(!Is_Open)}
        className="w-full justify-between"
        fullWidth
      >
        {Display_Text}
        <ChevronDown className={Class_Names("h-4 w-4 transition-transform", Is_Open && "rotate-180")} />
      </Button>
      
      {Is_Open && (
        <div className="absolute left-0 right-0 Top-full mt-1 max-h-60 overflow-y-auto z-[100]">
          <Card className="p-1" Is_Hoverable={false}>
            {options.map((option) => (
              <button
                key={String(option.value)}
                onClick={() => {
                  On_Change(option.value);
                  setIsOpen(false);
                }}
                className={Class_Names(
                  "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors",
                  "text-black dark:text-white",
                  value === option.value
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "hover:bg-black/10 dark:hover:bg-white/10 hover:text-black dark:hover:text-white"
                )}
              >
                {renderOption ? renderOption(option) : option.label}
              </button>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}