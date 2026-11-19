import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Check,
  AlertCircle,
  Calendar,
  FileText,
  DollarSign,
  Users,
  Divide,
  Percent,
  SlidersHorizontal,
  ChevronDown,
  CheckSquare,
  Square
} from 'lucide-react';
import { groupsApi, expensesApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CATEGORIES } from '../../utils/categoryIcons';
import { formatCurrency } from '../../utils/formatters';

export default function AddExpenseModal({ isOpen, onClose, onSuccess, initialGroupId, editingExpense = null }) {
  const { user } = useAuth();
  const toast = useToast();

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId || '');
  const [selectedGroupDetails, setSelectedGroupDetails] = useState(null);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [paidById, setPaidById] = useState('');
  const [splitType, setSplitType] = useState('EQUAL'); // EQUAL | UNEQUAL | PERCENTAGE
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Split state: map of userId -> { selected: boolean, amount_owed: number, percentage: number }
  const [memberSplits, setMemberSplits] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch groups on open
  useEffect(() => {
    if (!isOpen) return;

    async function loadGroups() {
      try {
        const res = await groupsApi.getAll();
        setGroups(res.groups || []);
        if (!selectedGroupId && res.groups.length > 0) {
          setSelectedGroupId(initialGroupId || res.groups[0].id);
        }
      } catch (err) {
        console.error('Failed to load groups for expense modal:', err);
      }
    }
    loadGroups();
  }, [isOpen, initialGroupId]);

  // Load group details (members) when group changes
  useEffect(() => {
    if (!isOpen || !selectedGroupId) return;

    async function loadGroupDetails() {
      try {
        const res = await groupsApi.getById(selectedGroupId);
        setSelectedGroupDetails(res);

        // Prepopulate default payer
        if (!paidById) {
          setPaidById(user?.id || res.members[0]?.id);
        }

        // Initialize splits for all members
        const initialSplits = {};
        const memberCount = res.members.length;
        const totalNum = Number(amount) || 0;
        const equalShare = memberCount > 0 && totalNum > 0 ? (totalNum / memberCount).toFixed(2) : '0';
        const equalPct = memberCount > 0 ? (100 / memberCount).toFixed(1) : '0';

        res.members.forEach((m) => {
          initialSplits[m.id] = {
            selected: true,
            amount_owed: equalShare,
            percentage: equalPct,
          };
        });

        // If editing existing expense, restore its values
        if (editingExpense) {
          setTitle(editingExpense.title || '');
          setAmount(String(editingExpense.amount || ''));
          setCategory(editingExpense.category || 'Food');
          setPaidById(editingExpense.paid_by_id);
          setSplitType(editingExpense.split_type || 'EQUAL');
          setExpenseDate(editingExpense.expense_date || new Date().toISOString().split('T')[0]);
          setNotes(editingExpense.notes || '');

          if (editingExpense.splits && editingExpense.splits.length > 0) {
            res.members.forEach((m) => {
              const sp = editingExpense.splits.find((s) => s.user_id === m.id);
              if (sp) {
                initialSplits[m.id] = {
                  selected: true,
                  amount_owed: String(sp.amount_owed || 0),
                  percentage: String(sp.percentage || 0),
                };
              } else {
                initialSplits[m.id] = { selected: false, amount_owed: '0', percentage: '0' };
              }
            });
          }
        }

        setMemberSplits(initialSplits);
      } catch (err) {
        console.error('Failed to fetch group details:', err);
      }
    }

    loadGroupDetails();
  }, [selectedGroupId, isOpen, editingExpense]);

  if (!isOpen) return null;

  const members = selectedGroupDetails?.members || [];
  const totalAmountNum = parseFloat(amount) || 0;

  // Toggle selection for Equal split
  const handleToggleMember = (userId) => {
    setMemberSplits((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        selected: !prev[userId]?.selected,
      },
    }));
  };

  const handleSelectAll = (selectAll) => {
    setMemberSplits((prev) => {
      const updated = { ...prev };
      members.forEach((m) => {
        if (updated[m.id]) {
          updated[m.id].selected = selectAll;
        }
      });
      return updated;
    });
  };

  // Update unequal amount
  const handleAmountChange = (userId, val) => {
    setMemberSplits((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        amount_owed: val,
      },
    }));
  };

  // Update percentage
  const handlePercentageChange = (userId, val) => {
    setMemberSplits((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        percentage: val,
      },
    }));
  };

  // Validation calculations
  const selectedMembersCount = Object.values(memberSplits).filter((s) => s?.selected).length;
  const equalPerPerson = selectedMembersCount > 0 ? (totalAmountNum / selectedMembersCount).toFixed(2) : '0';

  const unequalSum = Object.values(memberSplits).reduce((sum, s) => sum + (parseFloat(s?.amount_owed) || 0), 0);
  const unequalDiff = Math.round((totalAmountNum - unequalSum) * 100) / 100;

  const percentageSum = Object.values(memberSplits).reduce((sum, s) => sum + (parseFloat(s?.percentage) || 0), 0);
  const percentageDiff = Math.round((100 - percentageSum) * 10) / 10;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide an expense title.');
      return;
    }
    if (!totalAmountNum || totalAmountNum <= 0) {
      setError('Please provide a valid expense amount in INR (₹).');
      return;
    }
    if (!paidById) {
      setError('Please select who paid for this expense.');
      return;
    }

    let participants = [];

    if (splitType === 'EQUAL') {
      const selectedIds = Object.keys(memberSplits).filter((id) => memberSplits[id]?.selected);
      if (selectedIds.length === 0) {
        setError('At least one member must be selected for equal split.');
        return;
      }
      participants = selectedIds.map((id) => ({ user_id: id }));
    } else if (splitType === 'UNEQUAL') {
      if (Math.abs(unequalDiff) > 0.05) {
        setError(
          `The split amounts must add up to ₹${totalAmountNum}. Current total: ₹${unequalSum.toFixed(
            2
          )} (Difference: ₹${Math.abs(unequalDiff).toFixed(2)})`
        );
        return;
      }
      participants = members
        .map((m) => ({
          user_id: m.id,
          amount_owed: parseFloat(memberSplits[m.id]?.amount_owed || 0),
        }))
        .filter((p) => p.amount_owed > 0);
    } else if (splitType === 'PERCENTAGE') {
      if (Math.abs(percentageDiff) > 0.1) {
        setError(`Total percentages must add up to 100%. Currently: ${percentageSum.toFixed(1)}%`);
        return;
      }
      participants = members
        .map((m) => ({
          user_id: m.id,
          percentage: parseFloat(memberSplits[m.id]?.percentage || 0),
        }))
        .filter((p) => p.percentage > 0);
    }

    setLoading(true);
    try {
      if (editingExpense) {
        await expensesApi.update(editingExpense.id, {
          title,
          amount: totalAmountNum,
          category,
          paid_by_id: paidById,
          split_type: splitType,
          notes,
          expense_date: expenseDate,
          participants,
        });
        toast.success('Expense updated successfully!');
      } else {
        await expensesApi.create(selectedGroupId, {
          title,
          amount: totalAmountNum,
          category,
          paid_by_id: paidById,
          split_type: splitType,
          notes,
          expense_date: expenseDate,
          participants,
        });
        toast.success('Expense added successfully!');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save expense.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#21213E] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#EAE9F5] dark:border-[rgba(145,127,242,0.2)] overflow-hidden my-0 sm:my-8 transition-all">
        {/* Modal Header */}
        <div className="gradient-brand p-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight">
              {editingExpense ? 'Edit Expense' : 'Add New Expense'}
            </h2>
            <p className="text-xs text-[#DCD6FF] mt-0.5 font-medium">
              Record a shared bill and split it smartly with your group
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Group Selector */}
          <div>
            <label className="block text-xs font-black text-[#17172B] dark:text-white uppercase tracking-wider mb-1.5">
              Select Group
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              disabled={!!editingExpense}
              className="w-full px-3.5 py-2.5 bg-[#F0EFF9] dark:bg-[#17172B] border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.25)] rounded-xl text-xs font-bold text-[#17172B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6654D9]"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title & Amount Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-black text-[#17172B] dark:text-white uppercase tracking-wider mb-1.5">
                Expense Title
              </label>
              <input
                type="text"
                placeholder="e.g. Canteen Treat & Coffee"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white dark:bg-[#17172B] border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.25)] rounded-xl text-xs font-semibold text-[#17172B] dark:text-white placeholder-[#7E7D9C] focus:outline-none focus:ring-2 focus:ring-[#6654D9]"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-[#17172B] dark:text-white uppercase tracking-wider mb-1.5">
                Amount (₹ INR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-black text-[#6654D9] dark:text-[#917FF2]">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full pl-7 pr-3 py-2.5 bg-white dark:bg-[#17172B] border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.25)] rounded-xl text-xs font-black text-[#17172B] dark:text-white placeholder-[#7E7D9C] focus:outline-none focus:ring-2 focus:ring-[#6654D9]"
                />
              </div>
            </div>
          </div>

          {/* Category & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-[#17172B] dark:text-white uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-[#17172B] border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.25)] rounded-xl text-xs font-semibold text-[#17172B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6654D9]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-[#17172B] dark:text-white uppercase tracking-wider mb-1.5">
                Expense Date
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-[#17172B] border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.25)] rounded-xl text-xs font-semibold text-[#17172B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6654D9]"
              />
            </div>
          </div>

          {/* Paid By Dropdown */}
          <div>
            <label className="block text-xs font-black text-[#17172B] dark:text-white uppercase tracking-wider mb-1.5">
              Who Paid?
            </label>
            <select
              value={paidById}
              onChange={(e) => setPaidById(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-[#17172B] border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.25)] rounded-xl text-xs font-bold text-[#17172B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6654D9]"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.id === user?.id ? '(You)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Splitting Method Tabs */}
          <div className="pt-2">
            <label className="block text-xs font-black text-[#17172B] dark:text-white uppercase tracking-wider mb-2">
              Splitting Method
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-[#F0EFF9] dark:bg-[#17172B] p-1.5 rounded-xl border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.2)]">
              <button
                type="button"
                onClick={() => setSplitType('EQUAL')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  splitType === 'EQUAL'
                    ? 'bg-[#6654D9] text-white shadow-sm'
                    : 'text-[#636280] dark:text-[#A5A4BF] hover:text-[#17172B] dark:hover:text-white'
                }`}
              >
                <Divide className="w-3.5 h-3.5" />
                <span>Equal</span>
              </button>
              <button
                type="button"
                onClick={() => setSplitType('UNEQUAL')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  splitType === 'UNEQUAL'
                    ? 'bg-[#6654D9] text-white shadow-sm'
                    : 'text-[#636280] dark:text-[#A5A4BF] hover:text-[#17172B] dark:hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Custom (₹)</span>
              </button>
              <button
                type="button"
                onClick={() => setSplitType('PERCENTAGE')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  splitType === 'PERCENTAGE'
                    ? 'bg-[#6654D9] text-white shadow-sm'
                    : 'text-[#636280] dark:text-[#A5A4BF] hover:text-[#17172B] dark:hover:text-white'
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                <span>Share (%)</span>
              </button>
            </div>
          </div>

          {/* Split Detail Panels */}
          <div className="p-4 bg-[#F0EFF9]/70 dark:bg-[#17172B] border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.2)] rounded-2xl space-y-3">
            {splitType === 'EQUAL' && (
              <div>
                <div className="flex items-center justify-between text-xs text-[#7E7D9C] dark:text-[#A5A4BF] mb-2 font-bold">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectAll(selectedMembersCount !== members.length)}
                      className="text-[#6654D9] dark:text-[#917FF2] hover:underline"
                    >
                      {selectedMembersCount === members.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <span className="text-[#6654D9] dark:text-[#DCD6FF]">
                    {formatCurrency(equalPerPerson)} / person ({selectedMembersCount} selected)
                  </span>
                </div>
                <div className="space-y-1.5 max-h-44 overflow-y-auto">
                  {members.map((m) => {
                    const isSelected = memberSplits[m.id]?.selected;
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleToggleMember(m.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer border text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-white dark:bg-[#21213E] border-[#6654D9]/40 text-[#17172B] dark:text-white shadow-sm'
                            : 'bg-transparent border-transparent text-[#7E7D9C] opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center text-white ${
                              isSelected ? 'bg-[#6654D9]' : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span>{m.name}</span>
                        </div>
                        <span className="font-black">{isSelected ? formatCurrency(equalPerPerson) : '₹0.00'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {splitType === 'UNEQUAL' && (
              <div>
                <div className="flex items-center justify-between text-xs mb-2 font-bold">
                  <span className="text-[#7E7D9C]">Enter amount for each friend:</span>
                  <span
                    className={`font-black ${
                      Math.abs(unequalDiff) < 0.05 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#FF5A79]'
                    }`}
                  >
                    ₹{unequalSum.toFixed(2)} / ₹{totalAmountNum.toFixed(2)}
                    {unequalDiff !== 0 && ` (${unequalDiff > 0 ? `₹${unequalDiff.toFixed(2)} left` : `₹${Math.abs(unequalDiff).toFixed(2)} over`})`}
                  </span>
                </div>
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-bold text-[#17172B] dark:text-white truncate w-36">{m.name}</span>
                      <div className="flex items-center gap-1.5 w-32">
                        <span className="text-[#6654D9] dark:text-[#917FF2] font-black">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={memberSplits[m.id]?.amount_owed || ''}
                          onChange={(e) => handleAmountChange(m.id, e.target.value)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-[#21213E] border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.25)] rounded-lg text-right font-black text-[#17172B] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#6654D9]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {splitType === 'PERCENTAGE' && (
              <div>
                <div className="flex items-center justify-between text-xs mb-2 font-bold">
                  <span className="text-[#7E7D9C]">Enter percentage:</span>
                  <span
                    className={`font-black ${
                      Math.abs(percentageDiff) < 0.1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#FF5A79]'
                    }`}
                  >
                    {percentageSum.toFixed(1)}% / 100%
                    {percentageDiff !== 0 && ` (${percentageDiff > 0 ? `${percentageDiff.toFixed(1)}% left` : `${Math.abs(percentageDiff).toFixed(1)}% over`})`}
                  </span>
                </div>
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {members.map((m) => {
                    const pctVal = parseFloat(memberSplits[m.id]?.percentage || 0);
                    const calcRupees = totalAmountNum > 0 ? ((pctVal / 100) * totalAmountNum).toFixed(2) : '0';
                    return (
                      <div key={m.id} className="flex items-center justify-between gap-3 text-xs">
                        <div className="w-32 min-w-0">
                          <span className="font-bold text-[#17172B] dark:text-white block truncate">{m.name}</span>
                          <span className="text-[10px] text-[#7E7D9C]">≈ {formatCurrency(calcRupees)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 w-24">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            placeholder="0"
                            value={memberSplits[m.id]?.percentage || ''}
                            onChange={(e) => handlePercentageChange(m.id, e.target.value)}
                            className="w-full px-2 py-1.5 bg-white dark:bg-[#21213E] border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.25)] rounded-lg text-right font-black text-[#17172B] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#6654D9]"
                          />
                          <span className="text-[#7E7D9C] font-black">%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Notes Optional */}
          <div>
            <label className="block text-xs font-black text-[#17172B] dark:text-white uppercase tracking-wider mb-1.5">
              Notes / Receipt Details (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Paid via UPI, bill uploaded on WhatsApp"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-[#17172B] border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.25)] rounded-xl text-xs font-semibold text-[#17172B] dark:text-white placeholder-[#7E7D9C] focus:outline-none focus:ring-2 focus:ring-[#6654D9]"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#EAE9F5] dark:border-[rgba(145,127,242,0.16)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.3)] text-[#636280] dark:text-[#A5A4BF] font-bold text-xs hover:bg-[#F0EFF9] dark:hover:bg-[#17172B] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl gradient-brand text-white font-black text-xs shadow-md shadow-[#6654D9]/30 hover:brightness-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <span>{editingExpense ? 'Update Expense' : 'Save & Split Bill'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
