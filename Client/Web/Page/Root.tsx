import { Layout } from "@Web/Component/Layout/Index";
import { Button } from "@Web/Component/UI/Button/Index";
import { UI } from "@Web/Context/UI";
import { Use_Translation } from "@/Hook/Use-Translation";

const Root = () => {
  const { t, Is_RTL } = Use_Translation();

  const Button_Properties = {
    Height: 64,
    Transition_Border_Radius: 12,
  };

  const Buttons = [
    {
      Label: t.nav.Quran,
      Path: "/Quran",
    },
    {
      Label: t.nav.Hadith,
      Path: "/Hadith",
    },
    {
      Label: "AI",
      Path: "/AI",
    },
    {
      Label: t.nav?.ilm || "Ilm",
      Path: "/Ilm",
    },
    {
      Label: t.nav?.Aid || "Aid",
      Path: "/Aid",
    },
  ];

  return (
    <UI>
      <Layout>
        <div
          className="w-full px-4 py-2"
          dir={Is_RTL ? "rtl" : "ltr"}
        >
          <div className="flex flex-col gap-4 w-full">

            {/* EERSTE RIJ: 3 KOLOMMEN OP DESKTOP */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              {Buttons.slice(0, 3).map((Item) => (
                <div key={Item.Path} className="w-full min-w-0">
                  <Button
                    Label={Item.Label}
                    Navigate_To={Item.Path}
                    {...Button_Properties}
                  />
                </div>
              ))}
            </div>

            {/* TWEEDE RIJ: 2 KOLOMMEN OP DESKTOP */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {Buttons.slice(3).map((Item) => (
                <div key={Item.Path} className="w-full min-w-0">
                  <Button
                    Label={Item.Label}
                    Navigate_To={Item.Path}
                    {...Button_Properties}
                  />
                </div>
              ))}
            </div>

          </div>
        </div>
      </Layout>
    </UI>
  );
};

export default Root;