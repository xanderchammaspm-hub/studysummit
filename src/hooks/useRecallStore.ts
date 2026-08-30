import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import type {
  BlurtPayload,
  QuickRecallPayload,
  RecallFolder,
  RecallMaterial,
  RecallSession,
  RecallSubject,
} from "@/components/recall/types";

export type RecentActivity = {
  id: string;
  folderId: string | null;
  mode: string;
  score: number;
  folderName: string;
  created_at: string;
};

export type FolderStats = {
  attempts: number;
  mastery: number | null;
  recallAvg: number | null;
  blurtAvg: number | null;
  materials: number;
  needsReview: string[];
  lastSessionAt: string | null;
};

export type SubjectStats = {
  attempts: number;
  mastery: number | null;
  recallAvg: number | null;
  blurtAvg: number | null;
  folders: number;
  materials: number;
  needsReview: string[];
  recent: RecentActivity[];
};

export type OverallStats = {
  sessions: number;
  avgScore: number | null;
  materials: number;
  subjects: number;
  folders: number;
  needsReview: string[];
  delta: number | null; // avg of last 5 sessions minus the 5 before that
};


/* ------------------------- Type-safe row mappers ------------------------- */

function mapSubject(row: Tables<"recall_subjects">): RecallSubject {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    emoji: row.emoji,
    color: row.color,
    created_at: row.created_at,
  };
}

function mapFolder(row: Tables<"recall_folders">): RecallFolder {
  return {
    id: row.id,
    user_id: row.user_id,
    subject_id: row.subject_id,
    name: row.name,
    created_at: row.created_at,
  };
}

function mapMaterial(row: Tables<"recall_materials">): RecallMaterial {
  return {
    id: row.id,
    user_id: row.user_id,
    folder_id: row.folder_id,
    name: row.name,
    kind: row.kind,
    content: row.content,
    created_at: row.created_at,
  };
}

function mapSession(row: Tables<"recall_sessions">): RecallSession {
  return {
    id: row.id,
    user_id: row.user_id,
    subject_id: row.subject_id,
    folder_id: row.folder_id,
    mode: row.mode,
    score: row.score,
    payload: (row.payload ?? {}) as RecallSession["payload"],
    created_at: row.created_at,
  };
}

function quickMissing(p: QuickRecallPayload): string[] {
  const out: string[] = [];
  for (const g of p.grades ?? []) out.push(...g.couldAdd, ...g.checkThis);
  if (p.summary) out.push(...p.summary.review, ...p.summary.missed);
  return out;
}

function blurtMissing(p: BlurtPayload): string[] {
  return [...(p.analysis?.missing ?? []), ...(p.analysis?.incorrect ?? [])];
}

function sessionMissing(s: RecallSession): string[] {
  if (!s.payload) return [];
  if (s.payload.kind === "quick_recall") return quickMissing(s.payload as QuickRecallPayload);
  if (s.payload.kind === "blurt") return blurtMissing(s.payload as BlurtPayload);
  return [];
}

function topMissing(list: RecallSession[], max = 5): string[] {
  const counts = new Map<string, number>();
  for (const s of list.slice(0, 30)) {
    for (const concept of sessionMissing(s)) {
      const key = concept.trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([k]) => k);
}

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export function useRecallStore() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [subjects, setSubjects] = useState<RecallSubject[]>([]);
  const [folders, setFolders] = useState<RecallFolder[]>([]);
  const [materials, setMaterials] = useState<RecallMaterial[]>([]);
  const [sessions, setSessions] = useState<RecallSession[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const [s, f, m, se] = await Promise.all([
      supabase.from("recall_subjects").select("*").order("created_at", { ascending: true }),
      supabase.from("recall_folders").select("*").order("created_at", { ascending: true }),
      supabase.from("recall_materials").select("*").order("created_at", { ascending: true }),
      supabase.from("recall_sessions").select("*").order("created_at", { ascending: false }),
    ]);
    setSubjects((s.data ?? []).map(mapSubject));
    setFolders((f.data ?? []).map(mapFolder));
    setMaterials((m.data ?? []).map(mapMaterial));
    setSessions((se.data ?? []).map(mapSession));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  /* ------------------------------- Subjects ------------------------------ */

  const createSubject = useCallback(
    async (name: string, emoji: string, color?: string | null): Promise<RecallSubject | null> => {
      if (!userId || !name.trim()) return null;
      const { data, error } = await supabase
        .from("recall_subjects")
        .insert({ user_id: userId, name: name.trim(), emoji, color: color ?? null })
        .select("*")
        .single();
      if (error || !data) return null;
      const row = mapSubject(data);
      setSubjects((prev) => [...prev, row]);
      return row;
    },
    [userId],
  );

  const updateSubject = useCallback(
    async (id: string, patch: { name?: string; emoji?: string; color?: string | null }) => {
      const update: TablesUpdate<"recall_subjects"> = {};
      if (patch.name != null && patch.name.trim()) update.name = patch.name.trim();
      if (patch.emoji) update.emoji = patch.emoji;
      if (patch.color !== undefined) update.color = patch.color;
      if (!Object.keys(update).length) return;
      setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...update } : s)));
      await supabase.from("recall_subjects").update(update).eq("id", id);
    },
    [],
  );

  const renameSubject = useCallback(
    async (id: string, name: string, emoji?: string) => {
      await updateSubject(id, { name, ...(emoji ? { emoji } : {}) });
    },
    [updateSubject],
  );


  const deleteSubject = useCallback(async (id: string) => {
    const folderIds = folders.filter((f) => f.subject_id === id).map((f) => f.id);
    const materialIds = materials.filter((m) => folderIds.includes(m.folder_id)).map((m) => m.id);
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    setFolders((prev) => prev.filter((f) => f.subject_id !== id));
    setMaterials((prev) => prev.filter((m) => !folderIds.includes(m.folder_id)));
    setSessions((prev) => prev.filter((s) => s.subject_id !== id));
    if (materialIds.length) await supabase.from("recall_materials").delete().in("id", materialIds);
    if (folderIds.length) await supabase.from("recall_sessions").delete().eq("subject_id", id);
    if (folderIds.length) await supabase.from("recall_folders").delete().in("id", folderIds);
    await supabase.from("recall_subjects").delete().eq("id", id);
  }, [folders, materials]);

  /* ------------------------------- Folders ------------------------------- */

  const createFolder = useCallback(
    async (subjectId: string, name: string): Promise<RecallFolder | null> => {
      if (!userId || !name.trim()) return null;
      const { data, error } = await supabase
        .from("recall_folders")
        .insert({ user_id: userId, subject_id: subjectId, name: name.trim() })
        .select("*")
        .single();
      if (error || !data) return null;
      const row = mapFolder(data);
      setFolders((prev) => [...prev, row]);
      return row;
    },
    [userId],
  );

  const renameFolder = useCallback(async (id: string, name: string) => {
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name: name.trim() } : f)));
    await supabase.from("recall_folders").update({ name: name.trim() }).eq("id", id);
  }, []);

  const deleteFolder = useCallback(async (id: string) => {
    const materialIds = materials.filter((m) => m.folder_id === id).map((m) => m.id);
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setMaterials((prev) => prev.filter((m) => m.folder_id !== id));
    setSessions((prev) => prev.filter((s) => s.folder_id !== id));
    if (materialIds.length) await supabase.from("recall_materials").delete().in("id", materialIds);
    await supabase.from("recall_sessions").delete().eq("folder_id", id);
    await supabase.from("recall_folders").delete().eq("id", id);
  }, [materials]);

  /* ------------------------------ Materials ------------------------------ */

  const addMaterial = useCallback(
    async (folderId: string, name: string, kind: string, content: string): Promise<RecallMaterial | null> => {
      if (!userId || !name.trim()) return null;
      const { data, error } = await supabase
        .from("recall_materials")
        .insert({ user_id: userId, folder_id: folderId, name: name.trim(), kind, content })
        .select("*")
        .single();
      if (error || !data) return null;
      const row = mapMaterial(data);
      setMaterials((prev) => [...prev, row]);
      return row;
    },
    [userId],
  );

  const renameMaterial = useCallback(async (id: string, name: string) => {
    setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, name: name.trim() } : m)));
    await supabase.from("recall_materials").update({ name: name.trim() }).eq("id", id);
  }, []);

  const moveMaterial = useCallback(async (id: string, folderId: string) => {
    setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, folder_id: folderId } : m)));
    await supabase.from("recall_materials").update({ folder_id: folderId }).eq("id", id);
  }, []);

  const deleteMaterial = useCallback(async (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    await supabase.from("recall_materials").delete().eq("id", id);
  }, []);

  /* ------------------------------- Sessions ------------------------------ */

  const saveSession = useCallback(
    async (input: {
      subjectId: string;
      folderId: string;
      mode: string;
      score: number;
      payload: QuickRecallPayload | BlurtPayload;
    }) => {
      if (!userId) return;
      const { data } = await supabase
        .from("recall_sessions")
        .insert({
          user_id: userId,
          subject_id: input.subjectId,
          folder_id: input.folderId,
          mode: input.mode,
          score: Math.round(input.score),
          payload: input.payload as unknown as Tables<"recall_sessions">["payload"],
        })
        .select("*")
        .single();
      if (data) setSessions((prev) => [mapSession(data), ...prev]);
    },
    [userId],
  );

  const deleteSession = useCallback(async (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    await supabase.from("recall_sessions").delete().eq("id", id);
  }, []);

  /* ------------------------------- Analytics ----------------------------- */

  const folderStats = useCallback(
    (folderId: string): FolderStats => {
      const fs = sessions.filter((s) => s.folder_id === folderId);
      const recall = fs.filter((s) => s.mode === "quick_recall").map((s) => s.score);
      const blurt = fs.filter((s) => s.mode === "blurt").map((s) => s.score);
      return {
        attempts: fs.length,
        mastery: avg(fs.map((s) => s.score)),
        recallAvg: avg(recall),
        blurtAvg: avg(blurt),
        materials: materials.filter((m) => m.folder_id === folderId).length,
        needsReview: topMissing(fs),
        lastSessionAt: fs[0]?.created_at ?? null,
      };
    },
    [sessions, materials],
  );

  const subjectStats = useCallback(
    (subjectId: string): SubjectStats => {
      const subjectFolders = folders.filter((f) => f.subject_id === subjectId);
      const folderIds = subjectFolders.map((f) => f.id);
      const ss = sessions.filter((s) => s.subject_id === subjectId || folderIds.includes(s.folder_id ?? ""));
      const recall = ss.filter((s) => s.mode === "quick_recall").map((s) => s.score);
      const blurt = ss.filter((s) => s.mode === "blurt").map((s) => s.score);
      return {
        attempts: ss.length,
        mastery: avg(ss.map((s) => s.score)),
        recallAvg: avg(recall),
        blurtAvg: avg(blurt),
        folders: subjectFolders.length,
        materials: materials.filter((m) => folderIds.includes(m.folder_id)).length,
        needsReview: topMissing(ss),
        recent: ss.slice(0, 3).map((s) => ({
          id: s.id,
          folderId: s.folder_id,
          mode: s.mode,
          score: s.score,
          folderName: subjectFolders.find((f) => f.id === s.folder_id)?.name ?? "—",
          created_at: s.created_at,
        })),
      };
    },
    [sessions, folders, materials],
  );

  const overallStats = useCallback((): OverallStats => {
    const scores = sessions.map((s) => s.score);
    let delta: number | null = null;
    if (sessions.length >= 4) {
      const recent = avg(scores.slice(0, Math.min(5, scores.length)));
      const older = avg(scores.slice(Math.min(5, scores.length), Math.min(10, scores.length)));
      if (recent != null && older != null) delta = recent - older;
    }
    return {
      sessions: sessions.length,
      avgScore: avg(scores),
      materials: materials.length,
      subjects: subjects.length,
      folders: folders.length,
      needsReview: topMissing(sessions, 6),
      delta,
    };
  }, [sessions, materials, subjects, folders]);

  const lastBlurt = useCallback(
    (folderId: string): BlurtPayload | null => {
      const s = sessions.find((x) => x.folder_id === folderId && x.mode === "blurt");
      if (!s || s.payload?.kind !== "blurt") return null;
      return s.payload as BlurtPayload;
    },
    [sessions],
  );

  return {
    loading,
    userId,
    subjects,
    folders,
    materials,
    sessions,
    reload: load,
    createSubject,
    renameSubject,
    deleteSubject,
    createFolder,
    renameFolder,
    deleteFolder,
    addMaterial,
    renameMaterial,
    moveMaterial,
    deleteMaterial,
    saveSession,
    deleteSession,
    folderStats,
    subjectStats,
    overallStats,
    lastBlurt,
  };
}

export type RecallStore = ReturnType<typeof useRecallStore>;
