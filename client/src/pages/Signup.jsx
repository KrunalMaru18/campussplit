import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Smartphone, ArrowRight, AlertCircle, Check, Sun, Moon, Server, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import ServerSettingsModal from '../components/common/ServerSettingsModal';
import { getServerBaseUrl } from '../services/api';
import BrandLogo from '../components/common/BrandLogo';

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
];

export default function Signup() {
  const { register } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [upiId, setUpiId] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showServerModal, setShowServerModal] = useState(false);
  const [currentServer, setCurrentServer] = useState(getServerBaseUrl());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        upi_id: upiId.trim() || `${email.split('@')[0]}@okaxis`,
        avatar_url: selectedAvatar,
      });

      toast.success('Account created successfully! Welcome to CampusSplit.');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Email might already be taken.');
    } finally {
      setLoading(false);
    }
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
          Join <span className="text-[#6654D9] dark:text-[#917FF2]">CampusSplit</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#7E7D9C] dark:text-[#A5A4BF] font-semibold">
          Create an account to start sharing expenses seamlessly
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
            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-black text-[#17172B] dark:text-white uppercase tracking-wider mb-2">
                Choose Profile Avatar
              </label>
              <div className="flex items-center justify-between gap-2">
                {AVATAR_OPTIONS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedAvatar(url)}
                    className={`relative rounded-full transition-transform ${
                      selectedAvatar === url
                        ? 'ring-3 ring-[#6654D9] scale-110 shadow-md'
                        : 'opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Avatar option ${i + 1}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {selectedAvatar === url && (
                      <div className="absolute inset-0 bg-[#6654D9]/25 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-[#17172B] dark:text-white uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-[#7E7D9C]" />
                <input
                  type="text"
                  placeholder="e.g. Krunal Maru"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-[#17172B] border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.25)] rounded-xl text-sm text-[#17172B] dark:text-white placeholder-[#7E7D9C] font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-[#17172B] dark:text-white uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#7E7D9C]" />
                <input
                  type="email"
                  placeholder="student@campus.edu"
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
                  placeholder="At least 6 characters"
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

            <div>
              <label className="block text-xs font-black text-[#17172B] dark:text-white uppercase tracking-wider mb-1.5">
                UPI ID (Optional – For receiving settlements)
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3.5 top-3 w-4 h-4 text-[#7E7D9C]" />
                <input
                  type="text"
                  placeholder="yourname@okhdfcbank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white dark:bg-[#17172B] border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.25)] rounded-xl text-sm text-[#17172B] dark:text-white placeholder-[#7E7D9C] font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl gradient-brand text-white font-black text-sm shadow-lg shadow-[#6654D9]/30 hover:brightness-105 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <span>Creating account...</span> : <span>Create Account</span>}
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          <div className="text-center text-xs text-[#7E7D9C] dark:text-[#A5A4BF] pt-2 border-t border-[#EAE9F5] dark:border-[rgba(145,127,242,0.16)] font-semibold">
            Already have an account?{' '}
            <NavLink
              to="/login"
              className="font-black text-[#6654D9] dark:text-[#917FF2] hover:underline"
            >
              Sign In
            </NavLink>
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
