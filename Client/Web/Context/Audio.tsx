import { createContext, useContext, useState, useRef, useCallback, ReactNode, useEffect, useMemo } from 'react';
import { Use_App } from "@Web/Context/App";
import { useQuery } from '@tanstack/react-query';

type Playback_Mode_Type = 'Surah' | 'page' | 'Ayah';

interface Clip {
  Surah_ID: number;
  Start_Milliseconds: number;
  End_Milliseconds: number;
}

interface Audio_Context_Type {
  Is_Playing: boolean;
  Is_Loading_Corpus_Data: boolean;
  Current_Surah: number | null;
  Current_Page: number | null;
  Current_Ayah: { Surah_ID: number; Ayah_ID: number } | null;
  currentTime: number;
  Duration: number;
  Render_Progress: number;
  Playback_Mode: Playback_Mode_Type;
  Active_Ayah: number | null;
  Active_Kalimah: number | null;
  Play_Full_Surah: (Surah_Number: number) => void;
  Play_Page: (Page_Number: number) => void;
  Play_Ayah_Audio: (Surah_ID: number, Ayah_ID: number) => void;
  Toggle_Play_Pause: () => void;
  stop: () => void;
  seekTo: (Render_Progress: number) => void;
  setVolume: (Volume: number) => void;
  Repeat_Mode: 'none' | 'Surah' | 'page' | 'Ayah';
  Set_Repeat_Mode: (Mode: 'none' | 'Surah' | 'page' | 'Ayah') => void;
  Playback_Speed: number;
  Set_Playback_Speed: (Speed: number) => void;
}

const App_Audio_Context = createContext<Audio_Context_Type | undefined>(undefined);

// ============================================================================
// Network Fetch Client Handlers
// ============================================================================
async function Fetch_Quran_Corpus_From_Backend() {
  const response = await fetch("https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev/api/Quran-Corpus");
  if (!response.ok) throw new Error("Failed to stream Quran Corpus database over the network");
  return response.json();
}

// ============================================================================
// In-Memory Parsing & Range Helpers
// ============================================================================
function Parse_Range(r: string): { start: number; end: number } {
  const [start, end] = r.split("-").map(Number);
  return { start, end };
}

function Parse_Client_Page_Segments(Page_Map_Entry: string | undefined): any[] | null {
  if (!Page_Map_Entry) return null;
  const Segments = Page_Map_Entry.split('|');
  const result: any[] = [];
  
  for (const Segment of Segments) {
    const [start, end] = Segment.split('-');
    if (!start || !end) continue;
    
    const [Start_Surah_Ayah] = start.split('.');
    const [Start_Surah, Start_Ayah] = Start_Surah_Ayah.split(':').map(Number);
    
    const [End_Surah_Ayah] = end.split('.');
    const [End_Surah, End_Ayah] = End_Surah_Ayah.split(':').map(Number);
    
    result.push({
      Surah: Start_Surah,
      Start_Ayah,
      End_Surah,
      End_Ayah
    });
  }
  return result.length > 0 ? result : null;
}

function Ayah_MS_Range(data: string[][], Ayah_Index_1: number): { start: number; end: number } | null {
  const Kalimaat = data[Ayah_Index_1 - 1];
  if (!Kalimaat || Kalimaat.length === 0) return null;
  const { start } = Parse_Range(Kalimaat[0]);
  const { end } = Parse_Range(Kalimaat[Kalimaat.length - 1]);
  return { start, end };
}

export function Audio_Provider({ children }: { children: ReactNode }) {
  const { Selected_Reciter } = Use_App();

  // 🌟 Centralized React Query database pipeline
  const { data: Corpus } = useQuery({
    queryKey: ["Quran_Corpus_Backend"],
    queryFn: Fetch_Quran_Corpus_From_Backend,
    staleTime: 1000 * 60 * 30, // 30 Minutes client cache validity
  });

  const [Is_Playing, Set_Is_Playing] = useState(false);
  const [Is_Loading_Corpus_Data, Set_Is_Loading] = useState(false);
  const [Current_Surah, Set_Current_Surah] = useState<number | null>(null);
  const [Current_Page, Set_Current_Page] = useState<number | null>(null);
  const [Current_Ayah, Set_Current_Ayah] = useState<{ Surah_ID: number; Ayah_ID: number } | null>(null);
  const [currentTime, Set_Current_Time] = useState(0);
  const [Duration, Set_Duration] = useState(0);
  const [Render_Progress, Set_Render_Progress] = useState(0);
  const [Repeat_Mode, Set_Repeat_Mode] = useState<'none' | 'Surah' | 'page' | 'Ayah'>('none');
  const [Playback_Speed, Set_Playback_Speed] = useState(1);
  const [Playback_Mode, Set_Playback_Mode] = useState<Playback_Mode_Type>('Surah');
  const [Active_Ayah, Set_Active_Ayah] = useState<number | null>(null);
  const [Active_Kalimah, Set_Active_Kalimah] = useState<number | null>(null);

  const Audio_Reference = useRef<HTMLAudioElement | null>(null);
  const Playback_Mode_Reference = useRef<Playback_Mode_Type>('Surah');

  const Timestamps_Reference = useRef<Array<{ Ayah: number; Kalimah: number; start: number; end: number }> | null>(null);
  const Loaded_Surah_For_Timestamps_Reference = useRef<number | null>(null);
  const Ayah_Timestamps_Reference = useRef<string[] | null>(null);

  const Clip_Queue_Reference = useRef<Clip[]>([]);
  const Clip_Index_Reference = useRef<number>(0);
  const Stop_At_Ms_Reference = useRef<number | null>(null);
  const Pending_Seek_Ms_Ref = useRef<number | null>(null);

  // ── Compute dynamic asset parameters directly from in-memory cache metadata ──
  const Get_Audio_File_URL = useCallback((Surah_ID: number, Reciter: string) => {
    return `https://everyayah.com/data/${Reciter}/${String(Surah_ID).padStart(3, '0')}.mp3`;
  }, []);

  const Get_Timestamps_From_Cache = useCallback((Surah_ID: number, Reciter: string) => {
    if (!Corpus?.audioTimestamps?.[Reciter]?.[Surah_ID]) return null;
    return Corpus.audioTimestamps[Reciter][Surah_ID] as string[][];
  }, [Corpus]);

  // ── Load flattened Kalimah timestamps for a Surah's full audio file ───────────
  const Load_Timestamps_For_Surah = useCallback((Surah_ID: number) => {
    Loaded_Surah_For_Timestamps_Reference.current = Surah_ID;
    const data = Get_Timestamps_From_Cache(Surah_ID, Selected_Reciter);
    
    if (Loaded_Surah_For_Timestamps_Reference.current !== Surah_ID) return;
    if (data) {
      const flat: Array<{ Ayah: number; Kalimah: number; start: number; end: number }> = [];
      for (let v = 0; v < data.length; v++) {
        const Kalimaat = data[v];
        for (let w = 0; w < Kalimaat.length; w++) {
          const { start, end } = Parse_Range(Kalimaat[w]);
          flat.push({ Ayah: v + 1, Kalimah: w, start, end });
        }
      }
      Timestamps_Reference.current = flat;
    } else {
      Timestamps_Reference.current = null;
    }
  }, [Selected_Reciter, Get_Timestamps_From_Cache]);

  // ── Main audio element setup ────────────────────────────────────────────────
  useEffect(() => {
    Audio_Reference.current = new Audio();
    Audio_Reference.current.preload = 'auto';

    const audio = Audio_Reference.current;

    const Handle_Time_Update = () => {
      const ct = audio.currentTime;
      Set_Current_Time(ct);
      if (audio.Duration) {
        Set_Render_Progress((ct / audio.Duration) * 100);
      }

      const ms = ct * 1000;

      if (Stop_At_Ms_Reference.current != null && ms >= Stop_At_Ms_Reference.current) {
        Advance_Or_Finish();
        return;
      }

      const Mode = Playback_Mode_Reference.current;
      if (Mode === 'Surah' || Mode === 'page') {
        const ts = Timestamps_Reference.current;
        if (ts && ts.length > 0) {
          let Found_Ayah: number | null = null;
          let Found_Kalimah: number | null = null;
          for (let i = 0; i < ts.length; i++) {
            const item = ts[i];
            if (ms >= item.start && ms < item.end) {
              Found_Ayah = item.Ayah;
              Found_Kalimah = item.Kalimah;
              break;
            }
          }
          Set_Active_Ayah(Found_Ayah);
          Set_Active_Kalimah(Found_Kalimah);
        }
      } else if (Mode === 'Ayah') {
        const ts = Ayah_Timestamps_Reference.current;
        if (ts && ts.length > 0) {
          let Found_Kalimah: number | null = null;
          for (let i = 0; i < ts.length; i++) {
            const { start, end } = Parse_Range(ts[i]);
            if (ms >= start && ms < end) {
              Found_Kalimah = i;
              break;
            }
          }
          Set_Active_Kalimah(Found_Kalimah);
        }
      } else {
        Set_Active_Ayah(null);
        Set_Active_Kalimah(null);
      }
    };

    const Handle_Loaded_Metadata = () => {
      if (Pending_Seek_Ms_Ref.current != null) {
        audio.currentTime = Pending_Seek_Ms_Ref.current / 1000;
        Pending_Seek_Ms_Ref.current = null;
      }
      Set_Duration(audio.Duration);
      Set_Is_Loading(false);
    };

    const Handle_Error = (e: Event) => {
      console.error('Audio error:', e);
      Set_Is_Loading(false);
    };

    audio.addEventListener('timeupdate', Handle_Time_Update);
    audio.addEventListener('loadedmetadata', Handle_Loaded_Metadata);
    audio.addEventListener('error', Handle_Error);

    return () => {
      audio.removeEventListener('timeupdate', Handle_Time_Update);
      audio.removeEventListener('loadedmetadata', Handle_Loaded_Metadata);
      audio.removeEventListener('error', Handle_Error);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // ── Load a Surah's audio file (Raw_Storage_Data, whole file, no clip bounds) ────────────
  const Load_And_Play = useCallback((Surah_ID: number, seekMs?: number, stopMs?: number) => {
    const audio = Audio_Reference.current;
    if (!audio) return;
    Set_Is_Loading(true);
    Set_Active_Ayah(null);
    Set_Active_Kalimah(null);
    Stop_At_Ms_Reference.current = stopMs ?? null;
    Pending_Seek_Ms_Ref.current = seekMs ?? null;

    const url = Get_Audio_File_URL(Surah_ID, Selected_Reciter);
    audio.src = url;
    audio.playbackRate = Playback_Speed;
    
    try {
      audio.play().then(() => {
        Set_Is_Playing(true);
      }).catch((error) => {
        console.error('Audio playback initialization failed:', error);
        Set_Is_Loading(false);
      });
    } catch (error) {
      console.error('Audio asset injection exception:', error);
      Set_Is_Loading(false);
    }
  }, [Selected_Reciter, Playback_Speed, Get_Audio_File_URL]);

  // ── Advance to next clip in queue, or finish (handles repeat) ──────────────
  const Advance_Or_Finish = useCallback(() => {
    const audio = Audio_Reference.current;
    if (!audio) return;

    const queue = Clip_Queue_Reference.current;
    const Next_Index = Clip_Index_Reference.current + 1;

    if (queue.length > 0 && Next_Index < queue.length) {
      Clip_Index_Reference.current = Next_Index;
      const clip = queue[Next_Index];
      if (clip.Surah_ID === Loaded_Surah_For_Timestamps_Reference.current && audio.src.includes(String(clip.Surah_ID))) {
        Stop_At_Ms_Reference.current = clip.End_Milliseconds;
        audio.currentTime = clip.Start_Milliseconds / 1000;
        audio.play().catch(err => console.error("Clip advance play error:", err));
      } else {
        Load_Timestamps_For_Surah(clip.Surah_ID);
        Load_And_Play(clip.Surah_ID, clip.Start_Milliseconds, clip.End_Milliseconds);
      }
      return;
    }

    const Mode = Playback_Mode_Reference.current;
    const Should_Repeat =
      (Mode === 'Surah' && Repeat_Mode === 'Surah') ||
      (Mode === 'page' && Repeat_Mode === 'page') ||
      (Mode === 'Ayah' && Repeat_Mode === 'Ayah');

    if (Should_Repeat && queue.length > 0) {
      Clip_Index_Reference.current = 0;
      const clip = queue[0];
      Stop_At_Ms_Reference.current = clip.End_Milliseconds;
      audio.currentTime = clip.Start_Milliseconds / 1000;
      audio.play().catch(err => console.error("Clip repeat play error:", err));
    } else if (Should_Repeat) {
      audio.currentTime = 0;
      audio.play().catch(err => console.error("Whole Loop play error:", err));
    } else {
      audio.pause();
      Set_Is_Playing(false);
      Set_Render_Progress(0);
      Set_Current_Time(0);
      Set_Active_Ayah(null);
      Set_Active_Kalimah(null);
    }
  }, [Load_And_Play, Load_Timestamps_For_Surah, Repeat_Mode]);

  useEffect(() => {
    const audio = Audio_Reference.current;
    if (!audio) return;
    const Handle_Ended = () => Advance_Or_Finish();
    audio.addEventListener('ended', Handle_Ended);
    return () => audio.removeEventListener('ended', Handle_Ended);
  }, [Advance_Or_Finish]);

  // ── Play Full Surah ─────────────────────────────────────────────────────────
  const Play_Full_Surah = useCallback(async (Surah_Number: number) => {
    Playback_Mode_Reference.current = 'Surah';
    Set_Playback_Mode('Surah');
    Set_Current_Page(null);
    Set_Current_Ayah(null);
    Set_Current_Surah(Surah_Number);
    Clip_Queue_Reference.current = [];
    Clip_Index_Reference.current = 0;

    Load_Timestamps_For_Surah(Surah_Number);

    const Needs_Basmallah = Surah_Number !== 1 && Surah_Number !== 9;
    if (Needs_Basmallah) {
      try {
        const Basmallah_URL = Get_Audio_File_URL(1, Selected_Reciter);
        const Basmallah_Timestamps = Get_Timestamps_From_Cache(1, Selected_Reciter);
        const Range = Basmallah_Timestamps ? Ayah_MS_Range(Basmallah_Timestamps, 1) : null;
        if (Basmallah_URL && Range) {
          Set_Is_Loading(true);
          await new Promise<void>((resolve) => {
            const pre = new Audio(Basmallah_URL);
            pre.currentTime = Range.start / 1000;
            pre.playbackRate = Playback_Speed;
            const done = () => {
              pre.removeEventListener('timeupdate', onTime);
              pre.removeEventListener('ended', done);
              pre.removeEventListener('error', done);
              pre.pause();
              resolve();
            };
            const onTime = () => {
              if (pre.currentTime * 1000 >= Range.end) done();
            };
            pre.addEventListener('timeupdate', onTime);
            pre.addEventListener('ended', done);
            pre.addEventListener('error', done);
            pre.play().catch(done);
          });
        }
      } catch (e) {
        console.warn('Basmallah template audio exception skipped', e);
      }
    }

    Load_And_Play(Surah_Number);
  }, [Load_And_Play, Load_Timestamps_For_Surah, Selected_Reciter, Playback_Speed, Get_Audio_File_URL, Get_Timestamps_From_Cache]);

  // ── Play Page ──────────────────────────────────────────────────────────────
  const Play_Page = useCallback((Page_Number: number) => {
    Playback_Mode_Reference.current = 'page';
    Set_Playback_Mode('page');
    Set_Current_Surah(null);
    Set_Current_Ayah(null);
    Set_Current_Page(Page_Number);

    if (!Corpus?.pageMap) return;
    const Raw_Page_Data = Corpus.pageMap[Page_Number - 1];
    const Segments = Parse_Client_Page_Segments(Raw_Page_Data);
    
    if (!Segments || Segments.length === 0) {
      console.error(`No Segment array indices resolved for page ${Page_Number}`);
      Set_Is_Loading(false);
      return;
    }

    Set_Is_Loading(true);
    const clips: Clip[] = [];
    for (const seg of Segments) {
      const data = Get_Timestamps_From_Cache(seg.Surah, Selected_Reciter);
      if (!data) continue;
      const Start_Range = Ayah_MS_Range(data, seg.Start_Ayah);
      const End_Range = Ayah_MS_Range(data, seg.End_Ayah);
      if (!Start_Range || !End_Range) continue;
      clips.push({ Surah_ID: seg.Surah, Start_Milliseconds: Start_Range.start, End_Milliseconds: End_Range.end });
    }

    if (clips.length === 0) {
      console.error(`Could not match runtime geometry boundaries on page ${Page_Number}`);
      Set_Is_Loading(false);
      return;
    }

    Clip_Queue_Reference.current = clips;
    Clip_Index_Reference.current = 0;
    Load_Timestamps_For_Surah(clips[0].Surah_ID);
    Load_And_Play(clips[0].Surah_ID, clips[0].Start_Milliseconds, clips[0].End_Milliseconds);
  }, [Load_And_Play, Load_Timestamps_For_Surah, Selected_Reciter, Corpus, Get_Timestamps_From_Cache]);

  // ── Play a single Ayah ──────────────────────────────────────────────────────
  const Play_Ayah_Audio = useCallback((Surah_ID: number, Ayah_ID: number) => {
    Playback_Mode_Reference.current = 'Ayah';
    Set_Playback_Mode('Ayah');
    Set_Current_Surah(null);
    Set_Current_Page(null);
    Set_Current_Ayah({ Surah_ID, Ayah_ID });

    const data = Get_Timestamps_From_Cache(Surah_ID, Selected_Reciter);
    const Kalimaat = data?.[Ayah_ID - 1];
    Ayah_Timestamps_Reference.current = Kalimaat || null;

    if (!Kalimaat || Kalimaat.length === 0) {
      console.error(`Missing Segment coordinate maps for target Ayah ${Surah_ID}:${Ayah_ID}`);
      Set_Is_Loading(false);
      return;
    }

    const { start } = Parse_Range(Kalimaat[0]);
    const { end } = Parse_Range(Kalimaat[Kalimaat.length - 1]);

    Clip_Queue_Reference.current = [{ Surah_ID, Start_Milliseconds: start, End_Milliseconds: end }];
    Clip_Index_Reference.current = 0;
    Set_Active_Ayah(Ayah_ID);

    Load_And_Play(Surah_ID, start, end);
  }, [Load_And_Play, Selected_Reciter, Get_Timestamps_From_Cache]);

  const Toggle_Play_Pause = useCallback(() => {
    const audio = Audio_Reference.current;
    if (!audio) return;
    if (Is_Playing) {
      audio.pause();
      Set_Is_Playing(false);
    } else {
      audio.play().catch(err => console.error("Toggle play error:", err));
      Set_Is_Playing(true);
    }
  }, [Is_Playing]);

  const stop = useCallback(() => {
    const audio = Audio_Reference.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
    }
    Set_Is_Playing(false);
    Set_Current_Surah(null);
    Set_Current_Page(null);
    Set_Current_Ayah(null);
    Set_Render_Progress(0);
    Set_Current_Time(0);
    Set_Duration(0);
    Set_Active_Ayah(null);
    Set_Active_Kalimah(null);
    Timestamps_Reference.current = null;
    Ayah_Timestamps_Reference.current = null;
    Loaded_Surah_For_Timestamps_Reference.current = null;
    Clip_Queue_Reference.current = [];
    Clip_Index_Reference.current = 0;
    Stop_At_Ms_Reference.current = null;
    Pending_Seek_Ms_Ref.current = null;
  }, []);

  const seekTo = useCallback((New_Progress: number) => {
    const audio = Audio_Reference.current;
    if (!audio || !audio.Duration) return;

    const clip = Clip_Queue_Reference.current[Clip_Index_Reference.current];
    if (clip) {
      const span = clip.End_Milliseconds - clip.Start_Milliseconds;
      const Target_MS = clip.Start_Milliseconds + (New_Progress / 100) * span;
      audio.currentTime = Target_MS / 1000;
    } else {
      audio.currentTime = (New_Progress / 100) * audio.Duration;
    }
    Set_Render_Progress(New_Progress);
  }, []);

  const setVolume = useCallback((Volume: number) => {
    if (Audio_Reference.current) {
      Audio_Reference.current.Volume = Math.max(0, Math.min(1, Volume / 100));
    }
  }, []);

  useEffect(() => {
    if (Audio_Reference.current) {
      Audio_Reference.current.playbackRate = Playback_Speed;
    }
  }, [Playback_Speed]);

  const Context_Value = useMemo(() => ({
    Is_Playing,
    Is_Loading_Corpus_Data,
    Current_Surah,
    Current_Page,
    Current_Ayah,
    currentTime,
    Duration,
    Render_Progress,
    Playback_Mode,
    Active_Ayah,
    Active_Kalimah,
    Play_Full_Surah,
    Play_Page,
    Play_Ayah_Audio,
    Toggle_Play_Pause,
    stop,
    seekTo,
    setVolume,
    Repeat_Mode,
    Set_Repeat_Mode,
    Playback_Speed,
    Set_Playback_Speed,
  }), [
    Is_Playing, Is_Loading_Corpus_Data, Current_Surah, Current_Page, Current_Ayah,
    currentTime, Duration, Render_Progress, Playback_Mode,
    Active_Ayah, Active_Kalimah,
    Play_Full_Surah, Play_Page, Play_Ayah_Audio, Toggle_Play_Pause, stop,
    seekTo, setVolume, Repeat_Mode, Playback_Speed,
  ]);

  return (
    <App_Audio_Context.Provider value={Context_Value}>
      {children}
    </App_Audio_Context.Provider>
  );
}

export function Use_Audio() {
  const context = useContext(App_Audio_Context);
  if (context === undefined) {
    throw new Error('Use_Audio must be used within an Audio_Provider');
  }
  return context;
}