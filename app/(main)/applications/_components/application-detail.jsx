"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Sparkles,
  Loader2,
  FileText,
  Mail,
  Users,
  Award,
  XCircle,
  Check,
  Save,
  Brain,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Reveal } from "@/components/site/reveal";
import { SpotlightCard } from "@/components/site/spotlight-card";
import useFetch from "@/hooks/use-fetch";
import {
  updateApplication,
  updateApplicationStatus,
  scoreApplicationAts,
  linkApplicationArtifacts,
  getApplicationRecommendations,
} from "@/actions/applications";
import AgentBadge from "@/app/(main)/coach/_components/agent-badge";
import MemoryChip from "@/app/(main)/coach/_components/memory-chip";

const STATUS_META = {
  SAVED: { label: "Saved", className: "bg-muted text-muted-foreground" },
  APPLIED: { label: "Applied", className: "bg-chart-1/15 text-foreground" },
  SCREENING: { label: "Screening", className: "bg-chart-3/15 text-foreground" },
  INTERVIEW: { label: "Interview", className: "bg-chart-2/15 text-foreground" },
  OFFER: { label: "Offer", className: "bg-chart-4/15 text-foreground" },
  REJECTED: { label: "Rejected", className: "bg-chart-5/15 text-foreground" },
};

const STATUSES = ["SAVED", "APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED"];

const EMPTY_OFFER = { baseSalary: "", totalComp: "", deadline: "", negotiator: "", notes: "" };

function parseAts(app) {
  if (!app?.atsFeedback) return null;
  try {
    return JSON.parse(app.atsFeedback);
  } catch {
    return null;
  }
}

export default function ApplicationDetail({ application, resume, coverLetters = [], relatedMocks = [] }) {
  const app = application;
  const ats = useMemo(() => parseAts(app), [app]);
  const [status, setStatus] = useState(app.status);
  const [offer, setOffer] = useState(() => ({
    ...EMPTY_OFFER,
    ...(app.offerDetails && typeof app.offerDetails === "object" ? app.offerDetails : {}),
  }));
  const [rejectionReason, setRejectionReason] = useState(app.rejectionReason || "");
  const [selectedCoverId, setSelectedCoverId] = useState(app.coverLetterId || "");

  const { loading: statusLoading, fn: statusFn } = useFetch(updateApplicationStatus);
  const { loading: atsLoading, fn: atsFn } = useFetch(scoreApplicationAts);
  const { loading: linking, fn: linkFn } = useFetch(linkApplicationArtifacts);
  const { loading: recLoading, fn: recFn } = useFetch(getApplicationRecommendations);
  const { loading: outcomeSaving, fn: outcomeFn } = useFetch(updateApplication);

  const [recommendations, setRecommendations] = useState(null);

  const meta = STATUS_META[app.status] ?? STATUS_META.SAVED;
  const atsScore = Math.round(Number(app.atsScore ?? ats?.score ?? 0));

  const onStatusChange = async (next) => {
    setStatus(next);
    const result = await statusFn(app.id, next);
    if (result) toast.success(`Moved to ${STATUS_META[next]?.label ?? next}`);
    else setStatus(app.status);
  };

  const runAts = async () => {
    const result = await atsFn(app.id);
    if (result) toast.success(`ATS match: ${Math.round(Number(result.atsScore ?? 0))}%`);
  };

  const linkResume = async (link) => {
    const result = await linkFn(app.id, {
      resumeId: link ? resume?.id : null,
      coverLetterId: selectedCoverId || null,
    });
    if (result) toast.success(link ? "Resume linked" : "Resume unlinked");
  };

  const onCoverChange = async (val) => {
    setSelectedCoverId(val === "__none" ? "" : val);
    const result = await linkFn(app.id, {
      resumeId: app.resumeId || resume?.id || null,
      coverLetterId: val === "__none" ? null : val,
    });
    if (result) toast.success(val === "__none" ? "Cover letter unlinked" : "Cover letter linked");
  };

  const getRecs = async () => {
    const result = await recFn(app.id);
    if (result) setRecommendations(result);
  };

  const saveOutcome = async () => {
    const payload = {
      company: app.company,
      role: app.role,
      location: app.location || "",
      salary: app.salary || "",
      jobUrl: app.jobUrl || "",
      jobDescription: app.jobDescription || "",
      status,
      notes: app.notes || "",
      resumeId: app.resumeId || undefined,
      coverLetterId: app.coverLetterId || undefined,
      rejectionReason: status === "REJECTED" ? rejectionReason : undefined,
      offerDetails: status === "OFFER" ? offer : undefined,
    };
    const result = await outcomeFn(app.id, payload);
    if (result) toast.success("Outcome saved");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Reveal>
        <SpotlightCard className="rounded-2xl border border-border bg-card/40 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1.5 flex items-center gap-2">
                <Badge className={meta.className}>{meta.label}</Badge>
                {app.atsScore != null && (
                  <Badge variant="outline" className="gap-1 font-normal">
                    <Sparkles className="h-3 w-3 text-primary" />
                    ATS {atsScore}%
                  </Badge>
                )}
              </div>
              <h1 className="aurora-text animate-aurora text-2xl font-extrabold md:text-3xl">
                {app.role}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {app.company}
                {[app.location, app.salary && `💰 ${app.salary}`]
                  .filter(Boolean)
                  .map((s) => ` · ${s}`)
                  .join("")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={status} onValueChange={onStatusChange} disabled={statusLoading}>
                <SelectTrigger className="w-40" aria-label="Application status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_META[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {app.jobUrl && (
                <Button asChild variant="outline" size="icon" aria-label="Open job posting">
                  <a href={app.jobUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </SpotlightCard>
      </Reveal>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: ATS + recommendations */}
        <div className="space-y-6 lg:col-span-2">
          {/* ATS feedback */}
          <Reveal delay={0.05}>
            <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    ATS resume match
                  </CardTitle>
                  <CardDescription className="mt-1">
                    How your saved resume aligns with this job description.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={runAts}
                  disabled={atsLoading || !app.jobDescription}
                  className="gap-2"
                >
                  {atsLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {ats ? "Re-run" : "Run match"}
                </Button>
              </CardHeader>
              <CardContent>
                {!app.jobDescription ? (
                  <p className="py-4 text-sm text-muted-foreground">
                    Add a job description to this application (edit it from the board) to unlock
                    ATS matching against your resume.
                  </p>
                ) : atsLoading ? (
                  <div className="flex items-center gap-3 py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Scoring your resume…</p>
                  </div>
                ) : ats ? (
                  <AtsPanel ats={ats} atsScore={atsScore} />
                ) : (
                  <p className="py-4 text-sm text-muted-foreground">
                    No ATS analysis yet — run a match to see matched &amp; missing keywords,
                    strengths, gaps, and concrete edits.
                  </p>
                )}
              </CardContent>
            </Card>
          </Reveal>

          {/* AI recommendations */}
          <Reveal delay={0.1}>
            <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
                      <Brain className="h-4 w-4" />
                    </span>
                    AI recommendations
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Personalized next steps grounded in your history &amp; memory.
                  </CardDescription>
                </div>
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={getRecs}
                  disabled={recLoading}
                  className="gap-2"
                >
                  {recLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {recommendations ? "Refresh" : "Get recommendations"}
                </Button>
              </CardHeader>
              <CardContent>
                {!recommendations ? (
                  <p className="py-4 text-sm text-muted-foreground">
                    Ask the application agent for tailored next steps — interview prep focus,
                    ATS gaps to close, or offer negotiation angles — based on everything NovaNest
                    remembers about you.
                  </p>
                ) : recLoading ? (
                  <div className="flex items-center gap-3 py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Thinking…</p>
                  </div>
                ) : (
                  <RecommendationsPanel result={recommendations} />
                )}
              </CardContent>
            </Card>
          </Reveal>
        </div>

        {/* Right: artifacts + outcome + related mocks */}
        <div className="space-y-6">
          {/* Artifact links */}
          <Reveal delay={0.05}>
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-base">Linked artifacts</CardTitle>
                <CardDescription>Resume &amp; cover letter used for this application.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 p-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 shrink-0 text-accent" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">Resume</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {resume?.content ? "Saved resume" : "No resume saved"}
                      </p>
                    </div>
                  </div>
                  {app.resumeId ? (
                    <Button size="sm" variant="ghost" disabled={linking || !resume} onClick={() => linkResume(false)}>
                      Unlink
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled={linking || !resume} onClick={() => linkResume(true)}>
                      Link
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-accent-warm" /> Cover letter
                  </Label>
                  <Select
                    value={selectedCoverId || "__none"}
                    onValueChange={onCoverChange}
                    disabled={linking || coverLetters.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={coverLetters.length ? "Select a cover letter" : "No cover letters"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">None</SelectItem>
                      {coverLetters.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.jobTitle} · {c.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {coverLetters.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      <Link href="/ai-cover-letter" className="text-primary hover:text-accent">
                        Create a cover letter
                      </Link>{" "}
                      to link it here.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </Reveal>

          {/* Outcome editor */}
          <Reveal delay={0.1}>
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {status === "OFFER" ? (
                    <Award className="h-4 w-4 text-accent-warm" />
                  ) : status === "REJECTED" ? (
                    <XCircle className="h-4 w-4 text-rose-400" />
                  ) : (
                    <Check className="h-4 w-4 text-muted-foreground" />
                  )}
                  Outcome
                </CardTitle>
                <CardDescription>
                  {status === "OFFER"
                    ? "Capture offer details for negotiation."
                    : status === "REJECTED"
                    ? "Note what you'll improve next time."
                    : "Move to Offer or Rejected to record an outcome."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {status === "OFFER" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Base salary">
                        <Input
                          value={offer.baseSalary}
                          onChange={(e) => setOffer({ ...offer, baseSalary: e.target.value })}
                          placeholder="$150k"
                        />
                      </Field>
                      <Field label="Total comp">
                        <Input
                          value={offer.totalComp}
                          onChange={(e) => setOffer({ ...offer, totalComp: e.target.value })}
                          placeholder="$180k"
                        />
                      </Field>
                      <Field label="Deadline">
                        <Input
                          value={offer.deadline}
                          onChange={(e) => setOffer({ ...offer, deadline: e.target.value })}
                          placeholder="2026-08-15"
                        />
                      </Field>
                      <Field label="Negotiator">
                        <Input
                          value={offer.negotiator}
                          onChange={(e) => setOffer({ ...offer, negotiator: e.target.value })}
                          placeholder="Recruiter name"
                        />
                      </Field>
                    </div>
                    <Field label="Notes">
                      <Textarea
                        value={offer.notes}
                        onChange={(e) => setOffer({ ...offer, notes: e.target.value })}
                        placeholder="Equity, benefits, leverage points…"
                        className="h-20"
                      />
                    </Field>
                  </div>
                )}
                {status === "REJECTED" && (
                  <Field label="Rejection reason / lessons">
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="What did the recruiter say? What will you change?"
                      className="h-24"
                    />
                  </Field>
                )}
                {(status === "OFFER" || status === "REJECTED") && (
                  <Button onClick={saveOutcome} disabled={outcomeSaving} className="gap-2">
                    {outcomeSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save outcome
                  </Button>
                )}
              </CardContent>
            </Card>
          </Reveal>

          {/* Related mock interviews */}
          {relatedMocks.length > 0 && (
            <Reveal delay={0.15}>
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4 text-accent-warm" />
                    Practice for this role
                  </CardTitle>
                  <CardDescription>Recent mock interviews for {app.role}.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {relatedMocks.map((m) => (
                    <Link
                      key={m.id}
                      href="/interview"
                      className="flex items-center justify-between rounded-xl border border-border bg-background/60 p-3 transition-colors hover:bg-accent"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{m.role}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(m.createdAt), "dd MMM yyyy")}
                        </p>
                      </div>
                      {m.score != null && (
                        <Badge variant="outline" className="font-normal">
                          {Math.round(Number(m.score))}/100
                        </Badge>
                      )}
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </Reveal>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function AtsPanel({ ats, atsScore }) {
  const scoreColor =
    atsScore >= 75 ? "text-emerald-500" : atsScore >= 50 ? "text-amber-500" : "text-rose-500";
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative grid h-16 w-16 place-items-center rounded-full ring-aurora">
          <span className={`text-xl font-extrabold ${scoreColor}`}>{atsScore}</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Overall match</p>
          <p className="text-xs text-muted-foreground">
            {atsScore >= 75
              ? "Strong match — you're well positioned."
              : atsScore >= 50
              ? "Decent match — a few tweaks will help."
              : "Gap to close — tailor your resume to this JD."}
          </p>
        </div>
      </div>
      {ats.matchedKeywords?.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-emerald-500">Matched</p>
          <div className="flex flex-wrap gap-1.5">
            {ats.matchedKeywords.map((k) => (
              <Badge key={k} className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                {k}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {ats.missingKeywords?.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-rose-500">Missing</p>
          <div className="flex flex-wrap gap-1.5">
            {ats.missingKeywords.map((k) => (
              <Badge key={k} variant="outline" className="font-normal">
                {k}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {ats.recommendations?.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Recommendations</p>
          <ul className="space-y-1.5">
            {ats.recommendations.map((r, i) => (
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

function RecommendationsPanel({ result }) {
  const rec = result?.recommendations;
  if (!rec) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        No recommendations came back. Try again in a moment.
      </p>
    );
  }
  const memories = Array.isArray(result?.memories) ? result.memories : [];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AgentBadge id="application" active />
      </div>
      {rec.summary && (
        <p className="text-sm leading-relaxed text-foreground">{rec.summary}</p>
      )}
      {Array.isArray(rec.bullets) && rec.bullets.length > 0 && (
        <ul className="space-y-2">
          {rec.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {b}
            </li>
          ))}
        </ul>
      )}
      {rec.followUp && (
        <p className="rounded-lg border border-border bg-background/60 p-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Next: </span>
          {rec.followUp}
        </p>
      )}
      {memories.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Recalled memory
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {memories.slice(0, 4).map((m) => (
              <MemoryChip key={m.id} memory={m} cited />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}