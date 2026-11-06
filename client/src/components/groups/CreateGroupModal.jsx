import React, { useState } from 'react';
import { X, Users, Sparkles, AlertCircle } from 'lucide-react';
import { groupsApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const GROUP_CATEGORIES = [
  { id: 'College Friends', label: 'College Friends', icon: '🎓' },
  { id: 'Hostel Roommates', label: 'Hostel Roommates', icon: '🏠' },
  { id: 'College Trip', label: 'College Trip', icon: '✈️' },
  { id: 'Birthday Party', label: 'Birthday Party', icon: '🎂' },
  { id: 'Food & Outings', label: 'Food & Outings', icon: '🍔' },
  { id: 'Project Team', label: 'Project Team', icon: '💻' },
  { id: 'General', label: 'General / Other', icon: '☕' },
];

export default function CreateGroupModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('College Friends');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a group name.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await groupsApi.create({
        name: name.trim(),
        description: description.trim(),
        category,
      });

      toast.success(`Group "${res.group.name}" created! Invite code: ${res.group.invite_code}`);
      setName('');
      setDescription('');
      onSuccess(res.group);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create group.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        <div className="gradient-brand p-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>Create New Group</span>
            </h2>
            <p className="text-xs text-purple-200 mt-0.5">
              Organize shared expenses with your college peers
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
              Group Name
            </label>
            <input
              type="text"
              placeholder="e.g. Hostel Roommates (Room 302)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {GROUP_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 text-xs font-medium transition-all ${
                    category === cat.id
                      ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Groceries, WiFi, and cleaning splits"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

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
              {loading ? <span>Creating...</span> : <span>Create Group</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
