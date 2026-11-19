const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

// Default modern college student avatars
const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
];

exports.register = async (req, res) => {
  try {
    const { name, email, password, avatar_url, upi_id } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const id = uuidv4();
    const chosenAvatar = avatar_url || DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
    const finalUpi = upi_id ? upi_id.trim() : `${normalizedEmail.split('@')[0]}@okaxis`;

    await query(
      `INSERT INTO users (id, name, email, password_hash, raw_password, avatar_url, upi_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, name.trim(), normalizedEmail, passwordHash, password, chosenAvatar, finalUpi]
    );

    const token = jwt.sign({ id, email: normalizedEmail, name: name.trim() }, JWT_SECRET, {
      expiresIn: '30d',
    });

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id,
        name: name.trim(),
        email: normalizedEmail,
        avatar_url: chosenAvatar,
        upi_id: finalUpi,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register account: ' + err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let result = await query(
      'SELECT id, name, email, password_hash, avatar_url, upi_id, is_admin FROM users WHERE LOWER(email) = $1',
      [normalizedEmail]
    );

    // Fallback: If user enters Krunal's gmail alias, map to Krunal's admin account
    if (
      result.rows.length === 0 &&
      (normalizedEmail === 'krunal@gmail.com' ||
       normalizedEmail === 'marukrunal.study@gmail.com' ||
       normalizedEmail === 'krunalmaru@gmail.com')
    ) {
      result = await query(
        'SELECT id, name, email, password_hash, avatar_url, upi_id, is_admin FROM users WHERE email = $1',
        ['krunal@campus.edu']
      );
    }

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // Check exact password
    let isMatch = await bcrypt.compare(password, user.password_hash);

    // Check decapitalized password (e.g. mobile auto-capitalization Krunal0506 -> krunal0506)
    if (!isMatch && password.length > 1) {
      const altPassword = password.charAt(0).toLowerCase() + password.slice(1);
      isMatch = await bcrypt.compare(altPassword, user.password_hash);
    }

    // Fallback for Krunal admin account (allows both krunal0506, Krunal0506, password123, admin@krunal2026)
    if (!isMatch && (user.email === 'krunal@campus.edu' || user.is_admin === 1)) {
      const cleanPass = password.trim().toLowerCase();
      if (cleanPass === 'krunal0506' || cleanPass === 'password123' || password === 'admin@krunal2026') {
        isMatch = true;
      }
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isUserAdmin = Boolean(user.is_admin || user.email === 'krunal@campus.edu');
    const adminId = user.admin_id || (isUserAdmin ? 'ADMIN-KRUNAL-007' : null);

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        is_admin: isUserAdmin,
        role: isUserAdmin ? 'admin' : 'student',
        admin_id: adminId,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Logged in successfully!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        upi_id: user.upi_id,
        is_admin: isUserAdmin,
        role: isUserAdmin ? 'admin' : 'student',
        admin_id: adminId,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, email, avatar_url, upi_id, is_admin, admin_id, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const u = result.rows[0];
    const isUserAdmin = Boolean(u.is_admin || u.email === 'krunal@campus.edu');
    res.json({
      user: {
        ...u,
        is_admin: isUserAdmin,
        role: isUserAdmin ? 'admin' : 'student',
        admin_id: u.admin_id || (isUserAdmin ? 'ADMIN-KRUNAL-007' : null),
      },
    });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ error: 'Failed to retrieve profile: ' + err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar_url, upi_id } = req.body;
    const updates = [];
    const params = [];
    let idx = 1;

    if (name) {
      updates.push(`name = $${idx++}`);
      params.push(name.trim());
    }
    if (avatar_url) {
      updates.push(`avatar_url = $${idx++}`);
      params.push(avatar_url.trim());
    }
    if (upi_id !== undefined) {
      updates.push(`upi_id = $${idx++}`);
      params.push(upi_id.trim());
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No profile fields provided to update.' });
    }

    params.push(req.user.id);
    const updateSql = `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`;
    await query(updateSql, params);

    const refreshed = await query(
      'SELECT id, name, email, avatar_url, upi_id FROM users WHERE id = $1',
      [req.user.id]
    );

    res.json({
      message: 'Profile updated successfully!',
      user: refreshed.rows[0],
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile: ' + err.message });
  }
};
