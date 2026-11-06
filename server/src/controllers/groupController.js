const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { calculateGroupBalances } = require('../services/debtSimplifier');
const { JWT_SECRET } = require('../middleware/auth');
const { emitToGroup, emitToAdmin } = require('../config/socket');

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'CAMPUS-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 1. Create a new group
exports.createGroup = async (req, res) => {
  try {
    const { name, description, category } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Group name is required.' });
    }

    const groupId = uuidv4();
    const inviteCode = generateInviteCode();
    const userId = req.user.id;
    const finalCategory = category || 'General';

    // Insert group
    await query(
      `INSERT INTO groups (id, name, description, category, invite_code, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [groupId, name.trim(), description ? description.trim() : '', finalCategory, inviteCode, userId]
    );

    // Insert creator as admin member
    const memberId = uuidv4();
    await query(
      `INSERT INTO group_members (id, group_id, user_id, role)
       VALUES ($1, $2, $3, 'admin')`,
      [memberId, groupId, userId]
    );

    res.status(201).json({
      message: 'Group created successfully!',
      group: {
        id: groupId,
        name: name.trim(),
        description: description || '',
        category: finalCategory,
        invite_code: inviteCode,
        created_by: userId,
      },
    });
  } catch (err) {
    console.error('createGroup error:', err);
    res.status(500).json({ error: 'Failed to create group: ' + err.message });
  }
};

// 2. List all groups current user belongs to
exports.getUserGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    const groupResult = await query(
      `SELECT g.id, g.name, g.description, g.category, g.invite_code, g.created_by, g.created_at,
              gm.role, gm.joined_at
       FROM groups g
       INNER JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = $1
       ORDER BY g.created_at DESC`,
      [userId]
    );

    const groups = [];

    for (const group of groupResult.rows) {
      // Get member count and avatars
      const membersRes = await query(
        `SELECT u.id, u.name, u.email, u.avatar_url, u.upi_id, gm.role
         FROM group_members gm
         INNER JOIN users u ON gm.user_id = u.id
         WHERE gm.group_id = $1`,
        [group.id]
      );

      // Get expenses
      const expenseRes = await query(
        `SELECT id, amount, paid_by_id FROM expenses WHERE group_id = $1`,
        [group.id]
      );

      // Fetch splits for these expenses
      const expenseIds = expenseRes.rows.map((e) => e.id);
      let splits = [];
      if (expenseIds.length > 0) {
        const placeholders = expenseIds.map((_, i) => `$${i + 1}`).join(',');
        const splitRes = await query(
          `SELECT expense_id, user_id, amount_owed FROM expense_splits WHERE expense_id IN (${placeholders})`,
          expenseIds
        );
        splits = splitRes.rows;
      }

      // Fetch settlements
      const settlementRes = await query(
        `SELECT payer_id, receiver_id, amount FROM settlements WHERE group_id = $1`,
        [group.id]
      );

      // Map splits to expenses
      const expensesWithSplits = expenseRes.rows.map((e) => ({
        ...e,
        splits: splits.filter((s) => s.expense_id === e.id),
      }));

      // Calculate balance for this group
      const balanceData = calculateGroupBalances(
        membersRes.rows,
        expensesWithSplits,
        settlementRes.rows
      );

      const userBalance = balanceData.memberBalances.find((mb) => mb.user.id === userId);
      const totalSpending = expenseRes.rows.reduce((sum, e) => sum + Number(e.amount || 0), 0);

      groups.push({
        ...group,
        members: membersRes.rows,
        memberCount: membersRes.rows.length,
        totalSpending: Math.round(totalSpending * 100) / 100,
        myBalance: userBalance ? userBalance.netBalance : 0,
        myStatus: userBalance ? userBalance.status : 'settled',
      });
    }

    res.json({ groups });
  } catch (err) {
    console.error('getUserGroups error:', err);
    res.status(500).json({ error: 'Failed to fetch groups: ' + err.message });
  }
};

// 3. Get single group details with members, expenses, balances & settlements
exports.getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    // Check membership
    const membership = await query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this group.' });
    }

    const groupRes = await query('SELECT * FROM groups WHERE id = $1', [groupId]);
    if (groupRes.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found.' });
    }
    const group = groupRes.rows[0];

    // Members
    const membersRes = await query(
      `SELECT u.id, u.name, u.email, u.avatar_url, u.upi_id, gm.role, gm.joined_at
       FROM group_members gm
       INNER JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = $1
       ORDER BY gm.joined_at ASC`,
      [groupId]
    );

    // Expenses
    const expensesRes = await query(
      `SELECT e.*, u.name as paid_by_name, u.avatar_url as paid_by_avatar
       FROM expenses e
       INNER JOIN users u ON e.paid_by_id = u.id
       WHERE e.group_id = $1
       ORDER BY e.expense_date DESC, e.created_at DESC`,
      [groupId]
    );

    // Splits for all expenses in this group
    const expenseIds = expensesRes.rows.map((e) => e.id);
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

    const expensesWithSplits = expensesRes.rows.map((e) => ({
      ...e,
      splits: splits.filter((s) => s.expense_id === e.id),
    }));

    // Settlements
    const settlementsRes = await query(
      `SELECT s.*, 
              p.name as payer_name, p.avatar_url as payer_avatar,
              r.name as receiver_name, r.avatar_url as receiver_avatar
       FROM settlements s
       INNER JOIN users p ON s.payer_id = p.id
       INNER JOIN users r ON s.receiver_id = r.id
       WHERE s.group_id = $1
       ORDER BY s.settlement_date DESC, s.created_at DESC`,
      [groupId]
    );

    // Smart Balance & Debt Simplification Calculation
    const balances = calculateGroupBalances(
      membersRes.rows,
      expensesWithSplits,
      settlementsRes.rows
    );

    const totalSpending = expensesRes.rows.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    res.json({
      group: {
        ...group,
        totalSpending: Math.round(totalSpending * 100) / 100,
        currentUserRole: membership.rows[0].role,
      },
      members: membersRes.rows,
      expenses: expensesWithSplits,
      settlements: settlementsRes.rows,
      balances,
    });
  } catch (err) {
    console.error('getGroupById error:', err);
    res.status(500).json({ error: 'Failed to retrieve group details: ' + err.message });
  }
};

// 4. Join group by Invite Code
exports.joinGroupByInviteCode = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.id;

    if (!inviteCode || !inviteCode.trim()) {
      return res.status(400).json({ error: 'Invite code is required.' });
    }

    const groupRes = await query(
      'SELECT id, name FROM groups WHERE UPPER(invite_code) = UPPER($1)',
      [inviteCode.trim()]
    );

    if (groupRes.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid invite code. Group not found.' });
    }

    const group = groupRes.rows[0];

    // Check if already a member
    const existing = await query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [group.id, userId]
    );

    if (existing.rows.length > 0) {
      return res.json({ message: 'You are already a member of this group!', group });
    }

    await query(
      `INSERT INTO group_members (id, group_id, user_id, role)
       VALUES ($1, $2, $3, 'member')`,
      [uuidv4(), group.id, userId]
    );

    res.json({
      message: `You successfully joined ${group.name}!`,
      group,
    });
  } catch (err) {
    console.error('joinGroupByInviteCode error:', err);
    res.status(500).json({ error: 'Failed to join group: ' + err.message });
  }
};

// 5. Add member by email
exports.addMemberByEmail = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Member email is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find registered user
    let userRes = await query('SELECT id, name, email FROM users WHERE email = $1', [normalizedEmail]);

    let targetUserId;
    if (userRes.rows.length > 0) {
      targetUserId = userRes.rows[0].id;
    } else {
      // Auto-provision a friend placeholder account if not registered yet
      const placeholderId = uuidv4();
      const placeholderName = normalizedEmail.split('@')[0];
      const defaultPassHash = '$2a$10$WkL8mC1FzU5E3qT5i8mOzeEfxo7f7QyAkyY/wOqZJzJ.rV2BvU3K.'; // demo123
      const avatar = `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${placeholderName}`;

      await query(
        `INSERT INTO users (id, name, email, password_hash, avatar_url, upi_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [placeholderId, placeholderName, normalizedEmail, defaultPassHash, avatar, `${placeholderName}@okaxis`]
      );
      targetUserId = placeholderId;
    }

    // Check if already member
    const existing = await query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, targetUserId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User is already a member of this group.' });
    }

    await query(
      `INSERT INTO group_members (id, group_id, user_id, role)
       VALUES ($1, $2, $3, 'member')`,
      [uuidv4(), groupId, targetUserId]
    );

    res.json({ message: 'Member added to group successfully!' });
  } catch (err) {
    console.error('addMemberByEmail error:', err);
    res.status(500).json({ error: 'Failed to add member: ' + err.message });
  }
};

// 6. Update group details
exports.updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, category } = req.body;

    // Check membership & role
    const memberRes = await query(
      'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, req.user.id]
    );

    if (memberRes.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    await query(
      `UPDATE groups SET name = $1, description = $2, category = $3 WHERE id = $4`,
      [name.trim(), description ? description.trim() : '', category || 'General', groupId]
    );

    res.json({ message: 'Group updated successfully!' });
  } catch (err) {
    console.error('updateGroup error:', err);
    res.status(500).json({ error: 'Failed to update group: ' + err.message });
  }
};

// 7. Delete group (creator or admin only)
exports.deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const groupRes = await query('SELECT created_by FROM groups WHERE id = $1', [groupId]);

    if (groupRes.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found.' });
    }

    if (groupRes.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'Only the group creator can delete this group.' });
    }

    await query('DELETE FROM groups WHERE id = $1', [groupId]);
    res.json({ message: 'Group deleted successfully.' });
  } catch (err) {
    console.error('deleteGroup error:', err);
    res.status(500).json({ error: 'Failed to delete group: ' + err.message });
  }
};

// 8. Public Group Preview by Invite Code (No login required)
exports.getGroupPreview = async (req, res) => {
  try {
    const { inviteCode } = req.params;
    if (!inviteCode) {
      return res.status(400).json({ error: 'Invite code is required.' });
    }

    const groupRes = await query(
      `SELECT g.id, g.name, g.description, g.category, g.invite_code, g.created_at,
              u.name as creator_name, u.avatar_url as creator_avatar
       FROM groups g
       LEFT JOIN users u ON g.created_by = u.id
       WHERE UPPER(g.invite_code) = UPPER($1)`,
      [inviteCode.trim()]
    );

    if (groupRes.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid invite link: Group not found.' });
    }

    const group = groupRes.rows[0];

    // Member count and members avatars
    const membersRes = await query(
      `SELECT u.id, u.name, u.avatar_url
       FROM group_members gm
       INNER JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = $1`,
      [group.id]
    );

    res.json({
      group: {
        ...group,
        member_count: membersRes.rows.length,
        members: membersRes.rows,
      },
    });
  } catch (err) {
    console.error('getGroupPreview error:', err);
    res.status(500).json({ error: 'Failed to load group preview: ' + err.message });
  }
};

// 9. Public Join with Auth (Sign up + Join or Sign In + Join in 1 click)
exports.joinWithAuth = async (req, res) => {
  try {
    const { inviteCode, isNewUser, name, email, password, upi_id } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ error: 'Invite code is required.' });
    }
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check group existence
    const groupRes = await query(
      'SELECT id, name FROM groups WHERE UPPER(invite_code) = UPPER($1)',
      [inviteCode.trim()]
    );
    if (groupRes.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found with this invite code.' });
    }
    const group = groupRes.rows[0];

    let user;
    let token;

    if (isNewUser) {
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Your name is required to create an account.' });
      }

      // Check if user already exists
      const existingUser = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'An account with this email already exists. Please select "Sign In" to join.' });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const newUserId = uuidv4();
      const avatar = `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${name.trim()}`;
      const finalUpi = upi_id ? upi_id.trim() : `${normalizedEmail.split('@')[0]}@okaxis`;

      await query(
        `INSERT INTO users (id, name, email, password_hash, raw_password, avatar_url, upi_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [newUserId, name.trim(), normalizedEmail, passwordHash, password, avatar, finalUpi]
      );

      user = {
        id: newUserId,
        name: name.trim(),
        email: normalizedEmail,
        avatar_url: avatar,
        upi_id: finalUpi,
      };

      token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, {
        expiresIn: '30d',
      });
    } else {
      // Existing User login
      const existingUserRes = await query(
        'SELECT id, name, email, password_hash, avatar_url, upi_id, is_admin, admin_id FROM users WHERE email = $1',
        [normalizedEmail]
      );

      if (existingUserRes.rows.length === 0) {
        return res.status(401).json({ error: 'No account found with this email. Please sign up.' });
      }

      const dbUser = existingUserRes.rows[0];
      const isMatch = await bcrypt.compare(password, dbUser.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Incorrect password.' });
      }

      user = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        avatar_url: dbUser.avatar_url,
        upi_id: dbUser.upi_id,
        is_admin: dbUser.is_admin,
        admin_id: dbUser.admin_id,
      };

      token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, {
        expiresIn: '30d',
      });
    }

    // Add user to group (if not already member)
    const membershipCheck = await query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [group.id, user.id]
    );

    if (membershipCheck.rows.length === 0) {
      await query(
        `INSERT INTO group_members (id, group_id, user_id, role)
         VALUES ($1, $2, $3, 'member')`,
        [uuidv4(), group.id, user.id]
      );

      // Real-time notification to group members
      emitToGroup(group.id, 'MEMBER_JOINED', {
        groupId: group.id,
        user: { id: user.id, name: user.name, avatar_url: user.avatar_url },
      });
      emitToAdmin('ADMIN_AUDIT', {
        type: 'MEMBER_JOINED',
        title: `${user.name} joined ${group.name}`,
      });
    }

    res.json({
      message: `Welcome! You successfully joined ${group.name}.`,
      token,
      user,
      group,
    });
  } catch (err) {
    console.error('joinWithAuth error:', err);
    res.status(500).json({ error: 'Failed to join group: ' + err.message });
  }
};

