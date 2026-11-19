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
  ChevronRight,
  Shield,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getInitials } from '../../utils/formatters';
import BrandLogo from '../common/BrandLogo';

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

  const isKrunalOrAdmin =
    user?.is_admin ||
    ['krunal@campus.edu', 'krunal@gmail.com', 'marukrunal.study@gmail.com', 'krunalmaru@gmail.com'].includes(
      user?.email?.toLowerCase()
    ) ||
    user?.email?.toLowerCase().startsWith('krunal');

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-[#1C1C33] text-[#17172B] dark:text-white min-h-screen border-r border-[#EAE9F5] dark:border-[rgba(145,127,242,0.16)] shrink-0 sticky top-0 h-screen select-none transition-colors duration-200">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#EAE9F5] dark:border-[rgba(145,127,242,0.16)] flex items-center justify-between">
        <NavLink to="/dashboard" className="flex items-center group">
          <BrandLogo size="md" showText={true} />
        </NavLink>
      </div>

      {/* Quick Action Button */}
      <div className="px-4 pt-5 pb-2">
        <button
          onClick={onOpenAddExpense}
          className="w-full py-2.5 px-4 rounded-xl gradient-brand text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#6654D9]/30 hover:brightness-105 active:scale-[0.98] transition-all"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-wider text-[#7E7D9C] dark:text-[#A5A4BF]">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all group ${
                  isActive
                    ? 'bg-[#6654D9] text-white shadow-md shadow-[#6654D9]/30'
                    : 'text-[#494866] dark:text-[#DCD6FF] hover:bg-[#F0EFF9] dark:hover:bg-[#29294D] hover:text-[#6654D9] dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? 'text-white'
                          : 'text-[#7E7D9C] group-hover:text-[#6654D9] dark:text-[#A5A4BF] dark:group-hover:text-[#917FF2]'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                </>
              )}
            </NavLink>
          );
        })}

        {/* Exclusive Super Admin link for Krunal */}
        {isKrunalOrAdmin && (
          <div className="pt-3 mt-2 border-t border-[#EAE9F5] dark:border-[rgba(145,127,242,0.16)]">
            <NavLink
              to="/admin"
              className="admin-command-btn flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all group shadow-md"
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-amber-400 shrink-0 fill-amber-400/20" />
                <span className="tracking-wide">Admin Site</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-amber-400/80 group-hover:translate-x-0.5 transition-transform" />
            </NavLink>
          </div>
        )}
      </nav>

      {/* User Footer Card */}
      <div className="p-4 border-t border-[#EAE9F5] dark:border-[rgba(145,127,242,0.16)] bg-white dark:bg-[#1C1C33]">
        <div className="flex items-center justify-between gap-2.5">
          <NavLink to="/profile" className="flex items-center gap-2.5 min-w-0 group flex-1">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-[#6654D9]/30 dark:ring-[#917FF2]/40 shrink-0 group-hover:ring-[#6654D9] transition-all"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#6654D9] text-white font-bold text-xs flex items-center justify-center ring-2 ring-[#6654D9]/30 shrink-0">
                {getInitials(user?.name)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#17172B] dark:text-white truncate group-hover:text-[#6654D9] dark:group-hover:text-[#917FF2] transition-colors">
                {user?.name || 'Student'}
              </p>
              <p className="text-[10px] font-medium text-[#7E7D9C] dark:text-[#A5A4BF] truncate">
                {user?.upi_id || user?.email}
              </p>
            </div>
          </NavLink>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-1.5 text-[#7E7D9C] dark:text-[#A5A4BF] hover:text-amber-500 dark:hover:text-amber-400 hover:bg-[#F0EFF9] dark:hover:bg-[#29294D] rounded-lg transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#6654D9]" />}
            </button>
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 text-[#7E7D9C] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
