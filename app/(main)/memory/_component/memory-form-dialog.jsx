"use client";

import { useState, useEffect, useId, cloneElement } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useFetch from "@/hooks/use-fetch";
import { addStructuredMemory, updateStructuredMemory } from "@/actions/memory-engine";

const FIELD_DEFS = {
  project: [
    { name: "stack", label: "Stack (comma-separated)", type: "text", arrayFromCSV: true },
    { name: "role", label: "Your role", type: "text" },
    { name: "url", label: "URL", type: "text" },
    { name: "status", label: "Status", type: "select", options: ["shipped", "ongoing", "archived"] },
    { name: "metrics", label: "Metrics / impact", type: "text" },
  ],
  skill: [
    { name: "name", label: "Skill", type: "text", required: true },
    { name: "level", label: "Proficiency (0-100)", type: "number", min: 0, max: 100, scale: 0.01 },
    { name: "evidence", label: "Evidence", type: "text" },
    { name: "context", label: "Context", type: "text" },
  ],
  achievement: [
    { name: "metric", label: "Metric", type: "text" },
    { name: "context", label: "Context", type: "text" },
    { name: "date", label: "Date", type: "text" },
    { name: "impact", label: "Impact", type: "textarea" },
  ],
  certificate: [
    { name: "issuer", label: "Issuer", type: "text", required: true },
    { name: "credentialId", label: "Credential ID", type: "text" },
    { name: "issuedAt", label: "Issued", type: "text" },
    { name: "expiresAt", label: "Expires", type: "text" },
    { name: "url", label: "URL", type: "text" },
  ],
  preference: [
    { name: "key", label: "Key", type: "text", required: true },
    { name: "value", label: "Value", type: "text", required: true },
    { name: "scope", label: "Scope", type: "select", options: ["jobSearch", "interview", "learning", "general"] },
  ],
  lesson: [
    { name: "severity", label: "Severity", type: "select", options: ["low", "med", "high"] },
    { name: "source", label: "Source", type: "select", options: ["mock", "interview", "quiz", "application"] },
    { name: "takeaway", label: "Takeaway", type: "textarea", required: true },
    { name: "relatedSkill", label: "Related skill", type: "text" },
  ],
  note: [{ name: "context", label: "Context", type: "text" }],
  resume_version: [],
};

const EMPTY = { title: "", summary: "", detail: "", tags: "", importance: 50, structured: {} };

export default function MemoryFormDialog({ category, memory, trigger, onSaved }) {
  const isEdit = !!memory;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const { fn: addFn, loading: adding } = useFetch(addStructuredMemory);
  const { fn: updateFn, loading: updating } = useFetch(updateStructuredMemory);
  const loading = adding || updating;

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      setForm({
        title: memory.title ?? "",
        summary: memory.summary ?? "",
        detail: memory.detail ?? "",
        tags: (memory.tags ?? []).join(", "),
        importance: Math.round((memory.importance ?? 0.5) * 100),
        structured: { ...(memory.structured ?? {}) },
      });
    } else {
      setForm({ ...EMPTY, structured: {} });
    }
  }, [open, isEdit, memory]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setStruct = (key, val) => setForm((f) => ({ ...f, structured: { ...f.structured, [key]: val } }));

  const buildPayload = () => {
    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const structured = {};
    for (const def of FIELD_DEFS[category] ?? []) {
      let v = form.structured[def.name];
      if (v == null || v === "") continue;
      if (def.arrayFromCSV) v = String(v).split(",").map((s) => s.trim()).filter(Boolean);
      else if (def.type === "number") {
        const n = def.scale ? Number(v) * def.scale : Number(v);
        if (!Number.isFinite(n)) continue;
        v = n;
      }
      structured[def.name] = v;
    }
    return {
      ...(isEdit ? { id: memory.id } : { category }),
      title: form.title.trim(),
      summary: form.summary.trim() || undefined,
      detail: form.detail.trim() || undefined,
      tags: tags.length ? tags : undefined,
      importance: Number(form.importance) / 100,
      structured: Object.keys(structured).length ? structured : undefined,
    };
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required.");
      return;
    }
    for (const def of FIELD_DEFS[category] ?? []) {
      if (def.required && !form.structured[def.name]?.toString().trim()) {
        toast.error(`${def.label} is required.`);
        return;
      }
    }
    const payload = buildPayload();
    const ok = isEdit ? await updateFn(payload) : await addFn(payload);
    if (ok) {
      toast.success(isEdit ? "Memory updated." : "Memory added.");
      setOpen(false);
      onSaved?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit memory" : "Add memory"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this structured memory. Changes apply to future retrieval."
              : "NovaNest will retrieve this when a future message is relevant to it."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Title" required>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Distributed cache for a payments API" />
          </Field>
          <Field label="Summary">
            <Input value={form.summary} onChange={(e) => set("summary", e.target.value)} placeholder="One-line context (the WHY)" />
          </Field>
          <Field label="Detail">
            <Textarea value={form.detail} onChange={(e) => set("detail", e.target.value)} rows={3} placeholder="Long-form detail, metrics, what you learned…" />
          </Field>
          <Field label="Tags (comma-separated)">
            <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="system-design, redis, backend" />
          </Field>
          <Field label={`Importance (${form.importance}%)`}>
            <input
              type="range"
              min={0}
              max={100}
              value={form.importance}
              onChange={(e) => set("importance", Number(e.target.value))}
              className="w-full accent-primary"
            />
          </Field>

          {(FIELD_DEFS[category] ?? []).length > 0 && (
            <div className="space-y-3 rounded-lg border border-border bg-background/40 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {category} details
              </p>
              {(FIELD_DEFS[category] ?? []).map((def) => (
                <Field key={def.name} label={def.label} required={def.required}>
                  {def.type === "textarea" ? (
                    <Textarea
                      value={form.structured[def.name] ?? ""}
                      onChange={(e) => setStruct(def.name, e.target.value)}
                      rows={2}
                    />
                  ) : def.type === "select" ? (
                    <Select
                      value={form.structured[def.name] ?? ""}
                      onValueChange={(v) => setStruct(def.name, v)}
                    >
                      <SelectTrigger aria-label={def.label}><SelectValue placeholder="Select…" /></SelectTrigger>
                      <SelectContent>
                        {def.options.map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={def.type === "number" ? "number" : "text"}
                      min={def.min}
                      max={def.max}
                      value={form.structured[def.name] ?? ""}
                      onChange={(e) => setStruct(def.name, e.target.value)}
                    />
                  )}
                </Field>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isEdit ? "Save changes" : "Add memory"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, children }) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}{required ? <span className="text-rose-500"> *</span> : null}
      </Label>
      {cloneElement(children, { id })}
    </div>
  );
}