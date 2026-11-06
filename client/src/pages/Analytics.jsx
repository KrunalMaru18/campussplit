import React, { useState, useEffect } from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { PieChart, TrendingUp, Users, Wallet, ArrowUpRight, Filter } from 'lucide-react';
import { analyticsApi, groupsApi } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const CHART_COLORS = [
  '#7c3aed',
  '#4f46e5',
  '#10b981',
  '#f59e0b',
  '#f43f5e',
  '#06b6d4',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
];

export default function Analytics() {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const gRes = await groupsApi.getAll();
        setGroups(gRes.groups || []);
      } catch (e) {
        console.error(e);
      }
    }
    init();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await analyticsApi.getReports(selectedGroupId);
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [selectedGroupId]);

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-6xl mx-auto pb-24 lg:pb-8">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Financial Reports & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Gain transparent insights into category spending trends and member contributions
          </p>
        </div>

        {/* Group Selector Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Groups Combined</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          <div className="h-80 bg-slate-200 rounded-2xl"></div>
          <div className="h-80 bg-slate-200 rounded-2xl"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Total Stat Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Total Expenses Analyzed
              </span>
              <span className="text-3xl font-extrabold text-slate-900">
                {formatCurrency(data?.grandTotal || 0)}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <PieChart className="w-6 h-6" />
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Category Spending Breakdown (Donut/Pie Chart) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Category Breakdown</h3>
                <p className="text-xs text-slate-500">Distribution of spending across categories</p>
              </div>

              {data?.categoryBreakdown?.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={data.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {data.categoryBreakdown.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => [formatCurrency(val), 'Amount']}
                        contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-16">No expense data available</p>
              )}

              {/* Legend List */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                {data?.categoryBreakdown?.map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    ></div>
                    <span className="text-slate-600 truncate">{cat.name}:</span>
                    <span className="font-bold text-slate-800 ml-auto">{cat.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Monthly Trends Bar Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Monthly Spending Trends</h3>
                <p className="text-xs text-slate-500">Group total vs personal spending</p>
              </div>

              {data?.monthlySpending?.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.monthlySpending}>
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${val}`} />
                      <Tooltip
                        formatter={(val) => [formatCurrency(val), 'Amount']}
                        contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="total" name="Total Group Spend" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="mySpend" name="My Spending" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-16">No monthly history yet</p>
              )}
            </div>
          </div>

          {/* Member Spending Ranking */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Top Spenders</h3>
              <p className="text-xs text-slate-500">Who covered bills the most</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {data?.memberContributions?.map((mem, idx) => (
                <div
                  key={mem.name}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-xs text-purple-700 bg-purple-100 w-6 h-6 rounded-full flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-xs text-slate-800">{mem.name}</span>
                  </div>
                  <span className="font-extrabold text-xs text-slate-900">
                    {formatCurrency(mem.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
