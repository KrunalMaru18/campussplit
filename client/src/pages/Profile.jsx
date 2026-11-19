import React, { useState, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { User, Mail, Smartphone, Camera, LogOut, Check, Save, Sun, Moon, Upload, Sparkles, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../services/api';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=250&q=80',
];

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [name, setName] = useState(user?.name || '');
  const [upiId, setUpiId] = useState(user?.upi_id || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || AVATAR_PRESETS[0]);
  const [customUrl, setCustomUrl] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle direct file upload from user device (mobile / PC)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    // Compress & resize image to max 400x400 using HTML5 Canvas
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setAvatarUrl(compressedDataUrl);
        toast.success('Photo chosen! Click "Save Profile Changes" to update.');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    setAvatarUrl(customUrl.trim());
    toast.success('Custom photo URL applied!');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await authApi.updateProfile({
        name: name.trim(),
        upi_id: upiId.trim(),
        avatar_url: avatarUrl,
      });

      updateUser(res.user);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-2xl mx-auto pb-24 lg:pb-8 transition-colors duration-200">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          My Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 font-medium">
          Manage your student account settings, profile picture, appearance theme, and UPI handle
        </p>
      </div>

      {/* Main Settings Card */}
      <div className="campus-card p-6 sm:p-8 space-y-6">
        {/* Profile Avatar & Header */}
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="relative group">
            <img
              src={avatarUrl}
              alt={name}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-purple-500/30 dark:ring-purple-500/50 shadow-lg shrink-0"
            />
            {/* Camera Overlay Icon */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 rounded-full gradient-brand text-white shadow-md hover:scale-110 active:scale-95 transition-all"
              title="Upload photo from device"
            >
              <Camera className="w-4 h-4 stroke-[2.5]" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{user?.name}</h2>
            <p className="text-xs text-slate-600 dark:text-neutral-400 font-medium">{user?.email}</p>
            <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="inline-block text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                UPI: {user?.upi_id || 'Not set'}
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-900 hover:bg-slate-200 dark:hover:bg-neutral-800 text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-neutral-800 transition-colors"
              >
                <Upload className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                <span>Upload New Photo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Custom Photo URL or Presets Section */}
        <div className="pt-3 border-t border-slate-100 dark:border-neutral-800 space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider">
            Profile Photo Options
          </label>

          <div className="flex gap-2">
            <input
              type="url"
              placeholder="Or paste an image URL (https://...)"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={handleApplyCustomUrl}
              className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-neutral-800 text-white font-bold text-xs hover:bg-slate-800 transition-colors shrink-0"
            >
              Apply Link
            </button>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 block mb-2">
              Or pick an avatar preset:
            </span>
            <div className="flex flex-wrap gap-2.5">
              {AVATAR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(preset)}
                  className={`relative rounded-full overflow-hidden transition-all ${
                    avatarUrl === preset ? 'ring-4 ring-purple-600 scale-105' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={preset} className="w-10 h-10 object-cover" alt="preset" />
                  {avatarUrl === preset && (
                    <div className="absolute inset-0 bg-purple-600/30 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Appearance & Dark Mode Selection */}
        <div className="pt-3 border-t border-slate-100 dark:border-neutral-800">
          <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-2.5">
            Appearance & Theme
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Light Mode Option */}
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                theme === 'light'
                  ? 'border-purple-600 bg-purple-50/50 text-purple-900 shadow-sm ring-2 ring-purple-500/20'
                  : 'border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 hover:border-slate-300 dark:hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block">Light Mode</span>
                  <span className="text-[10px] text-slate-600 dark:text-neutral-400">Pure white view</span>
                </div>
              </div>
              {theme === 'light' && <Check className="w-4 h-4 text-purple-600" />}
            </button>

            {/* Dark Mode Option */}
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                theme === 'dark'
                  ? 'border-purple-500 bg-purple-950/40 text-purple-200 shadow-sm ring-2 ring-purple-500/20'
                  : 'border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 hover:border-slate-300 dark:hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-900/60 text-purple-400 flex items-center justify-center shrink-0">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block">Dark Mode</span>
                  <span className="text-[10px] text-[#7E7D9C] dark:text-[#A5A4BF]">Midnight Violet</span>
                </div>
              </div>
              {theme === 'dark' && <Check className="w-4 h-4 text-purple-400" />}
            </button>
          </div>
        </div>

        {/* Mobile App PWA Banner */}
        <div className="pt-3 border-t border-slate-100 dark:border-neutral-800">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-neutral-900 dark:to-neutral-950 border border-purple-200/80 dark:border-neutral-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-brand text-white flex items-center justify-center shrink-0 shadow-md">
                <Smartphone className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Install on iOS & Android</span>
                  <span className="text-[10px] font-bold bg-purple-600 text-white px-1.5 py-0.5 rounded-full">PWA App</span>
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-neutral-400 mt-0.5 font-medium">
                  Add CampusSplit to your phone home screen for 1-tap full-screen access without browser bars.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="space-y-4 pt-2 border-t border-slate-100 dark:border-neutral-800">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Email (Read Only)
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                disabled
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-sm text-slate-500 dark:text-neutral-400 cursor-not-allowed opacity-80"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              UPI ID for Settlements (GPay / PhonePe / Paytm)
            </label>
            <div className="relative">
              <Smartphone className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. yourname@okhdfcbank"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl text-sm font-mono font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1 font-medium">
              Friends can click &quot;Open UPI App&quot; or copy this ID directly when settling debts with you.
            </p>
          </div>

          {/* Admin Site Quick Access for Super Admin */}
          {(user?.is_admin ||
            ['krunal@campus.edu', 'krunal@gmail.com', 'marukrunal.study@gmail.com', 'krunalmaru@gmail.com'].includes(
              user?.email?.toLowerCase()
            ) ||
            user?.email?.toLowerCase().startsWith('krunal')) && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-600/10 to-transparent border border-amber-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 fill-amber-400/20" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Admin Site</h4>
                  <p className="text-xs text-slate-500 dark:text-neutral-400">Super Admin Command Center & Student Database</p>
                </div>
              </div>
              <NavLink
                to="/admin"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-extrabold text-xs shadow-md transition-all shrink-0"
              >
                Admin Site →
              </NavLink>
            </div>
          )}

          <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl gradient-brand text-white font-semibold text-xs shadow-md shadow-purple-600/30 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
