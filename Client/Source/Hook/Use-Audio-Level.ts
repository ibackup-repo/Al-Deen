// Real-time microphone Level monitor (RMS, 0..1) using Web Audio AnalyserNode.
// Attach to a MediaStream and Read `Level` at any time. Designed for STT UI:
// drive Volume meters, detect silence, and auto-mute hints.

import { useCallback, useEffect, useRef, useState } from "react";

export interface Use_Audio_Level_Result {
  Level: number;            // 0..1
  Peak: number;             // 0..1, slow-decay Peak hold
  Is_Silent: boolean;        // Level < Silence_Threshold for Silence_Window_MS
  Attach: (stream: MediaStream | null) => void;
  Detach: () => void;
}

export interface Use_Audio_Level_Options {
  Silence_Threshold?: number;   // 0..1, default 0.02
  Silence_Window_MS?: number;    // default 1500
  Smoothing_Time_Constant?: number; // 0..1, default 0.8
  FFT_Size?: number;            // default 1024
}

export function Use_Audio_Level(Options: Use_Audio_Level_Options = {}): Use_Audio_Level_Result {
  const {
    Silence_Threshold = 0.02,
    Silence_Window_MS = 1500,
    Smoothing_Time_Constant = 0.8,
    FFT_Size = 1024,
  } = Options;

  const [Level, Set_Level] = useState(0);
  const [Peak, Set_Peak] = useState(0);
  const [Is_Silent, Set_Is_Silent] = useState(true);

  const CTX_Reference = useRef<AudioContext | null>(null);
  const Analyser_Reference = useRef<AnalyserNode | null>(null);
  const Source_Reference = useRef<MediaStreamAudioSourceNode | null>(null);
  const RAF_Reference = useRef<number | null>(null);
  const Last_Loud_At_Reference = useRef<number>(Date.now());
  const Peak_Reference = useRef(0);

  const Detach = useCallback(() => {
    if (RAF_Reference.current !== null) cancelAnimationFrame(RAF_Reference.current);
    RAF_Reference.current = null;
    try { Source_Reference.current?.disconnect(); } catch { /* noop */ }
    try { Analyser_Reference.current?.disconnect(); } catch { /* noop */ }
    try { CTX_Reference.current?.close(); } catch { /* noop */ }
    Source_Reference.current = null;
    Analyser_Reference.current = null;
    CTX_Reference.current = null;
    Set_Level(0);
    Set_Peak(0);
    Set_Is_Silent(true);
  }, []);

  const Attach = useCallback((stream: MediaStream | null) => {
    Detach();
    if (!stream) return;
    const AC = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AC) return;
    const Context_Value: AudioContext = new AC();
    const analyser = Context_Value.createAnalyser();
    analyser.FFT_Size = FFT_Size;
    analyser.Smoothing_Time_Constant = Smoothing_Time_Constant;
    const src = Context_Value.createMediaStreamSource(stream);
    src.connect(analyser);

    CTX_Reference.current = Context_Value;
    Analyser_Reference.current = analyser;
    Source_Reference.current = src;

    const data = new Uint8Array(analyser.FFT_Size);

    const Loop = () => {
      analyser.getByteTimeDomainData(data);
      // RMS
      let Sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        Sum += v * v;
      }
      const rms = Math.sqrt(Sum / data.length);
      const Audio_Level = Math.min(1, rms * 2);
      Set_Level(Audio_Level);

      // Slow-decay Peak
      Peak_Reference.current = Math.max(Audio_Level, Peak_Reference.current * 0.96);
      Set_Peak(Peak_Reference.current);

      const Now = Date.now();
      if (Audio_Level >= Silence_Threshold) Last_Loud_At_Reference.current = Now;
      Set_Is_Silent(Now - Last_Loud_At_Reference.current > Silence_Window_MS);

      RAF_Reference.current = requestAnimationFrame(Loop);
    };
    RAF_Reference.current = requestAnimationFrame(Loop);
  }, [Detach, FFT_Size, Silence_Threshold, Silence_Window_MS, Smoothing_Time_Constant]);

  useEffect(() => () => Detach(), [Detach]);

  return { Level, Peak, Is_Silent, Attach, Detach };
}
