"use client";

import { useEffect, useState, useTransition } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/actions/notifications";

/**
 * Icon + accent class per notification type. Falls back to the plain Bell so an
 * unknown/future type still renders cleanly.
 */
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
};

/**
 * NotificationBell — header bell with an unread count badge and a lightweight
 * dropdown inbox. `count` is the server-resolved unread count (rendered as a
 * badge); the dropdown lazily fetches the latest slice on open. Marking an item
 * read is optimistic + fire-and-forget; "Mark all read" clears the badge.
 */
export function NotificationBell({ count = 0, className }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(count);
  const [pending, startTransition] = useTransition();

  // Keep the badge in sync if the server passes a fresh count (e.g. after nav).
  useEffect(() => {
    setUnread(count);
  }, [count]);

  async function load() {
    setLoading(true);
    try {
      const data = await getNotifications({ limit: 8 });
      setItems(data ?? []);
    } catch (e) {
      console.error("[NovaNest] bell load:", e?.message);
    } finally {
      setLoading(false);
    }
  }

  function onOpenChange(next) {
    setOpen(next);
    if (next) load();
  }

  function handleSelect(n) {
    if (!n.isRead) {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
      );
      setUnread((u) => Math.max(0, u - 1));
      markNotificationRead(n.id).catch((e) =>
        console.error("[NovaNest] mark read:", e?.message)
      );
    }
    if (n.href) router.push(n.href);
  }

  function handleMarkAll() {
    startTransition(async () => {
      try {
        await markAllNotificationsRead();
        setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
        setUnread(0);
        toast.success("All notifications marked as read");
      } catch (e) {
        console.error("[NovaNest] mark all:", e?.message);
        toast.error("Couldn't mark all as read. Try again.");
      }
    });
  }

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
          className={cn(
            "relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            className
          )}
        >
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 gap-0 p-0"
      >
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="text-sm font-semibold text-foreground">
            Notifications
          </span>
          {unread > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={pending}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              {pending ? "Marking…" : "Mark all read"}
            </button>
          )}
        </div>
        <DropdownMenuSeparator className="my-0" />

        <div className="max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : items.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <Bell className="mx-auto mb-2 h-6 w-6 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">
                You&apos;re all caught up.
              </p>
            </div>
          ) : (
            items.map((n) => {
              const meta = TYPE_META[n.type] ?? {
                icon: Bell,
                accent: "text-muted-foreground",
              };
              const Icon = meta.icon;
              return (
                <DropdownMenuItem
                  key={n.id}
                  onSelect={(e) => {
                    e.preventDefault();
                    handleSelect(n);
                  }}
                  className={cn(
                    "items-start gap-3 rounded-none px-3 py-2.5 text-left",
                    !n.isRead && "bg-primary/[0.06]"
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]",
                      meta.accent
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {n.title}
                      </span>
                      {!n.isRead && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      )}
                    </span>
                    {n.body && (
                      <span className="mt-0.5 block line-clamp-2 text-xs text-muted-foreground">
                        {n.body}
                      </span>
                    )}
                    <span className="mt-1 block text-[11px] text-muted-foreground/70">
                      {formatDistanceToNow(new Date(n.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </span>
                </DropdownMenuItem>
              );
            })
          )}
        </div>

        <DropdownMenuSeparator className="my-0" />
        <div className="p-2">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block rounded-md px-2 py-1.5 text-center text-xs font-medium text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
          >
            View all notifications
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationBell;