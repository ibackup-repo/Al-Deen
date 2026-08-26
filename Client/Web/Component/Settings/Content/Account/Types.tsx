// Component/Settings/Content/Account/Types.tsx
import { ReactNode } from "react";

export type Account_Subcategory = "profile" | "Bookmarks" | "Notes" | "History";
export type Credential_Modal_Type = "Password_Val" | "Email_Address_Input" | null;

export interface Account_Tab_Configuration {
  id: Account_Subcategory;
  icon: ReactNode;
  label: string;
}

export interface Account_Section_Properties {
  User: any;
  Display_Name: string;
  Initials: string;
  Handle_Sign_Out: () => void;
  navigate: (path: string) => void;
  Set_Settings_Sidebar_Open: (Open: boolean) => void;
  Active_Subcategory: Account_Subcategory;
}