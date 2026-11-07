import { Layout } from "@Web/Component/Layout/Index";
import { Button } from "@Web/Component/UI/Button/Index";
import { UI } from "@Web/Context/UI";
import { Use_Translation } from "@/Hook/Use-Translation";

type Navigation_Item_Record = {
  Path_URL: string;
  Label_Text: string;
};

export default function Aid_Root() {
  const { Is_RTL } = Use_Translation();

  const Button_Properties = {
    Height: 64,
    Transition_Border_Radius: 12,
  };

  const First_Row_Items: Navigation_Item_Record[] = [
    {
      Path_URL: "/Aid/Hijri-Calendar",
      Label_Text: "Hijri Calendar",
    },
    {
      Path_URL: "/Aid/Prayer-Time",
      Label_Text: "Prayer Time",
    },
    {
      Path_URL: "/Aid/Masjid-Finder",
      Label_Text: "Masjid Finder",
    },
  ];

  const Second_Row_Items: Navigation_Item_Record[] = [
    {
      Path_URL: "/Aid/Tasbih-Counter",
      Label_Text: "Tasbih Counter",
    },
    {
      Path_URL: "/Aid/Qibla-Direction",
      Label_Text: "Qibla Direction",
    },
  ];

  const Render_Buttons = (Items: Navigation_Item_Record[]) =>
    Items.map((Item) => (
      <div key={Item.Path_URL} className="w-full min-w-0">
        <Button
          Label={Item.Label_Text}
          Navigate_To={Item.Path_URL}
          {...Button_Properties}
        />
      </div>
    ));

  return (
    <UI>
      <Layout>
        <div
          className="w-full px-2 py-4"
          dir={Is_RTL ? "rtl" : "ltr"}
        >
          <div className="flex flex-col gap-4 w-full">

            {/* FIRST ROW: 3 COLUMNS ON DESKTOP */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              {Render_Buttons(First_Row_Items)}
            </div>

            {/* SECOND ROW: 2 COLUMNS ON DESKTOP */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {Render_Buttons(Second_Row_Items)}
            </div>

          </div>
        </div>
      </Layout>
    </UI>
  );
}