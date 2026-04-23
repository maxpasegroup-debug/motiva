import { formatShortDateTime } from "@/lib/portal";
import { ParentNotificationActions } from "@/components/parent/ParentNotificationActions";
import { requireParentSession } from "@/server/parent/auth";
import { getParentPortalSnapshot } from "@/server/parent/data";

export const dynamic = "force-dynamic";

export default async function ParentNotificationsPage() {
  const session = requireParentSession();
  const snapshot = await getParentPortalSnapshot(session.userId);

  if (!snapshot) {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        Parent profile not found.
      </div>
    );
  }

  const notificationIds = snapshot.notifications.map((notification) => notification.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Notifications</h1>
          <p className="mt-2 text-sm text-neutral-600">
            All updates for your child, with quick read controls.
          </p>
        </div>
        <ParentNotificationActions notificationIds={notificationIds} markAll />
      </div>

      <div className="space-y-4">
        {snapshot.notifications.length > 0 ? (
          snapshot.notifications.map((notification) => (
            <div
              key={notification.id}
              className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs text-neutral-500">
                    {formatShortDateTime(notification.created_at)}
                  </p>
                  <p className="mt-2 text-xs text-neutral-500">
                    {notification.is_read ? "Read" : "Unread"}
                  </p>
                </div>
                <ParentNotificationActions
                  notificationIds={[notification.id]}
                  isRead={notification.is_read}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-500">
            No notifications available.
          </div>
        )}
      </div>
    </div>
  );
}
