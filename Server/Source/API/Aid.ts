import Path_Module from "path";
import File_System_Module from "fs";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

export interface Adiyah_Category_Record {
  ID: number;
  Category_Name: string;
  Adiyah_Count_Number: number;
}

export interface Adiyah_Word_By_Word_Record {
  ID: number;
  Dua_ID: number;
  Word_Position_Index: number;
  Transliteration_Text: string;
  Translation_Text: string;
}

export interface Adiyah_Record {
  ID: number;
  Category_ID: number;
  In_Category_ID: number;
  Arabic_Content_Text: string;
  Translation_Content_Text: string;
  Reference_Content_Text: string;
  Word_By_Word_Collection?: Adiyah_Word_By_Word_Record[];
}

export interface Adiyah_Category_Output_Payload {
  Category_Information: Adiyah_Category_Record;
  Adiyah_Collection: Adiyah_Record[];
}

export interface Article_Topic_Record {
  ID: number;
  Topic_Name: string;
  Article_Count_Number: number;
}

export interface Article_Record {
  ID: number;
  Topic_ID: number;
  In_Topic_ID: number;
  Article_Title: string;
  Article_Content_Text: string;
}

export interface Article_Topic_Output_Payload {
  Topic_Information: Article_Topic_Record;
  Articles_Collection: Article_Record[];
}

export interface Asma_Ul_Husna_Record {
  ID: number;
  Arabic_Content_Text: string;
  Transliteration_Text: string;
  Translation_Text: string;
}

export interface Pillar_Detail_Record {
  ID: number;
  Pillar_ID: number;
  Position_Index: number;
  Heading_Text: string;
  Content_Text: string;
}

export interface Pillar_Record {
  ID: number;
  Pillar_Name: string;
  Subtitle_Text: string;
  Key_Hadith_Text: string;
  Details_Collection?: Pillar_Detail_Record[];
}

export interface Prophet_Section_Record {
  ID: number;
  Prophet_ID: number;
  Position_Index: number;
  Heading_Text: string;
  Content_Text: string;
}

export interface Prophet_Record {
  ID: number;
  Prophet_Name: string;
  Sections_Collection?: Prophet_Section_Record[];
}

export interface School_Record {
  ID: number;
  Branch_ID: number;
  Slug_Text: string;
  School_Name: string;
  Founder_Name: string;
  Regions_Text: string;
  Description_Text: string;
}

export interface Branch_Record {
  ID: number;
  Slug_Text: string;
  Branch_Name: string;
  Summary_Text: string;
  School_Count_Number: number;
  Schools_Collection?: School_Record[];
}

const Current_File_URL_Path: string = fileURLToPath(import.meta.url);
const Current_Directory_Path: string = Path_Module.dirname(
  Current_File_URL_Path
);

const Aid_Corpus_Directory_Path: string = Path_Module.resolve(
  Current_Directory_Path,
  "..",
  "..",
  "Asset",
  "Corpus",
  "Aid"
);

function Resolve_Aid_Database_Path(Target_Database_Name: string): string {
  return Path_Module.join(
    Aid_Corpus_Directory_Path,
    `${Target_Database_Name}.db`
  );
}

export function Fetch_Adiyah_Categories(): Adiyah_Category_Record[] {
  const Target_Database_Path_String: string = Resolve_Aid_Database_Path("Dua");
  if (!File_System_Module.existsSync(Target_Database_Path_String)) return [];

  try {
    const Database_Instance = new Database(Target_Database_Path_String, {
      readonly: true,
    });
    const Categories_Collection = Database_Instance.prepare(
      `SELECT ID, Name AS Category_Name, Dua_Count AS Adiyah_Count_Number FROM Category ORDER BY ID ASC`
    ).all() as Adiyah_Category_Record[];
    Database_Instance.close();
    return Categories_Collection;
  } catch (Error_Context) {
    console.error(
      `[AID API ERROR] Failed to fetch Dua categories:`,
      Error_Context
    );
    return [];
  }
}

export function Fetch_Adiyah_Category(
  Target_Category_ID_Number: number,
  Should_Include_Word_By_Word: boolean = false
): Adiyah_Category_Output_Payload | null {
  const Target_Database_Path_String: string = Resolve_Aid_Database_Path("Dua");
  if (!File_System_Module.existsSync(Target_Database_Path_String)) return null;

  try {
    const Database_Instance = new Database(Target_Database_Path_String, {
      readonly: true,
    });

    const Category_Information = Database_Instance.prepare(
      `SELECT ID, Name AS Category_Name, Dua_Count AS Adiyah_Count_Number FROM Category WHERE ID = ?`
    ).get(Target_Category_ID_Number) as Adiyah_Category_Record | undefined;

    if (!Category_Information) {
      Database_Instance.close();
      return null;
    }

    const Adiyah_Collection = Database_Instance.prepare(
      `SELECT ID, Category_ID, In_Category_ID, Arabic AS Arabic_Content_Text, Translation AS Translation_Content_Text, Reference AS Reference_Content_Text 
       FROM Dua WHERE Category_ID = ? ORDER BY In_Category_ID ASC`
    ).all(Target_Category_ID_Number) as Adiyah_Record[];

    if (Should_Include_Word_By_Word && Adiyah_Collection.length > 0) {
      const Target_Adiyah_IDs_List: number[] = Adiyah_Collection.map(
        (Adiyah_Item: Adiyah_Record) => Adiyah_Item.ID
      );
      const Parameter_Placeholders_String: string = Target_Adiyah_IDs_List.map(
        () => "?"
      ).join(",");
      const Complete_Word_By_Word_Collection = Database_Instance.prepare(
        `SELECT ID, Dua_ID, Word_Position AS Word_Position_Index, Transliteration AS Transliteration_Text, Translation AS Translation_Text 
         FROM WBW WHERE Dua_ID IN (${Parameter_Placeholders_String}) ORDER BY Dua_ID ASC, Word_Position ASC`
      ).all(...Target_Adiyah_IDs_List) as Adiyah_Word_By_Word_Record[];

      const Word_By_Word_Mapping = new Map<
        number,
        Adiyah_Word_By_Word_Record[]
      >();
      for (const Word_Item of Complete_Word_By_Word_Collection) {
        if (!Word_By_Word_Mapping.has(Word_Item.Dua_ID)) {
          Word_By_Word_Mapping.set(Word_Item.Dua_ID, []);
        }
        Word_By_Word_Mapping.get(Word_Item.Dua_ID)!.push(Word_Item);
      }

      for (const Adiyah_Item of Adiyah_Collection) {
        Adiyah_Item.Word_By_Word_Collection =
          Word_By_Word_Mapping.get(Adiyah_Item.ID) || [];
      }
    }

    Database_Instance.close();
    return { Category_Information, Adiyah_Collection };
  } catch (Error_Context) {
    console.error(
      `[AID API ERROR] Failed to fetch Dua Category ${Target_Category_ID_Number}:`,
      Error_Context
    );
    return null;
  }
}

export function Fetch_Article_Topics(): Article_Topic_Record[] {
  const Target_Database_Path_String: string =
    Resolve_Aid_Database_Path("Article");
  if (!File_System_Module.existsSync(Target_Database_Path_String)) return [];

  try {
    const Database_Instance = new Database(Target_Database_Path_String, {
      readonly: true,
    });
    const Topics_Collection = Database_Instance.prepare(
      `SELECT ID, Name AS Topic_Name, Article_Count AS Article_Count_Number FROM Topic ORDER BY ID ASC`
    ).all() as Article_Topic_Record[];
    Database_Instance.close();
    return Topics_Collection;
  } catch (Error_Context) {
    console.error(
      `[AID API ERROR] Failed to fetch Article topics:`,
      Error_Context
    );
    return [];
  }
}

export function Fetch_Article_Topic(
  Target_Topic_ID_Number: number
): Article_Topic_Output_Payload | null {
  const Target_Database_Path_String: string =
    Resolve_Aid_Database_Path("Article");
  if (!File_System_Module.existsSync(Target_Database_Path_String)) return null;

  try {
    const Database_Instance = new Database(Target_Database_Path_String, {
      readonly: true,
    });

    const Topic_Information = Database_Instance.prepare(
      `SELECT ID, Name AS Topic_Name, Article_Count AS Article_Count_Number FROM Topic WHERE ID = ?`
    ).get(Target_Topic_ID_Number) as Article_Topic_Record | undefined;

    if (!Topic_Information) {
      Database_Instance.close();
      return null;
    }

    const Articles_Collection = Database_Instance.prepare(
      `SELECT ID, Topic_ID, In_Topic_ID, Title AS Article_Title, text AS Article_Content_Text 
       FROM Article WHERE Topic_ID = ? ORDER BY In_Topic_ID ASC`
    ).all(Target_Topic_ID_Number) as Article_Record[];

    Database_Instance.close();
    return { Topic_Information, Articles_Collection };
  } catch (Error_Context) {
    console.error(
      `[AID API ERROR] Failed to fetch Article topic ${Target_Topic_ID_Number}:`,
      Error_Context
    );
    return null;
  }
}

export function Fetch_Names(): Asma_Ul_Husna_Record[] {
  const Target_Database_Path_String: string =
    Resolve_Aid_Database_Path("Names");
  if (!File_System_Module.existsSync(Target_Database_Path_String)) return [];

  try {
    const Database_Instance = new Database(Target_Database_Path_String, {
      readonly: true,
    });
    const Names_Collection = Database_Instance.prepare(
      `SELECT ID, Arabic AS Arabic_Content_Text, Transliteration AS Transliteration_Text, Translation AS Translation_Text FROM Name ORDER BY ID ASC`
    ).all() as Asma_Ul_Husna_Record[];
    Database_Instance.close();
    return Names_Collection;
  } catch (Error_Context) {
    console.error(`[AID API ERROR] Failed to fetch Names:`, Error_Context);
    return [];
  }
}

export function Fetch_Pillars(): Pillar_Record[] {
  const Target_Database_Path_String: string =
    Resolve_Aid_Database_Path("Pillars");
  if (!File_System_Module.existsSync(Target_Database_Path_String)) return [];

  try {
    const Database_Instance = new Database(Target_Database_Path_String, {
      readonly: true,
    });
    const Pillars_Collection = Database_Instance.prepare(
      `SELECT ID, Name AS Pillar_Name, Subtitle AS Subtitle_Text, Key_Hadith AS Key_Hadith_Text FROM Pillar ORDER BY ID ASC`
    ).all() as Pillar_Record[];

    const Complete_Details_Collection = Database_Instance.prepare(
      `SELECT ID, Pillar_ID, Position AS Position_Index, Heading AS Heading_Text, Content AS Content_Text 
       FROM Pillar_Detail ORDER BY Pillar_ID ASC, Position ASC`
    ).all() as Pillar_Detail_Record[];

    Database_Instance.close();

    const Details_Mapping = new Map<number, Pillar_Detail_Record[]>();
    for (const Detail_Item of Complete_Details_Collection) {
      if (!Details_Mapping.has(Detail_Item.Pillar_ID)) {
        Details_Mapping.set(Detail_Item.Pillar_ID, []);
      }
      Details_Mapping.get(Detail_Item.Pillar_ID)!.push(Detail_Item);
    }

    for (const Pillar_Item of Pillars_Collection) {
      Pillar_Item.Details_Collection =
        Details_Mapping.get(Pillar_Item.ID) || [];
    }

    return Pillars_Collection;
  } catch (Error_Context) {
    console.error(`[AID API ERROR] Failed to fetch Pillars:`, Error_Context);
    return [];
  }
}

export function Fetch_Prophets(): Prophet_Record[] {
  const Target_Database_Path_String: string =
    Resolve_Aid_Database_Path("Prophets");
  if (!File_System_Module.existsSync(Target_Database_Path_String)) return [];

  try {
    const Database_Instance = new Database(Target_Database_Path_String, {
      readonly: true,
    });
    const Prophets_Collection = Database_Instance.prepare(
      `SELECT ID, Name AS Prophet_Name FROM Prophet ORDER BY ID ASC`
    ).all() as Prophet_Record[];

    const Complete_Sections_Collection = Database_Instance.prepare(
      `SELECT ID, Prophet_ID, Position AS Position_Index, Heading AS Heading_Text, Content AS Content_Text 
       FROM Prophet_Section ORDER BY Prophet_ID ASC, Position ASC`
    ).all() as Prophet_Section_Record[];

    Database_Instance.close();

    const Sections_Mapping = new Map<number, Prophet_Section_Record[]>();
    for (const Section_Item of Complete_Sections_Collection) {
      if (!Sections_Mapping.has(Section_Item.Prophet_ID)) {
        Sections_Mapping.set(Section_Item.Prophet_ID, []);
      }
      Sections_Mapping.get(Section_Item.Prophet_ID)!.push(Section_Item);
    }

    for (const Prophet_Item of Prophets_Collection) {
      Prophet_Item.Sections_Collection =
        Sections_Mapping.get(Prophet_Item.ID) || [];
    }

    return Prophets_Collection;
  } catch (Error_Context) {
    console.error(`[AID API ERROR] Failed to fetch Prophets:`, Error_Context);
    return [];
  }
}

export function Fetch_Schools(): Branch_Record[] {
  const Target_Database_Path_String: string =
    Resolve_Aid_Database_Path("Schools");
  if (!File_System_Module.existsSync(Target_Database_Path_String)) return [];

  try {
    const Database_Instance = new Database(Target_Database_Path_String, {
      readonly: true,
    });
    const Branches_Collection = Database_Instance.prepare(
      `SELECT ID, Slug AS Slug_Text, Name AS Branch_Name, Summary AS Summary_Text, School_Count AS School_Count_Number FROM Branch ORDER BY ID ASC`
    ).all() as Branch_Record[];

    const Complete_Schools_Collection = Database_Instance.prepare(
      `SELECT ID, Branch_ID, Slug AS Slug_Text, Name AS School_Name, Founder AS Founder_Name, Regions AS Regions_Text, Description AS Description_Text 
       FROM School ORDER BY Branch_ID ASC, ID ASC`
    ).all() as School_Record[];

    Database_Instance.close();

    const Schools_Mapping = new Map<number, School_Record[]>();
    for (const School_Item of Complete_Schools_Collection) {
      if (!Schools_Mapping.has(School_Item.Branch_ID)) {
        Schools_Mapping.set(School_Item.Branch_ID, []);
      }
      Schools_Mapping.get(School_Item.Branch_ID)!.push(School_Item);
    }

    for (const Branch_Item of Branches_Collection) {
      Branch_Item.Schools_Collection =
        Schools_Mapping.get(Branch_Item.ID) || [];
    }

    return Branches_Collection;
  } catch (Error_Context) {
    console.error(`[AID API ERROR] Failed to fetch Schools:`, Error_Context);
    return [];
  }
}