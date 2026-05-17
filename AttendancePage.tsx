import { useState, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import Card, { CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { UserCheck, Save, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { format, parseISO, subDays, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

export default function AttendancePage() {
  const { user } = useAuthStore();
  const { classes, users, attendance, saveAttendance } = useDataStore();
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [records, setRecords] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const myClasses = useMemo(() => {
    if (!user) return [];
    return classes.filter((c) => c.teacherId === user.id && !c.isArchived);
  }, [user, classes]);

  const selectedClass = myClasses.find((c) => c.id === selectedClassId);

  const students = useMemo(() => {
    if (!selectedClass) return [];
    return users.filter((u) => selectedClass.studentIds.includes(u.id));
  }, [selectedClass, users]);

  // Load existing records when class/date changes
  useMemo(() => {
    if (!selectedClassId || !selectedDate) return;
    const existing = attendance.find(
      (a) => a.classId === selectedClassId && a.date === selectedDate
    );
    if (existing) {
      const r: Record<string, boolean> = {};
      const n: Record<string, string> = {};
      existing.records.forEach((rec) => {
        r[rec.studentId] = rec.present;
        if (rec.note) n[rec.studentId] = rec.note;
      });
      setRecords(r);
      setNotes(n);
    } else {
      // Default: all present
      const r: Record<string, boolean> = {};
      students.forEach((s) => { r[s.id] = true; });
      setRecords(r);
      setNotes({});
    }
    setSaved(false);
  }, [selectedClassId, selectedDate, attendance]);

  const handleSave = () => {
    if (!selectedClassId || !user) return;
    saveAttendance({
      classId: selectedClassId,
      date: selectedDate,
      records: students.map((s) => ({
        studentId: s.id,
        present: records[s.id] ?? true,
        note: notes[s.id],
      })),
      createdBy: user.id,
    });
    setSaved(true);
    toast.success('Asistencia guardada correctamente.');
  };

  // Stats
  const classAttendance = attendance.filter((a) => a.classId === selectedClassId);
  const attendanceRate = useMemo(() => {
    if (!selectedClass || classAttendance.length === 0) return null;
    const total = classAttendance.reduce((acc, r) => acc + r.records.length, 0);
    const present = classAttendance.reduce((acc, r) => acc + r.records.filter((rec) => rec.present).length, 0);
    return total > 0 ? Math.round((present / total) * 100) : null;
  }, [selectedClass, classAttendance]);

  const presentCount = students.filter((s) => records[s.id] !== false).length;
  const absentCount = students.length - presentCount;

  const classOptions = [
    { value: '', label: 'Selecciona una clase' },
    ...myClasses.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Control de Asistencia</h1>
        <p className="text-sm text-slate-500 mt-0.5">Registra la asistencia diaria de tus alumnos.</p>
      </div>

      {/* Controls */}
      <Card padding="md">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-48">
            <Select
              label="Clase"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              options={classOptions}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Fecha</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedDate(format(subDays(parseISO(selectedDate), 1), 'yyyy-MM-dd'))}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
              <button
                onClick={() => setSelectedDate(format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd'))}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {!selectedClassId ? (
        <div className="py-12 text-center">
          <UserCheck className="mx-auto h-10 w-10 text-slate-200 mb-3" />
          <p className="text-sm text-slate-500">Selecciona una clase para registrar la asistencia.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Attendance list */}
          <div className="lg:col-span-2">
            <Card padding="none">
              <CardHeader className="px-5 pt-5 pb-0">
                <div>
                  <CardTitle>
                    {format(parseISO(selectedDate), "EEEE, d 'de' MMMM", { locale: es })}
                  </CardTitle>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedClass?.name}</p>
                </div>
                <Button size="sm" icon={<Save className="h-3.5 w-3.5" />} onClick={handleSave}>
                  Guardar
                </Button>
              </CardHeader>
              {students.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-slate-400">No hay alumnos en esta clase.</div>
              ) : (
                <div className="mt-4 divide-y divide-slate-50">
                  {students.map((student) => {
                    const present = records[student.id] !== false;
                    return (
                      <div key={student.id} className="flex items-center gap-4 px-5 py-3">
                        <Avatar name={student.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">{student.name}</p>
                          <p className="text-xs text-slate-400">{student.email}</p>
                        </div>
                        {/* Toggle buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setRecords((r) => ({ ...r, [student.id]: true }))}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                              present
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            )}
                          >
                            Presente
                          </button>
                          <button
                            onClick={() => setRecords((r) => ({ ...r, [student.id]: false }))}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                              !present
                                ? 'bg-red-500 text-white'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            )}
                          >
                            Ausente
                          </button>
                        </div>
                        {/* Note for absent */}
                        {!present && (
                          <input
                            type="text"
                            placeholder="Motivo (opcional)"
                            value={notes[student.id] || ''}
                            onChange={(e) => setNotes((n) => ({ ...n, [student.id]: e.target.value }))}
                            className="w-32 rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-300"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {saved && (
                <div className="px-5 py-3 bg-emerald-50 border-t border-emerald-100">
                  <p className="text-xs text-emerald-700 font-medium">Asistencia guardada correctamente.</p>
                </div>
              )}
            </Card>
          </div>

          {/* Stats */}
          <div className="space-y-4">
            {/* Today summary */}
            <Card padding="md">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Resumen del día</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Presentes</span>
                  <span className="text-sm font-semibold text-emerald-600">{presentCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Ausentes</span>
                  <span className="text-sm font-semibold text-red-500">{absentCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total</span>
                  <span className="text-sm font-semibold text-slate-900">{students.length}</span>
                </div>
                {students.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-slate-500">Tasa hoy</span>
                      <span className="text-xs font-medium text-slate-700">{Math.round((presentCount / students.length) * 100)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${(presentCount / students.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Overall stats */}
            {attendanceRate !== null && (
              <Card padding="md">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-900">Estadística general</h3>
                </div>
                <div className="text-center py-2">
                  <p className="text-3xl font-bold text-slate-900">{attendanceRate}%</p>
                  <p className="text-xs text-slate-400 mt-1">Tasa de asistencia media</p>
                </div>
                <div className="mt-3">
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${attendanceRate}%`,
                        backgroundColor: attendanceRate >= 80 ? '#10b981' : attendanceRate >= 60 ? '#f59e0b' : '#ef4444'
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">{classAttendance.length} registros totales</p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
