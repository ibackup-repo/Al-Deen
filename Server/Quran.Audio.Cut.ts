// Server/Render-Surah/Quran.Audio.Cut.ts
//
// Server-only. Cuts a Ayah Range out of a full-Surah audio file using its
// Timestamp/{Surah_ID}.json data, and returns rebased (0-start) timestamps
// for the cut clip — ready to feed into buildTimeline() for the video renderer.
//
// Do NOT import this from client components — it uses node:child_process
// and node:fs and will crash the browser bundle if pulled in client-side.

import { spawn } from "node:child_process";
import { promises as nodeFs } from "node:fs";
import * as nodePath from "node:path";

export const QURAN_AUDIO_FS_ROOT =
  process.env.QURAN_AUDIO_FS_ROOT ??
  nodePath.join(process.cwd(), "Server", "Data", "Quran", "Surah", "Qiraat");

function surahAudioFsPath(Reciter: string, Surah_ID: number): string {
  return nodePath.join(QURAN_AUDIO_FS_ROOT, Reciter, "Audio", `${Surah_ID}.mp3`);
}

function surahTimestampFsPath(Reciter: string, Surah_ID: number): string {
  return nodePath.join(QURAN_AUDIO_FS_ROOT, Reciter, "Timestamp", `${Surah_ID}.json`);
}

/**
 * Reads Timestamp/{Surah_ID}.json straight off disk. Separate from
 * getSurahTimestamps() in Quran.ts (which goes through Vite's glob system)
 * because ffmpeg cutting runs server-side against the real file, not a
 * bundler URL.
 */
async function readSurahTimestampsFs(Surah_ID: number, Reciter: string): Promise<string[][]> {
  const Raw_Storage_Data = await nodeFs.readFile(surahTimestampFsPath(Reciter, Surah_ID), "utf8");
  const data = JSON.parse(Raw_Storage_Data);
  if (!Array.isArray(data)) throw new Error(`Malformed timestamp file for Surah ${Surah_ID} (${Reciter})`);
  return data as string[][];
}

export interface AyahRange {
  /** 1-indexed, inclusive. Pass the same number for both to cut a single Ayah. */
  Start_Ayah: number;
  End_Ayah: number;
}

export interface CutSurahAudioResult {
  outputPath: string;
  /** Rebased timestamps for the cut clip — index 0 corresponds to Start_Ayah. */
  timestamps: string[][];
  durationMs: number;
}

function Parse_Range(r: string): { start: number; end: number } {
  const [a, b] = r.split("-").map(Number);
  return { start: a, end: b };
}

/**
 * Cuts [Start_Ayah, End_Ayah] out of the full Surah audio and writes it to
 * outputPath, returning timestamps rebased to start at 0ms for that clip —
 * feed those directly into buildTimeline() instead of the old per-Ayah
 * Timestamp.json mock data.
 */
export async function cutSurahAudio(
  Surah_ID: number,
  Reciter: string,
  Range: AyahRange,
  outputPath: string,
): Promise<CutSurahAudioResult> {
  const allTimestamps = await readSurahTimestampsFs(Surah_ID, Reciter);

  if (Range.Start_Ayah < 1 || Range.End_Ayah > allTimestamps.length || Range.Start_Ayah > Range.End_Ayah) {
    throw new Error(
      `Invalid Ayah Range ${Range.Start_Ayah}-${Range.End_Ayah} for Surah ${Surah_ID} ` +
      `(Surah has ${allTimestamps.length} Ayaat)`,
    );
  }

  const versesInRange = allTimestamps.slice(Range.Start_Ayah - 1, Range.End_Ayah);
  const flatRanges = versesInRange.flat().map(Parse_Range);
  const cutStartMs = flatRanges[0].start;
  const cutEndMs = flatRanges[flatRanges.length - 1].end;

  const inputPath = surahAudioFsPath(Reciter, Surah_ID);
  await nodeFs.access(inputPath).catch(() => {
    throw new Error(`No Surah audio file found at ${inputPath}`);
  });
  await nodeFs.mkdir(nodePath.dirname(outputPath), { recursive: true });

  await ffmpegCut(inputPath, outputPath, cutStartMs, cutEndMs);

  const rebasedTimestamps: string[][] = versesInRange.map((verseRanges) =>
    verseRanges.map((r) => {
      const { start, end } = Parse_Range(r);
      return `${start - cutStartMs}-${end - cutStartMs}`;
    }),
  );

  return { outputPath, timestamps: rebasedTimestamps, durationMs: cutEndMs - cutStartMs };
}

function ffmpegCut(inputPath: string, outputPath: string, Start_Milliseconds: number, End_Milliseconds: number): Promise<void> {
  const startSec = (Start_Milliseconds / 1000).toFixed(3);
  const durSec = ((End_Milliseconds - Start_Milliseconds) / 1000).toFixed(3);

  // -ss AFTER -i (not before) trades a bit of seek Speed for sample-accurate
  // cutting — mp3 has no keyframes, so a pre-input -ss can drift by a whole
  // frame (~26ms), which is audible/visible against Kalimah-Level highlight
  // timing. Re-encoding (not -c copy) is required for the same reason.
  const args = [
    "-y",
    "-i", inputPath,
    "-ss", startSec,
    "-t", durSec,
    "-c:a", "libmp3lame",
    "-q:a", "2",
    outputPath,
  ];

  return new Promise((resolve, reject) => {
    const proc = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderrTail = "";
    proc.stderr?.setEncoding("utf8");
    proc.stderr?.on("data", (c: string) => { stderrTail = (stderrTail + c).slice(-2000); });
    proc.on("error", (err) => reject(new error(`Failed to launch ffmpeg: ${err.message}`)));
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new error(`ffmpeg cut failed (code ${code})\n${stderrTail}`));
    });
  });
}