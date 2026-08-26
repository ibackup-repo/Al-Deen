import { useState } from "react";
import { Layout } from "@Web/Component/Layout/Index";
import { Card } from "@Web/Component/UI/Card";
import { Use_Translation } from "@/Hook/Use-Translation";
import { Link } from "react-router-dom";

type Navigation_Item_Record = {
  Path_URL: string;
  Label_Text: string;
};

// Daily high-Frequency tools
const Primary_Navigation_Items_List: Navigation_Item_Record[] = [
  { Path_URL: "/Aid/Prayers", Label_Text: "Prayer Time" },
  { Path_URL: "/Aid/Qibla", Label_Text: "Qibla Direction" },
  { Path_URL: "/Aid/Hijri-Calendar", Label_Text: "Hijri Calendar" },
  { Path_URL: "/Aid/Dua", Label_Text: "Dua" },
  { Path_URL: "/Aid/Tasbih", Label_Text: "Tasbih Counter" },
  { Path_URL: "/Aid/Masjid-Finder", Label_Text: "Masjid Finder" },
];

// Secondary tools (Revealed inside the expanded Container)
const Secondary_Navigation_Items_List: Navigation_Item_Record[] = [
  { Path_URL: "/Aid/Namaz", Label_Text: "How to Pray Namaz" },
  { Path_URL: "/Aid/Names", Label_Text: "99 Names of Allah" },
  { Path_URL: "/Aid/Prophets", Label_Text: "25 Prophets" },
  { Path_URL: "/Aid/Pillars", Label_Text: "5 Pillars of Islam" },
  { Path_URL: "/Aid/Articles", Label_Text: "6 Articles of Faith" },
];

export default function Aid() {
  const { Is_RTL: Is_Rtl_Direction_Flag } = Use_Translation();
  const [Is_Expanded_State_Flag, Set_Is_Expanded_State_Flag] = useState(false);

  return (
    <Layout>
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full"
        dir={Is_Rtl_Direction_Flag ? "rtl" : "ltr"}
      >
        {/* Primary Items */}
        {Primary_Navigation_Items_List.map((Navigation_Item: Navigation_Item_Record) => (
          <Link key={Navigation_Item.Path_URL} to={Navigation_Item.Path_URL}>
            <Card className="p-4 text-center group h-full flex items-center justify-center">
              <span className="font-semibold text-base [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                {Navigation_Item.Label_Text}
              </span>
            </Card>
          </Link>
        ))}

        {/* Dynamic Card: Toggles between a single "More" button card and the expanded Container */}
        {!Is_Expanded_State_Flag ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => Set_Is_Expanded_State_Flag(true)}
            onKeyDown={(Keyboard_Event_Object) => Keyboard_Event_Object.key === "Enter" && Set_Is_Expanded_State_Flag(true)}
            className="cursor-pointer"
          >
            <Card className="p-4 text-center group h-full flex items-center justify-center">
              <span className="font-semibold text-base [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                More...
              </span>
            </Card>
          </div>
        ) : (
          <Card className="col-span-2 sm:col-span-3 md:col-span-4 p-4 border-dashed animate-in fade-in Duration-200">
            <div className="flex justify-between items-center mb-3 px-1">
              <span className="text-sm font-semibold text-muted-foreground">
                More Features
              </span>
              <button
                type="button"
                onClick={() => Set_Is_Expanded_State_Flag(false)}
                className="text-xs font-semibold hover:underline text-muted-foreground"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Secondary_Navigation_Items_List.map((Navigation_Item: Navigation_Item_Record) => (
                <Link key={Navigation_Item.Path_URL} to={Navigation_Item.Path_URL}>
                  <Card className="p-4 text-center group">
                    <span className="font-semibold text-base [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                      {Navigation_Item.Label_Text}
                    </span>
                  </Card>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}