import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import Card, { CardHeader, CardTitle } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import {
  Users, BookOpen, Calendar, ClipboardList,
  TrendingUp, UserCheck, ArrowRight, Clock, AlertCircle
} from 'lucide-react';
import { format, parseISO, isToday, isPast, isFuture, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { EVENT_TYPE_LABELS, relativeTime } from '../lib/utils';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { events, classes, assignments, users, attendance, getUserNotifications } = useDataStore();
  const navigate = useNavigate();

  const myClasses = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin') return classes;
    if (user.role === 'teacher') return classes.filter((c) => c.teacherId === user.id);
    return classes.filter((c) => c.studentIds.includes(user.id));
  }, [user, classes]);

  const myEvents = useMemo(() => {
    if (!user) return [];
    const today = new Date();
    const end = addDays(today, 14);
    return events
      .filter((e) => {
        const d = parseISO(e.date);
        return d >= today && d <= end;
      })
      .filter((e) => {
        if (user.role === 'admin') return true;
        if (!e.classId) return e.createdBy === user.id || user.role === 'admin';
        return myClasses.some((c) => c.id === e.classId);
      })
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [user, events, myClasses]);

  const myAssignments = useMemo(() => {
    if (!user) return [];
    if (user.role === 'teacher') {
      return assignments.filter((a) => myClasses.some((c) => c.id === a.classId)).slice(0, 4);
    }
    if (user.role === 'student') {
      return assignments
        .filter((a) => myClasses.some((c) => c.id === a.classId))
        .filter((a) => {
          const sub = a.submissions.find((s) => s.studentId === user.id);
          return !sub || sub.status === 'pending';
        })
        .slice(0, 4);
    }
    return assignments.slice(0, 4);
  }, [user, assignments, myClasses]);

  const notifications = useMemo(() => {
    if (!user) return [];
    return getUserNotifications(user.id).filter((n) => !n.read).slice(0, 3);
  }, [user, getUserNotifications]);

  const stats = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin') {
      const students = users.filter((u) => u.role === 'student');
      const teachers = users.filter((u) => u.role === 'teacher');
      const attRate = attendance.length > 0
        ? attendance.reduce((acc, r) => {
            const present = r.records.filter((rec) => rec.present).length;
            return acc + (present / Math.max(r.records.length, 1));
          }, 0) / attendance.length * 100
        : 0;
      return [
        { label: 'Alumnos', value: students.length, icon: <Users className="h-4 w-4" />, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Profesores', value: teachers.length, icon: <UserCheck className="h-4 w-4" />, color: 'text-violet-600', bg: 'bg-violet-50' },
        { label: 'Clases activas', value: classes.filter((c) => !c.isArchived).length, icon: <BookOpen className="h-4 w-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Tasa asistencia', value: `${attRate.toFixed(0)}%`, icon: <TrendingUp className="h-4 w-4" />, color: 'text-amber-600', bg: 'bg-amber-50' },
      ];
    }
    if (user.role === 'teacher') {
      const myStudents = [...new Set(myClasses.flatMap((c) => c.studentIds))];
      const pendingReviews = assignments.filter((a) => myClasses.some((c) => c.id === a.classId))
        .reduce((acc, a) => acc + a.submissions.filter((s) => s.status === 'submitted').length, 0);
      return [
        { label: 'Mis clases', value: myClasses.length, icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Alumnos', value: myStudents.length, icon: <Users className="h-4 w-4" />, color: 'text-violet-600', bg: 'bg-violet-50' },
        { label: 'Tareas activas', value: assignments.filter((a) => myClasses.some((c) => c.id === a.classId)).length, icon: <ClipboardList className="h-4 w-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Por revisar', value: pendingReviews, icon: <AlertCircle className="h-4 w-4" />, color: 'text-amber-600', bg: 'bg-amber-50' },
      ];
    }
    // Student
    const completed = assignments.filter((a) => {
      const sub = a.submissions.find((s) => s.studentId === user.id);
      return sub && sub.status !== 'pending';
    }).length;
    return [
      { label: 'Mis clases', value: myClasses.length, icon: <BookOpen className="h-4 w-4" />, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Tareas pendientes', value: myAssignments.length, icon: <ClipboardList className="h-4 w-4" />, color: 'text-amber-600', bg: 'bg-amber-50' },
      { label: 'Completadas', value: completed, icon: <TrendingUp className="h-4 w-4" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Próximos eventos', value: myEvents.length, icon: <Calendar className="h-4 w-4" />, color: 'text-violet-600', bg: 'bg-violet-50' },
    ];
  }, [user, users, classes, myClasses, assignments, myAssignments, myEvents, attendance]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 13) return 'Buenos días';
    if (h < 20) return 'Buenas tardes';
    return 'Buenas noches';
  };

  if (!user) return null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Greeting */}
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          {greeting()}, {user.name.split(' ')[0]}.
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} padding="md">
            <div className="flex items-center justify-between mb-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming Events */}
        <Card padding="none" className="lg:col-span-2">
          <CardHeader className="px-5 pt-5 pb-0">
            <CardTitle>Próximos eventos</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/calendar')} icon={<Calendar className="h-3.5 w-3.5" />}>
              Ver calendario
            </Button>
          </CardHeader>
          <div className="divide-y divide-slate-50 mt-3">
            {myEvents.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-400">No hay eventos próximos.</div>
            ) : (
              myEvents.map((event) => {
                const eventDate = parseISO(event.date);
                const todayEvent = isToday(eventDate);
                return (
                  <div key={event.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                    <div className="flex-shrink-0 text-center w-10">
                      <p className="text-xs font-medium text-slate-500 uppercase">
                        {format(eventDate, 'MMM', { locale: es })}
                      </p>
                      <p className="text-lg font-bold text-slate-900 leading-none">
                        {format(eventDate, 'd')}
                      </p>
                    </div>
                    <div
                      className="h-8 w-0.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: event.color || '#64748b' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{event.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">{EVENT_TYPE_LABELS[event.type]}</span>
                        {event.startTime && (
                          <span className="text-xs text-slate-400">{event.startTime}</span>
                        )}
                        {todayEvent && <Badge variant="info">Hoy</Badge>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {myEvents.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-50">
              <button onClick={() => navigate('/calendar')} className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1">
                Ver todos <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </Card>

        {/* Right column */}
        <div className="space-y-4">
          {/* Pending assignments */}
          <Card padding="none">
            <CardHeader className="px-5 pt-5 pb-0">
              <CardTitle>Tareas</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/assignments')}>
                Ver todas
              </Button>
            </CardHeader>
            <div className="mt-3 divide-y divide-slate-50">
              {myAssignments.length === 0 ? (
                <div className="px-5 py-6 text-center text-sm text-slate-400">Sin tareas pendientes.</div>
              ) : (
                myAssignments.map((a) => {
                  const due = parseISO(a.dueDate);
                  const overdue = isPast(due) && !isToday(due);
                  const soon = isFuture(due) && due <= addDays(new Date(), 3);
                  return (
                    <div key={a.id} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                      <div className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${overdue ? 'bg-red-400' : soon ? 'bg-amber-400' : 'bg-slate-300'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{a.title}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {format(due, "d MMM", { locale: es })}
                          {overdue && <Badge variant="danger">Vencida</Badge>}
                          {soon && !overdue && <Badge variant="warning">Pronto</Badge>}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Notifications */}
          {notifications.length > 0 && (
            <Card padding="none">
              <CardHeader className="px-5 pt-5 pb-0">
                <CardTitle>Notificaciones</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => navigate('/notifications')}>
                  Ver todas
                </Button>
              </CardHeader>
              <div className="mt-3 divide-y divide-slate-50">
                {notifications.map((n) => (
                  <div key={n.id} className="flex gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                    <div className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                      n.type === 'success' ? 'bg-emerald-400' :
                      n.type === 'warning' ? 'bg-amber-400' :
                      n.type === 'error' ? 'bg-red-400' : 'bg-blue-400'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-900">{n.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{n.message}</p>
                      <p className="text-xs text-slate-300 mt-0.5">{relativeTime(new Date(n.createdAt))}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* My Classes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900">Mis clases</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/classes')}>
            Ver todas
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myClasses.slice(0, 3).map((cls) => {
            const teacher = users.find((u) => u.id === cls.teacherId);
            return (
              <Card key={cls.id} hover onClick={() => navigate('/classes')} padding="md">
                <div className="flex items-start gap-3">
                  <div
                    className="h-9 w-9 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: cls.color + '20', color: cls.color }}
                  >
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{cls.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{cls.studentIds.length} alumnos</p>
                  </div>
                </div>
                {teacher && user.role !== 'teacher' && (
                  <div className="mt-4 flex items-center gap-2">
                    <Avatar name={teacher.name} size="xs" />
                    <span className="text-xs text-slate-500">{teacher.name}</span>
                  </div>
                )}
                {cls.schedule && (
                  <p className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {cls.schedule}
                  </p>
                )}
              </Card>
            );
          })}
          {myClasses.length === 0 && (
            <div className="col-span-3 py-8 text-center text-sm text-slate-400">
              No estás en ninguna clase todavía.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
