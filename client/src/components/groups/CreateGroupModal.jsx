import React, { useState } from 'react';
import { X, Users, AlertCircle } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-[#21213E] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#EAE9F5] dark:border-[rgba(145,127,242,0.2)] overflow-hidden my-0 sm:my-8 transition-all">
        <div className="gradient-brand p-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black flex items-center gap-2">
              <Users className="w-5 h-5 stroke-[2.5]" />
              <span>Create New Group</span>
            </h2>
            <p className="text-xs text-[#DCD6FF] mt-0.5 font-medium">
              Organize shared expenses with your college peers
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
              Group Name
            </label>
            <input
              type="text"
              placeholder="e.g. Hostel Roommates (Room 302)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-white dark:bg-[#17172B] border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.25)] rounded-xl text-xs font-bold text-[#17172B] dark:text-white placeholder-[#7E7D9C] focus:outline-none focus:ring-2 focus:ring-[#6654D9]"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-[#17172B] dark:text-white uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {GROUP_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                    category === cat.id
                      ? 'bg-[#6654D9]/15 border-[#6654D9] text-[#6654D9] dark:text-[#DCD6FF] shadow-sm'
                      : 'bg-white dark:bg-[#17172B] border-[#DCD6FF] dark:border-[rgba(145,127,242,0.2)] text-[#636280] dark:text-[#A5A4BF]'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-[#17172B] dark:text-white uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Room rent, groceries, wifi and electricity bills"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-[#17172B] border border-[#DCD6FF] dark:border-[rgba(145,127,242,0.25)] rounded-xl text-xs font-semibold text-[#17172B] dark:text-white placeholder-[#7E7D9C] focus:outline-none focus:ring-2 focus:ring-[#6654D9]"
            />
          </div>

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
              {loading ? <span>Creating...</span> : <span>Create Group</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
