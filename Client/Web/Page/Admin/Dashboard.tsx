import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Layout } from "@Web/Component/Layout/Index";
import { Container } from "@Web/Component/UI/Container";
import { Button } from "@Web/Component/UI/Button";
import { Use_Admin } from "@Web/Context/Admin";
import { supabase } from "@/Integration/supabase/client";
import { Users, Activity, LogOut, Shield, Eye, MousePointerClick, Clock } from "lucide-react";

interface Visitor_Stats {
  Total_Visits: number;
  Unique_Days: number;
  Last_Visit: string | null;
  Recent_Routes: { route: string; Count: number }[];
}

function Read_Visitor_Stats(): Visitor_Stats {
  try {
    const Raw_Storage_Data = localStorage.getItem("lovable-visit-Visit_Log_Entries");
    const Visit_Log_Entries: { route: string; ts: number }[] = Raw_Storage_Data ? JSON.parse(Raw_Storage_Data) : [];
    const days = new Set(Visit_Log_Entries.map((e) => new Date(e.ts).toDateString()));
    const Route_Counts: Record<string, number> = {};
    for (const e of Visit_Log_Entries) Route_Counts[e.route] = (Route_Counts[e.route] || 0) + 1;
    const Recent_Routes = Object.entries(Route_Counts)
      .map(([route, Count]) => ({ route, Count }))
      .sort((a, b) => b.Count - a.Count)
      .slice(0, 8);
    return {
      Total_Visits: Visit_Log_Entries.length,
      Unique_Days: days.size,
      Last_Visit: Visit_Log_Entries.length ? new Date(Visit_Log_Entries[Visit_Log_Entries.length - 1].ts).toLocaleString() : null,
      Recent_Routes,
    };
  } catch {
    return { Total_Visits: 0, Unique_Days: 0, Last_Visit: null, Recent_Routes: [] };
  }
}

export default function AdminDashboard() {
  const { Is_Admin, Sign_Out } = Use_Admin();
  const navigate = useNavigate();
  const [User_List, Set_User_List] = useState<{ id: string; Email_Address_Input?: string; Created_At?: string }[]>([]);
  const [User_List_Error, Set_User_List_Error] = useState<string | null>(null);
  const [Dashboard_Stats, Set_Dashboard_Stats] = useState<Visitor_Stats>(() => Read_Visitor_Stats());

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles" as any)
          .select("id,Email_Address_Input,Created_At")
          .limit(100);
        if (!alive) return;
        if (error) Set_User_List_Error("User listing requires a backend admin endpoint.");
        else if (data) Set_User_List(data as any);
      } catch {
        if (alive) Set_User_List_Error("User listing unavailable.");
      }
    })();
    return () => { alive = false; };
  }, []);

  if (!Is_Admin) return <Navigate to="/Admin/Login" replace />;

  const Handle_Sign_Out = () => {
    Sign_Out();
    navigate("/Admin/Login", { replace: true });
  };

  return (
    <Layout>
      <div className="Container max-w-4xl mx-auto py-6 space-y-4">
        <Container className="!py-3 !px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Admin Dashboard</h1>
          </div>
          <Button size="sm" variant="outline" onClick={Handle_Sign_Out} className="rounded-full">
            <LogOut className="h-4 w-4 mr-1" /> Sign Out
          </Button>
        </Container>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Container className="!p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Eye className="h-3.5 w-3.5" /> Total page views</div>
            <p className="text-2xl font-semibold mt-1 tabular-nums">{Dashboard_Stats.Total_Visits}</p>
          </Container>
          <Container className="!p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Activity className="h-3.5 w-3.5" /> Active days</div>
            <p className="text-2xl font-semibold mt-1 tabular-nums">{Dashboard_Stats.Unique_Days}</p>
          </Container>
          <Container className="!p-4 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Last visit</div>
            <p className="text-sm mt-1 truncate">{Dashboard_Stats.Last_Visit || "—"}</p>
          </Container>
        </div>

        <Container className="!p-4">
          <div className="flex items-center gap-2 mb-3">
            <MousePointerClick className="h-4 w-4" />
            <h2 className="font-semibold">Top routes</h2>
            <Button size="sm" variant="ghost" className="ml-auto" onClick={() => Set_Dashboard_Stats(Read_Visitor_Stats())}>Refresh</Button>
          </div>
          {Dashboard_Stats.Recent_Routes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No visit data yet.</p>
          ) : (
            <ul className="divide-y divide-border/40">
              {Dashboard_Stats.Recent_Routes.map((r) => (
                <li key={r.route} className="flex items-center justify-between py-2 text-sm">
                  <code className="truncate">{r.route}</code>
                  <span className="tabular-nums text-muted-foreground">{r.Count}</span>
                </li>
              ))}
            </ul>
          )}
        </Container>

        <Container className="!p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4" />
            <h2 className="font-semibold">User accounts</h2>
            <span className="ml-auto text-xs text-muted-foreground">{User_List.length} shown</span>
          </div>
          {User_List_Error ? (
            <p className="text-sm text-muted-foreground">{User_List_Error}</p>
          ) : User_List.length === 0 ? (
            <p className="text-sm text-muted-foreground">No User_List found.</p>
          ) : (
            <ul className="divide-y divide-border/40">
              {User_List.map((u) => (
                <li key={u.id} className="flex items-center justify-between py-2 text-sm gap-3">
                  <div className="min-w-0">
                    <p className="truncate">{u.Email_Address_Input || u.id}</p>
                    {u.Created_At && (
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(u.Created_At).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted">User</span>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </div>
    </Layout>
  );
}