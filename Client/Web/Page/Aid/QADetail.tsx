import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Layout } from "@Web/Component/Layout/Index";
import { Card } from "@Web/Component/UI/Card";
import { Button } from "@Web/Component/UI/Button";
import { Use_Auth } from "@Web/Context/Auth";
import { Toast } from "@/Hook/Use-Toast";
import { ArrowUp, ShieldCheck, ChevronLeft } from "lucide-react";
import {
  getQuestion,
  getAnswers,
  createAnswer,
  toggleVote,
  getMyVotes,
  Is_Admin,
  type QAQuestion,
  type QAAnswer,
} from "@/Library/QA";

const QADetail = () => {
  const { id } = useParams<{ id: string }>();
  const { User } = Use_Auth();
  const [question, setQuestion] = useState<QAQuestion | null>(null);
  const [answers, setAnswers] = useState<QAAnswer[]>([]);
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [admin, setAdmin] = useState(false);
  const [body, setBody] = useState("");
  const [Loading, Set_Loading] = useState(true);
  const [posting, setPosting] = useState(false);

  const refresh = async () => {
    if (!id) return;
    Set_Loading(true);
    try {
      const [q, a, adm] = await Promise.all([getQuestion(id), getAnswers(id), Is_Admin()]);
      setQuestion(q);
      setAnswers(a);
      setAdmin(adm);
      const ids = [id, ...a.map(x => x.id)];
      if (User) {
        const [qv, av] = await Promise.all([
          getMyVotes("question", [id]),
          getMyVotes("answer", a.map(x => x.id)),
        ]);
        const set = new Set<string>();
        qv.forEach(v => set.add(`q:${v}`));
        av.forEach(v => set.add(`a:${v}`));
        setVoted(set);
      }
    } finally {
      Set_Loading(false);
    }
  };

  useEffect(() => { void refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id, User?.id]);

  const handleVote = async (type: "question" | "answer", targetId: string) => {
    if (!User) { Toast({ title: "Sign in required" }); return; }
    try {
      const r = await toggleVote(type, targetId);
      const key = `${type === "question" ? "q" : "a"}:${targetId}`;
      setVoted(prev => {
        const next = new Set(prev);
        if (r === "added") next.add(key); else next.delete(key);
        return next;
      });
      const delta = r === "added" ? 1 : -1;
      if (type === "question" && question) setQuestion({ ...question, upvotes: question.upvotes + delta });
      if (type === "answer") setAnswers(prev => prev.map(a => a.id === targetId ? { ...a, upvotes: a.upvotes + delta } : a));
    } catch (e: unknown) {
      Toast({ title: "Vote failed", description: e instanceof error ? e.message : String(e) });
    }
  };

  const handleAnswer = async () => {
    if (!id) return;
    if (body.trim().length < 5) { Toast({ title: "Answer too short" }); return; }
    setPosting(true);
    try {
      await createAnswer(id, body.trim(), true);
      setBody("");
      Toast({ title: "Answer posted" });
      await refresh();
    } catch (e: unknown) {
      Toast({ title: "Failed", description: e instanceof error ? e.message : String(e) });
    } finally { setPosting(false); }
  };

  if (Loading) return <Layout><Card className="p-8 text-center max-w-3xl mx-auto">Loading…</Card></Layout>;
  if (!question) return <Layout><Card className="p-8 text-center max-w-3xl mx-auto">Question not found.</Card></Layout>;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-4">
        <Link to="/Aid/Q-and-A" className="inline-flex items-center text-sm text-muted-foreground hover:underline">
          <ChevronLeft className="h-4 w-4" /> Back to all questions
        </Link>

        <Card className="p-5">
          <div className="flex gap-4 items-start">
            <button
              onClick={() => handleVote("question", question.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md border text-xs shrink-0 ${voted.has(`q:${question.id}`) ? "bg-primary/10 border-primary text-primary" : "hover:bg-muted"}`}
            >
              <ArrowUp className="h-4 w-4" />
              <span className="font-semibold">{question.upvotes}</span>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold">{question.title}</h1>
              <p className="text-sm mt-3 whitespace-pre-wrap">{question.body}</p>
              <p className="text-xs text-muted-foreground mt-3">
                Asked {new Date(question.Created_At).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <h2 className="text-base font-semibold mt-4">
          {answers.length} Answer{answers.length === 1 ? "" : "s"}
        </h2>

        {answers.map(a => (
          <Card key={a.id} className={`p-4 ${a.is_official ? "border-emerald-500/50" : ""}`}>
            <div className="flex gap-4 items-start">
              <button
                onClick={() => handleVote("answer", a.id)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md border text-xs shrink-0 ${voted.has(`a:${a.id}`) ? "bg-primary/10 border-primary text-primary" : "hover:bg-muted"}`}
              >
                <ArrowUp className="h-4 w-4" />
                <span className="font-semibold">{a.upvotes}</span>
              </button>
              <div className="flex-1 min-w-0">
                {a.is_official && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-2">
                    <ShieldCheck className="h-3 w-3" /> Official answer
                  </span>
                )}
                <p className="text-sm whitespace-pre-wrap">{a.body}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(a.Created_At).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        ))}

        {admin ? (
          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">Post an official answer</h3>
            <textarea
              className="w-full bg-transparent border rounded-md px-3 py-2 text-sm min-h-[120px]"
              placeholder="Your answer, citing Quran/Hadith where relevant…"
              value={body}
              On_Change={e => setBody(e.target.value)}
              maxLength={10000}
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={handleAnswer} disabled={posting}>
                {posting ? "Posting…" : "Post answer"}
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-4 text-sm text-muted-foreground text-center">
            Only admins can post answers. You can still upvote helpful answers.
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default QADetail;
