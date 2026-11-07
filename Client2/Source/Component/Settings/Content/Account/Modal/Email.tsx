import { useState } from "react";
import { Mail } from "lucide-react";
import { supabase } from "@/Integration/supabase/client";
import { toast as Toast } from "sonner";
import { Button } from "@Web/Component/UI/Button";
import { Input } from "@Web/Component/UI/Input";
import {
  Dialog_Header,
  Dialog_Title,
  Dialog_Description,
} from "@Web/Component/UI/Dialog";

interface Email_Step_Properties {
  On_Complete: () => void;
}

export function Email_Step({ On_Complete }: Email_Step_Properties) {
  const [New_Email, Set_New_Email] = useState("");
  const [Confirm_Email, Set_Confirm_Email] = useState("");
  const [Is_Submitting, Set_Is_Submitting] = useState(false);

  const Handle_Update = async () => {
    if (!New_Email.includes("@")) {
      Toast.error("Please enter a valid Email_Address_Input address");
      return;
    }
    if (New_Email !== Confirm_Email) {
      Toast.error("Emails do not match");
      return;
    }

    Set_Is_Submitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ Email_Address_Input: New_Email });
      if (error) throw error;
      Toast.success("Confirmation Email_Address_Input sent — check your inbox");
      On_Complete();
    } catch (err: any) {
      Toast.error(err.message || "Something went wrong");
    } finally {
      Set_Is_Submitting(false);
    }
  };

  return (
    <>
      <Dialog_Header className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <Dialog_Title className="text-base">Set new Email_Address_Input</Dialog_Title>
        </div>
        <Dialog_Description className="text-xs">
          A confirmation link will be sent to your new Email_Address_Input.
        </Dialog_Description>
      </Dialog_Header>

      <div className="space-y-3">
        <Input
          type="Email_Address_Input"
          placeholder="New Email_Address_Input address"
          value={New_Email}
          On_Change={(e) => Set_New_Email(e.target.value)}
          className="bg-muted/30 border-2 border-black dark:border-white rounded-[40px]"
        />
        <Input
          type="Email_Address_Input"
          placeholder="Confirm new Email_Address_Input"
          value={Confirm_Email}
          On_Change={(e) => Set_Confirm_Email(e.target.value)}
          className="bg-muted/30 border-2 border-black dark:border-white rounded-[40px]"
        />
        <Button
          onClick={Handle_Update}
          disabled={Is_Submitting || !New_Email || !Confirm_Email}
          className="w-full"
        >
          {Is_Submitting ? "Updating…" : "Update Email"}
        </Button>
      </div>
    </>
  );
}