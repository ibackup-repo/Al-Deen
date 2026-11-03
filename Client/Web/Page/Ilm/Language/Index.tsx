import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@Web/Component/UI/Button/Index";
import { UI } from "@Web/Context/UI";

export default function Levels_Page() {
  const { Lang_Name } = useParams<{ Lang_Name: string }>();
  const navigate = useNavigate();
  const activeLang = Lang_Name || "English";

  return (
    <UI>
      <div className="px-8 py-4 w-full relative z-[60] max-w-8xl mx-auto">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
          <Button
            Label="Lesson"
            On_Click={() => navigate(`/Ilm/Language/${activeLang}/Lesson`)}
            Height={64}
            Color="#ffffff"
            TextColor="#000000"
          />
          <Button
            Label="Dictionary"
            On_Click={() => navigate(`/Ilm/Language/${activeLang}/Dictionary`)}
            Height={64}
            Color="#ffffff"
            TextColor="#000000"
          />
        </div>
      </div>
    </UI>
  );
}