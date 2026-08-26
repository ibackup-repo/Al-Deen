// Source/Library/Hadith-API.ts
import type {
  Collection_Info,
  Chapter,
  Narration,
  Translation,
  KBK_Translation,
  Transliteration,
  KBK_Transliteration,
  Edition,
  Chapter_Data,
  Translation_Data,
  Transliteration_Data,
  Hadith_Composite,
} from "./Hadith-Types";

import {
  Get_Saved_Hadith_Collections,
  Save_Hadith_Collections_Locally,
  Get_Saved_Hadith_Chapters,
  Save_Hadith_Chapters_Locally,
  Get_Saved_Hadith_Chapter,
  Save_Hadith_Chapter_Locally,
  Get_Saved_Hadith_Translation,
  Save_Hadith_Translation_Locally,
  Get_Saved_Hadith_Transliteration,
  Save_Hadith_Transliteration_Locally,
  Build_Hadith_Chapter_Key,
  Build_Hadith_Resource_Key,
} from "./Service-Worker-Cache-Store";

const API_BASE_PATH = "/API/Hadith";
const DEBUG_HADITH_API = true;

const Debug_Log = (...Args: unknown[]) => {
  if (DEBUG_HADITH_API) {
    console.log(...Args);
  }
};

const Debug_Warn = (...Args: unknown[]) => {
  if (DEBUG_HADITH_API) {
    console.warn(...Args);
  }
};

export type Translations = Translation[];
export type Transliterations = Transliteration[];
export type Editions = Edition[];

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
  Hadith?: Translation[];
  Kalimah?: KBK_Translation[];
}

export interface Transliteration_Resource_Result {
  Hadith?: Transliteration[];
  Kalimah?: KBK_Transliteration[];
}

const Format_Collection_Entry = (Entry: any): Collection_Info | null => {
  if (!Entry) return null;

  return {
    ID: Entry["ID"],
    Name: Entry["Name"],
    Category: Entry["Category"],
  };
};

export const Fetch_Collections: () => Promise<Collection_Info[]> = Memoize(async () => {
  const Collections_Cache_Key = "All";

  try {
    const Network_Response = await fetch(`${API_BASE_PATH}?Available-Collections=true`);
    if (!Network_Response.ok) throw new Error(`HTTP ${Network_Response.status}`);
    const Raw_Response_Data = await Network_Response.json();
    const Raw_Collection_Rows = Raw_Response_Data["Available-Collections"] || Raw_Response_Data;
    const Formatted_Collections_List = (Raw_Collection_Rows as any[]).map(Format_Collection_Entry).filter(Boolean) as Collection_Info[];

    await Save_Hadith_Collections_Locally(Formatted_Collections_List, Collections_Cache_Key);

    return Formatted_Collections_List;
  } catch (Error_Object) {
    Debug_Warn("[Hadith-API] Network request failed for Collections, checking Service Worker Cache...", Error_Object);

    const Cached_Collections_List = await Get_Saved_Hadith_Collections<Collection_Info[]>(Collections_Cache_Key);
    if (Cached_Collections_List) return Cached_Collections_List;

    throw new Error("No network connection available and no cached Collections found.");
  }
});

export const Get_Chapters = async (Collection_ID: string): Promise<Chapter[] | null> => {
  const Cached_Chapters_List = await Get_Saved_Hadith_Chapters<Chapter[]>(Collection_ID);
  if (Cached_Chapters_List) return Cached_Chapters_List;

  try {
    const Network_Response = await fetch(`${API_BASE_PATH}?Collection=${encodeURIComponent(Collection_ID)}`);
    if (!Network_Response.ok) return null;
    const Raw_Response_Data = await Network_Response.json();
    const Fetched_Chapters_List = (Raw_Response_Data["Chapters"] || Raw_Response_Data) as Chapter[];

    await Save_Hadith_Chapters_Locally(Collection_ID, Fetched_Chapters_List);
    return Fetched_Chapters_List;
  } catch (Error_Object) {
    Debug_Warn(`[Hadith-API] Failed to fetch Chapters for Collection ${Collection_ID}:`, Error_Object);
    return null;
  }
};

export const Get_Chapter = async (
  Collection_ID: string,
  Chapter_ID: number
): Promise<Chapter_Data | null> => {
  const Cache_Key = Build_Hadith_Chapter_Key(Collection_ID, Chapter_ID);
  const Cached_Chapter_Data = await Get_Saved_Hadith_Chapter<Chapter_Data>(Cache_Key);
  if (Cached_Chapter_Data) return Cached_Chapter_Data;

  try {
    const Network_Response = await fetch(
      `${API_BASE_PATH}?Collection=${encodeURIComponent(Collection_ID)}&Chapter=${Chapter_ID}`
    );
    if (!Network_Response.ok) return null;
    const Fetched_Chapter_Data: Chapter_Data = await Network_Response.json();

    await Save_Hadith_Chapter_Locally(Cache_Key, Fetched_Chapter_Data);
    return Fetched_Chapter_Data;
  } catch (Error_Object) {
    Debug_Warn(`[Hadith-API] Failed to fetch Chapter ${Chapter_ID} in ${Collection_ID}:`, Error_Object);
    return null;
  }
};

export const Get_Narration = async (
  Collection_ID: string,
  Hadith_ID: number
): Promise<Narration | null> => {
  try {
    const Network_Response = await fetch(
      `${API_BASE_PATH}?Collection=${encodeURIComponent(Collection_ID)}&ID=${Hadith_ID}`
    );
    if (!Network_Response.ok) return null;
    const Fetched_Narration_Data: Narration = await Network_Response.json();
    return Fetched_Narration_Data;
  } catch (Error_Object) {
    Debug_Warn(`[Hadith-API] Failed to fetch Narration ${Hadith_ID} in ${Collection_ID}:`, Error_Object);
    return null;
  }
};

interface Hadith_Resource_Definition {
  Verse_Param: "Translation" | "Transliteration";
  Verse_JSON_Key: "Translations" | "Transliterations";
  Word_JSON_Key: "KBK_Translations" | "Word_By_Word_Transliterations";
  Cache_Get: <T>(Key: string) => Promise<T | null>;
  Cache_Save: (Key: string, Data: unknown) => Promise<void>;
}

const Translation_Resource_Definition: Hadith_Resource_Definition = {
  Verse_Param: "Translation",
  Verse_JSON_Key: "Translations",
  Word_JSON_Key: "KBK_Translations",
  Cache_Get: Get_Saved_Hadith_Translation,
  Cache_Save: Save_Hadith_Translation_Locally,
};

const Transliteration_Resource_Definition: Hadith_Resource_Definition = {
  Verse_Param: "Transliteration",
  Verse_JSON_Key: "Transliterations",
  Word_JSON_Key: "Word_By_Word_Transliterations",
  Cache_Get: Get_Saved_Hadith_Transliteration,
  Cache_Save: Save_Hadith_Transliteration_Locally,
};

const Fetch_Single_Hadith_Resource = async (
  Resource_Definition: Hadith_Resource_Definition,
  Collection_ID: string,
  Hadith_IDs_List: number[],
  Edition_Identifier: string,
  Is_Verse_Requested_Flag: boolean,
  Is_Word_Requested_Flag: boolean
): Promise<{ Hadith?: any[]; Kalimah?: any[] }> => {
  Debug_Log(`[${Resource_Definition.Verse_Param}] Fetch_Single_Hadith_Resource IN →`, {
    Collection_ID,
    Hadith_IDs_List,
    Edition_Identifier,
    Is_Verse_Requested_Flag,
    Is_Word_Requested_Flag,
  });

  const Base_Cache_Key = Build_Hadith_Resource_Key(Hadith_IDs_List, [Edition_Identifier], Is_Word_Requested_Flag);
  const Full_Cache_Key = `${Collection_ID}::${Base_Cache_Key}`;

  const Cached_Resource_Data = await Resource_Definition.Cache_Get<{ Hadith?: any[]; Kalimah?: any[] }>(Full_Cache_Key);
  const Is_Verse_Satisfied_Flag = !Is_Verse_Requested_Flag || Boolean(Cached_Resource_Data?.Hadith?.length);
  const Is_Word_Satisfied_Flag = !Is_Word_Requested_Flag || Boolean(Cached_Resource_Data?.Kalimah?.length);

  if (Cached_Resource_Data && Is_Verse_Satisfied_Flag && Is_Word_Satisfied_Flag) {
    Debug_Log(`[${Resource_Definition.Verse_Param}] Fetch_Single_Hadith_Resource OUT (cache hit) →`, {
      Collection_ID,
      Hadith_IDs_List,
      Edition_Identifier,
      Hadith_Count: Cached_Resource_Data.Hadith?.length ?? 0,
      Word_Count: Cached_Resource_Data.Kalimah?.length ?? 0,
    });
    return Cached_Resource_Data;
  }

  const Query_Parameters = new URLSearchParams();
  Query_Parameters.append("Collection", Collection_ID);
  for (const Target_Hadith_ID of Hadith_IDs_List) Query_Parameters.append("ID", String(Target_Hadith_ID));
  Query_Parameters.append(Resource_Definition.Verse_Param, Edition_Identifier);
  if (Is_Word_Requested_Flag) Query_Parameters.append("WBW", "true");

  const Target_URL = `${API_BASE_PATH}?${Query_Parameters.toString()}`;
  Debug_Log(`[${Resource_Definition.Verse_Param}] network request →`, Target_URL);

  try {
    const Network_Response = await fetch(Target_URL);
    if (!Network_Response.ok) throw new Error(`HTTP ${Network_Response.status}`);
    const Raw_Response_Data = await Network_Response.json();

    const Formatted_Result: { Hadith?: any[]; Kalimah?: any[] } = {
      Hadith: Is_Verse_Requested_Flag ? Raw_Response_Data[Resource_Definition.Verse_JSON_Key] || [] : undefined,
      Kalimah: Is_Word_Requested_Flag ? Raw_Response_Data[Resource_Definition.Word_JSON_Key] || [] : undefined,
    };

    await Resource_Definition.Cache_Save(Full_Cache_Key, Formatted_Result);

    Debug_Log(`[${Resource_Definition.Verse_Param}] Fetch_Single_Hadith_Resource OUT →`, {
      Collection_ID,
      Hadith_IDs_List,
      Edition_Identifier,
      Hadith_Count: Formatted_Result.Hadith?.length ?? 0,
      Word_Count: Formatted_Result.Kalimah?.length ?? 0,
    });

    return Formatted_Result;
  } catch (Error_Object) {
    Debug_Warn(`[${Resource_Definition.Verse_Param}] network fetch failed →`, { Collection_ID, Hadith_IDs_List, Edition_Identifier, error: Error_Object });

    if (Cached_Resource_Data) return Cached_Resource_Data;
    return { Hadith: Is_Verse_Requested_Flag ? [] : undefined, Kalimah: Is_Word_Requested_Flag ? [] : undefined };
  }
};

export const Fetch_Hadith_Translation = (
  Collection_ID: string,
  Hadith_IDs_List: number[],
  Translation_Edition_Identifier: string,
  Is_Verse_Requested_Flag: boolean = true,
  Is_Word_Requested_Flag: boolean = false
): Promise<Translation_Resource_Result> =>
  Fetch_Single_Hadith_Resource(Translation_Resource_Definition, Collection_ID, Hadith_IDs_List, Translation_Edition_Identifier, Is_Verse_Requested_Flag, Is_Word_Requested_Flag);

export const Fetch_Hadith_Transliteration = (
  Collection_ID: string,
  Hadith_IDs_List: number[],
  Transliteration_Edition_Identifier: string,
  Is_Verse_Requested_Flag: boolean = true,
  Is_Word_Requested_Flag: boolean = false
): Promise<Transliteration_Resource_Result> =>
  Fetch_Single_Hadith_Resource(
    Transliteration_Resource_Definition,
    Collection_ID,
    Hadith_IDs_List,
    Transliteration_Edition_Identifier,
    Is_Verse_Requested_Flag,
    Is_Word_Requested_Flag
  );

const Hadith_Composite_Cache_Store = new Map<string, Promise<Hadith_Composite>>();

export const Fetch_Hadith_Composite = (
  Collection_ID: string,
  Hadith_ID: number,
  Translation_Editions: string | string[] = "",
  Transliteration_Editions: string | string[] = "",
  Word_Translation_Editions: string | string[] = "",
  Word_Transliteration_Editions: string | string[] = ""
): Promise<Hadith_Composite> => {
  Debug_Log("[Fetch_Hadith_Composite] Raw_Storage_Data args IN →", {
    Collection_ID,
    Hadith_ID,
    Translation_Editions,
    Transliteration_Editions,
    Word_Translation_Editions,
    Word_Transliteration_Editions,
  });

  const Convert_To_Set = (Value: string | string[]) =>
    new Set(Array.isArray(Value) ? Value.filter(Boolean) : Value ? [Value] : []);

  const Verse_Translations_Set = Convert_To_Set(Translation_Editions);
  const Word_Translations_Set = Convert_To_Set(Word_Translation_Editions);
  const Verse_Transliterations_Set = Convert_To_Set(Transliteration_Editions);
  const Word_Transliterations_Set = Convert_To_Set(Word_Transliteration_Editions);

  const All_Translation_IDs_List = Array.from(
    new Set([...Verse_Translations_Set, ...Word_Translations_Set])
  ).sort();
  const All_Transliteration_IDs_List = Array.from(
    new Set([...Verse_Transliterations_Set, ...Word_Transliterations_Set])
  ).sort();

  const Combined_Request_Key =
    `${Collection_ID}:${Hadith_ID}` +
    `:T_Verse[${Array.from(Verse_Translations_Set).sort().join(",")}]` +
    `:T_WBW[${Array.from(Word_Translations_Set).sort().join(",")}]` +
    `:N_Verse[${Array.from(Verse_Transliterations_Set).sort().join(",")}]` +
    `:N_WBW[${Array.from(Word_Transliterations_Set).sort().join(",")}]`;

  if (!Hadith_Composite_Cache_Store.has(Combined_Request_Key)) {
    Debug_Log("[Fetch_Hadith_Composite] cache miss, starting fetch →", { Combined_Request_Key });

    const Composite_Promise_Instance = (async () => {
      const Base_Narration_Data = await Get_Narration(Collection_ID, Hadith_ID);
      if (!Base_Narration_Data) {
        throw new Error(`Narration ${Hadith_ID} in ${Collection_ID} could not be found.`);
      }

      const [Translation_Results_List, Transliteration_Results_List] = await Promise.all([
        Promise.allSettled(
          All_Translation_IDs_List.map(async (Edition_ID) => {
            const Is_Verse_Requested_Flag = Verse_Translations_Set.has(Edition_ID);
            const Is_Word_Requested_Flag = Word_Translations_Set.has(Edition_ID);
            const Resource_Result = await Fetch_Single_Hadith_Resource(
              Translation_Resource_Definition,
              Collection_ID,
              [Hadith_ID],
              Edition_ID,
              Is_Verse_Requested_Flag,
              Is_Word_Requested_Flag
            );
            return { Resource_Result, Is_Verse_Requested_Flag, Is_Word_Requested_Flag };
          })
        ),
        Promise.allSettled(
          All_Transliteration_IDs_List.map(async (Edition_ID) => {
            const Is_Verse_Requested_Flag = Verse_Transliterations_Set.has(Edition_ID);
            const Is_Word_Requested_Flag = Word_Transliterations_Set.has(Edition_ID);
            const Resource_Result = await Fetch_Single_Hadith_Resource(
              Transliteration_Resource_Definition,
              Collection_ID,
              [Hadith_ID],
              Edition_ID,
              Is_Verse_Requested_Flag,
              Is_Word_Requested_Flag
            );
            return { Resource_Result, Is_Verse_Requested_Flag, Is_Word_Requested_Flag };
          })
        ),
      ]);

      const Accumulated_Translations_List: Translation[] = [];
      const Accumulated_Word_By_Word_Translations_List: KBK_Translation[] = [];
      for (const Settled_Result of Translation_Results_List) {
        if (Settled_Result.status === "fulfilled") {
          const { Resource_Result, Is_Verse_Requested_Flag, Is_Word_Requested_Flag } = Settled_Result.value;
          if (Is_Verse_Requested_Flag && Resource_Result.Hadith) Accumulated_Translations_List.push(...Resource_Result.Hadith);
          if (Is_Word_Requested_Flag && Resource_Result.Kalimah) Accumulated_Word_By_Word_Translations_List.push(...Resource_Result.Kalimah);
        } else {
          Debug_Warn("[Translation] a per-Edition_Name fetch was rejected →", Settled_Result.reason);
        }
      }

      const Accumulated_Transliterations_List: Transliteration[] = [];
      const Accumulated_Word_By_Word_Transliterations_List: KBK_Transliteration[] = [];
      for (const Settled_Result of Transliteration_Results_List) {
        if (Settled_Result.status === "fulfilled") {
          const { Resource_Result, Is_Verse_Requested_Flag, Is_Word_Requested_Flag } = Settled_Result.value;
          if (Is_Verse_Requested_Flag && Resource_Result.Hadith) Accumulated_Transliterations_List.push(...Resource_Result.Hadith);
          if (Is_Word_Requested_Flag && Resource_Result.Kalimah) Accumulated_Word_By_Word_Transliterations_List.push(...Resource_Result.Kalimah);
        } else {
          Debug_Warn("[Transliteration] a per-Edition_Name fetch was rejected →", Settled_Result.reason);
        }
      }

      Debug_Log("[Fetch_Hadith_Composite] aggregate OUT →", {
        Collection_ID,
        Hadith_ID,
        Translation_Count: Accumulated_Translations_List.length,
        Word_By_Word_Translation_Count: Accumulated_Word_By_Word_Translations_List.length,
        Transliteration_Count: Accumulated_Transliterations_List.length,
        Word_By_Word_Transliteration_Count: Accumulated_Word_By_Word_Transliterations_List.length,
      });

      const Final_Composite_Result: Hadith_Composite = {
        Narration: Base_Narration_Data,
      };
      if (Accumulated_Translations_List.length) Final_Composite_Result.Translation = Accumulated_Translations_List;
      if (Accumulated_Word_By_Word_Translations_List.length) Final_Composite_Result.KBK_Translation = Accumulated_Word_By_Word_Translations_List;
      if (Accumulated_Transliterations_List.length) Final_Composite_Result.Transliteration = Accumulated_Transliterations_List;
      if (Accumulated_Word_By_Word_Transliterations_List.length) Final_Composite_Result.KBK_Transliteration = Accumulated_Word_By_Word_Transliterations_List;

      return Final_Composite_Result;
    })();

    Hadith_Composite_Cache_Store.set(Combined_Request_Key, Composite_Promise_Instance);
    Composite_Promise_Instance.catch((Error_Object) => {
      Debug_Warn("[Fetch_Hadith_Composite] request failed, evicting cache entry →", {
        Combined_Request_Key,
        error: Error_Object,
      });
      Hadith_Composite_Cache_Store.delete(Combined_Request_Key);
    });
  } else {
    Debug_Log("[Fetch_Hadith_Composite] cache hit, reusing in-flight/resolved promise →", { Combined_Request_Key });
  }

  return Hadith_Composite_Cache_Store.get(Combined_Request_Key)!;
};

function Create_Metadata_List_Fetcher<T>(Query_Parameter_Name: string, Response_Data_Key: string): () => Promise<T[]> {
  return async () => {
    try {
      const Network_Response = await fetch(`${API_BASE_PATH}?${Query_Parameter_Name}=true`);
      if (!Network_Response.ok) throw new Error(`HTTP ${Network_Response.status}`);
      const Raw_Response_Data = await Network_Response.json();
      return (Raw_Response_Data[Response_Data_Key] ?? []) as T[];
    } catch (Error_Object) {
      console.error(`error fetching ${Response_Data_Key}:`, Error_Object);
      return [];
    }
  };
}

export const Fetch_Translation_List = Create_Metadata_List_Fetcher<Translation_List_Entry>(
  "Available-Translations",
  "Available-Translations"
);

export const Fetch_Word_Translation_List = Create_Metadata_List_Fetcher<Translation_List_Entry>(
  "Available-WBW-Translations",
  "Available-WBW-Translations"
);

export const Fetch_Transliteration_List = Create_Metadata_List_Fetcher<Transliteration_List_Entry>(
  "Available-Transliterations",
  "Available-Transliterations"
);

export const Fetch_Word_Transliteration_List = Create_Metadata_List_Fetcher<Transliteration_List_Entry>(
  "Available-WBW-Transliterations",
  "Available-WBW-Transliterations"
);