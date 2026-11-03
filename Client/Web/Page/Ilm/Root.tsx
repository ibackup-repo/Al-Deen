import { useNavigate } from "react-router-dom"; // of "next/navigation" als je Next.js gebruikt
import { Button } from "@Web/Component/UI/Button/Index";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";
import { LANGUAGE_LABEL, CHESS_LABEL } from "@/Library/Language";
import { UI } from "@Web/Context/UI";

export default function Root_Picker() {
  const { UI_Language } = Use_Course_Language();
  const navigate = useNavigate();

  const Language_Text = LANGUAGE_LABEL[UI_Language] || "Language";

  return (
    <UI>
      <div className="grid grid-cols-1 gap-3 w-full px-4 relative">
        <Button 
          Label={Language_Text} 
          Height={64} 
          On_Click={() => navigate("/Ilm/Language")} 
        />
      </div>
    </UI>
  );
}