import * as File_System_Module from "fs";
import * as Path_Module from "path";
import Database from "better-sqlite3";
import {
  Aid_Schools_Data_Directory_Path,
  Aid_Schools_Output_Database_Path,
} from "../Config.js";
import { Should_Rebuild_Database } from "../Utility/Cache.js";
import {
  Read_JavaScript_Object_Notation_File,
  Clean_String_Content,
} from "../Utility/Parser.js";

interface Raw_School_Entry {
  id: string;
  name: string;
  founder: string;
  regions: string;
  description: string;
}

interface Raw_Branch_Entry {
  id: string;
  name: string;
  summary: string;
  schools: Raw_School_Entry[];
}

interface Raw_Schools_Payload {
  branches: Raw_Branch_Entry[];
}

interface School_Record {
  ID: number;
  Branch_ID: number;
  Slug_Text: string;
  School_Name: string;
  Founder_Name: string;
  Regions_Text: string;
  Description_Text: string;
}

interface Branch_Record {
  ID: number;
  Slug_Text: string;
  Branch_Name: string;
  Summary_Text: string;
  Schools_Collection: School_Record[];
}

export function Build_Schools_Database(
  Should_Force_Execution: boolean = false
): void {
  if (!File_System_Module.existsSync(Aid_Schools_Data_Directory_Path)) return;

  if (
    !Should_Rebuild_Database(
      Aid_Schools_Output_Database_Path,
      Aid_Schools_Data_Directory_Path,
      Should_Force_Execution
    )
  ) {
    console.log("[Skipped] Aid/Schools.db is up to date.");
    return;
  }

  const Output_Directory_Path: string = Path_Module.dirname(
    Aid_Schools_Output_Database_Path
  );
  if (!File_System_Module.existsSync(Output_Directory_Path)) {
    File_System_Module.mkdirSync(Output_Directory_Path, { recursive: true });
  }

  if (File_System_Module.existsSync(Aid_Schools_Output_Database_Path)) {
    File_System_Module.unlinkSync(Aid_Schools_Output_Database_Path);
  }

  console.log("Compiling Aid Database: Schools.db");
  const Database_Instance = new Database(Aid_Schools_Output_Database_Path);
  Database_Instance.pragma("journal_mode = WAL");
  Database_Instance.pragma("synchronous = NORMAL");

  Database_Instance.exec(`
    CREATE TABLE IF NOT EXISTS Branch (
      ID INTEGER PRIMARY KEY,
      Slug TEXT NOT NULL,
      Name TEXT NOT NULL,
      Summary TEXT NOT NULL,
      School_Count INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS School (
      ID INTEGER PRIMARY KEY,
      Branch_ID INTEGER NOT NULL,
      Slug TEXT NOT NULL,
      Name TEXT NOT NULL,
      Founder TEXT NOT NULL,
      Regions TEXT NOT NULL,
      Description TEXT NOT NULL,
      FOREIGN KEY (Branch_ID) REFERENCES Branch(ID)
    );
  `);

  const Insert_Branch_Statement = Database_Instance.prepare(`
    INSERT INTO Branch (
      ID,
      Slug,
      Name,
      Summary,
      School_Count
    ) VALUES (?, ?, ?, ?, ?)
  `);

  const Insert_School_Statement = Database_Instance.prepare(`
    INSERT INTO School (
      ID,
      Branch_ID,
      Slug,
      Name,
      Founder,
      Regions,
      Description
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const Directory_Entries_List: string[] = File_System_Module.readdirSync(
    Aid_Schools_Data_Directory_Path
  ).filter((File_Name_Item: string) => File_Name_Item.endsWith(".json"));

  Directory_Entries_List.sort(
    (First_File_Name: string, Second_File_Name: string) =>
      First_File_Name.localeCompare(Second_File_Name, undefined, {
        numeric: true,
        sensitivity: "base",
      })
  );

  const Branches_Collection: Branch_Record[] = [];
  let Global_Branch_Counter_Number: number = 1;
  let Global_School_Counter_Number: number = 1;

  for (const File_Name_Item of Directory_Entries_List) {
    const File_Path_String: string = Path_Module.join(
      Aid_Schools_Data_Directory_Path,
      File_Name_Item
    );
    const Raw_Data_Content: unknown = Read_JavaScript_Object_Notation_File(
      File_Path_String
    ) as Raw_Schools_Payload;

    if (
      !Raw_Data_Content ||
      !Array.isArray((Raw_Data_Content as Raw_Schools_Payload).branches)
    ) {
      continue;
    }

    for (const Raw_Branch_Item of (Raw_Data_Content as Raw_Schools_Payload)
      .branches) {
      const Current_Branch_ID_Number: number = Global_Branch_Counter_Number++;
      const Compiled_Schools_Collection: School_Record[] = [];

      if (Array.isArray(Raw_Branch_Item.schools)) {
        for (const Raw_School_Item of Raw_Branch_Item.schools) {
          Compiled_Schools_Collection.push({
            ID: Global_School_Counter_Number++,
            Branch_ID: Current_Branch_ID_Number,
            Slug_Text: Clean_String_Content(Raw_School_Item.id),
            School_Name: Clean_String_Content(Raw_School_Item.name),
            Founder_Name: Clean_String_Content(Raw_School_Item.founder),
            Regions_Text: Clean_String_Content(Raw_School_Item.regions),
            Description_Text: Clean_String_Content(
              Raw_School_Item.description
            ),
          });
        }
      }

      Branches_Collection.push({
        ID: Current_Branch_ID_Number,
        Slug_Text: Clean_String_Content(Raw_Branch_Item.id),
        Branch_Name: Clean_String_Content(Raw_Branch_Item.name),
        Summary_Text: Clean_String_Content(Raw_Branch_Item.summary),
        Schools_Collection: Compiled_Schools_Collection,
      });
    }
  }

  const Database_Transaction = Database_Instance.transaction(() => {
    for (const Branch_Record_Item of Branches_Collection) {
      Insert_Branch_Statement.run(
        Branch_Record_Item.ID,
        Branch_Record_Item.Slug_Text,
        Branch_Record_Item.Branch_Name,
        Branch_Record_Item.Summary_Text,
        Branch_Record_Item.Schools_Collection.length
      );
      for (const School_Record_Item of Branch_Record_Item.Schools_Collection) {
        Insert_School_Statement.run(
          School_Record_Item.ID,
          School_Record_Item.Branch_ID,
          School_Record_Item.Slug_Text,
          School_Record_Item.School_Name,
          School_Record_Item.Founder_Name,
          School_Record_Item.Regions_Text,
          School_Record_Item.Description_Text
        );
      }
    }
  });

  Database_Transaction();
  Database_Instance.close();
  console.log(
    ` -> Compiled Asset/Corpus/Aid/Schools.db (${Branches_Collection.length} branches)`
  );
}