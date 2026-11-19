import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Users2, Plus, KeyRound, Search, Sparkles, ArrowRight, Shield } from 'lucide-react';
import { groupsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getInitials } from '../utils/formatters';
import { CategoryBadge } from '../utils/categoryIcons';
import CreateGroupModal from '../components/groups/CreateGroupModal';
import JoinGroupModal from '../components/groups/JoinGroupModal';

export default function Groups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await groupsApi.getAll();
      setGroups(res.groups || []);
    } catch (err) {
      console.error('Failed to load groups:', err);
      setError(err.message || 'Unable to load groups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const filteredGroups = groups.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'All' || g.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-6xl mx-auto pb-24 lg:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Groups
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-400 font-medium">
            Manage your shared expenses with college friends and hostel roommates
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsJoinOpen(true)}
            className="px-4 py-2 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-200 font-semibold text-xs shadow-sm hover:bg-slate-50 dark:hover:bg-neutral-900 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Join with Code</span>
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-xl gradient-brand text-white font-semibold text-xs shadow-md shadow-purple-600/30 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Group</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="text-xs sm:text-sm font-medium">
            <span>{error}</span>
          </div>
          <button
            onClick={loadGroups}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 text-white font-semibold text-xs hover:bg-amber-700 active:scale-95 transition-all self-end sm:self-auto"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-500 dark:text-neutral-400" />
          <input
            type="text"
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white rounded-xl text-xs placeholder:text-slate-500 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
          {['All', 'Hostel', 'Trip', 'Food', 'Celebration', 'General'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-all ${
                categoryFilter === cat
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-white dark:bg-black text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Group Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-slate-200 dark:bg-neutral-900 rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map((g) => {
            const isOwed = g.myBalance > 0.01;
            const owes = g.myBalance < -0.01;

            return (
              <NavLink
                key={g.id}
                to={`/groups/${g.id}`}
                className="bg-white dark:bg-black p-5 rounded-2xl border border-slate-200/80 dark:border-neutral-800 shadow-sm hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <CategoryBadge categoryId={g.category} size="xs" />
                    <span className="font-mono text-[11px] text-purple-700 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950/80 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-800/60">
                      {g.invite_code}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
                    {g.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-neutral-400 mt-1 line-clamp-2 font-medium">
                    {g.description || 'No description provided'}
                  </p>

                  {/* Members preview */}
                  <div className="flex items-center gap-2 mt-4">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {g.members?.slice(0, 4).map((m) => (
                        <img
                          key={m.id}
                          src={m.avatar_url || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${m.name}`}
                          className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-black object-cover"
                          alt={m.name}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-600 dark:text-neutral-400 font-bold">
                      {g.memberCount} members
                    </span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-neutral-400 block tracking-wider">Total Spend</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {formatCurrency(g.totalSpending)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-neutral-400 block tracking-wider">Your Balance</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md inline-block ${
                        isOwed
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : owes
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          : 'bg-slate-100 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300'
                      }`}
                    >
                      {isOwed ? `+${formatCurrency(g.myBalance)}` : owes ? `-${formatCurrency(Math.abs(g.myBalance))}` : 'Settled'}
                    </span>
                  </div>
                </div>
              </NavLink>
            );
          })}

          {filteredGroups.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3 bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-4">
              <Users2 className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <h3 className="font-bold text-slate-800 text-base">No groups found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  You are not a member of any group matching this filter.
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-5 py-2.5 rounded-xl gradient-brand text-white font-semibold text-xs shadow-md"
              >
                Create a Group Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateGroupModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadGroups}
      />

      <JoinGroupModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onSuccess={loadGroups}
      />
    </div>
  );
}
