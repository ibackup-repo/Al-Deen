import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export interface Accordion_Item_Props {
  Title: string;
  IsOpen: boolean;
  On_Toggle: () => void;
  children: React.ReactNode;
  Size?: "default" | "small";
  Class_Name?: string;
}

export const Accordion_Item: React.FC<Accordion_Item_Props> = ({
  Title,
  IsOpen,
  On_Toggle,
  children,
  Size = "default",
  Class_Name = "",
}) => {
  const isSmall = Size === "small";

  return (
    <div
      className={`border border-border rounded-lg overflow-hidden bg-transparent ${
        isSmall ? "border-border/60" : ""
      } ${Class_Name}`}
    >
      <button
        onClick={On_Toggle}
        className={`w-full flex items-center justify-between font-medium transition-colors hover:bg-accent/30 ${
          isSmall ? "p-2.5 text-xs opacity-90" : "p-3 text-sm"
        }`}
      >
        <span className="capitalize">{Title}</span>
        {IsOpen ? (
          <ChevronDown className={isSmall ? "h-3.5 w-3.5" : "h-4 w-4"} />
        ) : (
          <ChevronRight className={isSmall ? "h-3.5 w-3.5" : "h-4 w-4"} />
        )}
      </button>

      {IsOpen && (
        <div
          className={`border-t border-border bg-transparent ${
            isSmall
              ? "p-3 border-border/40 space-y-3 text-xs"
              : "p-3 space-y-2"
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default Accordion_Item;