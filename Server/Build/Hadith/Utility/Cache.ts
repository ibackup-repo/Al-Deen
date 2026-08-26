import * as File_System_Module from "node:fs";
import * as Path_Module from "node:path";

export function Should_Rebuild_Database(
  Target_Database_Path_String: string,
  Source_Directory_Path_String: string,
  Force_Rebuild_Flag: boolean = false
): boolean {
  if (Force_Rebuild_Flag) return true;

  if (!File_System_Module.existsSync(Target_Database_Path_String)) return true;

  const Target_Database_Statistics_Object = File_System_Module.statSync(Target_Database_Path_String);

  function Check_Directory_Modified_Status(Directory_Path_String: string): boolean {
    if (!File_System_Module.existsSync(Directory_Path_String)) return false;

    const Directory_Entry_Collection = File_System_Module.readdirSync(Directory_Path_String, {
      withFileTypes: true,
    });

    for (const Directory_Entry_Object of Directory_Entry_Collection) {
      const Full_File_Path_String = Path_Module.join(Directory_Path_String, Directory_Entry_Object.name);

      if (Directory_Entry_Object.isDirectory()) {
        if (Check_Directory_Modified_Status(Full_File_Path_String)) return true;
      } else {
        const File_Statistics_Object = File_System_Module.statSync(Full_File_Path_String);
        if (File_Statistics_Object.mtimeMs > Target_Database_Statistics_Object.mtimeMs) {
          return true;
        }
      }
    }
    return false;
  }

  return Check_Directory_Modified_Status(Source_Directory_Path_String);
}