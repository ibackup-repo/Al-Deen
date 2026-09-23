import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@Web/Component/Layout/Index";
import { Button } from "@Web/Component/UI/Button";
import NotFound from "../404";

import { Fetch_Collections, Get_Chapter } from "@/Library/Hadith-API";
import type { Collection_Info, Chapter_Data, Narration as Narration_Type } from "@/Library/Hadith-Types";

const Chapter = () => {
  const { Collection, Chapter } = useParams<{ Collection: string; Chapter: string }>();

  const Collection_ID = Collection ?? "";
  const Chapter_ID = Number(Chapter) || 0;

  // 1. Resolve collection metadata to match Collection ID
  const { data: Hadith_Collections_List = [] } = useQuery<Collection_Info[]>({
    queryKey: ["hadithCollections"],
    queryFn: () => Fetch_Collections(),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  // Normalize slug comparisons so "Sahih-Muslim" matches "Sahih/Muslim"
  const Normalize_Slug_String = (str?: string) => str?.toLowerCase().replace(/[\/-]/g, "");

  const Target_Collection_Record = Hadith_Collections_List.find(
    (c) => Normalize_Slug_String(c.ID) === Normalize_Slug_String(Collection_ID)
  );

  // 2. Fetch chapter data (including its Narrations list)
  const { data: Chapter_Data = null } = useQuery<Chapter_Data | null>({
    queryKey: ["hadithChapter", Target_Collection_Record?.ID, Chapter_ID],
    queryFn: () => (Target_Collection_Record?.ID && Chapter_ID ? Get_Chapter(Target_Collection_Record.ID, Chapter_ID) : null),
    enabled: Boolean(Target_Collection_Record?.ID && Chapter_ID),
    staleTime: 1000 * 60 * 30, // Cache for 30 Minutes
  });

  if (!Target_Collection_Record || !Chapter_Data || !Chapter_Data.Narrations) {
    return <NotFound />;
  }

  const Safe_Collection_ID_Slug = Target_Collection_Record.ID.replace(/\//g, "-");

  return (
    <Layout>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Chapter_Data.Narrations.map((Narration: Narration_Type) => (
          <Link
            key={Narration.ID}
            to={`/Hadith/${Safe_Collection_ID_Slug}/${Chapter_ID}/${Narration.ID}`}
          >
            <Button
              variant="outline"
              className="w-full h-16 text-lg font-semibold"
            >
              {Narration.ID}
            </Button>
          </Link>
        ))}
      </div>
    </Layout>
  );
};

export default Chapter;