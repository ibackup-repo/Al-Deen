import { useEffect, useState } from "react";
import { Inbox, Trash2, Clock, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@Web/Component/UI/Button";
import { Container } from "@Web/Component/UI/container";
import { FullPageDialog } from "@Web/Component/UI/full-page-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@Web/Component/UI/tabs";

import { Use_App } from "@Web/Context/App";
import { Format_Countdown, Is_Ready, type Recall_Item } from "@/Library/Recall";
import { Use_Course_Language } from "@/Hook/Use-Course-Language";

/**
 * Header button (sits next to Search). Opens a dialog with two tabs:
 * Active = items still cooling down. Recall = items ready to redo.
 */
export function Recall_Queue_Button() {
  const { Recall_Queue, Remove_Recall_Item, Set_Active_Recall, Browse_Path, Set_Recall_Return_Path } = Use_App();
  const { t } = Use_Course_Language();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const [, Set_Tick] = useState(0);
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => Set_Tick(n => n + 1), 30_000);
    return () => clearInterval(id);
  }, [open]);

  const now = Date.now();
  const active = Recall_Queue.filter(i => !Is_Ready(i, now)).sort((a, b) => a.Ready_At - b.Ready_At);
  const ready = Recall_Queue.filter(i => Is_Ready(i, now)).sort((a, b) => a.Ready_At - b.Ready_At);
  const Has_Ready = ready.length > 0;

  const Open_Item = (item: Recall_Item) => {
    setOpen(false);
    Set_Recall_Return_Path(Browse_Path);
    Set_Active_Recall({
      Scope: item.Scope,
      Category_ID: item.Category_ID,
      Subcategory_ID: item.Subcategory_ID,
      Word_ID: item.Word_ID,
    });
    navigate("/Recall");
  };

  return (
    <>
      <Button
        size="icon"
        aria-label="Recall queue"
        className="relative"
        onClick={() => setOpen(true)}
      >
        <Inbox className="h-5 w-5" />
        {Has_Ready && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-foreground text-background text-[10px] font-bold flex items-center justify-center">
            {ready.length}
          </span>
        )}
      </Button>
      <FullPageDialog open={open} onOpenChange={setOpen} title={t("activeAndRecall") || "Active & Recall"}>
        <Tabs defaultValue={Has_Ready ? "ready" : "active"} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="active">
              {t("activeTab") || "Active"} ({active.length})
            </TabsTrigger>
            <TabsTrigger value="ready">
              {t("recallTab") || "Recall"} ({ready.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="space-y-2 mt-3">
            {active.length === 0 && (
              <p className="text-sm opacity-60 text-center py-6">
                {t("noActive") || "Nothing cooling down."}
              </p>
            )}
            {active.map(item => (
              <Row
                key={item.id}
                item={item}
                onDelete={() => Remove_Recall_Item(item.id)}
                ready={false}
                t={t}
              />
            ))}
          </TabsContent>
          <TabsContent value="ready" className="space-y-2 mt-3">
            {ready.length === 0 && (
              <p className="text-sm opacity-60 text-center py-6">
                {t("noReady") || "Nothing to recall yet."}
              </p>
            )}
            {ready.map(item => (
              <Row
                key={item.id}
                item={item}
                onDelete={() => Remove_Recall_Item(item.id)}
                onOpen={() => Open_Item(item)}
                ready
                t={t}
              />
            ))}
          </TabsContent>
        </Tabs>
      </FullPageDialog>
    </>
  );
}



function Row({
  item, onDelete, onOpen, ready, t,
}: {
  item: Recall_Item;
  onDelete: () => void;
  onOpen?: () => void;
  ready: boolean;
  t: (k: string) => string;
}) {

  return (
    <Container className="flex items-center gap-2 p-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.title}</p>
        <p className="text-xs opacity-60 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {ready ? "Ready" : Format_Countdown(item.Ready_At)}
          <span className="opacity-50">· ★{item.Last_Rating}</span>
        </p>
      </div>
      {ready && onOpen && (
        <Button size="icon" active onClick={onOpen} aria-label={t("startRecall") || "Start recall"}>
          <Play className="h-4 w-4" />
        </Button>
      )}
      <Button size="icon" onClick={onDelete} aria-label={t("deleteItem") || "Delete"}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </Container>
  );
}

