"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Github,
  Loader2,
  Plus,
  Trash2,
  RefreshCw,
  ChevronDown,
  Star,
  GitBranch,
  Lock,
  Globe,
  Sparkles,
  ShieldCheck,
  Gauge,
  BookOpen,
  FlaskConical,
  Network,
  Building2,
  AlertTriangle,
  Lightbulb,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  connectRepo,
  disconnectRepo,
  reanalyzeRepo,
  listRepos,
} from "@/actions/github";
import useFetch from "@/hooks/use-fetch";
import { SpotlightCard } from "@/components/site/spotlight-card";
import { Reveal } from "@/components/site/reveal";
import { EmptyState } from "@/components/site/state-block";
import { cn } from "@/lib/utils";

const STATUS_META = {
  pending: { label: "Queued", className: "bg-muted text-muted-foreground" },
  running: { label: "Analyzing", className: "bg-primary/15 text-primary" },
  complete: { label: "Ready", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  failed: { label: "Failed", className: "bg-rose-500/15 text-rose-500" },
};

const SECTIONS = [
  { key: "architecture", label: "Architecture", icon: Building2 },
  { key: "security", label: "Security", icon: ShieldCheck },
  { key: "performance", label: "Performance", icon: Gauge },
  { key: "documentation", label: "Documentation", icon: BookOpen },
  { key: "testing", label: "Testing", icon: FlaskConical },
  { key: "scalability", label: "Scalability", icon: Network },
];

const GRADE_CLASS = {
  A: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  B: "bg-primary/15 text-primary",
  C: "bg-amber-500/15 text-amber-500",
  D: "bg-rose-500/15 text-rose-500",
};

function scoreColor(score) {
  if (score >= 75) return "text-emerald-500";
  if (score >= 50) return "text-amber-500";
  return "text-rose-500";
}

export default function GitHubAnalyzer({ initialRepos = [] }) {
  const [repos, setRepos] = useState(initialRepos);
  const [expanded, setExpanded] = useState(initialRepos[0]?.id ?? null);
  const [fullName, setFullName] = useState("");
  const [pat, setPat] = useState("");

  const { loading: connecting, fn: connectFn } = useFetch(connectRepo);
  const { loading: disconnecting, fn: disconnectFn } = useFetch(disconnectRepo);
  const { loading: reanalyzing, fn: reanalyzeFn } = useFetch(reanalyzeRepo);

  const anyPending = repos.some((r) => r.analysisStatus === "pending" || r.analysisStatus === "running");
  const refresh = useCallback(async () => {
    const data = await listRepos();
    if (data) setRepos(data);
  }, []);

  useEffect(() => {
    if (!anyPending) return;
    const t = setInterval(refresh, 6000);
    return () => clearInterval(t);
  }, [anyPending, refresh]);

  const onConnect = async (e) => {
    e.preventDefault();
    const result = await connectFn({ fullName, pat });
    if (result) {
      setRepos((prev) => {
        const idx = prev.findIndex((p) => p.id === result.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...result };
          return next;
        }
        return [{ ...result, analysis: null, analysisStatus: "pending" }, ...prev];
      });
      setExpanded(result.id);
      setFullName("");
      setPat("");
      toast.success("Repository connected — analysis is running.");
    }
  };

  const onDisconnect = async (id) => {
    const ok = await disconnectFn(id);
    if (ok) {
      setRepos((prev) => prev.filter((p) => p.id !== id));
      toast.success("Repository removed.");
    }
  };

  const onReanalyze = async (repo) => {
    const token = repo.isPrivate ? prompt(`Re-enter the access token for ${repo.fullName} (tokens aren't stored):`) : null;
    if (repo.isPrivate && !token) return;
    const ok = await reanalyzeFn(repo.id, token);
    if (ok) {
      setRepos((prev) =>
        prev.map((p) => (p.id === repo.id ? { ...p, analysisStatus: "pending", analysis: null, analysisError: null } : p))
      );
      toast.success("Re-analysis queued.");
    }
  };

  return (
    <div className="space-y-6">
      <Reveal>
        <SpotlightCard className="rounded-2xl border border-border bg-card/40 p-5">
          <form onSubmit={onConnect} className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
                <Github className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold">Connect a repository</h2>
                <p className="text-xs text-muted-foreground">
                  Public repos need no token. Private repos need a read-only PAT — it&apos;s hashed and never stored.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs">Repository (owner/repo)</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="vercel/next.js"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pat" className="text-xs">Access token (optional)</Label>
                <Input
                  id="pat"
                  type="password"
                  value={pat}
                  onChange={(e) => setPat(e.target.value)}
                  placeholder="github_pat… (private repos only)"
                  autoComplete="off"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={connecting} className="gap-2">
                  {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Connect
                </Button>
              </div>
            </div>
          </form>
        </SpotlightCard>
      </Reveal>

      {repos.length === 0 ? (
        <EmptyState
          icon={Github}
          title="No repos connected yet"
          description="Add a repository above to get a senior-engineer-grade review across architecture, security, performance, and more."
        />
      ) : (
        <div className="space-y-4">
          {repos.map((repo) => {
            const isOpen = expanded === repo.id;
            const analysis = repo.analysis && typeof repo.analysis === "object" ? repo.analysis : null;
            const status = STATUS_META[repo.analysisStatus] ?? STATUS_META.pending;
            const busy = repo.analysisStatus === "pending" || repo.analysisStatus === "running";
            return (
              <Reveal key={repo.id}>
                <div className="overflow-hidden rounded-2xl border border-border bg-card/40">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : repo.id)}
                    className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-accent/5"
                    aria-expanded={isOpen}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        {repo.isPrivate ? <Lock className="h-4 w-4" /> : <Github className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold">{repo.fullName}</p>
                          {repo.language && (
                            <Badge variant="outline" className="font-normal">{repo.language}</Badge>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                          {repo.stars != null && (
                            <span className="flex items-center gap-1"><Star className="h-3 w-3" /> {repo.stars}</span>
                          )}
                          {repo.defaultBranch && (
                            <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" /> {repo.defaultBranch}</span>
                          )}
                          {repo.isPrivate ? (
                            <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Private</span>
                          ) : (
                            <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> Public</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {analysis?.grade && (
                        <Badge className={GRADE_CLASS[analysis.grade] ?? GRADE_CLASS.B}>Grade {analysis.grade}</Badge>
                      )}
                      <Badge className={status.className}>
                        {busy && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                        {status.label}
                      </Badge>
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden border-t border-border"
                      >
                        <div className="p-4">
                          {busy ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              <p className="text-sm text-muted-foreground">
                                {repo.analysisStatus === "pending" ? "Queued — fetching your repository…" : "Senior-engineer review in progress…"}
                              </p>
                            </div>
                          ) : repo.analysisStatus === "failed" ? (
                            <div className="space-y-3">
                              <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-500">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                <p>{repo.analysisError || "Analysis failed. Check the repo name and permissions, then re-run."}</p>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => onReanalyze(repo)} disabled={reanalyzing} className="gap-2">
                                <RefreshCw className="h-3.5 w-3.5" /> Re-run analysis
                              </Button>
                            </div>
                          ) : analysis ? (
                            <AnalysisView analysis={analysis} repo={repo} onReanalyze={() => onReanalyze(repo)} onDisconnect={() => onDisconnect(repo.id)} reanalyzing={reanalyzing} disconnecting={disconnecting} />
                          ) : null}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AnalysisView({ analysis, repo, onReanalyze, onDisconnect, reanalyzing, disconnecting }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm leading-relaxed text-foreground">{analysis.summary}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onReanalyze} disabled={reanalyzing} className="gap-2">
            {reanalyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Re-run
          </Button>
          <Button variant="ghost" size="sm" onClick={onDisconnect} disabled={disconnecting} className="gap-2 text-muted-foreground hover:text-rose-500">
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </Button>
        </div>
      </div>

      {(analysis.highlights?.length > 0 || analysis.redFlags?.length > 0) && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {analysis.highlights?.length > 0 && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                <Lightbulb className="h-3.5 w-3.5" /> Highlights
              </p>
              <ul className="space-y-1.5">
                {analysis.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" /> {h}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {analysis.redFlags?.length > 0 && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-rose-500">
                <AlertTriangle className="h-3.5 w-3.5" /> Red flags
              </p>
              <ul className="space-y-1.5">
                {analysis.redFlags.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" /> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map((s) => {
          const sec = analysis.sections?.[s.key] ?? { score: 0, notes: [], suggestions: [] };
          const Icon = s.icon;
          return (
            <SpotlightCard key={s.key} className="rounded-xl border border-border bg-background/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold">{s.label}</span>
                </div>
                <div className="relative grid h-12 w-12 place-items-center rounded-full ring-aurora">
                  <span className={cn("text-base font-extrabold", scoreColor(sec.score))}>{sec.score}</span>
                </div>
              </div>
              {sec.notes?.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
                  <ul className="space-y-1">
                    {sec.notes.map((n, i) => (
                      <li key={i} className="text-xs leading-relaxed text-muted-foreground">• {n}</li>
                    ))}
                  </ul>
                </div>
              )}
              {sec.suggestions?.length > 0 && (
                <div>
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-accent">Suggestions</p>
                  <ul className="space-y-1">
                    {sec.suggestions.map((n, i) => (
                      <li key={i} className="text-xs leading-relaxed text-foreground">→ {n}</li>
                    ))}
                  </ul>
                </div>
              )}
            </SpotlightCard>
          );
        })}
      </div>

      {analysis.interviewTalkingPoints?.length > 0 && (
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-accent-warm">
            <MessageSquare className="h-3.5 w-3.5" /> Interview talking points
          </p>
          <ul className="space-y-1.5">
            {analysis.interviewTalkingPoints.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {t}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}