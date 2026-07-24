import { Bell } from "lucide-react";
import { getNotifications, getUnreadNotificationCount } from "@/actions/notifications";
import { ensureOnboarded } from "@/lib/onboarding";
import { PageHeader } from "@/components/site/page-header";
import { NotificationsView } from "./_components/notifications-view";

export const metadata = {
  title: "Notifications — NovaNest",
};

/**
 * Full notification inbox. Server component: pulls the latest 100 notifications
 * + the unread count, then hands them to the client NotificationsView for
 * All/Unread filtering + mark-all-read.
 */
export default async function NotificationsPage() {
  await ensureOnboarded();
  const [notifications, unreadCount] = await Promise.all([
    getNotifications({ limit: 100 }),
    getUnreadNotificationCount(),
  ]);

  return (
    <div className="container mx-auto">
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        description="Your milestone updates — quizzes, mock interviews, applications, and more."
      />
      <NotificationsView
        initialNotifications={notifications}
        initialUnreadCount={unreadCount}
      />
    </div>
  );
}