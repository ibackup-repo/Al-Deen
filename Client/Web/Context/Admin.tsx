import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from "react";

const Storage_Key = "lovable-admin-session";

interface Admin_Context_Type {
  Is_Admin: boolean;
  Sign_In: (User_Name: string, Password_Val: string) => { ok: boolean; error?: string };
  Sign_Out: () => void;
}

const Admin_Context = createContext<Admin_Context_Type | undefined>(undefined);

export function Admin_Provider({ children }: { children: ReactNode }) {
  const [Is_Admin, Set_Is_Admin] = useState(false);

  useEffect(() => {
    try {
      Set_Is_Admin(localStorage.getItem(Storage_Key) === "1");
    } catch { /* ignore */ }
  }, []);

  const Sign_In = useCallback((User_Name: string, Password_Val: string) => {
    if (User_Name === "admin" && Password_Val === "admin") {
      try { localStorage.setItem(Storage_Key, "1"); } catch { /* ignore */ }
      Set_Is_Admin(true);
      return { ok: true };
    }
    return { ok: false, error: "Invalid credentials" };
  }, []);

  const Sign_Out = useCallback(() => {
    try { localStorage.removeItem(Storage_Key); } catch { /* ignore */ }
    Set_Is_Admin(false);
  }, []);

  const value = useMemo(() => ({ Is_Admin, Sign_In, Sign_Out }), [Is_Admin, Sign_In, Sign_Out]);
  return <Admin_Context.Provider value={value}>{children}</Admin_Context.Provider>;
}

export function Use_Admin() {
  const Context_Value = useContext(Admin_Context);
  if (!Context_Value) throw new Error("Use_Admin must be used within Admin_Provider");
  return Context_Value;
}