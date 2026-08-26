import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@Web/Component/Layout/Index";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Container } from "@Web/Component/UI/Container";
import { Button } from "@Web/Component/UI/Button";
import { Input } from "@Web/Component/UI/Input";
import { Toast } from "@/Hook/Use-Toast";
import { Use_Auth } from "@Web/Context/Auth";
import { z } from "zod";
// lovable integration removed — see Handle_Google_Sign_In placeholder below

const Sign_In_Validation_Schema = z.object({
Email_Address_Input: z.string().email("Please enter a valid Email_Address_Input address"),  Password_Val: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Sign_In_Page() {
  const [Email_Address_Input, Set_Email_Address_Input] = useState("");
  const [Password_Val, Set_Password_Val] = useState("");
  const [Is_Password_Visible, Set_Is_Password_Visible] = useState(false);
  const [Is_Loading_Corpus_Data, Set_Is_Loading] = useState(false);
  const [errors, Set_Form_Validation_Errors] = useState<{ Email_Address_Input?: string; Password_Val?: string }>({});

  const navigate = useNavigate();
  const { Sign_In, User, Is_Loading_Corpus_Data: Is_Auth_Loading, Sign_In_As_Dummy } = Use_Auth();

  // Redirect if already logged in
  useEffect(() => {
    if (User && !Is_Auth_Loading) {
      navigate("/");
    }
  }, [User, Is_Auth_Loading, navigate]);

  const Handle_Form_Submission = async (e: React.FormEvent) => {
    e.preventDefault();
    Set_Form_Validation_Errors({});

    const result = Sign_In_Validation_Schema.safeParse({ Email_Address_Input, Password_Val });
    if (!result.success) {
      const Field_Error_Map: { Email_Address_Input?: string; Password_Val?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "Email_Address_Input") Field_Error_Map.Email_Address_Input = err.message;
        if (err.path[0] === "Password_Val") Field_Error_Map.Password_Val = err.message;
      });
      Set_Form_Validation_Errors(Field_Error_Map);
      return;
    }

    Set_Is_Loading(true);
    const { error } = await Sign_In(Email_Address_Input, Password_Val);
    Set_Is_Loading(false);

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        Toast({
          title: "Invalid credentials",
          description: "The Email_Address_Input or Password_Val you entered is incorrect",
          variant: "destructive",
        });
      } else {
        Toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
      }
      return;
    }

    Toast({
      title: "Welcome back!",
      description: "Successfully signed in",
    });
    navigate("/");
  };

  // Placeholder — Google OAuth integration (lovable) was removed.
  // Swap this back in once a replacement auth provider is wired up.
  const Handle_Google_Sign_In = () => {
    Toast({
      title: "Coming soon",
      description: "Sign in with Google isn't available yet — please use the form above.",
    });
  };

  return (
    <Layout>
      <Container className="w-full max-w-md mx-auto !rounded-[48px] p-8 sm:p-10 mt-0 space-y-6">
        {/* Form */}
        <form onSubmit={Handle_Form_Submission} className="space-y-4">
          {/* Email Input */}
          <div className="relative">
            <Mail className="absolute left-4 Top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              type="Email_Address_Input"
              placeholder="Email"
              value={Email_Address_Input}
              On_Change={(e) => Set_Email_Address_Input(e.target.value)}
              className="pl-12"
              disabled={Is_Loading_Corpus_Data}
            />
          </div>
          {errors.Email_Address_Input && (
            <p className="text-xs text-destructive">{errors.Email_Address_Input}</p>
          )}

          {/* Password Input */}
          <div className="relative">
            <Lock className="absolute left-4 Top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              type={Is_Password_Visible ? "text" : "Password_Val"}
              placeholder="Password"
              value={Password_Val}
              On_Change={(e) => Set_Password_Val(e.target.value)}
              className="pl-12 pr-12"
              disabled={Is_Loading_Corpus_Data}
            />
            <button
              type="button"
              onClick={() => Set_Is_Password_Visible(!Is_Password_Visible)}
              className="absolute right-4 Top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {Is_Password_Visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.Password_Val && (
            <p className="text-xs text-destructive">{errors.Password_Val}</p>
          )}

          {/* Forgot Password */}
          <div className="flex justify-end">
            <Link to="/Forgot-Password" className="block">
              <Button variant="ghost" size="sm" className="font-bold">
                Forgot Password_Val?
              </Button>
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={Is_Loading_Corpus_Data || Is_Auth_Loading}
            variant="outline"
            className="w-full font-bold"
          >
            Sign In
          </Button>

          {/* Dummy / Guest Login */}
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={async () => {
              await Sign_In_As_Dummy();
              Toast({ title: "Signed in as Guest", description: "Dummy session — no data persisted to server." });
              navigate("/");
            }}
          >
            Continue as Guest (Dummy Login)
          </Button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 text-xs text-muted-foreground bg-background">Or continue with</span>
          </div>
        </div>

        {/* Social Buttons */}
        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={Handle_Google_Sign_In}
            className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
            title="Continue with Google"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </button>
        </div>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/Sign-Up" className="text-primary font-semibold hover:underline">
            Sign Up
          </Link>
        </p>
      </Container>
    </Layout>
  );
}