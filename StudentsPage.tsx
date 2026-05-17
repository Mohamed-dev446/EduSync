import { useState, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { Search, GraduationCap, BookOpen, TrendingUp } from 'lucide-react';
import { relativeTime } from '../lib/utils';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

export default function StudentsPage() {
  const { user } = useAuthStore();
  const { users, classes, assignments, attendance } = useDataStore();
  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('all');

  const myClasses = useMemo(() =>
    classes.filter((c) => c.teacherId === user?.id && !c.isArchived),
    [classes, user]
  );

  const allMyStudentIds = useMemo(() =>
    [...new Set(myClasses.flatMap((c) => c.studentIds))],
    [myClasses]
  );

  const students = useMemo(() => {
    let list = users.filter((u) =>
      u.role === 'student' && allMyStudentIds.includes(u.id)
    );
    if (selectedClassId !== 'all') {
      const cls = myClasses.find((c) => c.id === selectedClassId);
      if (cls) list = list.filter((u) => cls.studentIds.includes(u.id));
    }
    if (search) list = list.filter((u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    );
    return list;
  }, [users, allMyStudentIds, myClasses, selectedClassId, search]);

  const getStudentStats = (studentId: string) => {
    const studentClasses = myClasses.filter((c) => c.studentIds.includes(studentId));
    const studentAssignments = assignments.filter((a) =>
      studentClasses.some((c) => c.id === a.classId)
    );
    const submitted = studentAssignments.filter((a) => {
      const sub = a.submissions.find((s) => s.studentId === studentId);
      return sub && sub.status !== 'pending';
    }).length;
    const graded = studentAssignments.filter((a) => {
      const sub = a.submissions.find((s) => s.studentId === studentId);
      return sub && sub.status === 'graded';
    });
    const avgScore = graded.length > 0
      ? (graded.reduce((acc, a) => {
          const sub = a.submissions.find((s) => s.studentId === studentId);
          return acc + (sub?.score || 0);
        }, 0) / graded.length).toFixed(1)
      : null;

    const attRecords = attendance
      .filter((a) => studentClasses.some((c) => c.id === a.classId))
      .flatMap((a) => a.records.filter((r) => r.studentId === studentId));
    const attRate = attRecords.length > 0
      ? Math.round((attRecords.filter((r) => r.present).length / attRecords.length) * 100)
      : null;

    return {
      classes: studentClasses.length,
      totalAssignments: studentAssignments.length,
      submitted,
      avgScore,
      attRate,
    };
  };

  const classOptions = [
    { value: 'all', label: 'Todas mis clases' },
    ...myClasses.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Mis Alumnos</h1>
        <p className="text-sm text-slate-500 mt-0.5">Revisa el progreso y estadísticas de tus alumnos.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar alumnos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-100"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {classOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedClassId(opt.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border',
                selectedClassId === opt.value
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {students.length === 0 ? (
        <div className="py-16 text-center">
          <GraduationCap className="mx-auto h-10 w-10 text-slate-200 mb-3" />
          <p className="text-sm text-slate-500 font-medium">No hay alumnos</p>
          <p className="text-xs text-slate-400 mt-1">Tus alumnos aparecerán aquí cuando se unan a tus clases.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => {
            const stats = getStudentStats(student.id);
            return (
              <Card key={student.id} padding="md">
                <div className="flex items-start gap-3 mb-4">
                  <Avatar name={student.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{student.name}</p>
                    <p className="text-xs text-slate-400 truncate">{student.email}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <Badge variant={student.status === 'active' ? 'success' : 'danger'}>
                        {student.status === 'active' ? 'Activo' : 'Bloqueado'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500">Clases</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{stats.classes}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500">Asistencia</span>
                    </div>
                    <p className={cn('text-lg font-bold', stats.attRate === null ? 'text-slate-400' :
                      stats.attRate >= 80 ? 'text-emerald-600' : stats.attRate >= 60 ? 'text-amber-600' : 'text-red-500')}>
                      {stats.attRate !== null ? `${stats.attRate}%` : '—'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Tareas entregadas</span>
                    <span className="font-medium text-slate-700">{stats.submitted}/{stats.totalAssignments}</span>
                  </div>
                  {stats.totalAssignments > 0 && (
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${(stats.submitted / stats.totalAssignments) * 100}%` }}
                      />
                    </div>
                  )}
                  {stats.avgScore && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Nota media</span>
                      <span className="font-semibold text-emerald-600">{stats.avgScore}/10</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-50">
                  <p className="text-xs text-slate-400">
                    Último acceso: {student.lastLogin ? relativeTime(new Date(student.lastLogin)) : 'Nunca'}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
