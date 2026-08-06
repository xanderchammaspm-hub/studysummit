import { useCallback, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { XP_RULES, type XpSource, progressionFromXp } from "@/lib/progression";

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  xp: number;
  coins: number;
  streak_days: number;
  last_active_date: string | null;
  cosmetics: Record<string, unknown>;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Guards the once-per-day streak award across every mounted useProfile(). */
const streakClaimed = new Set<string>();

export function useProfile() {
  const { user, loading: authLoading } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return (data as Profile | null) ?? null;
    },
  });

  const profile = query.data ?? null;

  const avatarQuery = useQuery({
    queryKey: ["avatar", profile?.avatar_url],
    enabled: !!profile?.avatar_url,
    queryFn: async () => {
      const path = profile!.avatar_url!;
      if (path.startsWith("http")) return path;
      const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60);
      return data?.signedUrl ?? null;
    },
  });

  const update = useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
      if (!userId) throw new Error("Not signed in");
      const { error } = await supabase.from("profiles").update(patch as never).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile", userId] }),
  });

  const awardXp = useCallback(
    async (source: XpSource, multiplier = 1, meta: Record<string, unknown> = {}) => {
      if (!userId) return;
      const amount = Math.round(XP_RULES[source] * multiplier);
      if (amount <= 0) return;
      await supabase.from("xp_events").insert({ user_id: userId, kind: source, amount, meta: meta as never });
      await qc.invalidateQueries({ queryKey: ["profile", userId] });
    },
    [userId, qc],
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!userId) throw new Error("Not signed in");
      const ext = file.name.split(".").pop() || "png";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      await supabase.from("profiles").update({ avatar_url: path }).eq("id", userId);
      await qc.invalidateQueries({ queryKey: ["profile", userId] });
    },
    [userId, qc],
  );

  // Daily streak — counted once per calendar day on first visit.
  useEffect(() => {
    if (!userId || !profile) return;
    const day = today();
    if (profile.last_active_date === day) return;
    // The profile query refetches asynchronously and this hook is mounted by
    // several components, so use a module-level guard to award the streak once.
    const guardKey = `${userId}:${day}`;
    if (streakClaimed.has(guardKey)) return;
    streakClaimed.add(guardKey);

    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const streak = profile.last_active_date === yesterday ? profile.streak_days + 1 : 1;
    void (async () => {
      // Claim the day atomically: only the write that actually flips
      // last_active_date returns a row, and only that one awards XP.
      const { data: claimed } = await supabase
        .from("profiles")
        .update({ last_active_date: day, streak_days: streak })
        .eq("id", userId)
        .neq("last_active_date", day)
        .select("id");
      if (!claimed?.length) return;
      await supabase
        .from("xp_events")
        .insert({ user_id: userId, kind: "dailyStreak", amount: XP_RULES.dailyStreak, meta: { streak } });
      await qc.invalidateQueries({ queryKey: ["profile", userId] });
    })();

  }, [userId, profile, qc]);

  const progression = useMemo(() => progressionFromXp(profile?.xp ?? 0), [profile?.xp]);

  return {
    user,
    profile,
    avatarUrl: avatarQuery.data ?? null,
    loading: authLoading || query.isLoading,
    progression,
    updateProfile: update.mutateAsync,
    awardXp,
    uploadAvatar,
  };
}

export function useAchievements() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: ["achievements", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_achievements")
        .select("achievement_id, unlocked_at")
        .eq("user_id", userId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  const unlock = useCallback(
    async (achievementId: string) => {
      if (!userId) return;
      await supabase
        .from("user_achievements")
        .upsert({ user_id: userId, achievement_id: achievementId }, { onConflict: "user_id,achievement_id" });
      await qc.invalidateQueries({ queryKey: ["achievements", userId] });
    },
    [userId, qc],
  );

  return { unlocked: query.data ?? [], unlock, loading: query.isLoading };
}
