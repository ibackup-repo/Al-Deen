import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Normalize_Arabic } from '@/Utility/Quran/Normalize-Arabic';
import type { Assembled_Ayah } from 'Server/API/Quran';
import { Use_Audio_Level } from './Use-Audio-Level';

function Get_Proxy_URL(): string {
  const envUrl = (import.meta.env.VITE_STT_URL as string | undefined)?.trim()
    || (import.meta.env.VITE_STT_PROXY_URL as string | undefined)?.trim();
  if (envUrl) return envUrl;
  const host = window.location.hostname;
  if (host.endsWith('.app.github.dev')) {
    // Codespaces: unified STT server is exposed on port 8081.
    const withPort = host.replace(/-\d+(\.app\.github\.dev)$/, '-8081$1');
    return `wss://${withPort}`;
  }
  return 'ws://localhost:8081';
}

// Exponential backoff (ms): 1s, 2s, 4s, 8s, 15s cap.
function Backoff_MS(attempt: number): number {
  return Math.min(15000, 1000 * Math.pow(2, Math.max(0, attempt - 1)));
}

interface Use_Deepgram_Props {
  Surah_ID: number;
  Ayaat: Assembled_Ayah[] | undefined;
  Visible_Ayah_Index: number;
  Hifz: {
    Is_Kalimah_Completed: (Surah_ID: number, Ayah: number, Kalimah: number) => boolean;
    Mark_Kalimah_Completed: (Surah_ID: number, Ayah: number, Kalimah: number) => void;
  };
  On_Ayah_Complete?: (Ayah_ID: number) => void;
  /** ms of inactivity (no new STT events) before auto-stop. Default 8000. */
  Silence_Auto_Stop_MS?: number;
  /** Maximum number of reconnect attempts before giving up. Default 5. */
  Max_Reconnect_Attempts?: number;
}

export function Use_Deepgram({
  Surah_ID, Ayaat, Visible_Ayah_Index, Hifz, On_Ayah_Complete,
  Silence_Auto_Stop_MS = 8000,
  Max_Reconnect_Attempts = 5,
}: Use_Deepgram_Props) {

  // ---------- STT state ----------
  const [Is_Recording, Set_Is_Recording] = useState(false);
  const [Is_Paused, Set_Is_Paused] = useState(false);
  const [Transcript, Set_Transcript] = useState('');
  const [Interim_Transcript, Set_Interim_Transcript] = useState('');
  const [error, Set_Error] = useState<string | null>(null);
  const [Connection_Status, Set_Connection_Status] = useState<'idle' | 'connecting' | 'connected' | 'failed' | 'reconnecting'>('idle');
  const [Reconnect_Attempt, Set_Reconnect_Attempt] = useState(0);

  const Web_Socket_Reference = useRef<WebSocket | null>(null);
  const Recorder_Reference = useRef<MediaRecorder | null>(null);
  const Stream_Reference = useRef<MediaStream | null>(null);
  const Reconnect_Timeout_Reference = useRef<NodeJS.Timeout | null>(null);
  const Should_Reconnect_Reference = useRef(false);
  const Reconnect_Attempt_Reference = useRef(0);
  const Paused_Reference = useRef(false);

  // Live audio Level (Volume meter + VAD-style Is_Silent).
  const audioLevel = Use_Audio_Level({ Silence_Threshold: 0.02, Silence_Window_MS: Silence_Auto_Stop_MS });

  // ---------- Alignment state ----------
  const All_Kalimaat = useMemo(() => {
    if (!Ayaat) return [];
    const Kalimaat: { Ayah_ID: number; Kalimah_Index: number; Glyph: string }[] = [];
    for (const v of Ayaat) {
      if (!v.Kalimaat) continue;
      const Kalimah_Array = v.Kalimaat.slice(0, -1); // remove Ayah marker
      for (let Index = 0; Index < Kalimah_Array.length; Index++) {
        const Glyph = Kalimah_Array[Index];
        if (Glyph && typeof Glyph === 'string') {
          Kalimaat.push({
            Ayah_ID: v.Ayah_ID,
            Kalimah_Index: Index,
            Glyph,
          });
        }
      }
    }
    return Kalimaat;
  }, [Ayaat]);

  const Get_Start_Index = useCallback(() => {
    let startGlobal = 0;
    for (let i = 0; i < All_Kalimaat.length; i++) {
      if (All_Kalimaat[i].Ayah_ID === Visible_Ayah_Index && All_Kalimaat[i].Kalimah_Index === 0) {
        startGlobal = i;
        break;
      }
    }
    for (let i = startGlobal; i < All_Kalimaat.length; i++) {
      const w = All_Kalimaat[i];
      if (!Hifz.Is_Kalimah_Completed(Surah_ID, w.Ayah_ID, w.Kalimah_Index)) {
        return i;
      }
    }
    return All_Kalimaat.length;
  }, [All_Kalimaat, Visible_Ayah_Index, Surah_ID, Hifz]);

  const Start_Index_Reference = useRef(0);
  useEffect(() => {
    Start_Index_Reference.current = Get_Start_Index();
  }, [Get_Start_Index]);

  const Last_Processed_Transcript_Reference = useRef<string>('');
  const Recent_Transcripts_Reference = useRef<string[]>([]);
  const Last_Speech_At_Reference = useRef<number>(Date.now());
  const Silence_Timer_Reference = useRef<NodeJS.Timeout | null>(null);

  // Auto-pause silence threshold (ms). After this period without new speech
  // events, recording stops to avoid hanging connections.
  const Silence_Auto_Stop_Timeout = Silence_Auto_Stop_MS;
  // How far ahead in the reference text we look for a fuzzy match.
  const Skip_Ahead_Window = 6;
  // Max Levenshtein Distance_Val allowed for a fuzzy Kalimah match (scaled to length).
  const Fuzzy_Allowed = (refLen: number) =>
    refLen <= 3 ? 0 : refLen <= 5 ? 1 : refLen <= 8 ? 2 : 3;

  // Tiny Levenshtein for short Arabic tokens (post-normalization).
  function lev(a: string, b: string): number {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (m === 0 || n === 0) return Math.max(m, n);
    const dp = new Array(n + 1);
    for (let j = 0; j <= n; j++) dp[j] = j;
    for (let i = 1; i <= m; i++) {
      let prev = dp[0]; dp[0] = i;
      for (let j = 1; j <= n; j++) {
        const tmp = dp[j];
        dp[j] = a[i - 1] === b[j - 1]
          ? prev
          : 1 + Math.min(prev, dp[j], dp[j - 1]);
        prev = tmp;
      }
    }
    return dp[n];
  }

  // Deduplicate against recent transcripts (Deepgram often re-emits overlap).
  function Dedupe_Against_Recent(Kalimaat: string[]): string[] {
    if (Kalimaat.length === 0) return Kalimaat;
    for (const prev of Recent_Transcripts_Reference.current) {
      const prevWords = prev.split(/\s+/).filter(Boolean);
      // Find the largest suffix of prev that is a prefix of Kalimaat and strip it.
      const maxOverlap = Math.min(prevWords.length, Kalimaat.length);
      for (let k = maxOverlap; k > 0; k--) {
        let match = true;
        for (let i = 0; i < k; i++) {
          if (prevWords[prevWords.length - k + i] !== Kalimaat[i]) { match = false; break; }
        }
        if (match) return Kalimaat.slice(k);
      }
    }
    return Kalimaat;
  }

  const Align_And_Mark = useCallback((Raw_Transcript: string) => {
    if (Raw_Transcript === Last_Processed_Transcript_Reference.current) return;
    Last_Processed_Transcript_Reference.current = Raw_Transcript;
    Last_Speech_At_Reference.current = Date.now();

    if (!Ayaat || All_Kalimaat.length === 0) return;

    const Normalized_Transcript = Normalize_Arabic(Raw_Transcript);
    if (Normalized_Transcript.length === 0) return;

    const startIdx = Start_Index_Reference.current;
    if (startIdx >= All_Kalimaat.length) return;

    let Transcript_Kalimaat = Normalized_Transcript.split(/\s+/).filter(w => w.length > 0);
    Transcript_Kalimaat = Dedupe_Against_Recent(Transcript_Kalimaat);
    if (Transcript_Kalimaat.length === 0) return;

    // Track this Transcript for future dedupe (keep last 4).
    Recent_Transcripts_Reference.current.push(Normalized_Transcript);
    if (Recent_Transcripts_Reference.current.length > 4) Recent_Transcripts_Reference.current.shift();

    const remaining = All_Kalimaat.slice(startIdx);
    let Reference_Cursor = 0;
    let matched = 0;

    for (let ti = 0; ti < Transcript_Kalimaat.length && Reference_Cursor < remaining.length; ti++) {
      const tWord = Transcript_Kalimaat[ti];
      // Look up to Skip_Ahead_Window ahead in ref for a fuzzy match.
      const windowEnd = Math.min(Reference_Cursor + Skip_Ahead_Window, remaining.length);
      let bestIdx = -1;
      let bestDist = Infinity;
      for (let ri = Reference_Cursor; ri < windowEnd; ri++) {
        const refNorm = Normalize_Arabic(remaining[ri].Glyph || '');
        if (!refNorm) continue;
        const d = lev(tWord, refNorm);
        if (d < bestDist && d <= Fuzzy_Allowed(refNorm.length)) {
          bestDist = d;
          bestIdx = ri;
          if (d === 0) break;
        }
      }
      if (bestIdx === -1) continue;
      // Mark every ref Kalimah from Reference_Cursor..bestIdx inclusive as completed
      // (we assume the Reciter said them but ASR missed them).
      for (let ri = Reference_Cursor; ri <= bestIdx; ri++) {
        const w = remaining[ri];
        Hifz.Mark_Kalimah_Completed(Surah_ID, w.Ayah_ID, w.Kalimah_Index);
        matched++;
        // Detect Ayah boundary completion: this was last Kalimah of its Ayah
        const Is_Last_Kalimah_Of_Ayah =
          ri + 1 >= remaining.length ||
          remaining[ri + 1].Ayah_ID !== w.Ayah_ID;
        if (Is_Last_Kalimah_Of_Ayah && On_Ayah_Complete) {
          // Defer to next tick so caller can Update Visible_Ayah_Index / scroll safely
          const Completed_Ayah = w.Ayah_ID;
          setTimeout(() => On_Ayah_Complete(Completed_Ayah), 0);
        }
      }
      Reference_Cursor = bestIdx + 1;
    }

    if (matched > 0) {
      Start_Index_Reference.current += matched;
      console.log(`✅ Marked ${matched} Kalimaat (fuzzy), new start index: ${Start_Index_Reference.current}`);
    }
  }, [Ayaat, All_Kalimaat, Surah_ID, Hifz, On_Ayah_Complete]);



  // ---------- WebSocket and recording ----------
  const Cleanup = useCallback(() => {
    if (Reconnect_Timeout_Reference.current) {
      clearTimeout(Reconnect_Timeout_Reference.current);
      Reconnect_Timeout_Reference.current = null;
    }
    if (Recorder_Reference.current && Recorder_Reference.current.state !== 'inactive') {
      Recorder_Reference.current.stop();
    }
    if (Web_Socket_Reference.current && Web_Socket_Reference.current.readyState === WebSocket.OPEN) {
      Web_Socket_Reference.current.close(1000, 'Cleanup');
    }
    if (Stream_Reference.current) {
      Stream_Reference.current.getTracks().forEach(track => track.stop());
    }
    Web_Socket_Reference.current = null;
    Recorder_Reference.current = null;
    Stream_Reference.current = null;
    Should_Reconnect_Reference.current = false;
    Set_Connection_Status('idle');
  }, []);

  const Connect_Web_Socket = useCallback(() => {
    if (Web_Socket_Reference.current?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }
    if (Web_Socket_Reference.current?.readyState === WebSocket.CONNECTING) {
      return new Promise<void>((resolve) => {
        const Check_Interval = setInterval(() => {
          if (Web_Socket_Reference.current?.readyState === WebSocket.OPEN) {
            clearInterval(Check_Interval);
            resolve();
          }
        }, 100);
      });
    }
    const proxyUrl = Get_Proxy_URL();
    console.log('Connecting to STT proxy:', proxyUrl);
    const ws = new WebSocket(proxyUrl);
    ws.binaryType = 'arraybuffer';
    Web_Socket_Reference.current = ws;
    Set_Connection_Status('connecting');

    return new Promise<void>((resolve, reject) => {
      ws.onopen = () => {
        console.log('✅ WebSocket Open');
        Set_Connection_Status('connected');
        Set_Error(null);
        Should_Reconnect_Reference.current = true;
        resolve();
      };
      ws.onerror = () => {
        Set_Connection_Status('failed');
          Set_Error('WebSocket error — is the STT server running on port 8081?');
        reject(new error('WebSocket connection failed'));
      };
      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        if (Should_Reconnect_Reference.current && Is_Recording) {
          Reconnect_Attempt_Reference.current += 1;
          Set_Reconnect_Attempt(Reconnect_Attempt_Reference.current);
          if (Reconnect_Attempt_Reference.current > Max_Reconnect_Attempts) {
            Set_Connection_Status('failed');
            Set_Error(`Lost connection after ${Max_Reconnect_Attempts} attempts`);
            Should_Reconnect_Reference.current = false;
            return;
          }
          const delay = Backoff_MS(Reconnect_Attempt_Reference.current);
          Set_Connection_Status('reconnecting');
          console.log(`⏳ Reconnecting in ${delay}ms (attempt ${Reconnect_Attempt_Reference.current})`);
          Reconnect_Timeout_Reference.current = setTimeout(() => Connect_Web_Socket(), delay);
        } else {
          Set_Connection_Status('idle');
        }
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Received from STT:', data);
          if (data.text?.trim()) {
            Set_Transcript(prev => prev ? `${prev}\n${data.text}` : data.text);
            Set_Interim_Transcript('');
            // Perform alignment on every new Transcript
            Align_And_Mark(data.text);
          } else if (data.error) {
            console.error('STT server error:', data.error);
            Set_Error(data.error);
          }
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      };
    });
  }, [Is_Recording, Align_And_Mark]);

  const Disconnect_Web_Socket = useCallback(() => {
    if (Web_Socket_Reference.current && Web_Socket_Reference.current.readyState === WebSocket.OPEN) {
      Web_Socket_Reference.current.close(1000, 'Manual disconnect');
    }
    Web_Socket_Reference.current = null;
    Set_Connection_Status('idle');
  }, []);

  const Send_Raw_Audio = useCallback((data: ArrayBuffer): boolean => {
    if (Web_Socket_Reference.current && Web_Socket_Reference.current.readyState === WebSocket.OPEN) {
      Web_Socket_Reference.current.send(data);
      return true;
    }
    console.warn('WebSocket not Open, cannot send audio');
    return false;
  }, []);

  const Start_Recording = useCallback(async () => {
    Set_Error(null);
    Set_Transcript('');
    Set_Is_Paused(false);
    Recent_Transcripts_Reference.current = [];
    Last_Processed_Transcript_Reference.current = '';
    Last_Speech_At_Reference.current = Date.now();
    Reconnect_Attempt_Reference.current = 0;
    Set_Reconnect_Attempt(0);
    await Connect_Web_Socket();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      Stream_Reference.current = stream;
      audioLevel.Attach(stream);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      Recorder_Reference.current = recorder;


      recorder.ondataavailable = (e) => {
        if (Paused_Reference.current) return;
        if (e.data.size > 0 && Web_Socket_Reference.current?.readyState === WebSocket.OPEN) {
          Web_Socket_Reference.current.send(e.data);
        }
      };

      recorder.start(500);
      Set_Is_Recording(true);

      // Silence auto-stop watcher
      if (Silence_Timer_Reference.current) clearInterval(Silence_Timer_Reference.current);
      Silence_Timer_Reference.current = setInterval(() => {
        if (Date.now() - Last_Speech_At_Reference.current > Silence_Auto_Stop_Timeout) {
          console.log('🤫 Silence detected — auto-pausing recording');
          Stop_Recording();
        }
      }, 1000);
    } catch (err) {
      Set_Connection_Status('failed');
      Set_Error(err instanceof error ? err.message : 'Failed to access microphone');
      Cleanup();
    }
  }, [Connect_Web_Socket, Cleanup]);

  const Stop_Recording = useCallback(() => {
    Should_Reconnect_Reference.current = false;
    if (Reconnect_Timeout_Reference.current) {
      clearTimeout(Reconnect_Timeout_Reference.current);
      Reconnect_Timeout_Reference.current = null;
    }
    if (Silence_Timer_Reference.current) {
      clearInterval(Silence_Timer_Reference.current);
      Silence_Timer_Reference.current = null;
    }
    if (Recorder_Reference.current && Recorder_Reference.current.state !== 'inactive') {
      Recorder_Reference.current.stop();
    }
    if (Web_Socket_Reference.current && Web_Socket_Reference.current.readyState === WebSocket.OPEN) {
      Web_Socket_Reference.current.close(1000, 'User stopped recording');
    }
    if (Stream_Reference.current) {
      Stream_Reference.current.getTracks().forEach(track => track.stop());
    }
    audioLevel.Detach();
    Set_Is_Recording(false);
    Set_Is_Paused(false);
    Paused_Reference.current = false;
    Set_Interim_Transcript('');
    Set_Connection_Status('idle');
    Set_Reconnect_Attempt(0);
    Reconnect_Attempt_Reference.current = 0;
    Web_Socket_Reference.current = null;
    Recorder_Reference.current = null;
    Stream_Reference.current = null;
  }, [audioLevel]);

  const Pause_Recording = useCallback(() => {
    if (!Is_Recording || Paused_Reference.current) return;
    Paused_Reference.current = true;
    Set_Is_Paused(true);
    try { Recorder_Reference.current?.pause?.(); } catch { /* noop */ }
  }, [Is_Recording]);

  const Resume_Recording = useCallback(() => {
    if (!Is_Recording || !Paused_Reference.current) return;
    Paused_Reference.current = false;
    Set_Is_Paused(false);
    Last_Speech_At_Reference.current = Date.now();
    try { Recorder_Reference.current?.resume?.(); } catch { /* noop */ }
  }, [Is_Recording]);

  const Reset_Transcript = useCallback(() => {
    Set_Transcript('');
    Set_Interim_Transcript('');
    Last_Processed_Transcript_Reference.current = '';
    Recent_Transcripts_Reference.current = [];
  }, []);

  const Toggle_Recording = useCallback(() => {
    if (Is_Recording) Stop_Recording();
    else Start_Recording();
  }, [Is_Recording, Start_Recording, Stop_Recording]);

  useEffect(() => {
    return () => {
      Should_Reconnect_Reference.current = false;
      Cleanup();
    };
  }, [Cleanup]);

  return {
    Toggle_Recording,
    Start_Recording,
    Stop_Recording,
    Pause_Recording,
    Resume_Recording,
    Reset_Transcript,
    Is_Recording,
    Is_Paused,
    Transcript,
    Interim_Transcript,
    error,
    Connection_Status,
    Reconnect_Attempt,
    audioLevel: audioLevel.Level,
    audioPeak: audioLevel.Peak,
    Is_Silent: audioLevel.Is_Silent,
    Send_Raw_Audio,
    Connect_Web_Socket,
    Disconnect_Web_Socket,
  };
}