import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { GraduationCap, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { forgotPassword, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('El correo es obligatorio.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Correo inválido.'); return; }
    const result = await forgotPassword(email);
    if (result.success) {
      setSent(true);
    } else {
      setError(result.error || 'Error inesperado.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-slate-900 tracking-tight">EduSync</span>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Correo enviado</h1>
              <p className="mt-2 text-sm text-slate-500">
                Hemos enviado un enlace de recuperación a <strong>{email}</strong>. Revisa tu bandeja de entrada.
              </p>
            </div>
            <Link to="/login" className="block text-sm font-medium text-slate-900 hover:underline">
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-xl font-bold text-slate-900">Recuperar contraseña</h1>
              <p className="mt-1 text-sm text-slate-500">
                Introduce tu correo y te enviaremos un enlace de recuperación.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Correo electrónico"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                error={error}
                leftIcon={<Mail className="h-4 w-4" />}
                autoComplete="email"
              />
              <Button type="submit" loading={isLoading} className="w-full">
                Enviar enlace de recuperación
              </Button>
            </form>

            <Link
              to="/login"
              className="mt-5 flex items-center justify-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al inicio de sesión
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
