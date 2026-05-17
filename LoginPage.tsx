import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { GraduationCap, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email) e.email = 'El correo es obligatorio.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Correo inválido.';
    if (!form.password) e.password = 'La contraseña es obligatoria.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await login(form.email, form.password);
    if (result.success) {
      toast.success('Sesión iniciada correctamente.');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Error al iniciar sesión.');
    }
  };

  // Cuentas de demostración (ocultas al público, disponibles para uso interno)
  const DEMO_ACCOUNTS = [
    { label: 'Administrador', email: 'admin@edusync.app', password: 'Admin1234!' },
    { label: 'Profesora', email: 'ana.garcia@edusync.app', password: 'Profe1234!' },
    { label: 'Alumna', email: 'laura@edusync.app', password: 'Alumno1234!' },
  ];

  const fillDemo = (email: string, password: string) => {
    setForm({ email, password });
    setErrors({});
  };

  // Suprimir advertencia de variable no usada en producción
  void DEMO_ACCOUNTS;
  void fillDemo;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 flex-col bg-slate-900 p-12 text-white relative overflow-hidden">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-white tracking-tight">EduSync</span>
          </div>
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-white leading-snug">
                La plataforma educativa que transforma tu escuela.
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Gestiona clases, calendarios, tareas y asistencia desde un solo lugar. Diseñado para profesores, alumnos y administradores.
              </p>
            </div>
            <div className="space-y-4 mt-8">
              {[
                { title: 'Calendario colaborativo', desc: 'Sincronizado en tiempo real para todos los roles.' },
                { title: 'Gestión de tareas', desc: 'Crea, asigna y revisa tareas con flujo de trabajo completo.' },
                { title: 'Control de asistencia', desc: 'Registra y visualiza la asistencia de tus alumnos.' },
              ].map((feat) => (
                <div key={feat.title} className="flex gap-3">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">{feat.title}</p>
                    <p className="text-xs text-slate-500">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900 tracking-tight">EduSync</span>
          </div>

          <div className="mb-8">
            <h1 className="text-xl font-bold text-slate-900">Iniciar sesión</h1>
            <p className="mt-1 text-sm text-slate-500">Accede a tu cuenta de EduSync.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
              autoComplete="current-password"
            />

            <div className="flex items-center justify-end">
              <Link to="/forgot-password" className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button type="submit" loading={isLoading} className="w-full">
              Iniciar sesión
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-medium text-slate-900 hover:underline">
              Registrarse
            </Link>
          </p>


        </div>
      </div>
    </div>
  );
}
