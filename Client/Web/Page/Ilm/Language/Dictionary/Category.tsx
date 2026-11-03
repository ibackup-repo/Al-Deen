import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@Web/Component/UI/Button";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { Supported_Language } from "@/Library/Language-Types";
import { Get_Vocabulary_List } from "@/Library/Language-API";

export default function Dictionary_Category() {
  const { Lang_Name } = useParams<{ Lang_Name: string }>();
  const navigate = useNavigate();
  const { t } = Use_Course_Language();
  
  const Active_Lang_Name = (Lang_Name || "English") as Supported_Language;
  const [categories, setCategories] = useState<string[]>([]);
  const [Loading, Set_Loading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    Set_Loading(true);

    Get_Vocabulary_List(Active_Lang_Name)
      .then((records) => {
        if (!isMounted) return;
        // Extract unique categories from vocabulary rows
        const uniqueCategories = Array.from(
          new Set(records.map((item) => item.category).filter(Boolean))
        );
        setCategories(uniqueCategories);
        Set_Loading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch dictionary categories safely:", err);
        if (isMounted) {
          setCategories([]);
          Set_Loading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [Active_Lang_Name]);

  if (Loading) {
    return <div className="p-4 text-sm">Loading...</div>;
  }

  return (
    <div className="px-4 w-full">
      <div className="grid grid-cols-2 gap-3">
        {categories.map((Category) => (
          <Button
            key={Category}
            onClick={() => navigate(`/Language/${Active_Lang_Name}/Dictionary/Vocabulary/${Category}`)}
            className="min-h-[64px] py-3 text-base"
          >
            <span className="font-semibold">{t(Category) || Category}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}