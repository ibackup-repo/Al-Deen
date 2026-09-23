import { useState } from "react";
import { Layout } from "@Web/Component/Layout/Index";
import { Filter } from "@Web/Component/Quran/Filter";
import { Surah_Grid } from "@Web/Component/Quran/Surah-Grid";
import { Filter as FilterIcon, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@Web/Component/UI/Card";
import { Button } from "@Web/Component/UI/Button";
import { Continue_Reading } from "@Web/Component/Quran/Continue-Reading";
import { Goal_Card } from "@Web/Component/Quran/Goal/Card";
import type { Surah_Metadata } from "@/Library/Quran-Types";

type Surah_Sort_Order = "ascending" | "descending" | "revelation";

const Quran = () => {
  const [showFilter, setShowFilter] = useState(false);
  const [Filter_Type, Set_Filter_Type] = useState<"Surah" | "juz" | "hizb" | "page" | null>(null);
  const [Selected_Surah, Set_Selected_Surah] = useState<number | null>(null);
  const [Selected_Ayah, Set_Selected_Ayah] = useState<number | null>(null);
  const [Surah_Sort_Order_State, Set_Surah_Sort_Order] = useState<Surah_Sort_Order>("ascending");

  const [Surah_List, Set_Surah_List] = useState<Surah_Metadata[]>([]);
  const [Total_Ayaat_Count, setTotalVersesCount] = useState<number>(6236);

  const navigate = useNavigate();

  const handleListLoaded = (list: Surah_Metadata[]) => {
    Set_Surah_List(list);
    const totalSum = list.reduce(
      (acc: number, s: Surah_Metadata) => acc + (s.Ayah_Count ?? 0),
      0
    );
    if (totalSum > 0) setTotalVersesCount(totalSum);
  };

  const handleApplyFilter = () => {
    setShowFilter(false);
    if (Selected_Surah) {
      if (Selected_Ayah) {
        navigate(`/Quran/Surah/${Selected_Surah}?Ayah=${Selected_Ayah}`);
      } else {
        navigate(`/Quran/Surah/${Selected_Surah}`);
      }
    }
  };

  const Handle_Reset = () => {
    Set_Filter_Type(null);
    Set_Selected_Surah(null);
    Set_Selected_Ayah(null);
    Set_Surah_Sort_Order("ascending");
  };

  const getFilterLabel = () => {
    if (Filter_Type === "juz") return "Juz";
    if (Filter_Type === "hizb") return "Hizb";
    if (Filter_Type === "page") return "Page";
    if (Selected_Surah) return `Surah ${Selected_Surah}`;
    return "Filter";
  };

  return (
    <Layout>
      <div className="flex flex-wrap gap-3 mb-6">
        <Continue_Reading Surah_List={Surah_List} />
        <Goal_Card Surah_List={Surah_List} Total_Ayaat_Count={Total_Ayaat_Count} />
      </div>

      <div className="flex justify-end mb-6 relative">
        <Button
          onClick={() => setShowFilter(!showFilter)}
          className={`flex items-center gap-2 ${Filter_Type || Selected_Surah ? "Active" : ""}`}
        >
          <FilterIcon className="h-4 w-4" />
          {getFilterLabel()}
          <ChevronDown
            className={`h-3 w-3 transition-transform ${showFilter ? "rotate-180" : ""}`}
          />
        </Button>
        <Filter
          Is_Open={showFilter}
          On_Close={() => setShowFilter(false)}
          Filter_Type={Filter_Type}
          Set_Filter_Type={Set_Filter_Type}
          Selected_Surah={Selected_Surah}
          Set_Selected_Surah={Set_Selected_Surah}
          Selected_Ayah={Selected_Ayah}
          Set_Selected_Ayah={Set_Selected_Ayah}
          Surah_Sort_Order_State={Surah_Sort_Order_State}
          Set_Surah_Sort_Order={Set_Surah_Sort_Order}
          On_Apply={handleApplyFilter}
          On_Reset={Handle_Reset}
        />
      </div>

      {Filter_Type === "juz" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((juzNum) => (
            <Link key={juzNum} to={`/Quran/Juz/${juzNum}`} className="w-full block">
              <Card className="p-4 text-center transition-all group">
                <p className="font-semibold text-lg">{juzNum}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {Filter_Type === "hizb" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 60 }, (_, i) => i + 1).map((hizbNum) => (
            <Link key={hizbNum} to={`/Quran/Hizb/${hizbNum}`} className="w-full block">
              <Card className="p-4 text-center transition-all group">
                <p className="font-semibold text-lg">{hizbNum}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {Filter_Type === "page" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 604 }, (_, i) => i + 1).map((Page_Number) => (
            <Link key={Page_Number} to={`/Quran/Page/${Page_Number}`} className="w-full block">
              <Card className="p-4 text-center transition-all group">
                <p className="font-semibold text-lg">{Page_Number}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!Filter_Type && (
        <Surah_Grid
          Filter_Type={Filter_Type}
          Surah_Sort_Order_State={Surah_Sort_Order_State}
          On_Select_Surah={(id) => Set_Selected_Surah(id)}
          On_List_Loaded={handleListLoaded}
        />
      )}
    </Layout>
  );
};

export default Quran;