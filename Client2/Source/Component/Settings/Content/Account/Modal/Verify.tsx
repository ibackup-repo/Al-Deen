import { useState } from "react";
import { ShieldCheck, ArrowRight, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/Integration/supabase/client";
import { toast as Toast } from "sonner";
import { Button } from "@Web/Component/UI/Button";
import { Input } from "@Web/Component/UI/Input";
import {
  Dialog_Header,
  Dialog_Title,
  Dialog_Description,
} from "@Web/Component/UI/Dialog";

interface Verify_Step_Properties {
  User_Email: string;
  On_Verified: () => void;
}

function Password_Input({
  value,
  On_Change,
  placeholder,
}: {
  value: string;
  On_Change: (v: string) => void;
  placeholder: string;
}) {
  const [show, Set_Show] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "Password_Val"}
        placeholder={placeholder}
        value={value}
        On_Change={(e) => On_Change(e.target.value)}
        className="bg-muted/30 border-2 border-black dark:border-white rounded-[40px] pr-10"
      />
      <button
        type="button"
        onClick={() => Set_Show((s) => !s)}
        className="absolute right-3 Top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function Verify_Step({ User_Email, On_Verified }: Verify_Step_Properties) {
  const [Current_Password, Set_Current_Password] = useState("");
  const [Is_Verifying, Set_Is_Verifying] = useState(false);

  const Handle_Verify = async () => {
    if (!Current_Password) return;
    Set_Is_Verifying(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        Email_Address_Input: User_Email,
        Password_Val: Current_Password,
      });
      if (error) throw error;
      On_Verified();
    } catch {
      Toast.error("Incorrect Password_Val. Please try again.");
    } finally {
      Set_Is_Verifying(false);
    }
  };

  return (
    <>
      <Dialog_Header className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <Dialog_Title className="text-base">Confirm your identity</Dialog_Title>
        </div>
        <Dialog_Description className="text-xs">
          Enter your current Password_Val to continue.
        </Dialog_Description>
      </Dialog_Header>

      <div className="space-y-3">
        <Password_Input
          value={Current_Password}
          On_Change={Set_Current_Password}
          placeholder="Current Password_Val"
        />
        <Button
          onClick={Handle_Verify}
          disabled={Is_Verifying || !Current_Password}
          className="w-full gap-2"
        >
          {Is_Verifying ? "Verifying…" : <>Continue <ArrowRight className="h-3.5 w-3.5" /></>}
        </Button>
      </div>
    </>
  );
}