import { Use_App } from "@Web/Context/App";
import { Button } from "@Web/Component/UI/Button/Index";
import { UI } from "@Web/Context/UI";
import { useNavigate } from "react-router-dom"; // of "next/navigation" afhankelijk van je framework

export default function Language_Root() {
  const { 
    Set_Learning_Language, 
    Active_Languages, 
    Inactive_Languages 
  } = Use_App();

  const navigate = useNavigate();

  const Has_Active_Languages = Active_Languages.length > 0;
  const languagesToDisplay = Has_Active_Languages ? Active_Languages : Inactive_Languages;

  return (
    <UI>
      <div className="px-8 py-4 w-full relative z-[49]">
        <div className="grid grid-cols-2 gap-3">
          {languagesToDisplay.map((lang) => (
            <Button
              key={lang}
              Label={lang}
              Height={64}
              Color="#ffffff"
              TextColor="#000000"
              On_Click={() => {
                Set_Learning_Language(lang);
                navigate(`/Ilm/Language/${lang}`);
              }}
            />
          ))}
        </div>
      </div>
    </UI>
  );
}