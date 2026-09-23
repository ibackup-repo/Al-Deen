import { useState } from "react";
import { Check, Search } from "lucide-react";
import { Input } from "@Web/Component/UI/Input";
import { Button } from "@Web/Component/UI/Button";
import { Container } from "@Web/Component/UI/Container";
import { Use_App } from "@Web/Context/App";
import { Use_Translation } from "@/Hook/Use-Translation";
import { Class_Names } from "@/Library/Utility";
import { Languages } from "../Constants";

interface Language_Section_Properties {
  onSelect: () => void;
}

export function Language_Section({ onSelect }: Language_Section_Properties) {
  const { t } = Use_Translation();
  const { Current_Language, Set_Current_Language } = Use_App();
  const [Search_Query, Set_Search_Query] = useState("");

  const Filtered_Lines = Languages.filter(l =>
    l.name.toLowerCase().includes(Search_Query.toLowerCase()) ||
    l.nativeName.toLowerCase().includes(Search_Query.toLowerCase())
  );

  const Handle_Select = (code: string) => {
    Set_Current_Language(code);
    onSelect();
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 Top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t.Settings.searchLanguages}
          value={Search_Query}
          On_Change={(e) => Set_Search_Query(e.target.value)}
          className="pl-10 bg-muted/30 border-2 border-black dark:border-white rounded-[40px] focus:border-primary transition-colors"
        />
      </div>

      {/* Language List */}
      <div className="space-y-2">
        {Filtered_Lines.map((Language) => {
          const Is_Selected = Current_Language === Language.code;
          return (
            <Container
              key={Language.code}
              className={Class_Names(
                "!p-0 overflow-hidden transition-all group",
                Is_Selected && "border-primary/50 bg-primary/5"
              )}
            >
              <Button
                onClick={() => Handle_Select(Language.code)}
                className="w-full flex items-center justify-between px-4 py-3 h-auto"
                variant="secondary"
                fullWidth
              >
                <div className="text-left">
                  <p className="font-medium text-sm text-foreground [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                    {Language.name}
                  </p>
                  <p className="text-xs text-muted-foreground [.high-contrast_&]:group-hover:text-white/70 [.high-contrast_&]:dark:group-hover:text-black/70">
                    {Language.nativeName}
                  </p>
                </div>
                {Is_Selected && (
                  <Check className="h-4 w-4 text-primary [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black" />
                )}
              </Button>
            </Container>
          );
        })}
      </div>
    </div>
  );
}