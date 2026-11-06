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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        <div className="gradient-brand p-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <KeyRound className="w-5 h-5" />
              <span>Join with Invite Code</span>
            </h2>
            <p className="text-xs text-purple-200 mt-0.5">
              Enter the code shared by your friend
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Invite Code
            </label>
            <input
              type="text"
              placeholder="e.g. ROOM302 or CAMPUS-7X89"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-widest text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-center uppercase"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
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
              {loading ? <span>Joining...</span> : <span>Join Group</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
