import { Build_Adiyah_Database } from "./DB/Dua.js";
import { Build_Articles_Database } from "./DB/Articles.js";
import { Build_Names_Database } from "./DB/Names.js";
import { Build_Pillars_Database } from "./DB/Pillars.js";
import { Build_Prophets_Database } from "./DB/Prophets.js";
import { Build_Schools_Database } from "./DB/Schools.js";

async function Execute_Corpus_Build_Process(): Promise<void> {
  const Should_Force_Execution: boolean =
    process.argv.includes("--force") || process.argv.includes("-f");

  const Execution_Start_Time_Milliseconds: number = Date.now();
  console.log(
    `\n--- Starting Modular Aid Corpus Build ${
      Should_Force_Execution ? "(FORCED)" : ""
    } ---`
  );

  Build_Adiyah_Database(Should_Force_Execution);
  Build_Articles_Database(Should_Force_Execution);
  Build_Names_Database(Should_Force_Execution);
  Build_Pillars_Database(Should_Force_Execution);
  Build_Prophets_Database(Should_Force_Execution);
  Build_Schools_Database(Should_Force_Execution);

  const Execution_Duration_Seconds: string = (
    (Date.now() - Execution_Start_Time_Milliseconds) /
    1000
  ).toFixed(2);
  console.log(
    `\nAll Aid databases are up to date! (Completed in ${Execution_Duration_Seconds}s)`
  );
}

Execute_Corpus_Build_Process().catch((Error_Context: unknown) => {
  console.error("error building Modular Aid Corpus:", Error_Context);
  process.exit(1);
});