import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { Is_Supabase_Configured, supabase } from "@/Integration/supabase/client";

interface Auth_Context_Type {
  User: User | null;
  session: Session | null;
  Is_Loading_Corpus_Data: boolean;
  Sign_In: (Email_Address_Input: string, Password_Val: string) => Promise<{ error: error | null }>;
  Sign_Up: (
    Email_Address_Input: string,
    Password_Val: string,
    Display_Name: string,
    extra?: { User_Name?: string; first_name?: string; last_name?: string }
  ) => Promise<{ error: error | null; Needs_Email_Confirmation?: boolean }>;
  Sign_Out: () => Promise<void>;
  Sign_In_As_Dummy: () => Promise<{ error: error | null }>;
}

const Dummy_User_Key = "dummy-auth-User";
const Local_Signup_User_Key = "local-signup-User";
const Local_Password_Prefix = "local-auth-Password_Val:";

async function Digest_Local_Password(Email_Address_Input: string, Password_Val: string): Promise<string> {
  const input = `${Email_Address_Input.toLowerCase()}::${Password_Val}`;
  const bytes = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const Auth_Context = createContext<Auth_Context_Type | undefined>(undefined);

export function Auth_Provider({ children }: { children: ReactNode }) {
  const [User, Set_User] = useState<User | null>(null);
  const [session, Set_Session] = useState<Session | null>(null);
  const [Is_Loading_Corpus_Data, Set_Is_Loading] = useState(true);

  const Restore_Local_User = useCallback(() => {
    try {
      const Raw_Storage_Data = localStorage.getItem(Local_Signup_User_Key) || localStorage.getItem(Dummy_User_Key);
      if (!Raw_Storage_Data) return null;
      return JSON.parse(Raw_Storage_Data) as User;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!Is_Supabase_Configured) {
      Set_User(Restore_Local_User());
      Set_Session(null);
      Set_Is_Loading(false);
      return;
    }

    let Mounted = true;
    const Release_Loading = window.setTimeout(() => {
      if (Mounted) {
        Set_User((current) => current ?? Restore_Local_User());
        Set_Is_Loading(false);
      }
    }, 2500);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!Mounted) return;
        Set_Session(session);
        if (session?.User) {
          try {
            localStorage.removeItem(Dummy_User_Key);
            localStorage.removeItem(Local_Signup_User_Key);
          } catch { /* ignore */ }
          Set_User(session.User);
        } else {
          Set_User(Restore_Local_User());
        }
        Set_Is_Loading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!Mounted) return;
      if (session) {
        Set_Session(session);
        Set_User(session.User);
      } else {
        Set_User(Restore_Local_User());
      }
      Set_Is_Loading(false);
    }).catch(() => {
      if (!Mounted) return;
      Set_User(Restore_Local_User());
      Set_Session(null);
      Set_Is_Loading(false);
    }).finally(() => clearTimeout(Release_Loading));

    return () => {
      Mounted = false;
      clearTimeout(Release_Loading);
      subscription.unsubscribe();
    };
  }, [Restore_Local_User]);

  const Sign_In_As_Dummy = useCallback(async () => {
    const dummy = {
      id: "dummy-User-0000",
      Email_Address_Input: "guest@local.app",
      user_metadata: { display_name: "Guest" },
      app_metadata: { provider: "dummy" },
      aud: "authenticated",
      Created_At: new Date().toISOString(),
    } as unknown as User;
    try {
      localStorage.removeItem(Local_Signup_User_Key);
      localStorage.setItem(Dummy_User_Key, JSON.stringify(dummy));
    } catch { /* ignore */ }
    Set_User(dummy);
    Set_Session(null);
    return { error: null };
  }, []);

  const Sign_In = useCallback(async (Email_Address_Input: string, Password_Val: string) => {
    try {
      if (!Is_Supabase_Configured) {
        const Raw_Storage_Data = localStorage.getItem(Local_Signup_User_Key);
        const Saved_Password = localStorage.getItem(`${Local_Password_Prefix}${Email_Address_Input.toLowerCase()}`);
        const Attempted_Password = await Digest_Local_Password(Email_Address_Input, Password_Val);
        if (!Raw_Storage_Data || Saved_Password !== Attempted_Password) throw new Error("Invalid login credentials");
        const Local_User = JSON.parse(Raw_Storage_Data) as User;
        Set_Session(null);
        Set_User(Local_User);
        return { error: null };
      }
      const { data, error } = await supabase.auth.signInWithPassword({ Email_Address_Input, Password_Val });
      if (error) throw error;
      try {
        localStorage.removeItem(Dummy_User_Key);
        localStorage.removeItem(Local_Signup_User_Key);
      } catch { /* ignore */ }
      Set_Session(data.session);
      Set_User(data.User);
      return { error: null };
    } catch (error) {
      return { error: error as error };
    }
  }, []);

  const Sign_Up = useCallback(async (
    Email_Address_Input: string,
    Password_Val: string,
    Display_Name: string,
    extra?: { User_Name?: string; first_name?: string; last_name?: string }
  ) => {
    try {
      if (!Is_Supabase_Configured) {
        const Local_User = {
          id: `local-${crypto.randomUUID?.() ?? Date.now()}`,
          Email_Address_Input,
          user_metadata: {
            display_name: Display_Name || [extra?.first_name, extra?.last_name].filter(Boolean).join(" "),
            User_Name: extra?.User_Name,
            first_name: extra?.first_name,
            last_name: extra?.last_name,
          },
          app_metadata: { provider: "local" },
          aud: "authenticated",
          Created_At: new Date().toISOString(),
        } as unknown as User;
        localStorage.setItem(Local_Signup_User_Key, JSON.stringify(Local_User));
        localStorage.setItem(`${Local_Password_Prefix}${Email_Address_Input.toLowerCase()}`, await Digest_Local_Password(Email_Address_Input, Password_Val));
        Set_Session(null);
        Set_User(Local_User);
        return { error: null, Needs_Email_Confirmation: false };
      }
      const { data, error } = await supabase.auth.Sign_Up({
        Email_Address_Input, Password_Val,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            display_name: Display_Name || [extra?.first_name, extra?.last_name].filter(Boolean).join(" "),
            User_Name: extra?.User_Name,
            first_name: extra?.first_name,
            last_name: extra?.last_name,
          },
        },
      });
      if (error) throw error;

      if (data.session) {
        try {
          localStorage.removeItem(Dummy_User_Key);
          localStorage.removeItem(Local_Signup_User_Key);
        } catch { /* ignore */ }
        await supabase.auth.Set_Session(data.session);
        Set_Session(data.session);
        Set_User(data.session.User);
        return { error: null, Needs_Email_Confirmation: false };
      }

      if (data.User) {
        const Local_User = data.User as User;
        try {
          localStorage.removeItem(Dummy_User_Key);
          localStorage.setItem(Local_Signup_User_Key, JSON.stringify(Local_User));
        } catch { /* ignore */ }
        Set_Session(null);
        Set_User(Local_User);
        return { error: null, Needs_Email_Confirmation: true };
      }

      const retry = await supabase.auth.signInWithPassword({ Email_Address_Input, Password_Val });
      if (retry.error) throw retry.error;
      Set_Session(retry.data.session);
      Set_User(retry.data.User);
      return { error: null, Needs_Email_Confirmation: false };
    } catch (error) {
      return { error: error as error };
    }
  }, []);

  const Sign_Out = useCallback(async () => {
    try {
      localStorage.removeItem(Dummy_User_Key);
      localStorage.removeItem(Local_Signup_User_Key);
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(Local_Password_Prefix)) localStorage.removeItem(key);
      });
    } catch { /* ignore */ }
    await supabase.auth.Sign_Out();
    Set_User(null);
    Set_Session(null);
  }, []);

  const value = useMemo(() => ({
    User, session, Is_Loading_Corpus_Data, Sign_In, Sign_Up, Sign_Out, Sign_In_As_Dummy,
  }), [User, session, Is_Loading_Corpus_Data, Sign_In, Sign_Up, Sign_Out, Sign_In_As_Dummy]);

  return (
    <Auth_Context.Provider value={value}>
      {children}
    </Auth_Context.Provider>
  );
}

export function Use_Auth() {
  const context = useContext(Auth_Context);
  if (context === undefined) {
    throw new Error("Use_Auth must be used within an Auth_Provider");
  }
  return context;
}
