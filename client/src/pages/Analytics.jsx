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
  '#6654D9',
  '#917FF2',
  '#10B981',
  '#F59E0B',
  '#FF5A79',
  '#06B6D4',
  '#8B5CF6',
  '#EC4899',
  '#6366F1',
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
    <div className="p-4 sm:p-8 space-y-6 max-w-6xl mx-auto pb-28 lg:pb-12 transition-colors duration-200">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#17172B] dark:text-white tracking-tight">
            Spending Trends & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#7E7D9C] dark:text-[#A5A4BF] font-semibold">
            Gain transparent visual insights into category spending patterns and group balances
          </p>
        </div>

        {/* Group Selector Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#7E7D9C]" />
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="px-3.5 py-2 bg-white dark:bg-[#21213E] border border-[#EAE9F5] dark:border-[rgba(145,127,242,0.16)] rounded-xl text-xs font-bold text-[#17172B] dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6654D9]"
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
          <div className="h-80 bg-[#EAE9F5] dark:bg-[#21213E] rounded-3xl"></div>
          <div className="h-80 bg-[#EAE9F5] dark:bg-[#21213E] rounded-3xl"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Total Stat Card */}
          <div className="campus-card p-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-[#7E7D9C] dark:text-[#A5A4BF] uppercase tracking-wider block">
                Total Expenses Analyzed
              </span>
              <span className="text-3xl font-black text-[#17172B] dark:text-white">
                {formatCurrency(data?.grandTotal || 0)}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#6654D9]/10 text-[#6654D9] dark:text-[#917FF2] flex items-center justify-center">
              <PieChart className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Category Spending Breakdown (Donut/Pie Chart) */}
            <div className="campus-card p-6 space-y-4">
              <div>
                <h3 className="font-black text-base text-[#17172B] dark:text-white">Category Breakdown</h3>
                <p className="text-xs text-[#7E7D9C] dark:text-[#A5A4BF] font-medium">Distribution of spending across expense types</p>
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
                        contentStyle={{
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: '#21213E',
                          color: '#FFFFFF',
                          borderColor: 'rgba(145, 127, 242, 0.3)',
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-[#7E7D9C] text-center py-16 font-medium">No expense data available</p>
              )}

              {/* Legend List */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                {data?.categoryBreakdown?.map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-2 text-xs font-semibold">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    ></div>
                    <span className="text-[#636280] dark:text-[#DCD6FF] truncate">{cat.name}:</span>
                    <span className="font-black text-[#17172B] dark:text-white ml-auto">{cat.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Monthly Trends Bar Chart */}
            <div className="campus-card p-6 space-y-4">
              <div>
                <h3 className="font-black text-base text-[#17172B] dark:text-white">Monthly Spending Trends</h3>
                <p className="text-xs text-[#7E7D9C] dark:text-[#A5A4BF] font-medium">Overall group spending totals</p>
              </div>

              {data?.monthlySpending?.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.monthlySpending}>
                      <XAxis dataKey="month" stroke="#7E7D9C" fontSize={11} />
                      <YAxis stroke="#7E7D9C" fontSize={11} tickFormatter={(val) => `₹${val}`} />
                      <Tooltip
                        formatter={(val) => [formatCurrency(val), 'Total']}
                        contentStyle={{
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: '#21213E',
                          color: '#FFFFFF',
                          borderColor: 'rgba(145, 127, 242, 0.3)',
                        }}
                      />
                      <Bar dataKey="total" fill="#6654D9" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-[#7E7D9C] text-center py-16 font-medium">No monthly data available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
