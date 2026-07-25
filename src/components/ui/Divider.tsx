import { type HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  className?: string;
}

export function Divider({ className = '', ...props }: DividerProps) {
  return <hr className={cn('border-bark/10 my-8 border-t-0', className)} {...props} />;
}
