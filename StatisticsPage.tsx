import { useMemo } from 'react';
import { useDataStore } from '../store/dataStore';
import Card, { CardHeader, CardTitle } from '../components/ui/Card';
import { Users, BookOpen, ClipboardList, TrendingUp, UserCheck, BarChart3 } from 'lucide-react';

export default function StatisticsPage() {
  const { users, classes, assignments, attendance } = useDataStore();

  const stats = useMemo(() => {
    const students = users.filter((u) => u.role === 'student');
    const teachers = users.filter((u) => u.role === 'teacher');
    const activeClasses = classes.filter((c) => !c.isArchived);
    const totalSubmissions = assignments.reduce((acc, a) => acc + a.submissions.length, 0);
    const gradedSubmissions = assignments.reduce((acc, a) => acc + a.submissions.filter((s) => s.status === 'graded').length, 0);

    const attRecords = attendance.flatMap((r) => r.records);
    const attRate = attRecords.length > 0
      ? Math.round((attRecords.filter((r) => r.present).length / attRecords.length) * 100)
      : 0;

    return {
      students: students.length,
      teachers: teachers.length,
      activeClasses: activeClasses.length,
      totalAssignments: assignments.length,
      totalSubmissions,
      gradedSubmissions,
      attRate,
      blocked: users.filter((u) => u.status === 'blocked').length,
    };
  }, [users, classes, assignments, attendance]);

  // Per-class stats
  const classStats = useMemo(() =>
    classes.filter((c) => !c.isArchived).map((cls) => {
      const clsAssignments = assignments.filter((a) => a.classId === cls.id);
      const clsAttendance = attendance.filter((a) => a.classId === cls.id);
      const attRecords = clsAttendance.flatMap((r) => r.records);
      const rate = attRecords.length > 0
        ? Math.round((attRecords.filter((r) => r.present).length / attRecords.length) * 100)
        : null;
      const submitted = clsAssignments.reduce((acc, a) => acc + a.submissions.filter((s) => s.status !== 'pending').length, 0);
      const total = clsAssignments.reduce((acc, a) => acc + cls.studentIds.length, 0);
      return { cls, assignments: clsAssignments.length, attRate: rate, submissionRate: total > 0 ? Math.round((submitted / total) * 100) : null };
    }),
    [classes, assignments, attendance]
  );

  const topMetrics = [
    { label: 'Total alumnos', value: stats.students, icon: <Users className="h-4 w-4" />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Profesores', value: stats.teachers, icon: <UserCheck className="h-4 w-4" />, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Clases activas', value: stats.activeClasses, icon: <BookOpen className="h-4 w-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Tareas totales', value: stats.totalAssignments, icon: <ClipboardList className="h-4 w-4" />, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Tasa asistencia', value: `${stats.attRate}%`, icon: <TrendingUp className="h-4 w-4" />, color: 'text-slate-600', bg: 'bg-slate-100' },
    { label: 'Cuentas bloqueadas', value: stats.blocked, icon: <BarChart3 className="h-4 w-4" />, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Estadísticas</h1>
        <p className="text-sm text-slate-500 mt-0.5">Métricas globales de la plataforma.</p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {topMetrics.map((m) => (
          <Card key={m.label} padding="md">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${m.bg} ${m.color} mb-3`}>
              {m.icon}
            </div>
            <p className="text-2xl font-bold text-slate-900">{m.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{m.label}</p>
          </Card>
        ))}
      </div>

      {/* Submission stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card padding="md">
          <CardHeader>
            <CardTitle>Entregas de tareas</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Total entregas</span>
              <span className="text-sm font-semibold text-slate-900">{stats.totalSubmissions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Calificadas</span>
              <span className="text-sm font-semibold text-emerald-600">{stats.gradedSubmissions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Pendientes de calificación</span>
              <span className="text-sm font-semibold text-amber-600">{stats.totalSubmissions - stats.gradedSubmissions}</span>
            </div>
            {stats.totalSubmissions > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-500">Tasa de calificación</span>
                  <span className="text-xs font-medium text-slate-700">
                    {Math.round((stats.gradedSubmissions / stats.totalSubmissions) * 100)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${(stats.gradedSubmissions / stats.totalSubmissions) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card padding="md">
          <CardHeader>
            <CardTitle>Usuarios por rol</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {[
              { label: 'Administradores', count: users.filter((u) => u.role === 'admin').length, color: '#1e293b' },
              { label: 'Profesores', count: stats.teachers, color: '#3b82f6' },
              { label: 'Alumnos', count: stats.students, color: '#8b5cf6' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-600">{item.label}</span>
                  <span className="text-sm font-semibold text-slate-900">{item.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(item.count / users.length) * 100}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Per-class stats */}
      <Card padding="none">
        <CardHeader className="px-5 pt-5 pb-0">
          <CardTitle>Estadísticas por clase</CardTitle>
        </CardHeader>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Clase</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Alumnos</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tareas</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Asistencia</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase">Entregas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {classStats.map(({ cls, assignments: aCount, attRate, submissionRate }) => (
                <tr key={cls.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cls.color }} />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{cls.name}</p>
                        <p className="text-xs text-slate-400">{cls.subject}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-slate-700">{cls.studentIds.length}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-slate-700">{aCount}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {attRate !== null ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 max-w-20">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${attRate}%`,
                              backgroundColor: attRate >= 80 ? '#10b981' : attRate >= 60 ? '#f59e0b' : '#ef4444'
                            }}
                          />
                        </div>
                        <span className="text-sm text-slate-700">{attRate}%</span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">Sin datos</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {submissionRate !== null ? (
                      <span className="text-sm text-slate-700">{submissionRate}%</span>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {classStats.length === 0 && (
            <div className="py-8 text-center text-sm text-slate-400">No hay clases activas.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
