import React from 'react';
import { NavLink } from 'react-router-dom';
import { Plus, Shield, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import { getInitials } from '../../utils/formatters';
import BrandLogo from '../common/BrandLogo';

export default function Navbar({ onOpenAddExpense, title = 'Dashboard' }) {
  const { user } = useAuth();
  const { isConnected } = useSocket();
  const { isDark, toggleTheme } = useTheme();

  const isKrunalOrAdmin =
    user?.is_admin ||
    ['krunal@campus.edu', 'krunal@gmail.com', 'marukrunal.study@gmail.com', 'krunalmaru@gmail.com'].includes(
      user?.email?.toLowerCase()
    ) ||
    user?.email?.toLowerCase().startsWith('krunal');

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#1C1C33]/90 backdrop-blur-md border-b border-[#EAE9F5] dark:border-[rgba(145,127,242,0.16)] px-4 sm:px-8 py-3 flex items-center justify-between transition-colors duration-200">
      <div className="flex items-center gap-4">
        {/* Mobile Brand Logo */}
        <div className="lg:hidden flex items-center">
          <BrandLogo size="sm" showText={true} />
        </div>

        {/* Desktop Page Title & Real-Time Sync Indicator */}
        <div className="hidden lg:flex items-center gap-3.5">
          <h1 className="text-xl font-black text-[#17172B] dark:text-white tracking-tight">
            {title || 'Dashboard'}
          </h1>

          {/* Real-Time Live Sync Indicator */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
              isConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                : 'bg-slate-100 dark:bg-[#29294D] text-slate-600 dark:text-[#A5A4BF] border-slate-200 dark:border-[#3B3B66]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            ></span>
            <span>{isConnected ? 'Live Sync' : 'Connecting'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark / Light Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 sm:p-2.5 rounded-xl bg-[#F0EFF9] dark:bg-[#29294D] text-[#17172B] dark:text-amber-400 hover:bg-[#E4E2F6] dark:hover:bg-[#33335C] border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.2)] transition-all shadow-sm"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#6654D9]" />}
        </button>

        {/* Admin Site Button for Krunal / Super Admin */}
        {isKrunalOrAdmin && (
          <NavLink
            to="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-[#6654D9]/15 to-transparent hover:from-amber-500/25 text-amber-700 dark:text-amber-300 font-extrabold text-xs border border-amber-500/40 shadow-sm transition-all"
            title="Open Admin Site"
          >
            <Shield className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 fill-amber-400/20" />
            <span className="hidden xs:inline">Admin Site</span>
            <span className="xs:hidden">Admin</span>
          </NavLink>
        )}

        {/* Quick Add Expense button */}
        <button
          onClick={onOpenAddExpense}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl gradient-brand text-white font-bold text-xs sm:text-sm shadow-md shadow-[#6654D9]/25 hover:brightness-105 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">Add Expense</span>
          <span className="sm:hidden">Add</span>
        </button>

        {/* User Profile Avatar Link */}
        <NavLink to="/profile" className="flex items-center gap-2 pl-1 group">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-[#6654D9]/30 dark:ring-[#917FF2]/40 group-hover:ring-[#6654D9] transition-all"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#6654D9] text-white font-bold text-xs flex items-center justify-center ring-2 ring-[#6654D9]/30">
              {getInitials(user?.name)}
            </div>
          )}
          <span className="hidden md:inline text-xs font-bold text-[#17172B] dark:text-[#DCD6FF] group-hover:text-[#6654D9] transition-colors">
            {user?.name || 'Student'}
          </span>
        </NavLink>
      </div>
    </header>
  );
}
