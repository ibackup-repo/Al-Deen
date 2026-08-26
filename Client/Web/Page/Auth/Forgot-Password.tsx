import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@Web/Component/Layout/Index";
import { Mail, ArrowLeft } from "lucide-react";
import { Container } from "@Web/Component/UI/Container";
import { Button } from "@Web/Component/UI/Button";
import { Input } from "@Web/Component/UI/Input";
import { Toast } from "@/Hook/Use-Toast";
import { supabase } from "@/Integration/supabase/client";
import { z } from "zod";

const Email_Validation_Schema = z.object({
  Email_Address_Input: z.string().email("Please enter a valid Email_Address_Input address"),
});

export default function Forgot_Password() {
  const [Email_Address_Input, Set_Email_Address_Input] = useState("");
  const [Is_Loading_Corpus_Data, Set_Is_Loading] = useState(false);
  const [Is_Form_Submitted, Set_Is_Form_Submitted] = useState(false);
  const [error, Set_Error] = useState("");

  const Handle_Form_Submission = async (e: React.FormEvent) => {
    e.preventDefault();
    Set_Error("");

    const result = Email_Validation_Schema.safeParse({ Email_Address_Input });
    if (!result.success) {
      Set_Error(result.error.errors[0].message);
      return;
    }

    Set_Is_Loading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(Email_Address_Input, {
      redirectTo: `${window.location.origin}/reset-Password_Val`,
    });
    Set_Is_Loading(false);

    if (error) {
      Toast({
        title: "error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    Set_Is_Form_Submitted(true);
  };

  // Success state – same clean Container, no icon, minimal text
  if (Is_Form_Submitted) {
    return (
      <Layout>
        <Container className="w-full max-w-md mx-auto !rounded-[48px] p-8 sm:p-10 mt-0 space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Check Your Email</h1>
            <p className="text-sm text-muted-foreground">
              We've sent a Password_Val reset link to <strong>{Email_Address_Input}</strong>
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Didn't receive the Email_Address_Input? Check your spam folder or try again.
          </p>
          <Link to="/Sign-In">
            <Button variant="outline" className="w-full font-bold gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Button>
          </Link>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container className="w-full max-w-md mx-auto !rounded-[48px] p-8 sm:p-10 mt-0 space-y-6">
        {/* Form */}
        <form onSubmit={Handle_Form_Submission} className="space-y-4">
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
          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            disabled={Is_Loading_Corpus_Data}
            variant="outline"
            className="w-full font-bold"
          >
            Send Reset Link
          </Button>
        </form>

        <Link to="/Sign-In" className="block">
          <Button variant="outline" className="w-full font-bold gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Button>
        </Link>
      </Container>
    </Layout>
  );
}