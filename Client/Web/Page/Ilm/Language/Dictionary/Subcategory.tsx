import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@Web/Component/UI/Button";
import { Use_Custom_Collections } from "@/Hook/Use-Custom-Collections";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { Supported_Language, Vocabulary_Record } from "@/Library/Language-Types";
import { Get_Vocabulary_List } from "@/Library/Language-API";

export default function Dictionary_Subcategory() {
  const { Lang_Name, Category_ID } = useParams<{ Lang_Name: string; Category_ID: string }>();
  const navigate = useNavigate();
  const [Search_Params] = useSearchParams();
  const { t } = Use_Course_Language();

  // Read search term directly from URL search params synced with Header_Search
  const Search_Query = Search_Params.get("search") || "";
  
  const Active_Lang_Name = (Lang_Name || "English") as Supported_Language;
  const { collections: Custom_Categories } = Use_Custom_Collections(`__lang_${Active_Lang_Name}`);
  const Custom_Category = Custom_Categories.find(c => c.id === Category_ID);

  const [Vocabulary_Items, Set_Vocabulary_Items] = useState<Vocabulary_Record[]>([]);
  const [Loading, Set_Loading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    Set_Loading(true);

    Get_Vocabulary_List(Active_Lang_Name, Category_ID)
      .then((records) => {
        if (!isMounted) return;
        Set_Vocabulary_Items(records);
        Set_Loading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch subcategory vocabulary:", err);
        if (isMounted) {
          Set_Vocabulary_Items([]);
          Set_Loading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [Active_Lang_Name, Category_ID]);

  if (Loading) {
    return <div className="p-4 text-sm">Loading...</div>;
  }

  // Extract unique subcategories for this category
  const Subcategory_Keys = Array.from(
    new Set(Vocabulary_Items.map((item) => item.subcategory).filter(Boolean))
  );

  if (Subcategory_Keys.length === 0 && !Custom_Category) {
    return <div className="px-4 text-sm">{t("notFound")}</div>;
  }

  const Query_Lower = Search_Query.toLowerCase().trim();

  // Filter subcategories where the subcategory name OR any contained item matches search input
  const Filtered_Subcategories = Subcategory_Keys.filter((subId) => {
    if (!Query_Lower) return true;
    
    // Check if subcategory name matches
    const Name_Matches = subId.toLowerCase().includes(Query_Lower);
    
    // Check if any contained item title or slug matches
    const Sub_Items = Vocabulary_Items.filter((item) => item.subcategory === subId);
    const Word_Matches = Sub_Items.some(
      (item) =>
        item.slug.toLowerCase().includes(Query_Lower) ||
        item.title.toLowerCase().includes(Query_Lower)
    );

    return Name_Matches || Word_Matches;
  });

  const Handle_Subcategory_Click = (subId: string) => {
    navigate(`/Language/${Lang_Name}/Dictionary/Vocabulary/${Category_ID}/${subId}`);
  };

  return (
    <div className="px-4 w-full">
      {Filtered_Subcategories.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          No items match your search "{Search_Query}"
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {Filtered_Subcategories.map((subId) => {
            const Sub_Items = Vocabulary_Items.filter((item) => item.subcategory === subId);
            
            // Count matching items if searching, or return total count
            const Matching_Count = Query_Lower
              ? Sub_Items.filter(
                  (item) =>
                    item.slug.toLowerCase().includes(Query_Lower) ||
                    item.title.toLowerCase().includes(Query_Lower)
                ).length
              : Sub_Items.length;

            return (
              <Button
                key={subId}
                onClick={() => Handle_Subcategory_Click(subId)}
                className="min-h-[64px] py-3 text-base"
              >
                <div className="flex items-center gap-2 font-semibold">
                  <span>{subId}</span>
                  <span className="text-xs font-normal border border-border bg-background text-foreground group-hover:border-foreground px-2 py-0.5 rounded-full transition-colors">
                    {Matching_Count > 0 ? Matching_Count : Sub_Items.length}
                  </span>
                </div>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}