import { cn } from '../../lib/utils';
import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export default function Modal({ isOpen, onClose, title, description, children, size = 'md', className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          'relative w-full bg-white rounded-xl shadow-xl border border-slate-100',
          'animate-in fade-in slide-in-from-bottom-4 duration-200',
          sizes[size],
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        {title && (
          <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">{title}</h2>
              {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="ml-4 flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
