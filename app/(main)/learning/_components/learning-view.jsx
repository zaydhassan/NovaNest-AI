"use client";

import { useState, useCallback } from "react";
import { Plus, Loader2, Lightbulb, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/site/reveal";
import { SpotlightCard } from "@/components/site/spotlight-card";
import GoalCard from "./goal-card";
import TopicCard from "./topic-card";
import LearningSessionForm from "./learning-session-form";
import useFetch from "@/hooks/use-fetch";
import { getTopics, recommendedTopics, upsertTopic } from "@/actions/learning";

const COLUMNS = [
  { key: "todo", label: "To do", hint: "Skills to pick up" },
  { key: "learning", label: "Learning", hint: "In progress" },
  { key: "learned", label: "Learned", hint: "Mastered" },
  { key: "needs_review", label: "Needs review", hint: "Refresh soon" },
];

export default function LearningView({
  initialTopics = [],
  initialRecommendations = [],
  initialGoal,
}) {
  const [topics, setTopics] = useState(initialTopics);
  const [recommendations, setRecommendations] = useState(initialRecommendations);
  const [newSkill, setNewSkill] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);

  const { fn: upsertFn, loading: adding } = useFetch(upsertTopic);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const [nextTopics, nextRecs] = await Promise.all([getTopics(), recommendedTopics()]);
      setTopics(nextTopics ?? []);
      setRecommendations(nextRecs ?? []);
    } catch {
    } finally {
      setRefreshing(false);
    }
  }, []);

  const onAdd = async () => {
    const skill = newSkill.trim();
    if (!skill) return;
    const ok = await upsertFn({ skill, status: "todo" });
    if (ok) {
      setNewSkill("");
      toast.success(`Added "${skill}" to your board.`);
      refreshAll();
    }
  };

  const adoptRecommendation = async (rec) => {
    const ok = await upsertFn({ skill: rec.skill, status: "todo" });
    if (ok) {
      toast.success(`Added "${rec.skill}" to your board.`);
      refreshAll();
    }
  };

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.key] = topics.filter((t) => t.status === col.key);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <GoalCard initialGoal={initialGoal} />

      <Reveal>
        <div className="glass-strong flex flex-col gap-3 rounded-2xl border border-border p-4 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2">
            <Plus className="h-4 w-4 text-muted-foreground" />
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onAdd();
              }}
              placeholder="Add a skill to track (e.g. System Design)"
              aria-label="Add a skill to track"
              className="border-0 bg-transparent shadow-none focus-visible:bg-transparent focus-visible:ring-0"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onAdd} disabled={adding || !newSkill.trim()}>
              {adding ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
              Add topic
            </Button>
            <LearningSessionForm
              topics={topics}
              onLogged={refreshAll}
              open={sessionOpen}
              onOpenChange={setSessionOpen}
              trigger={
                <Button variant="outline" onClick={() => setSessionOpen(true)}>
                  Log session
                </Button>
              }
            />
          </div>
        </div>
      </Reveal>

      {recommendations.length > 0 && (
        <Reveal>
          <SpotlightCard className="p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Recommended next skills</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Ranked from your active goal, industry demand, and mock-interview weaknesses.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {recommendations.map((rec) => (
                <div
                  key={rec.skill}
                  className="glass flex items-start justify-between gap-3 rounded-xl border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-3.5 w-3.5 text-accent" />
                      <span className="truncate text-sm font-medium text-foreground">{rec.skill}</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{rec.why}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="shrink-0" onClick={() => adoptRecommendation(rec)}>
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                </div>
              ))}
            </div>
          </SpotlightCard>
        </Reveal>
      )}

      <div className="grid gap-4 lg:grid-cols-4">
        {COLUMNS.map((col, i) => (
          <Reveal key={col.key} delay={i * 60}>
            <section className="glass rounded-2xl border border-border p-3">
              <header className="mb-3 flex items-baseline justify-between px-1">
                <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                <span className="text-xs text-muted-foreground">
                  {grouped[col.key]?.length ?? 0}
                </span>
              </header>
              <div className="space-y-3">
                {(grouped[col.key] ?? []).length === 0 ? (
                  <p className="px-1 py-6 text-center text-xs text-muted-foreground">{col.hint}</p>
                ) : (
                  grouped[col.key].map((t) => (
                    <TopicCard
                      key={t.id}
                      topic={t}
                      allTopics={topics}
                      onChange={refreshAll}
                    />
                  ))
                )}
              </div>
            </section>
          </Reveal>
        ))}
      </div>

      {refreshing && (
        <p className="text-center text-xs text-muted-foreground" aria-live="polite">
          Syncing your board…
        </p>
      )}
    </div>
  );
}