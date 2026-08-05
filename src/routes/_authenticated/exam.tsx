import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SummitLogo } from "@/components/SummitLogo";
import { ExamLibrary } from "@/components/exam/ExamLibrary";
import { PaperRunner } from "@/components/exam/PaperRunner";
import { MistakeVault } from "@/components/exam/MistakeVault";
import { ExamAnalytics } from "@/components/exam/ExamAnalytics";
import type { AnswerRow, Attempt, Paper } from "@/components/exam/types";
import { Button } from "@/components/ui/button";
import { BarChart3, BookOpen, Home, LogOut, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/exam")({
  component: ExamEnginePage,
});

type Tab = "library" | "vault" | "analytics";

function ExamEnginePage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("library");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Paper | null>(null);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id ?? null;
    setUserId(uid);
    if (!uid) return;
    const [p, a, ans] = await Promise.all([
      supabase.from("exam_papers").select("*").order("created_at", { ascending: false }),
      supabase.from("exam_attempts").select("*").order("started_at", { ascending: false }),
      supabase.from("attempt_answers").select("*").order("created_at", { ascending: false }),
    ]);
    setPapers((p.data ?? []) as unknown as Paper[]);
    setAttempts((a.data ?? []) as unknown as Attempt[]);
    setAnswers((ans.data ?? []) as unknown as AnswerRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const mistakes = answers.filter((a) => a.is_mistake && !a.resolved);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "library", label: "Papers", icon: <BookOpen className="h-4 w-4" /> },
    { id: "vault", label: "Mistake Vault", icon: <ShieldAlert className="h-4 w-4" />, badge: mistakes.length },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
  ];

  return (
    <main className="relative z-10 min-h-screen px-4 pb-24 pt-8 sm:px-8">
      <div className="aurora" aria-hidden />
      <div className="relative mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-primary/35 bg-card/60 p-1.5 backdrop-blur-md shadow-[0_0_24px_-6px_var(--primary)]">
              <ExamEngineLogo size={44} />
            </div>
            <div style={{ animation: "engineRise 700ms cubic-bezier(0.22,1,0.36,1) 120ms both" }}>
              <h1 className="text-xl font-semibold tracking-tight gradient-text">Summit Exam Engine</h1>
              <p className="text-xs text-muted-foreground">
                Interactive past papers · AI marking · mistake tracking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <Home className="h-4 w-4" /> Study hub
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </div>
        </header>

        {!active && (
          <nav className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card/50 p-1.5 backdrop-blur-md">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-all duration-300 ${
                  tab === t.id
                    ? "bg-primary/15 text-foreground shadow-[0_0_0_1px_var(--color-border)]"
                    : "text-muted-foreground hover:bg-surface/60 hover:text-foreground"
                }`}
              >
                {t.icon}
                {t.label}
                {t.badge ? (
                  <span className="rounded-full border border-yellow/40 bg-yellow/10 px-1.5 text-[10px] text-yellow">
                    {t.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
        )}

        {active && userId ? (
          <PaperRunner
            paper={active}
            userId={userId}
            onExit={() => {
              setActive(null);
              void load();
            }}
            onFinished={load}
          />
        ) : (
          <div className="fade-in-up">
            {tab === "library" && userId && (
              <ExamLibrary
                papers={papers}
                loading={loading}
                userId={userId}
                onStart={setActive}
                onRefresh={load}
              />
            )}
            {tab === "vault" && <MistakeVault mistakes={mistakes} onRefresh={load} />}
            {tab === "analytics" && <ExamAnalytics attempts={attempts} answers={answers} />}
          </div>
        )}
      </div>
    </main>
  );
}
