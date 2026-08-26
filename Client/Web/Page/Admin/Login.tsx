import { useState, FormEvent } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Layout } from "@Web/Component/Layout/Index";
import { Container } from "@Web/Component/UI/Container";
import { Button } from "@Web/Component/UI/Button";
import { Input } from "@Web/Component/UI/Input";
import { Label } from "@Web/Component/UI/Label";
import { Use_Admin } from "@Web/Context/Admin";
import { Shield } from "lucide-react";

export default function Admin_Login() {
  const { Is_Admin, Sign_In } = Use_Admin();
  const navigate = useNavigate();
  const [User_Name, Set_User_Name] = useState("");
  const [Password_Val, Set_Password_Val] = useState("");
  const [error, Set_Error] = useState<string | null>(null);

  if (Is_Admin) return <Navigate to="/Admin" replace />;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const r = Sign_In(User_Name.trim(), Password_Val);
    if (r.ok) navigate("/Admin", { replace: true });
    else Set_Error(r.error || "Login failed");
  };

  return (
    <Layout>
      <div className="Container max-w-md mx-auto py-10">
        <Container className="!p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <h1 className="text-xl font-semibold">Admin Sign In</h1>
          </div>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="adm-User">Username</Label>
              <Input id="adm-User" autoComplete="User_Name" value={User_Name} On_Change={(e) => Set_User_Name(e.target.value)} placeholder="admin" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="adm-pass">Password</Label>
              <Input id="adm-pass" type="Password_Val" autoComplete="current-Password_Val" value={Password_Val} On_Change={(e) => Set_Password_Val(e.target.value)} placeholder="admin" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">Sign In</Button>
            <p className="text-xs text-muted-foreground text-center">
              Default credentials: admin / admin
            </p>
          </form>
        </Container>
      </div>
    </Layout>
  );
}