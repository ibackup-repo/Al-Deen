import * as File_System from "fs";
import * as Path_Module from "path";
import { Force_Rebuild } from "../Config.js";

export function Should_Rebuild_Database(
  Target_Database_Path: string,
  Source_Files_Directory: string
): boolean {
  if (Force_Rebuild || !File_System.existsSync(Target_Database_Path)) return true;

  const Database_Modified_Time: number = File_System.statSync(Target_Database_Path).mtimeMs;

  function Is_Modified(Directory_Path: string): boolean {
    const Entries_Array: File_System.Dirent[] = File_System.readdirSync(Directory_Path, { withFileTypes: true });
    for (const Entry_Item of Entries_Array) {
      const Full_Path: string = Path_Module.join(Directory_Path, Entry_Item.name);
      if (Entry_Item.isDirectory()) {
        if (Is_Modified(Full_Path)) return true;
      } else if (Entry_Item.isFile()) {
        if (File_System.statSync(Full_Path).mtimeMs > Database_Modified_Time) {
          return true;
        }
      }
    }
    return false;
  }

  return Is_Modified(Source_Files_Directory);
}