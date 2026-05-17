import { cn } from '../../lib/utils';
import { type TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={3}
          className={cn(
            'block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400',
            'transition-colors duration-150 resize-none',
            'focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200',
            'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
            error && 'border-red-300 focus:border-red-400 focus:ring-red-100',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
