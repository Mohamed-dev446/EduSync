import { cn } from '../../lib/utils';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

const variants = {
  default: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
  danger: 'bg-red-50 text-red-700 ring-1 ring-red-100',
  info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
  neutral: 'bg-slate-100 text-slate-500',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export default function Badge({ variant = 'default', size = 'sm', children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center font-medium rounded-full', variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
}
