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
    <div className="p-4 sm:p-8 space-y-6 max-w-6xl mx-auto pb-28 lg:pb-12 transition-colors duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#17172B] dark:text-white tracking-tight">
            My Groups
          </h1>
          <p className="text-xs sm:text-sm text-[#7E7D9C] dark:text-[#A5A4BF] font-semibold">
            Manage your shared expenses with college friends, trips, and roommates
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsJoinOpen(true)}
            className="px-4 py-2 rounded-xl bg-white dark:bg-[#21213E] border border-[#EAE9F5] dark:border-[rgba(145,127,242,0.16)] text-[#17172B] dark:text-white font-bold text-xs shadow-sm hover:bg-[#F0EFF9] dark:hover:bg-[#29294D] active:scale-95 transition-all flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#6654D9] dark:text-[#917FF2]" />
            <span>Join with Code</span>
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-xl gradient-brand text-white font-bold text-xs shadow-md shadow-[#6654D9]/30 hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create Group</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="text-xs sm:text-sm font-semibold">
            <span>{error}</span>
          </div>
          <button
            onClick={loadGroups}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 active:scale-95 transition-all self-end sm:self-auto"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-[#7E7D9C]" />
          <input
            type="text"
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-white dark:bg-[#21213E] border border-[#EAE9F5] dark:border-[rgba(145,127,242,0.16)] text-[#17172B] dark:text-white rounded-xl text-xs font-semibold placeholder-[#7E7D9C] shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
          {['All', 'Hostel', 'Trip', 'Food', 'Celebration', 'General'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? 'bg-[#6654D9] text-white shadow-md shadow-[#6654D9]/25'
                  : 'bg-white dark:bg-[#21213E] text-[#636280] dark:text-[#A5A4BF] border border-[#EAE9F5] dark:border-[rgba(145,127,242,0.16)] hover:bg-[#F0EFF9] dark:hover:bg-[#29294D]'
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
            <div key={i} className="h-48 bg-[#EAE9F5] dark:bg-[#21213E] rounded-2xl"></div>
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
                className="campus-card campus-card-hover p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <CategoryBadge categoryId={g.category} size="xs" />
                    <span className="font-mono text-[10px] text-[#6654D9] dark:text-[#DCD6FF] font-black bg-[#6654D9]/10 dark:bg-[#6654D9]/20 px-2 py-0.5 rounded-md border border-[#6654D9]/30">
                      {g.invite_code}
                    </span>
                  </div>

                  <h3 className="font-black text-base text-[#17172B] dark:text-white group-hover:text-[#6654D9] dark:group-hover:text-[#917FF2] transition-colors line-clamp-1">
                    {g.name}
                  </h3>
                  <p className="text-xs text-[#7E7D9C] dark:text-[#A5A4BF] mt-1 line-clamp-2 font-medium">
                    {g.description || 'No description provided'}
                  </p>

                  {/* Members preview */}
                  <div className="flex items-center gap-2 mt-4">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {g.members?.slice(0, 4).map((m) => (
                        <img
                          key={m.id}
                          src={m.avatar_url || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${m.name}`}
                          className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-[#21213E] object-cover"
                          alt={m.name}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-[#7E7D9C] dark:text-[#A5A4BF] font-bold">
                      {g.memberCount} members
                    </span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[#EAE9F5] dark:border-[rgba(145,127,242,0.16)] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-black text-[#7E7D9C] dark:text-[#A5A4BF] block tracking-wider">
                      Total Spend
                    </span>
                    <span className="text-xs font-black text-[#17172B] dark:text-white">
                      {formatCurrency(g.totalSpending)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-black text-[#7E7D9C] dark:text-[#A5A4BF] block tracking-wider">
                      Your Balance
                    </span>
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-md inline-block ${
                        isOwed
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : owes
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          : 'bg-[#F0EFF9] dark:bg-[#29294D] text-[#7E7D9C]'
                      }`}
                    >
                      {isOwed
                        ? `+${formatCurrency(g.myBalance)}`
                        : owes
                        ? `-${formatCurrency(Math.abs(g.myBalance))}`
                        : 'Settled'}
                    </span>
                  </div>
                </div>
              </NavLink>
            );
          })}

          {filteredGroups.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3 campus-card p-12 text-center space-y-4 border-dashed">
              <Users2 className="w-12 h-12 text-[#7E7D9C] dark:text-[#A5A4BF] mx-auto opacity-50" />
              <div>
                <h3 className="font-black text-[#17172B] dark:text-white text-base">No groups found</h3>
                <p className="text-xs text-[#7E7D9C] dark:text-[#A5A4BF] max-w-sm mx-auto mt-1 font-medium">
                  You are not a member of any group matching this filter.
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-5 py-2.5 rounded-xl gradient-brand text-white font-bold text-xs shadow-md"
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
