import { cva, type VariantProps } from 'class-variance-authority';
import { Children, cloneElement, isValidElement, type ButtonHTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

type ButtonChildProps = Record<string, unknown>;

const buttonStyles = cva(
  'inline-flex items-center justify-center rounded-full font-semibold transition duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] focus:outline-none focus-visible:ring-4 focus-visible:ring-oak-200 focus-visible:ring-offset-2 focus-visible:ring-offset-sand disabled:cursor-not-allowed disabled:opacity-60',
  {
    variants: {
      variant: {
        primary: 'bg-bark text-sand hover:bg-bark/90',
        secondary: 'bg-white text-bark border border-bark/10 hover:bg-sand',
        outline: 'border border-bark/10 bg-transparent text-bark hover:bg-bark/5',
        ghost: 'bg-transparent text-bark hover:bg-bark/5',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        link: 'bg-transparent text-bark underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-10 px-4 text-sm',
        md: 'h-11 px-5 text-base',
        lg: 'h-12 px-6 text-base',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonStyles> {
  asChild?: boolean;
  icon?: ReactNode;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  asChild,
  variant,
  size,
  fullWidth,
  className = '',
  icon,
  loading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const validChildren = Children.toArray(children).filter(
    (child) => typeof child !== 'string' || child.trim() !== ''
  );
  const onlyChild = validChildren.length === 1 ? validChildren[0] : null;
  const content = loading ? 'Loading...' : (
    <>
      {icon ? <span className="mr-2 inline-flex items-center justify-center">{icon}</span> : null}
      {children}
    </>
  );

  if (asChild && onlyChild && isValidElement(onlyChild)) {
    const child = onlyChild as ReactElement<ButtonChildProps>;
    return cloneElement(child, {
      className: cn(buttonStyles({ variant, size, fullWidth }), className, (onlyChild.props as { className?: string }).className),
      disabled: disabled || loading || (onlyChild.props as { disabled?: boolean }).disabled,
      'aria-busy': loading,
      ...props,
    });
  }

  return (
    <button
      className={cn(buttonStyles({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {content}
    </button>
  );
}
