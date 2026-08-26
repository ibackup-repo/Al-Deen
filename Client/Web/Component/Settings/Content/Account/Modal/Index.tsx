import { useState } from "react";
import {
  Dialog,
  Dialog_Content,
} from "@Web/Component/UI/Dialog";
import { Verify_Step } from "./Verify";
import { Password_Step } from "./Password";
import { Email_Step } from "./Email";
import type { Credential_Modal_Properties, Modal_Step } from "../Types";

export function Credential_Modal({ Open, On_Close, type, User_Email }: Credential_Modal_Properties) {
  const [Step, Set_Step] = useState<Modal_Step>("verify");

  const Is_Password = type === "Password_Val";

  const Reset_State = () => {
    Set_Step("verify");
  };

  const Handle_Close = () => {
    Reset_State();
    On_Close();
  };

  const Handle_Verified = () => {
    Set_Step("Update");
  };

  const Handle_Complete = () => {
    Handle_Close();
  };

  if (!Open) return null;

  return (
    <Dialog Open={Open} On_Open_Change={(v) => !v && Handle_Close()}>
      <Dialog_Content className="bg-white dark:bg-black border-2 border-black dark:border-white rounded-[40px] max-w-sm gap-0 p-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-5">
          <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold border-2 ${
            Step === "verify"
              ? "bg-foreground text-background border-foreground"
              : "bg-primary text-primary-foreground border-primary"
          }`}>
            {Step === "Update" ? "✓" : "1"}
          </div>
          <div className={`h-0.5 flex-1 ${Step === "Update" ? "bg-primary" : "bg-muted"}`} />
          <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold border-2 ${
            Step === "Update"
              ? "bg-foreground text-background border-foreground"
              : "bg-muted text-muted-foreground border-muted"
          }`}>
            2
          </div>
        </div>

        {Step === "verify" && (
          <Verify_Step User_Email={User_Email} On_Verified={Handle_Verified} />
        )}

        {Step === "Update" && Is_Password && (
          <Password_Step On_Complete={Handle_Complete} />
        )}

        {Step === "Update" && !Is_Password && (
          <Email_Step On_Complete={Handle_Complete} />
        )}
      </Dialog_Content>
    </Dialog>
  );
}