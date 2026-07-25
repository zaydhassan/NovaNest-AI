"use client";

import dynamic from "next/dynamic";
import { Sparkles, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import AgentBadge from "./agent-badge";
import MemoryChip from "./memory-chip";

// Code-split the markdown renderer (it pulls in a sizable dependency).
const MDMarkdown = dynamic(() => import("@uiw/react-md-editor").then((m) => m.default.Markdown), {
  ssr: false,
  loading: () => <span className="text-sm text-muted-foreground">…</span>,
});

const MD_OPTS = { skipHtml: true };

/**
 * One chat message. Assistant messages render markdown + agent badges + cited
 * memory chips; user messages render plain text. `streaming` shows a typing
 * cursor for the in-flight assistant reply.
 *
 * @param {{ message: { role: string, content: string, data?: any }, streaming?: boolean }} props
 */
export default function MessageBubble({ message, streaming = false }) {
  const isUser = message.role === "user";
  const data = message.data || {};
  const agentIds = Array.isArray(data.agentIds) ? data.agentIds : [];
  const citations = Array.isArray(data.citations) ? data.citations : [];
  const followUps = Array.isArray(data.followUps) ? data.followUps : [];

  return (
    <div className={cn("flex w-full gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1",
          isUser
            ? "bg-primary/15 text-primary ring-primary/20"
            : "ring-aurora text-white shadow-glow"
        )}
      >
        {isUser ? <UserIcon className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>

      <div className={cn("min-w-0 max-w-[85%] space-y-2", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-primary/10 text-foreground"
              : "glass border border-border text-foreground"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : message.content ? (
            <div className="prose prose-sm prose-invert max-w-none [&_a]:text-accent [&_code]:rounded [&_code]:bg-white/[0.06] [&_code]:px-1 [&_h1]:text-base [&_h2]:text-base [&_h3]:text-sm [&_li]:my-0.5 [&_p]:my-1">
              <MDMarkdown source={message.content} {...MD_OPTS} />
            </div>
          ) : (
            <p className="text-muted-foreground">…</p>
          )}
          {streaming && (
            <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-full bg-primary align-middle" />
          )}
        </div>

        {!isUser && (agentIds.length > 0 || citations.length > 0 || followUps.length > 0) && (
          <div className="space-y-2 px-1">
            {agentIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Agents:</span>
                {agentIds.map((id) => (
                  <AgentBadge key={id} id={id} active />
                ))}
              </div>
            )}
            {citations.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] text-muted-foreground">Cited memories</span>
                <div className="grid gap-1.5">
                  {citations.map((c) => (
                    <MemoryChip key={c.id} memory={c} cited index={c.index} />
                  ))}
                </div>
              </div>
            )}
            {followUps.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {followUps.map((f, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-border bg-white/[0.03] px-2.5 py-1 text-[11px] text-muted-foreground"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}