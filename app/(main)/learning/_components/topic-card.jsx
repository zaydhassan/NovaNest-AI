"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Check,
  Loader2,
  Pencil,
  BookOpen,
  CircleDot,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SpotlightCard } from "@/components/site/spotlight-card";
import LearningSessionForm from "./learning-session-form";
import useFetch from "@/hooks/use-fetch";
import { upsertTopic, markTopicStatus } from "@/actions/learning";

const NEXT_STATUS = {
  todo: "learning",
  learning: "learned",
  learned: "needs_review",
  needs_review: "learning",
};

const STATUS_META = {
  todo: { label: "To do", icon: CircleDot, accent: "text-muted-foreground" },
  learning: { label: "Learning", icon: BookOpen, accent: "text-accent" },
  learned: { label: "Learned", icon: Check, accent: "text-accent-warm" },
  needs_review: { label: "Needs review", icon: RefreshCw, accent: "text-primary" },
};

export default function TopicCard({ topic, onChange, allTopics }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ skill: topic.skill, notes: topic.notes ?? "" });
  const [sessionOpen, setSessionOpen] = useState(false);

  const { fn: statusFn, loading: statusLoading } = useFetch(markTopicStatus);
  const { fn: saveFn, loading: saving } = useFetch(upsertTopic);

  const meta = STATUS_META[topic.status] ?? STATUS_META.todo;
  const StatusIcon = meta.icon;
  const proficiency = Math.round((Number(topic.proficiency) || 0) * 100);
  const sessionCount = topic._count?.sessions ?? 0;

  const advance = async () => {
    const next = NEXT_STATUS[topic.status] ?? "learning";
    const ok = await statusFn(topic.id, next);
    if (ok) {
      toast.success(`Moved to ${STATUS_META[next].label}.`);
      onChange();
    }
  };

  const setStatus = async (status) => {
    const ok = await statusFn(topic.id, status);
    if (ok) onChange();
  };

  const saveEdit = async () => {
    if (!draft.skill.trim()) {
      toast.error("Skill name is required.");
      return;
    }
    const ok = await saveFn({ id: topic.id, skill: draft.skill.trim(), notes: draft.notes.trim() || undefined });
    if (ok) {
      setEditing(false);
      toast.success("Topic updated.");
      onChange();
    }
  };

  return (
    <SpotlightCard className="group relative p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {editing ? (
            <input
              autoFocus
              value={draft.skill}
              onChange={(e) => setDraft({ ...draft, skill: e.target.value })}
              aria-label="Skill name"
              className="w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm font-semibold text-foreground focus:outline-none focus:border-primary/60"
            />
          ) : (
            <h3 className="truncate text-sm font-semibold text-foreground">{topic.skill}</h3>
          )}
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span className={`inline-flex items-center gap-1 ${meta.accent}`}>
              <StatusIcon className="h-3.5 w-3.5" /> {meta.label}
            </span>
            <span aria-hidden>·</span>
            <span>{sessionCount} session{sessionCount === 1 ? "" : "s"}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setDraft({ skill: topic.skill, notes: topic.notes ?? "" });
              setEditing((v) => !v);
            }}
            aria-label="Edit topic"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="mt-3">
        <Progress value={proficiency} aria-label={`${topic.skill} proficiency ${proficiency}%`} />
        <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Proficiency</span>
          <span>{proficiency}%</span>
        </div>
      </div>

      {editing && (
        <textarea
          value={draft.notes}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          placeholder="Notes…"
          rows={2}
          aria-label="Notes"
          className="mt-3 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary/60"
        />
      )}

      {!editing && topic.notes && (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-foreground/70">{topic.notes}</p>
      )}

      {topic.lastTouchedAt && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Last practiced {format(new Date(topic.lastTouchedAt), "MMM d")}
        </p>
      )}

      {editing ? (
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={saveEdit} disabled={saving}>
            {saving && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />} Save
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={advance} disabled={statusLoading}>
            {statusLoading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1 h-3.5 w-3.5" />}
            {topic.status === "learned" ? "Review" : "Mark " + STATUS_META[NEXT_STATUS[topic.status] ?? "learning"].label.toLowerCase()}
          </Button>
          <LearningSessionForm
            topics={allTopics}
            preselectedTopicId={topic.id}
            onLogged={onChange}
            open={sessionOpen}
            onOpenChange={setSessionOpen}
            trigger={
              <Button size="sm" variant="ghost" onClick={() => setSessionOpen(true)}>
                Log session
              </Button>
            }
          />
          <Select value={topic.status} onValueChange={setStatus}>
            <SelectTrigger className="ml-auto h-8 w-[34px] px-0 [&>span]:hidden" aria-label="Set status">
              <span className="sr-only">Set status</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {Object.entries(STATUS_META).map(([value, m]) => (
                <SelectItem key={value} value={value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </SpotlightCard>
  );
}