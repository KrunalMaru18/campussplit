import React, { useState, useEffect } from 'react';
import { Receipt, CheckCircle2, Search, Filter, ArrowRight } from 'lucide-react';
import { analyticsApi, groupsApi } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CategoryBadge } from '../utils/categoryIcons';

export default function Activity() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all'); // all | expense | settlement
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await analyticsApi.getDashboard();
        setTransactions(data.recentTransactions || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = transactions.filter((tx) => {
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const matchesSearch =
      tx.title.toLowerCase().includes(search.toLowerCase()) ||
      tx.groupName?.toLowerCase().includes(search.toLowerCase()) ||
      tx.paidBy?.name?.toLowerCase().includes(search.toLowerCase()) ||
      tx.payer?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto pb-28 lg:pb-12 transition-colors duration-200">
      <div>
        <h1 className="text-2xl font-black text-[#17172B] dark:text-white tracking-tight">
          Recent Activity & History
        </h1>
        <p className="text-xs sm:text-sm text-[#7E7D9C] dark:text-[#A5A4BF] font-semibold">
          Transparent chronological record of every expense and settlement recorded across your campus groups
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-[#7E7D9C]" />
          <input
            type="text"
            placeholder="Search activity by title or group..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-white dark:bg-[#21213E] border border-[#EAE9F5] dark:border-[rgba(145,127,242,0.16)] rounded-xl text-xs font-semibold placeholder-[#7E7D9C] text-[#17172B] dark:text-white shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-[#F0EFF9] dark:bg-[#21213E] p-1 rounded-xl">
          {[
            { id: 'all', label: 'All Activity' },
            { id: 'expense', label: 'Expenses Only' },
            { id: 'settlement', label: 'Settlements Only' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                typeFilter === tab.id
                  ? 'bg-[#6654D9] text-white shadow-sm'
                  : 'text-[#636280] dark:text-[#A5A4BF] hover:text-[#17172B] dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="campus-card divide-y divide-[#EAE9F5] dark:divide-[rgba(145,127,242,0.16)] overflow-hidden">
        {filtered.map((tx) => {
          const isExpense = tx.type === 'expense';
          const isSettlement = tx.type === 'settlement';

          return (
            <div
              key={tx.id}
              className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#F0EFF9]/50 dark:hover:bg-[#29294D]/50 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {isExpense ? (
                  <div className="w-10 h-10 rounded-xl bg-[#6654D9]/10 text-[#6654D9] dark:text-[#917FF2] flex items-center justify-center shrink-0 border border-[#6654D9]/20">
                    <Receipt className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  </div>
                )}

                <div className="min-w-0">
                  <p className="font-black text-sm text-[#17172B] dark:text-white truncate">
                    {tx.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#7E7D9C] dark:text-[#A5A4BF] mt-0.5">
                    <span className="font-black text-[#6654D9] dark:text-[#DCD6FF] bg-[#6654D9]/10 dark:bg-[#6654D9]/20 px-2 py-0.5 rounded text-[10px]">
                      {tx.groupName}
                    </span>
                    <span>•</span>
                    <span className="font-medium">{formatDate(tx.date)}</span>
                    <span>•</span>
                    <span className="font-semibold text-[#17172B] dark:text-[#DCD6FF]">
                      {isExpense
                        ? `${tx.paidBy?.name} paid ${formatCurrency(tx.amount)}`
                        : `${tx.payer?.name} settled ${formatCurrency(tx.amount)} with ${tx.receiver?.name}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="font-black text-sm sm:text-base text-[#17172B] dark:text-white">
                  {formatCurrency(tx.amount)}
                </p>
                {isExpense && (
                  <p className="text-[11px] font-bold">
                    {tx.isPayer ? (
                      <span className="text-emerald-600 dark:text-emerald-400">You lent</span>
                    ) : tx.myShare > 0 ? (
                      <span className="text-[#FF5A79]">Your share: {formatCurrency(tx.myShare)}</span>
                    ) : (
                      <span className="text-[#7E7D9C]">Not involved</span>
                    )}
                  </p>
                )}
                {isSettlement && (
                  <span className="text-[10px] uppercase font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    Settled ({tx.paymentMethod})
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-12 text-center text-[#7E7D9C] dark:text-[#A5A4BF] space-y-2">
            <Receipt className="w-10 h-10 mx-auto opacity-50" />
            <p className="font-black text-sm text-[#17172B] dark:text-white">No transactions found</p>
            <p className="text-xs font-medium">Try adjusting your search query or filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
