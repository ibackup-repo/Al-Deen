import { useState, useEffect, useCallback } from "react";

const Storage_Key = "Arabic-vocab-Bookmarks";

function Read(): string[] {
  try {
    const Raw_Storage_Data = localStorage.getItem(Storage_Key);
    return Raw_Storage_Data ? JSON.parse(Raw_Storage_Data) : [];
  } catch {
    return [];
  }
}

export function Use_Arabic_Bookmarks() {
  const [Bookmarks, Set_Bookmarks] = useState<string[]>(() => Read());

  useEffect(() => {
    const On_Storage = (e: StorageEvent) => {
      if (e.key === Storage_Key) Set_Bookmarks(Read());
    };
    window.addEventListener("storage", On_Storage);
    return () => window.removeEventListener("storage", On_Storage);
  }, []);

  const Persist = (next: string[]) => {
    Set_Bookmarks(next);
    try {
      localStorage.setItem(Storage_Key, JSON.stringify(next));
    } catch {}
  };

  const Is_Bookmarked = useCallback((key: string) => Bookmarks.includes(key), [Bookmarks]);

  const toggle = useCallback(
    (key: string) => {
      const next = Bookmarks.includes(key)
        ? Bookmarks.filter((k) => k !== key)
        : [...Bookmarks, key];
      Persist(next);
    },
    [Bookmarks]
  );

  return { Bookmarks, Is_Bookmarked, toggle };
}
