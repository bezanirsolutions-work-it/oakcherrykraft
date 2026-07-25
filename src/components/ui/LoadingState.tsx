import { cn } from '../../lib/cn';

interface LoadingStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export function LoadingState({
  title = 'Loading content',
  description = 'Please wait while we prepare the page.',
  className = '',
}: LoadingStateProps) {
  return (
    <div className={cn('rounded-[2rem] border border-bark/10 bg-white p-10 shadow-soft', className)}>
      <div className="flex items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-oak-100 text-oak-700 animate-spin-slow">
          <span className="text-lg font-semibold">⏳</span>
        </div>
      </div>
      <h2 className="mt-8 text-3xl font-semibold text-bark">{title}</h2>
      <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-bark/70">{description}</p>
    </div>
  );
}
