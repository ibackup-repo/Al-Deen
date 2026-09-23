import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Use_App } from "@Web/Context/App";
import { Use_Auth } from "@Web/Context/Auth";
import { Use_Is_Mobile } from "@/Hook/Use-Mobile";
import { toast as Toast } from "sonner";
import { Button } from "@Web/Component/UI/Button";
import { Desktop } from "./Layout/Desktop";
import { Mobile } from "./Layout/Mobile";
import { Account_Section } from "./Content/Account/Index";
import { Quran_Section } from "./Content/Quran/Index";
import { Hadith_Section } from "./Content/Hadith/Index";
import { Aid_Section } from "./Content/Aid/Index";
import { Language_Section } from "./Content/Language";
import { Appearance_Section } from "./Content/Appearance/Index";
import { Theme_Section } from "./Content/Theme";
import { Accessibility_Section } from "./Content/Accessibility";
import { Quran_Subcategories } from "./Content/Quran/Constant";
import type { Settings_Category, Account_Subcategory, Aid_Subcategory, Quran_Subcategory, Hadith_Subcategory, Appearance_Subcategory } from "./Types";

export function Settings_Sidebar({ Is_Compact = false }: { Is_Compact?: boolean }) {
  const { Is_Settings_Sidebar_Open, Set_Settings_Sidebar_Open } = Use_App();
  const { User, Sign_Out } = Use_Auth();
  const navigate = useNavigate();
  const Is_Mobile = Use_Is_Mobile();

  const [Active_Category, Set_Active_Category] = useState<Settings_Category>("account");
  const [Active_Subcategory, Set_Active_Subcategory] = useState<
    Account_Subcategory | Aid_Subcategory | Quran_Subcategory | Appearance_Subcategory | null
  >("profile");

  const Handle_Close = () => {
    Set_Settings_Sidebar_Open(false);
    Set_Active_Category("account");
    Set_Active_Subcategory("profile");
  };

  const Handle_Category_Change = (Category: Settings_Category) => {
    Set_Active_Category(Category);
    if (Category === "account") {
      Set_Active_Subcategory("profile");
    } else if (Category === "Aid") {
      Set_Active_Subcategory("Dua");
    } else if (Category === "Quran") {
      Set_Active_Subcategory(Quran_Subcategories[0]?.id || "Arabic");
    } else if (Category === "Appearance") {
      Set_Active_Subcategory("General");
    } else {
      Set_Active_Subcategory(null);
    }
  };

  const Handle_Subcategory_Change = (Subcategory: Account_Subcategory | Aid_Subcategory | Quran_Subcategory | Appearance_Subcategory | null) => {
    Set_Active_Subcategory(Subcategory);
  };

  const Render_Content = () => {
    switch (Active_Category) {
      case "account": {
        if (!User) {
          return (
            <div className="text-center py-8 w-full">
              <p className="text-muted-foreground">Please sign in to view account Settings.</p>
              <Button onClick={() => navigate("/Sign-In")} className="mt-4">
                Sign In
              </Button>
            </div>
          );
        }

        const Display_Name = User?.user_metadata?.display_name || User?.Email_Address_Input?.split("@")[0] || "User";
        const Initials = Display_Name.slice(0, 2).toUpperCase();
        const Handle_Sign_Out = async () => {
          await Sign_Out();
          Toast.success("Signed out successfully");
          Set_Settings_Sidebar_Open(false);
        };

        return (
          <Account_Section
            User={User}
            Display_Name={Display_Name}
            Initials={Initials}
            Handle_Sign_Out={Handle_Sign_Out}
            navigate={navigate}
            Set_Settings_Sidebar_Open={Set_Settings_Sidebar_Open}
            Active_Subcategory={Active_Subcategory as Account_Subcategory}
          />
        );
      }
      case "Quran":
        return <Quran_Section Active_Subcategory={Active_Subcategory as Quran_Subcategory} />;
      case "Hadith":
        return <Hadith_Section Active_Subcategory={Active_Subcategory as Hadith_Subcategory} />;
      case "Aid":
        return <Aid_Section Active_Subcategory={Active_Subcategory as Aid_Subcategory} />;
      case "Appearance":
        return <Appearance_Section Active_Subcategory={Active_Subcategory as Appearance_Subcategory} />;
      case "Language":
        return <Language_Section onSelect={() => {}} />;
      case "theme":
        return <Theme_Section />;
      case "accessibility":
        return <Accessibility_Section />;
      default:
        return null;
    }
  };

  if (!Is_Settings_Sidebar_Open) return null;

  const Main_Content = (
    <div className="w-full flex-1 min-w-0">
      {Render_Content()}
    </div>
  );

  if (Is_Mobile) {
    return (
      <Mobile
        Active_Category={Active_Category}
        Active_Subcategory={Active_Subcategory}
        On_Category_Change={Handle_Category_Change}
        On_Subcategory_Change={Handle_Subcategory_Change}
        On_Close={Handle_Close}
      >
        {Main_Content}
      </Mobile>
    );
  }

  return (
    <Desktop
      Active_Category={Active_Category}
      Active_Subcategory={Active_Subcategory}
      On_Category_Change={Handle_Category_Change}
      On_Subcategory_Change={Handle_Subcategory_Change}
    >
      {Main_Content}
    </Desktop>
  );
}