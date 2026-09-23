import * as File_System from "fs";
import * as Path_Module from "path";

const Footnote_Directory: string = Path_Module.join(
  process.cwd(),
  "Server",
  "Data",
  "Quran",
  "Surah",
  "Translation",
  "English",
  "Saheeh-International",
  "Footnote"
);

const Translation_Identifier: number = 20;

async function Fetch_Footnote_Text(Footnote_Identifier: number): Promise<string | null> {
  try {
    const Network_Response: Response = await fetch(
      `https://api.quran.com/api/v4/foot_notes/${Footnote_Identifier}`
    );
    if (!Network_Response.ok) return null;
    const Json_Data: Record<string, any> = await Network_Response.json();
    return Json_Data.foot_note?.text?.replace(/<[^>]*>/g, "").trim() || null;
  } catch {
    return null;
  }
}

async function Build_All_Footnotes(): Promise<void> {
  if (!File_System.existsSync(Footnote_Directory)) {
    File_System.mkdirSync(Footnote_Directory, { recursive: true });
  }

  console.log("Starting footnote extraction for 114 Suwar...");

  for (let Surah_Number: number = 1; Surah_Number <= 114; Surah_Number++) {
    console.log(`Processing Surah ${Surah_Number}...`);
    const Request_Url: string = `https://api.quran.com/api/v4/quran/translations/${Translation_Identifier}?chapter_number=${Surah_Number}`;

    try {
      const Network_Response: Response = await fetch(Request_Url);
      if (!Network_Response.ok) throw new Error(`HTTP ${Network_Response.status}`);

      const Json_Data: Record<string, any> = await Network_Response.json();
      // FIXED: Lowercase 'translations' matches the actual Quran.com API key
      const Translation_Items: Record<string, any>[] = Json_Data.translations || [];

      const Surah_Footnotes: string[] = [];

      for (const Translation_Item of Translation_Items) {
        const Translation_Text: string = Translation_Item.Text || "";

        // FIXED: Expanded regex to capture various foot_note formats from API
        const matches: RegExpExecArray[] = [
          ...Translation_Text.matchAll(/foot_note(?:_id)?=["']?(\d+)["']?/gi),
        ];
        
        const Footnote_Identifiers: number[] = matches.map((Match_Item: RegExpExecArray) =>
          parseInt(Match_Item[1], 10)
        );

        for (const Footnote_Identifier of Footnote_Identifiers) {
          const Footnote_Text: string | null = await Fetch_Footnote_Text(Footnote_Identifier);
          if (Footnote_Text) {
            Surah_Footnotes.push(Footnote_Text);
          }
          await new Promise((Resolve_Promise: (Value: unknown) => void) =>
            setTimeout(Resolve_Promise, 50)
          );
        }
      }

      const Output_File_Path: string = Path_Module.join(Footnote_Directory, `${Surah_Number}.json`);
      File_System.writeFileSync(
        Output_File_Path,
        JSON.stringify(Surah_Footnotes, null, 2),
        "utf-8"
      );
      console.log(` -> Saved Surah ${Surah_Number} to ${Surah_Number}.json`);
    } catch (Error_Object) {
      // FIXED: Capitalized 'Error' type annotation
      console.error(`Error on Surah ${Surah_Number}:`, (Error_Object as Error).message);
    }
  }

  console.log("Done generating all footnote files.");
}

Build_All_Footnotes();