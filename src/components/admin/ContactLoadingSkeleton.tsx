export function ContactLoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, index) => (
        <div key={index} className="animate-pulse rounded-[1rem] border border-bark/10 bg-sand p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-3 w-20 rounded-full bg-bark/10" />
              <div className="h-3 w-32 rounded-full bg-bark/10" />
            </div>
            <div className="h-3 w-48 rounded-full bg-bark/10" />
            <div className="h-3 w-full rounded-full bg-bark/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
