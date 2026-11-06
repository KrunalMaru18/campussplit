import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  CheckCircle2,
  Copy,
  Check,
  Receipt,
  Scale,
  History,
  Settings,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  UserPlus,
  AlertCircle,
  Share2
} from 'lucide-react';
import { groupsApi, expensesApi, settlementsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate, getInitials } from '../utils/formatters';
import { CategoryBadge } from '../utils/categoryIcons';
import AddExpenseModal from '../components/expenses/AddExpenseModal';
import SettleUpModal from '../components/settle/SettleUpModal';
import InviteMemberModal from '../components/groups/InviteMemberModal';

export default function GroupDetails() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('expenses'); // expenses | balances | settlements | members
  const [balanceMode, setBalanceMode] = useState('simplified'); // simplified | detailed

  // Modals state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isSettleUpOpen, setIsSettleUpOpen] = useState(false);
  const [settlePrefill, setSettlePrefill] = useState({});
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Filters & Expanded items
  const [expandedExpenseId, setExpandedExpenseId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [copiedCode, setCopiedCode] = useState(false);

  // Edit group state
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupCategory, setGroupCategory] = useState('');

  const { socket, joinGroup, leaveGroup } = useSocket();

  const loadGroup = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await groupsApi.getById(groupId);
      setData(res);
      setGroupName(res.group.name);
      setGroupDesc(res.group.description || '');
      setGroupCategory(res.group.category || 'General');
    } catch (err) {
      console.error('Failed to load group:', err);
      if (!silent) setError(err.message || 'Failed to load group details.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadGroup();
    joinGroup(groupId);

    if (socket) {
      const handleGroupEvent = () => {
        loadGroup(true);
      };

      socket.on('EXPENSE_CREATED', handleGroupEvent);
      socket.on('EXPENSE_UPDATED', handleGroupEvent);
      socket.on('EXPENSE_DELETED', handleGroupEvent);
      socket.on('SETTLEMENT_RECORDED', handleGroupEvent);
      socket.on('SETTLEMENT_DELETED', handleGroupEvent);
      socket.on('MEMBER_JOINED', handleGroupEvent);

      return () => {
        leaveGroup(groupId);
        socket.off('EXPENSE_CREATED', handleGroupEvent);
        socket.off('EXPENSE_UPDATED', handleGroupEvent);
        socket.off('EXPENSE_DELETED', handleGroupEvent);
        socket.off('SETTLEMENT_RECORDED', handleGroupEvent);
        socket.off('SETTLEMENT_DELETED', handleGroupEvent);
        socket.off('MEMBER_JOINED', handleGroupEvent);
      };
    }

    return () => {
      leaveGroup(groupId);
    };
  }, [groupId, socket]);

  const handleCopyCode = () => {
    if (data?.group?.invite_code) {
      navigator.clipboard.writeText(data.group.invite_code);
      setCopiedCode(true);
      toast.success('Invite code copied to clipboard!');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await expensesApi.delete(expenseId);
      toast.success('Expense deleted.');
      loadGroup();
    } catch (err) {
      toast.error(err.message || 'Failed to delete expense.');
    }
  };

  const handleDeleteSettlement = async (settlementId) => {
    if (!window.confirm('Are you sure you want to delete this settlement?')) return;
    try {
      await settlementsApi.delete(settlementId);
      toast.success('Settlement record deleted.');
      loadGroup();
    } catch (err) {
      toast.error(err.message || 'Failed to delete settlement.');
    }
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    try {
      await groupsApi.update(groupId, {
        name: groupName,
        description: groupDesc,
        category: groupCategory,
      });
      toast.success('Group updated successfully!');
      setIsEditingGroup(false);
      loadGroup();
    } catch (err) {
      toast.error(err.message || 'Failed to update group.');
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete group "${data?.group?.name}"? All expenses and balances will be removed.`)) {
      return;
    }
    try {
      await groupsApi.delete(groupId);
      toast.success('Group deleted.');
      navigate('/groups');
    } catch (err) {
      toast.error(err.message || 'Failed to delete group.');
    }
  };

  const handleSettleSuggested = (debt) => {
    setSettlePrefill({
      payerId: debt.from.id,
      receiverId: debt.to.id,
      amount: debt.amount,
    });
    setIsSettleUpOpen(true);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8 space-y-6 max-w-6xl mx-auto animate-pulse">
        <div className="h-44 bg-slate-200 rounded-3xl"></div>
        <div className="h-12 bg-slate-200 rounded-xl w-80"></div>
        <div className="h-96 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Group Not Accessible</h2>
        <p className="text-sm text-slate-600">{error || 'Unable to find this group.'}</p>
        <button
          onClick={() => navigate('/groups')}
          className="px-4 py-2 rounded-xl gradient-brand text-white font-semibold text-xs"
        >
          Back to Groups
        </button>
      </div>
    );
  }

  const { group, members, expenses, settlements, balances } = data;
  const myBalanceObj = balances?.memberBalances?.find((m) => m.user.id === user?.id);
  const myNet = myBalanceObj?.netBalance || 0;
  const isCreator = group.created_by === user?.id;

  // Filter expenses
  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || e.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-6xl mx-auto pb-24 lg:pb-8">
      {/* Group Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <CategoryBadge categoryId={group.category} size="sm" />
              {/* Invite Code Pill */}
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-50 hover:bg-purple-100/70 border border-purple-200 text-purple-700 text-xs font-mono font-bold transition-colors"
                title="Click to copy invite code"
              >
                <span>Code: {group.invite_code}</span>
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {group.name}
            </h1>
            {group.description && (
              <p className="text-sm text-slate-500 max-w-xl">{group.description}</p>
            )}

            {/* Member Avatars Row */}
            <div className="flex items-center gap-2 pt-1">
              <div className="flex -space-x-2 overflow-hidden">
                {members.map((m) => (
                  <img
                    key={m.id}
                    src={m.avatar_url || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${m.name}`}
                    alt={m.name}
                    title={m.name}
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-slate-500 pl-1">
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </span>
            </div>
          </div>

          {/* Header Action Buttons & Stats */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3.5">
            <div className="text-left md:text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Group Spending
              </span>
              <span className="text-2xl font-extrabold text-slate-900">
                {formatCurrency(group.totalSpending || 0)}
              </span>
              <div className="text-xs font-semibold mt-0.5">
                {myNet > 0.01 ? (
                  <span className="text-emerald-600">You are owed {formatCurrency(myNet)}</span>
                ) : myNet < -0.01 ? (
                  <span className="text-rose-600">You owe {formatCurrency(Math.abs(myNet))}</span>
                ) : (
                  <span className="text-slate-500">You are all settled</span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setEditingExpense(null);
                  setIsAddExpenseOpen(true);
                }}
                className="px-4 py-2 rounded-xl gradient-brand text-white font-semibold text-xs shadow-md shadow-purple-600/30 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Expense</span>
              </button>
              <button
                onClick={() => {
                  setSettlePrefill({});
                  setIsSettleUpOpen(true);
                }}
                className="px-4 py-2 rounded-xl gradient-emerald text-white font-semibold text-xs shadow-md shadow-emerald-600/30 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Settle Up</span>
              </button>
              <button
                onClick={() => setIsInviteOpen(true)}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                title="Invite Member"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 overflow-x-auto gap-2 -mb-2 pt-2">
          {[
            { id: 'expenses', label: 'Expenses', icon: Receipt, count: expenses.length },
            { id: 'balances', label: 'Balances & Simplification', icon: Scale, count: balances?.simplifiedDebts?.length },
            { id: 'settlements', label: 'Settle History', icon: History, count: settlements.length },
            { id: 'members', label: 'Members & Settings', icon: Settings, count: members.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-semibold text-xs sm:text-sm whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <input
              type="text"
              placeholder="Search expenses by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-72 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
            />
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
              {['All', 'Food', 'Travel', 'Rent', 'Utilities', 'Groceries', 'Entertainment'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all ${
                    selectedCategory === cat
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Expenses List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {filteredExpenses.map((exp) => {
              const isExpanded = expandedExpenseId === exp.id;
              const mySplit = exp.splits?.find((s) => s.user_id === user?.id);
              const isPayer = exp.paid_by_id === user?.id;

              return (
                <div key={exp.id} className="transition-colors hover:bg-slate-50/50">
                  <div
                    onClick={() => setExpandedExpenseId(isExpanded ? null : exp.id)}
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm sm:text-base text-slate-900 truncate">
                          {exp.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <CategoryBadge categoryId={exp.category} size="xs" />
                          <span>•</span>
                          <span>{formatDate(exp.expense_date)}</span>
                          <span>•</span>
                          <span className="font-medium">
                            Paid by <strong className="text-slate-700">{exp.paid_by_name}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="font-extrabold text-sm sm:text-base text-slate-900">
                          {formatCurrency(exp.amount)}
                        </p>
                        <p className="text-[11px] font-semibold">
                          {isPayer ? (
                            <span className="text-emerald-600 font-bold">You lent</span>
                          ) : mySplit ? (
                            <span className="text-rose-600 font-bold">Your share: {formatCurrency(mySplit.amount_owed)}</span>
                          ) : (
                            <span className="text-slate-400">Not involved</span>
                          )}
                        </p>
                      </div>
                      <button className="text-slate-400 hover:text-slate-600 p-1">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Split Breakdown & Actions */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 bg-slate-50/70 border-t border-slate-100 text-xs space-y-3">
                      {exp.notes && (
                        <p className="text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200">
                          &quot;{exp.notes}&quot;
                        </p>
                      )}

                      <div>
                        <div className="flex items-center justify-between text-slate-500 font-semibold mb-2">
                          <span>Split Breakdown ({exp.split_type}):</span>
                          <span>Total: {formatCurrency(exp.amount)}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {exp.splits?.map((split) => (
                            <div
                              key={split.id}
                              className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <img
                                  src={split.user_avatar || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${split.user_name}`}
                                  className="w-5 h-5 rounded-full object-cover shrink-0"
                                />
                                <span className="font-medium text-slate-800 truncate">
                                  {split.user_name}
                                </span>
                              </div>
                              <span className="font-bold text-slate-900 shrink-0">
                                {formatCurrency(split.amount_owed)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          onClick={() => {
                            setEditingExpense(exp);
                            setIsAddExpenseOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredExpenses.length === 0 && (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Receipt className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-bold text-sm text-slate-700">No expenses recorded</p>
                <p className="text-xs">Add your first bill to see the smart split in action!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BALANCES & SMART SIMPLIFICATION (CORE ALGORITHM FEATURE) */}
      {activeTab === 'balances' && (
        <div className="space-y-6">
          {/* Debt Simplification Highlights Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/30 flex items-center justify-center text-purple-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Smart Debt Simplification</h3>
                  <p className="text-xs text-purple-200">
                    Minimizes bank & UPI transfers using the Min-Cash-Flow graph algorithm
                  </p>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="inline-flex rounded-xl bg-white/10 p-1 backdrop-blur-md">
                <button
                  onClick={() => setBalanceMode('simplified')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    balanceMode === 'simplified'
                      ? 'bg-purple-500 text-white shadow'
                      : 'text-purple-200 hover:text-white'
                  }`}
                >
                  Simplified ({balances?.simplifiedDebts?.length || 0})
                </button>
                <button
                  onClick={() => setBalanceMode('detailed')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    balanceMode === 'detailed'
                      ? 'bg-purple-500 text-white shadow'
                      : 'text-purple-200 hover:text-white'
                  }`}
                >
                  Detailed Debts ({balances?.detailedDebts?.length || 0})
                </button>
              </div>
            </div>

            {balances?.transactionsSaved > 0 && (
              <div className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Algorithm saved {balances.transactionsSaved} unnecessary {balances.transactionsSaved === 1 ? 'payment' : 'payments'}! Group settled in only {balances.simplifiedDebts.length} {balances.simplifiedDebts.length === 1 ? 'step' : 'steps'}.
                </span>
              </div>
            )}
          </div>

          {/* Suggested Settlements Cards */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              {balanceMode === 'simplified' ? 'Minimal Suggested Payments' : 'Direct Pairwise Debts'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(balanceMode === 'simplified' ? balances?.simplifiedDebts : balances?.detailedDebts)?.map(
                (debt, idx) => {
                  const isUserDebtor = debt.from?.id === user?.id;
                  const isUserCreditor = debt.to?.id === user?.id;

                  return (
                    <div
                      key={idx}
                      className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-3 hover:border-purple-200 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={debt.from?.avatar_url || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${debt.from?.name}`}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {debt.from?.name} {isUserDebtor ? '(You)' : ''}
                          </p>
                          <p className="text-[11px] text-slate-400">owes</p>
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {debt.to?.name} {isUserCreditor ? '(You)' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-base font-extrabold text-slate-900 mb-1.5">
                          {formatCurrency(debt.amount)}
                        </p>
                        <button
                          onClick={() => handleSettleSuggested(debt)}
                          className="px-3 py-1 rounded-lg gradient-emerald text-white font-bold text-[11px] shadow-sm hover:brightness-105 active:scale-95 transition-all"
                        >
                          Settle Now
                        </button>
                      </div>
                    </div>
                  );
                }
              )}

              {((balanceMode === 'simplified' ? balances?.simplifiedDebts : balances?.detailedDebts)?.length || 0) === 0 && (
                <div className="sm:col-span-2 p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="font-bold text-slate-800">Everyone is fully settled!</p>
                  <p className="text-xs">No pending debts in this group.</p>
                </div>
              )}
            </div>
          </div>

          {/* Member Balance Summary Table */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Member Net Balance Overview
            </h4>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="p-3.5">Member</th>
                    <th className="p-3.5">Total Paid</th>
                    <th className="p-3.5">Total Owed</th>
                    <th className="p-3.5 text-right">Net Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {balances?.memberBalances?.map((mb) => {
                    const isOwed = mb.netBalance > 0.01;
                    const owes = mb.netBalance < -0.01;

                    return (
                      <tr key={mb.user.id} className="hover:bg-slate-50/50">
                        <td className="p-3.5 flex items-center gap-2.5">
                          <img
                            src={mb.user.avatar_url || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${mb.user.name}`}
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {mb.user.name} {mb.user.id === user?.id ? '(You)' : ''}
                            </span>
                            <span className="text-[10px] text-slate-400">{mb.user.upi_id || mb.user.email}</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700">
                          {formatCurrency(mb.totalPaid)}
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700">
                          {formatCurrency(mb.totalOwed)}
                        </td>
                        <td className="p-3.5 text-right font-extrabold text-sm">
                          <span
                            className={`px-2.5 py-1 rounded-lg ${
                              isOwed
                                ? 'bg-emerald-50 text-emerald-700'
                                : owes
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isOwed ? `+${formatCurrency(mb.netBalance)}` : owes ? `-${formatCurrency(Math.abs(mb.netBalance))}` : '₹0.00'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SETTLEMENT HISTORY */}
      {activeTab === 'settlements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">Settlement History</h3>
              <p className="text-xs text-slate-500">Record of all cleared debt payments</p>
            </div>
            <button
              onClick={() => {
                setSettlePrefill({});
                setIsSettleUpOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl gradient-emerald text-white font-semibold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Settlement</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {settlements.map((set) => (
              <div
                key={set.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <span>{set.payer_name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{set.receiver_name}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                        {set.payment_method}
                      </span>
                      <span>•</span>
                      <span>{formatDate(set.settlement_date)}</span>
                      {set.notes && (
                        <>
                          <span>•</span>
                          <span className="italic">{set.notes}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-base font-extrabold text-emerald-600">
                    {formatCurrency(set.amount)}
                  </span>
                  {(set.payer_id === user?.id || set.receiver_id === user?.id || isCreator) && (
                    <button
                      onClick={() => handleDeleteSettlement(set.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Undo Settlement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {settlements.length === 0 && (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <History className="w-10 h-10 mx-auto text-slate-300" />
                <p className="font-bold text-slate-700 text-sm">No settlements recorded yet</p>
                <p className="text-xs">When members pay back debts, record them here!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: MEMBERS & SETTINGS */}
      {activeTab === 'members' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Members list */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Group Members ({members.length})</h3>
              <button
                onClick={() => setIsInviteOpen(true)}
                className="px-3 py-1.5 rounded-xl gradient-brand text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite Friend</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
              {members.map((m) => (
                <div key={m.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={m.avatar_url || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${m.name}`}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 truncate">{m.name}</span>
                        {m.id === user?.id && (
                          <span className="text-[10px] font-semibold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">
                            You
                          </span>
                        )}
                        {m.role === 'admin' && (
                          <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">{m.upi_id || m.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">
                    Joined {formatDate(m.joined_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Group Settings / Edit Form */}
          <div className="space-y-4">
            <h3 className="font-bold text-base text-slate-900">Group Settings</h3>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
              <form onSubmit={handleUpdateGroup} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={groupCategory}
                    onChange={(e) => setGroupCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="College Friends">College Friends</option>
                    <option value="Hostel Roommates">Hostel Roommates</option>
                    <option value="College Trip">College Trip</option>
                    <option value="Birthday Party">Birthday Party</option>
                    <option value="Food & Outings">Food & Outings</option>
                    <option value="Project Team">Project Team</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={groupDesc}
                    onChange={(e) => setGroupDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-xl gradient-brand text-white font-semibold text-xs shadow-sm hover:brightness-105 transition-all"
                >
                  Save Group Changes
                </button>
              </form>

              {isCreator && (
                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={handleDeleteGroup}
                    className="w-full py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Group</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setEditingExpense(null);
        }}
        onSuccess={loadGroup}
        initialGroupId={groupId}
        editingExpense={editingExpense}
      />

      <SettleUpModal
        isOpen={isSettleUpOpen}
        onClose={() => setIsSettleUpOpen(false)}
        onSuccess={loadGroup}
        groupId={groupId}
        members={members}
        prefillPayerId={settlePrefill.payerId}
        prefillReceiverId={settlePrefill.receiverId}
        prefillAmount={settlePrefill.amount}
      />

      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSuccess={loadGroup}
        group={group}
      />
    </div>
  );
}
