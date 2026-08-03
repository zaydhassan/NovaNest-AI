"use client";

import { useState } from "react";
import { Search, Loader2, Sparkles, Brain } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal } from "@/components/site/reveal";
import { previewRetrievalAction } from "@/actions/memory-engine";
import { SECTION_LABELS } from "@/lib/career/memory/retrieval-router";

const EXAMPLES = [
  "I have a Google interview tomorrow",
  "Help me update my resume for a backend role",
  "What should I learn next?",
  "Help me prep for my Amazon application",
];

/**
 * RetrievalPreview — type a message and see exactly what the Memory Engine
 * retrieves for it (intent + sections + items), with no AI call. This is the
 * v1 demo of the "Google interview" cross-source retrieval case.
 */
export default function RetrievalPreview() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async (q) => {
    const text = (q ?? query).trim();
    if (!text) {
      toast.error("Enter a message to preview retrieval.");
      return;
    }
    setQuery(text);
    setLoading(true);
    try {
      const res = await previewRetrievalAction(text);
      setResult(res);
    } catch (e) {
      toast.error(e?.message || "Couldn't run the preview.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Reveal>
      <Card className="glass overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg ring-aurora text-white shadow-glow">
              <Brain className="h-4 w-4" />
            </span>
            Retrieval preview
          </CardTitle>
          <CardDescription>
            Type a message the way you would to the copilot. This shows the
            structured memories the Memory Engine would retrieve to ground the
            reply — no AI call, just the retrieval.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(query);
            }}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. I have a Google interview tomorrow"
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Retrieve
            </Button>
          </form>

          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => run(ex)}
                className="rounded-full border border-border bg-background/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {ex}
              </button>
            ))}
          </div>

          {result ? <PreviewResult result={result} /> : null}
        </CardContent>
      </Card>
    </Reveal>
  );
}

function PreviewResult({ result }) {
  const { intent, sources = [], totalItems, block } = result?.manifest ?? result ?? {};
  if (!totalItems) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No structured memories retrieved for this message. The AI response
          would be unchanged from today (the engine no-ops when nothing is found).
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="gap-1.5">
          <Sparkles className="h-3 w-3" /> intent: {intent}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {totalItems} memor{totalItems === 1 ? "y" : "ies"} across {sources.length} section{sources.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="space-y-2">
        {sources.map((s) => (
          <div key={s.section} className="rounded-lg border border-border bg-background/40 p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {s.label ?? SECTION_LABELS[s.section] ?? s.section}
              </span>
              <Badge variant="outline" className="tnum">{s.count}</Badge>
            </div>
            {(s.items || []).map((it, i) => (
              <p key={i} className="text-sm text-foreground">
                <span className="font-medium">{it.title}</span>
                {it.summary ? <span className="text-muted-foreground"> — {it.summary}</span> : null}
              </p>
            ))}
          </div>
        ))}
      </div>
      {block ? (
        <details className="rounded-lg border border-border bg-background/40 p-3">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
            Prompt context block (what the AI receives)
          </summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-muted-foreground">{block}</pre>
        </details>
      ) : null}
    </div>
  );
}