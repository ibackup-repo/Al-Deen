import * as File_System_Module from "fs";
import * as Path_Module from "path";

export function Should_Rebuild_Database(
  Target_Database_Path_String: string,
  Source_Directory_Path_String: string,
  Should_Force_Execution: boolean = false
): boolean {
  if (Should_Force_Execution) return true;

  if (!File_System_Module.existsSync(Target_Database_Path_String)) return true;

  const Database_File_Statistics = File_System_Module.statSync(
    Target_Database_Path_String
  );

  function Check_Directory_Modified_Status(
    Directory_Path_String: string
  ): boolean {
    if (!File_System_Module.existsSync(Directory_Path_String)) return false;

    const Directory_Entries_List = File_System_Module.readdirSync(
      Directory_Path_String,
      { withFileTypes: true }
    );

    for (const Directory_Entry_Item of Directory_Entries_List) {
      const Full_Entry_Path_String: string = Path_Module.join(
        Directory_Path_String,
        Directory_Entry_Item.name
      );

      if (Directory_Entry_Item.isDirectory()) {
        if (Check_Directory_Modified_Status(Full_Entry_Path_String)) {
          return true;
        }
      } else {
        const File_Statistics = File_System_Module.statSync(
          Full_Entry_Path_String
        );
        if (File_Statistics.mtimeMs > Database_File_Statistics.mtimeMs) {
          return true;
        }
      }
    }
    return false;
  }

  return Check_Directory_Modified_Status(Source_Directory_Path_String);
}