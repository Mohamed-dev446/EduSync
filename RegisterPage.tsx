import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import { GraduationCap, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import type { UserRole } from '../../types';

export default function RegisterPage() {
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as UserRole,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'El nombre es obligatorio.';
    if (!form.email) e.email = 'El correo es obligatorio.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Correo inválido.';
    if (!form.password) e.password = 'La contraseña es obligatoria.';
    else if (form.password.length < 8) e.password = 'Mínimo 8 caracteres.';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Debe tener al menos una mayúscula.';
    else if (!/[0-9]/.test(form.password)) e.password = 'Debe tener al menos un número.';
    else if (!/[!@#$%^&*]/.test(form.password)) e.password = 'Debe tener un carácter especial.';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await register({ name: form.name, email: form.email, password: form.password, role: form.role });
    if (result.success) {
      toast.success('Cuenta creada correctamente. Bienvenido a EduSync.');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Error al crear la cuenta.');
    }
  };

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[!@#$%^&*]/.test(p)) score++;
    return score;
  };

  const strength = passwordStrength();
  const strengthLabel = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'][strength];
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-emerald-400'][strength];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-slate-900 tracking-tight">EduSync</span>
        </div>

        <div className="mb-8">
          <h1 className="text-xl font-bold text-slate-900">Crear una cuenta</h1>
          <p className="mt-1 text-sm text-slate-500">Únete a tu comunidad escolar.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="Nombre completo"
            type="text"
            placeholder="Ana García López"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={errors.name}
            leftIcon={<User className="h-4 w-4" />}
            autoComplete="name"
          />
          <Input
            label="Correo electrónico"
            type="email"
            placeholder="tu@correo.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email}
            leftIcon={<Mail className="h-4 w-4" />}
            autoComplete="email"
          />
          <Select
            label="Tipo de cuenta"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
            options={[
              { value: 'student', label: 'Alumno' },
              { value: 'teacher', label: 'Profesor' },
            ]}
          />
          <div className="space-y-1.5">
            <Input
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={errors.password}
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              autoComplete="new-password"
            />
            {form.password && (
              <div className="flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColor : 'bg-slate-100'}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-500">{strengthLabel}</span>
              </div>
            )}
          </div>
          <Input
            label="Confirmar contraseña"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            error={errors.confirmPassword}
            leftIcon={<Lock className="h-4 w-4" />}
            autoComplete="new-password"
          />

          <Button type="submit" loading={isLoading} className="w-full">
            Crear cuenta
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-500">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-slate-900 hover:underline">
            Iniciar sesión
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-slate-400">
          Al registrarte aceptas los{' '}
          <span className="text-slate-600 cursor-pointer hover:underline">Términos de uso</span>{' '}
          y la{' '}
          <span className="text-slate-600 cursor-pointer hover:underline">Política de privacidad</span>.
        </p>
      </div>
    </div>
  );
}
