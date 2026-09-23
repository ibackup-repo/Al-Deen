// Source/Library/Aid-API.ts

import type {
  Adiyah_Category_Record,
  Adiyah_Record,
  Adiyah_Category_Output_Payload,
  Article_Topic_Record,
  Article_Record,
  Article_Topic_Output_Payload,
  Asma_Ul_Husna_Record,
  Pillar_Record,
  Prophet_Record,
  Branch_Record,
  Aid_Resource_Information_Payload,
} from "./Aid-Types";

import {
  Get_Saved_Aid_Dua_Categories,
  Save_Aid_Dua_Categories_Locally,
  Get_Saved_Aid_Dua_Category,
  Save_Aid_Dua_Category_Locally,
  Get_Saved_Aid_Article_Topics,
  Save_Aid_Article_Topics_Locally,
  Get_Saved_Aid_Article_Topic,
  Save_Aid_Article_Topic_Locally,
  Get_Saved_Aid_Names,
  Save_Aid_Names_Locally,
  Get_Saved_Aid_Pillars,
  Save_Aid_Pillars_Locally,
  Get_Saved_Aid_Prophets,
  Save_Aid_Prophets_Locally,
  Get_Saved_Aid_Schools,
  Save_Aid_Schools_Locally,
  Build_Aid_Dua_Category_Key,
} from "./Service-Worker-Cache-Store";

const Application_API_Base_Path_String: string = "/API/Aid";
const Enable_API_Debug_Logging_Flag: boolean = true;

const Execute_Debug_Log = (...Log_Arguments_List: unknown[]): void => {
  if (Enable_API_Debug_Logging_Flag) {
    console.log(...Log_Arguments_List);
  }
};

const Execute_Debug_Warning = (...Log_Arguments_List: unknown[]): void => {
  if (Enable_API_Debug_Logging_Flag) {
    console.warn(...Log_Arguments_List);
  }
};

function Memoize_Async_Function<Returned_Data_Type>(
  Data_Producer_Function: () => Promise<Returned_Data_Type>
): () => Promise<Returned_Data_Type> {
  let Cached_Promise_Instance: Promise<Returned_Data_Type> | null = null;
  return () => {
    if (!Cached_Promise_Instance) {
      Cached_Promise_Instance = Data_Producer_Function();
      Cached_Promise_Instance.catch(() => {
        Cached_Promise_Instance = null;
      });
    }
    return Cached_Promise_Instance;
  };
}

export const Fetch_Available_Resources: () => Promise<Aid_Resource_Information_Payload> =
  Memoize_Async_Function(async () => {
    try {
      const HTTP_Response_Object = await fetch(
        `${Application_API_Base_Path_String}?Available-Resources=true`
      );
      if (!HTTP_Response_Object.ok) {
        throw new Error(`HTTP ${HTTP_Response_Object.status}`);
      }
      return (await HTTP_Response_Object.json()) as Aid_Resource_Information_Payload;
    } catch (Error_Context) {
      Execute_Debug_Warning(
        "[Aid-API] Failed to fetch Available Resources:",
        Error_Context
      );
      return { "Available-Resources": [] };
    }
  });

export const Fetch_Adiyah_Categories: () => Promise<
  Adiyah_Category_Record[]
> = Memoize_Async_Function(async () => {
  const Primary_Cache_Key_String: string = "All";

  try {
    const HTTP_Response_Object = await fetch(
      `${Application_API_Base_Path_String}?Resource=Dua&Categories=true`
    );
    if (!HTTP_Response_Object.ok) {
      throw new Error(`HTTP ${HTTP_Response_Object.status}`);
    }
    const Response_Payload_Data: any = await HTTP_Response_Object.json();
    const Categories_Collection = (Response_Payload_Data["Categories"] ||
      Response_Payload_Data) as Adiyah_Category_Record[];

    await Save_Aid_Dua_Categories_Locally(
      Categories_Collection,
      Primary_Cache_Key_String
    );
    return Categories_Collection;
  } catch (Error_Context) {
    Execute_Debug_Warning(
      "[Aid-API] Failed to fetch Dua Categories, checking cache...",
      Error_Context
    );

    const Cached_Categories_Collection =
      await Get_Saved_Aid_Dua_Categories<Adiyah_Category_Record[]>(
        Primary_Cache_Key_String
      );
    if (Cached_Categories_Collection) return Cached_Categories_Collection;

    throw new Error(
      "No network connection available and no cached Dua Categories found."
    );
  }
});

export const Get_Adiyah_Category = async (
  Target_Category_ID_Number: number,
  Should_Include_Word_By_Word: boolean = false
): Promise<Adiyah_Category_Output_Payload | null> => {
  const Structured_Cache_Key_String: string = Build_Aid_Dua_Category_Key(
    Target_Category_ID_Number,
    Should_Include_Word_By_Word
  );
  const Cached_Category_Payload =
    await Get_Saved_Aid_Dua_Category<Adiyah_Category_Output_Payload>(
      Structured_Cache_Key_String
    );
  if (Cached_Category_Payload) return Cached_Category_Payload;

  try {
    const Query_Parameters_Builder = new URLSearchParams({
      Resource: "Dua",
      Category: String(Target_Category_ID_Number),
    });
    if (Should_Include_Word_By_Word) {
      Query_Parameters_Builder.append("WBW", "true");
    }

    const HTTP_Response_Object = await fetch(
      `${Application_API_Base_Path_String}?${Query_Parameters_Builder.toString()}`
    );
    if (!HTTP_Response_Object.ok) return null;
    const Response_Payload_Data: Adiyah_Category_Output_Payload =
      await HTTP_Response_Object.json();

    await Save_Aid_Dua_Category_Locally(
      Structured_Cache_Key_String,
      Response_Payload_Data
    );
    return Response_Payload_Data;
  } catch (Error_Context) {
    Execute_Debug_Warning(
      `[Aid-API] Failed to fetch Dua Category ${Target_Category_ID_Number}:`,
      Error_Context
    );
    return null;
  }
};

export const Get_Adiyah_By_ID = async (
  Target_Adiyah_ID_Number: number
): Promise<Adiyah_Record | null> => {
  try {
    const HTTP_Response_Object = await fetch(
      `${Application_API_Base_Path_String}?Resource=Dua&ID=${Target_Adiyah_ID_Number}`
    );
    if (!HTTP_Response_Object.ok) return null;
    return (await HTTP_Response_Object.json()) as Adiyah_Record;
  } catch (Error_Context) {
    Execute_Debug_Warning(
      `[Aid-API] Failed to fetch Dua ID ${Target_Adiyah_ID_Number}:`,
      Error_Context
    );
    return null;
  }
};

export const Fetch_Article_Topics: () => Promise<
  Article_Topic_Record[]
> = Memoize_Async_Function(async () => {
  const Primary_Cache_Key_String: string = "All";

  try {
    const HTTP_Response_Object = await fetch(
      `${Application_API_Base_Path_String}?Resource=Articles&Topics=true`
    );
    if (!HTTP_Response_Object.ok) {
      throw new Error(`HTTP ${HTTP_Response_Object.status}`);
    }
    const Response_Payload_Data: any = await HTTP_Response_Object.json();
    const Topics_Collection = (Response_Payload_Data["Topics"] ||
      Response_Payload_Data) as Article_Topic_Record[];

    await Save_Aid_Article_Topics_Locally(
      Topics_Collection,
      Primary_Cache_Key_String
    );
    return Topics_Collection;
  } catch (Error_Context) {
    Execute_Debug_Warning(
      "[Aid-API] Failed to fetch Article Topics, checking cache...",
      Error_Context
    );

    const Cached_Topics_Collection =
      await Get_Saved_Aid_Article_Topics<Article_Topic_Record[]>(
        Primary_Cache_Key_String
      );
    if (Cached_Topics_Collection) return Cached_Topics_Collection;

    throw new Error(
      "No network connection available and no cached Article Topics found."
    );
  }
});

export const Get_Article_Topic = async (
  Target_Topic_ID_Number: number
): Promise<Article_Topic_Output_Payload | null> => {
  const Cached_Topic_Payload =
    await Get_Saved_Aid_Article_Topic<Article_Topic_Output_Payload>(
      Target_Topic_ID_Number
    );
  if (Cached_Topic_Payload) return Cached_Topic_Payload;

  try {
    const HTTP_Response_Object = await fetch(
      `${Application_API_Base_Path_String}?Resource=Articles&Topic=${Target_Topic_ID_Number}`
    );
    if (!HTTP_Response_Object.ok) return null;
    const Response_Payload_Data: Article_Topic_Output_Payload =
      await HTTP_Response_Object.json();

    await Save_Aid_Article_Topic_Locally(
      Target_Topic_ID_Number,
      Response_Payload_Data
    );
    return Response_Payload_Data;
  } catch (Error_Context) {
    Execute_Debug_Warning(
      `[Aid-API] Failed to fetch Article Topic ${Target_Topic_ID_Number}:`,
      Error_Context
    );
    return null;
  }
};

export const Get_Article_By_ID = async (
  Target_Article_ID_Number: number
): Promise<Article_Record | null> => {
  try {
    const HTTP_Response_Object = await fetch(
      `${Application_API_Base_Path_String}?Resource=Articles&ID=${Target_Article_ID_Number}`
    );
    if (!HTTP_Response_Object.ok) return null;
    return (await HTTP_Response_Object.json()) as Article_Record;
  } catch (Error_Context) {
    Execute_Debug_Warning(
      `[Aid-API] Failed to fetch Article ID ${Target_Article_ID_Number}:`,
      Error_Context
    );
    return null;
  }
};

export const Fetch_Asma_Ul_Husna: () => Promise<
  Asma_Ul_Husna_Record[]
> = Memoize_Async_Function(async () => {
  const Primary_Cache_Key_String: string = "All";

  try {
    const HTTP_Response_Object = await fetch(
      `${Application_API_Base_Path_String}?Resource=Names`
    );
    if (!HTTP_Response_Object.ok) {
      throw new Error(`HTTP ${HTTP_Response_Object.status}`);
    }
    const Response_Payload_Data: any = await HTTP_Response_Object.json();
    const Names_Collection = (Response_Payload_Data["Names"] ||
      Response_Payload_Data) as Asma_Ul_Husna_Record[];

    await Save_Aid_Names_Locally(
      Names_Collection,
      Primary_Cache_Key_String
    );
    return Names_Collection;
  } catch (Error_Context) {
    Execute_Debug_Warning(
      "[Aid-API] Failed to fetch Names of Allah, checking cache...",
      Error_Context
    );

    const Cached_Names_Collection =
      await Get_Saved_Aid_Names<Asma_Ul_Husna_Record[]>(
        Primary_Cache_Key_String
      );
    if (Cached_Names_Collection) return Cached_Names_Collection;

    throw new Error(
      "No network connection available and no cached Names found."
    );
  }
});

export const Fetch_Pillars: () => Promise<
  Pillar_Record[]
> = Memoize_Async_Function(async () => {
  const Primary_Cache_Key_String: string = "All";

  try {
    const HTTP_Response_Object = await fetch(
      `${Application_API_Base_Path_String}?Resource=Pillars`
    );
    if (!HTTP_Response_Object.ok) {
      throw new Error(`HTTP ${HTTP_Response_Object.status}`);
    }
    const Response_Payload_Data: any = await HTTP_Response_Object.json();
    const Pillars_Collection = (Response_Payload_Data["Pillars"] ||
      Response_Payload_Data) as Pillar_Record[];

    await Save_Aid_Pillars_Locally(
      Pillars_Collection,
      Primary_Cache_Key_String
    );
    return Pillars_Collection;
  } catch (Error_Context) {
    Execute_Debug_Warning(
      "[Aid-API] Failed to fetch Pillars, checking cache...",
      Error_Context
    );

    const Cached_Pillars_Collection =
      await Get_Saved_Aid_Pillars<Pillar_Record[]>(Primary_Cache_Key_String);
    if (Cached_Pillars_Collection) return Cached_Pillars_Collection;

    throw new Error(
      "No network connection available and no cached Pillars found."
    );
  }
});

export const Get_Pillar_By_ID = async (
  Target_Pillar_ID_Number: number
): Promise<Pillar_Record | null> => {
  try {
    const HTTP_Response_Object = await fetch(
      `${Application_API_Base_Path_String}?Resource=Pillars&ID=${Target_Pillar_ID_Number}`
    );
    if (!HTTP_Response_Object.ok) return null;
    return (await HTTP_Response_Object.json()) as Pillar_Record;
  } catch (Error_Context) {
    Execute_Debug_Warning(
      `[Aid-API] Failed to fetch Pillar ID ${Target_Pillar_ID_Number}:`,
      Error_Context
    );
    return null;
  }
};

export const Fetch_Prophets: () => Promise<
  Prophet_Record[]
> = Memoize_Async_Function(async () => {
  const Primary_Cache_Key_String: string = "All";

  try {
    const HTTP_Response_Object = await fetch(
      `${Application_API_Base_Path_String}?Resource=Prophets`
    );
    if (!HTTP_Response_Object.ok) {
      throw new Error(`HTTP ${HTTP_Response_Object.status}`);
    }
    const Response_Payload_Data: any = await HTTP_Response_Object.json();
    const Prophets_Collection = (Response_Payload_Data["Prophets"] ||
      Response_Payload_Data) as Prophet_Record[];

    await Save_Aid_Prophets_Locally(
      Prophets_Collection,
      Primary_Cache_Key_String
    );
    return Prophets_Collection;
  } catch (Error_Context) {
    Execute_Debug_Warning(
      "[Aid-API] Failed to fetch Prophets, checking cache...",
      Error_Context
    );

    const Cached_Prophets_Collection =
      await Get_Saved_Aid_Prophets<Prophet_Record[]>(
        Primary_Cache_Key_String
      );
    if (Cached_Prophets_Collection) return Cached_Prophets_Collection;

    throw new Error(
      "No network connection available and no cached Prophets found."
    );
  }
});

export const Get_Prophet_By_ID = async (
  Target_Prophet_ID_Number: number
): Promise<Prophet_Record | null> => {
  try {
    const HTTP_Response_Object = await fetch(
      `${Application_API_Base_Path_String}?Resource=Prophets&ID=${Target_Prophet_ID_Number}`
    );
    if (!HTTP_Response_Object.ok) return null;
    return (await HTTP_Response_Object.json()) as Prophet_Record;
  } catch (Error_Context) {
    Execute_Debug_Warning(
      `[Aid-API] Failed to fetch Prophet ID ${Target_Prophet_ID_Number}:`,
      Error_Context
    );
    return null;
  }
};

export const Fetch_Schools_And_Branches: () => Promise<
  Branch_Record[]
> = Memoize_Async_Function(async () => {
  const Primary_Cache_Key_String: string = "All";

  try {
    const HTTP_Response_Object = await fetch(
      `${Application_API_Base_Path_String}?Resource=Schools`
    );
    if (!HTTP_Response_Object.ok) {
      throw new Error(`HTTP ${HTTP_Response_Object.status}`);
    }
    const Response_Payload_Data: any = await HTTP_Response_Object.json();
    const Branches_Collection = (Response_Payload_Data["Branches"] ||
      Response_Payload_Data) as Branch_Record[];

    await Save_Aid_Schools_Locally(
      Branches_Collection,
      Primary_Cache_Key_String
    );
    return Branches_Collection;
  } catch (Error_Context) {
    Execute_Debug_Warning(
      "[Aid-API] Failed to fetch Schools and Branches, checking cache...",
      Error_Context
    );

    const Cached_Branches_Collection =
      await Get_Saved_Aid_Schools<Branch_Record[]>(Primary_Cache_Key_String);
    if (Cached_Branches_Collection) return Cached_Branches_Collection;

    throw new Error(
      "No network connection available and no cached Schools found."
    );
  }
});