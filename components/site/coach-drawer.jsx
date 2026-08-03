"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowUpRight } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import ChatInput from "@/components/ui/chat-input";
import { useCoachChat } from "@/hooks/use-coach-chat";
import MessageBubble from "@/app/(main)/coach/_components/message-bubble";
import SuggestedPrompts from "@/app/(main)/coach/_components/suggested-prompts";
import { cn } from "@/lib/utils";

const STATIC_PROMPTS = [
  "I have an interview tomorrow — help me prep",
  "What should I learn next?",
  "Review my resume for a role",
  "Help me plan my next 30 days",
];

/**
 * CoachDrawer — global "ask the Coach" surface (M5). Opens from any route via
 * the ⌘J / Ctrl+J shortcut or the header trigger. A lightweight single-turn
 * chat that streams a reply and links to /coach for the full experience.
 *
 * We deliberately use a separate shortcut (⌘J) from the existing command palette
 * (⌘K) so we don't disturb that feature — see the plan's non-negotiable
 * "do not remove/simplify existing features" constraint.
 */
export function CoachDrawer({ className }) {
  const [open, setOpen] = useState(false);
  const scrollRef = useRef(null);
  const { messages, streaming, send } = useCoachChat({});

  // Global ⌘J / Ctrl+J toggles the drawer.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  const isEmpty = messages.length === 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ask the AI coach"
        title="Ask the AI coach (⌘J)"
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          className
        )}
      >
        <Sparkles className="h-4 w-4" />
      </button>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
          <DialogPrimitive.Content className="fixed right-0 top-0 z-50 flex h-full w-[92vw] max-w-md flex-col gap-0 border-l border-white/10 bg-background shadow-glass-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right">
            <DialogPrimitive.Title className="sr-only">Ask your AI copilot</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              Chat with NovaNest&apos;s AI career copilot.
            </DialogPrimitive.Description>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg ring-aurora text-white shadow-glow">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">AI Copilot</p>
                  <p className="text-[11px] text-muted-foreground">
                    Remembers your whole career
                  </p>
                </div>
              </div>
              <Link
                href="/coach"
                onClick={() => setOpen(false)}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:text-accent"
              >
                Full view <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {isEmpty ? (
                <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
                  <p className="max-w-xs text-sm text-muted-foreground">
                    Ask anything — I remember your resume, interviews, applications,
                    and goals.
                  </p>
                  <div className="w-full">
                    <SuggestedPrompts prompts={STATIC_PROMPTS} onPick={send} loading={streaming} />
                  </div>
                </div>
              ) : (
                messages.map((m, i) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    streaming={streaming && i === messages.length - 1 && m.role === "assistant"}
                  />
                ))
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border p-3">
              <ChatInput onSend={send} disabled={streaming} loading={streaming} />
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}

export default CoachDrawer;