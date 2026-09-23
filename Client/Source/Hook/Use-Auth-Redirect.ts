import { Use_Auth } from "@Web/Context/Auth";
import { Toast } from "@/Hook/Use-Toast";

function notifySignIn(action?: string) {
  Toast({
    title: "Sign in required",
    description: action
      ? `Please sign in to ${action}`
      : "Please sign in to use this feature",
    variant: "destructive",
  });
}

export function useAuthRedirect() {
  const { User } = Use_Auth();

  const requireAuth = (action?: string) => {
    if (!User) {
      notifySignIn(action);
      return false;
    }
    return true;
  };

  return { User, requireAuth, checkAuthWithToast: requireAuth };
}

