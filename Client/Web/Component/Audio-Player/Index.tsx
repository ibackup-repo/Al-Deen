import { memo, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Use_Audio } from "@Web/Context/Audio";
import { useQuery } from "@tanstack/react-query";
import { Audio_Player_Main } from "./Main";
import type { Audio_Player_Properties, Settings_Menu } from "./Types";

const Backend_Base_URL = "https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev";

async function Fetch_Quran_Corpus_From_Backend() {
  const response = await fetch(`${Backend_Base_URL}/api/Quran-Corpus`);
  if (!response.ok) throw new Error("Failed to load unified Quran Corpus data map");
  return response.json();
}

export const Audio_Player = memo(function Audio_Player({
  Is_Visible,
  On_Close,
  Surah_ID,
  Surah_Name,
}: Audio_Player_Properties) {
  const {
    Is_Playing,
    Is_Loading_Corpus_Data: Is_Audio_Loading,
    Current_Surah,
    Current_Page,
    currentTime,
    Duration,
    Render_Progress,
    Toggle_Play_Pause,
    stop,
    seekTo,
    setVolume,
    Repeat_Mode,
    Set_Repeat_Mode,
    Playback_Speed,
    Set_Playback_Speed,
    Playback_Mode,
    Play_Full_Surah,
    Play_Ayah_Audio,
  } = Use_Audio();

  const [Volume, setLocalVolume] = useState(80);
  const [Is_Muted, setIsMuted] = useState(false);
  const [Settings_Open, setSettingsOpen] = useState(false);
  const [Settings_Menu_State, setSettingsMenu] = useState<Settings_Menu>("main");

  // Ingest structural Segment and database maps over unified reactive query cache
  const { data: Corpus } = useQuery({
    queryKey: ["Quran_Corpus_Backend"],
    queryFn: Fetch_Quran_Corpus_From_Backend,
    staleTime: 1000 * 60 * 30,
    enabled: Is_Visible,
  });

  const Surah_List = useMemo(() => Corpus?.Suwar || [], [Corpus]);
  const Juz_Segments_Map = useMemo(() => Corpus?.juzSegments || {}, [Corpus]);
  const Hizb_Segments_Map = useMemo(() => Corpus?.hizbSegments || {}, [Corpus]);

  const Handle_Volume_Change = (value: number[]) => {
    const newVolume = value[0];
    setLocalVolume(newVolume);
    setVolume(Is_Muted ? 0 : newVolume);
  };

  const Toggle_Mute = () => {
    setIsMuted(!Is_Muted);
    setVolume(Is_Muted ? Volume : 0);
  };

  const Handle_Seek = (value: number[]) => {
    seekTo(value[0]);
  };

  const Handle_Close = () => {
    stop();
    On_Close();
  };

  const Resolved_Surah_ID = Current_Surah ?? Surah_ID;
  const Current_Surah_Data = useMemo(() => {
    if (!Resolved_Surah_ID || Surah_List.length === 0) return null;
    return Surah_List.find((s: any) => s.id === Resolved_Surah_ID) || null;
  }, [Resolved_Surah_ID, Surah_List]);

  const Track_Title = Current_Surah_Data
    ? Current_Surah_Data.English_Name
    : Surah_Name ?? (Current_Page ? `Page ${Current_Page}` : null);

  const Handle_Select_Juz = (juz: number) => {
    // Dynamic matching over cached dictionary objects
    const segs = Juz_Segments_Map[juz] || [];
    if (segs && segs[0]) {
      Play_Ayah_Audio(segs[0].Surah, segs[0].Start_Ayah);
    }
  };

  const Handle_Select_Hizb = (hizb: number) => {
    // Dynamic matching over cached dictionary objects
    const segs = Hizb_Segments_Map[hizb] || [];
    if (segs && segs[0]) {
      Play_Ayah_Audio(segs[0].Surah, segs[0].Start_Ayah);
    }
  };

  if (!Is_Visible) return null;

  return createPortal(
    <Audio_Player_Main
      Is_Playing={Is_Playing}
      Is_Loading_Corpus_Data={Is_Audio_Loading}
      Render_Progress={Render_Progress}
      currentTime={currentTime}
      Duration={Duration}
      Track_Title={Track_Title}
      Repeat_Mode={Repeat_Mode}
      Playback_Speed={Playback_Speed}
      Playback_Mode={Playback_Mode}
      Volume={Volume}
      Is_Muted={Is_Muted}
      Settings_Open={Settings_Open}
      Settings_Menu_State={Settings_Menu_State}
      On_Toggle_Play_Pause={Toggle_Play_Pause}
      On_Seek={Handle_Seek}
      On_Volume_Change={Handle_Volume_Change}
      On_Toggle_Mute={Toggle_Mute}
      On_Settings_Open_Change={setSettingsOpen}
      On_Settings_Menu_Change={setSettingsMenu}
      On_Repeat_Mode_Change={Set_Repeat_Mode}
      On_Playback_Speed_Change={Set_Playback_Speed}
      On_Close={Handle_Close}
      Current_Surah_ID={Resolved_Surah_ID ?? undefined}
      On_Select_Surah={(id) => Play_Full_Surah(id)}
      On_Select_Ayah={(s, a) => Play_Ayah_Audio(s, a)}
      On_Select_Juz={Handle_Select_Juz}
      On_Select_Hizb={Handle_Select_Hizb}
    />,
    document.body
  );
});