type Activity = {
  title: string;
  description: string;
  time: string;
  tone?: "blue" | "green" | "orange" | "red" | "neutral";
};

const toneClass = {
  blue: "bg-blue-600",
  green: "bg-emerald-600",
  orange: "bg-orange-500",
  red: "bg-red-500",
  neutral: "bg-neutral-400",
};

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  return (
    <section id="activity" className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-950">Recent Activity</h2>
          <p className="mt-1 text-sm text-neutral-500">Latest movement across the academy.</p>
        </div>
      </div>
      <ol className="mt-5 space-y-4">
        {activities.map((activity, index) => (
          <li key={`${activity.title}-${index}`} className="flex gap-3">
            <span className="relative mt-1 flex h-full shrink-0 justify-center">
              <span
                className={`h-2.5 w-2.5 rounded-full ${toneClass[activity.tone ?? "neutral"]}`}
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-start justify-between gap-3">
                <span className="text-sm font-medium text-neutral-950">
                  {activity.title}
                </span>
                <span className="shrink-0 text-xs text-neutral-400">{activity.time}</span>
              </span>
              <span className="mt-1 block text-sm leading-5 text-neutral-500">
                {activity.description}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
