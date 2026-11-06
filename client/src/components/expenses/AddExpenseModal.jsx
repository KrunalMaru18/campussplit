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
  ChevronDown
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
      setError('Please provide a valid expense amount.');
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
        setError(`The split amounts must add up to ₹${totalAmountNum}. Current total: ₹${unequalSum.toFixed(2)} (Difference: ₹${Math.abs(unequalDiff).toFixed(2)})`);
        return;
      }
      participants = members.map((m) => ({
        user_id: m.id,
        amount_owed: parseFloat(memberSplits[m.id]?.amount_owed || 0),
      })).filter((p) => p.amount_owed > 0);
    } else if (splitType === 'PERCENTAGE') {
      if (Math.abs(percentageDiff) > 0.1) {
        setError(`Total percentages must add up to 100%. Currently: ${percentageSum.toFixed(1)}%`);
        return;
      }
      participants = members.map((m) => ({
        user_id: m.id,
        percentage: parseFloat(memberSplits[m.id]?.percentage || 0),
      })).filter((p) => p.percentage > 0);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="gradient-brand p-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">
              {editingExpense ? 'Edit Expense' : 'Add New Expense'}
            </h2>
            <p className="text-xs text-purple-200 mt-0.5">
              Record a shared bill and split it smartly with your group
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Group Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Group
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              disabled={!!editingExpense}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Expense Title
              </label>
              <input
                type="text"
                placeholder="e.g. Canteen Biryani & Chai"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Category & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Expense Date
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Paid By Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Paid By
            </label>
            <select
              value={paidById}
              onChange={(e) => setPaidById(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Split Method
            </label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSplitType('EQUAL')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  splitType === 'EQUAL'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Divide className="w-3.5 h-3.5" />
                <span>Equal Split</span>
              </button>
              <button
                type="button"
                onClick={() => setSplitType('UNEQUAL')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  splitType === 'UNEQUAL'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Unequal (₹)</span>
              </button>
              <button
                type="button"
                onClick={() => setSplitType('PERCENTAGE')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  splitType === 'PERCENTAGE'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                <span>Percentage (%)</span>
              </button>
            </div>
          </div>

          {/* Split Detail Panels */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            {splitType === 'EQUAL' && (
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span>Select participants:</span>
                  <span className="font-semibold text-purple-700">
                    {formatCurrency(equalPerPerson)} / person ({selectedMembersCount} selected)
                  </span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {members.map((m) => {
                    const isSelected = memberSplits[m.id]?.selected;
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleToggleMember(m.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer border text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-purple-50 border-purple-200 text-purple-900'
                            : 'bg-white border-slate-200 text-slate-500 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center text-white ${
                              isSelected ? 'bg-purple-600' : 'bg-slate-300'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span>{m.name}</span>
                        </div>
                        <span>{isSelected ? formatCurrency(equalPerPerson) : '₹0'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {splitType === 'UNEQUAL' && (
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-500">Enter exact amount per member:</span>
                  <span
                    className={`font-bold ${
                      Math.abs(unequalDiff) < 0.05 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    Allocated: ₹{unequalSum.toFixed(2)} / ₹{totalAmountNum.toFixed(2)}
                    {unequalDiff !== 0 && ` (${unequalDiff > 0 ? `₹${unequalDiff.toFixed(2)} left` : `₹${Math.abs(unequalDiff).toFixed(2)} over`})`}
                  </span>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-medium text-slate-700 truncate w-36">{m.name}</span>
                      <div className="flex items-center gap-1.5 w-32">
                        <span className="text-slate-400 font-semibold">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={memberSplits[m.id]?.amount_owed || ''}
                          onChange={(e) => handleAmountChange(m.id, e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-right font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {splitType === 'PERCENTAGE' && (
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-500">Enter percentage per member:</span>
                  <span
                    className={`font-bold ${
                      Math.abs(percentageDiff) < 0.1 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    Total: {percentageSum.toFixed(1)}% / 100%
                    {percentageDiff !== 0 && ` (${percentageDiff > 0 ? `${percentageDiff.toFixed(1)}% left` : `${Math.abs(percentageDiff).toFixed(1)}% over`})`}
                  </span>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {members.map((m) => {
                    const pctVal = parseFloat(memberSplits[m.id]?.percentage || 0);
                    const calcRupees = totalAmountNum > 0 ? ((pctVal / 100) * totalAmountNum).toFixed(2) : '0';
                    return (
                      <div key={m.id} className="flex items-center justify-between gap-3 text-xs">
                        <div className="w-32 min-w-0">
                          <span className="font-medium text-slate-700 block truncate">{m.name}</span>
                          <span className="text-[10px] text-slate-400">≈ {formatCurrency(calcRupees)}</span>
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
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-right font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                          <span className="text-slate-400 font-semibold">%</span>
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
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Notes / Receipt info (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Paid online, receipt in WhatsApp"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl gradient-brand text-white font-semibold text-xs shadow-md shadow-purple-600/30 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <span>{editingExpense ? 'Update Expense' : 'Save & Split'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
