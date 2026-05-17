import { useState, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { Plus, ClipboardList, Clock, CheckCircle, AlertCircle, Trash2, Edit2, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { format, parseISO, isPast, isToday, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../lib/utils';
import type { Assignment } from '../types';
import toast from 'react-hot-toast';

export default function AssignmentsPage() {
  const { user } = useAuthStore();
  const { assignments, classes, users, addAssignment, updateAssignment, deleteAssignment, submitAssignment, gradeSubmission } = useDataStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [gradeForm, setGradeForm] = useState({ submissionId: '', score: '', feedback: '' });

  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin';
  const isStudent = user?.role === 'student';

  const myClasses = useMemo(() => {
    if (!user) return [];
    if (isAdmin) return classes;
    if (isTeacher) return classes.filter((c) => c.teacherId === user.id);
    return classes.filter((c) => c.studentIds.includes(user.id));
  }, [user, classes, isAdmin, isTeacher]);

  const myAssignments = useMemo(() => {
    return assignments
      .filter((a) => myClasses.some((c) => c.id === a.classId))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [assignments, myClasses]);

  const [form, setForm] = useState({
    title: '', description: '', classId: '', dueDate: '', maxScore: '10'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'El título es obligatorio.';
    if (!form.classId) e.classId = 'Selecciona una clase.';
    if (!form.dueDate) e.dueDate = 'La fecha límite es obligatoria.';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = () => {
    if (!validateForm() || !user) return;
    addAssignment({
      title: form.title,
      description: form.description,
      classId: form.classId,
      createdBy: user.id,
      dueDate: form.dueDate,
      maxScore: Number(form.maxScore) || 10,
      attachments: [],
    });
    toast.success('Tarea creada correctamente.');
    setShowCreateModal(false);
    setForm({ title: '', description: '', classId: '', dueDate: '', maxScore: '10' });
  };

  const handleDelete = (a: Assignment) => {
    if (!confirm(`¿Eliminar la tarea "${a.title}"?`)) return;
    deleteAssignment(a.id);
    toast.success('Tarea eliminada.');
  };

  const handleSubmit = (assignmentId: string) => {
    if (!user) return;
    submitAssignment(assignmentId, user.id, {});
    toast.success('Tarea marcada como entregada.');
  };

  const handleGrade = () => {
    if (!selectedAssignment || !gradeForm.submissionId) return;
    const score = parseFloat(gradeForm.score);
    if (isNaN(score) || score < 0 || score > (selectedAssignment.maxScore || 10)) {
      toast.error(`La nota debe estar entre 0 y ${selectedAssignment.maxScore || 10}.`);
      return;
    }
    gradeSubmission(selectedAssignment.id, gradeForm.submissionId, score, gradeForm.feedback);
    toast.success('Tarea calificada correctamente.');
    setShowGradeModal(false);
    setGradeForm({ submissionId: '', score: '', feedback: '' });
  };

  const getStatusBadge = (a: Assignment) => {
    if (!user || !isStudent) return null;
    const sub = a.submissions.find((s) => s.studentId === user.id);
    if (!sub || sub.status === 'pending') {
      const due = parseISO(a.dueDate);
      if (isPast(due) && !isToday(due)) return <Badge variant="danger">Vencida</Badge>;
      return <Badge variant="warning">Pendiente</Badge>;
    }
    if (sub.status === 'submitted') return <Badge variant="info">Entregada</Badge>;
    if (sub.status === 'graded') return <Badge variant="success">Calificada · {sub.score}/{a.maxScore}</Badge>;
    return null;
  };

  const classOptions = myClasses
    .filter((c) => isTeacher ? c.teacherId === user?.id : true)
    .map((c) => ({ value: c.id, label: c.name }));

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Tareas</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isStudent ? 'Gestiona tus entregas y revisa el progreso.' : 'Crea y gestiona tareas para tus clases.'}
          </p>
        </div>
        {(isTeacher || isAdmin) && (
          <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => { setForm({ title: '', description: '', classId: '', dueDate: '', maxScore: '10' }); setFormErrors({}); setShowCreateModal(true); }}>
            Nueva tarea
          </Button>
        )}
      </div>

      {myAssignments.length === 0 ? (
        <div className="py-16 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-slate-200 mb-3" />
          <p className="text-sm text-slate-500 font-medium">No hay tareas disponibles</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myAssignments.map((a) => {
            const cls = classes.find((c) => c.id === a.classId);
            const due = parseISO(a.dueDate);
            const isOverdue = isPast(due) && !isToday(due);
            const isSoon = !isOverdue && due <= addDays(new Date(), 3);
            const expanded = expandedId === a.id;
            const studentSub = isStudent ? a.submissions.find((s) => s.studentId === user?.id) : null;
            const submittedCount = a.submissions.filter((s) => s.status !== 'pending').length;
            const classStudents = cls ? users.filter((u) => cls.studentIds.includes(u.id)) : [];

            return (
              <Card key={a.id} padding="none" className="overflow-hidden">
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(expanded ? null : a.id)}
                >
                  <div
                    className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cls?.color || '#64748b' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{a.title}</p>
                      {getStatusBadge(a)}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {cls && <span className="text-xs text-slate-400">{cls.name}</span>}
                      <span className={cn('flex items-center gap-1 text-xs', isOverdue ? 'text-red-500' : isSoon ? 'text-amber-500' : 'text-slate-400')}>
                        <Clock className="h-3 w-3" />
                        {format(due, "d 'de' MMM", { locale: es })}
                      </span>
                      {(isTeacher || isAdmin) && (
                        <span className="text-xs text-slate-400">{submittedCount}/{classStudents.length} entregas</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    {(isTeacher || isAdmin) && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(a); }} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                    {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-slate-100 px-5 py-4 space-y-4">
                    {a.description && (
                      <p className="text-sm text-slate-600 leading-relaxed">{a.description}</p>
                    )}

                    {/* Student view */}
                    {isStudent && (
                      <div className="flex items-center gap-3">
                        {(!studentSub || studentSub.status === 'pending') && (
                          <Button size="sm" icon={<CheckCircle className="h-3.5 w-3.5" />} onClick={() => handleSubmit(a.id)}>
                            Marcar como entregada
                          </Button>
                        )}
                        {studentSub?.status === 'submitted' && (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            Entregada — pendiente de calificación
                          </div>
                        )}
                        {studentSub?.status === 'graded' && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                              <Star className="h-4 w-4" />
                              Nota: {studentSub.score}/{a.maxScore}
                            </div>
                            {studentSub.feedback && (
                              <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">{studentSub.feedback}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Teacher view */}
                    {(isTeacher || isAdmin) && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Entregas</p>
                        {classStudents.length === 0 ? (
                          <p className="text-sm text-slate-400">No hay alumnos en esta clase.</p>
                        ) : (
                          <div className="space-y-1">
                            {classStudents.map((student) => {
                              const sub = a.submissions.find((s) => s.studentId === student.id);
                              const status = sub?.status || 'pending';
                              return (
                                <div key={student.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50 transition-colors">
                                  <Avatar name={student.name} size="xs" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900">{student.name}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {status === 'pending' && <Badge variant="neutral">Sin entregar</Badge>}
                                    {status === 'submitted' && (
                                      <>
                                        <Badge variant="info">Entregada</Badge>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          icon={<Star className="h-3 w-3" />}
                                          onClick={() => {
                                            setSelectedAssignment(a);
                                            setGradeForm({ submissionId: sub!.id, score: '', feedback: '' });
                                            setShowGradeModal(true);
                                          }}
                                        >
                                          Calificar
                                        </Button>
                                      </>
                                    )}
                                    {status === 'graded' && (
                                      <Badge variant="success">{sub?.score}/{a.maxScore}</Badge>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nueva tarea" size="lg">
        <div className="space-y-4">
          <Input label="Título" placeholder="Ej: Ejercicios de matrices" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} error={formErrors.title} />
          <Select
            label="Clase"
            value={form.classId}
            onChange={(e) => setForm({ ...form, classId: e.target.value })}
            error={formErrors.classId}
            options={[{ value: '', label: 'Selecciona una clase' }, ...classOptions]}
          />
          <Textarea label="Descripción" placeholder="Describe la tarea con detalle..." rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Fecha límite" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} error={formErrors.dueDate} />
            <Input label="Puntuación máxima" type="number" min="0" max="100" value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: e.target.value })} />
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Crear tarea</Button>
          </div>
        </div>
      </Modal>

      {/* Grade modal */}
      <Modal isOpen={showGradeModal} onClose={() => setShowGradeModal(false)} title="Calificar entrega" size="sm">
        <div className="space-y-4">
          <Input
            label={`Nota (0–${selectedAssignment?.maxScore || 10})`}
            type="number"
            min="0"
            max={selectedAssignment?.maxScore || 10}
            step="0.5"
            placeholder="8.5"
            value={gradeForm.score}
            onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value })}
          />
          <Textarea
            label="Comentario (opcional)"
            placeholder="Feedback para el alumno..."
            value={gradeForm.feedback}
            onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
          />
          <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setShowGradeModal(false)}>Cancelar</Button>
            <Button onClick={handleGrade}>Guardar calificación</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
