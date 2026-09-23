import { useState, useRef } from "react";
import { Search, X, ChevronDown, Check } from "lucide-react";
import { Class_Names } from "@/Library/Utility";
import { Button } from "@Web/Component/UI/Button";
import { Container } from "@Web/Component/UI/Container";
import {
  Dropdown_Menu,
  Dropdown_Menu_Content,
  Dropdown_Menu_Item,
  Dropdown_Menu_Trigger,
  DropdownMenuPortal,
} from "@Web/Component/UI/Dropdown-Menu";
import { Categories } from "./Utility";
import { Search_Results } from "./Results";
import type { Search_Category, Search_Result } from "./Types";

export interface Search_Input_Properties {
  query: string;
  Set_Query: (query: string) => void;
  Category: Search_Category;
  Set_Category: (Category: Search_Category) => void;
  On_Search: () => void;
  Input_Reference: React.RefObject<HTMLInputElement>;
  onKeyDown: (e: React.KeyboardEvent) => void;
  Results: Search_Result[];
  Selected_Index: number;
  On_Result_Click: (path: string) => void;
  On_See_All: () => void;
  Dropdown_Menu_Ref?: React.RefObject<HTMLDivElement>;
  Is_Mobile?: boolean;
}

export function Search_Input({
  query,
  Set_Query,
  Category,
  Set_Category,
  On_Search,
  Input_Reference,
  onKeyDown,
  Results,
  Selected_Index,
  On_Result_Click,
  On_See_All,
  Dropdown_Menu_Ref,
  Is_Mobile = false,
}: Search_Input_Properties) {
  const [Dropdown_Open, Set_Dropdown_Open] = useState(false);
  const Container_Reference = useRef<HTMLDivElement>(null);
  const Current_Category = Categories.find(c => c.id === Category)!;

  const Handle_Clear = () => {
    Set_Query("");
    Input_Reference?.current?.focus();
  };

  const Show_Results = !Is_Mobile && query.length > 0 && Results.length > 0;

  return (
    <div
      className={Class_Names(
        "bg-white dark:bg-black border-2 border-black dark:border-white w-full max-w-none shadow-sm overflow-hidden transition-all Duration-200",
        Show_Results ? "rounded-xl" : "rounded-[40px]"
      )}
    >
      <Container className="!bg-transparent !border-0 !rounded-none px-2 sm:px-3 h-8 sm:h-9 flex items-center w-full">
        <div className="flex items-center w-full gap-2 min-w-0" onKeyDown={onKeyDown}>
          <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <input
            ref={Input_Reference}
            type="text"
            value={query}
            On_Change={(e) => Set_Query(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") On_Search();
              onKeyDown(e);
            }}
            placeholder={Current_Category.placeholder}
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-[13px] sm:text-sm placeholder:text-muted-foreground text-foreground"
            aria-label="Search"
          />

          {/* Fixed-width slot to prevent Container from shrinking */}
          <div className="flex-shrink-0 w-20 sm:w-24 flex justify-end items-center h-full">
            {!query ? (
              <Dropdown_Menu Open={Dropdown_Open} On_Open_Change={Set_Dropdown_Open}>
                <Dropdown_Menu_Trigger asChild>
                  <Button
                    size="sm"
                    className="flex items-center gap-1 px-1.5 h-6 rounded-full text-[10px] font-medium transition-colors"
                  >
                    {Current_Category.label}
                    <ChevronDown className={Class_Names("h-3 w-3 transition-transform", Dropdown_Open && "rotate-180")} />
                  </Button>
                </Dropdown_Menu_Trigger>
                <DropdownMenuPortal Container={Container_Reference.current}>
                  <Dropdown_Menu_Content
                    ref={Dropdown_Menu_Ref}
                    align="end"
                    sideOffset={4}
                    className="min-w-[130px] bg-white dark:bg-black border-2 border-black dark:border-white rounded-md shadow-lg z-50"
                  >
                    {Categories.map((cat) => (
                      <Dropdown_Menu_Item
                        key={cat.id}
                        onClick={() => {
                          Set_Category(cat.id);
                          Set_Dropdown_Open(false);
                          Input_Reference?.current?.focus();
                        }}
                        className="cursor-pointer flex items-center gap-2 px-2 py-1 text-[11px]"
                      >
                        <cat.icon className="h-3 w-3" />
                        <span className="flex-1">{cat.label}</span>
                        {Category === cat.id && <Check className="h-3 w-3" />}
                      </Dropdown_Menu_Item>
                    ))}
                  </Dropdown_Menu_Content>
                </DropdownMenuPortal>
              </Dropdown_Menu>
            ) : (
              <Button
                size="sm"
                className="w-6 h-6 p-0 rounded-full flex-shrink-0"
                onClick={Handle_Clear}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </Container>

      {Show_Results && (
        <>
          <div className="h-px bg-border/50 w-full" />
          <Search_Results
            query={query}
            Category={Category}
            Results={Results}
            Selected_Index={Selected_Index}
            On_Result_Click={On_Result_Click}
            On_See_All={On_See_All}
            Hide_Top_Border
          />
        </>
      )}
    </div>
  );
}