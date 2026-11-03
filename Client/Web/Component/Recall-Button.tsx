import { useNavigate } from "react-router-dom";
import { Brain, Clock } from "lucide-react";
import { Button } from "@Web/Component/UI/Button";
import { Use_App } from "@Web/Context/App";
import { Format_Countdown, Is_Ready, Recall_ID, type Recall_Scope } from "@/Library/Recall";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";

interface Properties {
  Scope: Recall_Scope;
  Category_ID: string;
  Subcategory_ID: string;
  Word_ID?: string;
  className?: string;
  fullWidth?: boolean;
}

/**
 * Inline "Recall" entry point shown on word- and subcategory-detail pages.
 * Disabled while the deck is cooling down.
 */
export function Recall_Button({ Scope, Category_ID, Subcategory_ID, Word_ID, className, fullWidth }: Properties) {
  const navigate = useNavigate();
  const { Recall_Queue, Set_Active_Recall, Browse_Path, Set_Recall_Return_Path } = Use_App();
  const { t } = Use_Course_Language();

  const id = Recall_ID(Scope, Category_ID, Subcategory_ID, Word_ID);
  const queued = Recall_Queue.find(i => i.id === id);
  const cooling = queued && !Is_Ready(queued);

  const go = () => {
    if (cooling) return;
    Set_Recall_Return_Path(Browse_Path);
    Set_Active_Recall({ Scope, Category_ID, Subcategory_ID, Word_ID });
    navigate("/Recall");
  };

  if (cooling) {
    return (
      <Button disabled className={className} fullWidth={fullWidth}>
        <Clock className="h-4 w-4 mr-2" />
        {(t("recall") || "Recall")} · {Format_Countdown(queued!.Ready_At)}
      </Button>
    );
  }

  const ready = !!queued && Is_Ready(queued);
  return (
    <Button onClick={go} active={ready} className={className} fullWidth={fullWidth}>
      <Brain className="h-4 w-4 mr-2" />
      {t("recall") || "Recall"}
    </Button>
  );
}