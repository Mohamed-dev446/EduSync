import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import { Bell, Menu, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import Avatar from '../ui/Avatar';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export default function Header({ onMenuClick, title }: HeaderProps) {
  const { user } = useAuthStore();
  const { getUserNotifications } = useDataStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = useMemo(() => {
    if (!user) return 0;
    return getUserNotifications(user.id).filter((n) => !n.read).length;
  }, [user, getUserNotifications]);

  return (
    <header className="flex h-14 flex-shrink-0 items-center gap-4 border-b border-slate-100 bg-white px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Title */}
      {title && (
        <h1 className="text-sm font-semibold text-slate-900 hidden sm:block">{title}</h1>
      )}

      {/* Search */}
      <div className="relative ml-auto hidden md:flex items-center">
        <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            'h-8 w-56 rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400',
            'focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-100 focus:w-72',
            'transition-all duration-200'
          )}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 ml-2 md:ml-0">
        <button
          onClick={() => navigate('/notifications')}
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {user && (
          <button
            onClick={() => navigate('/profile')}
            className="ml-1 flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 transition-colors"
          >
            <Avatar name={user.name} size="xs" />
            <span className="hidden sm:block text-xs font-medium text-slate-700">{user.name.split(' ')[0]}</span>
          </button>
        )}
      </div>
    </header>
  );
}
