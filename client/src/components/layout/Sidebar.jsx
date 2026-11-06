import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users2,
  Receipt,
  PieChart,
  User,
  PlusCircle,
  LogOut,
  Sparkles,
  ChevronRight,
  Shield,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getInitials } from '../../utils/formatters';

export default function Sidebar({ onOpenAddExpense }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/groups', label: 'My Groups', icon: Users2 },
    { to: '/activity', label: 'Recent Activity', icon: Receipt },
    { to: '/analytics', label: 'Reports & Trends', icon: PieChart },
    { to: '/profile', label: 'My Profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-black text-slate-800 dark:text-white min-h-screen border-r border-slate-200 dark:border-neutral-800 shrink-0 sticky top-0 h-screen select-none transition-colors duration-200">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between">
        <NavLink to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
              CampusSplit
            </span>
            <span className="block text-[10px] text-purple-600 dark:text-purple-400 font-semibold tracking-wider uppercase">
              Spend Together
            </span>
          </div>
        </NavLink>
      </div>

      {/* Quick Action Button */}
      <div className="px-4 pt-5 pb-2">
        <button
          onClick={onOpenAddExpense}
          className="w-full py-2.5 px-4 rounded-xl gradient-brand text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
          Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all group ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-900 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
                </>
              )}
            </NavLink>
          );
        })}

        {/* Exclusive Super Admin link for Krunal */}
        {(user?.email === 'krunal@campus.edu' || user?.is_admin) && (
          <div className="pt-3 mt-2 border-t border-slate-100 dark:border-neutral-800">
            <NavLink
              to="/admin"
              className="admin-command-btn flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all group shadow-md"
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="tracking-wide">Admin Command Center</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-amber-400/80 group-hover:translate-x-0.5 transition-transform" />
            </NavLink>
          </div>
        )}
      </nav>

      {/* User Footer Card */}
      <div className="p-4 border-t border-slate-100 dark:border-neutral-800 bg-white dark:bg-black">
        <div className="flex items-center justify-between gap-3">
          <NavLink to="/profile" className="flex items-center gap-3 min-w-0 group">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-500/30 dark:ring-purple-500/50 shrink-0 group-hover:ring-purple-400 transition-all"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-purple-500/30 dark:ring-purple-500/50 shrink-0">
                {getInitials(user?.name)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                {user?.name || 'Student'}
              </p>
              <p className="text-[11px] font-medium text-slate-500 dark:text-neutral-400 truncate">
                {user?.upi_id || user?.email}
              </p>
            </div>
          </NavLink>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="p-2 text-slate-500 dark:text-neutral-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-neutral-900 rounded-lg transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-600" />}
            </button>
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-neutral-900 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
