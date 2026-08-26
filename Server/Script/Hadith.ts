import * as File_System_Module from "node:fs";
import * as Path_Module from "node:path";

const Data_Hadith_Directory_Path: string = Path_Module.resolve(
  process.cwd(),
  "Server",
  "Data",
  "Hadith"
);

const Arabic_Introduction_Directory_Path: string = Path_Module.join(
  Data_Hadith_Directory_Path,
  "Arabic",
  "Sahih",
  "Muslim",
  "Introduction"
);

const English_Introduction_Directory_Path: string = Path_Module.join(
  Data_Hadith_Directory_Path,
  "Translation",
  "English",
  "Sahih",
  "Muslim",
  "Introduction"
);

const Ahmed_Baset_Muslim_Introduction_Uniform_Resource_Locator: string =
  "https://Raw_Storage_Data.githubusercontent.com/AhmedBaset/Hadith-json/v1.2.0/db/by_chapter/the_9_books/muslim/introduction.json";

interface Hadith_Payload {
  id: number;
  Chapter_ID: number;
  bookId: number;
  Arabic: string;
  english: {
    narrator: string;
    Text: string;
  };
}

interface Chapter_Payload {
  hadiths?: Hadith_Payload[];
  data?: Hadith_Payload[];
  [Key_Name: string]: unknown;
}

function Clean_String_Content(Source_String: string): string {
  if (!Source_String) return "";
  return Source_String
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["']|["']$/g, "");
}

async function Download_Muslim_Introduction(): Promise<void> {
  console.log("Fetching Sahih Muslim Introduction from AhmedBaset v1.2.0...");

  try {
    const Network_Response: Response = await fetch(
      Ahmed_Baset_Muslim_Introduction_Uniform_Resource_Locator
    );

    if (!Network_Response.ok) {
      throw new Error(
        `HTTP error! Status: ${Network_Response.status} ${Network_Response.statusText}`
      );
    }

    const JavaScript_Object_Notation_Data =
      (await Network_Response.json()) as Hadith_Payload[] | Chapter_Payload;

    let Ahadith_Collection: Hadith_Payload[] = [];
    if (Array.isArray(JavaScript_Object_Notation_Data)) {
      Ahadith_Collection = JavaScript_Object_Notation_Data;
    } else if (
      JavaScript_Object_Notation_Data &&
      typeof JavaScript_Object_Notation_Data === "object"
    ) {
      if (Array.isArray(JavaScript_Object_Notation_Data.hadiths)) {
        Ahadith_Collection = JavaScript_Object_Notation_Data.hadiths;
      } else if (Array.isArray(JavaScript_Object_Notation_Data.data)) {
        Ahadith_Collection = JavaScript_Object_Notation_Data.data;
      } else {
        const Found_Array_Property = Object.values(
          JavaScript_Object_Notation_Data
        ).find((Value_Item) => Array.isArray(Value_Item));
        if (Found_Array_Property) {
          Ahadith_Collection = Found_Array_Property as Hadith_Payload[];
        }
      }
    }

    if (!Ahadith_Collection || Ahadith_Collection.length === 0) {
      throw new Error("No hadiths found in the response payload.");
    }

    if (!File_System_Module.existsSync(Arabic_Introduction_Directory_Path)) {
      File_System_Module.mkdirSync(Arabic_Introduction_Directory_Path, {
        recursive: true,
      });
    }
    if (!File_System_Module.existsSync(English_Introduction_Directory_Path)) {
      File_System_Module.mkdirSync(English_Introduction_Directory_Path, {
        recursive: true,
      });
    }

    let Saved_Arabic_Files_Count: number = 0;
    let Saved_English_Files_Count: number = 0;

    Ahadith_Collection.forEach(
      (Hadith_Item_Object: Hadith_Payload, Index_Identifier: number) => {
        const File_Number_Identifier: number = Index_Identifier + 1;
        const Cleaned_Arabic_Text: string = Clean_String_Content(
          Hadith_Item_Object.Arabic
        );

        if (Cleaned_Arabic_Text) {
          const Arabic_File_Path: string = Path_Module.join(
            Arabic_Introduction_Directory_Path,
            `${File_Number_Identifier}.json`
          );
          const Identifier_In_Book: number = File_Number_Identifier;
          const Global_Identifier: number =
            Hadith_Item_Object.id ?? File_Number_Identifier;

          const Arabic_Data_Array: (string | number)[] = [
            Cleaned_Arabic_Text,
            Identifier_In_Book,
            Global_Identifier,
          ];

          File_System_Module.writeFileSync(
            Arabic_File_Path,
            JSON.stringify(Arabic_Data_Array, null, 2),
            "utf-8"
          );
          Saved_Arabic_Files_Count++;
        }

        if (Hadith_Item_Object.english) {
          const Narrator_Text: string = Clean_String_Content(
            Hadith_Item_Object.english.narrator
          );
          const English_Hadith_Text: string = Clean_String_Content(
            Hadith_Item_Object.english.text
          );

          if (Narrator_Text || English_Hadith_Text) {
            const English_File_Path: string = Path_Module.join(
              English_Introduction_Directory_Path,
              `${File_Number_Identifier}.json`
            );
            const English_Data_Array: string[] = [];

            if (Narrator_Text) English_Data_Array.push(Narrator_Text);
            if (English_Hadith_Text) English_Data_Array.push(English_Hadith_Text);

            File_System_Module.writeFileSync(
              English_File_Path,
              JSON.stringify(English_Data_Array, null, 2),
              "utf-8"
            );
            Saved_English_Files_Count++;
          }
        }
      }
    );

    console.log(`\nSuccessfully processed Muslim Introduction!`);
    console.log(
      ` - Saved Arabic arrays [text, idInBook, id]: ${Saved_Arabic_Files_Count}`
    );
    console.log(
      ` - Saved English arrays [narrator, text]: ${Saved_English_Files_Count}`
    );
  } catch (Execution_Error) {
    console.error(
      "Failed to download or parse Introduction:",
      Execution_Error
    );
    process.exit(1);
  }
}

Download_Muslim_Introduction();