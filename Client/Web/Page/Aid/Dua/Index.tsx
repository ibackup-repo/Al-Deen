import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@Web/Component/Layout/Index";
import { Button } from "@Web/Component/UI/Button";
import { Fetch_Adiyah_Categories } from "@Web/../Source/Library/Aid-API";
import type { Adiyah_Category_Record } from "@Web/../Source/Library/Aid-Types";

function Extract_Slug_From_Category_Name(Category_Name_String: string): string {
  return Category_Name_String
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const Dua = () => {
  // Fix: Destructure `isLoading` directly from useQuery, then alias it
  const { data: Categories_List_Collection, isLoading: Is_Loading_Corpus_Data } = useQuery<
    Adiyah_Category_Record[]
  >({
    queryKey: ["aidDuaCategories"],
    queryFn: Fetch_Adiyah_Categories,
    staleTime: 1000 * 60 * 15,
  });

  if (Is_Loading_Corpus_Data) {
    return (
      <Layout>
        <div className="w-full p-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3 sm:px-0">
            {[...Array(14)].map((_, Index_Position) => (
              <Button
                key={Index_Position}
                disabled
                className="w-full h-full p-4 animate-pulse opacity-50"
              >
                Loading...
              </Button>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full p-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3 sm:px-0">
          {Categories_List_Collection?.map(
            (Category_Item: Adiyah_Category_Record) => {
              const Current_Category_Name_String: string =
                Category_Item.Category_Name || "";
              return (
                <Link
                  key={Category_Item.ID}
                  to={`/Aid/Dua/${Extract_Slug_From_Category_Name(
                    Current_Category_Name_String
                  )}`}
                  className="block"
                >
                  <Button className="w-full h-full p-4 text-center group">
                    <span className="font-semibold text-sm [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                      {Current_Category_Name_String}
                    </span>
                  </Button>
                </Link>
              );
            }
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dua;