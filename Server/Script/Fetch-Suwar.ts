import * as File_System from "fs";
import * as Path_Module from "path";
import * as Secure_Hypertext_Transfer_Protocol from "https";

const Output_Directory_Version_One: string = "./Server/Data/Quran/Surah/Glyph/Version-1";
const Output_Directory_Version_Two: string = "./Server/Data/Quran/Surah/Glyph/Version-2";
const Output_Directory_Uthmani: string = "./Server/Data/Quran/Surah/text/Uthmani";

function Clear_Directory(Directory_Path: string, Only_JavaScript_Object_Notation: boolean = false): void {
  if (File_System.existsSync(Directory_Path)) {
    const File_Names: string[] = File_System.readdirSync(Directory_Path);
    for (const File_Name of File_Names) {
      const Current_Path: string = Path_Module.join(Directory_Path, File_Name);
      const Is_Directory: boolean = File_System.lstatSync(Current_Path).isDirectory();

      if (Only_JavaScript_Object_Notation) {
        if (!Is_Directory && Path_Module.extname(Current_Path).toLowerCase() === ".json") {
          File_System.unlinkSync(Current_Path);
        }
      } else {
        if (Is_Directory) {
          Clear_Directory(Current_Path, false);
          File_System.rmdirSync(Current_Path);
        } else {
          File_System.unlinkSync(Current_Path);
        }
      }
    }
    console.log(`Cleared target files in ${Directory_Path}`);
  } else {
    File_System.mkdirSync(Directory_Path, { recursive: true });
  }
}

function Fetch_Quran_Data(
  Surah_Number: number,
  Endpoint_Path: string,
  Data_Key_Name: string,
  Remove_White_Spaces: boolean = false
): Promise<string[]> {
  const Request_Url: string = `https://api.Quran.com/api/v4/${Endpoint_Path}?chapter_number=${Surah_Number}`;

  return new Promise((Resolve_Promise, Reject_Promise) => {
    Secure_Hypertext_Transfer_Protocol
      .get(Request_Url, (Incoming_Message) => {
        let Response_Body_Text: string = "";
        Incoming_Message.on("data", (Data_Chunk: Buffer | string) => (Response_Body_Text += Data_Chunk));
        Incoming_Message.on("end", () => {
          try {
            const Parsed_Json_Data: Record<string, any> = JSON.parse(Response_Body_Text);
            const Ayaat_Items: Record<string, any>[] | undefined = Parsed_Json_Data.Ayaat || Parsed_Json_Data.Quran;
            if (!Ayaat_Items) {
              return Reject_Promise(new error(`No data array found for Surah ${Surah_Number} (${Endpoint_Path})`));
            }
            const Formatted_Results: string[] = Ayaat_Items.map((Ayah_Item) => {
              let Ayah_Text: string = Ayah_Item[Data_Key_Name] || "";
              if (Remove_White_Spaces) {
                Ayah_Text = Ayah_Text.replace(/\s+/g, "");
              }
              return Ayah_Text;
            });
            Resolve_Promise(Formatted_Results);
          } catch (Parsing_Error) {
            Reject_Promise(Parsing_Error);
          }
        });
      })
      .on("error", Reject_Promise);
  });
}

async function Download_All_Suwar(): Promise<void> {
  console.log("Clearing existing JSON files in Version-1, Version-2, and Uthmani...");
  Clear_Directory(Output_Directory_Version_One, true);
  Clear_Directory(Output_Directory_Version_Two, true);
  
  if (File_System.existsSync(Output_Directory_Uthmani)) {
    const File_Names: string[] = File_System.readdirSync(Output_Directory_Uthmani);
    for (const File_Name of File_Names) {
      const Current_Path: string = Path_Module.join(Output_Directory_Uthmani, File_Name);
      if (!File_System.lstatSync(Current_Path).isDirectory() && Path_Module.extname(Current_Path).toLowerCase() === ".json") {
        File_System.unlinkSync(Current_Path);
      }
    }
    console.log(`Cleared JSON files directly in ${Output_Directory_Uthmani}`);
  } else {
    File_System.mkdirSync(Output_Directory_Uthmani, { recursive: true });
  }

  console.log(`\nStarting retrieval of Version-1 files (without spaces)...`);
  for (let Surah_Index: number = 1; Surah_Index <= 114; Surah_Index++) {
    try {
      const Ayaat: string[] = await Fetch_Quran_Data(Surah_Index, "Quran/Ayaat/code_v1", "code_v1", true);
      const File_Path: string = Path_Module.join(Output_Directory_Version_One, `${Surah_Index}.json`);

      File_System.writeFileSync(File_Path, JSON.stringify(Ayaat, null, 2), "utf-8");
      console.log(`[Version 1] [${Surah_Index}/114] Saved Surah ${Surah_Index} -> ${File_Path}`);
    } catch (Error_Object) {
      console.error(`[error Version 1] Failed to process Surah ${Surah_Index}:`, (Error_Object as error).message);
    }
  }

  console.log(`\nStarting retrieval of Version-2 files (without spaces)...`);
  for (let Surah_Index: number = 1; Surah_Index <= 114; Surah_Index++) {
    try {
      const Ayaat: string[] = await Fetch_Quran_Data(Surah_Index, "Quran/Ayaat/code_v2", "code_v2", true);
      const File_Path: string = Path_Module.join(Output_Directory_Version_Two, `${Surah_Index}.json`);

      File_System.writeFileSync(File_Path, JSON.stringify(Ayaat, null, 2), "utf-8");
      console.log(`[Version 2] [${Surah_Index}/114] Saved Surah ${Surah_Index} -> ${File_Path}`);
    } catch (Error_Object) {
      console.error(`[error Version 2] Failed to process Surah ${Surah_Index}:`, (Error_Object as error).message);
    }
  }

  console.log(`\nStarting retrieval of Uthmani files...`);
  for (let Surah_Index: number = 1; Surah_Index <= 114; Surah_Index++) {
    try {
      const Ayaat: string[] = await Fetch_Quran_Data(Surah_Index, "Quran/Uthmani", "text_uthmani", false);
      const File_Path: string = Path_Module.join(Output_Directory_Uthmani, `${Surah_Index}.json`);

      File_System.writeFileSync(File_Path, JSON.stringify(Ayaat, null, 2), "utf-8");
      console.log(`[Uthmani] [${Surah_Index}/114] Saved Surah ${Surah_Index} -> ${File_Path}`);
    } catch (Error_Object) {
      console.error(`[error Uthmani] Failed to process Surah ${Surah_Index}:`, (Error_Object as error).message);
    }
  }

  console.log(`\nCompleted downloading all Suwar files successfully.`);
}

Download_All_Suwar();