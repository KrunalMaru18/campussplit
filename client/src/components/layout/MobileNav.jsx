import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users2, Plus, User, PieChart } from 'lucide-react';

export default function MobileNav({ onOpenAddExpense }) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur-lg border-t border-slate-200 dark:border-neutral-800 px-3 py-2 flex items-center justify-around shadow-lg transition-colors duration-200">
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-colors ${
            isActive ? 'text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
          }`
        }
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/groups"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-colors ${
            isActive ? 'text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
          }`
        }
      >
        <Users2 className="w-5 h-5" />
        <span>Groups</span>
      </NavLink>

      {/* Floating Center Action Button */}
      <div className="-mt-6">
        <button
          onClick={onOpenAddExpense}
          className="w-12 h-12 rounded-full gradient-brand text-white flex items-center justify-center shadow-lg shadow-purple-600/40 hover:scale-105 active:scale-95 transition-all"
          title="Add Expense"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      <NavLink
        to="/analytics"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-colors ${
            isActive ? 'text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
          }`
        }
      >
        <PieChart className="w-5 h-5" />
        <span>Reports</span>
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold transition-colors ${
            isActive ? 'text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
          }`
        }
      >
        <User className="w-5 h-5" />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}
