const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { emitToGroup, emitToUser, emitToAdmin, broadcastEvent } = require('../config/socket');

// 1. Record Settlement
exports.createSettlement = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { payer_id, receiver_id, amount, payment_method = 'UPI', notes, settlement_date } = req.body;

    if (!payer_id || !receiver_id) {
      return res.status(400).json({ error: 'Both payer and receiver are required.' });
    }
    if (payer_id === receiver_id) {
      return res.status(400).json({ error: 'Payer and receiver cannot be the same person.' });
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ error: 'Settlement amount must be greater than zero.' });
    }

    // Verify membership of both users
    const memberCheck = await query(
      'SELECT user_id FROM group_members WHERE group_id = $1 AND user_id IN ($2, $3)',
      [groupId, payer_id, receiver_id]
    );

    if (memberCheck.rows.length < 2) {
      return res.status(400).json({ error: 'Both users must be members of this group.' });
    }

    const settlementId = uuidv4();
    const finalDate = settlement_date || new Date().toISOString().split('T')[0];

    await query(
      `INSERT INTO settlements (id, group_id, payer_id, receiver_id, amount, payment_method, notes, settlement_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        settlementId,
        groupId,
        payer_id,
        receiver_id,
        Math.round(numAmount * 100) / 100,
        payment_method,
        notes ? notes.trim() : '',
        finalDate,
      ]
    );

    // Real-time broadcast
    emitToGroup(groupId, 'SETTLEMENT_RECORDED', {
      settlementId,
      groupId,
      payer_id,
      receiver_id,
      amount: Math.round(numAmount * 100) / 100,
      payment_method,
    });
    emitToUser(receiver_id, 'PAYMENT_RECEIVED', {
      from: payer_id,
      amount: Math.round(numAmount * 100) / 100,
      method: payment_method,
      groupId,
    });
    emitToUser(payer_id, 'USER_BALANCE_CHANGED', { groupId });
    emitToAdmin('ADMIN_AUDIT', {
      type: 'SETTLEMENT',
      title: `Settlement recorded: ₹${numAmount} (${payment_method})`,
      detail: `Payer: ${payer_id} → Receiver: ${receiver_id} in ${groupId}`,
    });
    broadcastEvent('GLOBAL_ACTIVITY', { type: 'settlement', amount: numAmount, groupId });

    res.status(201).json({
      message: 'Settlement recorded successfully!',
      settlementId,
    });
  } catch (err) {
    console.error('createSettlement error:', err);
    res.status(500).json({ error: 'Failed to record settlement: ' + err.message });
  }
};

// 2. Delete / Undo settlement
exports.deleteSettlement = async (req, res) => {
  try {
    const { settlementId } = req.params;

    const existing = await query('SELECT group_id, payer_id, receiver_id FROM settlements WHERE id = $1', [settlementId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Settlement not found.' });
    }

    const item = existing.rows[0];
    if (req.user.id !== item.payer_id && req.user.id !== item.receiver_id) {
      // Check if group admin
      const adminCheck = await query(
        'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2 AND role = "admin"',
        [item.group_id, req.user.id]
      );
      if (adminCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    }

    await query('DELETE FROM settlements WHERE id = $1', [settlementId]);
    res.json({ message: 'Settlement deleted successfully.' });
  } catch (err) {
    console.error('deleteSettlement error:', err);
    res.status(500).json({ error: 'Failed to delete settlement: ' + err.message });
  }
};

// 3. Get group settlements history
exports.getGroupSettlements = async (req, res) => {
  try {
    const { groupId } = req.params;

    const result = await query(
      `SELECT s.*, 
              p.name as payer_name, p.avatar_url as payer_avatar, p.upi_id as payer_upi,
              r.name as receiver_name, r.avatar_url as receiver_avatar, r.upi_id as receiver_upi
       FROM settlements s
       INNER JOIN users p ON s.payer_id = p.id
       INNER JOIN users r ON s.receiver_id = r.id
       WHERE s.group_id = $1
       ORDER BY s.settlement_date DESC, s.created_at DESC`,
      [groupId]
    );

    res.json({ settlements: result.rows });
  } catch (err) {
    console.error('getGroupSettlements error:', err);
    res.status(500).json({ error: 'Failed to retrieve settlements: ' + err.message });
  }
};
