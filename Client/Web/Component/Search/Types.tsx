// Types.tsx
import { ReactNode } from "react";

export type Search_Category = "Pages" | "Quran" | "Hadith" | "Aid";

export interface Search_Result {
  id: string;
  title: string;
  Subtitle?: string;
  Arabic_Name?: string;
  path: string;
  type: string;
}

export interface Search_Category_Config {
  id: Search_Category;
  label: string;
  placeholder: string;
  icon: React.ElementType;
}

export interface Search_Input_Properties {
  query: string;
  Set_Query: (query: string) => void;
  Category: Search_Category;
  Set_Category: (Category: Search_Category) => void;
  On_Search: () => void;
  On_Close?: () => void;
  Is_Focused?: boolean;
  Input_Reference?: React.RefObject<HTMLInputElement>;
}

export interface Search_Results_Properties {
  query: string;
  Category: Search_Category;
  Results: Search_Result[];
  Selected_Index: number;
  On_Result_Click: (path: string) => void;
  On_See_All: () => void;
}

export interface Navigation_Links_Properties {
  Nav_Links: Array<{ name: string; path: string; icon: React.ElementType }>;
  Support_Links: Array<{ name: string; path: string; icon: React.ElementType }>;
  On_Link_Click: (path: string) => void;
}