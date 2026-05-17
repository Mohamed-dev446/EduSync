import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import Avatar from '../ui/Avatar';
import {
  LayoutDashboard, Calendar, BookOpen, Users, ClipboardList,
  UserCheck, Bell, Settings, LogOut, ChevronRight, GraduationCap,
  BarChart3, Shield
} from 'lucide-react';
import { useMemo } from 'react';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  badge?: number;
  roles: string[];
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const { getUserNotifications } = useDataStore();
  const navigate = useNavigate();

  const unreadCount = useMemo(() => {
    if (!user) return 0;
    return getUserNotifications(user.id).filter((n) => !n.read).length;
  }, [user, getUserNotifications]);

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      to: '/dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
      roles: ['admin', 'teacher', 'student'],
    },
    {
      label: 'Calendario',
      to: '/calendar',
      icon: <Calendar className="h-4 w-4" />,
      roles: ['admin', 'teacher', 'student'],
    },
    {
      label: 'Mis Clases',
      to: '/classes',
      icon: <BookOpen className="h-4 w-4" />,
      roles: ['admin', 'teacher', 'student'],
    },
    {
      label: 'Tareas',
      to: '/assignments',
      icon: <ClipboardList className="h-4 w-4" />,
      roles: ['teacher', 'student'],
    },
    {
      label: 'Asistencia',
      to: '/attendance',
      icon: <UserCheck className="h-4 w-4" />,
      roles: ['teacher'],
    },
    {
      label: 'Alumnos',
      to: '/students',
      icon: <GraduationCap className="h-4 w-4" />,
      roles: ['teacher'],
    },
    {
      label: 'Usuarios',
      to: '/users',
      icon: <Users className="h-4 w-4" />,
      roles: ['admin'],
    },
    {
      label: 'Estadísticas',
      to: '/statistics',
      icon: <BarChart3 className="h-4 w-4" />,
      roles: ['admin'],
    },
    {
      label: 'Notificaciones',
      to: '/notifications',
      icon: <Bell className="h-4 w-4" />,
      badge: unreadCount > 0 ? unreadCount : undefined,
      roles: ['admin', 'teacher', 'student'],
    },
    {
      label: 'Perfil',
      to: '/profile',
      icon: <Settings className="h-4 w-4" />,
      roles: ['admin', 'teacher', 'student'],
    },
  ];

  const filteredNav = navItems.filter((item) => user && item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'flex h-full flex-col bg-white border-r border-slate-100 transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center border-b border-slate-100 px-4 h-14 flex-shrink-0', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900">
          <GraduationCap className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-slate-900 tracking-tight">EduSync</span>
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="ml-auto flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5 rotate-180" />
          </button>
        )}
        {collapsed && (
          <button
            onClick={onToggle}
            className="absolute right-0 translate-x-full hidden"
          />
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {user?.role === 'admin' && !collapsed && (
          <div className="px-2 pb-1 pt-1">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400 uppercase tracking-wide">
              <Shield className="h-3 w-3" />
              Administración
            </span>
          </div>
        )}
        {filteredNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-100',
                'relative group',
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                collapsed && 'justify-center px-0 py-2'
              )
            }
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
            {!collapsed && item.badge && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
            {collapsed && item.badge && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
            {/* Tooltip when collapsed */}
            {collapsed && (
              <div className="absolute left-full ml-2 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white group-hover:flex z-50">
                {item.label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      {user && (
        <div className={cn('border-t border-slate-100 p-3', collapsed ? 'flex flex-col items-center gap-2' : '')}>
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <Avatar name={user.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-900">{user.name}</p>
                <p className="truncate text-xs text-slate-400 capitalize">{
                  user.role === 'admin' ? 'Administrador' : user.role === 'teacher' ? 'Profesor' : 'Alumno'
                }</p>
              </div>
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <>
              <Avatar name={user.name} size="sm" />
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
