import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const Storage_Key = "lovable-visit-Visit_Log_Entries";
const Max_Entries_Limit = 500;

export function Visit_Tracker() {
  const Location_Data = useLocation();

  useEffect(() => {
    try {
      const Raw_Storage_Data = localStorage.getItem(Storage_Key);
      const Visit_Log_Entries: { route: string; ts: number }[] = Raw_Storage_Data 
        ? JSON.parse(Raw_Storage_Data) 
        : [];

      Visit_Log_Entries.push({ 
        route: Location_Data.pathname, 
        ts: Date.now() 
      });

      if (Visit_Log_Entries.length > Max_Entries_Limit) {
        Visit_Log_Entries.splice(0, Visit_Log_Entries.length - Max_Entries_Limit);
      }

      localStorage.setItem(Storage_Key, JSON.stringify(Visit_Log_Entries));
    } catch { 
    }
  }, [Location_Data.pathname]);

  return null;
}