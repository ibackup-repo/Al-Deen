import { useState, useRef, useEffect, useMemo } from "react";
import { Layout } from "@Web/Component/Layout/Index";
import { Container } from "@Web/Component/UI/Container";
import { Button } from "@Web/Component/UI/Button";
import { Textarea } from "@Web/Component/UI/Textarea";
import { Input } from "@Web/Component/UI/Input";
import {
  Send,
  Plus,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  PanelLeft,
  MessageSquare,
  Trash2,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { Toast } from "@/Hook/Use-Toast";
import { supabase } from "@/Integration/supabase/client";
import { Class_Names } from "@/Library/Utility";
import { Use_Is_Mobile } from "@/Hook/Use-Mobile";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const Max_Input_Chars = 4000;

type Message_Record = { Role_Name: "User" | "assistant"; Content_Text: string };
type Thread_Record = { ID: string; Title_Text: string; Messages_Collection: Message_Record[]; Updated_At_Timestamp: number };
type Sidebar_Mode = "maximized" | "minimized" | "closed";

const Storage_Key = "ai-threads-v1";

function Load_Threads_Data(): Thread_Record[] {
  if (typeof window === "undefined") return [];
  try {
    const Raw_Data_String = localStorage.getItem(Storage_Key);
    if (!Raw_Data_String) return [];
    const Parsed_Threads_List = JSON.parse(Raw_Data_String) as Thread_Record[];
    return Array.isArray(Parsed_Threads_List) ? Parsed_Threads_List : [];
  } catch {
    return [];
  }
}

function Create_Thread_Record(): Thread_Record {
  return {
    ID: crypto.randomUUID(),
    Title_Text: "New chat",
    Messages_Collection: [],
    Updated_At_Timestamp: Date.now(),
  };
}

export default function AI() {
  const [Threads_Collection_List, Set_Threads_Collection_List] = useState<Thread_Record[]>(() => {
    const Existing_Threads_List = Load_Threads_Data();
    if (Existing_Threads_List.length > 0) return Existing_Threads_List;
    return [Create_Thread_Record()];
  });
  const [Active_Thread_ID, Set_Active_Thread_ID] = useState<string>(() => {
    const Existing_Threads_List = Load_Threads_Data();
    return Existing_Threads_List[0]?.ID ?? "";
  });
  const [Sidebar_Mode_State, Set_Sidebar_Mode_State] = useState<Sidebar_Mode>("maximized");
  const [Search_Query_Text, Set_Search_Query_Text] = useState("");
  const [Is_Search_Visible, Set_Is_Search_Visible] = useState(false);
  const [User_Input_Text, Set_User_Input_Text] = useState("");
  const [Is_Loading_Corpus_Data, Set_Is_Loading] = useState(false);
  const [Editing_Message_Index, Set_Editing_Message_Index] = useState<number | null>(null);
  const [Editing_Value_Text, Set_Editing_Value_Text] = useState("");
  const [Typing_Target_State, Set_Typing_Target_State] = useState<{ Thread_ID: string; Message_Index: number; Full_Content_Text: string; Shown_Length_Number: number } | null>(null);
  const Scroll_Container_Reference = useRef<HTMLDivElement>(null);
  const Textarea_Element_Reference = useRef<HTMLTextAreaElement>(null);
  const Is_Mobile_View = Use_Is_Mobile();

  useEffect(() => {
    if (!Active_Thread_ID || !Threads_Collection_List.find((Thread_Item: Thread_Record) => Thread_Item.ID === Active_Thread_ID)) {
      Set_Active_Thread_ID(Threads_Collection_List[0]?.ID ?? "");
    }
  }, [Active_Thread_ID, Threads_Collection_List]);

  useEffect(() => {
    try {
      localStorage.setItem(Storage_Key, JSON.stringify(Threads_Collection_List));
    } catch {}
  }, [Threads_Collection_List]);

  const Target_Thread_Record = Threads_Collection_List.find((Thread_Item: Thread_Record) => Thread_Item.ID === Active_Thread_ID) || Threads_Collection_List[0];
  const Messages_Collection_List = Target_Thread_Record?.Messages_Collection ?? [];

  useEffect(() => {
    Scroll_Container_Reference.current?.scrollTo({ Top: Scroll_Container_Reference.current.scrollHeight, behavior: "smooth" });
  }, [Messages_Collection_List, Is_Loading_Corpus_Data]);

  useEffect(() => {
    Textarea_Element_Reference.current?.focus();
  }, [Active_Thread_ID]);

  const Filtered_Threads_Collection_List = useMemo(() => {
    const Cleaned_Query_Text = Search_Query_Text.trim().toLowerCase();
    if (!Cleaned_Query_Text) return Threads_Collection_List;
    return Threads_Collection_List.filter(
      (Thread_Item: Thread_Record) =>
        Thread_Item.Title_Text.toLowerCase().includes(Cleaned_Query_Text) ||
        Thread_Item.Messages_Collection.some((Message_Item: Message_Record) => Message_Item.Content_Text.toLowerCase().includes(Cleaned_Query_Text))
    );
  }, [Threads_Collection_List, Search_Query_Text]);

  const Execute_New_Chat = () => {
    if (Target_Thread_Record && Target_Thread_Record.Messages_Collection.length === 0) {
      Set_User_Input_Text("");
      Textarea_Element_Reference.current?.focus();
      return;
    }
    const Fresh_Thread_Record = Create_Thread_Record();
    Set_Threads_Collection_List((Previous_Threads_List: Thread_Record[]) => [Fresh_Thread_Record, ...Previous_Threads_List]);
    Set_Active_Thread_ID(Fresh_Thread_Record.ID);
    Set_User_Input_Text("");
  };

  const Execute_Delete_Thread = (Target_ID: string) => {
    Set_Threads_Collection_List((Previous_Threads_List: Thread_Record[]) => {
      const Next_Threads_List = Previous_Threads_List.filter((Thread_Item: Thread_Record) => Thread_Item.ID !== Target_ID);
      if (Next_Threads_List.length === 0) {
        const Fresh_Thread_Record = Create_Thread_Record();
        Set_Active_Thread_ID(Fresh_Thread_Record.ID);
        return [Fresh_Thread_Record];
      }
      if (Target_ID === Active_Thread_ID) Set_Active_Thread_ID(Next_Threads_List[0].ID);
      return Next_Threads_List;
    });
  };

  const Update_Active_Thread = (Updater_Function: (Thread_Item: Thread_Record) => Thread_Record) => {
    Set_Threads_Collection_List((Previous_Threads_List: Thread_Record[]) =>
      Previous_Threads_List.map((Thread_Item: Thread_Record) => (Thread_Item.ID === Active_Thread_ID ? Updater_Function(Thread_Item) : Thread_Item))
    );
  };

  const Send_Messages_Payload = async (Messages_Payload_List: Message_Record[]) => {
    Set_Is_Loading(true);
    try {
      // Formats parameters for backend Edge function API
      const Formatted_Messages_Payload_List = Messages_Payload_List.map((Message_Item: Message_Record) => ({
        role: Message_Item.Role_Name,
        content: Message_Item.Content_Text,
      }));

      const { data: Response_Data, error: Response_Error } = await supabase.functions.invoke("ai-chat", {
        body: { messages: Formatted_Messages_Payload_List },
      });

      if (Response_Error) throw new Error(Response_Error.message || "Request failed");

      const Reply_Content_Text = Response_Data?.reply || "";
      const Current_Thread_ID = Active_Thread_ID;

      Update_Active_Thread((Thread_Item: Thread_Record) => ({
        ...Thread_Item,
        Messages_Collection: [...Messages_Payload_List, { Role_Name: "assistant", Content_Text: "" }],
        Updated_At_Timestamp: Date.now(),
      }));

      Set_Typing_Target_State({ Thread_ID: Current_Thread_ID, Message_Index: Messages_Payload_List.length, Full_Content_Text: Reply_Content_Text, Shown_Length_Number: 0 });
    } catch (Captured_Error) {
      Toast({ title: "AI error", description: (Captured_Error as error).message, variant: "destructive" });
    } finally {
      Set_Is_Loading(false);
      setTimeout(() => Textarea_Element_Reference.current?.focus(), 0);
    }
  };

  // Typewriter effect for assistant replies
  useEffect(() => {
    if (!Typing_Target_State) return;
    if (Typing_Target_State.Shown_Length_Number >= Typing_Target_State.Full_Content_Text.length) {
      Set_Typing_Target_State(null);
      return;
    }
    const Step_Size_Number = Math.max(1, Math.round(Typing_Target_State.Full_Content_Text.length / 200));
    const Timer_Handle = setTimeout(() => {
      const Next_Shown_Length_Number = Math.min(Typing_Target_State.Full_Content_Text.length, Typing_Target_State.Shown_Length_Number + Step_Size_Number);
      const Partial_Content_Text = Typing_Target_State.Full_Content_Text.slice(0, Next_Shown_Length_Number);
      Set_Threads_Collection_List((Previous_Threads_List: Thread_Record[]) =>
        Previous_Threads_List.map((Thread_Item: Thread_Record) =>
          Thread_Item.ID === Typing_Target_State.Thread_ID
            ? {
                ...Thread_Item,
                Messages_Collection: Thread_Item.Messages_Collection.map((Message_Item: Message_Record, Index_Number: number) =>
                  Index_Number === Typing_Target_State.Message_Index ? { ...Message_Item, Content_Text: Partial_Content_Text } : Message_Item
                ),
              }
            : Thread_Item
        )
      );
      Set_Typing_Target_State((Previous_Target_State) => (Previous_Target_State ? { ...Previous_Target_State, Shown_Length_Number: Next_Shown_Length_Number } : Previous_Target_State));
    }, 25);
    return () => clearTimeout(Timer_Handle);
  }, [Typing_Target_State]);

  const Execute_Send_Message = async (Override_Text?: string) => {
    const Cleaned_Input_Text = (Override_Text ?? User_Input_Text).trim();
    if (!Cleaned_Input_Text || Is_Loading_Corpus_Data || !Target_Thread_Record) return;
    const Next_Messages_Collection_List: Message_Record[] = [...Target_Thread_Record.Messages_Collection, { Role_Name: "User", Content_Text: Cleaned_Input_Text }];
    Update_Active_Thread((Thread_Item: Thread_Record) => ({
      ...Thread_Item,
      Messages_Collection: Next_Messages_Collection_List,
      Title_Text: Thread_Item.Messages_Collection.length === 0 ? Cleaned_Input_Text.slice(0, 40) : Thread_Item.Title_Text,
      Updated_At_Timestamp: Date.now(),
    }));
    Set_User_Input_Text("");
    await Send_Messages_Payload(Next_Messages_Collection_List);
  };

  const Execute_Regenerate_From = async (User_Message_Index: number) => {
    if (!Target_Thread_Record || Is_Loading_Corpus_Data) return;
    const Truncated_Messages_Collection_List = Target_Thread_Record.Messages_Collection.slice(0, User_Message_Index + 1);
    Update_Active_Thread((Thread_Item: Thread_Record) => ({ ...Thread_Item, Messages_Collection: Truncated_Messages_Collection_List, Updated_At_Timestamp: Date.now() }));
    await Send_Messages_Payload(Truncated_Messages_Collection_List);
  };

  const Start_Edit_Message = (Message_Index: number, Current_Content_Text: string) => {
    Set_Editing_Message_Index(Message_Index);
    Set_Editing_Value_Text(Current_Content_Text);
  };

  const Save_Edit_Message = async (Message_Index: number) => {
    if (!Target_Thread_Record) return;
    const Cleaned_Editing_Text = Editing_Value_Text.trim();
    if (!Cleaned_Editing_Text) return;
    const Truncated_Messages_Collection_List = Target_Thread_Record.Messages_Collection.slice(0, Message_Index);
    Truncated_Messages_Collection_List.push({ Role_Name: "User", Content_Text: Cleaned_Editing_Text });
    Update_Active_Thread((Thread_Item: Thread_Record) => ({ ...Thread_Item, Messages_Collection: Truncated_Messages_Collection_List, Updated_At_Timestamp: Date.now() }));
    Set_Editing_Message_Index(null);
    Set_Editing_Value_Text("");
    await Send_Messages_Payload(Truncated_Messages_Collection_List);
  };

  const Is_Messages_Empty = Messages_Collection_List.length === 0;

  const Cycle_Sidebar_Mode = () => {
    if (Is_Mobile_View) {
      Set_Sidebar_Mode_State((Current_Mode: Sidebar_Mode) => (Current_Mode === "closed" ? "maximized" : "closed"));
      return;
    }
    Set_Sidebar_Mode_State((Current_Mode: Sidebar_Mode) => (Current_Mode === "maximized" ? "minimized" : Current_Mode === "minimized" ? "closed" : "maximized"));
  };

  useEffect(() => {
    Set_Sidebar_Mode_State(Is_Mobile_View ? "closed" : "maximized");
  }, [Is_Mobile_View]);

  const Composer_Element = (
    <div className="w-full flex gap-2 items-end">
      <div className="flex-1 flex flex-col">
        <Textarea
          ref={Textarea_Element_Reference}
          value={User_Input_Text}
          On_Change={(Event_Object) => {
            const Sliced_Value_Text = Event_Object.target.value.slice(0, Max_Input_Chars);
            Set_User_Input_Text(Sliced_Value_Text);
          }}
          onKeyDown={(Event_Object) => {
            if (Event_Object.key === "Enter" && !Event_Object.shiftKey) {
              Event_Object.preventDefault();
              Execute_Send_Message();
            }
          }}
          placeholder="Ask anything..."
          rows={1}
          maxLength={Max_Input_Chars}
          className="w-full resize-none min-h-[44px] max-h-32 overflow-y-auto rounded-full border border-border/30 bg-card text-foreground px-4 py-2.5"
        />
        {User_Input_Text.length > Max_Input_Chars * 0.8 && (
          <span className="text-[10px] text-muted-foreground self-end mt-1 mr-2">
            {User_Input_Text.length}/{Max_Input_Chars}
          </span>
        )}
      </div>
      <Button onClick={() => Execute_Send_Message()} disabled={Is_Loading_Corpus_Data || !User_Input_Text.trim()} size="icon" className="rounded-full h-11 w-11 shrink-0">
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );

  const Last_Assistant_Index_Number = (() => {
    for (let Index_Number = Messages_Collection_List.length - 1; Index_Number >= 0; Index_Number--) {
      if (Messages_Collection_List[Index_Number].Role_Name === "assistant") return Index_Number;
    }
    return -1;
  })();

  const Is_Mobile_Sidebar_Open = Is_Mobile_View && Sidebar_Mode_State !== "closed";

  return (
    <Layout Hide_Footer>
      <div className="relative flex gap-3 w-full" style={{ height: "calc(100vh - 6rem)" }}>
        {Is_Mobile_View && (
          <Button
            size="icon"
            variant="ghost"
            onClick={Cycle_Sidebar_Mode}
            title={Is_Mobile_Sidebar_Open ? "Close sidebar" : "Open sidebar"}
            className="absolute Top-2 left-2 z-50 bg-background/80 backdrop-blur-sm border border-border/40 shadow-sm"
          >
            {Is_Mobile_Sidebar_Open ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </Button>
        )}

        {Sidebar_Mode_State !== "closed" && (
          <aside
            className={Class_Names(
              "flex flex-col shrink-0 transition-all Duration-200",
              Is_Mobile_View
                ? "absolute inset-0 z-40 bg-background pt-14 px-3 pb-3"
                : Sidebar_Mode_State === "minimized"
                ? "w-12"
                : "w-60"
            )}
          >
            {!Is_Mobile_View && (
              <div className="flex items-center gap-1 mb-2">
                <Button size="icon" variant="ghost" onClick={Cycle_Sidebar_Mode} title="Toggle sidebar">
                  {Sidebar_Mode_State === "maximized" ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
                </Button>
                {Sidebar_Mode_State === "maximized" && (
                  <>
                    <Button size="icon" variant="ghost" onClick={() => Set_Is_Search_Visible((State_Flag) => !State_Flag)} title="Search">
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={Execute_New_Chat} title="New chat">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            )}
            {Is_Mobile_View && (
              <div className="flex items-center gap-1 mb-2 justify-end">
                <Button size="icon" variant="ghost" onClick={() => Set_Is_Search_Visible((State_Flag) => !State_Flag)} title="Search">
                  <Search className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={Execute_New_Chat} title="New chat">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}

            {(Is_Mobile_View || Sidebar_Mode_State === "maximized") && Is_Search_Visible && (
              <Input
                placeholder="Search chats..."
                value={Search_Query_Text}
                On_Change={(Event_Object) => Set_Search_Query_Text(Event_Object.target.value)}
                className="h-8 text-xs mb-2"
              />
            )}

            <div className="flex-1 overflow-y-auto space-y-1">
              {Filtered_Threads_Collection_List.map((Thread_Item: Thread_Record) => {
                const Is_Text_Visible = Is_Mobile_View || Sidebar_Mode_State === "maximized";
                return (
                  <Button
                    key={Thread_Item.ID}
                    variant="ghost"
                    Active={Thread_Item.ID === Active_Thread_ID}
                    fullWidth
                    onClick={() => {
                      Set_Active_Thread_ID(Thread_Item.ID);
                      if (Is_Mobile_View) Set_Sidebar_Mode_State("closed");
                    }}
                    className={Class_Names(
                      "group justify-start gap-2 !px-2 !py-2 text-sm h-auto",
                      !Is_Text_Visible && "justify-center"
                    )}
                    title={Thread_Item.Title_Text}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {Is_Text_Visible && (
                      <>
                        <span className="flex-1 truncate text-left">{Thread_Item.Title_Text}</span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(Event_Object) => {
                            Event_Object.stopPropagation();
                            Execute_Delete_Thread(Thread_Item.ID);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                          aria-label="Delete chat"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </span>
                      </>
                    )}
                  </Button>
                );
              })}
              {(Is_Mobile_View || Sidebar_Mode_State === "maximized") && Filtered_Threads_Collection_List.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No chats</p>
              )}
            </div>
          </aside>
        )}

        {!Is_Mobile_View && Sidebar_Mode_State === "closed" && (
          <div className="shrink-0">
            <Button size="icon" variant="ghost" onClick={() => Set_Sidebar_Mode_State("maximized")} title="Open sidebar">
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className={Class_Names("flex-1 flex flex-col min-w-0", Is_Mobile_Sidebar_Open && "invisible")}>
          {Is_Messages_Empty ? (
            <div className="flex-1 flex items-center justify-center px-2 sm:px-6">
              <div className="w-full max-w-2xl">{Composer_Element}</div>
            </div>
          ) : (
            <>
              <div ref={Scroll_Container_Reference} className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 space-y-4">
                {Messages_Collection_List.map((Message_Item: Message_Record, Index_Number: number) => {
                  const Is_User_Role = Message_Item.Role_Name === "User";
                  const Is_Last_Assistant_Message = !Is_User_Role && Index_Number === Last_Assistant_Index_Number;
                  const Is_Message_Editing = Is_User_Role && Editing_Message_Index === Index_Number;
                  return (
                    <div key={Index_Number} className={Class_Names("flex flex-col gap-1.5", Is_User_Role ? "items-end" : "items-start", Is_Message_Editing && "w-full")}>
                      {Is_Message_Editing ? (
                        <Textarea
                          value={Editing_Value_Text}
                          On_Change={(Event_Object) => Set_Editing_Value_Text(Event_Object.target.value)}
                          rows={2}
                          className="w-full rounded-xl border border-border bg-transparent px-3 py-2 min-h-[60px]"
                          autoFocus
                        />
                      ) : Is_User_Role ? (
                        <Container className="!p-3 max-w-[85%]">
                          <div className="text-sm whitespace-pre-wrap">{Message_Item.Content_Text}</div>
                        </Container>
                      ) : (
                        <Container className="!p-3 max-w-[85%]">
                          <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-pre:my-2 prose-headings:my-2 prose-ul:my-2 prose-ol:my-2">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{Message_Item.Content_Text || ""}</ReactMarkdown>
                            {Typing_Target_State && Typing_Target_State.Thread_ID === Target_Thread_Record?.ID && Typing_Target_State.Message_Index === Index_Number && (
                              <span className="inline-block w-1.5 h-4 bg-current ml-0.5 align-middle animate-pulse" />
                            )}
                          </div>
                        </Container>
                      )}
                      <div className={Class_Names("flex items-center gap-1", Is_User_Role ? "justify-end" : "justify-start")}>
                        {Is_User_Role && !Is_Message_Editing && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => Start_Edit_Message(Index_Number, Message_Item.Content_Text)} className="h-7 px-2 text-xs">
                              <Pencil className="h-3 w-3 mr-1" /> Edit
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7"
                              onClick={() => { navigator.clipboard.writeText(Message_Item.Content_Text); Toast({ title: "Copied" }); }}>
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {Is_User_Role && Is_Message_Editing && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => Save_Edit_Message(Index_Number)} className="h-7 px-2 text-xs">
                              <Check className="h-3 w-3 mr-1" /> Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { Set_Editing_Message_Index(null); Set_Editing_Value_Text(""); }} className="h-7 px-2 text-xs">
                              <X className="h-3 w-3 mr-1" /> Cancel
                            </Button>
                          </>
                        )}
                        {Is_Last_Assistant_Message && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => {
                              for (let Search_Index_Number = Index_Number - 1; Search_Index_Number >= 0; Search_Index_Number--) {
                                if (Messages_Collection_List[Search_Index_Number].Role_Name === "User") {
                                  Execute_Regenerate_From(Search_Index_Number);
                                  break;
                                }
                              }
                            }} disabled={Is_Loading_Corpus_Data} className="h-7 px-2 text-xs">
                              <RotateCcw className="h-3 w-3 mr-1" /> Regenerate
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7"
                              onClick={() => { navigator.clipboard.writeText(Message_Item.Content_Text); Toast({ title: "Copied" }); }}>
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => Toast({ title: "Thanks for the feedback" })}>
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => Toast({ title: "Thanks for the feedback" })}>
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pt-2">{Composer_Element}</div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}