import React from 'react';
import { NavLink } from 'react-router-dom';
import { Bell, Sparkles, Plus, Menu, Shield, Radio, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import { getInitials } from '../../utils/formatters';

export default function Navbar({ onOpenAddExpense, title = 'Dashboard' }) {
  const { user } = useAuth();
  const { isConnected } = useSocket();
  const { isDark, toggleTheme } = useTheme();

  const isKrunalOrAdmin = user?.email === 'krunal@campus.edu' || user?.is_admin;

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-slate-200/80 dark:border-neutral-800 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors duration-200">
      <div className="flex items-center gap-3">
        {/* Mobile Logo Brand */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-base">CampusSplit</span>
        </div>

        {/* Desktop Title & Live Indicator */}
        <div className="hidden lg:flex items-center gap-3">
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {title || 'Dashboard'}
          </h1>

          {/* Real-Time Live Sync Indicator */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
              isConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80'
                : 'bg-slate-100 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            ></span>
            <span>{isConnected ? 'Live Sync Active' : 'Connecting'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-neutral-900 text-slate-700 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-neutral-800 border border-slate-200 dark:border-neutral-800 transition-all shadow-sm"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-600" />}
        </button>

        {/* Admin Portal Button for Krunal / Admins */}
        {isKrunalOrAdmin && (
          <NavLink
            to="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-neutral-900 text-amber-300 hover:bg-slate-800 dark:hover:bg-neutral-800 font-bold text-xs border border-amber-500/30 shadow-sm transition-all"
            title="Open Admin Portal"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Admin Portal</span>
            <span className="sm:hidden">Admin</span>
          </NavLink>
        )}

        {/* Quick Add Expense button */}
        <button
          onClick={onOpenAddExpense}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg gradient-brand text-white font-semibold text-xs sm:text-sm shadow-sm hover:brightness-105 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Expense</span>
          <span className="sm:hidden">Add</span>
        </button>

        {/* User Avatar link */}
        <NavLink to="/profile" className="flex items-center gap-2 pl-1">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-500/20 dark:ring-purple-500/40"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
              {getInitials(user?.name)}
            </div>
          )}
          <span className="hidden md:inline text-xs font-bold text-slate-900 dark:text-neutral-200">
            {user?.name || 'Student'}
          </span>
        </NavLink>
      </div>
    </header>
  );
}
