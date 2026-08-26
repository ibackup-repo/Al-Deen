// Component/Settings/Content/Quran/Section/Audio.tsx
import { useState } from "react";
import { Headphones, Check, Search } from "lucide-react";
import { Switch } from "@Web/Component/UI/Switch";
import { Card } from "@Web/Component/UI/Card";
import { Button } from "@Web/Component/UI/Button";
import { Input } from "@Web/Component/UI/Input";
import { Use_Is_Mobile } from "@/Hook/Use-Mobile";
import { Mobile_Navigator } from "../Utility";
import { Reciters } from "../Constant";
import { Use_App } from "@Web/Context/App";

export function Audio() {
  const Is_Mobile = Use_Is_Mobile();
  const [Show_Reciter_List, Set_Show_Reciter_List] = useState(false);
  const [Search_Query, Set_Search_Query] = useState("");
  
  const {
    Selected_Reciter,
    Set_Selected_Reciter,
    Auto_Scroll_During_Playback,
    Set_Auto_Scroll_During_Playback,
    Hover_Recitation,
    Set_Hover_Recitation,
    // Add these two Lines_Data
    Record_Audio_Enabled,
    Set_Record_Audio_Enabled,
  } = Use_App();

  const Filtered_Reciters = Reciters.filter(Reciter =>
    Reciter.label.toLowerCase().includes(Search_Query.toLowerCase())
  );

  if (Is_Mobile && Show_Reciter_List) {
    return (
      <Mobile_Navigator
        Is_Open={Show_Reciter_List}
        On_Close={() => Set_Show_Reciter_List(false)}
        title="Select Reciter"
        options={Reciters}
        Selected_ID={Selected_Reciter}
        onSelect={Set_Selected_Reciter}
      />
    );
  }

  return (
    <div className="space-y-3">

      {/* Record Toggle - Now functional */}
      <div className="cursor-pointer">
        <Card 
          onClick={() => Set_Record_Audio_Enabled(!Record_Audio_Enabled)}
          className="py-2.5 px-4 flex items-center justify-between transition-all group"
        >
          <span className="font-semibold text-sm [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
            Record Recitation
          </span>
          <Switch 
            id="record-Mode" 
            checked={Record_Audio_Enabled} 
            onCheckedChange={Set_Record_Audio_Enabled} 
            size="md"
          />
        </Card>
      </div>

      {/* Play recitation on Kalimah click */}
      <div className="cursor-pointer">
        <Card 
          onClick={() => Set_Hover_Recitation(!Hover_Recitation)}
          className="py-2.5 px-4 flex items-center justify-between transition-all group"
        >
          <span className="font-semibold text-sm [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
            Recitation on Kalimah Click
          </span>
          <Switch 
            id="Kalimah-click-recitation" 
            checked={Hover_Recitation} 
            onCheckedChange={Set_Hover_Recitation} 
            size="md"
          />
        </Card>
      </div>

      {/* Auto‑scroll Toggle */}
      <div className="cursor-pointer">
        <Card 
          onClick={() => Set_Auto_Scroll_During_Playback(!Auto_Scroll_During_Playback)}
          className="py-2.5 px-4 flex items-center justify-between transition-all group"
        >
          <span className="font-semibold text-sm [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
            Auto-scroll
          </span>
          <Switch 
            id="auto-scroll" 
            checked={Auto_Scroll_During_Playback} 
            onCheckedChange={Set_Auto_Scroll_During_Playback} 
            size="md"
          />
        </Card>
      </div>

      {/* Reciter Search */}
      <div className="relative">
        <Search className="absolute left-4 Top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search reciters..."
          value={Search_Query}
          On_Change={(e) => Set_Search_Query(e.target.value)}
          className="pl-10 bg-muted/30 border-2 border-black dark:border-white rounded-[40px] focus:border-primary transition-colors"
        />
      </div>

      {/* Reciter List */}
      <div className="space-y-2">
        {Filtered_Reciters.map((Reciter) => {
          const Is_Selected = Selected_Reciter === Reciter.id;
          return (
            <Button
              key={Reciter.id}
              onClick={() => Set_Selected_Reciter(Reciter.id)}
              fullWidth
              Active={Is_Selected}
              className="justify-between"
            >
              <span className="text-sm font-medium">{Reciter.label}</span>
              {Is_Selected && <Check className="h-4 w-4" />}
            </Button>
          );
        })}
        {Filtered_Reciters.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No reciters found
          </div>
        )}
      </div>
    </div>
  );
}