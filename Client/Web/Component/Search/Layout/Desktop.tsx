import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { Class_Names } from "@/Library/Utility";
import { Search_Input } from ".././Input";
import { Search_Results } from ".././Results";
import type { Search_Category, Search_Result } from "../Types";

export function Desktop({
  Open,
  On_Close,
  query,
  Set_Query,
  Category,
  Set_Category,
  Results,
  Selected_Index,
  On_Search,
  On_Result_Click,
  On_See_All,
  Input_Reference,
}: Desktop_Properties) {
  const [Is_Dropdown_Open, Set_Is_Dropdown_Open] = useState(false);
  const [Content_Height, Set_Content_Height] = useState<number>(0);
  const Content_Reference = useRef<HTMLDivElement>(null);
  const [Is_Results_Visible, Set_Is_Results_Visible] = useState(false);

  // Show Results when query is non‑empty
  useEffect(() => {
    Set_Is_Results_Visible(query.length > 0);
  }, [query]);

  // Measure the content height for smooth transitions
  useLayoutEffect(() => {
    if (!Content_Reference.current) return;
    if (!Is_Results_Visible) {
      Set_Content_Height(64); // minimal height (only input row)
      return;
    }
    const height = Content_Reference.current.scrollHeight;
    Set_Content_Height(Math.max(height, 64));
  }, [query, Results, Is_Dropdown_Open, Is_Results_Visible]);

  // Reset when modal closes
  useLayoutEffect(() => {
    if (!Open) {
      Set_Content_Height(0);
      Set_Is_Results_Visible(false);
    }
  }, [Open]);

  if (!Open) return null;

  const Handle_Backdrop_Click = () => On_Close();
  const Handle_Modal_Click = (e: React.MouseEvent) => e.stopPropagation();
  const Should_Flatten_Bottom_Right = Is_Dropdown_Open && query.length === 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity Duration-300"
        onClick={Handle_Backdrop_Click}
        aria-hidden="true"
      />
      {/* Modal – fixed Top position, only expands downward */}
      <div
        className="fixed left-[50%] z-50 w-[calc(100%-2rem)] max-w-lg sm:max-w-[520px] transition-all Duration-300 ease-out"
        style={{
          Top: '15vh',          // adjust this value as needed
          transform: 'translateX(-50%)',
        }}
        role="dialog"
        aria-label="Search"
        onClick={Handle_Modal_Click}
      >
        <div
          ref={Content_Reference}
          className={Class_Names(
            "overflow-hidden transition-all Duration-300 ease-out",
            "bg-white dark:bg-black border-2 border-black dark:border-white shadow-2xl",
            query.length > 0 ? "rounded-2xl" : "rounded-full",
            Should_Flatten_Bottom_Right && "rounded-br-none"
          )}
          style={{
            height: Content_Height > 0 ? Content_Height : 'auto',
            transition: 'height 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1), border-radius 0.2s ease-out',
          }}
        >
          <Search_Input
            query={query}
            Set_Query={Set_Query}
            Category={Category}
            Set_Category={Set_Category}
            On_Search={On_Search}
            Input_Reference={Input_Reference}
            onDropdownOpenChange={Set_Is_Dropdown_Open}
          />
          {Is_Results_Visible && (
            <div className="pt-2 transition-all Duration-300 ease-out">
              <Search_Results
                query={query}
                Category={Category}
                Results={Results}
                Selected_Index={Selected_Index}
                On_Result_Click={On_Result_Click}
                On_See_All={On_See_All}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}