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
    const matchesSearch = tx.title.toLowerCase().includes(search.toLowerCase()) ||
                          tx.groupName?.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-5xl mx-auto pb-24 lg:pb-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Recent Activity & History
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Chronological record of every expense and settlement recorded across your groups
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search activity by title or group..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'all', label: 'All Activity' },
            { id: 'expense', label: 'Expenses Only' },
            { id: 'settlement', label: 'Settlements Only' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === tab.id
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {filtered.map((tx) => {
          const isExpense = tx.type === 'expense';
          const isSettlement = tx.type === 'settlement';

          return (
            <div
              key={tx.id}
              className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {isExpense ? (
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                    <Receipt className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}

                <div className="min-w-0">
                  <p className="font-bold text-sm text-slate-900 truncate">
                    {tx.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[11px]">
                      {tx.groupName}
                    </span>
                    <span>•</span>
                    <span>{formatDate(tx.date)}</span>
                    <span>•</span>
                    <span>
                      {isExpense
                        ? `Paid by ${tx.paidBy?.name}`
                        : `${tx.payer?.name} → ${tx.receiver?.name} (${tx.paymentMethod})`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="font-extrabold text-sm sm:text-base text-slate-900">
                  {formatCurrency(tx.amount)}
                </p>
                {isExpense && (
                  <p className="text-[11px] font-semibold">
                    {tx.isPayer ? (
                      <span className="text-emerald-600">You paid full bill</span>
                    ) : tx.myShare > 0 ? (
                      <span className="text-rose-600">Your share: {formatCurrency(tx.myShare)}</span>
                    ) : (
                      <span className="text-slate-400">Not involved</span>
                    )}
                  </p>
                )}
                {isSettlement && (
                  <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    Settled
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Receipt className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-slate-700 text-sm">No activity records found</p>
            <p className="text-xs">Adjust your search filter or add an expense</p>
          </div>
        )}
      </div>
    </div>
  );
}
