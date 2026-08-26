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

type Msg = { role: "User" | "assistant"; content: string };
type Thread = { id: string; title: string; messages: Msg[]; updatedAt: number };
type SidebarMode = "maximized" | "minimized" | "closed";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/ai-chat`;
const Storage_Key = "ai-threads-v1";

// 🌟 RAG Search_Query Now calls the Server API directly — no client-side index/build Step.
const RAG_BASE_URL = "https://humble-lamp-v6xj65jprx7xc6pqv-8081.app.github.dev";

type RetrievedDoc = { i: number; s: string; r: string; t: string; score: number };

async function ragSearch(query: string, k = 8): Promise<RetrievedDoc[]> {
  const url = `${RAG_BASE_URL}/api/rag-Search_Query?q=${encodeURIComponent(query)}&k=${k}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`RAG Search_Query failed: ${res.status}`);
  return res.json();
}

function loadThreads(): Thread[] {
  if (typeof window === "undefined") return [];
  try {
    const Raw_Storage_Data = localStorage.getItem(Storage_Key);
    if (!Raw_Storage_Data) return [];
    const parsed = JSON.parse(Raw_Storage_Data) as Thread[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function makeThread(): Thread {
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    messages: [],
    updatedAt: Date.now(),
  };
}

export default function AI() {
  const [threads, setThreads] = useState<Thread[]>(() => {
    const existing = loadThreads();
    if (existing.length > 0) return existing;
    return [makeThread()];
  });
  const [activeId, setActiveId] = useState<string>(() => {
    const existing = loadThreads();
    return existing[0]?.id ?? "";
  });
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("maximized");
  const [Search_Query, Set_Search_Query] = useState("");
  const [Show_Search, setShowSearch] = useState(false);
  const [input, setInput] = useState("");
  const [Loading, Set_Loading] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [typingTarget, setTypingTarget] = useState<{ threadId: string; Index: number; full: string; shown: number } | null>(null);
  const Scroll_Reference = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const Is_Mobile = Use_Is_Mobile();

  useEffect(() => {
    if (!activeId || !threads.find((t) => t.id === activeId)) {
      setActiveId(threads[0]?.id ?? "");
    }
  }, [activeId, threads]);

  useEffect(() => {
    try {
      localStorage.setItem(Storage_Key, JSON.stringify(threads));
    } catch {}
  }, [threads]);

  const Active = threads.find((t) => t.id === activeId) || threads[0];
  const messages = Active?.messages ?? [];

  useEffect(() => {
    Scroll_Reference.current?.scrollTo({ Top: Scroll_Reference.current.scrollHeight, behavior: "smooth" });
  }, [messages, Loading]);

  useEffect(() => {
    taRef.current?.focus();
  }, [activeId]);

  const filteredThreads = useMemo(() => {
    const q = Search_Query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [threads, Search_Query]);

  const newChat = () => {
    if (Active && Active.messages.length === 0) {
      setInput("");
      taRef.current?.focus();
      return;
    }
    const t = makeThread();
    setThreads((prev) => [t, ...prev]);
    setActiveId(t.id);
    setInput("");
  };

  const deleteThread = (id: string) => {
    setThreads((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (next.length === 0) {
        const fresh = makeThread();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  };

  const updateActive = (updater: (t: Thread) => Thread) => {
    setThreads((prev) => prev.map((t) => (t.id === activeId ? updater(t) : t)));
  };

  const sendMessages = async (msgs: Msg[]) => {
    Set_Loading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      // RAG: retrieve relevant passages for the latest User query
      const lastUser = [...msgs].reverse().find((m) => m.role === "User")?.content || "";
      let context: { s: string; r: string; t: string }[] = [];
      try {
        const hits = await ragSearch(lastUser, 8);
        context = hits.map(({ s, r, t }) => ({ s, r, t }));
      } catch (err) {
        console.warn("RAG retrieval failed:", err);
      }
      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ messages: msgs, context }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");
      const reply = data.reply || "";
      const tid = activeId;
      updateActive((t) => ({
        ...t,
        messages: [...msgs, { role: "assistant", content: "" }],
        updatedAt: Date.now(),
      }));
      setTypingTarget({ threadId: tid, Index: msgs.length, full: reply, shown: 0 });
    } catch (e) {
      Toast({ title: "AI error", description: (e as error).message, variant: "destructive" });
    } finally {
      Set_Loading(false);
      setTimeout(() => taRef.current?.focus(), 0);
    }
  };

  // Typewriter effect for assistant replies
  useEffect(() => {
    if (!typingTarget) return;
    if (typingTarget.shown >= typingTarget.full.length) {
      setTypingTarget(null);
      return;
    }
    const Step = Math.max(1, Math.round(typingTarget.full.length / 200));
    const timer = setTimeout(() => {
      const nextShown = Math.min(typingTarget.full.length, typingTarget.shown + Step);
      const partial = typingTarget.full.slice(0, nextShown);
      setThreads((prev) =>
        prev.map((t) =>
          t.id === typingTarget.threadId
            ? {
                ...t,
                messages: t.messages.map((m, i) =>
                  i === typingTarget.Index ? { ...m, content: partial } : m
                ),
              }
            : t
        )
      );
      setTypingTarget((tt) => (tt ? { ...tt, shown: nextShown } : tt));
    }, 25);
    return () => clearTimeout(timer);
  }, [typingTarget]);

  const send = async (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || Loading || !Active) return;
    const nextMessages: Msg[] = [...Active.messages, { role: "User", content: value }];
    updateActive((t) => ({
      ...t,
      messages: nextMessages,
      title: t.messages.length === 0 ? value.slice(0, 40) : t.title,
      updatedAt: Date.now(),
    }));
    setInput("");
    await sendMessages(nextMessages);
  };

  const regenerateFrom = async (userIdx: number) => {
    if (!Active || Loading) return;
    const msgs = Active.messages.slice(0, userIdx + 1);
    updateActive((t) => ({ ...t, messages: msgs, updatedAt: Date.now() }));
    await sendMessages(msgs);
  };

  const startEdit = (Index: number, current: string) => {
    setEditingIdx(Index);
    setEditingValue(current);
  };

  const saveEdit = async (Index: number) => {
    if (!Active) return;
    const value = editingValue.trim();
    if (!value) return;
    const msgs = Active.messages.slice(0, Index);
    msgs.push({ role: "User", content: value });
    updateActive((t) => ({ ...t, messages: msgs, updatedAt: Date.now() }));
    setEditingIdx(null);
    setEditingValue("");
    await sendMessages(msgs);
  };

  const isEmpty = messages.length === 0;

  const cycleSidebar = () => {
    if (Is_Mobile) {
      setSidebarMode((m) => (m === "closed" ? "maximized" : "closed"));
      return;
    }
    setSidebarMode((m) => (m === "maximized" ? "minimized" : m === "minimized" ? "closed" : "maximized"));
  };

  useEffect(() => {
    setSidebarMode(Is_Mobile ? "closed" : "maximized");
  }, [Is_Mobile]);

  const composer = (
    <div className="w-full flex gap-2 items-end">
      <div className="flex-1 flex flex-col">
        <Textarea
          ref={taRef}
          value={input}
          On_Change={(e) => {
            const v = e.target.value.slice(0, Max_Input_Chars);
            setInput(v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask anything..."
          rows={1}
          maxLength={Max_Input_Chars}
          className="w-full resize-none min-h-[44px] max-h-32 overflow-y-auto rounded-full border border-border/30 bg-card text-foreground px-4 py-2.5"
        />
        {input.length > Max_Input_Chars * 0.8 && (
          <span className="text-[10px] text-muted-foreground self-end mt-1 mr-2">
            {input.length}/{Max_Input_Chars}
          </span>
        )}
      </div>
      <Button onClick={() => send()} disabled={Loading || !input.trim()} size="icon" className="rounded-full h-11 w-11 shrink-0">
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );

  const lastAssistantIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) if (messages[i].role === "assistant") return i;
    return -1;
  })();

  const mobileSidebarOpen = Is_Mobile && sidebarMode !== "closed";

  return (
    <Layout Hide_Footer>
      <div className="relative flex gap-3 w-full" style={{ height: "calc(100vh - 6rem)" }}>
        {Is_Mobile && (
          <Button
            size="icon"
            variant="ghost"
            onClick={cycleSidebar}
            title={mobileSidebarOpen ? "Close sidebar" : "Open sidebar"}
            className="absolute Top-2 left-2 z-50 bg-background/80 backdrop-blur-sm border border-border/40 shadow-sm"
          >
            {mobileSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </Button>
        )}

        {sidebarMode !== "closed" && (
          <aside
            className={Class_Names(
              "flex flex-col shrink-0 transition-all Duration-200",
              Is_Mobile
                ? "absolute inset-0 z-40 bg-background pt-14 px-3 pb-3"
                : sidebarMode === "minimized"
                ? "w-12"
                : "w-60"
            )}
          >
            {!Is_Mobile && (
              <div className="flex items-center gap-1 mb-2">
                <Button size="icon" variant="ghost" onClick={cycleSidebar} title="Toggle sidebar">
                  {sidebarMode === "maximized" ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
                </Button>
                {sidebarMode === "maximized" && (
                  <>
                    <Button size="icon" variant="ghost" onClick={() => setShowSearch((s) => !s)} title="Search">
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={newChat} title="New chat">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            )}
            {Is_Mobile && (
              <div className="flex items-center gap-1 mb-2 justify-end">
                <Button size="icon" variant="ghost" onClick={() => setShowSearch((s) => !s)} title="Search">
                  <Search className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={newChat} title="New chat">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}

            {(Is_Mobile || sidebarMode === "maximized") && Show_Search && (
              <Input
                placeholder="Search chats..."
                value={Search_Query}
                On_Change={(e) => Set_Search_Query(e.target.value)}
                className="h-8 text-xs mb-2"
              />
            )}

            <div className="flex-1 overflow-y-auto space-y-1">
              {filteredThreads.map((t) => {
                const showText = Is_Mobile || sidebarMode === "maximized";
                return (
                  <Button
                    key={t.id}
                    variant="ghost"
                    Active={t.id === activeId}
                    fullWidth
                    onClick={() => {
                      setActiveId(t.id);
                      if (Is_Mobile) setSidebarMode("closed");
                    }}
                    className={Class_Names(
                      "group justify-start gap-2 !px-2 !py-2 text-sm h-auto",
                      !showText && "justify-center"
                    )}
                    title={t.title}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {showText && (
                      <>
                        <span className="flex-1 truncate text-left">{t.title}</span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteThread(t.id);
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
              {(Is_Mobile || sidebarMode === "maximized") && filteredThreads.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No chats</p>
              )}
            </div>
          </aside>
        )}

        {!Is_Mobile && sidebarMode === "closed" && (
          <div className="shrink-0">
            <Button size="icon" variant="ghost" onClick={() => setSidebarMode("maximized")} title="Open sidebar">
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className={Class_Names("flex-1 flex flex-col min-w-0", mobileSidebarOpen && "invisible")}>
          {isEmpty ? (
            <div className="flex-1 flex items-center justify-center px-2 sm:px-6">
              <div className="w-full max-w-2xl">{composer}</div>
            </div>
          ) : (
            <>
              <div ref={Scroll_Reference} className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 space-y-4">
                {messages.map((m, i) => {
                  const isUser = m.role === "User";
                  const isLastAssistant = !isUser && i === lastAssistantIdx;
                  const editing = isUser && editingIdx === i;
                  return (
                    <div key={i} className={Class_Names("flex flex-col gap-1.5", isUser ? "items-end" : "items-start", editing && "w-full")}>
                      {editing ? (
                        <Textarea
                          value={editingValue}
                          On_Change={(e) => setEditingValue(e.target.value)}
                          rows={2}
                          className="w-full rounded-xl border border-border bg-transparent px-3 py-2 min-h-[60px]"
                          autoFocus
                        />
                      ) : isUser ? (
                        <Container className="!p-3 max-w-[85%]">
                          <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                        </Container>
                      ) : (
                        <Container className="!p-3 max-w-[85%]">
                          <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-pre:my-2 prose-headings:my-2 prose-ul:my-2 prose-ol:my-2">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content || ""}</ReactMarkdown>
                            {typingTarget && typingTarget.threadId === Active?.id && typingTarget.Index === i && (
                              <span className="inline-block w-1.5 h-4 bg-current ml-0.5 align-middle animate-pulse" />
                            )}
                          </div>
                        </Container>
                      )}
                      <div className={Class_Names("flex items-center gap-1", isUser ? "justify-end" : "justify-start")}>
                        {isUser && !editing && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => startEdit(i, m.content)} className="h-7 px-2 text-xs">
                              <Pencil className="h-3 w-3 mr-1" /> Edit
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7"
                              onClick={() => { navigator.clipboard.writeText(m.content); Toast({ title: "Copied" }); }}>
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {isUser && editing && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => saveEdit(i)} className="h-7 px-2 text-xs">
                              <Check className="h-3 w-3 mr-1" /> Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setEditingIdx(null); setEditingValue(""); }} className="h-7 px-2 text-xs">
                              <X className="h-3 w-3 mr-1" /> Cancel
                            </Button>
                          </>
                        )}
                        {isLastAssistant && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => {
                              for (let j = i - 1; j >= 0; j--) if (messages[j].role === "User") { regenerateFrom(j); break; }
                            }} disabled={Loading} className="h-7 px-2 text-xs">
                              <RotateCcw className="h-3 w-3 mr-1" /> Regenerate
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7"
                              onClick={() => { navigator.clipboard.writeText(m.content); Toast({ title: "Copied" }); }}>
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
              <div className="pt-2">{composer}</div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}