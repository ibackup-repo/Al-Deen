import * as Path_Module from "path";
import { fileURLToPath as File_Uniform_Resource_Locator_To_Path } from "url";

const File_Name: string = File_Uniform_Resource_Locator_To_Path(import.meta.url);
const Directory_Name: string = Path_Module.dirname(File_Name);

export const Force_Rebuild: boolean = process.argv.includes("--force");

export const Server_Root: string = Path_Module.resolve(Directory_Name, "..", "..");
export const Workspace_Root: string = Path_Module.resolve(Directory_Name, "..", "..", "..");

export const Github_User: string = "hyrenum";
export const Github_Repository: string = "ios-joyful-revamp";
export const Release_Tag: string = "1.0.0";
export const Archive_Name: string = "quran_data.tar.gz";

export const Release_Uniform_Resource_Locator: string = `https://github.com/${Github_User}/${Github_Repository}/releases/download/${Release_Tag}/${Archive_Name}`;

export const Data_Directory: string = Path_Module.join(Server_Root, "Data");
export const Quran_Directory: string = Path_Module.join(Data_Directory, "Quran");
export const Metadata_Directory: string = Path_Module.join(Quran_Directory, "Meta");
export const Surah_Directory: string = Path_Module.join(Quran_Directory, "Surah");

export const Translation_Base_Directory: string = Path_Module.join(Surah_Directory, "Translation");
export const Transliteration_Base_Directory: string = Path_Module.join(Surah_Directory, "Transliteration");
export const Tafsir_Base_Directory: string = Path_Module.join(Surah_Directory, "Tafsir");
export const Information_Base_Directory: string = Path_Module.join(Surah_Directory, "Information");

export const Presentation_Version_Two_Directory: string = Path_Module.join(Surah_Directory, "Presentation-Form-A", "Glyph-Based");
export const Presentation_Version_One_Directory: string = Path_Module.join(Surah_Directory, "Presentation-Form-A", "Ligature-Based");

export const Corpus_Quran_Output_Directory: string = Path_Module.resolve(Server_Root, "Asset", "Corpus", "Quran");