import { Layout } from "@Web/Component/Layout/Index";
import { Button } from "@Web/Component/UI/Button/Index";
import { UI_Provider } from "@Web/Context/UI";
import { Use_Translation } from "@/Hook/Use-Translation";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { t, Is_RTL } = Use_Translation();
  const Navigate = useNavigate();

  return (
    <UI_Provider>
      <Layout>
        <div 
          className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full" 
          dir={Is_RTL ? "rtl" : "ltr"}
        >
          <div className="flex-1">
            <Button
              Label={t.nav.Quran}
              On_Click={() => Navigate("/Quran")}
              Height={64} 
            />
          </div>

          <div className="flex-1">
            <Button
              Label={t.nav.Hadith}
              On_Click={() => Navigate("/Hadith")}
          Height={64} 
            />
          </div>

          <div className="flex-1">
            <Button
              Label={t.nav?.ummah || "Ummah"}
              On_Click={() => Navigate("/Ummah")}
          Height={64} 
            />
          </div>

          <div className="flex-1">
            <Button
              Label="AI (Beta)"
              On_Click={() => Navigate("/AI")}
          Height={64} 
            />
          </div>

          <div className="flex-1 col-span-2 md:col-span-1">
            <Button
              Label={t.nav?.Aid || "Aid"}
              On_Click={() => Navigate("/Aid")}
          Height={64} 
            />
          </div>
        </div>
      </Layout>
    </UI_Provider>
  );
};

export default Index;