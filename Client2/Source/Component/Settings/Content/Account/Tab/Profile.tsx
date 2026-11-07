import { Separator } from "@Web/Component/UI/Separator";
import { Button } from "@Web/Component/UI/Button";
import { Container } from "@Web/Component/UI/Container";
import { Target, ChevronRight, KeyRound, Mail, RotateCcw, LogOut, Trash2 } from "lucide-react";
import {
  Alert_Dialog, Alert_Dialog_Action, Alert_Dialog_Cancel, Alert_Dialog_Content,
  Alert_Dialog_Description, Alert_Dialog_Footer, Alert_Dialog_Header,
  Alert_Dialog_Title, Alert_Dialog_Trigger,
} from "@Web/Component/UI/Alert-Dialog";
import type { Credential_Modal_Type } from "../Types";

interface Profile_Tab_Properties {
  navigate: (path: string) => void;
  Set_Settings_Sidebar_Open: (Open: boolean) => void;
  On_Open_Modal: (type: Credential_Modal_Type) => void;
  On_Reset_Settings: () => void;
  On_Sign_Out: () => void;
  On_Delete_Account: () => void;
  Is_Deleting_Account: boolean;
}

export function Profile_Tab({
  navigate,
  Set_Settings_Sidebar_Open,
  On_Open_Modal,
  On_Reset_Settings,
  On_Sign_Out,
  On_Delete_Account,
  Is_Deleting_Account,
}: Profile_Tab_Properties) {
  return (
    <div className="space-y-3">
      {/* Learning Plans */}
      <Container className="!p-0 overflow-hidden group">
        <Button
          onClick={() => { navigate("/Quran/Goal"); Set_Settings_Sidebar_Open(false); }}
          className="w-full flex items-center justify-between gap-3 h-auto py-3 px-4"
          variant="secondary"
          fullWidth
        >
          <div className="flex items-center gap-3">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">My Learning Plans</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Button>
      </Container>

      <Separator />

      {/* Credentials group */}
      <div className="space-y-2">
        <div className="relative rounded-[40px] bg-white dark:bg-black border-2 border-black dark:border-white transition-all Duration-200 py-1 px-3 inline-flex">
          <p className="text-xs font-medium text-foreground">Account credentials</p>
        </div>

        <Container className="!p-0 overflow-hidden group">
          <Button
            onClick={() => On_Open_Modal("Password_Val")}
            className="w-full flex items-center justify-between gap-3 h-auto py-3 px-4"
            variant="secondary"
            fullWidth
          >
            <div className="flex items-center gap-3">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Update Password</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
        </Container>

        <Container className="!p-0 overflow-hidden group">
          <Button
            onClick={() => On_Open_Modal("Email_Address_Input")}
            className="w-full flex items-center justify-between gap-3 h-auto py-3 px-4"
            variant="secondary"
            fullWidth
          >
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Update Email</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
        </Container>
      </div>

      <Separator />

      {/* General */}
      <Container className="!p-0 overflow-hidden group">
        <Button
          onClick={On_Reset_Settings}
          className="w-full flex items-center justify-between gap-3 h-auto py-3 px-4"
          variant="secondary"
          fullWidth
        >
          <div className="flex items-center gap-3">
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Reset Settings</span>
          </div>
        </Button>
      </Container>

      <Separator />

      {/* Danger zone */}
      <div className="space-y-2">
        <div className="relative rounded-[40px] bg-white dark:bg-black border-2 border-black dark:border-white transition-all Duration-200 py-1 px-3 inline-flex">
          <p className="text-xs font-medium text-foreground">Danger zone</p>
        </div>

        <Container className="!p-0 overflow-hidden group">
          <Button
            onClick={On_Sign_Out}
            className="w-full flex items-center justify-between gap-3 h-auto py-3 px-4 text-destructive hover:text-destructive"
            variant="secondary"
            fullWidth
          >
            <div className="flex items-center gap-3">
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Sign Out</span>
            </div>
          </Button>
        </Container>

        <Alert_Dialog>
          <Alert_Dialog_Trigger asChild>
            <Container className="!p-0 overflow-hidden group cursor-pointer">
              <Button
                className="w-full flex items-center justify-between gap-3 h-auto py-3 px-4 text-destructive/70 hover:text-destructive"
                variant="secondary"
                fullWidth
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="h-4 w-4" />
                  <span className="text-sm">Delete Account</span>
                </div>
              </Button>
            </Container>
          </Alert_Dialog_Trigger>
          <Alert_Dialog_Content className="bg-white dark:bg-black border-2 border-black dark:border-white rounded-[40px]">
            <Alert_Dialog_Header>
              <Alert_Dialog_Title>Are you absolutely sure?</Alert_Dialog_Title>
              <Alert_Dialog_Description>
                This action cannot be undone. This will permanently delete your account and
                remove all your data including Bookmarks, Notes, and reading Render_Progress.
              </Alert_Dialog_Description>
            </Alert_Dialog_Header>
            <Alert_Dialog_Footer>
              <Alert_Dialog_Cancel className="rounded-[40px]">Cancel</Alert_Dialog_Cancel>
              <Alert_Dialog_Action
                onClick={On_Delete_Account}
                disabled={Is_Deleting_Account}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-[40px]"
              >
                {Is_Deleting_Account ? "Deleting…" : "Delete Account"}
              </Alert_Dialog_Action>
            </Alert_Dialog_Footer>
          </Alert_Dialog_Content>
        </Alert_Dialog>
      </div>
    </div>
  );
}