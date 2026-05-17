import { useState, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import { Plus, BookOpen, Users, Clock, Copy, Search, Archive, Trash2, Edit2, UserPlus, Hash } from 'lucide-react';
import { cn, generateClassCode } from '../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import type { Class } from '../types';

const CLASS_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#06b6d4', '#f97316'];

export default function ClassesPage() {
  const { user } = useAuthStore();
  const { classes, users, assignments, addEvent, addClass, updateClass, deleteClass, archiveClass, addStudentToClass, removeStudentFromClass, joinClassByCode } = useDataStore();
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');

  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin';
  const isStudent = user?.role === 'student';

  const myClasses = useMemo(() => {
    if (!user) return [];
    if (isAdmin) return classes;
    if (isTeacher) return classes.filter((c) => c.teacherId === user.id);
    return classes.filter((c) => c.studentIds.includes(user.id));
  }, [user, classes, isAdmin, isTeacher]);

  const filteredClasses = useMemo(() =>
    myClasses.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.subject.toLowerCase().includes(search.toLowerCase())
    ), [myClasses, search]);

  const [form, setForm] = useState({
    name: '', subject: '', description: '', schedule: '', room: '', color: CLASS_COLORS[0]
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'El nombre es obligatorio.';
    if (!form.subject.trim()) e.subject = 'La asignatura es obligatoria.';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = () => {
    if (!validateForm() || !user) return;
    addClass({ name: form.name, subject: form.subject, description: form.description, schedule: form.schedule, room: form.room, color: form.color, teacherId: user.id, studentIds: [] });
    toast.success('Clase creada correctamente.');
    setShowCreateModal(false);
    setForm({ name: '', subject: '', description: '', schedule: '', room: '', color: CLASS_COLORS[0] });
  };

  const handleEdit = () => {
    if (!validateForm() || !selectedClass) return;
    updateClass(selectedClass.id, { name: form.name, subject: form.subject, description: form.description, schedule: form.schedule, room: form.room, color: form.color });
    toast.success('Clase actualizada.');
    setShowEditModal(false);
  };

  const openEdit = (cls: Class) => {
    setSelectedClass(cls);
    setForm({ name: cls.name, subject: cls.subject, description: cls.description || '', schedule: cls.schedule || '', room: cls.room || '', color: cls.color });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleDelete = (cls: Class) => {
    if (!confirm(`¿Eliminar la clase "${cls.name}"? Esta acción no se puede deshacer.`)) return;
    deleteClass(cls.id);
    toast.success('Clase eliminada.');
  };

  const handleArchive = (cls: Class) => {
    archiveClass(cls.id);
    toast.success(cls.isArchived ? 'Clase activada.' : 'Clase archivada.');
  };

  const handleJoin = () => {
    if (!joinCode.trim()) { setJoinError('Introduce el código de clase.'); return; }
    if (!user) return;
    const result = joinClassByCode(joinCode.trim(), user.id);
    if (result.success) {
      toast.success('Te has unido a la clase correctamente.');
      setShowJoinModal(false);
      setJoinCode('');
      setJoinError('');
    } else {
      setJoinError(result.error || 'Error al unirse a la clase.');
    }
  };

  const openStudents = (cls: Class) => {
    setSelectedClass(cls);
    setShowStudentsModal(true);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado al portapapeles.');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar clases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-100"
          />
        </div>
        <div className="flex gap-2">
          {isStudent && (
            <Button variant="outline" size="sm" icon={<Hash className="h-3.5 w-3.5" />} onClick={() => setShowJoinModal(true)}>
              Unirse con código
            </Button>
          )}
          {(isTeacher || isAdmin) && (
            <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => { setForm({ name: '', subject: '', description: '', schedule: '', room: '', color: CLASS_COLORS[0] }); setFormErrors({}); setShowCreateModal(true); }}>
              Nueva clase
            </Button>
          )}
        </div>
      </div>

      {/* Classes grid */}
      {filteredClasses.length === 0 ? (
        <div className="py-16 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-slate-200 mb-3" />
          <p className="text-sm text-slate-500 font-medium">No hay clases disponibles</p>
          <p className="text-xs text-slate-400 mt-1">
            {isStudent ? 'Únete a una clase con un código de acceso.' : 'Crea tu primera clase para comenzar.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map((cls) => {
            const teacher = users.find((u) => u.id === cls.teacherId);
            const classAssignments = assignments.filter((a) => a.classId === cls.id);
            return (
              <Card key={cls.id} padding="none" className={cn('overflow-hidden', cls.isArchived && 'opacity-60')}>
                {/* Color bar */}
                <div className="h-1.5 w-full" style={{ backgroundColor: cls.color }} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-9 w-9 rounded-lg flex-shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: cls.color + '15', color: cls.color }}
                      >
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{cls.name}</h3>
                        <p className="text-xs text-slate-500">{cls.subject}</p>
                      </div>
                    </div>
                    {cls.isArchived && <Badge variant="neutral">Archivada</Badge>}
                  </div>

                  {cls.description && (
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2">{cls.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Users className="h-3.5 w-3.5" />
                      <span>{cls.studentIds.length} alumnos</span>
                    </div>
                    {cls.schedule && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="truncate">{cls.schedule}</span>
                      </div>
                    )}
                  </div>

                  {/* Teacher */}
                  {teacher && !isTeacher && (
                    <div className="flex items-center gap-2 mb-4">
                      <Avatar name={teacher.name} size="xs" />
                      <span className="text-xs text-slate-500">{teacher.name}</span>
                    </div>
                  )}

                  {/* Class code */}
                  {(isTeacher || isAdmin) && (
                    <div className="flex items-center gap-2 mb-4 bg-slate-50 rounded-lg px-3 py-2">
                      <Hash className="h-3.5 w-3.5 text-slate-400" />
                      <code className="text-xs font-mono font-medium text-slate-700 flex-1">{cls.code}</code>
                      <button onClick={() => copyCode(cls.code)} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                    {(isTeacher || isAdmin) && (
                      <>
                        <Button variant="ghost" size="sm" icon={<Users className="h-3.5 w-3.5" />} onClick={() => openStudents(cls)}>
                          Alumnos
                        </Button>
                        <button onClick={() => openEdit(cls)} className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleArchive(cls)} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(cls)} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                    {isStudent && (
                      <span className="text-xs text-slate-400">{classAssignments.length} tarea(s)</span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nueva clase" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nombre de la clase" placeholder="2º Bach A — Matemáticas" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={formErrors.name} />
            <Input label="Asignatura" placeholder="Matemáticas" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} error={formErrors.subject} />
          </div>
          <Textarea label="Descripción" placeholder="Describe el contenido de la clase..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Horario" placeholder="Lun/Mié 09:00–10:00" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} />
            <Input label="Aula / Sala" placeholder="Aula 204" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Color</label>
            <div className="flex gap-2">
              {CLASS_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                  className={cn('h-7 w-7 rounded-full transition-transform', form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-300' : 'hover:scale-110')}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Crear clase</Button>
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Editar clase" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nombre de la clase" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={formErrors.name} />
            <Input label="Asignatura" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} error={formErrors.subject} />
          </div>
          <Textarea label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Horario" value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} />
            <Input label="Aula / Sala" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Color</label>
            <div className="flex gap-2">
              {CLASS_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                  className={cn('h-7 w-7 rounded-full transition-transform', form.color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-300' : 'hover:scale-110')}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>Cancelar</Button>
            <Button onClick={handleEdit}>Guardar cambios</Button>
          </div>
        </div>
      </Modal>

      {/* Join modal */}
      <Modal isOpen={showJoinModal} onClose={() => { setShowJoinModal(false); setJoinCode(''); setJoinError(''); }} title="Unirse a una clase" description="Introduce el código que te ha proporcionado tu profesor." size="sm">
        <div className="space-y-4">
          <Input
            label="Código de clase"
            placeholder="MAT2A-7X4"
            value={joinCode}
            onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
            error={joinError}
            leftIcon={<Hash className="h-4 w-4" />}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowJoinModal(false)}>Cancelar</Button>
            <Button onClick={handleJoin}>Unirse</Button>
          </div>
        </div>
      </Modal>

      {/* Students modal */}
      <Modal isOpen={showStudentsModal && !!selectedClass} onClose={() => setShowStudentsModal(false)} title={`Alumnos — ${selectedClass?.name}`} size="md">
        {selectedClass && (
          <div className="space-y-3">
            {selectedClass.studentIds.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No hay alumnos en esta clase.</p>
            ) : (
              <div className="space-y-1">
                {selectedClass.studentIds.map((sid) => {
                  const student = users.find((u) => u.id === sid);
                  if (!student) return null;
                  return (
                    <div key={sid} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50 transition-colors group">
                      <Avatar name={student.name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{student.name}</p>
                        <p className="text-xs text-slate-400">{student.email}</p>
                      </div>
                      {(isTeacher || isAdmin) && (
                        <button
                          onClick={() => { removeStudentFromClass(selectedClass.id, sid); toast.success('Alumno eliminado de la clase.'); }}
                          className="opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Código de acceso: <code className="font-mono font-medium text-slate-700">{selectedClass.code}</code>
                <button onClick={() => copyCode(selectedClass.code)} className="ml-2 text-slate-400 hover:text-slate-600">
                  <Copy className="h-3 w-3 inline" />
                </button>
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
