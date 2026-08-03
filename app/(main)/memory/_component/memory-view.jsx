"use client";

import { useState, useCallback, useMemo } from "react";
import {
  FolderGit2,
  Wrench,
  Trophy,
  Award,
  Settings2,
  FileText,
  AlertCircle,
  StickyNote,
  Plus,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  Loader2,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Reveal } from "@/components/site/reveal";
import useFetch from "@/hooks/use-fetch";
import {
  listStructuredMemories,
  countStructuredMemories,
  archiveStructuredMemory,
  unarchiveStructuredMemory,
  deleteStructuredMemory,
  snapshotResumeVersion,
} from "@/actions/memory-engine";
import MemoryFormDialog from "./memory-form-dialog";
import RetrievalPreview from "./retrieval-preview";

const CATEGORIES = [
  { key: "project", label: "Projects", icon: FolderGit2 },
  { key: "skill", label: "Skills", icon: Wrench },
  { key: "achievement", label: "Achievements", icon: Trophy },
  { key: "certificate", label: "Certificates", icon: Award },
  { key: "preference", label: "Preferences", icon: Settings2 },
  { key: "resume_version", label: "Resume Versions", icon: FileText },
  { key: "lesson", label: "Lessons", icon: AlertCircle },
  { key: "note", label: "Notes", icon: StickyNote },
];

export default function MemoryView({ initialMemories = [], initialCounts }) {
  const [memories, setMemories] = useState(initialMemories);
  const [counts, setCounts] = useState(initialCounts?.byCategory ?? {});
  const [active, setActive] = useState("project");
  const [showArchived, setShowArchived] = useState(false);

  const { fn: archiveFn, loading: archiving } = useFetch(archiveStructuredMemory);
  const { fn: unarchiveFn, loading: unarchiving } = useFetch(unarchiveStructuredMemory);
  const { fn: deleteFn, loading: deleting } = useFetch(deleteStructuredMemory);
  const { fn: snapshotFn, loading: snapshotting } = useFetch(snapshotResumeVersion);

  const refreshAll = useCallback(async () => {
    try {
      const [next, nextCounts] = await Promise.all([
        listStructuredMemories({ includeArchived: showArchived }),
        countStructuredMemories(),
      ]);
      setMemories(next ?? []);
      setCounts(nextCounts?.byCategory ?? {});
    } catch {
      // useFetch already toasted for action calls; bare refresh swallows.
    }
  }, [showArchived]);

  const byCategory = useMemo(() => {
    const map = {};
    for (const m of memories) (map[m.category] ??= []).push(m);
    return map;
  }, [memories]);

  const onArchive = async (m) => {
    const ok = await archiveFn(m.id);
    if (ok) {
      toast.success("Archived — excluded from retrieval.");
      refreshAll();
    }
  };
  const onUnarchive = async (m) => {
    const ok = await unarchiveFn(m.id);
    if (ok) {
      toast.success("Restored.");
      refreshAll();
    }
  };
  const onDelete = async (m) => {
    if (!confirm("Delete this memory permanently?")) return;
    const ok = await deleteFn(m.id);
    if (ok) {
      toast.success("Deleted.");
      refreshAll();
    }
  };
  const onSnapshot = async () => {
    const ok = await snapshotFn();
    if (ok) {
      toast.success("Resume snapshot saved.");
      refreshAll();
    }
  };

  return (
    <div className="space-y-6">
      <RetrievalPreview />

      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Your structured memories</h2>
            <p className="text-sm text-muted-foreground">
              {initialCounts?.total ?? memories.length} memor{(initialCounts?.total ?? memories.length) === 1 ? "y" : "ies"} ·
              the copilot retrieves the relevant ones for each message.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="accent-primary"
            />
            Show archived
          </label>
        </div>
      </Reveal>

      <Tabs value={active} onValueChange={setActive}>
        <TabsList className="flex h-auto w-full flex-wrap gap-1 bg-transparent p-0">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const n = counts[c.key] ?? byCategory[c.key]?.filter((m) => !m.isArchived).length ?? 0;
            return (
              <TabsTrigger
                key={c.key}
                value={c.key}
                className="flex items-center gap-1.5 data-[selected]:bg-primary/10"
              >
                <Icon className="h-4 w-4" />
                {c.label}
                <span className="tnum text-xs text-muted-foreground">{n}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {CATEGORIES.map((c) => (
          <TabsContent key={c.key} value={c.key} className="mt-4 space-y-3">
            <div className="flex items-center justify-end">
              {c.key === "resume_version" ? (
                <Button onClick={onSnapshot} variant="outline" size="sm" disabled={snapshotting}>
                  {snapshotting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  Snapshot current resume
                </Button>
              ) : (
                <MemoryFormDialog
                  category={c.key}
                  trigger={
                    <Button size="sm">
                      <Plus className="h-4 w-4" /> Add {c.label.replace(/s$/, "")}
                    </Button>
                  }
                  onSaved={refreshAll}
                />
              )}
            </div>

            {(byCategory[c.key]?.length ?? 0) === 0 ? (
              <EmptyState label={c.label} isResume={c.key === "resume_version"} />
            ) : (
              byCategory[c.key].map((m) => (
                <MemoryRow
                  key={m.id}
                  m={m}
                  busy={archiving || unarchiving || deleting}
                  onArchive={onArchive}
                  onUnarchive={onUnarchive}
                  onDelete={onDelete}
                  onSaved={refreshAll}
                />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function MemoryRow({ m, busy, onArchive, onUnarchive, onDelete, onSaved }) {
  const importancePct = Math.round((m.importance ?? 0.5) * 100);
  return (
    <Card className={`glass overflow-hidden ${m.isArchived ? "opacity-60" : ""}`}>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{m.title}</p>
            {m.isArchived ? <Badge variant="outline">archived</Badge> : null}
            <Badge variant="secondary" className="tnum">{importancePct}%</Badge>
          </div>
          {m.summary ? <p className="mt-1 text-sm text-muted-foreground">{m.summary}</p> : null}
          {m.tags?.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {m.tags.map((t) => (
                <Badge key={t} variant="outline" className="font-normal">{t}</Badge>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {m.isArchived ? (
            <Button size="icon" variant="ghost" onClick={() => onUnarchive(m)} disabled={busy} title="Restore" aria-label="Restore memory">
              <ArchiveRestore className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <MemoryFormDialog
                category={m.category}
                memory={m}
                trigger={
                  <Button size="icon" variant="ghost" title="Edit" aria-label="Edit memory" disabled={m.category === "resume_version"}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                }
                onSaved={onSaved}
              />
              <Button size="icon" variant="ghost" onClick={() => onArchive(m)} disabled={busy} title="Archive" aria-label="Archive memory">
                <Archive className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button size="icon" variant="ghost" onClick={() => onDelete(m)} disabled={busy} title="Delete" aria-label="Delete memory">
            <Trash2 className="h-4 w-4 text-rose-500" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ label, isResume }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
      {isResume ? (
        <>
          <Camera className="h-8 w-8 text-muted-foreground/60" />
          <p className="max-w-sm text-sm text-muted-foreground">
            No resume snapshots yet. Save a resume in the Resume builder, then use
            “Snapshot current resume” to keep a version the copilot can retrieve.
          </p>
        </>
      ) : (
        <>
          <Plus className="h-8 w-8 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">
            No {label.toLowerCase()} yet. Add one — the copilot will retrieve it when relevant.
          </p>
        </>
      )}
    </div>
  );
}