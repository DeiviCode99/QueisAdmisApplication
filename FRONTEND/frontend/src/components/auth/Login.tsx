import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { user, login } = useAuth()!;
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError((err as any).message || 'Credenciales inválidas');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[20px] shadow-[0_16px_48px_rgba(14,165,233,0.1),-8px_-8px_24px_rgba(255,255,255,0.8)] border border-white/60 overflow-hidden">
          <div className="bg-gradient-to-br from-brand-500 to-brand-700 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15)_0%,transparent_60%)]" />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-[16px] bg-white/15 backdrop-blur-sm mb-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-white">Queis Admin</h1>
              <p className="text-brand-200 text-sm mt-1 font-medium">Gestión Inteligente para SPA</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-600 rounded-[12px] px-4 py-3 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                className="clay-input"
                placeholder="correo@ejemplo.com"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  className="clay-input pr-10"
                  placeholder="Ingresa tu contraseña"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-300 hover:text-brand-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="clay-btn w-full py-3 bg-gradient-to-b from-brand-400 to-brand-500 text-white font-heading font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-brand-400 mt-6 font-medium">
          Queis Admin Application v1.0.0
        </p>
      </div>
    </div>
  );
}
