import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  User as UserIcon,
  BarChart3,
  Settings as SettingsIcon,
  Trophy,
  LogOut,
  Cloud,
  CloudOff,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { getSyncStatus, subscribeSyncStatus } from "@/lib/cloudSync";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function useSyncState() {
  const [, tick] = useState(0);
  useEffect(() => subscribeSyncStatus(() => tick((n) => n + 1)), []);
  return getSyncStatus();
}

export function SaveIndicator() {
  const status = useSyncState();
  if (status === "offline") return null;
  return (
    <span
      className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-surface/50 px-2.5 py-1 text-[11px] text-muted-foreground"
      title="Your work saves to your account automatically"
    >
      {status === "saving" ? (
        <Loader2 className="h-3 w-3 animate-spin text-primary" />
      ) : (
        <Cloud className="h-3 w-3 text-primary" />
      )}
      {status === "saving" ? "Saving…" : "Saved"}
    </span>
  );
}

export function AccountMenu() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, profile, avatarUrl, progression } = useProfile();
  const closeRef = useRef<HTMLButtonElement>(null);

  if (!user) {
    return (
      <Link
        to="/auth"
        className="inline-flex items-center gap-2 rounded-full purple-outline bg-surface/60 px-4 py-1.5 text-sm transition-transform hover:scale-[1.03]"
      >
        <UserIcon className="h-4 w-4 text-primary" /> Sign in
      </Link>
    );
  }

  const name =
    profile?.username?.trim() ||
    profile?.display_name?.trim() ||
    user.email?.split("@")[0] ||
    "Climber";

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger ref={closeRef} asChild>
        <button className="flex items-center gap-2 rounded-full purple-outline bg-surface/60 py-1 pl-1 pr-3 transition-transform hover:scale-[1.03]">
          <Avatar url={avatarUrl} name={name} />
          <span className="hidden sm:flex flex-col items-start leading-none">
            <span className="text-sm font-medium">{name}</span>
            <span className="text-[10px] text-muted-foreground">
              Lv {progression.level} · {progression.rank.name}
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 border-border bg-card/95 backdrop-blur-xl">
        <DropdownMenuLabel className="space-y-2">
          <div className="flex items-center gap-2">
            <Avatar url={avatarUrl} name={name} />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{name}</div>
              <div className="truncate text-[11px] text-muted-foreground">{user.email}</div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>
                {progression.rank.emoji} {progression.rank.name}
              </span>
              <span>Lv {progression.level}</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-yellow transition-all duration-700"
                style={{ width: `${progression.pct}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>{profile?.xp ?? 0} XP</span>
              <span>🪙 {profile?.coins ?? 0}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile" className="gap-2">
            <UserIcon className="h-4 w-4" /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/statistics" className="gap-2">
            <BarChart3 className="h-4 w-4" /> Statistics
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings" className="gap-2">
            <SettingsIcon className="h-4 w-4" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/achievements" className="gap-2">
            <Trophy className="h-4 w-4" /> Achievements
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="gap-2 text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Avatar({ url, name, size = 32 }: { url: string | null; name: string; size?: number }) {
  return url ? (
    <img
      src={url}
      alt={`${name} profile picture`}
      width={size}
      height={size}
      className="rounded-full object-cover ring-1 ring-primary/60"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="grid place-items-center rounded-full bg-gradient-to-br from-primary/70 to-yellow/60 text-background font-semibold ring-1 ring-primary/60"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function OfflineHint() {
  const status = useSyncState();
  if (status !== "offline") return null;
  return (
    <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <CloudOff className="h-3 w-3" /> Saved on this device
    </span>
  );
}
