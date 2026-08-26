import * as Path_Module from "node:path";
import { fileURLToPath as File_URL_To_Path } from "node:url";

const File_Name_Path: string = File_URL_To_Path(import.meta.url);
const Directory_Name_Path: string = Path_Module.dirname(File_Name_Path);

export const Server_Root_Directory_Path: string = Path_Module.resolve(
  Directory_Name_Path,
  "..",
  ".."
);

export const Aid_Data_Directory_Path: string = Path_Module.join(
  Server_Root_Directory_Path,
  "Data",
  "Aid"
);
export const Aid_Adiyah_Data_Directory_Path: string = Path_Module.join(
  Aid_Data_Directory_Path,
  "Dua"
);
export const Aid_Articles_Data_Directory_Path: string = Path_Module.join(
  Aid_Data_Directory_Path,
  "Articles"
);

export const Aid_Output_Directory_Path: string = Path_Module.join(
  Server_Root_Directory_Path,
  "Asset",
  "Corpus",
  "Aid"
);
export const Aid_Adiyah_Output_Database_Path: string = Path_Module.join(
  Aid_Output_Directory_Path,
  "Dua.db"
);
export const Aid_Articles_Output_Database_Path: string = Path_Module.join(
  Aid_Output_Directory_Path,
  "Article.db"
);

export const Aid_Names_Data_Directory_Path: string = Path_Module.join(
  Aid_Data_Directory_Path,
  "Names"
);
export const Aid_Names_Output_Database_Path: string = Path_Module.join(
  Aid_Output_Directory_Path,
  "Names.db"
);

export const Aid_Pillars_Data_Directory_Path: string = Path_Module.join(
  Aid_Data_Directory_Path,
  "Pillars"
);
export const Aid_Pillars_Output_Database_Path: string = Path_Module.join(
  Aid_Output_Directory_Path,
  "Pillars.db"
);

export const Aid_Prophets_Data_Directory_Path: string = Path_Module.join(
  Aid_Data_Directory_Path,
  "Prophets"
);
export const Aid_Prophets_Output_Database_Path: string = Path_Module.join(
  Aid_Output_Directory_Path,
  "Prophets.db"
);

export const Aid_Schools_Data_Directory_Path: string = Path_Module.join(
  Aid_Data_Directory_Path
);
export const Aid_Schools_Output_Database_Path: string = Path_Module.join(
  Aid_Output_Directory_Path,
  "Schools.db"
);