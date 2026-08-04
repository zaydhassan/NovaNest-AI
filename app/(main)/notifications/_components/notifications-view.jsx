"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  Sparkles,
  TrendingUp,
  ListChecks,
  Mic,
  PenBox,
  KanbanSquare,
  ArrowUpRight,
  XCircle,
  Target,
  Crown,
  Mail,
  RefreshCw,
  CheckCheck,
  Fingerprint,
  Github,
  Rocket,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/site/state-block";
import { cn } from "@/lib/utils";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/actions/notifications";

const TYPE_META = {
  welcome: { icon: Sparkles, accent: "text-primary" },
  insights_ready: { icon: TrendingUp, accent: "text-emerald-400" },
  quiz_completed: { icon: ListChecks, accent: "text-sky-400" },
  mock_scored: { icon: Mic, accent: "text-violet-400" },
  cover_letter_ready: { icon: PenBox, accent: "text-amber-400" },
  application_logged: { icon: KanbanSquare, accent: "text-muted-foreground" },
  application_advanced: { icon: ArrowUpRight, accent: "text-emerald-400" },
  application_rejected: { icon: XCircle, accent: "text-rose-400" },
  ats_score: { icon: Target, accent: "text-sky-400" },
  payment_success: { icon: Crown, accent: "text-amber-400" },
  weekly_digest: { icon: Mail, accent: "text-primary" },
  industry_changed: { icon: RefreshCw, accent: "text-muted-foreground" },
  coach_nudge: { icon: Sparkles, accent: "text-primary" },
  coach_insight: { icon: Lightbulb, accent: "text-accent" },
  twin_ready: { icon: Fingerprint, accent: "text-violet-400" },
  github_analyzed: { icon: Github, accent: "text-foreground" },
  learning_recommendation: { icon: Rocket, accent: "text-accent-warm" },
};

function NotificationEmptyState() {
  return (
    <EmptyState
      icon={Bell}
      title="Nothing here yet"
      description="You'll see updates here as you complete quizzes, mock interviews, and track applications."
    />
  );
}

function NotificationRow({ n, onOpen }) {
  const meta = TYPE_META[n.type] ?? {
    icon: Bell,
    accent: "text-muted-foreground",
  };
  const Icon = meta.icon;

  const inner = (
    <>
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]",
          meta.accent
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">
            {n.title}
          </span>
          {!n.isRead && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          )}
        </span>
        {n.body && (
          <span className="mt-1 block text-sm text-muted-foreground">
            {n.body}
          </span>
        )}
        <span className="mt-1.5 block text-xs text-muted-foreground/70">
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
        </span>
      </span>
    </>
  );

  if (n.href) {
    return (
      <Link
        href={n.href}
        onClick={() => onOpen(n)}
        className={cn(
          "flex items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          !n.isRead && "border-primary/30 bg-primary/[0.05]"
        )}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(n)}
      className={cn(
        "flex w-full items-start gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        !n.isRead && "border-primary/30 bg-primary/[0.05]"
      )}
    >
      {inner}
    </button>
  );
}

export function NotificationsView({
  initialNotifications = [],
  initialUnreadCount = 0,
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialNotifications);
  const [unread, setUnread] = useState(initialUnreadCount);
  const [pending, startTransition] = useTransition();

  const unreadItems = useMemo(
    () => items.filter((n) => !n.isRead),
    [items]
  );

  function markOne(n) {
    if (!n.isRead) {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
      );
      setUnread((u) => Math.max(0, u - 1));
      markNotificationRead(n.id).catch((e) =>
        console.error("[NovaNest] mark read:", e?.message)
      );
    }
  }

  function markAll() {
    if (unread === 0) return;
    startTransition(async () => {
      try {
        await markAllNotificationsRead();
        setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
        setUnread(0);
        toast.success("All notifications marked as read");
        router.refresh();
      } catch (e) {
        console.error("[NovaNest] mark all:", e?.message);
        toast.error("Couldn't mark all as read. Try again.");
      }
    });
  }

  function renderList(list) {
    if (list.length === 0) return <NotificationEmptyState />;
    return (
      <div className="space-y-3">
        {list.map((n) => (
          <NotificationRow key={n.id} n={n} onOpen={markOne} />
        ))}
      </div>
    );
  }

  return (
    <Tabs defaultValue="all" className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <TabsList>
          <TabsTrigger value="all">All ({items.length})</TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadItems.length})
          </TabsTrigger>
        </TabsList>
        <Button
          variant="outline"
          size="sm"
          onClick={markAll}
          disabled={pending || unread === 0}
          className="gap-2"
        >
          <CheckCheck className="h-4 w-4" />
          {pending ? "Marking…" : "Mark all as read"}
        </Button>
      </div>

      <TabsContent value="all" className="mt-0">
        {renderList(items)}
      </TabsContent>
      <TabsContent value="unread" className="mt-0">
        {renderList(unreadItems)}
      </TabsContent>
    </Tabs>
  );
}

export default NotificationsView;