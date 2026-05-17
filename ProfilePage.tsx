import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import Card, { CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import { User, Mail, Phone, Save, Shield, GraduationCap, BookOpen, Eye, EyeOff, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ROLE_LABELS, validatePassword } from '../lib/utils';
import toast from 'react-hot-toast';
import { passwordRegistry } from '../store/authStore';

export default function ProfilePage() {
  const { user, updateProfile, isLoading } = useAuthStore();
  const [editMode, setEditMode] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
  });
  const [passForm, setPassForm] = useState({
    current: '',
    newPass: '',
    confirm: '',
  });
  const [passErrors, setPassErrors] = useState<Record<string, string>>({});

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('El nombre no puede estar vacío.'); return; }
    const result = await updateProfile({ name: form.name, phone: form.phone, bio: form.bio });
    if (result.success) {
      toast.success('Perfil actualizado correctamente.');
      setEditMode(false);
    } else {
      toast.error(result.error || 'Error al actualizar el perfil.');
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;
    const e: Record<string, string> = {};

    const currentStored = passwordRegistry[user.email];
    if (passForm.current !== currentStored) e.current = 'Contraseña actual incorrecta.';
    const validation = validatePassword(passForm.newPass);
    if (!validation.valid) e.newPass = validation.errors[0];
    if (passForm.newPass !== passForm.confirm) e.confirm = 'Las contraseñas no coinciden.';
    setPassErrors(e);
    if (Object.keys(e).length > 0) return;

    // Update password in registry
    passwordRegistry[user.email] = passForm.newPass;
    toast.success('Contraseña actualizada correctamente.');
    setChangePassword(false);
    setPassForm({ current: '', newPass: '', confirm: '' });
    setPassErrors({});
  };

  if (!user) return null;

  const roleIcon = user.role === 'admin' ? <Shield className="h-3.5 w-3.5" /> :
    user.role === 'teacher' ? <BookOpen className="h-3.5 w-3.5" /> :
    <GraduationCap className="h-3.5 w-3.5" />;

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Mi Perfil</h1>
        <p className="text-sm text-slate-500 mt-0.5">Gestiona tu información personal y seguridad de la cuenta.</p>
      </div>

      {/* Profile card */}
      <Card padding="md">
        <div className="flex items-start gap-5">
          <Avatar name={user.name} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">{user.name}</h2>
                <p className="text-sm text-slate-500">{user.email}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge
                    variant={user.role === 'admin' ? 'neutral' : user.role === 'teacher' ? 'info' : 'default'}
                    className="flex items-center gap-1"
                  >
                    {roleIcon}
                    {ROLE_LABELS[user.role]}
                  </Badge>
                  <Badge variant={user.status === 'active' ? 'success' : 'danger'}>
                    {user.status === 'active' ? 'Activo' : 'Bloqueado'}
                  </Badge>
                </div>
              </div>
              {!editMode && (
                <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                  Editar perfil
                </Button>
              )}
            </div>
            {user.bio && !editMode && (
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">{user.bio}</p>
            )}
          </div>
        </div>

        {/* Edit form */}
        {editMode && (
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
            <Input
              label="Nombre completo"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              leftIcon={<User className="h-4 w-4" />}
            />
            <Input
              label="Teléfono"
              type="tel"
              placeholder="+34 600 123 456"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              leftIcon={<Phone className="h-4 w-4" />}
            />
            <Textarea
              label="Biografía"
              placeholder="Una breve descripción sobre ti..."
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => { setEditMode(false); setForm({ name: user.name, phone: user.phone || '', bio: user.bio || '' }); }}>
                Cancelar
              </Button>
              <Button loading={isLoading} icon={<Save className="h-3.5 w-3.5" />} onClick={handleSave}>
                Guardar cambios
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Account info */}
      <Card padding="md">
        <CardHeader>
          <CardTitle>Información de la cuenta</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          {[
            { label: 'Correo electrónico', value: user.email, icon: <Mail className="h-4 w-4" /> },
            { label: 'Miembro desde', value: format(new Date(user.createdAt), "d 'de' MMMM yyyy", { locale: es }), icon: <User className="h-4 w-4" /> },
            { label: 'Último acceso', value: user.lastLogin ? format(new Date(user.lastLogin), "d MMM yyyy 'a las' HH:mm", { locale: es }) : 'Nunca', icon: <Shield className="h-4 w-4" /> },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                {item.icon}
              </div>
              <div>
                <p className="text-xs text-slate-400">{item.label}</p>
                <p className="text-sm font-medium text-slate-700">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Security */}
      <Card padding="md">
        <CardHeader>
          <CardTitle>Seguridad</CardTitle>
          {!changePassword && (
            <Button variant="outline" size="sm" icon={<Lock className="h-3.5 w-3.5" />} onClick={() => setChangePassword(true)}>
              Cambiar contraseña
            </Button>
          )}
        </CardHeader>

        {changePassword ? (
          <div className="space-y-4">
            <Input
              label="Contraseña actual"
              type={showPass ? 'text' : 'password'}
              value={passForm.current}
              onChange={(e) => setPassForm({ ...passForm, current: e.target.value })}
              error={passErrors.current}
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowPass((v) => !v)} className="text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            <Input
              label="Nueva contraseña"
              type={showPass ? 'text' : 'password'}
              value={passForm.newPass}
              onChange={(e) => setPassForm({ ...passForm, newPass: e.target.value })}
              error={passErrors.newPass}
              hint="Mínimo 8 caracteres, una mayúscula, un número y un carácter especial."
              leftIcon={<Lock className="h-4 w-4" />}
            />
            <Input
              label="Confirmar nueva contraseña"
              type={showPass ? 'text' : 'password'}
              value={passForm.confirm}
              onChange={(e) => setPassForm({ ...passForm, confirm: e.target.value })}
              error={passErrors.confirm}
              leftIcon={<Lock className="h-4 w-4" />}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => { setChangePassword(false); setPassForm({ current: '', newPass: '', confirm: '' }); setPassErrors({}); }}>
                Cancelar
              </Button>
              <Button onClick={handleChangePassword}>
                Actualizar contraseña
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Mantén tu cuenta segura actualizando tu contraseña regularmente.
          </p>
        )}
      </Card>
    </div>
  );
}
