"use client";

import { useState } from "react";
import { Loader2, Clock } from "lucide-react";
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
import { logLearningSession } from "@/actions/learning";

const KINDS = [
  { value: "quiz", label: "Quiz" },
  { value: "mock", label: "Mock interview" },
  { value: "chat", label: "Coach chat" },
  { value: "resource", label: "Resource / reading" },
  { value: "project", label: "Project build" },
];

export default function LearningSessionForm({
  topics = [],
  preselectedTopicId = null,
  onLogged,
  trigger,
  open,
  onOpenChange,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof open === "boolean";
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const [form, setForm] = useState({
    topicId: preselectedTopicId ?? "",
    kind: "quiz",
    summary: "",
    durationMin: "",
  });

  const { fn: logFn, loading } = useFetch(logLearningSession);

  const reset = () =>
    setForm({ topicId: preselectedTopicId ?? "", kind: "quiz", summary: "", durationMin: "" });

  const onSubmit = async () => {
    if (!form.kind) {
      toast.error("Pick a session type.");
      return;
    }
    const payload = {
      kind: form.kind,
      topicId: form.topicId || null,
      summary: form.summary.trim() || undefined,
      durationMin: form.durationMin ? Number(form.durationMin) : undefined,
    };
    const ok = await logFn(payload);
    if (ok) {
      toast.success("Session logged — your timeline + memory are updated.");
      reset();
      setOpen(false);
      onLogged?.();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) reset();
        setOpen(o);
      }}
    >
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a learning session</DialogTitle>
          <DialogDescription>
            Record a practice activity. It feeds your timeline, long-term memory, and Career Health.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="lsf-topic">Topic (optional)</Label>
            <Select
              value={form.topicId}
              onValueChange={(v) => setForm({ ...form, topicId: v === "__none" ? "" : v })}
            >
              <SelectTrigger id="lsf-topic">
                <SelectValue placeholder="Link to a tracked topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">No specific topic</SelectItem>
                {topics.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.skill}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="lsf-kind">Session type *</Label>
            <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v })}>
              <SelectTrigger id="lsf-kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="lsf-duration">Duration (minutes)</Label>
            <div className="relative">
              <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="lsf-duration"
                type="number"
                min={0}
                max={600}
                value={form.durationMin}
                onChange={(e) => setForm({ ...form, durationMin: e.target.value })}
                placeholder="e.g. 30"
                className="pl-9"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="lsf-summary">Summary (optional)</Label>
            <Textarea
              id="lsf-summary"
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="What did you cover? What clicked, what didn't?"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={loading}>
            {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            Log session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}