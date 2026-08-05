import { supabase } from "@/integrations/supabase/client";

/**
 * Real-time autosave: every local study store (subjects, topics, notes, study
 * logs, English Formula, exam dates, settings, Atlas chats) is mirrored into
 * the signed-in user's account and pulled back on any device.
 */

const PREFIXES = ["study-hub-", "summit-", "atlas-ai-chat", "atlas-section:"];

export function isSyncedKey(key: string) {
  return PREFIXES.some((p) => key.startsWith(p));
}

type Status = "idle" | "saving" | "saved" | "offline";

let status: Status = "offline";
const listeners = new Set<() => void>();

function setStatus(next: Status) {
  if (status === next) return;
  status = next;
  listeners.forEach((l) => l());
}

export function getSyncStatus() {
  return status;
}

export function subscribeSyncStatus(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

let currentUserId: string | null = null;
let patched = false;
let started = false;
const pending = new Map<string, string | null>();
let flushTimer: ReturnType<typeof setTimeout> | undefined;

function collectLocal() {
  const out: { key: string; value: string }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !isSyncedKey(key)) continue;
    const value = localStorage.getItem(key);
    if (value != null) out.push({ key, value });
  }
  return out;
}

function queue(key: string, value: string | null) {
  if (!currentUserId || !isSyncedKey(key)) return;
  pending.set(key, value);
  setStatus("saving");
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, 700);
}

async function flush() {
  if (!currentUserId || pending.size === 0) return;
  const uid = currentUserId;
  const rows = [...pending.entries()];
  pending.clear();
  try {
    const upserts = rows
      .filter(([, v]) => v !== null)
      .map(([key, v]) => ({ user_id: uid, key, value: { d: v } }));
    const deletes = rows.filter(([, v]) => v === null).map(([key]) => key);
    if (upserts.length) {
      await supabase.from("user_state").upsert(upserts, { onConflict: "user_id,key" });
    }
    if (deletes.length) {
      await supabase.from("user_state").delete().eq("user_id", uid).in("key", deletes);
    }
    setStatus("saved");
  } catch {
    setStatus("offline");
  }
}

function patchStorage() {
  if (patched) return;
  patched = true;
  const setItem = localStorage.setItem.bind(localStorage);
  const removeItem = localStorage.removeItem.bind(localStorage);
  localStorage.setItem = (key: string, value: string) => {
    setItem(key, value);
    queue(key, value);
  };
  localStorage.removeItem = (key: string) => {
    removeItem(key);
    queue(key, null);
  };
}

/** Pull the account copy down; on a brand new account push the browser copy up. */
async function hydrate(uid: string) {
  const { data, error } = await supabase
    .from("user_state")
    .select("key,value")
    .eq("user_id", uid);
  if (error) {
    setStatus("offline");
    return;
  }

  const rows = data ?? [];
  if (rows.length === 0) {
    const local = collectLocal();
    if (local.length) {
      await supabase.from("user_state").upsert(
        local.map((r) => ({ user_id: uid, key: r.key, value: { d: r.value } })),
        { onConflict: "user_id,key" },
      );
    }
    setStatus("saved");
    return;
  }

  let changed = false;
  for (const row of rows) {
    const value = (row.value as { d?: string } | null)?.d;
    if (typeof value !== "string") continue;
    if (localStorage.getItem(row.key) !== value) {
      localStorage.setItem(row.key, value);
      changed = true;
    }
  }
  setStatus("saved");

  // Module-level caches were already read; refresh once so the account copy shows.
  if (changed && !sessionStorage.getItem("summit-hydrated")) {
    sessionStorage.setItem("summit-hydrated", "1");
    window.location.reload();
  }
}

let channel: ReturnType<typeof supabase.channel> | null = null;

function watchRealtime(uid: string) {
  channel?.unsubscribe();
  channel = supabase
    .channel(`user_state:${uid}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "user_state", filter: `user_id=eq.${uid}` },
      (payload) => {
        const row = payload.new as { key?: string; value?: { d?: string } } | null;
        if (!row?.key || typeof row.value?.d !== "string") return;
        if (pending.has(row.key)) return;
        if (localStorage.getItem(row.key) === row.value.d) return;
        localStorage.setItem(row.key, row.value.d);
      },
    )
    .subscribe();
}

export function initCloudSync() {
  if (started || typeof window === "undefined") return;
  started = true;
  patchStorage();

  const apply = (uid: string | null) => {
    if (uid === currentUserId) return;
    currentUserId = uid;
    if (!uid) {
      setStatus("offline");
      channel?.unsubscribe();
      channel = null;
      sessionStorage.removeItem("summit-hydrated");
      return;
    }
    void hydrate(uid).then(() => watchRealtime(uid));
  };

  void supabase.auth.getSession().then(({ data }) => apply(data.session?.user.id ?? null));
  supabase.auth.onAuthStateChange((_e, session) => apply(session?.user.id ?? null));

  window.addEventListener("beforeunload", () => {
    void flush();
  });
}
