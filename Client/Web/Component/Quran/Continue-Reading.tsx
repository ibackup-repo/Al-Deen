import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@Web/Component/UI/Card";
import { Button } from "@Web/Component/UI/Button";
import { BookOpen, ArrowRight } from "lucide-react";

interface Last_Read_State {
  Surah: number;
  Ayah: number;
  Timestamp: number;
}

const Last_Read_Key = "Last_Read";

export const Continue_Reading = ({ Surah_List }: { Surah_List: any[] }) => {
  const [Last_Read, Set_Last_Read] = useState<Last_Read_State | null>(null);

  useEffect(() => {
    try {
      const Raw_Storage_Data = localStorage.getItem(Last_Read_Key);
      if (Raw_Storage_Data) {
        Set_Last_Read(JSON.parse(Raw_Storage_Data));
      }
    } catch (e) {
      console.warn("Failed to Read last reading position from storage:", e);
    }
  }, []);

  const Surah_ID = Last_Read?.Surah ?? 1;
  const Ayah_ID = Last_Read?.Ayah ?? 1;

  const Surah_Meta = Surah_List.find((s) => Number(s.Surah ?? s.id) === Number(Surah_ID));
  const Surah_Name = Surah_Meta?.An_Nataqah ?? Surah_Meta?.Nataqah ?? Surah_Meta?.English_Name_Transliteration ?? `Surah ${Surah_ID}`;

  return (
    <Card className="flex-1 min-w-[280px] p-4 bg-card hover:bg-accent/5 transition-all flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            {Last_Read ? "Continue Reading" : "Start Reading"}
          </p>
          <h4 className="font-semibold text-sm sm:text-base">
            {Surah_Name}
          </h4>
          <p className="text-xs text-muted-foreground">
            Ayah {Ayah_ID}
          </p>
        </div>
      </div>

      <Link to={`/Quran/Surah/${Surah_ID}/Ayah/${Ayah_ID}`}>
        <Button size="sm" className="gap-2 flex-shrink-0">
          <span>Read</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>
    </Card>
  );
};