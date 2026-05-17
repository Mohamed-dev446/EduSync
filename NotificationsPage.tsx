import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { relativeTime } from '../lib/utils';
import { cn } from '../lib/utils';
import type { Notification } from '../types';

const typeConfig = {
  info: { icon: <Info className="h-4 w-4" />, color: 'text-blue-500', bg: 'bg-blue-50' },
  warning: { icon: <AlertTriangle className="h-4 w-4" />, color: 'text-amber-500', bg: 'bg-amber-50' },
  success: { icon: <CheckCircle className="h-4 w-4" />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  error: { icon: <XCircle className="h-4 w-4" />, color: 'text-red-500', bg: 'bg-red-50' },
};

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const { getUserNotifications, markNotificationRead, markAllRead } = useDataStore();

  if (!user) return null;

  const notifications = getUserNotifications(user.id);
  const unread = notifications.filter((n) => !n.read);

  const handleMarkRead = (n: Notification) => {
    if (!n.read) markNotificationRead(n.id);
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Notificaciones</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {unread.length > 0 ? `${unread.length} sin leer` : 'Todo al día'}
          </p>
        </div>
        {unread.length > 0 && (
          <Button variant="outline" size="sm" icon={<CheckCheck className="h-3.5 w-3.5" />} onClick={() => markAllRead(user.id)}>
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="py-16 text-center">
          <Bell className="mx-auto h-10 w-10 text-slate-200 mb-3" />
          <p className="text-sm text-slate-500 font-medium">Sin notificaciones</p>
          <p className="text-xs text-slate-400 mt-1">Aquí aparecerán tus notificaciones.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const config = typeConfig[n.type];
            return (
              <Card
                key={n.id}
                padding="none"
                hover
                onClick={() => handleMarkRead(n)}
                className={cn('overflow-hidden transition-all', !n.read && 'border-blue-100 shadow-blue-50')}
              >
                <div className="flex items-start gap-4 px-5 py-4">
                  <div className={cn('mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg', config.bg, config.color)}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm font-medium', n.read ? 'text-slate-700' : 'text-slate-900')}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500 mt-1.5" />
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1.5">{relativeTime(new Date(n.createdAt))}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
