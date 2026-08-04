"use client";

import { useEffect, useState } from "react";
import { Brain, Loader2, Search, EyeOff, Eye } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { listMemories, forgetMemoryAction, unforgetMemoryAction } from "@/actions/memory";
import useFetch from "@/hooks/use-fetch";
import MemoryChip from "./memory-chip";
import { MEMORY_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function MemoryDrawer({ open, onOpenChange }) {
  const [memories, setMemories] = useState([]);
  const [filter, setFilter] = useState(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const { fn: forgetFn } = useFetch(forgetMemoryAction);
  const { fn: unforgetFn } = useFetch(unforgetMemoryAction);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await listMemories({
        type: filter || undefined,
        q: q || undefined,
        limit: 100,
        includeForgotten: true,
      });
      setMemories(rows || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, filter, q]);

  const toggleForget = async (m) => {
    setBusyId(m.id);
    try {
      if (m.isForgotten) await unforgetFn(m.id);
      else await forgetFn(m.id);
      setMemories((prev) =>
        prev.map((x) => (x.id === m.id ? { ...x, isForgotten: !x.isForgotten } : x))
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 pt-5">
          <SheetTitle className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
              <Brain className="h-4 w-4" />
            </span>
            Career memory
          </SheetTitle>
          <SheetDescription>
            Everything NovaNest remembers — manual + auto-extracted. Forgotten
            memories stay out of recall but are kept for undo.
          </SheetDescription>
        </SheetHeader>

        <div className="border-b border-border px-5 py-3">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-white/[0.02] px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search memories…"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilter(null)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                !filter
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              All
            </button>
            {MEMORY_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                  filter === t
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : memories.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No memories yet. As you chat, save resumes, and run mock interviews,
              NovaNest will remember your career facts here.
            </p>
          ) : (
            memories.map((m) => (
              <div key={m.id} className={m.isForgotten ? "opacity-50" : ""}>
                <MemoryChip memory={m} />
                <div className="mt-1 flex items-center justify-between px-1">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground/60">
                    {m.source ?? "manual"}
                  </span>
                  <button
                    onClick={() => toggleForget(m)}
                    disabled={busyId === m.id}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    {m.isForgotten ? (
                      <>
                        <Eye className="h-3 w-3" /> restore
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3" /> forget
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}