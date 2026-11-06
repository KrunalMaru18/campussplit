const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, getDbType } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');
const { getLiveStats, emitToAdmin, broadcastEvent } = require('../config/socket');

// Specific Super Admin Master Passcode
const ADMIN_MASTER_PASSCODE = 'admin@krunal2026';

// 1. Admin Login via Specific Admin ID
exports.adminLogin = async (req, res) => {
  try {
    const { adminId, passcode } = req.body;

    if (!adminId || !passcode) {
      return res.status(400).json({ error: 'Admin ID and passcode are required.' });
    }

    const cleanAdminId = adminId.trim().toUpperCase();

    // Check against users table with is_admin = 1
    const userRes = await query(
      `SELECT id, name, email, avatar_url, upi_id, is_admin, admin_id, password_hash
       FROM users
       WHERE (UPPER(admin_id) = $1 OR UPPER(email) = $1) AND is_admin = 1`,
      [cleanAdminId]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Unauthorized: Invalid Admin ID or not an administrator.' });
    }

    const adminUser = userRes.rows[0];

    // Check passcode against master passcode OR user's own password
    const isMasterMatch = passcode === ADMIN_MASTER_PASSCODE;
    const isUserPasswordMatch = await bcrypt.compare(passcode, adminUser.password_hash);

    if (!isMasterMatch && !isUserPasswordMatch) {
      return res.status(401).json({ error: 'Invalid admin passcode.' });
    }

    // Sign Admin Token
    const adminToken = jwt.sign(
      {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: 'admin',
        admin_id: adminUser.admin_id || 'ADMIN-KRUNAL-007',
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    emitToAdmin('ADMIN_AUDIT', {
      type: 'ADMIN_LOGIN',
      description: `${adminUser.name} logged into the Admin Portal (${cleanAdminId})`,
    });

    res.json({
      message: 'Admin authentication successful! Welcome, Super Admin.',
      token: adminToken,
      admin: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        avatar_url: adminUser.avatar_url,
        admin_id: adminUser.admin_id || cleanAdminId,
        role: 'admin',
      },
    });
  } catch (err) {
    console.error('adminLogin error:', err);
    res.status(500).json({ error: 'Admin login failed: ' + err.message });
  }
};

// 2. Admin Dashboard Stats
exports.getAdminStats = async (req, res) => {
  try {
    const usersCountRes = await query('SELECT COUNT(*) as count FROM users');
    const groupsCountRes = await query('SELECT COUNT(*) as count FROM groups');
    const expensesRes = await query('SELECT COUNT(*) as count, SUM(amount) as total_volume FROM expenses');
    const settlementsRes = await query('SELECT COUNT(*) as count, SUM(amount) as total_volume FROM settlements');

    const liveStats = getLiveStats();

    // Memory and Uptime
    const uptimeSeconds = process.uptime();
    const memory = process.memoryUsage();

    res.json({
      totalUsers: Number(usersCountRes.rows[0]?.count || usersCountRes.rows[0]?.['count(*)'] || 0),
      totalGroups: Number(groupsCountRes.rows[0]?.count || groupsCountRes.rows[0]?.['count(*)'] || 0),
      totalExpensesCount: Number(expensesRes.rows[0]?.count || expensesRes.rows[0]?.['count(*)'] || 0),
      totalPlatformVolume: Number(expensesRes.rows[0]?.total_volume || 0),
      totalSettlementsCount: Number(settlementsRes.rows[0]?.count || settlementsRes.rows[0]?.['count(*)'] || 0),
      totalSettledVolume: Number(settlementsRes.rows[0]?.total_volume || 0),
      activeConnections: liveStats.activeConnections,
      dbType: getDbType(),
      uptimeSeconds: Math.floor(uptimeSeconds),
      memoryUsageMB: Math.round(memory.heapUsed / 1024 / 1024),
    });
  } catch (err) {
    console.error('getAdminStats error:', err);
    res.status(500).json({ error: 'Failed to retrieve admin stats: ' + err.message });
  }
};

// 3. User Management
exports.getAdminUsers = async (req, res) => {
  try {
    const usersRes = await query(
      `SELECT u.id, u.name, u.email, u.avatar_url, u.upi_id, u.is_admin, u.admin_id,
              COALESCE(u.raw_password, 'password123') as raw_password,
              u.created_at,
              COUNT(DISTINCT gm.group_id) as groups_count,
              COALESCE(SUM(e.amount), 0) as total_paid
       FROM users u
       LEFT JOIN group_members gm ON u.id = gm.user_id
       LEFT JOIN expenses e ON u.id = e.paid_by_id
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );

    res.json({ users: usersRes.rows });
  } catch (err) {
    console.error('getAdminUsers error:', err);
    res.status(500).json({ error: 'Failed to fetch users: ' + err.message });
  }
};

// 4. Toggle Admin Status
exports.toggleAdminStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isAdmin } = req.body;

    const newAdminStatus = isAdmin ? 1 : 0;
    const adminId = isAdmin ? `ADMIN-${Date.now().toString().slice(-4)}` : null;

    await query('UPDATE users SET is_admin = $1, admin_id = $2 WHERE id = $3', [
      newAdminStatus,
      adminId,
      userId,
    ]);

    emitToAdmin('ADMIN_AUDIT', {
      type: 'ROLE_UPDATE',
      description: `User ${userId} admin role set to ${newAdminStatus}`,
    });

    res.json({ message: 'User role updated successfully!' });
  } catch (err) {
    console.error('toggleAdminStatus error:', err);
    res.status(500).json({ error: 'Failed to update role: ' + err.message });
  }
};

// 5. Delete User
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Super Admin cannot delete their own account.' });
    }

    await query('DELETE FROM users WHERE id = $1', [userId]);

    emitToAdmin('ADMIN_AUDIT', {
      type: 'USER_DELETED',
      description: `User account deleted: ${userId}`,
    });

    res.json({ message: 'User deleted from platform.' });
  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ error: 'Failed to delete user: ' + err.message });
  }
};

// 6. Update Student Password (Admin can see or update password)
exports.updateUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.trim().length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword.trim(), salt);

    await query(
      'UPDATE users SET password_hash = $1, raw_password = $2 WHERE id = $3',
      [passwordHash, newPassword.trim(), userId]
    );

    // Get user details for audit
    const uRes = await query('SELECT name, email FROM users WHERE id = $1', [userId]);
    const targetUser = uRes.rows[0];

    emitToAdmin('ADMIN_AUDIT', {
      type: 'PASSWORD_RESET',
      title: `Password updated for ${targetUser?.name || userId}`,
      detail: `New password assigned by Admin`,
    });

    res.json({
      message: `Password successfully updated for ${targetUser?.name || 'student'}!`,
      newPassword: newPassword.trim(),
    });
  } catch (err) {
    console.error('updateUserPassword error:', err);
    res.status(500).json({ error: 'Failed to update user password: ' + err.message });
  }
};

// 7. Update Student Details (Admin can edit/update Name, Email ID, UPI ID, and Password)
exports.updateUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, upi_id, password } = req.body;

    // Check if user exists
    const userCheck = await query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const updates = [];
    const params = [];
    let idx = 1;

    if (name && name.trim()) {
      updates.push(`name = $${idx++}`);
      params.push(name.trim());
    }

    if (email && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      // Ensure email is not already taken by another user
      const emailCheck = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [cleanEmail, userId]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'This email is already registered to another student.' });
      }
      updates.push(`email = $${idx++}`);
      params.push(cleanEmail);
    }

    if (upi_id !== undefined) {
      updates.push(`upi_id = $${idx++}`);
      params.push(upi_id ? upi_id.trim() : null);
    }

    if (password && password.trim().length >= 4) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password.trim(), salt);
      updates.push(`password_hash = $${idx++}`);
      params.push(passwordHash);
      updates.push(`raw_password = $${idx++}`);
      params.push(password.trim());
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields provided to update.' });
    }

    params.push(userId);
    const updateSql = `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`;
    await query(updateSql, params);

    const updatedUserRes = await query(
      'SELECT id, name, email, avatar_url, upi_id, is_admin, admin_id, raw_password FROM users WHERE id = $1',
      [userId]
    );

    emitToAdmin('ADMIN_AUDIT', {
      type: 'STUDENT_UPDATED',
      title: `Student record updated: ${updatedUserRes.rows[0]?.name}`,
      detail: `Email: ${updatedUserRes.rows[0]?.email}, UPI: ${updatedUserRes.rows[0]?.upi_id || 'None'}`,
    });

    res.json({
      message: 'Student details updated successfully!',
      user: updatedUserRes.rows[0],
    });
  } catch (err) {
    console.error('updateUserDetails error:', err);
    res.status(500).json({ error: 'Failed to update student details: ' + err.message });
  }
};

// 8. Group Oversight
exports.getAdminGroups = async (req, res) => {
  try {
    const groupsRes = await query(
      `SELECT g.id, g.name, g.description, g.category, g.invite_code, g.created_at,
              u.name as creator_name, u.email as creator_email,
              COUNT(DISTINCT gm.user_id) as member_count,
              COALESCE(SUM(e.amount), 0) as total_spending
       FROM groups g
       LEFT JOIN users u ON g.created_by = u.id
       LEFT JOIN group_members gm ON g.id = gm.group_id
       LEFT JOIN expenses e ON g.id = e.group_id
       GROUP BY g.id
       ORDER BY g.created_at DESC`
    );

    res.json({ groups: groupsRes.rows });
  } catch (err) {
    console.error('getAdminGroups error:', err);
    res.status(500).json({ error: 'Failed to fetch groups: ' + err.message });
  }
};

// 7. Delete Inappropriate Group
exports.deleteAdminGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    await query('DELETE FROM groups WHERE id = $1', [groupId]);

    emitToAdmin('ADMIN_AUDIT', {
      type: 'GROUP_DELETED',
      description: `Group permanently deleted by admin: ${groupId}`,
    });

    res.json({ message: 'Group deleted successfully.' });
  } catch (err) {
    console.error('deleteAdminGroup error:', err);
    res.status(500).json({ error: 'Failed to delete group: ' + err.message });
  }
};

// 8. Global Audit Stream
exports.getAdminActivity = async (req, res) => {
  try {
    const expensesRes = await query(
      `SELECT e.id, e.title, e.amount, e.category, e.expense_date, e.created_at,
              u.name as paid_by_name, g.name as group_name
       FROM expenses e
       INNER JOIN users u ON e.paid_by_id = u.id
       INNER JOIN groups g ON e.group_id = g.id
       ORDER BY e.created_at DESC LIMIT 20`
    );

    const settlementsRes = await query(
      `SELECT s.id, s.amount, s.payment_method, s.settlement_date, s.created_at,
              p.name as payer_name, r.name as receiver_name, g.name as group_name
       FROM settlements s
       INNER JOIN users p ON s.payer_id = p.id
       INNER JOIN users r ON s.receiver_id = r.id
       INNER JOIN groups g ON s.group_id = g.id
       ORDER BY s.created_at DESC LIMIT 20`
    );

    const auditTrail = [];

    expensesRes.rows.forEach((e) => {
      auditTrail.push({
        id: e.id,
        type: 'EXPENSE',
        title: `Bill added: "${e.title}" (${e.category})`,
        detail: `${e.paid_by_name} paid ₹${e.amount} in ${e.group_name}`,
        date: e.expense_date || e.created_at,
        timestamp: e.created_at,
      });
    });

    settlementsRes.rows.forEach((s) => {
      auditTrail.push({
        id: s.id,
        type: 'SETTLEMENT',
        title: `Settlement via ${s.payment_method}`,
        detail: `${s.payer_name} sent ₹${s.amount} to ${s.receiver_name} in ${s.group_name}`,
        date: s.settlement_date || s.created_at,
        timestamp: s.created_at,
      });
    });

    auditTrail.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({ auditTrail: auditTrail.slice(0, 30) });
  } catch (err) {
    console.error('getAdminActivity error:', err);
    res.status(500).json({ error: 'Failed to fetch audit log: ' + err.message });
  }
};

// 9. Clear all transactions for zero/fresh state
exports.clearAllTransactions = async (req, res) => {
  try {
    await query('DELETE FROM settlements');
    await query('DELETE FROM expense_splits');
    await query('DELETE FROM expenses');

    emitToAdmin('ADMIN_AUDIT', {
      type: 'CLEARED_ALL',
      title: 'Reset to Clean State',
      detail: 'Super Admin cleared all transactions. Totals reset to ₹0.00',
    });
    broadcastEvent('GLOBAL_ACTIVITY', { type: 'CLEARED_ALL' });

    res.json({ message: 'All expenses and settlements cleared successfully! Starting from ₹0.00.' });
  } catch (err) {
    console.error('clearAllTransactions error:', err);
    res.status(500).json({ error: 'Failed to clear transactions: ' + err.message });
  }
};

