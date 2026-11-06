const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { emitToGroup, emitToUser, emitToAdmin, broadcastEvent } = require('../config/socket');

/**
 * Validate and calculate splits based on split type
 */
function resolveSplits(totalAmount, splitType, participants) {
  // participants: [{ user_id, amount_owed, percentage }]
  if (!participants || participants.length === 0) {
    throw new Error('At least one participant must be included in the expense split.');
  }

  const roundedTotal = Math.round(Number(totalAmount) * 100) / 100;
  if (roundedTotal <= 0) {
    throw new Error('Expense amount must be greater than zero.');
  }

  const n = participants.length;
  const resultSplits = [];

  if (splitType === 'EQUAL') {
    // Distribute equally with penny/paisa precision
    const baseShare = Math.floor((roundedTotal / n) * 100) / 100;
    let remainder = Math.round((roundedTotal - baseShare * n) * 100) / 100;

    participants.forEach((p, idx) => {
      let share = baseShare;
      if (remainder > 0.001) {
        share = Math.round((share + 0.01) * 100) / 100;
        remainder = Math.round((remainder - 0.01) * 100) / 100;
      }
      const pct = Math.round((share / roundedTotal) * 10000) / 100;
      resultSplits.push({
        user_id: p.user_id,
        amount_owed: share,
        percentage: pct,
      });
    });
  } else if (splitType === 'UNEQUAL') {
    let sum = 0;
    participants.forEach((p) => {
      const share = Math.round(Number(p.amount_owed || 0) * 100) / 100;
      if (share < 0) {
        throw new Error('Split amount cannot be negative.');
      }
      sum += share;
      const pct = Math.round((share / roundedTotal) * 10000) / 100;
      resultSplits.push({
        user_id: p.user_id,
        amount_owed: share,
        percentage: pct,
      });
    });

    sum = Math.round(sum * 100) / 100;
    if (Math.abs(sum - roundedTotal) > 0.05) {
      throw new Error(`The individual amounts (₹${sum}) must add up to the total expense (₹${roundedTotal}). Difference: ₹${Math.abs(sum - roundedTotal).toFixed(2)}`);
    }
  } else if (splitType === 'PERCENTAGE') {
    let sumPct = 0;
    participants.forEach((p) => {
      const pct = Number(p.percentage || 0);
      if (pct < 0) {
        throw new Error('Split percentage cannot be negative.');
      }
      sumPct += pct;
    });

    sumPct = Math.round(sumPct * 100) / 100;
    if (Math.abs(sumPct - 100) > 0.1) {
      throw new Error(`Total percentages must add up to 100%. Currently: ${sumPct}%.`);
    }

    let allocatedSum = 0;
    participants.forEach((p, idx) => {
      const pct = Number(p.percentage || 0);
      let share;
      if (idx === participants.length - 1) {
        // Last person gets exact remaining amount to prevent penny rounding mismatch
        share = Math.round((roundedTotal - allocatedSum) * 100) / 100;
      } else {
        share = Math.round(((pct / 100) * roundedTotal) * 100) / 100;
        allocatedSum += share;
      }
      resultSplits.push({
        user_id: p.user_id,
        amount_owed: share,
        percentage: pct,
      });
    });
  } else {
    throw new Error('Unsupported split type. Must be EQUAL, UNEQUAL, or PERCENTAGE.');
  }

  return resultSplits;
}

// 1. Add Expense
exports.createExpense = async (req, res) => {
  try {
    const { groupId } = req.params;
    const effectivePaidById = req.body.paid_by_id || req.body.paidById;
    const effectiveSplitType = req.body.split_type || req.body.splitType || 'EQUAL';
    const effectiveExpenseDate = req.body.expense_date || req.body.expenseDate || new Date().toISOString().split('T')[0];
    const effectiveParticipants = req.body.participants || (req.body.splits ? req.body.splits.map(s => ({
      user_id: s.userId || s.user_id,
      amount_owed: s.amountOwed !== undefined ? s.amountOwed : s.amount_owed,
      percentage: s.percentage,
    })) : []);

    const {
      title,
      amount,
      category,
      notes,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Expense title is required.' });
    }
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Please enter a valid expense amount.' });
    }
    if (!effectivePaidById) {
      return res.status(400).json({ error: 'Payer is required.' });
    }

    // Verify user belongs to group
    const membership = await query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, req.user.id]
    );
    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this group.' });
    }

    // Validate & compute splits
    const resolvedSplits = resolveSplits(amount, effectiveSplitType, effectiveParticipants);

    const expenseId = uuidv4();
    const finalCategory = category || 'General';

    // Insert expense
    await query(
      `INSERT INTO expenses (id, group_id, title, amount, category, paid_by_id, split_type, notes, expense_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        expenseId,
        groupId,
        title.trim(),
        Number(amount),
        finalCategory,
        effectivePaidById,
        effectiveSplitType,
        notes ? notes.trim() : '',
        effectiveExpenseDate,
      ]
    );

    // Insert splits
    for (const split of resolvedSplits) {
      await query(
        `INSERT INTO expense_splits (id, expense_id, user_id, amount_owed, percentage)
         VALUES ($1, $2, $3, $4, $5)`,
        [uuidv4(), expenseId, split.user_id, split.amount_owed, split.percentage]
      );
    }

    // Real-time broadcast
    emitToGroup(groupId, 'EXPENSE_CREATED', {
      groupId,
      expenseId,
      title: title.trim(),
      amount: Number(amount),
      paid_by_id: effectivePaidById,
      category: finalCategory,
    });
    resolvedSplits.forEach((s) => emitToUser(s.user_id, 'USER_BALANCE_CHANGED', { groupId }));
    emitToAdmin('ADMIN_AUDIT', {
      type: 'EXPENSE',
      title: `Bill added: "${title.trim()}" (₹${amount})`,
      detail: `Paid by ${effectivePaidById} in group ${groupId}`,
    });
    broadcastEvent('GLOBAL_ACTIVITY', { type: 'expense', title: title.trim(), amount: Number(amount), groupId });

    res.status(201).json({
      message: 'Expense added successfully!',
      expenseId,
    });
  } catch (err) {
    console.error('createExpense error:', err);
    res.status(400).json({ error: err.message });
  }
};

// 2. Update Expense
exports.updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const {
      title,
      amount,
      category,
      paid_by_id,
      split_type = 'EQUAL',
      notes,
      expense_date,
      participants,
    } = req.body;

    const existingRes = await query('SELECT group_id FROM expenses WHERE id = $1', [expenseId]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found.' });
    }

    const groupId = existingRes.rows[0].group_id;

    // Check membership
    const membership = await query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, req.user.id]
    );
    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const effectivePaidById = req.body.paid_by_id || req.body.paidById;
    const effectiveSplitType = req.body.split_type || req.body.splitType || 'EQUAL';
    const effectiveExpenseDate = req.body.expense_date || req.body.expenseDate || new Date().toISOString().split('T')[0];
    const effectiveParticipants = req.body.participants || (req.body.splits ? req.body.splits.map(s => ({
      user_id: s.userId || s.user_id,
      amount_owed: s.amountOwed !== undefined ? s.amountOwed : s.amount_owed,
      percentage: s.percentage,
    })) : []);

    const resolvedSplits = resolveSplits(amount, effectiveSplitType, effectiveParticipants);

    // Update expense record
    await query(
      `UPDATE expenses 
       SET title = $1, amount = $2, category = $3, paid_by_id = $4, split_type = $5, notes = $6, expense_date = $7
       WHERE id = $8`,
      [
        title.trim(),
        Number(amount),
        category || 'General',
        effectivePaidById,
        effectiveSplitType,
        notes ? notes.trim() : '',
        effectiveExpenseDate,
        expenseId,
      ]
    );

    // Replace splits
    await query('DELETE FROM expense_splits WHERE expense_id = $1', [expenseId]);

    for (const split of resolvedSplits) {
      await query(
        `INSERT INTO expense_splits (id, expense_id, user_id, amount_owed, percentage)
         VALUES ($1, $2, $3, $4, $5)`,
        [uuidv4(), expenseId, split.user_id, split.amount_owed, split.percentage]
      );
    }

    // Real-time broadcast
    emitToGroup(groupId, 'EXPENSE_UPDATED', { groupId, expenseId, title: title.trim() });
    emitToAdmin('ADMIN_AUDIT', {
      type: 'EXPENSE_UPDATED',
      title: `Bill updated: "${title.trim()}" (₹${amount})`,
      detail: `Group ID: ${groupId}`,
    });

    res.json({ message: 'Expense updated successfully!' });
  } catch (err) {
    console.error('updateExpense error:', err);
    res.status(400).json({ error: err.message });
  }
};

// 3. Delete Expense
exports.deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;

    const existingRes = await query('SELECT group_id, title FROM expenses WHERE id = $1', [expenseId]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found.' });
    }

    const groupId = existingRes.rows[0].group_id;
    const deletedTitle = existingRes.rows[0].title;

    // Check membership
    const membership = await query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, req.user.id]
    );
    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Delete splits first
    await query('DELETE FROM expense_splits WHERE expense_id = $1', [expenseId]);
    await query('DELETE FROM expenses WHERE id = $1', [expenseId]);

    // Real-time broadcast
    emitToGroup(groupId, 'EXPENSE_DELETED', { groupId, expenseId, title: deletedTitle });
    emitToAdmin('ADMIN_AUDIT', {
      type: 'EXPENSE_DELETED',
      title: `Bill deleted: "${deletedTitle}"`,
      detail: `Group ID: ${groupId}`,
    });

    res.json({ message: 'Expense deleted successfully.' });
  } catch (err) {
    console.error('deleteExpense error:', err);
    res.status(500).json({ error: 'Failed to delete expense: ' + err.message });
  }
};

// 4. Get Expenses for a group with filters
exports.getGroupExpenses = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { category, memberId, startDate, endDate, search } = req.query;

    let sql = `
      SELECT e.*, u.name as paid_by_name, u.avatar_url as paid_by_avatar
      FROM expenses e
      INNER JOIN users u ON e.paid_by_id = u.id
      WHERE e.group_id = $1
    `;
    const params = [groupId];
    let idx = 2;

    if (category && category !== 'All') {
      sql += ` AND e.category = $${idx++}`;
      params.push(category);
    }
    if (memberId && memberId !== 'All') {
      sql += ` AND e.paid_by_id = $${idx++}`;
      params.push(memberId);
    }
    if (startDate) {
      sql += ` AND e.expense_date >= $${idx++}`;
      params.push(startDate);
    }
    if (endDate) {
      sql += ` AND e.expense_date <= $${idx++}`;
      params.push(endDate);
    }
    if (search && search.trim()) {
      sql += ` AND LOWER(e.title) LIKE $${idx++}`;
      params.push(`%${search.trim().toLowerCase()}%`);
    }

    sql += ' ORDER BY e.expense_date DESC, e.created_at DESC';

    const result = await query(sql, params);

    // Fetch splits
    const expenseIds = result.rows.map((e) => e.id);
    let splits = [];
    if (expenseIds.length > 0) {
      const placeholders = expenseIds.map((_, i) => `$${i + 1}`).join(',');
      const splitRes = await query(
        `SELECT es.*, u.name as user_name, u.avatar_url as user_avatar
         FROM expense_splits es
         INNER JOIN users u ON es.user_id = u.id
         WHERE es.expense_id IN (${placeholders})`,
        expenseIds
      );
      splits = splitRes.rows;
    }

    const expensesWithSplits = result.rows.map((e) => ({
      ...e,
      splits: splits.filter((s) => s.expense_id === e.id),
    }));

    res.json({ expenses: expensesWithSplits });
  } catch (err) {
    console.error('getGroupExpenses error:', err);
    res.status(500).json({ error: 'Failed to fetch expenses: ' + err.message });
  }
};
