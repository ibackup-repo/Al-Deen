// @/Components/Library/Chess-Worker.ts
import { Find_Best_Move, Pick_Engine_Move, Find_Threat, Get_Best_Line } from "./Chess-Engine";
import { Chess } from "chess.js";

self.onmessage = async (e: MessageEvent) => {
  const { id, type, fen, depth, Elo, Plies, Search_Depth } = e.data;
  
  try {
    const game = new Chess(fen);

    switch (type) {
      case "FIND_BEST_MOVE": {
        const result = Find_Best_Move(game, depth);
        self.postMessage({ id, type: "SUCCESS", data: result });
        break;
      }
      case "PICK_ENGINE_MOVE": {
        const result = Pick_Engine_Move(game, Elo);
        self.postMessage({ id, type: "SUCCESS", data: result });
        break;
      }
      case "FIND_THREAT": {
        const result = Find_Threat(game);
        self.postMessage({ id, type: "SUCCESS", data: result });
        break;
      }
      case "GET_BEST_LINE": {
        const result = Get_Best_Line(game, Plies, Search_Depth);
        self.postMessage({ id, type: "SUCCESS", data: result });
        break;
      }
      default:
        throw new Error(`Unknown background task action type: ${type}`);
    }
  } catch (error: any) {
    self.postMessage({ id, type: "ERROR", error: error.message });
  }
};