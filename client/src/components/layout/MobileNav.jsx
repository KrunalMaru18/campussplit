import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users2, Plus, User, PieChart } from 'lucide-react';

export default function MobileNav({ onOpenAddExpense }) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#1C1C33]/95 backdrop-blur-xl border-t border-[#EAE9F5] dark:border-[rgba(145,127,242,0.16)] px-3 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-lg shadow-black/5 dark:shadow-black/40 transition-colors duration-200">
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-black transition-all ${
            isActive
              ? 'text-[#6654D9] dark:text-[#917FF2]'
              : 'text-[#7E7D9C] dark:text-[#A5A4BF] hover:text-[#17172B] dark:hover:text-white'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div className={`p-1 rounded-lg ${isActive ? 'bg-[#6654D9]/10 dark:bg-[#917FF2]/15' : ''}`}>
              <LayoutDashboard className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span>Home</span>
          </>
        )}
      </NavLink>

      <NavLink
        to="/groups"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-black transition-all ${
            isActive
              ? 'text-[#6654D9] dark:text-[#917FF2]'
              : 'text-[#7E7D9C] dark:text-[#A5A4BF] hover:text-[#17172B] dark:hover:text-white'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div className={`p-1 rounded-lg ${isActive ? 'bg-[#6654D9]/10 dark:bg-[#917FF2]/15' : ''}`}>
              <Users2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span>Groups</span>
          </>
        )}
      </NavLink>

      {/* Floating Center Action Button with Glow */}
      <div className="-mt-7">
        <button
          onClick={onOpenAddExpense}
          className="w-13 h-13 rounded-2xl gradient-brand text-white flex items-center justify-center shadow-lg shadow-[#6654D9]/40 hover:scale-105 active:scale-95 transition-all ring-4 ring-white dark:ring-[#17172B]"
          title="Add Expense"
          aria-label="Add Expense"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      </div>

      <NavLink
        to="/analytics"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-black transition-all ${
            isActive
              ? 'text-[#6654D9] dark:text-[#917FF2]'
              : 'text-[#7E7D9C] dark:text-[#A5A4BF] hover:text-[#17172B] dark:hover:text-white'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div className={`p-1 rounded-lg ${isActive ? 'bg-[#6654D9]/10 dark:bg-[#917FF2]/15' : ''}`}>
              <PieChart className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span>Trends</span>
          </>
        )}
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-black transition-all ${
            isActive
              ? 'text-[#6654D9] dark:text-[#917FF2]'
              : 'text-[#7E7D9C] dark:text-[#A5A4BF] hover:text-[#17172B] dark:hover:text-white'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div className={`p-1 rounded-lg ${isActive ? 'bg-[#6654D9]/10 dark:bg-[#917FF2]/15' : ''}`}>
              <User className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span>Profile</span>
          </>
        )}
      </NavLink>
    </nav>
  );
}
