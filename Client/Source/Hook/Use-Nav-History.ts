// Layer/Middle/Hook/Use-Nav-History.ts
// Singleton in-memory navigation History for de-duplicated "back" behavior.
//
// We track every distinct path the User lands on (consecutive duplicates are
// collapsed). When the User clicks Back, we pop entries off the Stack until
// we find one that differs from the current path, then return it.
// If nothing remains, the caller can fall back to URL-Segment climbing.

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const Stack: string[] = [];
let Last_Back_Target: string | null = null;

/** Climb one URL Segment. Returns "/" when at the root. */
function Climb_One_Segment(path: string): string {
  const Segments = path.replace(/\/$/, "").split("/").filter(Boolean);
  if (Segments.length <= 1) return "/";
  Segments.pop();
  return "/" + Segments.join("/");
}

export const Nav_History = {
  push(path: string) {
    if (Stack[Stack.length - 1] === path) return;
    if (Stack.length >= 2 && Stack[Stack.length - 2] === path) {
      Stack.pop();
      return;
    }
    Stack.push(path);
    if (Stack.length > 100) Stack.splice(0, Stack.length - 100);
  },
  /**
   * Pop entries equal to Current_Path, then return the next distinct path
   * (also popping it). If the result would ping-pong with the previous back
   * target, climb one URL Segment instead. Returns null if nothing useful.
   */
  Pop_Distinct(Current_Path: string): string | null {
    while (Stack.length && Stack[Stack.length - 1] === Current_Path) Stack.pop();
    while (Stack.length >= 2 && Stack[Stack.length - 1] === Stack[Stack.length - 2]) Stack.pop();
    const next = Stack.pop();
    const Candidate = next && next !== Current_Path ? next : null;

    // Ping-pong detection: if going back would re-target the same path we
    // just back-navigated to, climb one slug instead.
    if (Candidate && Candidate === Last_Back_Target) {
      const Climbed = Climb_One_Segment(Current_Path);
      Last_Back_Target = Climbed;
      return Climbed;
    }
    if (Candidate) {
      Last_Back_Target = Candidate;
      return Candidate;
    }
    // No History → climb one slug as the safe default.
    const Climbed = Climb_One_Segment(Current_Path);
    if (Climbed === Current_Path) return null;
    Last_Back_Target = Climbed;
    return Climbed;
  },
  Reset_Ping_Pong() {
    Last_Back_Target = null;
  },
  size() {
    return Stack.length;
  },
};

/** Mount once near the router root to record visits. */
export function Use_Nav_History_Tracker() {
  const Location_Data = useLocation();
  useEffect(() => {
    Nav_History.push(Location_Data.pathname);
  }, [Location_Data.pathname]);
}
