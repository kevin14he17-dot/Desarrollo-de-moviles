import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, Store, Sparkles } from 'lucide-react';
import useAuth from '../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();
  const [formData, setFormData]         = useState({ username: 'admin', password: 'admin123' });
  const [validationError, setValidationError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setValidationError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim()) { setValidationError('El usuario es requerido'); return; }
    if (!formData.password.trim()) { setValidationError('La contraseña es requerida'); return; }
    const result = await login(formData.username, formData.password);
    if (result.success) navigate('/dashboard');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #030712 0%, #0f172a 40%, #1e1b4b 70%, #0f172a 100%)' }}
    >
      {/* ── Decorative blobs ── */}
      <div className="blob w-96 h-96 -top-48 -left-24" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)' }} />
      <div className="blob w-80 h-80 -bottom-32 -right-20" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)' }} />
      <div className="blob w-64 h-64 top-1/2 left-1/4 -translate-y-1/2 animate-float-slow" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)' }} />

      {/* ── Grid pattern overlay ── */}
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* ── Card ── */}
      <div
        className="relative w-full max-w-md rounded-3xl p-8 animate-fade-up"
        style={{
          background:     'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border:         '1px solid rgba(255,255,255,0.1)',
          borderTopColor: 'rgba(255,255,255,0.18)',
          boxShadow:      '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
        }}
      >
        {/* Sparkle decoration */}
        <Sparkles className="absolute top-6 right-6 w-5 h-5 text-indigo-400 opacity-50 animate-pulse" />

        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 30px rgba(99,102,241,0.5)' }}
          >
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Minimarket <span className="gradient-text">PRO</span>
          </h1>
          <p className="text-slate-400 text-sm">Sistema de Punto de Venta</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Error */}
          {(error || validationError) && (
            <div
              className="rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 animate-scale-in"
              style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#fda4af' }}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
              {error || validationError}
            </div>
          )}

          {/* Usuario */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Usuario</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="admin"
              disabled={isLoading}
              className="input-glass w-full px-4 py-3 rounded-xl text-sm"
            />
          </div>

          {/* Contraseña */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={isLoading}
                className="input-glass w-full px-4 py-3 pr-12 rounded-xl text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-all-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm mt-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">Credenciales de prueba disponibles</p>
          <div className="flex justify-center gap-4 mt-3">
            <span className="badge-violet text-xs px-3 py-1 rounded-full">admin / admin123</span>
          </div>
        </div>
      </div>
    </div>
  );
}

