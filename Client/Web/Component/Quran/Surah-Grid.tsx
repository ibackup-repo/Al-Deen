// @Web/Component/Quran/Surah-Grid
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@Web/Component/UI/Card";
import { Button } from "@Web/Component/UI/Button";

import { Fetch_Suwar } from "@/Library/Quran-API";
import type { Surah_Metadata } from "@/Library/Quran-Types";

interface Surah_Grid_Properties {
  Filter_Type: "Surah" | "juz" | "hizb" | "page" | null;
  Surah_Sort_Order_State: "ascending" | "descending" | "revelation";
  On_Select_Surah?: (Surah_ID: number) => void;
  On_List_Loaded?: (list: Surah_Metadata[]) => void;
}

export const Surah_Grid = ({
  Filter_Type,
  Surah_Sort_Order_State,
  On_Select_Surah,
  On_List_Loaded,
}: Surah_Grid_Properties) => {
  const [Suwar, Set_Suwar] = useState<Surah_Metadata[]>([]);
  const [Loading, Set_Loading] = useState(true);
  const [error, Set_Error] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let Active = true;

    Fetch_Suwar()
      .then((data) => {
        if (!Active) return;
        const list = Array.isArray(data) ? data : [];
        Set_Suwar(list);
        Set_Error(null);
        if (On_List_Loaded) On_List_Loaded(list);
      })
      .catch((err) => {
        if (!Active) return;
        Set_Error(err?.message || "Failed to load Surah list.");
      })
      .finally(() => {
        if (Active) Set_Loading(false);
      });

    return () => {
      Active = false;
    };
  }, []);

  if (Loading) {
    return <div className="text-center py-8 text-sm text-muted-foreground">Loading…</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-sm text-destructive">{error}</div>;
  }

  const Sorted_Suwar = (() => {
    const list = [...Suwar];
    if (Surah_Sort_Order_State === "descending") {
      return list.reverse();
    }
    if (Surah_Sort_Order_State === "revelation") {
      return list.sort((a, b) => (a.Revelation_Order ?? 0) - (b.Revelation_Order ?? 0));
    }
    return list;
  })();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {Sorted_Suwar.map((Surah: Surah_Metadata) => {
        const Surah_ID = Surah.Surah;
        const Title_Name = Surah.Transliteration;
        const Translation_Name = Surah.Translation;
        const Revelation_Location = Surah.Revelation_Place;
        const Ayah_Count = Surah.Ayah_Count;
        const Font_Name = String(Surah_ID).padStart(3, "0");

        return (
          <div
            key={Surah_ID}
            onClick={() => {
              if (Filter_Type === "Surah" && On_Select_Surah) {
                On_Select_Surah(Surah_ID);
              } else {
                navigate(`/Quran/Surah/${Surah_ID}`);
              }
            }}
            className="cursor-pointer"
          >
            <Card className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 transition-all duration-200 group">
              <Button
                size="sm"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full p-0 flex items-center justify-center flex-shrink-0"
              >
                {Font_Name}
              </Button>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base truncate [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                  {Title_Name}
                </h3>
                <p className="text-xs sm:text-sm truncate [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                  {Translation_Name}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-[10px] sm:text-xs text-muted-foreground [.high-contrast_&]:group-hover:text-white/80 [.high-contrast_&]:dark:group-hover:text-black/80">
                    {Revelation_Location === "Meccan" || Revelation_Location === "Makkah"
                      ? "Meccan"
                      : "Medinan"}
                  </span>
                  <p
                    className="font-surah text-base sm:text-lg [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black"
                    dir="rtl"
                  >
                    {Font_Name}
                  </p>
                </div>
                <p className="text-[10px] sm:text-xs [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                  {Ayah_Count} Ayah
                </p>
              </div>
            </Card>
          </div>
        );
      })}
    </div>
  );
};