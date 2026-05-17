import { cn } from '../../lib/utils';
import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onClick?: () => void;
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export default function Card({ children, className, padding = 'md', hover, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-100 shadow-sm',
        paddings[padding],
        hover && 'transition-all duration-150 hover:shadow-md hover:border-slate-200 cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-sm font-semibold text-slate-900', className)}>{children}</h3>
  );
}
