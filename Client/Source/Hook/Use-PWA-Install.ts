import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function Use_PWA_Install() {
  const [Deferred_Prompt, Set_Deferred_Prompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [Is_Installable, Set_Is_Installable] = useState(false);
  const [Is_Installed, Set_Is_Installed] = useState(false);
  const [Is_IOS, Set_Is_IOS] = useState(false);
  const [Is_Android, Set_Is_Android] = useState(false);

  useEffect(() => {
    // Check if already installed
    const Is_Standalone = window.matchMedia("(display-Mode: standalone)").matches;
    const Is_In_Web_App_IOS = (window.navigator as any).standalone === true;
    Set_Is_Installed(Is_Standalone || Is_In_Web_App_IOS);

    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const Is_IOS_Device = /iphone|ipad|ipod/.test(userAgent);
    const Is_Android_Device = /android/.test(userAgent);
    Set_Is_IOS(Is_IOS_Device);
    Set_Is_Android(Is_Android_Device);

    // Listen for beforeinstallprompt event (Android/Desktop)
    const Handle_Before_Install_Prompt = (e: Event) => {
      e.preventDefault();
      Set_Deferred_Prompt(e as BeforeInstallPromptEvent);
      Set_Is_Installable(true);
    };

    // Listen for app installed event
    const Handle_App_Installed = () => {
      Set_Is_Installed(true);
      Set_Is_Installable(false);
      Set_Deferred_Prompt(null);
    };

    window.addEventListener("beforeinstallprompt", Handle_Before_Install_Prompt);
    window.addEventListener("appinstalled", Handle_App_Installed);

    return () => {
      window.removeEventListener("beforeinstallprompt", Handle_Before_Install_Prompt);
      window.removeEventListener("appinstalled", Handle_App_Installed);
    };
  }, []);

  const Prompt_Install = useCallback(async () => {
    if (!Deferred_Prompt) {
      return false;
    }

    await Deferred_Prompt.prompt();
    const { outcome } = await Deferred_Prompt.userChoice;

    if (outcome === "accepted") {
      Set_Deferred_Prompt(null);
      Set_Is_Installable(false);
      return true;
    }

    return false;
  }, [Deferred_Prompt]);

  return {
    Is_Installable,
    Is_Installed,
    Is_IOS,
    Is_Android,
    Prompt_Install,
  };
}
