"use client";

import { useState } from "react";
import { Loader2, Sparkles, Copy, Check, Wand2, Map, Send, Target } from "lucide-react";
import { toast } from "sonner";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useFetch from "@/hooks/use-fetch";
import {
  rewriteAchievement,
  generateRoadmap,
  generateOutreach,
  getJobFit,
} from "@/actions/ai-tools";

export default function AiTools() {
  return (
    <Tabs defaultValue="rewrite" className="max-w-3xl mx-auto">
      <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
        <TabsTrigger value="rewrite" className="gap-1.5">
          <Wand2 className="h-3.5 w-3.5" /> Bullet
        </TabsTrigger>
        <TabsTrigger value="roadmap" className="gap-1.5">
          <Map className="h-3.5 w-3.5" /> Roadmap
        </TabsTrigger>
        <TabsTrigger value="outreach" className="gap-1.5">
          <Send className="h-3.5 w-3.5" /> Outreach
        </TabsTrigger>
        <TabsTrigger value="jobfit" className="gap-1.5">
          <Target className="h-3.5 w-3.5" /> Job Fit
        </TabsTrigger>
      </TabsList>

      <TabsContent value="rewrite"><BulletRewriter /></TabsContent>
      <TabsContent value="roadmap"><RoadmapTool /></TabsContent>
      <TabsContent value="outreach"><OutreachTool /></TabsContent>
      <TabsContent value="jobfit"><JobFitTool /></TabsContent>
    </Tabs>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5"
      onClick={() => {
        navigator.clipboard?.writeText(text || "");
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

function ToolCard({ icon: Icon, title, description, children }) {
  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function BulletRewriter() {
  const { loading, fn, data } = useFetch(rewriteAchievement);
  const [bullet, setBullet] = useState("");
  const variants = Array.isArray(data) ? data : [];

  return (
    <ToolCard
      icon={Wand2}
      title="Achievement rewriter"
      description="Turn a weak bullet into quantified, impact-led achievement statements (STAR/XYZ)."
    >
      <div className="space-y-3">
        <Textarea
          value={bullet}
          onChange={(e) => setBullet(e.target.value)}
          placeholder="e.g. did bug fixes on the backend"
          className="h-20"
        />
        <Button onClick={() => fn({ bullet })} disabled={loading || !bullet.trim()} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Rewrite bullet
        </Button>
        {variants.length > 0 && (
          <div className="space-y-2 pt-1">
            {variants.map((v, i) => (
              <div key={i} className="flex items-start justify-between gap-2 rounded-lg border border-border bg-background/60 p-3">
                <p className="text-sm">{v}</p>
                <CopyButton text={v} />
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolCard>
  );
}

function RoadmapTool() {
  const { loading, fn, data } = useFetch(generateRoadmap);
  const [targetRole, setTargetRole] = useState("");
  const [currentSkills, setCurrentSkills] = useState("");
  const weeks = data?.weeks ?? [];

  return (
    <ToolCard
      icon={Map}
      title="Skill roadmap"
      description="Generate a week-by-week upskilling plan toward a target role."
    >
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Target role *</Label>
            <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Staff Engineer" />
          </div>
          <div className="space-y-1.5">
            <Label>Current skills</Label>
            <Input value={currentSkills} onChange={(e) => setCurrentSkills(e.target.value)} placeholder="React, Node, SQL" />
          </div>
        </div>
        <Button
          onClick={() => fn({ targetRole, currentSkills })}
          disabled={loading || !targetRole.trim()}
          className="gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate roadmap
        </Button>
        {data && (
          <div className="space-y-3 pt-1">
            {data.summary && <p className="text-sm text-muted-foreground">{data.summary}</p>}
            <div className="grid gap-2">
              {weeks.map((w) => (
                <div key={w.week} className="rounded-lg border border-border bg-background/60 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Week {w.week}: {w.focus}</p>
                    {w.skills?.length > 0 && (
                      <div className="flex flex-wrap justify-end gap-1">
                        {w.skills.slice(0, 3).map((s) => (
                          <Badge key={s} variant="secondary" className="font-normal">{s}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {w.actions?.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {w.actions.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-primary" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolCard>
  );
}

function OutreachTool() {
  const { loading, fn, data } = useFetch(generateOutreach);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [kind, setKind] = useState("linkedin");
  const out = typeof data === "string" ? data : "";

  return (
    <ToolCard
      icon={Send}
      title="Cold outreach writer"
      description="Draft a LinkedIn note or recruiter email tailored to a target company."
    >
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Company *</Label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Corp" />
          </div>
          <div className="space-y-1.5">
            <Label>Role / contact *</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Hiring Manager" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant={kind === "linkedin" ? "default" : "outline"} size="sm" onClick={() => setKind("linkedin")}>
            LinkedIn note
          </Button>
          <Button variant={kind === "email" ? "default" : "outline"} size="sm" onClick={() => setKind("email")}>
            Email
          </Button>
          <Button
            onClick={() => fn({ targetCompany: company, targetRole: role, kind })}
            disabled={loading || !company.trim() || !role.trim()}
            className="ml-auto gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate
          </Button>
        </div>
        {out && (
          <div className="space-y-2 pt-1">
            <div className="whitespace-pre-wrap rounded-lg border border-border bg-background/60 p-3 text-sm">
              {out}
            </div>
            <div className="flex justify-end">
              <CopyButton text={out} />
            </div>
          </div>
        )}
      </div>
    </ToolCard>
  );
}

function JobFitTool() {
  const { loading, fn, data } = useFetch(getJobFit);
  const [jd, setJd] = useState("");
  const fit = data?.fitScore ?? null;

  return (
    <ToolCard
      icon={Target}
      title="Job-fit score"
      description="Paste a job description to see how well your profile fits and what to emphasize in your cover letter."
    >
      <div className="space-y-3">
        <Textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the full job description…"
          className="h-32"
        />
        <Button onClick={() => fn({ jobDescription: jd })} disabled={loading || !jd.trim()} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Score job fit
        </Button>
        {fit != null && data && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <div className="grid h-16 w-16 place-items-center rounded-full ring-aurora">
                <span className="text-2xl font-extrabold">{Math.round(fit)}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {fit >= 75 ? "Strong fit." : fit >= 50 ? "Decent fit — emphasize the right things." : "Stretch role — frame gaps carefully."}
              </p>
            </div>
            {data.emphasize?.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-emerald-500">Emphasize</p>
                <ul className="space-y-1">
                  {data.emphasize.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.addressGaps?.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-amber-500">Frame these gaps</p>
                <ul className="space-y-1">
                  {data.addressGaps.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </ToolCard>
  );
}