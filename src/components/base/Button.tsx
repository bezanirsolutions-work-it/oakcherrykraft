import { ButtonHTMLAttributes, Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';

type ButtonChildProps = Record<string, unknown>;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variantStyles = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
};

const sizeStyles = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
};

export function Button({ asChild, variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const validChildren = Children.toArray(children).filter(
    (child) => typeof child !== 'string' || child.trim() !== ''
  );
  const onlyChild = validChildren.length === 1 ? validChildren[0] : null;

  if (asChild && onlyChild && isValidElement(onlyChild)) {
    const child = onlyChild as ReactElement<ButtonChildProps>;
    return cloneElement(child, {
      className: `${`btn-base ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim()} ${(onlyChild.props as { className?: string }).className ?? ''}`.trim(),
      ...props,
    });
  }

  return (
    <button
      className={`btn-base ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
