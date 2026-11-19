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
  Share2,
  Filter,
  Search
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
    if (
      !window.confirm(
        `Are you sure you want to permanently delete group "${data?.group?.name}"? All expenses and balances will be removed.`
      )
    ) {
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
        <div className="h-44 bg-[#EAE9F5] dark:bg-[#21213E] rounded-3xl"></div>
        <div className="h-12 bg-[#EAE9F5] dark:bg-[#21213E] rounded-xl w-80"></div>
        <div className="h-96 bg-[#EAE9F5] dark:bg-[#21213E] rounded-2xl"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-[#17172B] dark:text-white">Group Not Accessible</h2>
        <p className="text-sm text-[#7E7D9C] dark:text-[#A5A4BF]">{error || 'Unable to find this group.'}</p>
        <button
          onClick={() => navigate('/groups')}
          className="px-4 py-2 rounded-xl gradient-brand text-white font-bold text-xs shadow-md"
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
    <div className="p-4 sm:p-8 space-y-6 max-w-6xl mx-auto pb-28 lg:pb-12 transition-colors duration-200">
      {/* Group Header Hero Card */}
      <div className="campus-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <CategoryBadge categoryId={group.category} size="sm" />
              {/* Invite Code Pill */}
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#6654D9]/10 hover:bg-[#6654D9]/20 border border-[#6654D9]/30 text-[#6654D9] dark:text-[#DCD6FF] text-xs font-mono font-black transition-colors"
                title="Click to copy invite code"
              >
                <span>Code: {group.invite_code}</span>
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#17172B] dark:text-white tracking-tight">
              {group.name}
            </h1>
            {group.description && (
              <p className="text-sm text-[#7E7D9C] dark:text-[#A5A4BF] max-w-xl font-medium leading-relaxed">
                {group.description}
              </p>
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
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-[#21213E] object-cover"
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-[#7E7D9C] dark:text-[#A5A4BF] pl-1">
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </span>
            </div>
          </div>

          {/* Header Action Buttons & Total Spending */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3.5">
            <div className="text-left md:text-right">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#7E7D9C] dark:text-[#A5A4BF] block">
                Total Group Spend
              </span>
              <span className="text-2xl font-black text-[#17172B] dark:text-white">
                {formatCurrency(group.totalSpending || 0)}
              </span>
              <div className="text-xs font-bold mt-1">
                {myNet > 0.01 ? (
                  <span className="text-emerald-600 dark:text-emerald-400">You are owed {formatCurrency(myNet)}</span>
                ) : myNet < -0.01 ? (
                  <span className="text-[#FF5A79]">You owe {formatCurrency(Math.abs(myNet))}</span>
                ) : (
                  <span className="text-[#7E7D9C] dark:text-[#A5A4BF]">You are completely settled</span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setEditingExpense(null);
                  setIsAddExpenseOpen(true);
                }}
                className="px-4 py-2 rounded-xl gradient-brand text-white font-bold text-xs shadow-md shadow-[#6654D9]/30 hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Expense</span>
              </button>
              <button
                onClick={() => {
                  setSettlePrefill({});
                  setIsSettleUpOpen(true);
                }}
                className="px-4 py-2 rounded-xl gradient-emerald text-white font-bold text-xs shadow-md shadow-emerald-600/30 hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Settle Up</span>
              </button>
              <button
                onClick={() => setIsInviteOpen(true)}
                className="p-2 rounded-xl bg-[#F0EFF9] dark:bg-[#29294D] text-[#17172B] dark:text-white hover:bg-[#E4E2F6] dark:hover:bg-[#33335C] transition-colors"
                title="Invite Member"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#EAE9F5] dark:border-[rgba(145,127,242,0.16)] overflow-x-auto gap-2 -mb-2 pt-2">
          {[
            { id: 'expenses', label: 'Expenses', icon: Receipt, count: expenses.length },
            { id: 'balances', label: 'Smart Balances', icon: Scale, count: balances?.simplifiedDebts?.length },
            { id: 'settlements', label: 'Settle History', icon: History, count: settlements.length },
            { id: 'members', label: 'Members & Settings', icon: Settings, count: members.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-black text-xs sm:text-sm whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-[#6654D9] text-[#6654D9] dark:border-[#917FF2] dark:text-[#917FF2]'
                    : 'border-transparent text-[#7E7D9C] dark:text-[#A5A4BF] hover:text-[#17172B] dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      isActive
                        ? 'bg-[#6654D9]/15 text-[#6654D9] dark:bg-[#917FF2]/20 dark:text-[#DCD6FF]'
                        : 'bg-[#F0EFF9] dark:bg-[#29294D] text-[#7E7D9C]'
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
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-[#7E7D9C]" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 bg-white dark:bg-[#21213E] border border-[#EAE9F5] dark:border-[rgba(145,127,242,0.16)] rounded-xl text-xs font-semibold placeholder-[#7E7D9C] text-[#17172B] dark:text-white shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
              {['All', 'Food', 'Travel', 'Rent', 'Utilities', 'Groceries', 'Entertainment'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-[#6654D9] text-white shadow-md shadow-[#6654D9]/25'
                      : 'bg-white dark:bg-[#21213E] text-[#636280] dark:text-[#A5A4BF] border border-[#EAE9F5] dark:border-[rgba(145,127,242,0.16)] hover:bg-[#F0EFF9] dark:hover:bg-[#29294D]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Expenses List */}
          <div className="campus-card divide-y divide-[#EAE9F5] dark:divide-[rgba(145,127,242,0.16)] overflow-hidden">
            {filteredExpenses.map((exp) => {
              const isExpanded = expandedExpenseId === exp.id;
              const mySplit = exp.splits?.find((s) => s.user_id === user?.id);
              const isPayer = exp.paid_by_id === user?.id;

              return (
                <div key={exp.id} className="transition-colors hover:bg-[#F0EFF9]/50 dark:hover:bg-[#29294D]/50">
                  <div
                    onClick={() => setExpandedExpenseId(isExpanded ? null : exp.id)}
                    className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#6654D9]/10 text-[#6654D9] dark:text-[#917FF2] flex items-center justify-center shrink-0 border border-[#6654D9]/20">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-sm sm:text-base text-[#17172B] dark:text-white truncate">
                          {exp.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#7E7D9C] dark:text-[#A5A4BF] mt-0.5">
                          <CategoryBadge categoryId={exp.category} size="xs" />
                          <span>•</span>
                          <span>{formatDate(exp.expense_date)}</span>
                          <span>•</span>
                          <span className="font-semibold text-[#17172B] dark:text-[#DCD6FF]">
                            Paid by <strong>{exp.paid_by_name}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="font-black text-sm sm:text-base text-[#17172B] dark:text-white">
                          {formatCurrency(exp.amount)}
                        </p>
                        <p className="text-[11px] font-bold">
                          {isPayer ? (
                            <span className="text-emerald-600 dark:text-emerald-400">You lent</span>
                          ) : mySplit ? (
                            <span className="text-[#FF5A79]">Your share: {formatCurrency(mySplit.amount_owed)}</span>
                          ) : (
                            <span className="text-[#7E7D9C]">Not involved</span>
                          )}
                        </p>
                      </div>
                      <button className="text-[#7E7D9C] p-1">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Split Breakdown & Actions */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 bg-[#F0EFF9]/60 dark:bg-[#1D1D35] border-t border-[#EAE9F5] dark:border-[rgba(145,127,242,0.16)] text-xs space-y-3">
                      {exp.notes && (
                        <p className="text-[#494866] dark:text-[#DCD6FF] italic bg-white dark:bg-[#21213E] p-2.5 rounded-xl border border-[#EAE9F5] dark:border-[rgba(145,127,242,0.16)]">
                          &quot;{exp.notes}&quot;
                        </p>
                      )}

                      <div>
                        <div className="flex items-center justify-between text-[#7E7D9C] dark:text-[#A5A4BF] font-bold mb-2">
                          <span>Split Breakdown ({exp.split_type}):</span>
                          <span>Total: {formatCurrency(exp.amount)}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {exp.splits?.map((split) => (
                            <div
                              key={split.id}
                              className="bg-white dark:bg-[#21213E] p-2.5 rounded-xl border border-[#EAE9F5] dark:border-[rgba(145,127,242,0.16)] flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <img
                                  src={
                                    split.user_avatar ||
                                    `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${split.user_name}`
                                  }
                                  className="w-5 h-5 rounded-full object-cover shrink-0"
                                />
                                <span className="font-bold text-[#17172B] dark:text-white truncate">
                                  {split.user_name}
                                </span>
                              </div>
                              <span className="font-black text-[#17172B] dark:text-white shrink-0">
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
                          className="px-3 py-1.5 rounded-xl border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.3)] text-[#6654D9] dark:text-[#DCD6FF] bg-white dark:bg-[#21213E] hover:bg-[#F0EFF9] font-bold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 font-bold text-xs flex items-center gap-1.5 transition-colors"
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
              <div className="p-12 text-center text-[#7E7D9C] dark:text-[#A5A4BF] space-y-2">
                <Receipt className="w-10 h-10 mx-auto opacity-50" />
                <p className="font-black text-sm text-[#17172B] dark:text-white">No expenses recorded</p>
                <p className="text-xs">Add your first bill to see the smart split in action!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SMART DEBT SIMPLIFICATION */}
      {activeTab === 'balances' && (
        <div className="space-y-6">
          {/* Debt Simplification Highlights Banner */}
          <div className="p-5 rounded-3xl gradient-brand text-white shadow-xl shadow-[#6654D9]/20 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base">Smart Debt Simplification</h3>
                  <p className="text-xs text-purple-100/90 font-medium">
                    Calculates minimum UPI settlement steps using the Min-Cash-Flow graph algorithm
                  </p>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="inline-flex rounded-xl bg-white/15 p-1 backdrop-blur-md">
                <button
                  onClick={() => setBalanceMode('simplified')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    balanceMode === 'simplified'
                      ? 'bg-white text-[#6654D9] shadow-sm'
                      : 'text-white hover:text-purple-100'
                  }`}
                >
                  Simplified ({balances?.simplifiedDebts?.length || 0})
                </button>
                <button
                  onClick={() => setBalanceMode('detailed')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    balanceMode === 'detailed'
                      ? 'bg-white text-[#6654D9] shadow-sm'
                      : 'text-white hover:text-purple-100'
                  }`}
                >
                  Detailed Debts ({balances?.detailedDebts?.length || 0})
                </button>
              </div>
            </div>

            {balances?.transactionsSaved > 0 && (
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/25 border border-emerald-400/40 text-emerald-100 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>
                  Algorithm eliminated {balances.transactionsSaved} redundant {balances.transactionsSaved === 1 ? 'transaction' : 'transactions'}! All group debts settled in only {balances.simplifiedDebts.length} {balances.simplifiedDebts.length === 1 ? 'step' : 'steps'}.
                </span>
              </div>
            )}
          </div>

          {/* Suggested Settlements Cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-[#7E7D9C] dark:text-[#A5A4BF] uppercase tracking-wider">
              {balanceMode === 'simplified' ? 'Minimal Suggested Settlements' : 'Direct Pairwise Debts'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(balanceMode === 'simplified' ? balances?.simplifiedDebts : balances?.detailedDebts)?.map(
                (debt, idx) => {
                  const isUserDebtor = debt.from?.id === user?.id;
                  const isUserCreditor = debt.to?.id === user?.id;

                  return (
                    <div
                      key={idx}
                      className="campus-card p-4 flex items-center justify-between gap-3 hover:border-[#6654D9]/40 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={
                            debt.from?.avatar_url ||
                            `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${debt.from?.name}`
                          }
                          className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-[#6654D9]/20"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-black text-[#17172B] dark:text-white truncate">
                            {debt.from?.name} {isUserDebtor ? '(You)' : ''}
                          </p>
                          <p className="text-[10px] font-bold text-[#7E7D9C]">pays to</p>
                          <p className="text-xs font-black text-[#17172B] dark:text-white truncate">
                            {debt.to?.name} {isUserCreditor ? '(You)' : ''}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-base font-black text-[#17172B] dark:text-white mb-1.5">
                          {formatCurrency(debt.amount)}
                        </p>
                        <button
                          onClick={() => handleSettleSuggested(debt)}
                          className="px-3 py-1 rounded-xl gradient-emerald text-white font-black text-[11px] shadow-sm hover:brightness-105 active:scale-95 transition-all"
                        >
                          Settle Now
                        </button>
                      </div>
                    </div>
                  );
                }
              )}

              {((balanceMode === 'simplified' ? balances?.simplifiedDebts : balances?.detailedDebts)?.length || 0) === 0 && (
                <div className="sm:col-span-2 campus-card p-8 text-center text-[#7E7D9C] dark:text-[#A5A4BF]">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="font-black text-[#17172B] dark:text-white text-sm">Everyone is fully settled!</p>
                  <p className="text-xs font-medium">No pending debts in this group.</p>
                </div>
              )}
            </div>
          </div>

          {/* Member Balance Overview Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-[#7E7D9C] dark:text-[#A5A4BF] uppercase tracking-wider">
              Member Net Balance Overview
            </h4>

            <div className="campus-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F0EFF9] dark:bg-[#1D1D35] border-b border-[#EAE9F5] dark:border-[rgba(145,127,242,0.16)] text-[#7E7D9C] dark:text-[#A5A4BF] uppercase tracking-wider font-black">
                    <tr>
                      <th className="p-3.5">Member</th>
                      <th className="p-3.5">Total Paid</th>
                      <th className="p-3.5">Total Owed</th>
                      <th className="p-3.5 text-right">Net Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE9F5] dark:divide-[rgba(145,127,242,0.16)] font-semibold">
                    {balances?.memberBalances?.map((mb) => {
                      const isOwed = mb.netBalance > 0.01;
                      const owes = mb.netBalance < -0.01;

                      return (
                        <tr key={mb.user.id} className="hover:bg-[#F0EFF9]/50 dark:hover:bg-[#29294D]/50">
                          <td className="p-3.5 flex items-center gap-2.5">
                            <img
                              src={
                                mb.user.avatar_url ||
                                `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${mb.user.name}`
                              }
                              className="w-7 h-7 rounded-full object-cover shrink-0"
                            />
                            <div>
                              <span className="font-extrabold text-[#17172B] dark:text-white block">
                                {mb.user.name} {mb.user.id === user?.id ? '(You)' : ''}
                              </span>
                              <span className="text-[10px] text-[#7E7D9C] font-mono">{mb.user.upi_id || mb.user.email}</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-[#494866] dark:text-[#DCD6FF]">
                            {formatCurrency(mb.totalPaid)}
                          </td>
                          <td className="p-3.5 text-[#494866] dark:text-[#DCD6FF]">
                            {formatCurrency(mb.totalOwed)}
                          </td>
                          <td className="p-3.5 text-right font-black text-sm">
                            <span
                              className={`px-2.5 py-1 rounded-lg ${
                                isOwed
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                                  : owes
                                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
                                  : 'bg-[#F0EFF9] dark:bg-[#29294D] text-[#636280] dark:text-[#A5A4BF]'
                              }`}
                            >
                              {isOwed
                                ? `+${formatCurrency(mb.netBalance)}`
                                : owes
                                ? `-${formatCurrency(Math.abs(mb.netBalance))}`
                                : '₹0.00'}
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
        </div>
      )}

      {/* TAB 3: SETTLEMENT HISTORY */}
      {activeTab === 'settlements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-base text-[#17172B] dark:text-white">Settlement History</h3>
              <p className="text-xs text-[#7E7D9C] dark:text-[#A5A4BF] font-semibold">
                Transparent record of all cleared debt payments
              </p>
            </div>
            <button
              onClick={() => {
                setSettlePrefill({});
                setIsSettleUpOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl gradient-emerald text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Record Settlement</span>
            </button>
          </div>

          <div className="campus-card divide-y divide-[#EAE9F5] dark:divide-[rgba(145,127,242,0.16)] overflow-hidden">
            {settlements.map((set) => (
              <div
                key={set.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#F0EFF9]/50 dark:hover:bg-[#29294D]/50 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-extrabold text-[#17172B] dark:text-white">
                      <span>{set.payer_name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{set.receiver_name}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#7E7D9C] dark:text-[#A5A4BF] mt-0.5">
                      <span className="font-black text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">
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
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(set.amount)}
                  </span>
                  {(set.payer_id === user?.id || set.receiver_id === user?.id || isCreator) && (
                    <button
                      onClick={() => handleDeleteSettlement(set.id)}
                      className="p-1.5 text-[#7E7D9C] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Undo Settlement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {settlements.length === 0 && (
              <div className="p-12 text-center text-[#7E7D9C] dark:text-[#A5A4BF] space-y-2">
                <History className="w-10 h-10 mx-auto opacity-50" />
                <p className="font-black text-[#17172B] dark:text-white text-sm">No settlements recorded yet</p>
                <p className="text-xs">When members pay back debts via UPI or Cash, record them here!</p>
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
              <h3 className="font-black text-base text-[#17172B] dark:text-white">
                Group Members ({members.length})
              </h3>
              <button
                onClick={() => setIsInviteOpen(true)}
                className="px-3.5 py-1.5 rounded-xl gradient-brand text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite Friend</span>
              </button>
            </div>

            <div className="campus-card divide-y divide-[#EAE9F5] dark:divide-[rgba(145,127,242,0.16)] overflow-hidden">
              {members.map((m) => (
                <div key={m.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={m.avatar_url || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${m.name}`}
                      className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-[#6654D9]/20"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-[#17172B] dark:text-white truncate">{m.name}</span>
                        {m.id === user?.id && (
                          <span className="text-[10px] font-black bg-[#6654D9]/15 text-[#6654D9] dark:text-[#DCD6FF] px-2 py-0.5 rounded-md">
                            You
                          </span>
                        )}
                        {m.role === 'admin' && (
                          <span className="text-[10px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md">
                            Leader
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#7E7D9C] font-mono truncate">{m.upi_id || m.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-[#7E7D9C] font-medium shrink-0">
                    Joined {formatDate(m.joined_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Group Settings / Edit Form */}
          <div className="space-y-4">
            <h3 className="font-black text-base text-[#17172B] dark:text-white">Group Settings</h3>

            <div className="campus-card p-5 space-y-4">
              <form onSubmit={handleUpdateGroup} className="space-y-3">
                <div>
                  <label className="block text-xs font-black text-[#17172B] dark:text-white uppercase tracking-wider mb-1">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 bg-white dark:bg-[#17172B] border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.2)] rounded-xl text-xs font-bold text-[#17172B] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#17172B] dark:text-white uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={groupCategory}
                    onChange={(e) => setGroupCategory(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white dark:bg-[#17172B] border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.2)] rounded-xl text-xs font-bold text-[#17172B] dark:text-white"
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
                  <label className="block text-xs font-black text-[#17172B] dark:text-white uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={groupDesc}
                    onChange={(e) => setGroupDesc(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white dark:bg-[#17172B] border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.2)] rounded-xl text-xs font-semibold text-[#17172B] dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl gradient-brand text-white font-black text-xs shadow-md shadow-[#6654D9]/25 hover:brightness-105 transition-all"
                >
                  Save Group Changes
                </button>
              </form>

              {isCreator && (
                <div className="pt-4 border-t border-[#EAE9F5] dark:border-[rgba(145,127,242,0.16)]">
                  <button
                    onClick={handleDeleteGroup}
                    className="w-full py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
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
