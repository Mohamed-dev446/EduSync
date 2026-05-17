import { useState, useMemo, useCallback } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isToday,
  addMonths, subMonths, addWeeks, subWeeks, addDays, subDays,
  parseISO, isSameDay, getHours, getMinutes
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import { cn, EVENT_TYPE_LABELS, EVENT_TYPE_COLORS, generateId } from '../lib/utils';
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon,
  Clock, Trash2, Edit2, X, AlignLeft
} from 'lucide-react';
import type { CalendarEvent, CalendarView, EventType, RecurrenceType } from '../types';
import toast from 'react-hot-toast';

const HOUR_HEIGHT = 60; // px per hour in week/day view
const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function CalendarPage() {
  const { user } = useAuthStore();
  const { events, classes, addEvent, updateEvent, deleteEvent } = useDataStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [preselectedDate, setPreselectedDate] = useState<string>('');

  const canEdit = user?.role === 'admin' || user?.role === 'teacher';

  // ─── Filter events for current user ─────────────────────────────────────────
  const myClasses = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin') return classes;
    if (user.role === 'teacher') return classes.filter((c) => c.teacherId === user.id);
    return classes.filter((c) => c.studentIds.includes(user.id));
  }, [user, classes]);

  const visibleEvents = useMemo(() => {
    return events.filter((e) => {
      if (user?.role === 'admin') return true;
      if (!e.classId) return e.createdBy === user?.id || e.type === 'holiday';
      return myClasses.some((c) => c.id === e.classId);
    });
  }, [events, user, myClasses]);

  const getEventsForDate = useCallback((date: Date) => {
    return visibleEvents.filter((e) => isSameDay(parseISO(e.date), date));
  }, [visibleEvents]);

  // ─── Navigation ───────────────────────────────────────────────────────────
  const navigate = (dir: 1 | -1) => {
    if (view === 'month') setCurrentDate(dir === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(dir === 1 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    else setCurrentDate(dir === 1 ? addDays(currentDate, 1) : subDays(currentDate, 1));
  };

  const currentLabel = () => {
    if (view === 'month') return format(currentDate, "MMMM yyyy", { locale: es });
    if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(start, "d MMM", { locale: es })} – ${format(end, "d MMM yyyy", { locale: es })}`;
    }
    return format(currentDate, "EEEE, d 'de' MMMM yyyy", { locale: es });
  };

  // ─── Month view ───────────────────────────────────────────────────────────
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // ─── Week view ────────────────────────────────────────────────────────────
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  // ─── Event form ───────────────────────────────────────────────────────────
  const emptyForm = {
    title: '',
    description: '',
    date: preselectedDate || format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    type: 'class' as EventType,
    classId: '',
    recurrence: 'none' as RecurrenceType,
    reminder: 30,
    color: '#3b82f6',
  };

  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const openCreate = (date?: string) => {
    const d = date || format(new Date(), 'yyyy-MM-dd');
    setPreselectedDate(d);
    setForm({ ...emptyForm, date: d });
    setFormErrors({});
    setEditMode(false);
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const openEdit = (event: CalendarEvent) => {
    setForm({
      title: event.title,
      description: event.description || '',
      date: event.date,
      startTime: event.startTime || '09:00',
      endTime: event.endTime || '10:00',
      type: event.type,
      classId: event.classId || '',
      recurrence: event.recurrence,
      reminder: event.reminder || 30,
      color: event.color || EVENT_TYPE_COLORS[event.type],
    });
    setFormErrors({});
    setEditMode(true);
    setShowDetailModal(false);
    setShowEventModal(true);
  };

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'El título es obligatorio.';
    if (!form.date) e.date = 'La fecha es obligatoria.';
    if (form.startTime >= form.endTime) e.endTime = 'La hora de fin debe ser posterior a la de inicio.';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveEvent = () => {
    if (!validateForm() || !user) return;
    if (editMode && selectedEvent) {
      updateEvent(selectedEvent.id, {
        ...form,
        color: form.color || EVENT_TYPE_COLORS[form.type],
      });
      toast.success('Evento actualizado.');
    } else {
      addEvent({
        ...form,
        createdBy: user.id,
        color: form.color || EVENT_TYPE_COLORS[form.type],
        attendees: [],
      });
      toast.success('Evento creado.');
    }
    setShowEventModal(false);
  };

  const handleDeleteEvent = (event: CalendarEvent) => {
    deleteEvent(event.id);
    setShowDetailModal(false);
    toast.success('Evento eliminado.');
  };

  const eventTypeOptions = Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => ({ value, label }));
  const recurrenceOptions = [
    { value: 'none', label: 'Sin repetición' },
    { value: 'daily', label: 'Diariamente' },
    { value: 'weekly', label: 'Semanalmente' },
    { value: 'monthly', label: 'Mensualmente' },
  ];
  const classOptions = [
    { value: '', label: 'Sin clase (evento general)' },
    ...myClasses.map((c) => ({ value: c.id, label: c.name })),
  ];

  const getEventBadgeColor = (type: EventType) => {
    const map: Record<EventType, string> = {
      class: 'bg-blue-100 text-blue-700',
      exam: 'bg-red-100 text-red-700',
      assignment: 'bg-amber-100 text-amber-700',
      holiday: 'bg-slate-100 text-slate-600',
      meeting: 'bg-violet-100 text-violet-700',
      other: 'bg-emerald-100 text-emerald-700',
    };
    return map[type];
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 bg-white flex-shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Hoy
          </button>
          <button onClick={() => navigate(-1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => navigate(1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <h2 className="text-sm font-semibold text-slate-900 capitalize flex-1">{currentLabel()}</h2>

        {/* View switcher */}
        <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden">
          {(['month', 'week', 'day'] as CalendarView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                view === v ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              {v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : 'Día'}
            </button>
          ))}
        </div>

        {canEdit && (
          <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => openCreate()}>
            Nuevo evento
          </Button>
        )}
      </div>

      {/* Calendar body */}
      <div className="flex-1 overflow-auto bg-white">
        {view === 'month' && (
          <MonthView
            days={monthDays}
            currentDate={currentDate}
            getEventsForDate={getEventsForDate}
            onDayClick={(d) => canEdit && openCreate(format(d, 'yyyy-MM-dd'))}
            onEventClick={(e) => { setSelectedEvent(e); setShowDetailModal(true); }}
            getEventBadgeColor={getEventBadgeColor}
          />
        )}
        {view === 'week' && (
          <WeekView
            days={weekDays}
            getEventsForDate={getEventsForDate}
            onSlotClick={(date, hour) => {
              if (canEdit) {
                const d = format(date, 'yyyy-MM-dd');
                const h = String(hour).padStart(2, '0');
                openCreate(d);
                setForm((f) => ({ ...f, date: d, startTime: `${h}:00`, endTime: `${String(hour + 1).padStart(2, '0')}:00` }));
              }
            }}
            onEventClick={(e) => { setSelectedEvent(e); setShowDetailModal(true); }}
          />
        )}
        {view === 'day' && (
          <DayView
            date={currentDate}
            events={getEventsForDate(currentDate)}
            onSlotClick={(hour) => {
              if (canEdit) {
                const d = format(currentDate, 'yyyy-MM-dd');
                const h = String(hour).padStart(2, '0');
                setForm((f) => ({ ...f, date: d, startTime: `${h}:00`, endTime: `${String(hour + 1).padStart(2, '0')}:00` }));
                openCreate(d);
              }
            }}
            onEventClick={(e) => { setSelectedEvent(e); setShowDetailModal(true); }}
          />
        )}
      </div>

      {/* Event Detail Modal */}
      <Modal
        isOpen={showDetailModal && !!selectedEvent}
        onClose={() => setShowDetailModal(false)}
        size="md"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div
                className="mt-1 h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: selectedEvent.color || EVENT_TYPE_COLORS[selectedEvent.type] }}
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-slate-900">{selectedEvent.title}</h2>
                <span className={cn('mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', getEventBadgeColor(selectedEvent.type))}>
                  {EVENT_TYPE_LABELS[selectedEvent.type]}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2.5 text-slate-600">
                <CalendarIcon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <span>{format(parseISO(selectedEvent.date), "EEEE, d 'de' MMMM yyyy", { locale: es })}</span>
              </div>
              {selectedEvent.startTime && (
                <div className="flex items-center gap-2.5 text-slate-600">
                  <Clock className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <span>{selectedEvent.startTime}{selectedEvent.endTime && ` — ${selectedEvent.endTime}`}</span>
                </div>
              )}
              {selectedEvent.description && (
                <div className="flex items-start gap-2.5 text-slate-600">
                  <AlignLeft className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{selectedEvent.description}</p>
                </div>
              )}
              {selectedEvent.recurrence !== 'none' && (
                <div className="flex items-center gap-2.5 text-slate-500 text-xs">
                  <span>Recurrencia: {recurrenceOptions.find(r => r.value === selectedEvent.recurrence)?.label}</span>
                </div>
              )}
            </div>

            {canEdit && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <Button variant="secondary" size="sm" icon={<Edit2 className="h-3.5 w-3.5" />} onClick={() => openEdit(selectedEvent)}>
                  Editar
                </Button>
                <Button variant="danger" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => handleDeleteEvent(selectedEvent)}>
                  Eliminar
                </Button>
                <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setShowDetailModal(false)}>
                  Cerrar
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create / Edit Event Modal */}
      <Modal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        title={editMode ? 'Editar evento' : 'Nuevo evento'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Título"
            placeholder="Ej: Examen de Matemáticas"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            error={formErrors.title}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Tipo"
              value={form.type}
              onChange={(e) => {
                const type = e.target.value as EventType;
                setForm({ ...form, type, color: EVENT_TYPE_COLORS[type] });
              }}
              options={eventTypeOptions}
            />
            <Select
              label="Clase"
              value={form.classId}
              onChange={(e) => setForm({ ...form, classId: e.target.value })}
              options={classOptions}
            />
          </div>
          <Input
            label="Fecha"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            error={formErrors.date}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Hora de inicio"
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
            <Input
              label="Hora de fin"
              type="time"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              error={formErrors.endTime}
            />
          </div>
          <Textarea
            label="Descripción (opcional)"
            placeholder="Descripción del evento..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Repetición"
              value={form.recurrence}
              onChange={(e) => setForm({ ...form, recurrence: e.target.value as RecurrenceType })}
              options={recurrenceOptions}
            />
            <Select
              label="Recordatorio"
              value={String(form.reminder)}
              onChange={(e) => setForm({ ...form, reminder: Number(e.target.value) })}
              options={[
                { value: '0', label: 'Sin recordatorio' },
                { value: '15', label: '15 minutos antes' },
                { value: '30', label: '30 minutos antes' },
                { value: '60', label: '1 hora antes' },
                { value: '1440', label: '1 día antes' },
              ]}
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700">Color</label>
            <div className="flex gap-2">
              {['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#6366f1', '#64748b'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={cn(
                    'h-6 w-6 rounded-full transition-transform',
                    form.color === c ? 'scale-125 ring-2 ring-offset-1 ring-slate-400' : 'hover:scale-110'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end pt-2 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setShowEventModal(false)}>Cancelar</Button>
            <Button onClick={handleSaveEvent}>
              {editMode ? 'Guardar cambios' : 'Crear evento'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Month View ────────────────────────────────────────────────────────────────
function MonthView({
  days, currentDate, getEventsForDate, onDayClick, onEventClick, getEventBadgeColor
}: {
  days: Date[];
  currentDate: Date;
  getEventsForDate: (d: Date) => CalendarEvent[];
  onDayClick: (d: Date) => void;
  onEventClick: (e: CalendarEvent) => void;
  getEventBadgeColor: (t: EventType) => string;
}) {
  return (
    <div className="min-h-full">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-100">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-slate-400 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const evts = getEventsForDate(day);
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);

          return (
            <div
              key={idx}
              onClick={() => onDayClick(day)}
              className={cn(
                'min-h-[110px] border-b border-r border-slate-50 p-1.5 cursor-pointer group',
                'transition-colors hover:bg-slate-50',
                !inMonth && 'bg-slate-50/50'
              )}
            >
              <div className="mb-1 flex justify-start">
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors',
                    today
                      ? 'bg-slate-900 text-white'
                      : inMonth
                      ? 'text-slate-700 group-hover:bg-slate-100'
                      : 'text-slate-300'
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>
              <div className="space-y-0.5">
                {evts.slice(0, 3).map((evt) => (
                  <button
                    key={evt.id}
                    onClick={(e) => { e.stopPropagation(); onEventClick(evt); }}
                    className={cn(
                      'w-full text-left px-1.5 py-0.5 rounded text-xs font-medium truncate transition-opacity hover:opacity-80',
                      getEventBadgeColor(evt.type)
                    )}
                    style={{ borderLeft: `2px solid ${evt.color || '#64748b'}` }}
                  >
                    {evt.startTime && <span className="mr-1 opacity-60">{evt.startTime}</span>}
                    {evt.title}
                  </button>
                ))}
                {evts.length > 3 && (
                  <p className="text-xs text-slate-400 px-1.5">+{evts.length - 3} más</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Week View ─────────────────────────────────────────────────────────────────
function WeekView({
  days, getEventsForDate, onSlotClick, onEventClick
}: {
  days: Date[];
  getEventsForDate: (d: Date) => CalendarEvent[];
  onSlotClick: (date: Date, hour: number) => void;
  onEventClick: (e: CalendarEvent) => void;
}) {
  const now = new Date();
  const currentHour = getHours(now);
  const currentMinute = getMinutes(now);

  return (
    <div className="flex flex-col min-h-full">
      {/* Day headers */}
      <div className="flex border-b border-slate-100 sticky top-0 bg-white z-10">
        <div className="w-14 flex-shrink-0 border-r border-slate-100" />
        {days.map((day, i) => (
          <div key={i} className="flex-1 py-2 text-center border-r border-slate-100 last:border-r-0">
            <p className="text-xs font-medium text-slate-400 uppercase">{format(day, 'EEE', { locale: es })}</p>
            <p className={cn(
              'text-sm font-semibold mt-0.5',
              isToday(day) ? 'text-blue-600' : 'text-slate-700'
            )}>
              {format(day, 'd')}
            </p>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="flex flex-1 relative">
        {/* Time labels */}
        <div className="w-14 flex-shrink-0 border-r border-slate-100">
          {HOURS.map((h) => (
            <div key={h} style={{ height: HOUR_HEIGHT }} className="relative border-b border-slate-50">
              <span className="absolute -top-2.5 right-2 text-xs text-slate-400">
                {h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day, dayIdx) => {
          const dayEvents = getEventsForDate(day);
          return (
            <div key={dayIdx} className="flex-1 border-r border-slate-100 last:border-r-0 relative">
              {HOURS.map((h) => (
                <div
                  key={h}
                  style={{ height: HOUR_HEIGHT }}
                  className="border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => onSlotClick(day, h)}
                />
              ))}
              {/* Events */}
              {dayEvents.map((evt) => {
                if (!evt.startTime) return null;
                const [sh, sm] = evt.startTime.split(':').map(Number);
                const [eh, em] = (evt.endTime || `${sh + 1}:00`).split(':').map(Number);
                const top = (sh + sm / 60) * HOUR_HEIGHT;
                const height = Math.max(((eh + em / 60) - (sh + sm / 60)) * HOUR_HEIGHT, 24);
                return (
                  <button
                    key={evt.id}
                    onClick={(e) => { e.stopPropagation(); onEventClick(evt); }}
                    className="absolute left-0.5 right-0.5 rounded overflow-hidden text-left px-1.5 py-1 text-xs font-medium hover:brightness-95 transition-all z-10"
                    style={{
                      top,
                      height,
                      backgroundColor: (evt.color || '#3b82f6') + '30',
                      borderLeft: `3px solid ${evt.color || '#3b82f6'}`,
                      color: evt.color || '#3b82f6',
                    }}
                  >
                    <span className="font-semibold block truncate">{evt.title}</span>
                    {height > 30 && <span className="opacity-70">{evt.startTime}</span>}
                  </button>
                );
              })}
              {/* Current time indicator */}
              {isToday(day) && (
                <div
                  className="absolute left-0 right-0 z-20 pointer-events-none"
                  style={{ top: (currentHour + currentMinute / 60) * HOUR_HEIGHT }}
                >
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-blue-500 -ml-1" />
                    <div className="h-px flex-1 bg-blue-500" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Day View ──────────────────────────────────────────────────────────────────
function DayView({
  date, events, onSlotClick, onEventClick
}: {
  date: Date;
  events: CalendarEvent[];
  onSlotClick: (hour: number) => void;
  onEventClick: (e: CalendarEvent) => void;
}) {
  const now = new Date();
  const currentHour = getHours(now);
  const currentMinute = getMinutes(now);

  return (
    <div className="flex">
      <div className="w-16 flex-shrink-0 border-r border-slate-100">
        {HOURS.map((h) => (
          <div key={h} style={{ height: HOUR_HEIGHT }} className="relative border-b border-slate-50">
            <span className="absolute -top-2.5 right-3 text-xs text-slate-400">
              {h === 0 ? '' : `${String(h).padStart(2, '0')}:00`}
            </span>
          </div>
        ))}
      </div>
      <div className="flex-1 relative">
        {HOURS.map((h) => (
          <div
            key={h}
            style={{ height: HOUR_HEIGHT }}
            className="border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => onSlotClick(h)}
          />
        ))}
        {events.map((evt) => {
          if (!evt.startTime) return null;
          const [sh, sm] = evt.startTime.split(':').map(Number);
          const [eh, em] = (evt.endTime || `${sh + 1}:00`).split(':').map(Number);
          const top = (sh + sm / 60) * HOUR_HEIGHT;
          const height = Math.max(((eh + em / 60) - (sh + sm / 60)) * HOUR_HEIGHT, 28);
          return (
            <button
              key={evt.id}
              onClick={() => onEventClick(evt)}
              className="absolute left-2 right-2 rounded-lg px-3 py-1.5 text-left text-sm font-medium hover:brightness-95 transition-all z-10 shadow-sm"
              style={{
                top,
                height,
                backgroundColor: (evt.color || '#3b82f6') + '20',
                borderLeft: `4px solid ${evt.color || '#3b82f6'}`,
                color: evt.color || '#3b82f6',
              }}
            >
              <span className="font-semibold block">{evt.title}</span>
              {height > 32 && <span className="text-xs opacity-70">{evt.startTime} — {evt.endTime}</span>}
            </button>
          );
        })}
        {isToday(date) && (
          <div
            className="absolute left-0 right-0 z-20 pointer-events-none"
            style={{ top: (currentHour + currentMinute / 60) * HOUR_HEIGHT }}
          >
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-blue-500 -ml-1" />
              <div className="h-px flex-1 bg-blue-500" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
