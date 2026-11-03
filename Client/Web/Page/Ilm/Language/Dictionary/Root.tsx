import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@Web/Component/UI/Button";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";

export default function Dictionary_Root() {
  const navigate = useNavigate();
  const { Lang_Name } = useParams<{ Lang_Name: string }>();
  const { t } = Use_Course_Language();

  return (
    <div className="px-4 w-full">
      <div className="grid grid-cols-2 gap-3">
        <Button 
          onClick={() => navigate(`/Language/${Lang_Name}/Dictionary/Vocabulary`)} 
          className="min-h-[64px] py-3 text-base"
        >
          <span className="font-semibold">{t("Vocabulary") || "Vocabulary"}</span>
        </Button>
      </div>
    </div>
  );
}