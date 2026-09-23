import { Ensure_Data_Exists } from "./Utility/Downloader.js";
import { Build_Core_Database } from "./DB/Core.js";
import { Build_Translation_Databases } from "./DB/Translation.js";
import { Build_Transliteration_Databases } from "./DB/Transliteration.js";
import { Build_Tafsir_Databases } from "./DB/Tafsir.js";
import { Build_Information_Databases } from "./DB/Information.js";

async function Run_Build(): Promise<void> {
  const Start_Time: number = Date.now();
  console.log("Checking dataset requirements...");
  await Ensure_Data_Exists();

  console.log("\n--- Starting Modular Quran Corpus Build ---");

  Build_Core_Database();
  Build_Translation_Databases();
  Build_Transliteration_Databases();
  Build_Tafsir_Databases();
  Build_Information_Databases();

  const Duration: string = ((Date.now() - Start_Time) / 1000).toFixed(2);
  console.log(`\nAll modular databases are up to date! (Completed in ${Duration}s)`);
}

Run_Build().catch((Error_Instance: unknown) => {
  console.error("error building Modular Quran Corpus:", Error_Instance);
  process.exit(1);
});