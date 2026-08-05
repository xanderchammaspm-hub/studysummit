import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { AccountShell, Panel } from "@/components/account/AccountShell";
import { Avatar } from "@/components/AccountMenu";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RANKS } from "@/lib/progression";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Summit" },
      { name: "description", content: "Your Summit climber profile: picture, username, level, rank and coins." },
      { property: "og:title", content: "Your profile — Summit" },
      { property: "og:description", content: "Your Summit climber profile: picture, username, level, rank and coins." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, avatarUrl, progression, updateProfile, uploadAvatar } = useProfile();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username ?? "");
    setDisplayName(profile.display_name ?? "");
  }, [profile]);

  const name = username.trim() || displayName.trim() || user?.email?.split("@")[0] || "Climber";

  async function save() {
    setBusy(true);
    try {
      await updateProfile({ username: username.trim() || null, display_name: displayName.trim() || null });
      toast.success("Profile updated");
    } catch {
      toast.error("Couldn't save your profile");
    } finally {
      setBusy(false);
    }
  }

  async function pick(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      await uploadAvatar(file);
      toast.success("Profile picture updated");
    } catch {
      toast.error("Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AccountShell title="Profile" subtitle="Your climber identity, rank and progression.">
      <Panel>
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          <button
            onClick={() => fileRef.current?.click()}
            className="group relative rounded-full"
            aria-label="Change profile picture"
          >
            <Avatar url={avatarUrl} name={name} size={84} />
            <span className="absolute inset-0 grid place-items-center rounded-full bg-background/70 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-5 w-5 text-primary" />
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          <div className="flex-1 text-center sm:text-left">
            <div className="text-xl font-semibold">{name}</div>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Chip>{progression.rank.emoji} {progression.rank.name}</Chip>
              <Chip>Level {progression.level}</Chip>
              <Chip>{profile?.xp ?? 0} XP</Chip>
              <Chip>🪙 {profile?.coins ?? 0}</Chip>
              <Chip>🔥 {profile?.streak_days ?? 0} day streak</Chip>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Level {progression.level}</span>
            <span>{progression.toNext} XP to level {progression.level + 1}</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-yellow transition-all duration-1000"
              style={{ width: `${progression.pct}%` }}
            />
          </div>
        </div>
      </Panel>

      <Panel title="Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="summit_climber"
              className="bg-surface/60"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="display">Display name</Label>
            <Input
              id="display"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="bg-surface/60"
            />
          </div>
        </div>
        <Button onClick={save} disabled={busy} className="mt-4 gap-2">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
        </Button>
      </Panel>

      <Panel title="Mountain ranks">
        <ol className="grid gap-2 sm:grid-cols-2">
          {RANKS.map((r) => {
            const reached = progression.level >= r.minLevel;
            return (
              <li
                key={r.name}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                  reached ? "border-primary/60 bg-primary/10" : "border-border/50 bg-surface/40 opacity-60"
                }`}
              >
                <span className="text-lg">{r.emoji}</span>
                <span className="flex-1">{r.name}</span>
                <span className="text-xs text-muted-foreground">Lv {r.minLevel}+</span>
              </li>
            );
          })}
        </ol>
      </Panel>
    </AccountShell>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border/60 bg-surface/60 px-3 py-1 text-xs text-muted-foreground">
      {children}
    </span>
  );
}
