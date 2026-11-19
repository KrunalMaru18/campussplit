import React, { useState } from 'react';
import { X, KeyRound, AlertCircle } from 'lucide-react';
import { groupsApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export default function JoinGroupModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter an invite code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await groupsApi.joinByCode(code.trim());
      toast.success(res.message || 'Successfully joined group!');
      setCode('');
      onSuccess(res.group);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to join group. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-sm bg-white dark:bg-[#21213E] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#EAE9F5] dark:border-[rgba(145,127,242,0.2)] overflow-hidden my-0 sm:my-8 transition-all">
        <div className="gradient-brand p-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black flex items-center gap-2">
              <KeyRound className="w-5 h-5 stroke-[2.5]" />
              <span>Join with Invite Code</span>
            </h2>
            <p className="text-xs text-[#DCD6FF] mt-0.5 font-medium">
              Enter the invite code shared by your friend
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-[#17172B] dark:text-white uppercase tracking-wider mb-1.5">
              Invite Code
            </label>
            <input
              type="text"
              placeholder="e.g. CAMPUS-HD6S"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              className="w-full px-3.5 py-3 bg-white dark:bg-[#17172B] border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.25)] rounded-xl text-base font-mono font-black tracking-widest text-[#17172B] dark:text-white placeholder-[#7E7D9C] focus:outline-none focus:ring-2 focus:ring-[#6654D9] text-center uppercase"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#EAE9F5] dark:border-[rgba(145,127,242,0.16)]">
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
              {loading ? <span>Joining...</span> : <span>Join Group</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
