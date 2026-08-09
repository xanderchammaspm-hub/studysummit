import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Download,
  Image as ImageIcon,
  KeyRound,
  Loader2,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import { AccountShell, Panel } from "@/components/account/AccountShell";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { usePrefs, ACCENTS, type AccentKey } from "@/hooks/usePrefs";
import { useExamDates, CAMP_LABEL, CAMPS } from "@/hooks/useMountainProgress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

const GRADIENT_KEY = "study-hub-gradient-intensity-v1";
const MOTION_KEY = "summit-reduce-motion-v1";
const REMINDER_CHOICES = [14, 7, 3, 1];

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Summit" },
      { name: "description", content: "Tune the Summit aurora, motion, study goals, exam dates and account security." },
      { property: "og:title", content: "Settings — Summit" },
      { property: "og:description", content: "Tune the Summit aurora, motion, study goals, exam dates and account security." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, profile, avatarUrl, updateProfile, uploadAvatar } = useProfile();
  const { prefs, update: updatePrefs } = usePrefs();
  const { dates, update: updateDate, reset: resetDates } = useExamDates();
  const [intensity, setIntensity] = useState(60);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [busy, setBusy] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const g = Number(localStorage.getItem(GRADIENT_KEY));
    if (Number.isFinite(g) && g > 0) setIntensity(g);
    setReduceMotion(localStorage.getItem(MOTION_KEY) === "1");
  }, []);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
    setUsername(profile?.username ?? "");
  }, [profile?.display_name, profile?.username]);

  function applyIntensity(v: number) {
    setIntensity(v);
    localStorage.setItem(GRADIENT_KEY, String(v));
    document.documentElement.style.setProperty("--gradient-intensity", String(v / 100));
  }

  function applyMotion(on: boolean) {
    setReduceMotion(on);
    localStorage.setItem(MOTION_KEY, on ? "1" : "0");
    document.documentElement.classList.toggle("reduce-motion", on);
  }

  async function saveProfile() {
    setSavingProfile(true);
    try {
      await updateProfile({
        display_name: displayName.trim() || null,
        username: username.trim() || null,
      });
      toast.success("Profile updated");
    } catch (e) {
      toast.error((e as Error).message);
    }
    setSavingProfile(false);
  }

  async function onAvatar(file?: File) {
    if (!file) return;
    try {
      await uploadAvatar(file);
      toast.success("Profile picture updated");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function sendReset() {
    if (!user?.email) return;
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent to your email.");
  }

  function exportData() {
    const dump: Record<string, unknown> = {};
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("study-hub-") || key.startsWith("summit-") || key.startsWith("atlas-")) {
        try {
          dump[key] = JSON.parse(localStorage.getItem(key) ?? "null");
        } catch {
          dump[key] = localStorage.getItem(key);
        }
      }
    }
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `summit-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Backup downloaded");
  }

  async function importData(file?: File) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as Record<string, unknown>;
      for (const [k, v] of Object.entries(parsed)) {
        localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
      }
      toast.success("Backup restored — reloading");
      setTimeout(() => window.location.reload(), 700);
    } catch {
      toast.error("That file isn't a valid Summit backup.");
    }
  }

  async function clearLocal() {
    if (!confirm("Clear this device's local copy? Your account data stays safe.")) return;
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("study-hub-") || key.startsWith("summit-") || key.startsWith("atlas-")) {
        localStorage.removeItem(key);
      }
    }
    toast.success("This device's copy cleared — your account data stays safe.");
    setTimeout(() => window.location.reload(), 600);
  }

  function toggleReminder(day: number) {
    const set = new Set(prefs.reminderDays);
    if (set.has(day)) set.delete(day);
    else set.add(day);
    updatePrefs({ reminderDays: [...set].sort((a, b) => b - a) });
  }

  return (
    <AccountShell title="Settings" subtitle="Profile, study goals, exam dates, appearance and account security.">
      <Panel title="Profile">
        <div className="flex flex-wrap items-center gap-5">
          <div className="relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Your profile picture" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border/70 bg-surface/60 text-muted-foreground">
                <ImageIcon className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-[220px] space-y-3">
            <div>
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="summit-climber"
                className="mt-1"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={saveProfile} disabled={savingProfile} className="gap-2">
                {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />} Save profile
              </Button>
              <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
                <Upload className="h-4 w-4" /> Change picture
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => void onAvatar(e.target.files?.[0])}
              />
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Study goals">
        <div className="space-y-6">
          <div>
            <Label>Daily study goal</Label>
            <p className="mb-3 text-xs text-muted-foreground">Hours you aim to log each day.</p>
            <Slider
              value={[prefs.dailyGoalHours]}
              min={0.5}
              max={8}
              step={0.5}
              onValueChange={(v) => updatePrefs({ dailyGoalHours: v[0] ?? 2 })}
            />
            <div className="mt-2 text-xs text-muted-foreground">{prefs.dailyGoalHours} hours / day</div>
          </div>

          <div>
            <Label>Target ATAR</Label>
            <p className="mb-3 text-xs text-muted-foreground">Used on your daily plan and statistics.</p>
            <Slider
              value={[prefs.targetAtar]}
              min={50}
              max={99.95}
              step={0.05}
              onValueChange={(v) => updatePrefs({ targetAtar: Number((v[0] ?? 95).toFixed(2)) })}
            />
            <div className="mt-2 text-xs text-muted-foreground">{prefs.targetAtar}</div>
          </div>
        </div>
      </Panel>

      <Panel title="Exam dates">
        <p className="mb-4 text-xs text-muted-foreground">
          These drive your mountain climb. Change one and the progress bar moves with it.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {CAMPS.map((c) => (
            <div
              key={c.key}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-surface/40 px-4 py-3"
            >
              <div className="text-sm">
                <span className="mr-2">{c.emoji}</span>
                {CAMP_LABEL[c.key]}
              </div>
              <Input
                type="date"
                value={dates[c.key]}
                onChange={(e) => updateDate(c.key, e.target.value)}
                className="w-40"
              />
            </div>
          ))}
        </div>
        <Button variant="outline" onClick={resetDates} className="mt-4 gap-2">
          <RotateCcw className="h-4 w-4" /> Reset to defaults
        </Button>
      </Panel>

      <Panel title="Reminders">
        <p className="mb-3 text-xs text-muted-foreground">
          Highlight exams and assessments when they fall inside these windows.
        </p>
        <div className="flex flex-wrap gap-2">
          {REMINDER_CHOICES.map((d) => {
            const on = prefs.reminderDays.includes(d);
            return (
              <button
                key={d}
                onClick={() => toggleReminder(d)}
                className={`rounded-full border px-4 py-1.5 text-xs transition-all ${
                  on
                    ? "border-primary/70 bg-primary/25 text-foreground"
                    : "border-border/70 bg-surface/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {d} {d === 1 ? "day" : "days"} before
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel title="Appearance">
        <div className="space-y-6">
          <div>
            <Label>Accent</Label>
            <div className="mt-3 flex flex-wrap gap-2">
              {(Object.keys(ACCENTS) as AccentKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => updatePrefs({ accent: k })}
                  className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs transition-all ${
                    prefs.accent === k
                      ? "border-primary/70 bg-primary/20 text-foreground"
                      : "border-border/70 bg-surface/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ background: ACCENTS[k].swatch, boxShadow: `0 0 10px ${ACCENTS[k].swatch}` }}
                  />
                  {ACCENTS[k].label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/50 bg-surface/40 px-4 py-3">
            <div>
              <Label>Compact density</Label>
              <p className="text-xs text-muted-foreground">Tighter spacing so more fits on screen.</p>
            </div>
            <Switch
              checked={prefs.density === "compact"}
              onCheckedChange={(v) => updatePrefs({ density: v ? "compact" : "comfortable" })}
            />
          </div>

          <div>
            <Label>Aurora intensity</Label>
            <p className="mb-3 text-xs text-muted-foreground">
              How strong the purple gradient glow sits behind the app.
            </p>
            <Slider
              value={[intensity]}
              min={0}
              max={100}
              step={5}
              onValueChange={(v) => applyIntensity(v[0] ?? 60)}
            />
            <div className="mt-2 text-xs text-muted-foreground">{intensity}%</div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/50 bg-surface/40 px-4 py-3">
            <div>
              <Label>Reduce motion</Label>
              <p className="text-xs text-muted-foreground">Calms parallax, floating and pulse animations.</p>
            </div>
            <Switch checked={reduceMotion} onCheckedChange={applyMotion} />
          </div>
        </div>
      </Panel>

      <Panel title="Data">
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-surface/40 px-4 py-3">
            <div>
              <div className="font-medium">Export your study data</div>
              <p className="text-xs text-muted-foreground">Downloads subjects, notes, calendar and settings as JSON.</p>
            </div>
            <Button variant="outline" onClick={exportData} className="gap-2">
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-surface/40 px-4 py-3">
            <div>
              <div className="font-medium">Restore a backup</div>
              <p className="text-xs text-muted-foreground">Import a previously exported Summit JSON file.</p>
            </div>
            <Button variant="outline" onClick={() => importRef.current?.click()} className="gap-2">
              <Upload className="h-4 w-4" /> Import
            </Button>
            <input
              ref={importRef}
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => void importData(e.target.files?.[0])}
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-surface/40 px-4 py-3">
            <div>
              <div className="font-medium">Clear this device</div>
              <p className="text-xs text-muted-foreground">
                Wipes the local copy and re-pulls everything from your account.
              </p>
            </div>
            <Button variant="outline" onClick={clearLocal} className="gap-2 text-destructive">
              <Trash2 className="h-4 w-4" /> Clear
            </Button>
          </div>
        </div>
      </Panel>

      <Panel title="Account">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-surface/40 px-4 py-3 text-sm">
          <div>
            <div className="font-medium">Password</div>
            <p className="text-xs text-muted-foreground">Send a reset link to {user?.email}.</p>
          </div>
          <Button variant="outline" onClick={sendReset} disabled={busy} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Reset password
          </Button>
        </div>
      </Panel>
    </AccountShell>
  );
}
