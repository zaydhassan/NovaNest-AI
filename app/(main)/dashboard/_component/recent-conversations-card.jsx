"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MessageSquare, Plus, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * RecentConversationsCard — jump back into a copilot thread. Reads real
 * `listChatSessions()` data ({ id, title, updatedAt, _count.messages }).
 *
 * @param {{ chatSessions: any[] }} props
 */
export default function RecentConversationsCard({ chatSessions = [] }) {
  const sessions = (chatSessions ?? []).slice(0, 5);

  return (
    <Card className="glass overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-primary">
              <MessageSquare className="h-4 w-4" />
            </span>
            Recent AI conversations
          </CardTitle>
          <CardDescription className="mt-1">
            Jump back into a thread with your AI copilot — your context is
            remembered.
          </CardDescription>
        </div>
        <Link
          href="/coach"
          className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-accent"
        >
          New <Plus className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              Start a conversation with your AI copilot to see it here.
            </p>
            <Link
              href="/coach"
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-accent"
            >
              Open coach <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s, i) => (
              <motion.li
                key={s.id}
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href="/coach"
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/40 p-3 transition-colors hover:border-primary/30 hover:bg-accent/5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {s.title || "Untitled conversation"}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70">
                      {s._count?.messages ?? 0} message{s._count?.messages === 1 ? "" : "s"}
                      {s.updatedAt && (
                        <> · {formatDistanceToNow(new Date(s.updatedAt), { addSuffix: true })}</>
                      )}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5" />
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}