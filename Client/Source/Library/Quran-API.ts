import type {
  Surah_Metadata,
  Surah,
  Ayah,
  Kalimah,
  Translation,
  KBK_Translation,
  Transliteration,
  KBK_Transliteration,
  Footnote,
  Page,
} from "./Quran-Types";

import {
  Get_Saved_Surah,
  Get_Saved_Suwar_Metadata,
  Save_Surah_Locally,
  Save_Suwar_Metadata_Locally,
  Get_Saved_Ayaat,
  Save_Ayaat_Locally,
  Get_Saved_Kalimaat,
  Save_Kalimaat_Locally,
  Build_Surah_Key,
} from "./Service-Worker-Cache-Store";

const Api_Base_Path = "/API/Quran";
const Debug_Quran_Api = true;

const Debug_Log = (...Arguments: unknown[]) => {
  if (Debug_Quran_Api) {
    console.log(...Arguments);
  }
};

const Debug_Warn = (...Arguments: unknown[]) => {
  if (Debug_Quran_Api) {
    console.warn(...Arguments);
  }
};

export type Page_Sections = Record<number, { Surah: number; Start_Ayah: number; End_Ayah: number }[]>;
export type Translations = Translation[];
export type Transliterations = Transliteration[];

export interface Kalimah_Entry {
  Surah: number;
  Ayah: number;
  Kalimah: number;
  Arabic: string;
  Presentation_Form_A_Ligature_Based: string;
  Presentation_Form_A_Glyph_Based: string;
}

export interface KBK_Translation {
  Surah: number;
  Ayah: number;
  Kalimah: number;
  Text: string;
  Edition: string;
}

export interface KBK_Transliteration {
  Surah: number;
  Ayah: number;
  Kalimah: number;
  Text: string;
  Edition: string;
}

export interface Translation_List_Entry {
  ID: string;
  Name: string;
  Language: string;
}

export interface Transliteration_List_Entry {
  ID: string;
  Name: string;
  Language: string;
}

export interface Surah_Details {
  Surah: Surah_Metadata;
  Ayah: Ayah[];
  Words: Kalimah_Entry[];
  Translations: Translation[];
  Word_Translations: KBK_Translation[];
  Transliterations: Transliteration[];
  Word_Transliterations: KBK_Transliteration[];
  Footnotes: Footnote[];
}

function Memoize<T>(Producer: () => Promise<T>): () => Promise<T> {
  let Promise_Instance: Promise<T> | null = null;
  return () => {
    if (!Promise_Instance) {
      Promise_Instance = Producer();
      Promise_Instance.catch(() => {
        Promise_Instance = null;
      });
    }
    return Promise_Instance;
  };
}

export interface Translation_Resource_Result {
  Ayah?: Translation[];
  Kalimah?: KBK_Translation[];
  Footnote?: Footnote[];
}

export interface Transliteration_Resource_Result {
  Ayah?: Transliteration[];
  Kalimah?: KBK_Transliteration[];
}

const Extract_Text = (Item: any, Key_Preference?: string): string => {
  if (Item === null || Item === undefined) return "";
  if (typeof Item === "string") return Item;
  if (typeof Item === "object") {
    if (Key_Preference && Item[Key_Preference] !== undefined) {
      return String(Item[Key_Preference]);
    }
    return String(
      Item["Arabic"] ||
      Item["Presentation_Form_A_Ligature_Based"] ||
      Item["Presentation_Form_A_Glyph_Based"] ||
      Item["Text"] ||
      Item["Translation"] ||
      Item["Transliteration"] ||
      ""
    );
  }
  return String(Item);
};

export const Extract_Pure_Ayaat_Array = (Raw_Ayaat: any[], Key: string): string[] =>
  Raw_Ayaat.map((Item) => Extract_Text(Item, Key));

export const Group_By_Ayah = (Rows: any[], Key?: string): Record<number, string[]> => {
  const Grouped: Record<number, string[]> = {};
  for (const Item of Rows) {
    const Ayah_ID = typeof Item === "object" && Item !== null ? Item["Ayah"] || 1 : 1;
    (Grouped[Ayah_ID] ||= []).push(Extract_Text(Item, Key));
  }
  return Grouped;
};

const Group_Rows_By_Ayah = (Rows: any[]): any[][] => {
  const Grouped: any[][] = [];
  for (const Item of Rows) {
    const Ayah_Index = (typeof Item === "object" && Item !== null ? (Item["Ayah"] ?? 1) : 1) - 1;
    (Grouped[Ayah_Index] ||= []).push(Item);
  }
  return Grouped;
};

export const Group_By_Ayah_Nested = (Rows: any[], Key?: string): string[][] => {
  const Grouped: string[][] = [];
  for (const Item of Rows) {
    const Ayah_Index = ((typeof Item === "object" && Item !== null ? Item["Ayah"] : 1) || 1) - 1;
    (Grouped[Ayah_Index] ||= []).push(Extract_Text(Item, Key));
  }
  return Grouped;
};

export const Flatten_Kalimaat_With_Ayah = (
  Kalimaat_By_Ayah: Record<number, string[]>,
  Surah_Number: number,
  Meta_Key: "Edition",
  Meta_Value: string
): any[] =>
  Object.entries(Kalimaat_By_Ayah).flatMap(([Ayah_Number_String, Ayah_Words]) => {
    const Ayah_ID = Number(Ayah_Number_String);
    return Ayah_Words.map((Word_Text, Kalimah_Index) => ({
      Surah: Surah_Number,
      Ayah: Ayah_ID,
      Kalimah: Kalimah_Index + 1,
      Text: Word_Text,
      [Meta_Key]: Meta_Value,
    }));
  });

const Safe_JSON_Parse = <T = any>(Input: unknown, Fallback: T): T => {
  if (typeof Input !== "string") return (Input as T) ?? Fallback;
  try {
    return JSON.parse(Input);
  } catch {
    return Fallback;
  }
};

const Format_Surah_Entry = (Entry: any): Surah_Metadata | null => {
  if (!Entry) return null;

  return {
    Surah: Entry["Surah"],
    Arabic: Entry["Arabic"],
    Translation: Entry["Translation"],
    Transliteration: Entry["Transliteration"],
    Revelation_Place: Entry["Revelation_Place"] ?? null,
    Revelation_Order: Entry["Revelation_Order"] ?? null,
    Ayah_Count: Entry["Ayah_Count"],
    Start_Page: Entry["Start_Page"],
    End_Page: Entry["End_Page"],
    Indo_Pak_Ayah_Ending: Safe_JSON_Parse(Entry["Indo_Pak_Ayah_Ending"], []),
    Layout: Safe_JSON_Parse(Entry["Layout"], null),
  };
};

export const Fetch_Suwar: () => Promise<Surah_Metadata[]> = Memoize(async () => {
  const Suwar_Key = 0;

  try {
    const Response = await fetch(Api_Base_Path);
    if (!Response.ok) throw new Error(`HTTP ${Response.status}`);
    const Rows = await Response.json();
    const Formatted_List = Rows.map(Format_Surah_Entry).filter(Boolean) as Surah_Metadata[];

    await Save_Suwar_Metadata_Locally(Suwar_Key, Formatted_List);

    Promise.all(
      Formatted_List.map((Surah_Item) => Save_Surah_Locally(Surah_Item.Surah, Surah_Item))
    ).catch(() => {});

    return Formatted_List;
  } catch (Error_Value) {
    Debug_Warn("[Quran-API] Network request failed for Suwar, checking Service Worker Cache...", Error_Value);

    const Cached = await Get_Saved_Suwar_Metadata<Surah_Metadata[]>(Suwar_Key);
    if (Cached) return Cached;

    throw new Error("No network connection available and no cached Suwar metadata found.");
  }
});

export const Get_Surah = async (Surah_Number: number): Promise<Surah | null> => {
  const Cached = await Get_Saved_Surah<Surah>(Surah_Number);
  if (Cached) return Cached;

  try {
    const Response = await fetch(`${Api_Base_Path}?Surah=${Surah_Number}`);
    if (!Response.ok) return null;
    const Raw_Data = await Response.json();

    const Formatted_Metadata = Format_Surah_Entry(Raw_Data["Surah"]);
    if (!Formatted_Metadata) return null;

    const Data: Surah = {
      Surah: Formatted_Metadata,
      Ayah: (Raw_Data["Ayaat"] || []) as Ayah[],
      Kalimah: (Raw_Data["Kalimaat"] || []) as Kalimah[],
      Translation: [],
      KBK_Translation: [],
      Transliteration: [],
      KBK_Transliteration: [],
      Footnote: [],
    };

    await Save_Surah_Locally(Surah_Number, Data);
    return Data;
  } catch (Error_Value) {
    Debug_Warn(`[Quran-API] Failed to fetch Surah ${Surah_Number}:`, Error_Value);
    return null;
  }
};

export const Fetch_Pages: () => Promise<Page[]> = Memoize(async () => {
  try {
    const Response = await fetch(`${Api_Base_Path}?Page=true`);
    if (!Response.ok) throw new Error(`HTTP ${Response.status}`);
    const Rows = await Response.json();
    return (Rows["Pages"] || Rows) as Page[];
  } catch (Error_Value) {
    Debug_Warn("[Quran-API] Failed to fetch Pages:", Error_Value);
    throw new Error("No network connection available and no cached data could be retrieved for Pages.");
  }
});

interface Resource_Definition {
  Meta_Key: "Translation" | "Transliteration";
  Verse_Param: string;
  Verse_JSON_Key: string;
  Word_JSON_Key: string;
  Footnote_JSON_Key?: string;
  Build_Database_Path: (Edition: string) => string;
}

const Build_Translation_Path = (Edition: string) => `/API/Translation/${Edition}`;
const Build_Transliteration_Path = (Edition: string) => `/API/Transliteration/${Edition}`;

const Translation_Resource: Resource_Definition = {
  Meta_Key: "Translation",
  Verse_Param: "Translation",
  Verse_JSON_Key: "Translations",
  Word_JSON_Key: "KBK_Translations",
  Footnote_JSON_Key: "Footnotes",
  Build_Database_Path: Build_Translation_Path,
};

const Transliteration_Resource: Resource_Definition = {
  Meta_Key: "Transliteration",
  Verse_Param: "Transliteration",
  Verse_JSON_Key: "Transliterations",
  Word_JSON_Key: "Word_By_Word_Transliterations",
  Build_Database_Path: Build_Transliteration_Path,
};

const Fetch_Single_Resource = async (
  Resource: Resource_Definition,
  Surah_Number: number,
  Edition: string,
  Need_Ayah: boolean,
  Need_Word: boolean
): Promise<{ Ayah?: any[]; Kalimah?: any[]; Footnote?: Footnote[] }> => {
  const Need_Footnote = Need_Ayah && Boolean(Resource.Footnote_JSON_Key);

  Debug_Log(`[${Resource.Meta_Key}] Fetch_Single_Resource IN →`, {
    Surah_Number,
    Edition,
    Need_Ayah,
    Need_Word,
    Need_Footnote,
  });

  const Surah_Key = Build_Surah_Key(Surah_Number, Edition);
  const Footnote_Store_Key = `${Surah_Key}::Footnotes`;

  let Cached_Ayaat = Need_Ayah ? await Get_Saved_Ayaat<any[]>(Surah_Key) : null;
  let Cached_Kalimaat = Need_Word ? await Get_Saved_Kalimaat<any[]>(Surah_Key) : null;
  let Cached_Footnotes = Need_Footnote
    ? await Get_Saved_Kalimaat<Footnote[]>(Footnote_Store_Key)
    : null;

  const Satisfies_Ayah = !Need_Ayah || (Cached_Ayaat !== null && Cached_Ayaat.length > 0);
  const Satisfies_Word = !Need_Word || (Cached_Kalimaat !== null && Cached_Kalimaat.length > 0);
  const Satisfies_Footnote =
    !Need_Footnote || (Cached_Footnotes !== null && Cached_Footnotes.length > 0);

  if (Satisfies_Ayah && Satisfies_Word && Satisfies_Footnote) {
    const Cached_Result = {
      Ayah: Need_Ayah && Cached_Ayaat ? Cached_Ayaat : undefined,
      Kalimah: Need_Word && Cached_Kalimaat ? Cached_Kalimaat : undefined,
      Footnote: Need_Footnote && Cached_Footnotes ? Cached_Footnotes : undefined,
    };

    Debug_Log(`[${Resource.Meta_Key}] Fetch_Single_Resource OUT (cache hit) →`, {
      Surah_Number,
      Edition,
      Ayah_Count: Cached_Result.Ayah?.length ?? 0,
      Word_Count: Cached_Result.Kalimah?.length ?? 0,
      Footnote_Count: Cached_Result.Footnote?.length ?? 0,
    });

    return Cached_Result;
  }

  const Fetch_Ayah = Need_Ayah && !Satisfies_Ayah;
  const Fetch_Word = Need_Word && !Satisfies_Word;
  const Fetch_Footnote = Need_Footnote && !Satisfies_Footnote;

  let Fresh_Ayaat: any[] = Cached_Ayaat || [];
  let Fresh_Kalimaat: any[] = Cached_Kalimaat || [];
  let Fresh_Footnotes: Footnote[] = Cached_Footnotes || [];

  let Ayah_Fetch_Succeeded = !Fetch_Ayah;
  let Word_Fetch_Succeeded = !Fetch_Word;
  let Footnote_Fetch_Succeeded = !Fetch_Footnote;

  const To_Ayah_Row = (Raw_Item: any) => ({
    Surah: Surah_Number,
    Ayah: Raw_Item["Ayah"],
    Text: Extract_Text(Raw_Item, "Text"),
    Edition: Edition,
  });

  const To_Word_Row = (Raw_Item: any) => ({
    Surah: Surah_Number,
    Ayah: Raw_Item["Ayah"],
    Kalimah: Raw_Item["Kalimah"],
    Text: Extract_Text(Raw_Item, "Text"),
    Edition: Edition,
  });

  const Run_Fetch = async (Include_Word_Flag: boolean) => {
    const Query_Parameters = new URLSearchParams();
    Query_Parameters.append("Surah", String(Surah_Number));
    Query_Parameters.append(Resource.Verse_Param, Edition);
    if (Include_Word_Flag) Query_Parameters.append("WBW", "true");

    const URL_To_Fetch = `${Api_Base_Path}?${Query_Parameters.toString()}`;
    Debug_Log(`[${Resource.Meta_Key}] network request →`, URL_To_Fetch);

    const Response = await fetch(URL_To_Fetch);
    if (!Response.ok) throw new Error(`HTTP ${Response.status}`);
    return Response.json();
  };

  const Capture_Footnotes = async (Data: any) => {
    if (!Fetch_Footnote || Footnote_Fetch_Succeeded || !Resource.Footnote_JSON_Key) return;
    const Rows = Data[Resource.Footnote_JSON_Key];
    if (Array.isArray(Rows)) {
      Fresh_Footnotes = Rows;
      await Save_Kalimaat_Locally(Footnote_Store_Key, Fresh_Footnotes as any);
      Footnote_Fetch_Succeeded = true;
    }
  };

  try {
    const Data = await Run_Fetch(Fetch_Word);

    const Verse_Rows = Data[Resource.Verse_JSON_Key];
    if (Fetch_Ayah && Array.isArray(Verse_Rows)) {
      Fresh_Ayaat = Verse_Rows.map(To_Ayah_Row);
      await Save_Ayaat_Locally(Surah_Key, Fresh_Ayaat);
      Ayah_Fetch_Succeeded = true;
    }

    const Word_Rows = Data[Resource.Word_JSON_Key];
    if (Fetch_Word && Array.isArray(Word_Rows)) {
      Fresh_Kalimaat = Word_Rows.map(To_Word_Row);
      await Save_Kalimaat_Locally(Surah_Key, Fresh_Kalimaat);
      Word_Fetch_Succeeded = true;
    }

    await Capture_Footnotes(Data);
  } catch (Error_Value) {
    Debug_Warn(`[${Resource.Meta_Key}] network fetch failed →`, {
      Surah_Number,
      Edition,
      error: Error_Value,
    });

    if ((Fetch_Ayah && !Ayah_Fetch_Succeeded) || (Fetch_Footnote && !Footnote_Fetch_Succeeded)) {
      try {
        const Data = await Run_Fetch(false);
        const Verse_Rows = Data[Resource.Verse_JSON_Key];
        if (Array.isArray(Verse_Rows)) {
          Fresh_Ayaat = Verse_Rows.map(To_Ayah_Row);
          await Save_Ayaat_Locally(Surah_Key, Fresh_Ayaat);
          Ayah_Fetch_Succeeded = true;
        }
        await Capture_Footnotes(Data);
      } catch (Fallback_Error) {
        Debug_Warn(`[${Resource.Meta_Key}] Ayah-only fallback fetch failed →`, {
          Surah_Number,
          Edition,
          error: Fallback_Error,
        });
      }
    }
  }

  const Result = {
    Ayah: Need_Ayah && Ayah_Fetch_Succeeded ? Fresh_Ayaat : undefined,
    Kalimah: Need_Word && Word_Fetch_Succeeded ? Fresh_Kalimaat : undefined,
    Footnote: Need_Footnote && Footnote_Fetch_Succeeded ? Fresh_Footnotes : undefined,
  };

  Debug_Log(`[${Resource.Meta_Key}] Fetch_Single_Resource OUT →`, {
    Surah_Number,
    Edition,
    Ayah_Fetch_Succeeded,
    Word_Fetch_Succeeded,
    Footnote_Fetch_Succeeded,
    Ayah_Count: Result.Ayah?.length ?? 0,
    Word_Count: Result.Kalimah?.length ?? 0,
    Footnote_Count: Result.Footnote?.length ?? 0,
  });

  return Result;
};

export const Fetch_Surah_Translation = (
  Surah_Number: number,
  Translator: string,
  Need_Ayah: boolean = true,
  Need_Word: boolean = false
): Promise<Translation_Resource_Result> =>
  Fetch_Single_Resource(Translation_Resource, Surah_Number, Translator, Need_Ayah, Need_Word);

export const Fetch_Surah_Transliteration = (
  Surah_Number: number,
  Provider: string,
  Need_Ayah: boolean = true,
  Need_Word: boolean = false
): Promise<Transliteration_Resource_Result> =>
  Fetch_Single_Resource(Transliteration_Resource, Surah_Number, Provider, Need_Ayah, Need_Word);

export const Get_Ayaat_By_Surah = async <T = Ayah[]>(
  Surah_Number: number,
  Resource_Identifier?: string
): Promise<T | null> => {
  const Key = Build_Surah_Key(Surah_Number, Resource_Identifier);
  const Cached = await Get_Saved_Ayaat<T>(Key);
  if (Cached) return Cached;

  try {
    const Endpoint = Resource_Identifier
      ? `${Api_Base_Path}?Surah=${Surah_Number}&Translation=${Resource_Identifier}`
      : `${Api_Base_Path}?Surah=${Surah_Number}`;

    const Response = await fetch(Endpoint);
    if (!Response.ok) return null;
    const Data: T = await Response.json();

    await Save_Ayaat_Locally(Key, Data);
    return Data;
  } catch (Error_Value) {
    Debug_Warn(`[Quran-API] Failed to fetch Ayaat data for ${Key}:`, Error_Value);
    return null;
  }
};

export const Get_Kalimaat_By_Surah = async <T = Kalimah[]>(
  Surah_Number: number,
  Resource_Identifier?: string
): Promise<T | null> => {
  const Key = Build_Surah_Key(Surah_Number, Resource_Identifier);
  const Cached = await Get_Saved_Kalimaat<T>(Key);
  if (Cached) return Cached;

  try {
    const Endpoint = Resource_Identifier
      ? `${Api_Base_Path}?Surah=${Surah_Number}&Translation=${Resource_Identifier}&WBW=true`
      : `${Api_Base_Path}?Surah=${Surah_Number}`;

    const Response = await fetch(Endpoint);
    if (!Response.ok) return null;
    const Data: T = await Response.json();

    await Save_Kalimaat_Locally(Key, Data);
    return Data;
  } catch (Error_Value) {
    Debug_Warn(`[Quran-API] Failed to fetch Kalimaat data for ${Key}:`, Error_Value);
    return null;
  }
};

const Fetch_Core_Surah = async (Surah_Number: number): Promise<Surah_Details> => {
  const Base_Key = `${Surah_Number}`;

  const Cached_Surah = await Get_Saved_Surah<Surah_Metadata>(Surah_Number);
  const Cached_Ayaat = await Get_Saved_Ayaat<Ayah[]>(Base_Key);
  const Cached_Words = await Get_Saved_Kalimaat<Kalimah_Entry[]>(Base_Key);

  if (Cached_Surah && Cached_Ayaat && Cached_Words) {
    return {
      Surah: Cached_Surah,
      Ayah: Cached_Ayaat,
      Words: Cached_Words,
      Translations: [],
      Word_Translations: [],
      Transliterations: [],
      Word_Transliterations: [],
      Footnotes: [],
    };
  }

  let Raw_Ayaat: any[] = [];
  let Raw_Kalimaat: any[] = [];
  let Formatted_Surah: Surah_Metadata | null = null;

  try {
    const Response = await fetch(`${Api_Base_Path}?Surah=${Surah_Number}`);
    if (Response.ok) {
      const Raw_Data = await Response.json();
      Formatted_Surah = Format_Surah_Entry(Raw_Data["Surah"] || Raw_Data);
      Raw_Ayaat = Raw_Data["Ayaat"] || [];
      Raw_Kalimaat = Raw_Data["Kalimaat"] || [];
    }
  } catch (Error_Value) {
    Debug_Warn(`Fetch_Core_Surah network fetch failed →`, { Surah_Number, error: Error_Value });
  }

  if (!Formatted_Surah) {
    throw new Error(`Surah ${Surah_Number} could not be found.`);
  }

  const Formatted_Ayaat: Ayah[] = Raw_Ayaat.map((Item: any, Index: number) => ({
    Surah: Surah_Number,
    Ayah: Item["Ayah"] ?? Index + 1,
    Arabic: Extract_Text(Item, "Arabic"),
    Presentation_Form_A_Ligature_Based: Extract_Text(Item, "Presentation_Form_A_Ligature_Based"),
    Presentation_Form_A_Glyph_Based: Extract_Text(Item, "Presentation_Form_A_Glyph_Based"),
  })) as unknown as Ayah[];

  const Formatted_Words: Kalimah_Entry[] = [];
  Group_Rows_By_Ayah(Raw_Kalimaat).forEach((Ayah_Words, Verse_Index) => {
    Ayah_Words.forEach((Item, Kalimah_Index) => {
      Formatted_Words.push({
        Surah: Surah_Number,
        Ayah: Verse_Index + 1,
        Kalimah: Kalimah_Index + 1,
        Arabic: Extract_Text(Item, "Arabic"),
        Presentation_Form_A_Ligature_Based: Extract_Text(Item, "Presentation_Form_A_Ligature_Based"),
        Presentation_Form_A_Glyph_Based: Extract_Text(Item, "Presentation_Form_A_Glyph_Based"),
      });
    });
  });

  await Save_Surah_Locally(Surah_Number, Formatted_Surah);
  await Save_Ayaat_Locally(Base_Key, Formatted_Ayaat);
  await Save_Kalimaat_Locally(Base_Key, Formatted_Words);

  return {
    Surah: Formatted_Surah,
    Ayah: Formatted_Ayaat,
    Words: Formatted_Words,
    Translations: [],
    Word_Translations: [],
    Transliterations: [],
    Word_Transliterations: [],
    Footnotes: [],
  };
};

const Surah_Data_Store = new Map<string, Promise<Surah_Details>>();

export const Fetch_Surah_Details = (
  Surah_Number: number,
  Translation_Editions: string | string[] = "",
  Transliteration_Editions: string | string[] = "",
  Word_Translation_Editions: string | string[] = "",
  Word_Transliteration_Editions: string | string[] = ""
): Promise<Surah_Details> => {
  Debug_Log("[Fetch_Surah_Details] Raw_Storage_Data args IN →", {
    Surah_Number,
    Translation_Editions,
    Transliteration_Editions,
    Word_Translation_Editions,
    Word_Transliteration_Editions,
  });

  const As_Set = (Value: string | string[]) =>
    new Set(Array.isArray(Value) ? Value.filter(Boolean) : Value ? [Value] : []);

  const Verse_Translations_Set = As_Set(Translation_Editions);
  const Word_Translations_Set = As_Set(Word_Translation_Editions);
  const Verse_Transliterations_Set = As_Set(Transliteration_Editions);
  const Word_Transliterations_Set = As_Set(Word_Transliteration_Editions);

  const All_Translation_Identifiers = Array.from(
    new Set([...Verse_Translations_Set, ...Word_Translations_Set])
  ).sort();
  const All_Transliteration_Identifiers = Array.from(
    new Set([...Verse_Transliterations_Set, ...Word_Transliterations_Set])
  ).sort();

  const Request_Key =
    `${Surah_Number}` +
    `:T_Verse[${Array.from(Verse_Translations_Set).sort().join(",")}]` +
    `:T_WBW[${Array.from(Word_Translations_Set).sort().join(",")}]` +
    `:N_Verse[${Array.from(Verse_Transliterations_Set).sort().join(",")}]` +
    `:N_WBW[${Array.from(Word_Transliterations_Set).sort().join(",")}]`;

  if (!Surah_Data_Store.has(Request_Key)) {
    Debug_Log("[Fetch_Surah_Details] cache miss, starting fetch →", { Request_Key });

    const Promise_Instance = (async () => {
      const Base_Surah = await Fetch_Core_Surah(Surah_Number);

      const [Translation_Results, Transliteration_Results] = await Promise.all([
        Promise.allSettled(
          All_Translation_Identifiers.map(async (Edition_Identifier) => {
            const Need_Ayah = Verse_Translations_Set.has(Edition_Identifier);
            const Need_Word = Word_Translations_Set.has(Edition_Identifier);
            const Resource_Result = await Fetch_Single_Resource(
              Translation_Resource,
              Surah_Number,
              Edition_Identifier,
              Need_Ayah,
              Need_Word
            );
            return { Resource_Result, Need_Ayah, Need_Word };
          })
        ),
        Promise.allSettled(
          All_Transliteration_Identifiers.map(async (Edition_Identifier) => {
            const Need_Ayah = Verse_Transliterations_Set.has(Edition_Identifier);
            const Need_Word = Word_Transliterations_Set.has(Edition_Identifier);
            const Resource_Result = await Fetch_Single_Resource(
              Transliteration_Resource,
              Surah_Number,
              Edition_Identifier,
              Need_Ayah,
              Need_Word
            );
            return { Resource_Result, Need_Ayah, Need_Word };
          })
        ),
      ]);

      const Translations: Translation[] = [];
      const Word_Translations: KBK_Translation[] = [];
      const Footnotes: Footnote[] = [];
      for (const Result of Translation_Results) {
        if (Result.status === "fulfilled") {
          const { Resource_Result, Need_Ayah, Need_Word } = Result.value;
          if (Need_Ayah && Resource_Result.Ayah) Translations.push(...Resource_Result.Ayah);
          if (Need_Word && Resource_Result.Kalimah) Word_Translations.push(...Resource_Result.Kalimah);
          if (Need_Ayah && Resource_Result.Footnote) Footnotes.push(...Resource_Result.Footnote);
        } else {
          Debug_Warn("[Translation] a per-Edition_Name fetch was rejected →", Result.reason);
        }
      }

      const Transliterations: Transliteration[] = [];
      const Word_Transliterations: KBK_Transliteration[] = [];
      for (const Result of Transliteration_Results) {
        if (Result.status === "fulfilled") {
          const { Resource_Result, Need_Ayah, Need_Word } = Result.value;
          if (Need_Ayah && Resource_Result.Ayah) Transliterations.push(...Resource_Result.Ayah);
          if (Need_Word && Resource_Result.Kalimah) Word_Transliterations.push(...Resource_Result.Kalimah);
        } else {
          Debug_Warn("[Transliteration] a per-Edition_Name fetch was rejected →", Result.reason);
        }
      }

      Debug_Log("[Fetch_Surah_Details] Translation aggregate OUT →", {
        Surah_Number,
        Requested_Translation_Identifiers: All_Translation_Identifiers,
        Translations_Count: Translations.length,
        Word_Translations_Count: Word_Translations.length,
      });

      Debug_Log("[Fetch_Surah_Details] Transliteration aggregate OUT →", {
        Surah_Number,
        Requested_Transliteration_Identifiers: All_Transliteration_Identifiers,
        Transliterations_Count: Transliterations.length,
        Word_Transliterations_Count: Word_Transliterations.length,
      });

      Debug_Log("[Fetch_Surah_Details] Footnote aggregate OUT →", {
        Surah_Number,
        Footnotes_Count: Footnotes.length,
      });

      return {
        Surah: Base_Surah.Surah,
        Ayah: Base_Surah.Ayah,
        Words: Base_Surah.Words,
        Translations,
        Word_Translations,
        Transliterations,
        Word_Transliterations,
        Footnotes,
      };
    })();

    Surah_Data_Store.set(Request_Key, Promise_Instance);
    Promise_Instance.catch((Error_Value) => {
      Debug_Warn("[Fetch_Surah_Details] request failed, evicting cache entry →", {
        Request_Key,
        error: Error_Value,
      });
      Surah_Data_Store.delete(Request_Key);
    });
  } else {
    Debug_Log("[Fetch_Surah_Details] cache hit, reusing in-flight/resolved promise →", { Request_Key });
  }

  return Surah_Data_Store.get(Request_Key)!;
};

const Build_Page_Sections_From_Pages = (
  Pages: any[],
  Ayah_Count_Per_Surah: Map<number, number>
): Page_Sections => {
  const Result: Page_Sections = {};

  for (const Page_Item of Pages) {
    const Sections: { Surah: number; Start_Ayah: number; End_Ayah: number }[] = [];
    const Start_Surah = Page_Item["Start_Surah"];
    const Start_Ayah = Page_Item["Start_Ayah"];
    const End_Surah = Page_Item["End_Surah"];
    const End_Ayah = Page_Item["End_Ayah"];

    if (Start_Surah === End_Surah) {
      Sections.push({ Surah: Start_Surah, Start_Ayah, End_Ayah });
    } else {
      Sections.push({
        Surah: Start_Surah,
        Start_Ayah,
        End_Ayah: Ayah_Count_Per_Surah.get(Start_Surah) ?? Start_Ayah,
      });
      for (let Surah_Cursor = Start_Surah + 1; Surah_Cursor < End_Surah; Surah_Cursor++) {
        Sections.push({
          Surah: Surah_Cursor,
          Start_Ayah: 1,
          End_Ayah: Ayah_Count_Per_Surah.get(Surah_Cursor) ?? 1,
        });
      }
      Sections.push({ Surah: End_Surah, Start_Ayah: 1, End_Ayah });
    }

    Result[Page_Item["Page"]] = Sections;
  }

  return Result;
};

export const Fetch_Page_Sections_Corpus: () => Promise<Page_Sections> = Memoize(async () => {
  const Normalize_Server_Segments = (Raw: Record<string, any>): Page_Sections => {
    const Result: Page_Sections = {};
    for (const Page_Key of Object.keys(Raw)) {
      const Segments = Raw[Page_Key];
      if (!Array.isArray(Segments)) continue;
      Result[Number(Page_Key)] = Segments.map((Segment_Item: any) => ({
        Surah: Segment_Item["Surah"],
        Start_Ayah: Segment_Item["Start-Ayah"] ?? Segment_Item["Start_Ayah"],
        End_Ayah: Segment_Item["End-Ayah"] ?? Segment_Item["End_Ayah"],
      }));
    }
    return Result;
  };

  try {
    const Response = await fetch(`${Api_Base_Path}?Segments=true`);
    if (!Response.ok) throw new Error(`HTTP ${Response.status}`);
    const Data = await Response.json();
    const Raw = Data["Page_Segments"] || Data["Page-Sections"] || Data;
    return Normalize_Server_Segments(Raw);
  } catch (Error_Value) {
    Debug_Warn(`Fetch_Page_Sections_Corpus network fetch failed →`, { error: Error_Value });
    throw new Error("Unable to fetch page sections Corpus.");
  }
});

function Build_List_Fetcher<T>(
  Param_Name: string,
  Result_Key: string,
  Result_Key_Alternate?: string
): () => Promise<T[]> {
  return async () => {
    try {
      const Response = await fetch(`${Api_Base_Path}?${Param_Name}=true`);
      if (!Response.ok) throw new Error(`HTTP ${Response.status}`);
      const Data = await Response.json();
      return (Data[Result_Key] ?? (Result_Key_Alternate && Data[Result_Key_Alternate]) ?? []) as T[];
    } catch (Error_Object) {
      console.error(`error fetching ${Result_Key}:`, Error_Object);
      return [];
    }
  };
}

export const Fetch_Translation_List = Build_List_Fetcher<Translation_List_Entry>(
  "Available-Translations",
  "Available-Translations"
);

export const Fetch_Word_Translation_List = Build_List_Fetcher<Translation_List_Entry>(
  "Available-WBW-Translations",
  "Available-WBW-Translations"
);

export const Fetch_Transliteration_List = Build_List_Fetcher<Transliteration_List_Entry>(
  "Available-Transliterations",
  "Available-Transliterations"
);

export const Fetch_Word_Transliteration_List = Build_List_Fetcher<Transliteration_List_Entry>(
  "Available-WBW-Transliterations",
  "Available-WBW-Transliterations"
);