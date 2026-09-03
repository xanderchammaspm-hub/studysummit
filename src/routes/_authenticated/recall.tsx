import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BarChart3, Brain, Home, Loader2, Library } from "lucide-react";
import { useRecallStore } from "@/hooks/useRecallStore";
import { SubjectLibrary, FolderList } from "@/components/recall/SubjectLibrary";
import { FolderWorkspace } from "@/components/recall/FolderWorkspace";
import { RecallAnalytics } from "@/components/recall/RecallAnalytics";
import { QuickRecallRunner } from "@/components/recall/QuickRecallRunner";
import { BlurtRunner } from "@/components/recall/BlurtRunner";
import { AddMaterialDialog } from "@/components/recall/AddMaterialDialog";
import { RecallMascot } from "@/components/recall/RecallMascot";
import { SessionDetail } from "@/components/recall/SessionDetail";
import type { BlurtPayload, QuickRecallPayload, RecallSession } from "@/components/recall/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/recall")({
  head: () => ({
    meta: [
      { title: "Quick Recall — Summit" },
      {
        name: "description",
        content:
          "AI-powered active recall for HSC study: upload notes, answer generated questions, blurt from memory and track mastery per subject.",
      },
      { property: "og:title", content: "Quick Recall — Summit" },
      {
        property: "og:description",
        content: "Upload notes, answer AI recall questions, blurt from memory and track mastery per subject.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RecallPage,
});

type Tab = "library" | "analytics";
type Runner = "quick_recall" | "blurt" | null;

function RecallPage() {
  const store = useRecallStore();
  const [tab, setTab] = useState<Tab>("library");
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [runner, setRunner] = useState<Runner>(null);
  const [adding, setAdding] = useState(false);
  const [openSession, setOpenSession] = useState<RecallSession | null>(null);

  const subject = useMemo(
    () => store.subjects.find((s) => s.id === subjectId) ?? null,
    [store.subjects, subjectId],
  );
  const folder = useMemo(() => store.folders.find((f) => f.id === folderId) ?? null, [store.folders, folderId]);
  const folderMaterials = useMemo(
    () => (folder ? store.materials.filter((m) => m.folder_id === folder.id) : []),
    [store.materials, folder],
  );
  const folderSessions = useMemo(
    () => (folder ? store.sessions.filter((s) => s.folder_id === folder.id) : []),
    [store.sessions, folder],
  );

  const openFolder = (sid: string, fid: string) => {
    setSubjectId(sid);
    setFolderId(fid);
    setRunner(null);
    setTab("library");
  };

  async function finishSession(score: number, payload: QuickRecallPayload | BlurtPayload) {
    if (!subject || !folder) return;
    await store.saveSession({
      subjectId: subject.id,
      folderId: folder.id,
      mode: payload.kind,
      score,
      payload,
    });
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "library", label: "Library", icon: <Library className="h-4 w-4" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
  ];

  return (
    <main className="relative z-10 min-h-screen px-4 pb-24 pt-8 sm:px-8">
      <div className="aurora" aria-hidden />
      <div className="relative mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-primary/35 bg-card/60 p-1.5 backdrop-blur-md shadow-[0_0_24px_-6px_var(--primary)]">
              <RecallMascot mood="idle" size={44} />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight gradient-text">Quick Recall</h1>
              <p className="text-xs text-muted-foreground">
                Active recall · blurting · AI feedback on everything you write
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full purple-outline bg-surface/60 px-4 py-1.5 text-sm transition-transform hover:scale-[1.03]"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
          </div>
        </header>

        {!runner ? (
          <nav className="flex w-fit items-center gap-1 rounded-full purple-outline bg-surface/60 p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-1.5 text-sm transition-all duration-300",
                  tab === t.id
                    ? "border border-primary/60 bg-primary/25 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </nav>
        ) : null}

        {store.loading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your recall library…
          </div>
        ) : runner === "quick_recall" && subject && folder ? (
          <QuickRecallRunner
            folderId={folder.id}
            subjectName={subject.name}
            folderName={folder.name}
            materials={folderMaterials}
            onExit={() => setRunner(null)}
            onComplete={finishSession}
          />
        ) : runner === "blurt" && subject && folder ? (
          <BlurtRunner
            folderId={folder.id}
            subjectName={subject.name}
            folderName={folder.name}
            materials={folderMaterials}
            previous={store.lastBlurt(folder.id)}
            onExit={() => setRunner(null)}
            onComplete={finishSession}
          />
        ) : tab === "analytics" ? (
          <RecallAnalytics
            subjects={store.subjects}
            sessions={store.sessions}
            overall={store.overallStats()}
            statsFor={store.subjectStats}
            onOpenSubject={(sid) => {
              setSubjectId(sid);
              setFolderId(null);
              setTab("library");
            }}
            onOpenFolder={openFolder}
          />
        ) : subject && folder ? (
          <FolderWorkspace
            subject={subject}
            folder={folder}
            materials={folderMaterials}
            sessions={folderSessions}
            stats={store.folderStats(folder.id)}
            onBack={() => setFolderId(null)}
            onAddMaterial={() => setAdding(true)}
            onDeleteMaterial={(id) => void store.deleteMaterial(id)}
            onStartQuickRecall={() => setRunner("quick_recall")}
            onStartBlurt={() => setRunner("blurt")}
            onDeleteSession={(id) => void store.deleteSession(id)}
            onOpenSession={(s) => setOpenSession(s)}
          />
        ) : subject ? (
          <FolderList
            subject={subject}
            folders={store.folders.filter((f) => f.subject_id === subject.id)}
            statsFor={store.folderStats}
            onBack={() => setSubjectId(null)}
            onOpen={(id) => setFolderId(id)}
            onCreate={(name) => void store.createFolder(subject.id, name)}
            onRename={(id, name) => void store.renameFolder(id, name)}
            onDelete={(id) => {
              void store.deleteFolder(id);
              if (folderId === id) setFolderId(null);
            }}
          />
        ) : (
          <SubjectLibrary
            subjects={store.subjects}
            statsFor={store.subjectStats}
            onOpen={(id) => {
              setSubjectId(id);
              setFolderId(null);
            }}
            onCreate={(name, emoji, color) => void store.createSubject(name, emoji, color)}
            onUpdate={(id, patch) => void store.updateSubject(id, patch)}
            onDelete={(id) => {
              void store.deleteSubject(id);
              if (subjectId === id) setSubjectId(null);
            }}
          />
        )}
      </div>

      {openSession ? <SessionDetail session={openSession} onClose={() => setOpenSession(null)} /> : null}

      {adding && folder ? (
        <AddMaterialDialog
          folderName={folder.name}
          onClose={() => setAdding(false)}
          onSave={async (name, kind, content) => {
            await store.addMaterial(folder.id, name, kind, content);
            setAdding(false);
          }}
        />
      ) : null}

      {!runner ? (
        <div className="pointer-events-none fixed bottom-6 right-6 hidden opacity-70 lg:block">
          <Brain className="h-5 w-5 text-primary/50" />
        </div>
      ) : null}
    </main>
  );
}
