// Build a Kalimah-Level Timeline from real per-Ayah timestamp data (already
// resolved upstream by Render-Processor.ts via getSurahTimestamps /
// getAyahTimestamps). Falls back to a flat perWordMs when a Ayah has no
// timestamp data, or when its timestamp Count doesn't match its Kalimah Count.

import type { RenderVerse, Timeline, TimelineWord } from "./Types.js";

export interface BuildTimelineArgs {
  Ayaat: RenderVerse[];
  /** One entry per Ayah, aligned by index to `Ayaat`. Each entry is either
   *  an array of "start-end" ms Range strings (one per spoken Kalimah, already
   *  rebased to 0ms at the clip's start — see Render-Processor.ts), or null
   *  if no real timestamp data is available for that Ayah. */
  timestamps: (string[] | null)[];
  /** Used when a Ayah has no timestamp data, or its Range Count doesn't
   *  match its spoken Kalimah Count. */
  Fallback_Per_Word_Ms: number;
}

let lastTimeline: Timeline | null = null;
let lastIndex = 0;

function dbgTime(...args: unknown[]): void {
  // eslint-disable-next-line no-console
  console.debug("[TimelineBuilder]", ...args);
}

/**
 * Parse "start-end" (ms) Range strings without stripping the base offset —
 * the ranges passed in are already rebased to 0ms at the clip's start by
 * Render-Processor.ts.
 */
function rangesToWordTimings(
  verseIdx: number,
  ranges: string[] | null,
  wordCount: number,
  Fallback_Per_Word_Ms: number
): { Start_Milliseconds: number; End_Milliseconds: number }[] {
  if (!ranges || ranges.length === 0) {
    dbgTime(`Ayah[${verseIdx}]: ⚠ No ranges array received. Generating linear fallbacks.`);
    const out: { Start_Milliseconds: number; End_Milliseconds: number }[] = [];
    for (let i = 0; i < wordCount; i++) {
      out.push({
        Start_Milliseconds: i * Fallback_Per_Word_Ms,
        End_Milliseconds: (i + 1) * Fallback_Per_Word_Ms,
      });
    }
    return out;
  }

  const parsed = ranges
    .map((r) => {
      const [a, b] = r.split("-").map((n) => parseInt(n, 10));
      return { Start_Milliseconds: a || 0, End_Milliseconds: b || 0 };
    })
    .filter((x) => x.End_Milliseconds > x.Start_Milliseconds);

  if (parsed.length === 0) {
    dbgTime(`Ayah[${verseIdx}]: ❌ All Range strings failed to parse or had 0 Duration.`);
    return rangesToWordTimings(verseIdx, null, wordCount, Fallback_Per_Word_Ms);
  }

  dbgTime(`Ayah[${verseIdx}]: Successfully parsed ${parsed.length} ranges ->`, JSON.stringify(parsed));

  if (parsed.length === wordCount) {
    dbgTime(`Ayah[${verseIdx}]: Count matches perfectly (${parsed.length} tokens). Using exact timestamp mappings.`);
    return parsed;
  }

  // Stretch/squeeze fallback if counts drift (e.g. Kalimah tokenization
  // doesn't line up 1:1 with audio-timestamp segmentation for this Ayah).
  dbgTime(`Ayah[${verseIdx}]: ⚠ Mismatch! Got ${parsed.length} ranges, but Ayah needs ${wordCount} Kalimaat. Stretching timeline evenly.`);
  const totalMs = parsed[parsed.length - 1].End_Milliseconds;
  const out: { Start_Milliseconds: number; End_Milliseconds: number }[] = [];
  for (let i = 0; i < wordCount; i++) {
    out.push({
      Start_Milliseconds: Math.round((i / wordCount) * totalMs),
      End_Milliseconds: Math.round(((i + 1) / wordCount) * totalMs),
    });
  }
  return out;
}

export async function buildTimeline(args: BuildTimelineArgs): Promise<Timeline> {
  const { Ayaat, timestamps, Fallback_Per_Word_Ms } = args;

  dbgTime(`⚡ buildTimeline initiated — Verses to process: ${Ayaat.length}`);

  const Kalimaat: TimelineWord[] = [];
  let cursor = 0;

  for (let vi = 0; vi < Ayaat.length; vi++) {
    const v = Ayaat[vi];

    // Separate total visual tokens from actual spoken audio blocks — the
    // last token may be the trailing Ayah-number marker Glyph, which has
    // no spoken audio of its own.
    const totalWc = v.Kalimaat.length;
    const spokenWc = Math.max(1, totalWc - 1);

    dbgTime(`----------------------------------------------------------------------`);
    dbgTime(`Processing Ayah index [${vi}] (Ayah Number: ${v.Ayah_ID})`);
    dbgTime(`Visual Token Count (totalWc): ${totalWc} | Expected Spoken Words (spokenWc): ${spokenWc}`);

    const ranges = timestamps[vi] ?? null;
    if (ranges) {
      dbgTime(`Ayah[${vi}]: real timestamps provided (${ranges.length} ranges)`);
    } else {
      dbgTime(`Ayah[${vi}]: no real timestamps for this Ayah — using linear fallback`);
    }

    const wt = rangesToWordTimings(vi, ranges, spokenWc, Fallback_Per_Word_Ms);

    for (let wi = 0; wi < totalWc; wi++) {
      // The final token (Ayah-number marker) gets zero Duration, pinned to
      // the end of the Ayah's spoken audio.
      const t = wi < spokenWc
        ? wt[wi]
        : { Start_Milliseconds: wt[wt.length - 1]?.End_Milliseconds ?? 0, End_Milliseconds: wt[wt.length - 1]?.End_Milliseconds ?? 0 };

      Kalimaat.push({
        verseIdx: vi,
        Kalimah_Index: wi,
        Start_Milliseconds: t.Start_Milliseconds,
        End_Milliseconds: t.End_Milliseconds,
      });
    }

    const verseDur = wt[wt.length - 1]?.End_Milliseconds ?? (spokenWc * Fallback_Per_Word_Ms);
    dbgTime(`Ayah calculated final timeline boundary: ${verseDur}ms`);
    cursor = Math.max(cursor, verseDur);
  }

  const bodyEndMs = cursor;
  dbgTime(`======================================================================`);
  dbgTime(`🏁 buildTimeline Complete!`);
  dbgTime(`Total Kalimah timeline events generated: ${Kalimaat.length}`);
  dbgTime(`Final timeline runtime (bodyEndMs): ${bodyEndMs}ms`);

  return {
    bodyStartMs: 0,
    bodyEndMs,
    totalMs: bodyEndMs,
    Kalimaat,
  };
}

/** Locate the Active Kalimah at time t */
export function activeWordAt(timeline: Timeline, timeMs: number): TimelineWord | null {
  if (timeMs < timeline.bodyStartMs || timeMs >= timeline.bodyEndMs) return null;
  if (lastTimeline !== timeline) {
    lastTimeline = timeline;
    lastIndex = 0;
  }

  const cached = timeline.Kalimaat[lastIndex];
  if (cached && timeMs >= cached.Start_Milliseconds && timeMs < cached.End_Milliseconds) return cached;

  let lo = 0;
  let hi = timeline.Kalimaat.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const w = timeline.Kalimaat[mid];
    if (timeMs < w.Start_Milliseconds) hi = mid - 1;
    else if (timeMs >= w.End_Milliseconds) lo = mid + 1;
    else {
      lastIndex = mid;
      return w;
    }
  }
  return timeline.Kalimaat[timeline.Kalimaat.length - 1] ?? null;
}