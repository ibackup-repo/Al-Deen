export interface Goal_Progress {
  Day_Number: number;
  Total_Days: number;
  Start_Position: { Surah_ID: number; Surah_Name: string; Ayah: number };
  End_Position: { Surah_ID: number; Surah_Name: string; Ayah: number };
  Today_Ayaat_Target: number;
  Completed_Today: number;
  Today_Percent: number;
}

export interface Goal_Stats {
  Total_Minutes_Read: number;
  Today_Minutes: number;
  Today_Percentage: number;
  Ayaat_Read: number;
  Overall_Progress: number;
  Current_Surah: any;
  Current_Ayah: number;
  Current_Juz: number;
  Current_Page: number;
}