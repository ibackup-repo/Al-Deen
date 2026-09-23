import { Ensure_Hadith_Data_Directory_Exists } from "./Utility/Download.js";
import { Build_Arabic_Hadith_Databases } from "./DB/Arabic.js";
import { Build_Translation_Databases } from "./DB/Translation.js";
import { Build_Transliteration_Databases } from "./DB/Transliteration.js";

async function Run_Build_Process_Async(): Promise<void> {
  const Is_Force_Rebuild_Flag =
    process.argv.includes("--force") || process.argv.includes("-f");

  const Process_Start_Timestamp_Milliseconds = Date.now();
  console.log("Checking Hadith dataset requirements...");
  await Ensure_Hadith_Data_Directory_Exists();

  console.log(
    `\n--- Starting Modular Hadith Corpus Build ${
      Is_Force_Rebuild_Flag ? "(FORCED)" : ""
    } ---`
  );

  Build_Arabic_Hadith_Databases(Is_Force_Rebuild_Flag);
  Build_Translation_Databases(Is_Force_Rebuild_Flag);
  Build_Transliteration_Databases(Is_Force_Rebuild_Flag);

  const Total_Duration_Seconds_String = (
    (Date.now() - Process_Start_Timestamp_Milliseconds) /
    1000
  ).toFixed(2);
  console.log(
    `\nAll Hadith databases are up to date! (Completed in ${Total_Duration_Seconds_String}s)`
  );
}

Run_Build_Process_Async().catch((Error_Object: unknown) => {
  console.error("error building Modular Hadith Corpus:", Error_Object);
  process.exit(1);
});