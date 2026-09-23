import { useState, useEffect, FormEvent } from "react";
import { Layout } from "@Web/Component/Layout/Index";
import { Container } from "@Web/Component/UI/Container";
import { Card } from "@Web/Component/UI/Card";
import { Button } from "@Web/Component/UI/Button";
import { Textarea } from "@Web/Component/UI/Textarea";
import { Use_Auth } from "@Web/Context/Auth";
import { Heart, MessageCircle, Repeat2, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  content: string;
  createdAt: number;
  likes: string[]; // User ids
  reposts: string[];
  replies: Reply[];
}
interface Reply {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  content: string;
  createdAt: number;
  parentId: string | null; // null = Top-Level reply on the post
  likes?: string[];
}

const Storage_Key = "ummah-posts-v3";
const MAX_LEN = 280;
const MAX_DEPTH = 4; // depth cap for nested replies

function loadPosts(): Post[] {
  try {
    const Raw_Storage_Data = localStorage.getItem(Storage_Key);
    if (!Raw_Storage_Data) return [];
    return JSON.parse(Raw_Storage_Data) as Post[];
  } catch { return []; }
}
function savePosts(p: Post[]) {
  try { localStorage.setItem(Storage_Key, JSON.stringify(p)); } catch { /* ignore */ }
}

function timeAgo(ts: number) {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function Ummah() {
  const { User } = Use_Auth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [draft, setDraft] = useState("");
  const [replyOpen, setReplyOpen] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => { setPosts(loadPosts()); }, []);

  const meta = (User?.user_metadata ?? {}) as { display_name?: string; User_Name?: string; first_name?: string; last_name?: string };
  const authorName = meta.display_name || [meta.first_name, meta.last_name].filter(Boolean).join(" ") || "Guest";
  const authorHandle = meta.User_Name || (User?.Email_Address_Input?.split("@")[0] ?? "guest");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !User) return;
    const p: Post = {
      id: crypto.randomUUID(),
      authorId: User.id,
      authorName,
      authorHandle,
      content: content.slice(0, MAX_LEN),
      createdAt: Date.now(),
      likes: [],
      reposts: [],
      replies: [],
    };
    const next = [p, ...posts];
    setPosts(next); savePosts(next); setDraft("");
  };

  const toggleLike = (id: string) => {
    if (!User) return;
    const next = posts.map(p => p.id === id ? {
      ...p, likes: p.likes.includes(User.id) ? p.likes.filter(x => x !== User.id) : [...p.likes, User.id],
    } : p);
    setPosts(next); savePosts(next);
  };
  const toggleRepost = (id: string) => {
    if (!User) return;
    const next = posts.map(p => p.id === id ? {
      ...p, reposts: p.reposts.includes(User.id) ? p.reposts.filter(x => x !== User.id) : [...p.reposts, User.id],
    } : p);
    setPosts(next); savePosts(next);
  };
  const remove = (id: string) => {
    const next = posts.filter(p => p.id !== id);
    setPosts(next); savePosts(next);
  };
  const submitReply = (postId: string) => {
    const content = replyDraft.trim();
    if (!content || !User) return;
    const reply: Reply = {
      id: crypto.randomUUID(),
      authorId: User.id, authorName, authorHandle,
      content: content.slice(0, MAX_LEN), createdAt: Date.now(),
      parentId: null, likes: [],
    };
    const next = posts.map(p => p.id === postId ? { ...p, replies: [...p.replies, reply] } : p);
    setPosts(next); savePosts(next); setReplyDraft(""); setReplyOpen(null);
  };

  const submitNestedReply = (postId: string, parentId: string | null) => {
    const content = replyDraft.trim();
    if (!content || !User) return;
    const reply: Reply = {
      id: crypto.randomUUID(),
      authorId: User.id, authorName, authorHandle,
      content: content.slice(0, MAX_LEN), createdAt: Date.now(),
      parentId, likes: [],
    };
    const next = posts.map(p => p.id === postId ? { ...p, replies: [...p.replies, reply] } : p);
    setPosts(next); savePosts(next); setReplyDraft(""); setReplyOpen(null);
  };

  const toggleReplyLike = (postId: string, replyId: string) => {
    if (!User) return;
    const next = posts.map(p => p.id !== postId ? p : ({
      ...p,
      replies: p.replies.map(r => r.id !== replyId ? r : ({
        ...r,
        likes: (r.likes ?? []).includes(User.id)
          ? (r.likes ?? []).filter(x => x !== User.id)
          : [...(r.likes ?? []), User.id],
      })),
    }));
    setPosts(next); savePosts(next);
  };

  const deleteReply = (postId: string, replyId: string) => {
    const next = posts.map(p => {
      if (p.id !== postId) return p;
      // Also drop descendants
      const toRemove = new Set<string>([replyId]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const r of p.replies) {
          if (r.parentId && toRemove.has(r.parentId) && !toRemove.has(r.id)) {
            toRemove.add(r.id); changed = true;
          }
        }
      }
      return { ...p, replies: p.replies.filter(r => !toRemove.has(r.id)) };
    });
    setPosts(next); savePosts(next);
  };

  const renderThread = (post: Post, parentId: string | null, depth: number) => {
    const children = post.replies
      .filter(r => (r.parentId ?? null) === parentId)
      .sort((a, b) => a.createdAt - b.createdAt);
    if (children.length === 0) return null;
    return (
      <div className={depth === 0 ? "mt-3 space-y-3" : "mt-2 space-y-2"}>
        {children.map(r => {
          const key = `${post.id}:${r.id}`;
          const isCollapsed = !!collapsed[key];
          const mine = !!User && r.authorId === User.id;
          const liked = !!User && (r.likes ?? []).includes(User.id);
          const canReply = depth + 1 < MAX_DEPTH;
          const descendantCount = post.replies.filter(x => {
            // Count if r is ancestor
            let cur: Reply | undefined = x;
            while (cur?.parentId) {
              if (cur.parentId === r.id) return true;
              cur = post.replies.find(y => y.id === cur!.parentId);
            }
            return false;
          }).length;
          return (
            <div key={r.id} className="border-l-2 border-border/40 pl-3">
              <div className="flex items-start gap-2">
                <button
                  onClick={() => setCollapsed(c => ({ ...c, [key]: !c[key] }))}
                  className="text-[10px] text-muted-foreground w-4 shrink-0 hover:text-primary"
                  title={isCollapsed ? "Expand" : "Collapse"}
                >
                  {isCollapsed ? "+" : "−"}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap text-xs">
                    <span className="font-semibold">{r.authorName}</span>
                    <span className="text-muted-foreground">@{r.authorHandle} · {timeAgo(r.createdAt)}</span>
                    {isCollapsed && descendantCount > 0 && (
                      <span className="text-muted-foreground">· {descendantCount} hidden</span>
                    )}
                    {mine && !isCollapsed && (
                      <button onClick={() => deleteReply(post.id, r.id)} className="ml-auto text-muted-foreground hover:text-destructive" title="Delete">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  {!isCollapsed && (
                    <>
                      <p className="mt-0.5 text-sm whitespace-pre-wrap break-Kalimaat">{r.content}</p>
                      <div className="flex items-center gap-4 mt-1 text-muted-foreground text-[11px]">
                        <button onClick={() => toggleReplyLike(post.id, r.id)} className={`flex items-center gap-1 hover:text-rose-500 ${liked ? "text-rose-500" : ""}`}>
                          <Heart className={`h-3 w-3 ${liked ? "fill-current" : ""}`} /> {(r.likes ?? []).length}
                        </button>
                        {canReply ? (
                          <button
                            onClick={() => { setReplyOpen(replyOpen === key ? null : key); setReplyDraft(""); }}
                            className="hover:text-primary"
                          >Reply</button>
                        ) : (
                          <span className="italic opacity-60">Max depth reached</span>
                        )}
                      </div>
                      {replyOpen === key && User && (
                        <div className="mt-2 space-y-2">
                          <Textarea
                            value={replyDraft}
                            On_Change={(e) => setReplyDraft(e.target.value.slice(0, MAX_LEN))}
                            placeholder={`Reply to @${r.authorHandle}`}
                            className="min-h-[50px]"
                          />
                          <div className="flex justify-end gap-2">
                            <Button type="button" onClick={() => setReplyOpen(null)} variant="secondary" size="sm">Cancel</Button>
                            <Button type="button" onClick={() => submitNestedReply(post.id, r.id)} variant="primary" size="sm">Reply</Button>
                          </div>
                        </div>
                      )}
                      {renderThread(post, r.id, depth + 1)}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto w-full space-y-4">
        <h1 className="text-2xl font-bold px-2">Ummah</h1>

        {User ? (
          <Container className="!p-4">
            <form onSubmit={submit} className="space-y-3">
              <Textarea
                value={draft}
                On_Change={(e) => setDraft(e.target.value.slice(0, MAX_LEN))}
                placeholder="Share something good with the Ummah..."
                className="min-h-[90px]"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{draft.length}/{MAX_LEN}</span>
                <Button type="submit" variant="primary" className="px-6" {...(!draft.trim() ? { "aria-disabled": true, style: { opacity: 0.5, pointerEvents: "none" } } : {})}>Post</Button>
              </div>
            </form>
          </Container>
        ) : (
          <Card className="p-4 text-center">
            <p className="text-sm">
              <Link to="/Sign-In" className="text-primary font-semibold hover:underline">Sign in</Link> or{" "}
              <Link to="/Sign-Up" className="text-primary font-semibold hover:underline">create an account</Link> to post.
            </p>
          </Card>
        )}

        <div className="space-y-3">
          {posts.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No posts yet. Be the first to share.</p>
          )}
          {posts.map(p => {
            const liked = !!User && p.likes.includes(User.id);
            const reposted = !!User && p.reposts.includes(User.id);
            const mine = !!User && p.authorId === User.id;
            return (
              <Card key={p.id} className="p-4" Is_Hoverable={false}>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted/40 flex items-center justify-center font-semibold shrink-0">
                    {p.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-semibold truncate">{p.authorName}</span>
                      <span className="text-xs text-muted-foreground truncate">@{p.authorHandle}</span>
                      <span className="text-xs text-muted-foreground">· {timeAgo(p.createdAt)}</span>
                      {mine && (
                        <button onClick={() => remove(p.id)} className="ml-auto text-muted-foreground hover:text-destructive" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap break-Kalimaat">{p.content}</p>
                    <div className="flex items-center gap-6 mt-3 text-muted-foreground text-xs">
                      <button onClick={() => setReplyOpen(replyOpen === p.id ? null : p.id)} className="flex items-center gap-1 hover:text-primary">
                        <MessageCircle className="h-4 w-4" /> {p.replies.length}
                      </button>
                      <button onClick={() => toggleRepost(p.id)} className={`flex items-center gap-1 hover:text-green-500 ${reposted ? "text-green-500" : ""}`}>
                        <Repeat2 className="h-4 w-4" /> {p.reposts.length}
                      </button>
                      <button onClick={() => toggleLike(p.id)} className={`flex items-center gap-1 hover:text-rose-500 ${liked ? "text-rose-500" : ""}`}>
                        <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} /> {p.likes.length}
                      </button>
                    </div>

                    {replyOpen === p.id && User && (
                      <div className="mt-3 space-y-2">
                        <Textarea
                          value={replyDraft}
                          On_Change={(e) => setReplyDraft(e.target.value.slice(0, MAX_LEN))}
                          placeholder="Post your reply"
                          className="min-h-[60px]"
                        />
                        <div className="flex justify-end">
                          <Button type="button" onClick={() => submitReply(p.id)} variant="primary" size="sm">Reply</Button>
                        </div>
                      </div>
                    )}

                    {p.replies.length > 0 && renderThread(p, null, 0)}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}