import * as File_System_Module from "node:fs";

export function Clean_String_Value(
  Input_String_Value: unknown
): string {
  if (typeof Input_String_Value !== "string") return "";
  return Input_String_Value.trim().replace(/^["']|["']$/g, "");
}

export function Read_JavaScript_Object_Notation_File_Data(
  File_Path_String: string
): unknown {
  try {
    const Raw_File_Content_Text = File_System_Module.readFileSync(
      File_Path_String,
      "utf-8"
    );
    return JSON.parse(Raw_File_Content_Text);
  } catch {
    return null;
  }
}