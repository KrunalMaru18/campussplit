const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { initDbClient, createTables, query } = require('../config/db');

async function seed() {
  console.log('🌱 Starting database seeding for CampusSplit...');
  await initDbClient();
  await createTables();

  // Clear existing data for clean seed
  await query('DELETE FROM settlements');
  await query('DELETE FROM expense_splits');
  await query('DELETE FROM expenses');
  await query('DELETE FROM group_members');
  await query('DELETE FROM groups');
  await query('DELETE FROM users');

  const salt = await bcrypt.genSalt(10);
  const commonPasswordHash = await bcrypt.hash('password123', salt);
  const krunalPasswordHash = await bcrypt.hash('krunal0506', salt);

  // 1. Create Users
  const users = [
    {
      id: 'u-krunal-101',
      name: 'Krunal',
      email: 'krunal@campus.edu',
      password_hash: krunalPasswordHash,
      raw_password: 'krunal0506',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      upi_id: 'krunal@okaxis',
    },
    {
      id: 'u-krunal-gmail',
      name: 'Krunal Maru',
      email: 'krunal@gmail.com',
      password_hash: krunalPasswordHash,
      raw_password: 'krunal0506',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      upi_id: 'krunal@okaxis',
    },
    {
      id: 'u-aarav-102',
      name: 'Aarav Sharma',
      email: 'aarav@campus.edu',
      password_hash: commonPasswordHash,
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
      upi_id: 'aaravsharma@okhdfcbank',
    },
    {
      id: 'u-priya-103',
      name: 'Priya Patel',
      email: 'priya@campus.edu',
      password_hash: commonPasswordHash,
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
      upi_id: 'priyapatel@oksbi',
    },
    {
      id: 'u-rohan-104',
      name: 'Rohan Verma',
      email: 'rohan@campus.edu',
      password_hash: commonPasswordHash,
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
      upi_id: 'rohanv@paytm',
    },
    {
      id: 'u-sneha-105',
      name: 'Sneha Kulkarni',
      email: 'sneha@campus.edu',
      password_hash: commonPasswordHash,
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
      upi_id: 'snehak@icici',
    },
  ];

  for (const u of users) {
    const isAdmin = u.id === 'u-krunal-101' || u.id === 'u-krunal-gmail' ? 1 : 0;
    const adminId = isAdmin ? 'ADMIN-KRUNAL-007' : null;
    const rawPass = u.raw_password || 'password123';
    await query(
      `INSERT INTO users (id, name, email, password_hash, raw_password, avatar_url, upi_id, is_admin, admin_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [u.id, u.name, u.email, u.password_hash, rawPass, u.avatar_url, u.upi_id, isAdmin, adminId]
    );
  }
  console.log(` Inserted ${users.length} student users.`);

  // 2. Create Groups
  const groups = [
    {
      id: 'g-hostel-302',
      name: 'Hostel Roommates (Room 302)',
      description: 'Hostel grocery, electricity, wifi, and cleaning bills',
      category: 'Hostel',
      invite_code: 'ROOM302',
      created_by: 'u-krunal-101',
      members: ['u-krunal-101', 'u-aarav-102', 'u-rohan-104'],
    },
    {
      id: 'g-goa-trip',
      name: 'College Trip to Goa',
      description: 'Sem break road trip - fuel, beach villa, water sports & cafe',
      category: 'Trip',
      invite_code: 'GOA2026',
      created_by: 'u-krunal-101',
      members: ['u-krunal-101', 'u-aarav-102', 'u-priya-103', 'u-rohan-104', 'u-sneha-105'],
    },
    {
      id: 'g-canteen-squad',
      name: 'Food & Outings Squad',
      description: 'Campus canteen snacks, chai breaks, Zomato & weekend dinners',
      category: 'Food',
      invite_code: 'CHAI100',
      created_by: 'u-priya-103',
      members: ['u-krunal-101', 'u-priya-103', 'u-sneha-105'],
    },
    {
      id: 'g-birthday-bash',
      name: 'Birthday Party',
      description: 'Surprise celebration, customized cake, gifts and dinner buffet',
      category: 'Celebration',
      invite_code: 'BDAYBASH',
      created_by: 'u-rohan-104',
      members: ['u-krunal-101', 'u-aarav-102', 'u-priya-103', 'u-rohan-104'],
    },
  ];

  for (const g of groups) {
    await query(
      `INSERT INTO groups (id, name, description, category, invite_code, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [g.id, g.name, g.description, g.category, g.invite_code, g.created_by]
    );

    for (const memId of g.members) {
      await query(
        `INSERT INTO group_members (id, group_id, user_id, role)
         VALUES ($1, $2, $3, $4)`,
        [uuidv4(), g.id, memId, memId === g.created_by ? 'admin' : 'member']
      );
    }
  }
  console.log(` Inserted ${groups.length} groups with student memberships.`);

  console.log(' Clean database ready with 0 mock expenses.');
  console.log(' Database seed finished successfully!');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}

module.exports = { seed };
