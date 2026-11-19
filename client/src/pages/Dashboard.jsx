import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users2,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  Receipt,
  CheckCircle2,
  Sparkles,
  PieChart,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { analyticsApi, groupsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, getInitials } from '../utils/formatters';
import { CategoryBadge, getCategoryMeta } from '../utils/categoryIcons';

export default function Dashboard({ onOpenAddExpense, onOpenCreateGroup, onOpenJoinGroup }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await analyticsApi.getDashboard();
      setSummary(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      if (!silent) setError(err.message || 'Failed to load dashboard data.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    const handleRealTimeUpdate = () => {
      loadDashboard(true);
    };

    window.addEventListener('campussplit:settlement', handleRealTimeUpdate);
    window.addEventListener('campussplit:balance_change', handleRealTimeUpdate);
    window.addEventListener('campussplit:activity', handleRealTimeUpdate);
    window.addEventListener('expense-updated', handleRealTimeUpdate);

    return () => {
      window.removeEventListener('campussplit:settlement', handleRealTimeUpdate);
      window.removeEventListener('campussplit:balance_change', handleRealTimeUpdate);
      window.removeEventListener('campussplit:activity', handleRealTimeUpdate);
      window.removeEventListener('expense-updated', handleRealTimeUpdate);
    };
  }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-8 space-y-6 animate-pulse">
        <div className="h-28 bg-slate-200 rounded-2xl w-full"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-200 rounded-2xl"></div>
          <div className="h-72 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const netBalance = summary?.netBalance || 0;
  const isNetPositive = netBalance > 0.01;
  const isNetNegative = netBalance < -0.01;

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto pb-24 lg:pb-8">
      {/* Network / Connection Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadDashboard()}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 text-white font-semibold text-xs hover:bg-amber-700 active:scale-95 transition-all self-end sm:self-auto"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl gradient-brand p-6 sm:p-8 text-white shadow-xl shadow-purple-900/10">
        {/* Background decorative circles */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute right-32 -top-10 w-48 h-48 bg-purple-400/20 rounded-full blur-xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-purple-100">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>CampusSplit Overview</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Student'}! 👋
            </h2>
            <p className="text-sm text-purple-100/90 max-w-xl">
              Track your shared hostel bills, trips, canteen treats and party expenses without any awkwardness.
            </p>
          </div>

          {/* Quick Action Group */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenAddExpense}
              className="px-4 py-2.5 rounded-xl bg-white text-purple-800 font-bold text-xs sm:text-sm shadow-md hover:bg-purple-50 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Expense</span>
            </button>
            <button
              onClick={onOpenCreateGroup}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-semibold text-xs sm:text-sm border border-white/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Users2 className="w-4 h-4" />
              <span>New Group</span>
            </button>
            <button
              onClick={onOpenJoinGroup}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-semibold text-xs sm:text-sm border border-white/20 active:scale-95 transition-all"
            >
              <span>Join Group</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Group Expenses */}
        <div className="bg-white dark:bg-black p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-600 dark:text-neutral-400 uppercase tracking-wider">
              Total Expenses
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(summary?.totalGroupExpenses || 0)}
          </p>
          <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1 flex items-center gap-1 font-medium">
            <span>Across all {summary?.activeGroups?.length || 0} active groups</span>
          </p>
        </div>

        {/* Total Paid by Me */}
        <div className="bg-white dark:bg-black p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-600 dark:text-neutral-400 uppercase tracking-wider">
              Total Paid By Me
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(summary?.totalPaidByMe || 0)}
          </p>
          <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1 font-medium">
            Bills you personally fronted
          </p>
        </div>

        {/* Amount Others Owe Me */}
        <div className="bg-white dark:bg-black p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-600 dark:text-neutral-400 uppercase tracking-wider">
              You Are Owed
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatCurrency(summary?.amountOwedToMe || 0)}
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold mt-1">
            {summary?.amountOwedToMe > 0 ? 'Friends need to pay you' : 'No pending receivables'}
          </p>
        </div>

        {/* Amount I Owe */}
        <div className="bg-white dark:bg-black p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-600 dark:text-neutral-400 uppercase tracking-wider">
              You Owe
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
            {formatCurrency(summary?.amountIOwe || 0)}
          </p>
          <p className="text-xs text-rose-700 dark:text-rose-300 font-semibold mt-1">
            {summary?.amountIOwe > 0 ? 'You need to settle up' : 'You have zero pending debts'}
          </p>
        </div>
      </div>

      {/* Net Balance Status Highlight Bar */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isNetPositive
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : isNetNegative
            ? 'bg-rose-50/70 border-rose-200 text-rose-950'
            : 'bg-slate-100 border-slate-200 text-slate-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
              isNetPositive
                ? 'bg-emerald-500 text-white'
                : isNetNegative
                ? 'bg-rose-500 text-white'
                : 'bg-slate-400 text-white'
            }`}
          >
            {isNetPositive ? '+' : isNetNegative ? '-' : '✓'}
          </div>
          <div>
            <p className="font-bold text-sm sm:text-base">
              {isNetPositive
                ? `Overall, you are owed ${formatCurrency(netBalance)} across all groups.`
                : isNetNegative
                ? `Overall, you owe ${formatCurrency(Math.abs(netBalance))} across all groups.`
                : 'You are completely settled up with everyone!'}
            </p>
            <p className="text-xs opacity-75">
              Smart debt simplification algorithm calculates minimal payment steps.
            </p>
          </div>
        </div>
        <NavLink
          to="/analytics"
          className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition-all shrink-0 self-start sm:self-auto bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-600 dark:hover:bg-purple-500 dark:text-white border border-purple-500/80 active:scale-95"
        >
          <span>View Detailed Breakdown</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </NavLink>
      </div>

      {/* Main Grid: Active Groups + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Active Groups */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">My Active Groups</h3>
              <p className="text-xs text-slate-600 dark:text-neutral-400 font-medium">Groups you are currently sharing bills in</p>
            </div>
            <NavLink
              to="/groups"
              className="text-xs font-bold text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {summary?.activeGroups?.map((group) => {
              const myBal = group.myBalance || 0;
              const isOwed = myBal > 0.01;
              const owes = myBal < -0.01;

              return (
                <NavLink
                  key={group.id}
                  to={`/groups/${group.id}`}
                  className="bg-white dark:bg-black p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-600 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <CategoryBadge categoryId={group.category} size="xs" />
                      <span className="text-[11px] font-bold text-slate-600 dark:text-neutral-400">
                        {group.memberCount} members
                      </span>
                    </div>

                    <h4 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
                      {group.name}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1 font-medium">
                      Total spent: <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(group.totalSpending)}</span>
                    </p>
                  </div>

                  {/* Net Balance in this group */}
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 dark:text-neutral-400">Your balance:</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        isOwed
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : owes
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          : 'bg-slate-100 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300'
                      }`}
                    >
                      {isOwed
                        ? `+${formatCurrency(myBal)}`
                        : owes
                        ? `-${formatCurrency(Math.abs(myBal))}`
                        : 'Settled'}
                    </span>
                  </div>
                </NavLink>
              );
            })}

            {(!summary?.activeGroups || summary.activeGroups.length === 0) && (
              <div className="sm:col-span-2 bg-white dark:bg-black rounded-2xl border border-dashed border-slate-300 dark:border-neutral-800 p-8 text-center space-y-3">
                <Users2 className="w-10 h-10 text-slate-400 dark:text-neutral-600 mx-auto" />
                <p className="text-sm font-bold text-slate-800 dark:text-white">No active groups yet</p>
                <p className="text-xs text-slate-600 dark:text-neutral-400 max-w-sm mx-auto font-medium">
                  Create a group with your hostel mates, trip buddies or project partners to start splitting!
                </p>
                <button
                  onClick={onOpenCreateGroup}
                  className="px-4 py-2 rounded-xl gradient-brand text-white font-semibold text-xs shadow-md"
                >
                  Create Your First Group
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Category Breakdown Quick Widget */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Top Categories</h3>
            <NavLink
              to="/analytics"
              className="text-xs font-bold text-purple-600 hover:text-purple-800 dark:text-purple-400"
            >
              Reports
            </NavLink>
          </div>

          <div className="bg-white dark:bg-black p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-sm space-y-4">
            {summary?.categorySpending?.slice(0, 5).map((cat) => {
              const maxSpend = Math.max(...(summary?.categorySpending?.map((c) => c.amount) || [1]));
              const pct = maxSpend > 0 ? (cat.amount / maxSpend) * 100 : 0;
              const meta = getCategoryMeta(cat.category);
              const Icon = meta.icon;

              return (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded-md ${meta.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-slate-900 dark:text-neutral-200 font-semibold">{meta.label}</span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(cat.amount)}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="gradient-brand h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}

            {(!summary?.categorySpending || summary.categorySpending.length === 0) && (
              <p className="text-xs text-slate-500 dark:text-neutral-400 text-center py-6 font-medium">
                No expense categories recorded yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
            <p className="text-xs text-slate-600 dark:text-neutral-400 font-medium">Expenses and settlements across your groups</p>
          </div>
          <NavLink
            to="/activity"
            className="text-xs font-bold text-purple-600 hover:text-purple-800 dark:text-purple-400 flex items-center gap-1"
          >
            <span>Full History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        <div className="bg-white dark:bg-black rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-sm divide-y divide-slate-100 dark:divide-neutral-800 overflow-hidden">
          {summary?.recentTransactions?.map((tx) => {
            const isExpense = tx.type === 'expense';
            const isSettlement = tx.type === 'settlement';

            return (
              <div
                key={tx.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-neutral-900/60 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {isExpense ? (
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-800/60">
                      <Receipt className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800/60">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {tx.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-neutral-400 mt-0.5">
                      <span className="font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 px-2 py-0.5 rounded text-[11px]">
                        {tx.groupName}
                      </span>
                      <span>•</span>
                      <span className="font-medium">{formatDate(tx.date)}</span>
                      <span>•</span>
                      <span className="font-medium">
                        {isExpense
                          ? `${tx.paidBy?.name} paid ${formatCurrency(tx.amount)}`
                          : `${tx.payer?.name} settled ${formatCurrency(tx.amount)} with ${tx.receiver?.name}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    {formatCurrency(tx.amount)}
                  </p>
                  {isExpense && (
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-neutral-400">
                      {tx.isPayer ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">You lent</span>
                      ) : tx.myShare > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400 font-bold">Your share: {formatCurrency(tx.myShare)}</span>
                      ) : (
                        <span>Not involved</span>
                      )}
                    </p>
                  )}
                  {isSettlement && (
                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                      Settled ({tx.paymentMethod})
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {(!summary?.recentTransactions || summary.recentTransactions.length === 0) && (
            <div className="p-12 text-center text-slate-500 dark:text-neutral-400">
              <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-400 dark:text-neutral-600" />
              <p className="text-sm font-bold text-slate-800 dark:text-white">No recent transactions</p>
              <p className="text-xs font-medium">Add an expense or settle up with your group</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
