"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import {
  Sparkles,
  Loader2,
  RefreshCw,
  Wand2,
  MessageSquare,
  User,
  Fingerprint,
  Code2,
  Star,
  AlertTriangle,
  Target,
  Layers,
  Github,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Reveal } from "@/components/site/reveal";
import { SpotlightCard } from "@/components/site/spotlight-card";
import ChatInput from "@/components/ui/chat-input";
import useFetch from "@/hooks/use-fetch";
import { getTwin, rebuildTwin, twinChat } from "@/actions/twin";

export default function TwinView({ initialTwin }) {
  const [twin, setTwin] = useState(initialTwin);
  const [building, setBuilding] = useState(false);
  const [messages, setMessages] = useState([]); // {role, text}
  const chatRef = useRef(null);

  const { fn: rebuildFn } = useFetch(rebuildTwin);
  const { loading: asking, fn: askFn } = useFetch(twinChat);

  // After dispatching a rebuild, poll getTwin until the version bumps (or timeout).
  useEffect(() => {
    if (!building) return;
    const prevVersion = twin?.version ?? 0;
    let stopped = false;
    const tick = async () => {
      const next = await getTwin();
      if (stopped) return;
      if (next && (next.version ?? 0) > prevVersion) {
        setTwin(next);
        setBuilding(false);
        toast.success("Your Career Twin is ready.");
        return;
      }
      timer = setTimeout(tick, 4000);
    };
    let timer = setTimeout(tick, 4000);
    const hardStop = setTimeout(() => {
      stopped = true;
      setBuilding(false);
    }, 120_000);
    return () => {
      stopped = true;
      clearTimeout(timer);
      clearTimeout(hardStop);
    };
  }, [building, twin?.version]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const onRebuild = async () => {
    const ok = await rebuildFn();
    if (ok) {
      setBuilding(true);
      toast.success("Rebuilding your Career Twin…");
    }
  };

  const onAsk = async (text) => {
    setMessages((prev) => [...prev, { role: "user", text }]);
    const result = await askFn(text);
    setMessages((prev) => [
      ...prev,
      { role: "twin", text: result?.reply ?? "I couldn't answer that right now." },
    ]);
  };

  // No twin yet — build CTA.
  if (!twin) {
    return (
      <Reveal>
        <SpotlightCard className="rounded-2xl border border-border bg-card/40 p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary ring-aurora">
              <Fingerprint className="h-7 w-7" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">Build your Career Twin</h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Your twin is an AI model of you, synthesized from your resume, GitHub,
                interviews, applications, and everything NovaNest remembers. Once built,
                you can ask it questions and it answers in your voice.
              </p>
            </div>
            <Button onClick={onRebuild} disabled={building} className="gap-2">
              {building ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {building ? "Building…" : "Build my twin"}
            </Button>
          </div>
        </SpotlightCard>
      </Reveal>
    );
  }

  const profile = twin.profile && typeof twin.profile === "object" ? twin.profile : {};

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Profile */}
      <div className="space-y-6 lg:col-span-2">
        <Reveal>
          <SpotlightCard className="rounded-2xl border border-border bg-card/40 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary ring-aurora">
                  <Fingerprint className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    Your Career Twin
                    <Badge variant="outline" className="font-normal">v{twin.version}</Badge>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Last built {format(new Date(twin.lastUpdatedAt ?? twin.updatedAt), "dd MMM yyyy, HH:mm")}
                  </p>
                </div>
              </div>
              <Button onClick={onRebuild} disabled={building} variant="outline" size="sm" className="gap-2">
                {building ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                {building ? "Rebuilding…" : "Rebuild"}
              </Button>
            </div>
            {profile.summary && (
              <p className="mt-4 text-sm leading-relaxed text-foreground">{profile.summary}</p>
            )}
          </SpotlightCard>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {profile.communicationStyle && (
            <ProfileCard icon={MessageSquare} title="Communication style" accent="text-accent">
              {profile.communicationStyle}
            </ProfileCard>
          )}
          {profile.codingStyle && (
            <ProfileCard icon={Code2} title="Coding style" accent="text-primary">
              {profile.codingStyle}
            </ProfileCard>
          )}
          {profile.strengths?.length > 0 && (
            <ProfileList icon={Star} title="Strengths" accent="text-accent-warm" items={profile.strengths} bullet="bg-emerald-500" />
          )}
          {profile.weaknesses?.length > 0 && (
            <ProfileList icon={AlertTriangle} title="Growth areas" accent="text-rose-500" items={profile.weaknesses} bullet="bg-rose-500" />
          )}
          {profile.ambitions?.length > 0 && (
            <ProfileList icon={Target} title="Ambitions" accent="text-accent" items={profile.ambitions} bullet="bg-primary" />
          )}
          {profile.skillSnapshot && (profile.skillSnapshot.strong?.length || profile.skillSnapshot.developing?.length || profile.skillSnapshot.gaps?.length) ? (
            <SkillSnapshot snapshot={profile.skillSnapshot} />
          ) : null}
        </div>

        {profile.projects?.length > 0 && (
          <Reveal delay={0.05}>
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers className="h-4 w-4 text-accent-warm" /> Projects
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.projects.map((p, i) => (
                  <div key={i} className="rounded-xl border border-border bg-background/60 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{p.name}</p>
                      {p.technologies?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {p.technologies.slice(0, 6).map((t) => (
                            <Badge key={t} variant="outline" className="font-normal">{t}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {p.summary && <p className="mt-1 text-sm text-muted-foreground">{p.summary}</p>}
                    {p.impact && <p className="mt-0.5 text-xs text-accent-warm">Impact: {p.impact}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          </Reveal>
        )}

        {profile.github?.length > 0 && (
          <Reveal delay={0.1}>
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Github className="h-4 w-4" /> GitHub
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {profile.github.map((g, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background/60 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{g.repo}</p>
                      {g.highlights?.length > 0 && (
                        <p className="truncate text-xs text-muted-foreground">{g.highlights[0]}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {g.language && <Badge variant="outline" className="font-normal">{g.language}</Badge>}
                      {g.grade && <Badge className="bg-primary/15 text-primary">{g.grade}</Badge>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </Reveal>
        )}
      </div>

      {/* Chat */}
      <div className="lg:col-span-1">
        <Reveal delay={0.05}>
          <Card className="glass sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-primary" /> Ask your twin
              </CardTitle>
              <CardDescription>Answers in your voice, grounded in your history.</CardDescription>
            </CardHeader>
            <CardContent>
              <div ref={chatRef} className="mb-3 max-h-[420px] space-y-3 overflow-y-auto pr-1">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
                    <Sparkles className="h-6 w-6 text-primary/50" />
                    <p>Try: “What should I highlight in an interview?” or “What are my weak spots?”</p>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div
                      key={i}
                      className={`rounded-2xl border p-3 text-sm leading-relaxed ${
                        m.role === "user"
                          ? "border-primary/30 bg-primary/[0.06] text-foreground"
                          : "border-border bg-background/60 text-foreground"
                      }`}
                    >
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {m.role === "user" ? "You" : "Your twin"}
                      </p>
                      <p className="whitespace-pre-wrap">{m.text}</p>
                    </div>
                  ))
                )}
                {asking && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Your twin is thinking…
                  </div>
                )}
              </div>
              <ChatInput onSend={onAsk} disabled={asking} loading={asking} placeholder="Ask your twin anything…" />
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}

function ProfileCard({ icon: Icon, title, accent, children }) {
  return (
    <Reveal>
      <Card className="glass h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Icon className={`h-4 w-4 ${accent}`} /> {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground">{children}</p>
        </CardContent>
      </Card>
    </Reveal>
  );
}

function ProfileList({ icon: Icon, title, accent, items, bullet }) {
  return (
    <Reveal>
      <Card className="glass h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Icon className={`h-4 w-4 ${accent}`} /> {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5">
            {items.slice(0, 6).map((it, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${bullet}`} /> {it}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </Reveal>
  );
}

function SkillSnapshot({ snapshot }) {
  const groups = [
    { label: "Strong", items: snapshot.strong, className: "text-emerald-500" },
    { label: "Developing", items: snapshot.developing, className: "text-primary" },
    { label: "Gaps", items: snapshot.gaps, className: "text-rose-500" },
  ].filter((g) => g.items?.length > 0);
  if (!groups.length) return null;
  return (
    <Reveal>
      <Card className="glass h-full">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-accent" /> Skill snapshot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {groups.map((g) => (
            <div key={g.label}>
              <p className={`mb-1 text-[11px] font-medium uppercase tracking-wide ${g.className}`}>{g.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {g.items.slice(0, 10).map((s) => (
                  <Badge key={s} variant="outline" className="font-normal">{s}</Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </Reveal>
  );
}