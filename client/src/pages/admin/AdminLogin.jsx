import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { Shield, Lock, KeyRound, ArrowRight, AlertCircle } from 'lucide-react';
import { adminApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function AdminLogin() {
  const navigate = useNavigate();
  const toast = useToast();

  const [adminId, setAdminId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Lock Admin Portal to Dark Mode permanently
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const previousTheme = localStorage.getItem('campussplit_theme') || 'light';

    root.classList.add('dark');
    if (body) body.classList.add('dark');
    root.style.colorScheme = 'dark';

    return () => {
      if (previousTheme === 'light') {
        root.classList.remove('dark');
        if (body) body.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!adminId || !passcode) {
      setError('Please provide your Admin ID and passcode.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await adminApi.login({
        adminId: adminId.trim(),
        passcode: passcode.trim(),
      });

      localStorage.setItem('campussplit_admin_token', res.token);
      localStorage.setItem('campussplit_admin_user', JSON.stringify(res.admin));

      toast.success(`Welcome to Admin Command Center, ${res.admin.name}!`);
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Admin authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-black text-white relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2 relative z-10">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-amber-500 items-center justify-center text-white shadow-2xl shadow-purple-500/20 ring-4 ring-purple-500/10">
          <Shield className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          CampusSplit Admin
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400">
          Super Admin Command Center – Specific ID Access
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white dark:bg-black backdrop-blur-xl py-8 px-6 sm:px-10 rounded-3xl shadow-2xl border border-slate-200 dark:border-neutral-800 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                Specific Admin ID
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. ADMIN-KRUNAL-007"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value.toUpperCase())}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm font-mono font-bold tracking-wider text-amber-600 dark:text-amber-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                Admin Passcode
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <span>Authenticating Admin...</span> : <span>Enter Admin Command Center</span>}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center text-xs text-slate-500 dark:text-neutral-400 pt-2 border-t border-slate-200 dark:border-neutral-800">
            Looking for regular student portal?{' '}
            <NavLink to="/dashboard" className="font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
              Return to Student View
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}
