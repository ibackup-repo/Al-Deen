// @/Components/Library/Use-Chess-Worker.ts
import { useEffect, useRef } from "react";
import type { Engine_Move } from "./Chess-Engine";

export function Use_Chess_Worker() {
  const Worker_Reference = useRef<Worker | null>(null);
  const Resolvers_Reference = useRef<Map<string, (value: any) => void>>(new Map());

  useEffect(() => {
    // Instantiate background thread instance utilizing standard asset URLs
    Worker_Reference.current = new Worker(
      new URL("./Chess-Worker.ts", import.meta.url),
      { type: "module" }
    );

    Worker_Reference.current.onmessage = (e: MessageEvent) => {
      const { id, type, data, error } = e.data;
      const resolve = Resolvers_Reference.current.get(id);
      
      if (resolve) {
        Resolvers_Reference.current.delete(id);
        if (type === "SUCCESS") {
          resolve(data);
        } else {
          console.error("Chess Engine Worker Error:", error);
          resolve(null);
        }
      }
    };

    return () => {
      Worker_Reference.current?.terminate();
    };
  }, []);

  const Run_Task = (type: string, payload: any): Promise<any> => {
    return new Promise((resolve) => {
      if (!Worker_Reference.current) {
        resolve(null);
        return;
      }
      const id = crypto.randomUUID();
      Resolvers_Reference.current.set(id, resolve);
      Worker_Reference.current.postMessage({ id, type, ...payload });
    });
  };

  return {
    Find_Best_Move: (fen: string, depth?: number): Promise<{ move: Engine_Move | null; score: number }> =>
      Run_Task("FIND_BEST_MOVE", { fen, depth }),
      
    Pick_Engine_Move: (fen: string, Elo: number): Promise<Engine_Move | null> =>
      Run_Task("PICK_ENGINE_MOVE", { fen, Elo }),
      
    Find_Threat: (fen: string): Promise<Engine_Move | null> =>
      Run_Task("FIND_THREAT", { fen }),
      
    Get_Best_Line: (fen: string, Plies?: number, Search_Depth?: number): Promise<Engine_Move[]> =>
      Run_Task("GET_BEST_LINE", { fen, Plies, Search_Depth }),
  };
}