import * as Path_Module from "node:path";
import { fileURLToPath as File_URL_To_Path } from "node:url";

const File_Name_Path: string = File_URL_To_Path(import.meta.url);
const Directory_Name_Path: string = Path_Module.dirname(File_Name_Path);

// Resolves to Server/
export const Server_Root_Directory_Path: string = Path_Module.resolve(
  Directory_Name_Path,
  "..",
  ".."
);

// Base Input & Output Directories
export const Hadith_Data_Directory_Path: string = Path_Module.join(
  Server_Root_Directory_Path,
  "Data",
  "Hadith"
);
export const Hadith_Output_Directory_Path: string = Path_Module.join(
  Server_Root_Directory_Path,
  "Asset",
  "Corpus",
  "Hadith"
);

// Domain Specific Input Directories
export const Hadith_Arabic_Data_Directory_Path: string = Path_Module.join(
  Hadith_Data_Directory_Path,
  "Arabic"
);
export const Hadith_Translation_Data_Directory_Path: string = Path_Module.join(
  Hadith_Data_Directory_Path,
  "Translation"
);
export const Hadith_Transliteration_Data_Directory_Path: string = Path_Module.join(
  Hadith_Data_Directory_Path,
  "Transliteration"
);

// Domain Specific Output Directories
export const Hadith_Arabic_Output_Directory_Path: string = Path_Module.join(
  Hadith_Output_Directory_Path,
  "Arabic"
);
export const Hadith_Translation_Output_Directory_Path: string = Path_Module.join(
  Hadith_Output_Directory_Path,
  "Translation"
);
export const Hadith_Transliteration_Output_Directory_Path: string = Path_Module.join(
  Hadith_Output_Directory_Path,
  "Transliteration"
);