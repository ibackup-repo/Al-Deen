export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, Storage_Key)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      Bookmarks: {
        Row: {
          Ayah_ID: number | null
          Created_At: string
          id: string
          Note: string | null
          Surah_ID: number
          User_ID: string
        }
        Insert: {
          Ayah_ID?: number | null
          Created_At?: string
          id?: string
          Note?: string | null
          Surah_ID: number
          User_ID: string
        }
        Update: {
          Ayah_ID?: number | null
          Created_At?: string
          id?: string
          Note?: string | null
          Surah_ID?: number
          User_ID?: string
        }
        Relationships: []
      }
      goal_progress: {
        Row: {
          completed: boolean
          Created_At: string
          date: string
          Goal_ID: string
          id: string
          Minutes_Read: number | null
          Seconds_Read: number | null
          User_ID: string
          Verses_Read: number | null
        }
        Insert: {
          completed?: boolean
          Created_At?: string
          date: string
          Goal_ID: string
          id?: string
          Minutes_Read?: number | null
          Seconds_Read?: number | null
          User_ID: string
          Verses_Read?: number | null
        }
        Update: {
          completed?: boolean
          Created_At?: string
          date?: string
          Goal_ID?: string
          id?: string
          Minutes_Read?: number | null
          Seconds_Read?: number | null
          User_ID?: string
          Verses_Read?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_progress_goal_id_fkey"
            columns: ["Goal_ID"]
            isOneToOne: false
            referencedRelation: "quran_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      Notes: {
        Row: {
          Ayah_ID: number | null
          content: string
          Created_At: string
          id: string
          Is_Private: boolean
          Surah_ID: number
          Updated_At: string
          User_ID: string
        }
        Insert: {
          Ayah_ID?: number | null
          content: string
          Created_At?: string
          id?: string
          Is_Private?: boolean
          Surah_ID: number
          Updated_At?: string
          User_ID: string
        }
        Update: {
          Ayah_ID?: number | null
          content?: string
          Created_At?: string
          id?: string
          Is_Private?: boolean
          Surah_ID?: number
          Updated_At?: string
          User_ID?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          Created_At: string
          display_name: string | null
          Email_Address_Input: string | null
          id: string
          Updated_At: string
          User_ID: string
        }
        Insert: {
          avatar_url?: string | null
          Created_At?: string
          display_name?: string | null
          Email_Address_Input?: string | null
          id?: string
          Updated_At?: string
          User_ID: string
        }
        Update: {
          avatar_url?: string | null
          Created_At?: string
          display_name?: string | null
          Email_Address_Input?: string | null
          id?: string
          Updated_At?: string
          User_ID?: string
        }
        Relationships: []
      }
      quran_goals: {
        Row: {
          Created_At: string
          Current_Streak: number
          Daily_Target: number | null
          End_Date: string | null
          Frequency: string
          Goal_Type: string
          id: string
          Is_Active: boolean
          Longest_Streak: number
          preset: string | null
          Start_Date: string
          Target_Duration: number | null
          Updated_At: string
          User_ID: string
        }
        Insert: {
          Created_At?: string
          Current_Streak?: number
          Daily_Target?: number | null
          End_Date?: string | null
          Frequency?: string
          Goal_Type: string
          id?: string
          Is_Active?: boolean
          Longest_Streak?: number
          preset?: string | null
          Start_Date?: string
          Target_Duration?: number | null
          Updated_At?: string
          User_ID: string
        }
        Update: {
          Created_At?: string
          Current_Streak?: number
          Daily_Target?: number | null
          End_Date?: string | null
          Frequency?: string
          Goal_Type?: string
          id?: string
          Is_Active?: boolean
          Longest_Streak?: number
          preset?: string | null
          Start_Date?: string
          Target_Duration?: number | null
          Updated_At?: string
          User_ID?: string
        }
        Relationships: []
      }
      reading_progress: {
        Row: {
          id: string
          Last_Ayah_ID: number
          Last_Juz_ID: number | null
          Last_Page_ID: number | null
          Last_Surah_ID: number
          Updated_At: string
          User_ID: string
        }
        Insert: {
          id?: string
          Last_Ayah_ID?: number
          Last_Juz_ID?: number | null
          Last_Page_ID?: number | null
          Last_Surah_ID?: number
          Updated_At?: string
          User_ID: string
        }
        Update: {
          id?: string
          Last_Ayah_ID?: number
          Last_Juz_ID?: number | null
          Last_Page_ID?: number | null
          Last_Surah_ID?: number
          Updated_At?: string
          User_ID?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
