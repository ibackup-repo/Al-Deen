import { useMemo, useState } from "react";
import {
  Play,
  Pause,
  X,
  ListMusic,
  Search,
  ChevronDown,
  ArrowLeft,
  Check,
} from "lucide-react";
import { Button } from "@Web/Component/UI/Button";
import { Container } from "@Web/Component/UI/Container";
import { Slider } from "@Web/Component/UI/Slider";
import { Input } from "@Web/Component/UI/Input";
import {
  Popover,
  Popover_Content,
  Popover_Trigger,
} from "@Web/Component/UI/Popover";
import {
  Dropdown_Menu,
  Dropdown_Menu_Content,
  Dropdown_Menu_Item,
  Dropdown_Menu_Trigger,
} from "@Web/Component/UI/Dropdown-Menu";
import { Class_Names } from "@/Library/Utility";
import { useQuery } from "@tanstack/react-query";
import type { Audio_Player_Main_Properties, Audio_Play_Level } from "./Types";
import { Format_Time } from "./Utility";
import { Settings } from "./Settings";

const Backend_Base_URL = "https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev";

async function Fetch_Quran_Corpus_From_Backend() {
  const response = await fetch(`${Backend_Base_URL}/api/Quran-Corpus`);
  if (!response.ok) throw new Error("Failed to load unified Quran Corpus data map");
  return response.json();
}

const Timeline = ({
  Render_Progress,
  currentTime,
  Duration,
  On_Seek,
}: {
  Render_Progress: number;
  currentTime: number;
  Duration: number;
  On_Seek: (value: number[]) => void;
}) => (
  <div className="flex items-center gap-2 w-full">
    <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
      {Format_Time(currentTime)}
    </span>
    <Slider
      value={[Render_Progress]}
      max={100}
      Step={0.1}
      onValueChange={On_Seek}
      className="flex-1"
    />
    <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
      {Format_Time(Duration)}
    </span>
  </div>
);

const Level_Labels: Record<Audio_Play_Level, string> = {
  Surah: "Surah",
  Ayah: "Ayah",
  juz: "Juz",
  hizb: "Hizb",
};

const Audio_Picker = ({
  Current_Surah_ID,
  On_Select_Surah,
  On_Select_Ayah,
  On_Select_Juz,
  On_Select_Hizb,
}: {
  Current_Surah_ID?: number;
  On_Select_Surah: (id: number) => void;
  On_Select_Ayah: (Surah_ID: number, Ayah: number) => void;
  On_Select_Juz: (juz: number) => void;
  On_Select_Hizb: (hizb: number) => void;
}) => {
  const [Open, setOpen] = useState(false);
  const [Level, Set_Level] = useState<Audio_Play_Level>("Surah");
  const [query, Set_Query] = useState("");
  const [Ayah_Surah, setAyahSurah] = useState<number | null>(null);

  // Ingest structural database maps over unified reactive query cache
  const { data: Corpus } = useQuery({
    queryKey: ["Quran_Corpus_Backend"],
    queryFn: Fetch_Quran_Corpus_From_Backend,
    staleTime: 1000 * 60 * 30,
    enabled: Open,
  });

  const Surah_List = useMemo(() => Corpus?.Suwar || [], [Corpus]);

  const close = () => {
    setOpen(false);
    Set_Query("");
    setAyahSurah(null);
  };

  const Filtered_Suwar = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return Surah_List;
    return Surah_List.filter(
      (s: any) =>
        s.English_Name.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.id.toString() === q
    );
  }, [query, Surah_List]);

  const Render_Body = () => {
    if (Level === "Surah") {
      return (
        <div className="max-h-72 overflow-y-auto py-1">
          {Filtered_Suwar.map((s: any) => (
            <button
              key={s.id}
              onClick={() => {
                On_Select_Surah(s.id);
                close();
              }}
              className={Class_Names(
                "w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-between gap-2",
                Current_Surah_ID === s.id && "bg-black/5 dark:bg-white/5 font-medium"
              )}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="text-xs text-muted-foreground w-6 shrink-0">{s.id}</span>
                <span className="truncate">{s.English_Name}</span>
              </span>
              <span className="font-Arabic text-sm shrink-0">{s.name}</span>
            </button>
          ))}
          {Filtered_Suwar.length === 0 && (
            <p className="px-3 py-4 text-xs text-muted-foreground text-center">No Results</p>
          )}
        </div>
      );
    }

    if (Level === "Ayah") {
      if (!Ayah_Surah) {
        return (
          <div className="max-h-72 overflow-y-auto py-1">
            {Filtered_Suwar.map((s: any) => (
              <button
                key={s.id}
                onClick={() => setAyahSurah(s.id)}
                className="w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-muted-foreground w-6 shrink-0">{s.id}</span>
                  <span className="truncate">{s.English_Name}</span>
                </span>
                <span className="font-Arabic text-sm shrink-0">{s.name}</span>
              </button>
            ))}
          </div>
        );
      }
      const meta = Surah_List.find((s: any) => s.id === Ayah_Surah);
      if (!meta) return null;
      return (
        <div className="flex flex-col max-h-72">
          <div className="flex items-center gap-2 px-2 pt-2">
            <button onClick={() => setAyahSurah(null)} className="p-1 rounded hover:bg-muted/10">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-muted-foreground">{meta.English_Name}</span>
          </div>
          <div className="overflow-y-auto grid grid-cols-5 gap-1 p-2">
            {Array.from({ length: meta.Number_Of_Ayaat }, (_, i) => i + 1).map((a) => (
              <button
                key={a}
                onClick={() => {
                  On_Select_Ayah(Ayah_Surah, a);
                  close();
                }}
                className="px-2 py-1 text-xs rounded hover:bg-black/10 dark:hover:bg-white/10"
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (Level === "juz" || Level === "hizb") {
      const total = Level === "juz" ? 30 : 60;
      return (
        <div className="grid grid-cols-5 gap-1 p-2 max-h-72 overflow-y-auto">
          {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => {
                Level === "juz" ? On_Select_Juz(n) : On_Select_Hizb(n);
                close();
              }}
              className="px-2 py-1 text-xs rounded hover:bg-black/10 dark:hover:bg-white/10"
            >
              {n}
            </button>
          ))}
        </div>
      );
    }

    return null;
  };

  const Show_Search = Level === "Surah" || (Level === "Ayah" && !Ayah_Surah);

  return (
    <Popover Open={Open} On_Open_Change={(o) => (o ? setOpen(true) : close())}>
      <Popover_Trigger asChild>
        <Button
          size="sm"
          className="w-9 h-9 p-0 rounded-full shadow-lg"
          title="Select what to play"
          aria-label="Select what to play"
        >
          <ListMusic className="h-4 w-4" />
        </Button>
      </Popover_Trigger>
      <Popover_Content
        side="Top"
        align="start"
        sideOffset={8}
        className="w-72 p-0 z-[10000]"
      >
        <div className="p-2 border-b flex items-center gap-2">
          <Dropdown_Menu>
            <Dropdown_Menu_Trigger asChild>
              <Button variant="ghost" size="sm" className="text-xs font-medium px-2 py-1 h-8">
                {Level_Labels[Level]}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </Dropdown_Menu_Trigger>
            <Dropdown_Menu_Content align="start" className="min-w-[120px] z-[10001]">
              {(Object.keys(Level_Labels) as Audio_Play_Level[]).map((l) => (
                <Dropdown_Menu_Item
                  key={l}
                  onClick={() => {
                    Set_Level(l);
                    Set_Query("");
                    setAyahSurah(null);
                  }}
                  className={Class_Names("flex items-center justify-between text-xs", Level === l && "font-medium")}
                >
                  {Level_Labels[l]}
                  {Level === l && <Check className="h-3 w-3 ml-2" />}
                </Dropdown_Menu_Item>
              ))}
            </Dropdown_Menu_Content>
          </Dropdown_Menu>

          {Show_Search && (
            <div className="relative flex-1">
              <Search className="absolute left-2 Top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                On_Change={(e) => Set_Query(e.target.value)}
                placeholder="Search Surah..."
                className="pl-7 h-8 text-xs"
                autoFocus
              />
            </div>
          )}
        </div>
        {Render_Body()}
      </Popover_Content>
    </Popover>
  );
};

export const Audio_Player_Main = ({
  Is_Playing,
  Is_Loading_Corpus_Data,
  Render_Progress,
  currentTime,
  Duration,
  Track_Title,
  Repeat_Mode,
  Playback_Speed,
  Playback_Mode,
  Volume,
  Is_Muted,
  Settings_Open,
  Settings_Menu_State,
  On_Toggle_Play_Pause,
  On_Seek,
  On_Volume_Change,
  On_Toggle_Mute,
  On_Settings_Open_Change,
  On_Settings_Menu_Change,
  On_Repeat_Mode_Change,
  On_Playback_Speed_Change,
  On_Close,
  Current_Surah_ID,
  On_Select_Surah,
  On_Select_Ayah,
  On_Select_Juz,
  On_Select_Hizb,
}: Audio_Player_Main_Properties) => {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] px-4"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center justify-between gap-2 mb-1 px-1">
        <Audio_Picker
          Current_Surah_ID={Current_Surah_ID}
          On_Select_Surah={On_Select_Surah}
          On_Select_Ayah={On_Select_Ayah}
          On_Select_Juz={On_Select_Juz}
          On_Select_Hizb={On_Select_Hizb}
        />

        <div className="flex items-center gap-2">
          <Settings
            Open={Settings_Open}
            On_Open_Change={On_Settings_Open_Change}
            Menu={Settings_Menu_State}
            On_Settings_Menu_Change={On_Settings_Menu_Change}
            Repeat_Mode={Repeat_Mode}
            On_Repeat_Mode_Change={On_Repeat_Mode_Change}
            Playback_Speed={Playback_Speed}
            On_Playback_Speed_Change={On_Playback_Speed_Change}
            Playback_Mode={Playback_Mode}
            Volume={Volume}
            Is_Muted={Is_Muted}
            On_Volume_Change={On_Volume_Change}
            On_Toggle_Mute={On_Toggle_Mute}
          />

          <Button
            size="sm"
            className="w-9 h-9 p-0 rounded-full shadow-lg"
            onClick={On_Toggle_Play_Pause}
            disabled={Is_Loading_Corpus_Data}
          >
            {Is_Playing ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>

          <Button
            size="sm"
            className="w-8 h-8 p-0 rounded-full shadow-lg"
            onClick={On_Close}
            title="Close player"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <Container className="!py-2 !px-3 shadow-lg">
        <Timeline
          Render_Progress={Render_Progress}
          currentTime={currentTime}
          Duration={Duration}
          On_Seek={On_Seek}
        />
        {Track_Title && (
          <div className="mt-1 text-xs font-medium truncate text-center">
            {Track_Title}
          </div>
        )}
      </Container>
    </div>
  );
};