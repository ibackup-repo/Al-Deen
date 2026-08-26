import * as File_System_Module from "node:fs";
import { Hadith_Data_Directory_Path } from "../Config.ts";

export async function Ensure_Hadith_Data_Directory_Exists(): Promise<void> {
  if (!File_System_Module.existsSync(Hadith_Data_Directory_Path)) {
    File_System_Module.mkdirSync(Hadith_Data_Directory_Path, {
      recursive: true,
    });
  }
}