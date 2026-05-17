import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

    const variants = {
      primary:
        'bg-slate-900 text-white hover:bg-slate-700 focus:ring-slate-900 active:bg-slate-800',
      secondary:
        'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-300 active:bg-slate-200',
      ghost:
        'bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-300',
      danger:
        'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800',
      outline:
        'bg-transparent border border-slate-200 text-slate-700 hover:bg-slate-50 focus:ring-slate-300',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-sm',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
