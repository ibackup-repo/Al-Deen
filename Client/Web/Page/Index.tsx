import { Layout } from "@Web/Component/Layout/Index";
import { Card } from "@Web/Component/UI/Card";
import { Use_Translation } from "@/Hook/Use-Translation";
import { Link } from "react-router-dom";

const Index = () => {
  const { t, Is_RTL } = Use_Translation();

  return (
    <Layout>
      <div 
        className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full" 
        dir={Is_RTL ? "rtl" : "ltr"}
      >
        <div className="flex-1">
          <Link to="/Quran">
            <Card className="p-4 text-center group h-full flex items-center justify-center">
              <span className="font-semibold text-base [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                {t.nav.Quran}
              </span>
            </Card>
          </Link>
        </div>

        <div className="flex-1">
          <Link to="/Hadith">
            <Card className="p-4 text-center group h-full flex items-center justify-center">
              <span className="font-semibold text-base [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                {t.nav.Hadith}
              </span>
            </Card>
          </Link>
        </div>

        <div className="flex-1">
          <Link to="/Ummah">
            <Card className="p-4 text-center group h-full flex items-center justify-center">
              <span className="font-semibold text-base [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                {t.nav?.ummah || "Ummah"}
              </span>
            </Card>
          </Link>
        </div>

        <div className="flex-1">
          <Link to="/AI">
            <Card className="p-4 text-center group h-full flex items-center justify-center">
              <span className="font-semibold text-base [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                AI (Beta)
              </span>
            </Card>
          </Link>
        </div>

        <div className="flex-1 col-span-2 md:col-span-1">
          <Link to="/Aid">
            <Card className="p-4 text-center group h-full flex items-center justify-center">
              <span className="font-semibold text-base [.high-contrast_&]:group-hover:text-white [.high-contrast_&]:dark:group-hover:text-black">
                {t.nav?.Aid || "Aid"}
              </span>
            </Card>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default Index;