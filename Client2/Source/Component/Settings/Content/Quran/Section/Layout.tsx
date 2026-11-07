// Component/Settings/Content/Quran/Section/Layout.tsx
import { AlignJustify, BookOpen } from "lucide-react";
import { Button } from "@Web/Component/UI/Button";
import { Container } from "@Web/Component/UI/Container";
import { Switch } from "@Web/Component/UI/Switch";
import { Card } from "@Web/Component/UI/Card";
import { Class_Names } from "@/Library/Utility";
import { Use_App } from "@Web/Context/App";

export function Layout() {
  const { 
    layout, 
    Set_Layout,
    Hide_Ayaat,           // add to Use_App
    Set_Hide_Ayaat,        // add to Use_App
    Hide_Verse_Markers,     // add to Use_App
    Set_Hide_Ayah_Markers,  // add to Use_App
  } = Use_App();

  const options = [
    { id: "Ayah" as const, label: "Ayah", icon: <AlignJustify className="h-3.5 w-3.5" /> },
    { id: "page" as const, label: "Page", icon: <BookOpen className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-3">
      {/* Layout Selection */}
      <Container className="!py-2.5 !px-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlignJustify className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm text-foreground [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">Layout</h3>
        </div>
        <div className="flex items-center gap-1">
          {options.map((opt) => (
            <Button
              key={opt.id}
              onClick={() => Set_Layout(opt.id)}
              className={Class_Names(
                "flex items-center gap-1.5 px-3 py-1.5 h-auto text-xs font-medium",
                layout === opt.id
                  ? "bg-primary text-primary-foreground"
                  : ""
              )}
            >
              {opt.icon}
              {opt.label}
            </Button>
          ))}
        </div>
      </Container>

      {/* Hide Verses toggle */}
      <div className="cursor-pointer">
        <Card 
          onClick={() => Set_Hide_Ayaat(!Hide_Ayaat)}
          className="py-2.5 px-4 flex items-center justify-between transition-all group"
        >
          <span className="font-semibold text-sm [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
            Hide Verses
          </span>
          <Switch 
            id="hide-Ayaat" 
            checked={Hide_Ayaat} 
            onCheckedChange={Set_Hide_Ayaat} 
            size="md"
          />
        </Card>
      </div>

      {/* Hide Ayah Markers toggle */}
      <div className="cursor-pointer">
        <Card 
          onClick={() => Set_Hide_Ayah_Markers(!Hide_Verse_Markers)}
          className="py-2.5 px-4 flex items-center justify-between transition-all group"
        >
          <span className="font-semibold text-sm [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
            Hide Ayah Markers
          </span>
          <Switch 
            id="hide-Ayah-markers" 
            checked={Hide_Verse_Markers} 
            onCheckedChange={Set_Hide_Ayah_Markers} 
            size="md"
          />
        </Card>
      </div>
    </div>
  );
}