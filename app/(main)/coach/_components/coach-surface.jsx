"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Brain, Menu, Sparkles, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import ChatInput from "@/components/ui/chat-input";
import useFetch from "@/hooks/use-fetch";
import { useCoachChat } from "@/hooks/use-coach-chat";
import { listChatSessions, getChatSession } from "@/actions/chat";
import { getInsights } from "@/actions/coach";
import { cn } from "@/lib/utils";
import MessageBubble from "./message-bubble";
import SuggestedPrompts from "./suggested-prompts";
import InsightFeed from "./insight-feed";
import MemoryDrawer from "./memory-drawer";

export default function CoachSurface({
  initialSessions = [],
  initialInsights = [],
  suggestedPrompts = [],
}) {
  const [sessions, setSessions] = useState(initialSessions);
  const [activeId, setActiveId] = useState(null);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [insights, setInsights] = useState(initialInsights);

  const scrollRef = useRef(null);
  const { fn: getInsightsFn } = useFetch(getInsights);

  const { messages, setMessages, streaming, sessionId, send } = useCoachChat({
    onSessionCreated: (id) => {
      setActiveId(id);
      refreshSessions();
    },
  });

  // Auto-scroll to the latest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  const refreshInsights = useCallback(async () => {
    const rows = await getInsightsFn({ limit: 20 });
    if (rows) setInsights(rows);
  }, [getInsightsFn]);

  const refreshSessions = useCallback(async () => {
    const rows = await listChatSessions();
    if (rows) setSessions(rows);
  }, []);

  const openSession = useCallback(
    async (id) => {
      setActiveId(id);
      setMobileNavOpen(false);
      const session = await getChatSession(id);
      if (session) setMessages(session.messages || []);
    },
    [setMessages]
  );

  const startNewChat = useCallback(() => {
    setActiveId(null);
    setMessages([]);
    setMobileNavOpen(false);
  }, [setMessages]);

  const sendMessage = useCallback(
    (text) => {
      send(text);
      // After the (possibly new) session is created the hook calls
      // onSessionCreated → refreshSessions; also refresh once the send resolves.
      refreshSessions();
    },
    [send, refreshSessions]
  );

  const isEmpty = messages.length === 0;

  return (
    <div className="grid h-[calc(100vh-9rem)] grid-cols-1 gap-4 lg:h-[calc(100vh-7rem)] lg:grid-cols-[260px_1fr_320px]">
      {/* Sessions rail — desktop */}
      <aside className="hidden flex-col gap-2 lg:flex">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Conversations</h2>
          <Button size="sm" variant="ghost" onClick={startNewChat} className="h-7 gap-1 px-2">
            <Plus className="h-4 w-4" /> New
          </Button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto">
          <button
            onClick={startNewChat}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
              !activeId ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-white/[0.04]"
            )}
          >
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            New conversation
          </button>
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => openSession(s.id)}
              className={cn(
                "flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                activeId === s.id
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-white/[0.04]"
              )}
            >
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{s.title}</span>
                <span className="text-[11px] text-muted-foreground/60">{s._count?.messages ?? 0} msg</span>
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* Chat column */}
      <main className="glass flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2 lg:hidden">
          <Button size="sm" variant="ghost" onClick={() => setMobileNavOpen(true)} className="gap-1.5">
            <Menu className="h-4 w-4" /> Chats
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setMemoryOpen(true)} className="gap-1.5">
            <Brain className="h-4 w-4 text-primary" /> Memory
          </Button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
          {isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl ring-aurora text-white shadow-glow">
                <Sparkles className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-foreground">
                  Your AI Career OS, with memory
                </h2>
                <p className="max-w-md text-sm text-muted-foreground">
                  Ask anything — I remember your resume, interviews, applications,
                  skills, and goals so you never repeat yourself.
                </p>
              </div>
              <div className="w-full max-w-xl">
                <SuggestedPrompts prompts={suggestedPrompts} onPick={sendMessage} loading={streaming} />
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                streaming={streaming && m.role === "assistant" && m.id === messages[messages.length - 1]?.id}
              />
            ))
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border p-3">
          <ChatInput onSend={sendMessage} disabled={streaming} loading={streaming} />
        </div>
      </main>

      {/* Insights rail — desktop */}
      <aside className="hidden flex-col gap-3 lg:flex">
        <InsightFeed insights={insights} onUpdated={refreshInsights} />
        <Button
          variant="outline"
          onClick={() => setMemoryOpen(true)}
          className="justify-start gap-2"
        >
          <Brain className="h-4 w-4 text-primary" />
          View career memory
        </Button>
      </aside>

      {/* Mobile sessions drawer */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-3/4 p-0 sm:max-w-xs">
          <SheetHeader className="border-b border-border px-5 pt-5">
            <SheetTitle>Conversations</SheetTitle>
            <SheetDescription>Pick up where you left off.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-1 overflow-y-auto p-3">
            <Button
              variant="secondary"
              onClick={startNewChat}
              className="w-full justify-start gap-2"
            >
              <Plus className="h-4 w-4" /> New conversation
            </Button>
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => openSession(s.id)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm",
                  activeId === s.id ? "bg-primary/10 text-foreground" : "text-muted-foreground"
                )}
              >
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{s.title}</span>
                  <span className="text-[11px] text-muted-foreground/60">{s._count?.messages ?? 0} msg</span>
                </span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Memory drawer (shared desktop+mobile) */}
      <MemoryDrawer open={memoryOpen} onOpenChange={setMemoryOpen} />
    </div>
  );
}