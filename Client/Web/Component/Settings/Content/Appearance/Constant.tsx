import { User, Bookmark, FileText, Clock } from "lucide-react";
import type { Account_Tab_Configuration } from "./Types";

export const ACCOUNT_TABS: Account_Tab_Configuration[] = [
  { id: "General",   icon: <User className="h-3.5 w-3.5" />,     label: "General" },
  { id: "Button", icon: <Bookmark className="h-3.5 w-3.5" />,  label: "Button" },
];