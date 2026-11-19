import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle, Sun, Moon, Server, Settings, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import ServerSettingsModal from '../components/common/ServerSettingsModal';
import { getServerBaseUrl } from '../services/api';
import BrandLogo from '../components/common/BrandLogo';

export default function Login() {
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showServerModal, setShowServerModal] = useState(false);
  const [currentServer, setCurrentServer] = useState(getServerBaseUrl());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email.trim(), password);
      toast.success('Welcome back to CampusSplit!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFillAdmin = () => {
    setEmail('krunal@gmail.com');
    setPassword('krunal0506');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F7F7FC] dark:bg-[#17172B] text-[#17172B] dark:text-white transition-colors duration-200 relative">
      {/* Top right theme toggle */}
      <div className="absolute top-6 right-6">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white dark:bg-[#21213E] border border-[#EAE9F5] dark:border-[rgba(145,127,242,0.2)] text-[#17172B] dark:text-amber-400 hover:bg-[#F0EFF9] dark:hover:bg-[#29294D] shadow-sm transition-all"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#6654D9]" />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="flex justify-center">
          <BrandLogo size="lg" showText={false} />
        </div>
        <h1 className="text-3xl font-black text-[#17172B] dark:text-white tracking-tight">
          Welcome to <span className="text-[#6654D9] dark:text-[#917FF2]">CampusSplit</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#7E7D9C] dark:text-[#A5A4BF] font-semibold">
          Spend together, split smartly with friends and roommates
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="campus-card py-8 px-6 sm:px-10 space-y-6 shadow-xl">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-[#17172B] dark:text-white uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#7E7D9C]" />
                <input
                  type="email"
                  placeholder="krunal@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-[#17172B] border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.25)] rounded-xl text-sm text-[#17172B] dark:text-white placeholder-[#7E7D9C] font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-[#17172B] dark:text-white uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#7E7D9C]" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-[#17172B] border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.25)] rounded-xl text-sm text-[#17172B] dark:text-white placeholder-[#7E7D9C] font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl gradient-brand text-white font-black text-sm shadow-lg shadow-[#6654D9]/30 hover:brightness-105 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <span>Signing in...</span> : <span>Sign In to CampusSplit</span>}
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* Quick Fill Shortcut for Super Admin / Testing */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleQuickFillAdmin}
              className="w-full py-2 px-3 rounded-xl bg-[#6654D9]/10 hover:bg-[#6654D9]/20 text-[#6654D9] dark:text-[#DCD6FF] text-xs font-black transition-all flex items-center justify-center gap-2 border border-[#6654D9]/20"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#6654D9] dark:text-[#917FF2]" />
              <span>Fill Krunal (Super Admin) Credentials</span>
            </button>
          </div>

          <div className="text-center text-xs text-[#7E7D9C] dark:text-[#A5A4BF] pt-2 border-t border-[#EAE9F5] dark:border-[rgba(145,127,242,0.16)] font-semibold">
            Don&apos;t have an account?{' '}
            <NavLink
              to="/signup"
              className="font-black text-[#6654D9] dark:text-[#917FF2] hover:underline"
            >
              Create an account
            </NavLink>
          </div>

          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={() => setShowServerModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0EFF9] dark:bg-[#17172B] text-[11px] font-bold text-[#7E7D9C] dark:text-[#A5A4BF] hover:text-[#17172B] dark:hover:text-white transition-colors border border-[#EAE9F5] dark:border-[rgba(145,127,242,0.16)]"
            >
              <Server className="w-3 h-3 text-[#6654D9] dark:text-[#917FF2]" />
              <span>
                Backend:{' '}
                <strong className="font-mono text-[#6654D9] dark:text-[#917FF2]">
                  {currentServer ? 'Cloud Live' : 'Auto'}
                </strong>
              </span>
              <Settings className="w-3 h-3 text-[#7E7D9C] ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      <ServerSettingsModal
        isOpen={showServerModal}
        onClose={() => {
          setShowServerModal(false);
          setCurrentServer(getServerBaseUrl());
        }}
      />
    </div>
  );
}
