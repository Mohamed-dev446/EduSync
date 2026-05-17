import { cn } from '../../lib/utils';
import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400',
              'transition-colors duration-150',
              'focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200',
              'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-red-300 focus:border-red-400 focus:ring-red-100',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
