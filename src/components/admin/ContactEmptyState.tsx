import { Inbox } from 'lucide-react';

interface ContactEmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function ContactEmptyState({
  title,
  description,
  icon = <Inbox className="h-6 w-6" />,
}: ContactEmptyStateProps) {
  return (
    <div className="rounded-[1.5rem] border border-bark/10 bg-sand p-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-oak-100 text-oak-700">
          {icon}
        </div>
        <div>
          <p className="font-semibold text-bark">{title}</p>
          <p className="mt-2 text-sm text-bark/70">{description}</p>
        </div>
      </div>
    </div>
  );
}
