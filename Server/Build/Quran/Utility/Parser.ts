import * as File_System from "fs";

export interface Reference {
  Surah: number;
  Ayah: number;
  Kalimah: number;
}

export interface Page_Range {
  Start: Reference;
  End: Reference;
}

export function Parse_Reference(Reference_String: string): Reference {
  const [Surah_String, Rest_String] = Reference_String.split(":");
  const [Ayah_String, Kalimah_String] = Rest_String.split(".");
  return { 
    Surah: Number(Surah_String), 
    Ayah: Number(Ayah_String), 
    Kalimah: Number(Kalimah_String) 
  };
}

export function Parse_Page_Range(Range_String: string): Page_Range {
  const [Start_String, End_String] = Range_String.split("-");
  return { 
    Start: Parse_Reference(Start_String), 
    End: Parse_Reference(End_String) 
  };
}

export function Read_JavaScript_Object_Notation_File<Type = unknown>(File_Path: string): Type | null {
  try {
    if (File_System.existsSync(File_Path)) {
      return JSON.parse(File_System.readFileSync(File_Path, "utf-8")) as Type;
    }
  } catch (Error_Instance) {
    console.warn(`[Warning] error parsing JSON at: ${File_Path}`);
  }
  return null;
}

export function Extract_Ayaat_Array(Raw_Surah_Text: unknown): unknown[] {
  if (Array.isArray(Raw_Surah_Text)) {
    return Raw_Surah_Text;
  } else if (Raw_Surah_Text && typeof Raw_Surah_Text === "object") {
    const Object_Instance = Raw_Surah_Text as Record<string, unknown>;
    if (Array.isArray(Object_Instance.Ayah)) return Object_Instance.Ayah;
    if (Array.isArray(Object_Instance.text)) return Object_Instance.text;
    if (Array.isArray(Object_Instance.Ayaat)) return Object_Instance.Ayaat;

    const Keys_Array = Object.keys(Object_Instance)
      .filter((Key_Item) => !isNaN(parseInt(Key_Item, 10)))
      .sort((First_Key, Second_Key) => parseInt(First_Key, 10) - parseInt(Second_Key, 10));
    if (Keys_Array.length > 0) {
      return Keys_Array.map((Key_Item) => Object_Instance[Key_Item]);
    }
  }
  return [];
}

export function Extract_Ayah_String(Item_Value: unknown): string {
  if (typeof Item_Value === "string") return Item_Value;
  if (typeof Item_Value === "number") return String(Item_Value);
  if (Item_Value && typeof Item_Value === "object") {
    const Object_Instance = Item_Value as Record<string, unknown>;
    if (typeof Object_Instance.text === "string") return Object_Instance.text;
    if (typeof Object_Instance.text === "string") return Object_Instance.text;
    if (typeof Object_Instance.Ayah === "string") return Object_Instance.Ayah;
    if (typeof Object_Instance.Translation === "string") return Object_Instance.Translation;
    if (typeof Object_Instance.tafsir === "string") return Object_Instance.tafsir;
  }
  return Item_Value ? String(Item_Value) : "";
}

export function Split_Into_Kalimaat(Text_Value: string | null | undefined): string[] {
  if (!Text_Value || typeof Text_Value !== "string") return [];
  const Trimmed_Text: string = Text_Value.trim();
  if (!Trimmed_Text) return [];
  return Trimmed_Text.split(/\s+/);
}