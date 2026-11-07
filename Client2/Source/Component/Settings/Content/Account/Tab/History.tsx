import { Link } from "react-router-dom";
import { Button } from "@Web/Component/UI/Button";
import { Container } from "@Web/Component/UI/Container";
import { BookOpen } from "lucide-react";

interface History_Tab_Properties {
  Continue_Reading_Surah: any;
  Render_Progress: any;
  Set_Settings_Sidebar_Open: (Open: boolean) => void;
}

export function History_Tab({
  Continue_Reading_Surah,
  Render_Progress,
  Set_Settings_Sidebar_Open,
}: History_Tab_Properties) {
  if (!Continue_Reading_Surah) {
    return (
      <Container className="text-center py-6">
        <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No reading History yet</p>
        <Link to="/Quran" onClick={() => Set_Settings_Sidebar_Open(false)}>
          <Button className="mt-3 gap-1">Start Reading</Button>
        </Link>
      </Container>
    );
  }

  return (
    <div className="space-y-2">
      <Link
        to={`/Quran/Surah/${Render_Progress?.Last_Surah_ID}?Ayah=${Render_Progress?.Last_Ayah_ID}`}
        onClick={() => Set_Settings_Sidebar_Open(false)}
      >
        <Container className="!p-3 flex items-center gap-3 group transition-transform">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">{Continue_Reading_Surah.id}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{Continue_Reading_Surah.English_Name}</p>
            <p className="text-xs text-muted-foreground">Ayah {Render_Progress?.Last_Ayah_ID}</p>
          </div>
          <span className="font-Arabic text-sm" dir="rtl">{Continue_Reading_Surah.name}</span>
        </Container>
      </Link>
    </div>
  );
}