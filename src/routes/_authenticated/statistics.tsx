import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, Flame, Target, TrendingUp, FileText, Trophy } from "lucide-react";
import { AccountShell, Panel } from "@/components/account/AccountShell";
import { useProfile } from "@/hooks/useProfile";
import { useSummitStats } from "@/hooks/useSummitStats";
import { supabase } from "@/integrations/supabase/client";
import { XP_LABELS } from "@/lib/progression";

export const Route = createFileRoute("/_authenticated/statistics")({
  head: () => ({
    meta: [
      { title: "Statistics — Summit" },
      { name: "description", content: "Study hours, topic mastery, past paper scores and XP history across your Summit climb." },
      { property: "og:title", content: "Statistics — Summit" },
      { property: "og:description", content: "Study hours, topic mastery, past paper scores and XP history across your Summit climb." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StatisticsPage,
});

function StatisticsPage() {
  const { user, profile, progression } = useProfile();
  const s = useSummitStats();

  const xp = useQuery({
    queryKey: ["xp-events", user?.id ?? null],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("xp_events")
        .select("id, kind, amount, created_at")
        .order("created_at", { ascending: false })
        .limit(12);
      return data ?? [];
    },
  });

  const maxWeek = Math.max(1, ...s.weeks.map((w) => w.hours));

  return (
    <AccountShell title="Statistics" subtitle="Where your hours went and how the climb is tracking.">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Metric icon={<Clock className="h-4 w-4" />} label="Study hours" value={s.totalHours.toFixed(1)} />
        <Metric icon={<Flame className="h-4 w-4" />} label="Day streak" value={profile?.streak_days ?? 0} />
        <Metric icon={<Target className="h-4 w-4" />} label="Topics green" value={`${s.green}/${s.topics}`} />
        <Metric icon={<FileText className="h-4 w-4" />} label="Papers done" value={s.papersDone} />
        <Metric icon={<TrendingUp className="h-4 w-4" />} label="Avg score" value={`${s.avgScore}%`} />
        <Metric icon={<Trophy className="h-4 w-4" />} label="Level" value={progression.level} />
      </div>

      <Panel title="Study hours — last 12 weeks">
        <div className="flex h-40 items-end gap-2">
          {s.weeks.map((w) => (
            <div key={w.label} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-primary/40 to-primary transition-all duration-700"
                style={{ height: `${Math.max(3, (w.hours / maxWeek) * 100)}%` }}
                title={`${w.hours.toFixed(1)}h`}
              />
              <span className="text-[9px] text-muted-foreground">{w.label}</span>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Topic mix">
          <div className="flex h-3 overflow-hidden rounded-full bg-surface">
            <Seg value={s.green} total={s.topics} className="bg-emerald-500" />
            <Seg value={s.amber} total={s.topics} className="bg-yellow" />
            <Seg value={s.red} total={s.topics} className="bg-red-500" />
          </div>
          <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
            <li>🟢 Green — {s.green}</li>
            <li>🟡 Yellow — {s.amber}</li>
            <li>🔴 Red — {s.red}</li>
          </ul>
        </Panel>

        <Panel title="Recent XP">
          {xp.data?.length ? (
            <ul className="space-y-2 text-sm">
              {xp.data.map((e) => (
                <li key={e.id} className="interactive-glass flex items-center justify-between rounded-lg px-3 py-2">
                  <span className="truncate">{XP_LABELS[e.kind] ?? e.kind}</span>
                  <span className="text-yellow">+{e.amount} XP</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Log study hours or finish a paper to start earning XP.</p>
          )}
        </Panel>
      </div>

      <Panel title="By subject">
        {s.perSubject.length ? (
          <ul className="space-y-2">
            {s.perSubject.map((p) => (
              <li key={p.label} className="flex items-center gap-3 text-sm">
                <span className="w-40 truncate">{p.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-yellow transition-all duration-700"
                    style={{ width: `${p.topics ? (p.green / p.topics) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-16 text-right text-xs text-muted-foreground">{p.hours.toFixed(1)}h</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Add subjects and topics to see the breakdown.</p>
        )}
      </Panel>
    </AccountShell>
  );
}

function Seg({ value, total, className }: { value: number; total: number; className: string }) {
  if (!total || !value) return null;
  return <div className={className} style={{ width: `${(value / total) * 100}%` }} />;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="glass-panel p-4">
      <div className="flex items-center gap-2 text-primary">{icon}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
