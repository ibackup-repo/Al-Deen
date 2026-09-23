import { Sun, Moon, Monitor, Check } from "lucide-react";
import { Button } from "@Web/Component/UI/Button";
import { Container } from "@Web/Component/UI/Container";
import { Use_App } from "@Web/Context/App";
import { Class_Names } from "@/Library/Utility";

const Themes = [
  { id: "light", label: "Light", description: "Bright, clean interface", icon: Sun },
  { id: "dark",  label: "Dark",  description: "Easier on the eyes at night", icon: Moon },
  { id: "auto",  label: "System", description: "Match your device setting", icon: Monitor },
] as const;

export function Theme_Section() {
  const { theme, Set_Theme } = Use_App();

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-foreground">theme</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Choose how the app looks. System follows your device preference.
        </p>
      </div>

      <div className="space-y-2">
        {Themes.map((t) => {
          const Icon = t.icon;
          const Is_Selected = theme === t.id;
          return (
            <Container
              key={t.id}
              className={Class_Names(
                "!p-0 overflow-hidden",
                Is_Selected && "border-primary/60"
              )}
            >
              <Button
                onClick={() => Set_Theme(t.id as "light" | "dark" | "auto")}
                className="w-full flex items-center justify-between gap-3 h-auto py-3 px-4"
                variant="secondary"
                fullWidth
                aria-pressed={Is_Selected}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{t.label}</p>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </div>
                </div>
                {Is_Selected && <Check className="h-4 w-4 text-primary" />}
              </Button>
            </Container>
          );
        })}
      </div>
    </div>
  );
}
