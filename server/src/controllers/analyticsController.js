const { query } = require('../config/db');
const { calculateGroupBalances } = require('../services/debtSimplifier');

// 1. Dashboard summary for current user across all groups
exports.getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all groups the user belongs to
    const groupsRes = await query(
      `SELECT g.id, g.name, g.category, g.invite_code, gm.role
       FROM groups g
       INNER JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = $1`,
      [userId]
    );

    const groupIds = groupsRes.rows.map((g) => g.id);

    if (groupIds.length === 0) {
      return res.json({
        totalGroupExpenses: 0,
        totalPaidByMe: 0,
        netBalance: 0,
        amountOwedToMe: 0,
        amountIOwe: 0,
        activeGroups: [],
        recentTransactions: [],
        categorySpending: [],
      });
    }

    const placeholders = groupIds.map((_, i) => `$${i + 1}`).join(',');

    // Fetch all members in these groups
    const membersRes = await query(
      `SELECT u.id, u.name, u.email, u.avatar_url, u.upi_id, gm.group_id
       FROM group_members gm
       INNER JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id IN (${placeholders})`,
      groupIds
    );

    // Fetch all expenses in these groups
    const expensesRes = await query(
      `SELECT e.*, u.name as paid_by_name, u.avatar_url as paid_by_avatar, g.name as group_name
       FROM expenses e
       INNER JOIN users u ON e.paid_by_id = u.id
       INNER JOIN groups g ON e.group_id = g.id
       WHERE e.group_id IN (${placeholders})
       ORDER BY e.expense_date DESC, e.created_at DESC`,
      groupIds
    );

    const expenseIds = expensesRes.rows.map((e) => e.id);
    let splits = [];
    if (expenseIds.length > 0) {
      const splitPlaceholders = expenseIds.map((_, i) => `$${i + 1}`).join(',');
      const splitRes = await query(
        `SELECT es.*, u.name as user_name
         FROM expense_splits es
         INNER JOIN users u ON es.user_id = u.id
         WHERE es.expense_id IN (${splitPlaceholders})`,
        expenseIds
      );
      splits = splitRes.rows;
    }

    const expensesWithSplits = expensesRes.rows.map((e) => ({
      ...e,
      splits: splits.filter((s) => s.expense_id === e.id),
    }));

    // Fetch all settlements
    const settlementsRes = await query(
      `SELECT s.*, 
              p.name as payer_name, p.avatar_url as payer_avatar,
              r.name as receiver_name, r.avatar_url as receiver_avatar,
              g.name as group_name
       FROM settlements s
       INNER JOIN users p ON s.payer_id = p.id
       INNER JOIN users r ON s.receiver_id = r.id
       INNER JOIN groups g ON s.group_id = g.id
       WHERE s.group_id IN (${placeholders})
       ORDER BY s.settlement_date DESC, s.created_at DESC`,
      groupIds
    );

    // Calculate per-group balances and aggregate dashboard stats
    let totalGroupExpenses = 0;
    let totalPaidByMe = 0;
    let amountOwedToMe = 0;
    let amountIOwe = 0;

    const activeGroups = groupsRes.rows.map((grp) => {
      const grpMembers = membersRes.rows.filter((m) => m.group_id === grp.id);
      const grpExpenses = expensesWithSplits.filter((e) => e.group_id === grp.id);
      const grpSettlements = settlementsRes.rows.filter((s) => s.group_id === grp.id);

      const balData = calculateGroupBalances(grpMembers, grpExpenses, grpSettlements);
      const myBal = balData.memberBalances.find((mb) => mb.user.id === userId);
      const net = myBal ? myBal.netBalance : 0;

      if (net > 0) {
        amountOwedToMe += net;
      } else if (net < 0) {
        amountIOwe += Math.abs(net);
      }

      const grpSpend = grpExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
      totalGroupExpenses += grpSpend;

      return {
        ...grp,
        memberCount: grpMembers.length,
        totalSpending: Math.round(grpSpend * 100) / 100,
        myBalance: net,
        myStatus: net > 0.01 ? 'owed' : net < -0.01 ? 'owes' : 'settled',
        simplifiedDebts: balData.simplifiedDebts,
      };
    });

    // Total amount paid by me in expenses
    totalPaidByMe = expensesRes.rows
      .filter((e) => e.paid_by_id === userId)
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // Recent unified transaction feed (both expenses and settlements)
    const recentTransactions = [];

    expensesRes.rows.slice(0, 15).forEach((e) => {
      const mySplit = splits.find((s) => s.expense_id === e.id && s.user_id === userId);
      recentTransactions.push({
        id: e.id,
        type: 'expense',
        title: e.title,
        category: e.category,
        amount: Number(e.amount),
        date: e.expense_date,
        createdAt: e.created_at,
        groupId: e.group_id,
        groupName: e.group_name,
        paidBy: { id: e.paid_by_id, name: e.paid_by_name, avatar: e.paid_by_avatar },
        isPayer: e.paid_by_id === userId,
        myShare: mySplit ? Number(mySplit.amount_owed) : 0,
      });
    });

    settlementsRes.rows.slice(0, 10).forEach((s) => {
      recentTransactions.push({
        id: s.id,
        type: 'settlement',
        title: `Settlement: ${s.payer_name} → ${s.receiver_name}`,
        category: 'Settlement',
        amount: Number(s.amount),
        date: s.settlement_date,
        createdAt: s.created_at,
        groupId: s.group_id,
        groupName: s.group_name,
        payer: { id: s.payer_id, name: s.payer_name, avatar: s.payer_avatar },
        receiver: { id: s.receiver_id, name: s.receiver_name, avatar: s.receiver_avatar },
        isPayer: s.payer_id === userId,
        isReceiver: s.receiver_id === userId,
        paymentMethod: s.payment_method,
      });
    });

    // Sort recent unified transactions by date descending
    recentTransactions.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

    // Category breakdown
    const categoryTotals = {};
    expensesRes.rows.forEach((e) => {
      const cat = e.category || 'General';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(e.amount || 0);
    });

    const categorySpending = Object.keys(categoryTotals).map((cat) => ({
      category: cat,
      amount: Math.round(categoryTotals[cat] * 100) / 100,
    }));

    res.json({
      totalGroupExpenses: Math.round(totalGroupExpenses * 100) / 100,
      totalPaidByMe: Math.round(totalPaidByMe * 100) / 100,
      amountOwedToMe: Math.round(amountOwedToMe * 100) / 100,
      amountIOwe: Math.round(amountIOwe * 100) / 100,
      netBalance: Math.round((amountOwedToMe - amountIOwe) * 100) / 100,
      activeGroups,
      recentTransactions: recentTransactions.slice(0, 15),
      categorySpending,
    });
  } catch (err) {
    console.error('getDashboardSummary error:', err);
    res.status(500).json({ error: 'Failed to retrieve dashboard summary: ' + err.message });
  }
};

// 2. Full analytics reports (monthly spending, categories, member distributions)
exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.query;

    let groupIds = [];
    if (groupId && groupId !== 'all') {
      groupIds = [groupId];
    } else {
      const userGroups = await query(
        'SELECT group_id FROM group_members WHERE user_id = $1',
        [userId]
      );
      groupIds = userGroups.rows.map((g) => g.group_id);
    }

    if (groupIds.length === 0) {
      return res.json({
        monthlySpending: [],
        categoryBreakdown: [],
        memberContributions: [],
      });
    }

    const placeholders = groupIds.map((_, i) => `$${i + 1}`).join(',');

    const expensesRes = await query(
      `SELECT e.*, u.name as paid_by_name
       FROM expenses e
       INNER JOIN users u ON e.paid_by_id = u.id
       WHERE e.group_id IN (${placeholders})
       ORDER BY e.expense_date ASC`,
      groupIds
    );

    // 1. Monthly Trends
    const monthlyMap = {};
    expensesRes.rows.forEach((e) => {
      const d = new Date(e.expense_date);
      const monthKey = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, total: 0, mySpend: 0 };
      }
      monthlyMap[monthKey].total += Number(e.amount || 0);
      if (e.paid_by_id === userId) {
        monthlyMap[monthKey].mySpend += Number(e.amount || 0);
      }
    });

    const monthlySpending = Object.values(monthlyMap).map((m) => ({
      month: m.month,
      total: Math.round(m.total * 100) / 100,
      mySpend: Math.round(m.mySpend * 100) / 100,
    }));

    // 2. Category Breakdown
    const catMap = {};
    let grandTotal = 0;
    expensesRes.rows.forEach((e) => {
      const cat = e.category || 'General';
      const amt = Number(e.amount || 0);
      catMap[cat] = (catMap[cat] || 0) + amt;
      grandTotal += amt;
    });

    const categoryBreakdown = Object.keys(catMap).map((cat) => ({
      name: cat,
      value: Math.round(catMap[cat] * 100) / 100,
      percentage: grandTotal > 0 ? Math.round((catMap[cat] / grandTotal) * 1000) / 10 : 0,
    }));

    // 3. Member Contributions
    const memberMap = {};
    expensesRes.rows.forEach((e) => {
      const name = e.paid_by_name;
      memberMap[name] = (memberMap[name] || 0) + Number(e.amount || 0);
    });

    const memberContributions = Object.keys(memberMap).map((name) => ({
      name,
      amount: Math.round(memberMap[name] * 100) / 100,
    }));

    res.json({
      monthlySpending,
      categoryBreakdown,
      memberContributions,
      grandTotal: Math.round(grandTotal * 100) / 100,
    });
  } catch (err) {
    console.error('getAnalytics error:', err);
    res.status(500).json({ error: 'Failed to retrieve analytics: ' + err.message });
  }
};
