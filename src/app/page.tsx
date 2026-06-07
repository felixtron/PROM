'use client';

import React, { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Almacenar token y rol de sesión
        localStorage.setItem('prom_token', data.token);
        localStorage.setItem('prom_role', data.role);
        localStorage.setItem('prom_email', data.email);
        
        // Redirigir al dashboard con un redirect tradicional para forzar la carga limpia
        window.location.href = '/dashboard';
      } else {
        setError(data.error || 'Ocurrió un error inesperado.');
      }
    } catch (err) {
      setError('Error de conectividad. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 font-sans">
      <div className="sm:mx-auto w-full sm:max-w-md text-center">
        {/* LOGO DE PRO-M */}
        <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
          🚀 ProM
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Consola Interna de Marketing de <span className="font-semibold text-indigo-400">ProSuite</span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-4 border border-slate-800 shadow-xl rounded-2xl sm:px-10">
          <h2 className="text-xl font-bold text-white mb-6 text-center">Acceso Consultores (Superusuario)</h2>
          
          {error && (
            <div className="bg-red-950/50 border border-red-800 text-red-400 p-3.5 rounded-lg text-sm mb-6 font-medium">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                placeholder="consultor@prosuite.mx"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <input
                type="password"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? 'Validando sesión...' : 'Iniciar Sesión'}
              </button>
            </div>
          </form>

          {/* CREDENCIALES POR DEFECTO PARA EL CONSULTOR */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
            <span className="inline-block bg-slate-950 border border-slate-800/50 text-[11px] font-mono py-1.5 px-3 rounded text-slate-500">
              Usa: consultant@prosuite.mx / ***MOVIDO-A-ENV***
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
