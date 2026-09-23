// @/Hook/Use-Search.ts
import { useState, useEffect } from "react";
import { All_Pages, Search_By_Category } from "@Web/Component/Search/Utility";
import type { Search_Category, Search_Result } from "@Web/Component/Search/Types";

export function Use_Search(Initial_Category: Search_Category = "Pages") {
  const [query, Set_Query] = useState("");
  const [Category, Set_Category] = useState<Search_Category>(Initial_Category);
  const [Results, Set_Results] = useState<Search_Result[]>([]);
  const [Selected_Index, Set_Selected_Index] = useState(0);

  const Nav_Links = All_Pages;
  const Support_Links: typeof All_Pages = [];

  useEffect(() => {
    if (query.length === 0) {
      Set_Results([]);
      return;
    }
    const Search_Results = Search_By_Category(query, Category, Nav_Links, Support_Links);
    Set_Results(Search_Results);
    Set_Selected_Index(0);
  }, [query, Category]);

  return {
    query,
    Set_Query,
    Category,
    Set_Category,
    Results,
    Selected_Index,
    Set_Selected_Index,
  };
}