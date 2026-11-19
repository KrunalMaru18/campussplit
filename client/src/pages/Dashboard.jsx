import React, { useState, useEffect, useMemo } from 'react';
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
  AlertCircle,
  Search,
  Check,
  CreditCard,
  Scale
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
  const [txSearch, setTxSearch] = useState('');

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

  // Time-based personalized greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Today's formatted date
  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }).format(new Date());
  }, []);

  // Filter recent transactions by search
  const filteredTransactions = useMemo(() => {
    if (!summary?.recentTransactions) return [];
    if (!txSearch.trim()) return summary.recentTransactions;
    const q = txSearch.toLowerCase().trim();
    return summary.recentTransactions.filter(
      (tx) =>
        tx.title?.toLowerCase().includes(q) ||
        tx.groupName?.toLowerCase().includes(q) ||
        tx.paidBy?.name?.toLowerCase().includes(q) ||
        tx.payer?.name?.toLowerCase().includes(q)
    );
  }, [summary?.recentTransactions, txSearch]);

  if (loading) {
    return (
      <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto animate-pulse">
        {/* Skeleton Greeting */}
        <div className="h-36 bg-[#EAE9F5] dark:bg-[#21213E] rounded-3xl w-full"></div>
        {/* Skeleton Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-[#EAE9F5] dark:bg-[#21213E] rounded-2xl"></div>
          ))}
        </div>
        {/* Skeleton Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-[#EAE9F5] dark:bg-[#21213E] rounded-2xl"></div>
          <div className="h-72 bg-[#EAE9F5] dark:bg-[#21213E] rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const netBalance = summary?.netBalance || 0;
  const isNetPositive = netBalance > 0.01;
  const isNetNegative = netBalance < -0.01;

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto pb-28 lg:pb-12 transition-colors duration-200">
      {/* Network / Connection Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadDashboard()}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 active:scale-95 transition-all self-end sm:self-auto shadow-sm"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* Hero Welcome & Financial Summary Banner */}
      <div className="relative overflow-hidden rounded-3xl gradient-brand p-6 sm:p-8 text-white shadow-xl shadow-[#6654D9]/20">
        {/* Subtle geometric background accents */}
        <div className="absolute -right-8 -bottom-8 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-40 -top-12 w-56 h-56 bg-[#DCD6FF]/20 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-[#DCD6FF]">
              <Calendar className="w-3.5 h-3.5 text-[#DCD6FF]" />
              <span>{todayFormatted}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {greeting}, {user?.name || 'Student'}! 👋
            </h2>
            <p className="text-xs sm:text-sm text-purple-100/90 max-w-xl font-medium leading-relaxed">
              Track your shared hostel expenses, canteen treats, trips, and group split balances with zero awkwardness.
            </p>
          </div>

          {/* Quick Action Pill Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            <button
              onClick={onOpenAddExpense}
              className="px-4 py-2.5 rounded-xl bg-white text-[#6654D9] font-black text-xs sm:text-sm shadow-md hover:bg-[#F7F7FC] active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Expense</span>
            </button>
            <button
              onClick={onOpenCreateGroup}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-bold text-xs sm:text-sm border border-white/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Users2 className="w-4 h-4" />
              <span>New Group</span>
            </button>
            <button
              onClick={onOpenJoinGroup}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-bold text-xs sm:text-sm border border-white/20 active:scale-95 transition-all"
            >
              <span>Join Group</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Group Expenses */}
        <div className="campus-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black text-[#636280] dark:text-[#A5A4BF] uppercase tracking-wider">
                Total Expenses
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#6654D9]/10 text-[#6654D9] dark:text-[#917FF2] flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#17172B] dark:text-white tracking-tight">
              {formatCurrency(summary?.totalGroupExpenses || 0)}
            </p>
          </div>
          <p className="text-xs text-[#7E7D9C] dark:text-[#A5A4BF] mt-3 font-semibold flex items-center gap-1">
            <span>Across all {summary?.activeGroups?.length || 0} active groups</span>
          </p>
        </div>

        {/* Total Paid by Me */}
        <div className="campus-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black text-[#636280] dark:text-[#A5A4BF] uppercase tracking-wider">
                Total Paid By Me
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#17172B] dark:text-white tracking-tight">
              {formatCurrency(summary?.totalPaidByMe || 0)}
            </p>
          </div>
          <p className="text-xs text-[#7E7D9C] dark:text-[#A5A4BF] mt-3 font-semibold">
            Bills you personally fronted
          </p>
        </div>

        {/* Amount Others Owe Me */}
        <div className="campus-card p-5 flex flex-col justify-between border-emerald-500/30">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                You Are Owed
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatCurrency(summary?.amountOwedToMe || 0)}
            </p>
          </div>
          <p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold mt-3">
            {summary?.amountOwedToMe > 0 ? 'Friends owe you back' : 'No pending receivables'}
          </p>
        </div>

        {/* Amount I Owe */}
        <div className="campus-card p-5 flex flex-col justify-between border-rose-500/30">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                You Owe
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
            <p className="text-2xl font-black text-[#FF5A79] tracking-tight">
              {formatCurrency(summary?.amountIOwe || 0)}
            </p>
          </div>
          <p className="text-xs text-rose-700 dark:text-rose-300 font-bold mt-3">
            {summary?.amountIOwe > 0 ? 'Pending debts to settle' : 'Zero pending debts'}
          </p>
        </div>
      </div>

      {/* Net Balance Status Highlight Bar */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-sm ${
          isNetPositive
            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200'
            : isNetNegative
            ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-200'
            : 'bg-slate-100 dark:bg-[#29294D] border-slate-200 dark:border-[#3B3B66] text-[#17172B] dark:text-white'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 shadow-sm ${
              isNetPositive
                ? 'bg-emerald-500 text-white'
                : isNetNegative
                ? 'bg-[#FF5A79] text-white'
                : 'bg-slate-400 text-white'
            }`}
          >
            {isNetPositive ? '+' : isNetNegative ? '-' : '✓'}
          </div>
          <div>
            <p className="font-black text-sm sm:text-base">
              {isNetPositive
                ? `Overall, friends owe you ${formatCurrency(netBalance)} across all groups.`
                : isNetNegative
                ? `Overall, you owe ${formatCurrency(Math.abs(netBalance))} across all groups.`
                : 'You are completely settled up with everyone!'}
            </p>
            <p className="text-xs opacity-80 font-medium mt-0.5">
              Simplification algorithm eliminates circular payments to settle with fewest transactions.
            </p>
          </div>
        </div>
        <NavLink
          to="/analytics"
          className="inline-flex items-center gap-1.5 text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition-all shrink-0 self-start sm:self-auto bg-[#6654D9] hover:bg-[#5843CC] text-white active:scale-95"
        >
          <span>View Trends & Reports</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </NavLink>
      </div>

      {/* Main Grid: Active Groups + Top Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Active Groups Showcase */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-[#17172B] dark:text-white">Active Groups</h3>
              <p className="text-xs text-[#7E7D9C] dark:text-[#A5A4BF] font-semibold">
                Groups where you actively share expenses
              </p>
            </div>
            <NavLink
              to="/groups"
              className="text-xs font-black text-[#6654D9] hover:text-[#5843CC] dark:text-[#917FF2] flex items-center gap-1"
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
                  className="campus-card campus-card-hover p-5 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <CategoryBadge categoryId={group.category} size="xs" />
                      <span className="text-[11px] font-bold text-[#7E7D9C] dark:text-[#A5A4BF]">
                        {group.memberCount} members
                      </span>
                    </div>

                    <h4 className="font-extrabold text-base text-[#17172B] dark:text-white group-hover:text-[#6654D9] dark:group-hover:text-[#917FF2] transition-colors line-clamp-1">
                      {group.name}
                    </h4>
                    <p className="text-xs text-[#7E7D9C] dark:text-[#A5A4BF] mt-1 font-semibold">
                      Total spent: <span className="font-bold text-[#17172B] dark:text-white">{formatCurrency(group.totalSpending)}</span>
                    </p>
                  </div>

                  {/* Net Balance Pill in this group */}
                  <div className="pt-4 mt-4 border-t border-[#EAE9F5] dark:border-[rgba(145,127,242,0.16)] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#636280] dark:text-[#A5A4BF]">Your share:</span>
                    <span
                      className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                        isOwed
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                          : owes
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
                          : 'bg-[#F0EFF9] dark:bg-[#29294D] text-[#636280] dark:text-[#A5A4BF]'
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
              <div className="sm:col-span-2 campus-card p-8 text-center space-y-3 border-dashed">
                <Users2 className="w-10 h-10 text-[#7E7D9C] dark:text-[#A5A4BF] mx-auto opacity-60" />
                <p className="text-sm font-black text-[#17172B] dark:text-white">No active groups yet</p>
                <p className="text-xs text-[#7E7D9C] dark:text-[#A5A4BF] max-w-sm mx-auto font-medium">
                  Create a group with your hostel mates, trip buddies, or project team to start splitting!
                </p>
                <button
                  onClick={onOpenCreateGroup}
                  className="px-4 py-2 rounded-xl gradient-brand text-white font-bold text-xs shadow-md"
                >
                  Create Your First Group
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Category Breakdown Widget */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-[#17172B] dark:text-white">Top Categories</h3>
            <NavLink
              to="/analytics"
              className="text-xs font-black text-[#6654D9] hover:text-[#5843CC] dark:text-[#917FF2]"
            >
              Analytics →
            </NavLink>
          </div>

          <div className="campus-card p-5 space-y-4">
            {summary?.categorySpending?.slice(0, 5).map((cat) => {
              const maxSpend = Math.max(...(summary?.categorySpending?.map((c) => c.amount) || [1]));
              const pct = maxSpend > 0 ? (cat.amount / maxSpend) * 100 : 0;
              const meta = getCategoryMeta(cat.category);
              const Icon = meta.icon;

              return (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${meta.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[#17172B] dark:text-white font-bold">{meta.label}</span>
                    </div>
                    <span className="font-black text-[#17172B] dark:text-white">{formatCurrency(cat.amount)}</span>
                  </div>
                  <div className="w-full bg-[#F0EFF9] dark:bg-[#29294D] rounded-full h-2 overflow-hidden">
                    <div
                      className="gradient-brand h-2 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}

            {(!summary?.categorySpending || summary.categorySpending.length === 0) && (
              <p className="text-xs text-[#7E7D9C] dark:text-[#A5A4BF] text-center py-6 font-medium">
                No expense categories recorded yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions Feed with Real-time Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-[#17172B] dark:text-white">Recent Transactions</h3>
            <p className="text-xs text-[#7E7D9C] dark:text-[#A5A4BF] font-semibold">
              Live expenses and settlements across your groups
            </p>
          </div>

          {/* Quick Search Input */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#7E7D9C]" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F0EFF9] dark:bg-[#29294D] border border-transparent focus:border-[#6654D9] text-[#17172B] dark:text-white placeholder-[#7E7D9C] transition-all"
              />
            </div>
            <NavLink
              to="/activity"
              className="text-xs font-black text-[#6654D9] hover:text-[#5843CC] dark:text-[#917FF2] flex items-center gap-1 shrink-0"
            >
              <span>Full Log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>
        </div>

        <div className="campus-card divide-y divide-[#EAE9F5] dark:divide-[rgba(145,127,242,0.16)] overflow-hidden">
          {filteredTransactions.map((tx) => {
            const isExpense = tx.type === 'expense';
            const isSettlement = tx.type === 'settlement';

            return (
              <div
                key={tx.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#F0EFF9]/50 dark:hover:bg-[#29294D]/50 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {isExpense ? (
                    <div className="w-10 h-10 rounded-xl bg-[#6654D9]/10 text-[#6654D9] dark:text-[#917FF2] flex items-center justify-center shrink-0 border border-[#6654D9]/20">
                      <Receipt className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="font-extrabold text-sm text-[#17172B] dark:text-white truncate">
                      {tx.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#7E7D9C] dark:text-[#A5A4BF] mt-0.5">
                      <span className="font-black text-[#6654D9] dark:text-[#DCD6FF] bg-[#6654D9]/10 dark:bg-[#6654D9]/20 px-2 py-0.5 rounded-md text-[10px]">
                        {tx.groupName}
                      </span>
                      <span>•</span>
                      <span className="font-medium">{formatDate(tx.date)}</span>
                      <span>•</span>
                      <span className="font-semibold text-[#17172B] dark:text-[#DCD6FF]">
                        {isExpense
                          ? `${tx.paidBy?.name} paid ${formatCurrency(tx.amount)}`
                          : `${tx.payer?.name} settled ${formatCurrency(tx.amount)} with ${tx.receiver?.name}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-black text-sm sm:text-base text-[#17172B] dark:text-white">
                    {formatCurrency(tx.amount)}
                  </p>
                  {isExpense && (
                    <p className="text-[11px] font-bold">
                      {tx.isPayer ? (
                        <span className="text-emerald-600 dark:text-emerald-400">You lent</span>
                      ) : tx.myShare > 0 ? (
                        <span className="text-[#FF5A79]">Your share: {formatCurrency(tx.myShare)}</span>
                      ) : (
                        <span className="text-[#7E7D9C]">Not involved</span>
                      )}
                    </p>
                  )}
                  {isSettlement && (
                    <span className="text-[10px] uppercase font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      Settled ({tx.paymentMethod})
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredTransactions.length === 0 && (
            <div className="p-12 text-center text-[#7E7D9C] dark:text-[#A5A4BF]">
              <Receipt className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-black text-[#17172B] dark:text-white">No transactions found</p>
              <p className="text-xs font-medium">Add an expense or settle up with your group to see history</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
