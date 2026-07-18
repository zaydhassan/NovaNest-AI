"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Sparkles,
  Loader2,
  GripVertical,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createApplication,
  updateApplication,
  updateApplicationStatus,
  deleteApplication,
  scoreApplicationAts,
} from "@/actions/applications";
import useFetch from "@/hooks/use-fetch";

const COLUMNS = [
  { key: "SAVED", label: "Saved", accent: "hsl(var(--muted-foreground))" },
  { key: "APPLIED", label: "Applied", accent: "hsl(var(--chart-1))" },
  { key: "SCREENING", label: "Screening", accent: "hsl(var(--chart-3))" },
  { key: "INTERVIEW", label: "Interview", accent: "hsl(var(--chart-2))" },
  { key: "OFFER", label: "Offer", accent: "hsl(var(--chart-4))" },
  { key: "REJECTED", label: "Rejected", accent: "hsl(var(--chart-5))" },
];

const EMPTY_FORM = {
  company: "",
  role: "",
  location: "",
  salary: "",
  jobUrl: "",
  jobDescription: "",
  status: "SAVED",
  notes: "",
};

export default function ApplicationBoard({ initialApplications = [] }) {
  const [applications, setApplications] = useState(initialApplications);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [atsOpen, setAtsOpen] = useState(false);
  const [atsApp, setAtsApp] = useState(null);

  const {
    loading: saving,
    fn: saveFn,
  } = useFetch(editingId ? updateApplication : createApplication);

  const {
    loading: deleting,
    fn: deleteFn,
  } = useFetch(deleteApplication);

  const { loading: statusLoading, fn: statusFn } = useFetch(updateApplicationStatus);
  const { loading: atsLoading, fn: atsFn } = useFetch(scoreApplicationAts);

  const byColumn = useMemo(() => {
    const map = {};
    for (const c of COLUMNS) map[c.key] = [];
    for (const a of applications) {
      (map[a.status] || map.SAVED).push(a);
    }
    return map;
  }, [applications]);

  const openCreate = (presetStatus = "SAVED") => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, status: presetStatus });
    setDialogOpen(true);
  };

  const openEdit = (app) => {
    setEditingId(app.id);
    setForm({
      company: app.company || "",
      role: app.role || "",
      location: app.location || "",
      salary: app.salary || "",
      jobUrl: app.jobUrl || "",
      jobDescription: app.jobDescription || "",
      status: app.status,
      notes: app.notes || "",
    });
    setDialogOpen(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      jobUrl: form.jobUrl?.trim() ? form.jobUrl.trim() : "",
    };
    const result = editingId
      ? await saveFn(editingId, payload)
      : await saveFn(payload);
    if (result) {
      setApplications((prev) => {
        const idx = prev.findIndex((p) => p.id === result.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = result;
          return next;
        }
        return [result, ...prev];
      });
      setDialogOpen(false);
      toast.success(editingId ? "Application updated" : "Application added");
    }
  };

  const onDelete = async (id) => {
    const ok = await deleteFn(id);
    if (ok) {
      setApplications((prev) => prev.filter((p) => p.id !== id));
      toast.success("Application removed");
    }
  };

  const onDrop = useCallback(
    async (status) => {
      setDragOverCol(null);
      const id = draggingId;
      setDraggingId(null);
      if (!id) return;
      const app = applications.find((a) => a.id === id);
      if (!app || app.status === status) return;
      // Optimistic update
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
      const result = await statusFn(id, status);
      if (!result) {
        // revert on failure
        setApplications((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: app.status } : a))
        );
      }
    },
    [draggingId, applications, statusFn]
  );

  const openAts = (app) => {
    setAtsApp(app);
    setAtsOpen(true);
  };

  const runAts = async () => {
    if (!atsApp) return;
    const result = await atsFn(atsApp.id);
    if (result) {
      setApplications((prev) =>
        prev.map((a) => (a.id === result.id ? result : a))
      );
      setAtsApp(result);
    }
  };

  const total = applications.length;
  const interviewing = applications.filter(
    (a) => a.status === "INTERVIEW" || a.status === "OFFER"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => openCreate("SAVED")} className="gap-2">
          <Plus className="h-4 w-4" /> Add application
        </Button>
        <Badge variant="secondary">{total} total</Badge>
        <Badge variant="secondary" className="gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {interviewing} in interview stage
        </Badge>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverCol(col.key);
            }}
            onDragLeave={() => setDragOverCol((c) => (c === col.key ? null : c))}
            onDrop={() => onDrop(col.key)}
            className={`flex min-h-[180px] flex-col gap-3 rounded-2xl border bg-card/40 p-3 transition-colors ${
              dragOverCol === col.key
                ? "border-primary/70 bg-primary/5"
                : "border-border"
            }`}
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: col.accent }}
                />
                <span className="text-sm font-semibold">{col.label}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {byColumn[col.key].length}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {byColumn[col.key].map((app) => (
                <motion.div
                  layout
                  key={app.id}
                  draggable
                  onDragStart={() => setDraggingId(app.id)}
                  onDragEnd={() => setDraggingId(null)}
                  whileHover={{ y: -2 }}
                  className={`group relative cursor-grab rounded-xl border border-border bg-background/80 p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing ${
                    draggingId === app.id ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {app.role}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {app.company}
                      </p>
                    </div>
                    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  </div>

                  {(app.location || app.salary) && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {[app.location, app.salary && `💰 ${app.salary}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}

                  {app.atsScore != null && (
                    <Badge
                      variant="outline"
                      className="mt-2 gap-1 font-normal"
                    >
                      <Sparkles className="h-3 w-3 text-primary" />
                      ATS {Math.round(app.atsScore)}%
                    </Badge>
                  )}

                  <div className="mt-2.5 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => openEdit(app)}
                      aria-label="Edit application"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {app.jobDescription && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => openAts(app)}
                        aria-label="ATS match"
                        title="ATS match"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {app.jobUrl && (
                      <a
                        href={app.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                        aria-label="Open job posting"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="ml-auto h-7 w-7 text-muted-foreground hover:text-rose-500"
                      onClick={() => onDelete(app.id)}
                      disabled={deleting}
                      aria-label="Delete application"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}

              {byColumn[col.key].length === 0 && (
                <button
                  onClick={() => openCreate(col.key)}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/70 py-3 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit application" : "Add application"}</DialogTitle>
            <DialogDescription>
              Track a role in your pipeline. Add a job description to unlock ATS
              matching against your resume.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Company *">
                <Input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Acme Corp"
                  required
                />
              </Field>
              <Field label="Role *">
                <Input
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="Senior Engineer"
                  required
                />
              </Field>
              <Field label="Location">
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Remote / NYC"
                />
              </Field>
              <Field label="Salary">
                <Input
                  value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
                  placeholder="$140k–$170k"
                />
              </Field>
            </div>
            <Field label="Job URL">
              <Input
                value={form.jobUrl}
                onChange={(e) => setForm({ ...form, jobUrl: e.target.value })}
                placeholder="https://..."
                type="url"
              />
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLUMNS.map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Job description" hint="Used for ATS resume matching">
              <Textarea
                value={form.jobDescription}
                onChange={(e) =>
                  setForm({ ...form, jobDescription: e.target.value })
                }
                placeholder="Paste the full job description here…"
                className="h-28"
              />
            </Field>
            <Field label="Notes">
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Recruiter contact, referral, deadlines…"
                className="h-20"
              />
            </Field>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? "Save changes" : "Add to pipeline"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ATS match dialog */}
      <Dialog open={atsOpen} onOpenChange={setAtsOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              ATS resume match
            </DialogTitle>
            <DialogDescription>
              {atsApp ? `${atsApp.role} · ${atsApp.company}` : ""}
            </DialogDescription>
          </DialogHeader>

          <AtsResult app={atsApp} loading={atsLoading} onRun={runAts} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function AtsResult({ app, loading, onRun }) {
  let result = null;
  try {
    result = app?.atsFeedback ? JSON.parse(app.atsFeedback) : null;
  } catch {
    result = null;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Scoring your resume against the job description…
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="space-y-4 py-2">
        <p className="text-sm text-muted-foreground">
          No ATS analysis yet. Run a match to see how your saved resume aligns
          with this job description — including matched &amp; missing keywords,
          strengths, gaps, and concrete edit recommendations.
        </p>
        <Button onClick={onRun} className="gap-2">
          <Sparkles className="h-4 w-4" /> Run ATS match
        </Button>
      </div>
    );
  }

  const score = Math.round(Number(result.score ?? app.atsScore ?? 0));
  const scoreColor =
    score >= 75 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-rose-500";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative grid h-20 w-20 place-items-center rounded-full ring-aurora">
          <span className={`text-2xl font-extrabold ${scoreColor}`}>{score}</span>
          <span className="absolute -bottom-5 text-[10px] text-muted-foreground">
            / 100
          </span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Overall match</p>
          <p className="text-xs text-muted-foreground">
            {score >= 75
              ? "Strong match — you're well positioned."
              : score >= 50
              ? "Decent match — a few tweaks will help."
              : "Gap to close — tailor your resume to this JD."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRun} className="gap-2">
          <Sparkles className="h-3.5 w-3.5" /> Re-run
        </Button>
      </div>

      {result.matchedKeywords?.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-emerald-500">Matched</p>
          <div className="flex flex-wrap gap-1.5">
            {result.matchedKeywords.map((k) => (
              <Badge key={k} className="gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                {k}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {result.missingKeywords?.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-rose-500">Missing</p>
          <div className="flex flex-wrap gap-1.5">
            {result.missingKeywords.map((k) => (
              <Badge key={k} variant="outline" className="gap-1 font-normal">
                <X className="h-3 w-3" /> {k}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {result.recommendations?.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Recommendations
          </p>
          <ul className="space-y-1.5">
            {result.recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}