import * as File_System_Module from "fs";

export function Clean_String_Content(Target_Input_Content: unknown): string {
  if (typeof Target_Input_Content !== "string") return "";
  return Target_Input_Content.trim().replace(/^["']|["']$/g, "");
}

export function Read_JavaScript_Object_Notation_File(
  File_Path_String: string
): unknown {
  try {
    const File_Content_String: string = File_System_Module.readFileSync(
      File_Path_String,
      "utf-8"
    );
    return JSON.parse(File_Content_String);
  } catch {
    return null;
  }
}