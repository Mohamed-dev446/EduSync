import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, isToday, isThisWeek, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import type { EventType, UserRole } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, fmt = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt, { locale: es });
}

export function formatTime(time: string): string {
  return time;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function generateClassCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const part1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({ length: 2 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part3 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${part1}-${part2}-${part3}`;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  class: 'Clase',
  exam: 'Examen',
  assignment: 'Tarea',
  holiday: 'Festivo',
  meeting: 'Reunión',
  other: 'Otro',
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  class: '#3b82f6',
  exam: '#ef4444',
  assignment: '#f59e0b',
  holiday: '#64748b',
  meeting: '#6366f1',
  other: '#10b981',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  teacher: 'Profesor',
  student: 'Alumno',
};

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Mínimo 8 caracteres');
  if (!/[A-Z]/.test(password)) errors.push('Al menos una mayúscula');
  if (!/[0-9]/.test(password)) errors.push('Al menos un número');
  if (!/[!@#$%^&*]/.test(password)) errors.push('Al menos un carácter especial (!@#$%^&*)');
  return { valid: errors.length === 0, errors };
}

export function classColor(color: string, opacity = 1): string {
  return color;
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + '...' : str;
}

export function relativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Ahora mismo';
  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours} h`;
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  return formatDate(date);
}

export { isToday, isThisWeek, isSameMonth };
