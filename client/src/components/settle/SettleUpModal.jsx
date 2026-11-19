import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Smartphone,
  Banknote,
  Copy,
  Check,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { settlementsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, getInitials } from '../../utils/formatters';

export default function SettleUpModal({
  isOpen,
  onClose,
  onSuccess,
  groupId,
  members = [],
  prefillPayerId,
  prefillReceiverId,
  prefillAmount,
}) {
  const { user } = useAuth();
  const toast = useToast();

  const [payerId, setPayerId] = useState(prefillPayerId || user?.id || '');
  const [receiverId, setReceiverId] = useState(prefillReceiverId || '');
  const [amount, setAmount] = useState(prefillAmount ? String(prefillAmount) : '');
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // UPI | Cash | Other
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPayerId(prefillPayerId || user?.id || members[0]?.id || '');
      setReceiverId(prefillReceiverId || (members.find((m) => m.id !== (prefillPayerId || user?.id))?.id || ''));
      setAmount(prefillAmount ? String(prefillAmount) : '');
      setError('');
    }
  }, [isOpen, prefillPayerId, prefillReceiverId, prefillAmount, members, user]);

  if (!isOpen) return null;

  const receiver = members.find((m) => m.id === receiverId);
  const payer = members.find((m) => m.id === payerId);
  const receiverUpi = receiver?.upi_id || `${receiver?.email?.split('@')[0]}@okaxis`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(receiverUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSettle = async (e) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid settlement amount.');
      return;
    }
    if (payerId === receiverId) {
      setError('Payer and receiver must be different members.');
      return;
    }

    setLoading(true);
    try {
      await settlementsApi.create(groupId, {
        payer_id: payerId,
        receiver_id: receiverId,
        amount: numAmount,
        payment_method: paymentMethod,
        notes,
        settlement_date: settlementDate,
      });

      // Fire celebratory confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6654D9', '#10B981', '#917FF2', '#F59E0B'],
        });
      } catch (e) {
        // confetti fallback
      }

      toast.success(`Settlement of ₹${numAmount.toFixed(2)} recorded successfully!`);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record settlement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-[#21213E] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#EAE9F5] dark:border-[rgba(145,127,242,0.2)] overflow-hidden my-0 sm:my-8 transition-all">
        {/* Header */}
        <div className="gradient-emerald p-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              <span>Settle Up Payment</span>
            </h2>
            <p className="text-xs text-emerald-100 mt-0.5 font-medium">
              Record a payment to clear or reduce group balance
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSettle} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Visual Transfer Pill */}
          <div className="bg-[#F0EFF9]/80 dark:bg-[#17172B] border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.2)] rounded-2xl p-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {payer?.avatar_url ? (
                <img src={payer.avatar_url} className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-emerald-500/30" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-400 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {getInitials(payer?.name)}
                </div>
              )}
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-black text-[#7E7D9C] block tracking-wider">Payer</span>
                <span className="text-xs font-black text-[#17172B] dark:text-white truncate block">
                  {payer?.name} {payer?.id === user?.id ? '(You)' : ''}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center px-2">
              <ArrowRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
              <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-black tracking-wider">PAYS</span>
            </div>

            <div className="flex items-center gap-2.5 min-w-0 text-right">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-black text-[#7E7D9C] block tracking-wider">Receiver</span>
                <span className="text-xs font-black text-[#17172B] dark:text-white truncate block">
                  {receiver?.name} {receiver?.id === user?.id ? '(You)' : ''}
                </span>
              </div>
              {receiver?.avatar_url ? (
                <img src={receiver.avatar_url} className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-emerald-500/30" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-400 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {getInitials(receiver?.name)}
                </div>
              )}
            </div>
          </div>

          {/* Selectors for Payer and Receiver */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-[#17172B] dark:text-white uppercase tracking-wider mb-1.5">
                Who Paid?
              </label>
              <select
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#17172B] border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.25)] rounded-xl text-xs font-bold text-[#17172B] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.id === user?.id ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-[#17172B] dark:text-white uppercase tracking-wider mb-1.5">
                Who Received?
              </label>
              <select
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#17172B] border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.25)] rounded-xl text-xs font-bold text-[#17172B] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id} disabled={m.id === payerId}>
                    {m.name} {m.id === user?.id ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-black text-[#17172B] dark:text-white uppercase tracking-wider mb-1.5">
              Settlement Amount (₹ INR)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-emerald-600 dark:text-emerald-400 font-black text-base">₹</span>
              <input
                type="number"
                step="0.01"
                min="1"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full pl-8 pr-3.5 py-2.5 bg-white dark:bg-[#17172B] border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.25)] rounded-xl text-base font-black text-[#17172B] dark:text-white placeholder-[#7E7D9C] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-black text-[#17172B] dark:text-white uppercase tracking-wider mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                  paymentMethod === 'UPI'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 shadow-sm'
                    : 'bg-white dark:bg-[#17172B] border-[#DCD6FF] dark:border-[rgba(145,127,242,0.2)] text-[#636280] dark:text-[#A5A4BF]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>UPI / GPay</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('Cash')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                  paymentMethod === 'Cash'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 shadow-sm'
                    : 'bg-white dark:bg-[#17172B] border-[#DCD6FF] dark:border-[rgba(145,127,242,0.2)] text-[#636280] dark:text-[#A5A4BF]'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Cash</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('Other')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                  paymentMethod === 'Other'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 shadow-sm'
                    : 'bg-white dark:bg-[#17172B] border-[#DCD6FF] dark:border-[rgba(145,127,242,0.2)] text-[#636280] dark:text-[#A5A4BF]'
                }`}
              >
                <span>Other</span>
              </button>
            </div>
          </div>

          {/* UPI Helper Card if UPI is selected */}
          {paymentMethod === 'UPI' && receiver && (
            <div className="p-3.5 bg-[#6654D9]/10 dark:bg-[#6654D9]/20 border border-[#6654D9]/30 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-[#6654D9] dark:text-[#DCD6FF]">
                  {receiver.name}'s UPI ID:
                </span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="flex items-center gap-1 text-[11px] font-black text-[#6654D9] dark:text-[#DCD6FF] bg-white dark:bg-[#21213E] px-2.5 py-0.5 rounded-lg border border-[#6654D9]/30 shadow-sm transition-colors"
                >
                  {copiedUpi ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy UPI</span>
                    </>
                  )}
                </button>
              </div>
              <div className="font-mono text-xs text-[#17172B] dark:text-white font-bold bg-white dark:bg-[#21213E] p-2.5 rounded-xl border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.2)] flex items-center justify-between">
                <span>{receiverUpi}</span>
                <a
                  href={`upi://pay?pa=${receiverUpi}&pn=${encodeURIComponent(receiver.name)}&am=${amount || 0}&cu=INR`}
                  className="text-[10px] text-[#6654D9] dark:text-[#917FF2] font-black hover:underline flex items-center gap-1"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>Open UPI App</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Date & Note Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black text-[#17172B] dark:text-white uppercase tracking-wider mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={settlementDate}
                onChange={(e) => setSettlementDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#17172B] border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.25)] rounded-xl text-xs font-semibold text-[#17172B] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-[#17172B] dark:text-white uppercase tracking-wider mb-1.5">
                Ref / Txn ID
              </label>
              <input
                type="text"
                placeholder="e.g. UPI Ref #7891"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#17172B] border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.25)] rounded-xl text-xs font-semibold text-[#17172B] dark:text-white placeholder-[#7E7D9C] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Submit Buttons */}
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
              className="px-6 py-2.5 rounded-xl gradient-emerald text-white font-black text-xs shadow-md shadow-emerald-600/30 hover:brightness-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {loading ? <span>Recording...</span> : <span>Confirm Settlement</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
