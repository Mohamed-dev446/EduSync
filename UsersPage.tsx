import { useState, useMemo } from 'react';
import { useDataStore } from '../store/dataStore';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Search, Shield, Lock, Unlock, Trash2, Users, GraduationCap, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ROLE_LABELS, relativeTime } from '../lib/utils';
import { cn } from '../lib/utils';
import type { UserRole } from '../types';
import toast from 'react-hot-toast';

const ROLE_FILTERS: { value: 'all' | UserRole; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'admin', label: 'Administradores' },
  { value: 'teacher', label: 'Profesores' },
  { value: 'student', label: 'Alumnos' },
];

export default function UsersPage() {
  const { users, blockUser, unblockUser, deleteUser, classes } = useDataStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  const filtered = useMemo(() =>
    users.filter((u) => {
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      return matchRole && matchSearch;
    }),
    [users, search, roleFilter]
  );

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    teachers: users.filter((u) => u.role === 'teacher').length,
    students: users.filter((u) => u.role === 'student').length,
    active: users.filter((u) => u.status === 'active').length,
    blocked: users.filter((u) => u.status === 'blocked').length,
  };

  const handleBlock = (id: string, name: string) => {
    blockUser(id);
    toast.success(`Cuenta de ${name} bloqueada.`);
  };

  const handleUnblock = (id: string, name: string) => {
    unblockUser(id);
    toast.success(`Cuenta de ${name} activada.`);
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`¿Eliminar al usuario ${name}? Esta acción no se puede deshacer.`)) return;
    deleteUser(id);
    toast.success('Usuario eliminado.');
  };

  const getUserClasses = (userId: string) => {
    return classes.filter((c) => c.teacherId === userId || c.studentIds.includes(userId));
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Gestión de Usuarios</h1>
        <p className="text-sm text-slate-500 mt-0.5">Administra todos los usuarios de la plataforma.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total usuarios', value: stats.total, icon: <Users className="h-4 w-4" />, color: 'text-slate-600', bg: 'bg-slate-100' },
          { label: 'Profesores', value: stats.teachers, icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Alumnos', value: stats.students, icon: <GraduationCap className="h-4 w-4" />, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Bloqueados', value: stats.blocked, icon: <Lock className="h-4 w-4" />, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat) => (
          <Card key={stat.label} padding="md">
            <div className="flex items-center justify-between mb-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-100"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 overflow-hidden">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setRoleFilter(f.value)}
              className={cn(
                'px-3 py-2 text-xs font-medium transition-colors',
                roleFilter === f.value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Usuario</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Rol</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide hidden md:table-cell">Clases</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide hidden lg:table-cell">Último acceso</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Estado</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((u) => {
                const userClasses = getUserClasses(u.id);
                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        u.role === 'admin' ? 'bg-slate-900 text-white' :
                        u.role === 'teacher' ? 'bg-blue-50 text-blue-700' :
                        'bg-violet-50 text-violet-700'
                      )}>
                        {u.role === 'admin' && <Shield className="mr-1 h-3 w-3" />}
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-sm text-slate-500">{userClasses.length}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-xs text-slate-400">
                        {u.lastLogin ? relativeTime(new Date(u.lastLogin)) : 'Nunca'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {u.status === 'active' ? (
                        <Badge variant="success">Activo</Badge>
                      ) : u.status === 'blocked' ? (
                        <Badge variant="danger">Bloqueado</Badge>
                      ) : (
                        <Badge variant="neutral">Pendiente</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        {u.status === 'active' ? (
                          <button
                            onClick={() => handleBlock(u.id, u.name)}
                            title="Bloquear cuenta"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-amber-50 hover:text-amber-500 transition-colors"
                          >
                            <Lock className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnblock(u.id, u.name)}
                            title="Desbloquear cuenta"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-emerald-50 hover:text-emerald-500 transition-colors"
                          >
                            <Unlock className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleDelete(u.id, u.name)}
                            title="Eliminar usuario"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-slate-400">No se encontraron usuarios.</p>
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs text-slate-400">{filtered.length} usuario(s) encontrado(s)</p>
        </div>
      </Card>
    </div>
  );
}
