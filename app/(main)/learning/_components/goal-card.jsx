"use client";

import { useState } from "react";
import { Target, Loader2, Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Reveal } from "@/components/site/reveal";
import { SpotlightCard } from "@/components/site/spotlight-card";
import useFetch from "@/hooks/use-fetch";
import { setCareerGoal, retireCareerGoal } from "@/actions/career";

/**
 * GoalCard — the user's active career goal. Shows the target role + level +
 * timeframe + rationale, with an inline editor. "Achieved" retires the goal
 * (status=achieved) so the user can set the next one. The reserved gradient is
 * used on the target icon/ring (a key stat), per the gradient-reservation rule.
 *
 * @param {{ initialGoal: any }} props
 */
export default function GoalCard({ initialGoal }) {
  const [goal, setGoal] = useState(initialGoal);
  const [editing, setEditing] = useState(!initialGoal);
  const [form, setForm] = useState({
    targetRole: initialGoal?.targetRole ?? "",
    targetLevel: initialGoal?.targetLevel ?? "",
    timeframe: initialGoal?.timeframe ?? "",
    rationale: initialGoal?.rationale ?? "",
  });

  const { fn: saveFn, loading: saving } = useFetch(setCareerGoal);
  const { fn: retireFn, loading: retiring } = useFetch(retireCareerGoal);

  const onSave = async () => {
    if (!form.targetRole.trim()) {
      toast.error("Target role is required.");
      return;
    }
    const saved = await saveFn(form);
    if (saved) {
      setGoal(saved);
      setEditing(false);
      toast.success("Career goal saved.");
    }
  };

  const onAchieve = async () => {
    if (!goal?.id) return;
    const ok = await retireFn(goal.id, "achieved");
    if (ok) {
      setGoal(null);
      setForm({ targetRole: "", targetLevel: "", timeframe: "", rationale: "" });
      setEditing(true);
      toast.success("Goal achieved — set your next one.");
    }
  };

  const cancelEdit = () => {
    if (goal) {
      setEditing(false);
      setForm({
        targetRole: goal.targetRole ?? "",
        targetLevel: goal.targetLevel ?? "",
        timeframe: goal.timeframe ?? "",
        rationale: goal.rationale ?? "",
      });
    } else {
      // No goal + cancel on a fresh account: leave the form open (nothing else
      // to show) but clear transient input.
      setForm({ targetRole: "", targetLevel: "", timeframe: "", rationale: "" });
    }
  };

  return (
    <Reveal>
      <SpotlightCard className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl ring-aurora text-white shadow-glow">
              <Target className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-foreground">Active career goal</h2>
              <p className="text-sm text-muted-foreground">
                {goal
                  ? "Your learning recommendations are tuned to this target."
                  : "Set a target so NovaNest can recommend the right next skills."}
              </p>
            </div>
          </div>
          {goal && !editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
            </Button>
          )}
        </div>

        {goal && !editing ? (
          <div className="mt-5 space-y-3">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-2xl font-semibold tracking-tight text-foreground">
                {goal.targetRole}
              </span>
              {goal.targetLevel && (
                <span className="text-sm text-muted-foreground">· {goal.targetLevel}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {goal.timeframe && <span className="rounded-full border border-border px-3 py-1">⏳ {goal.timeframe}</span>}
              <span className="rounded-full border border-border px-3 py-1">
                {goal.status === "active" ? "In progress" : goal.status}
              </span>
            </div>
            {goal.rationale && (
              <p className="text-sm leading-relaxed text-foreground/80">{goal.rationale}</p>
            )}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={onAchieve} disabled={retiring}>
                {retiring ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Check className="mr-1 h-3.5 w-3.5" />}
                Mark achieved
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 grid gap-2">
              <Label htmlFor="goal-role">Target role *</Label>
              <Input
                id="goal-role"
                value={form.targetRole}
                onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
                placeholder="e.g. Senior Frontend Engineer"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="goal-level">Target level</Label>
              <Input
                id="goal-level"
                value={form.targetLevel}
                onChange={(e) => setForm({ ...form, targetLevel: e.target.value })}
                placeholder="e.g. IC5 / Mid-senior"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="goal-timeframe">Timeframe</Label>
              <Input
                id="goal-timeframe"
                value={form.timeframe}
                onChange={(e) => setForm({ ...form, timeframe: e.target.value })}
                placeholder="e.g. 6 months"
              />
            </div>
            <div className="sm:col-span-2 grid gap-2">
              <Label htmlFor="goal-rationale">Why this goal?</Label>
              <Textarea
                id="goal-rationale"
                value={form.rationale}
                onChange={(e) => setForm({ ...form, rationale: e.target.value })}
                placeholder="What does success look like for you?"
                rows={3}
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              {goal && (
                <Button variant="ghost" onClick={cancelEdit} disabled={saving}>
                  <X className="mr-1 h-4 w-4" /> Cancel
                </Button>
              )}
              <Button onClick={onSave} disabled={saving}>
                {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                {goal ? "Save goal" : "Set goal"}
              </Button>
            </div>
          </div>
        )}
      </SpotlightCard>
    </Reveal>
  );
}