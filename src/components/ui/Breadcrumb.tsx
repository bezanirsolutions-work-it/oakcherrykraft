import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav className={cn('text-sm text-bark/70', className)} aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={item.label} className="inline-flex items-center gap-2">
            {item.path ? (
              <Link to={item.path} className="transition hover:text-bark focus-visible:text-bark">
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-bark">{item.label}</span>
            )}
            {index < items.length - 1 ? <ChevronRight size={14} className="text-bark/40" aria-hidden="true" /> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
