# CampusSplit – Spend Together, Split Smartly 🎓💸

CampusSplit is a modern, fully-responsive group expense-sharing web application specifically designed for college students. Roommates, trip squads, and project groups can record shared expenses, split bills equally, unequally, or by custom percentages, and automatically compute simplified settlement paths using the **Greedy Min-Cash-Flow Algorithm**.

---

## 🌟 Key Features

### 1. Modern Authentication & Profiles
- College student signup and login with secure **bcrypt** password hashing and **JWT** session tokens.
- User profile with avatar customization and **UPI ID** management for seamless mobile peer-to-peer settlements.
- **1-Click Student Demo Logins** on the login page for rapid multi-perspective testing (Krunal, Aarav, Priya).

### 2. Interactive Finance Dashboard
- 4 primary metric cards: Total Group Expenses, Total Paid by Me, Amount Others Owe Me, and Amount I Owe.
- Net balance status hero banner with instant visual indicator.
- Active groups list with member count, total spending, and user balance badges.
- Unified recent transaction feed tracking both expenses and settlements chronologically.
- Category spending mini-visualizer.

### 3. Comprehensive Group Management
- Create groups with predefined student categories: *Hostel Roommates*, *College Trip*, *Food & Outings*, *Birthday Party*, *Project Team*, and *General*.
- 6-character unique invite codes (`ROOM302`, `GOA2026`) and 1-click shareable join links (`/join/:inviteCode`).
- Invite members by college email address.
- Group settings with edit and delete permissions.

### 4. Advanced Expense Splitting Engine
- Add, edit, and delete shared bills with categories, payer selection, receipt notes, and date pickers.
- **Three Mathematically Rigorous Splitting Methods**:
  1. **Equal Split**: Automatically distributes amounts equally among checked members down to exact paisa/cents.
  2. **Unequal Split**: Custom rupee amounts per participant with real-time balance validation (difference indicator).
  3. **Percentage Split**: Custom percentages per participant with live 100% total check.

### 5. Smart Balance Calculation & Debt Simplification (Min-Cash-Flow Algorithm)
- Evaluates directed debts across all expenses and settlements.
- Toggle between **Detailed Pairwise Debts** and **Simplified Settlements**.
- Greedy Min-Cash-Flow algorithm collapses $N$ pairwise debts into a minimal set of direct transfers, eliminating unnecessary circular payments (e.g. saves $2$ to $5$ redundant payments per group).
- **"Settle Now"** action buttons pre-fill payer, receiver, and debt amounts directly.

### 6. Settle Up with UPI, Cash & Confetti
- Record debt clearance payments between any two members.
- Integrated UPI handle support with one-click **"Copy UPI"** and **"Open UPI App"** links (`upi://pay?pa=...`).
- Celebratory confetti animation on debt settlement!
- Complete settlement audit history.

### 7. Financial Analytics & Visual Reports
- Interactive charts powered by **Recharts**:
  - Category spending donut chart with percentage breakdown.
  - Monthly spending trends bar chart comparing group totals vs personal spending.
  - Top spender leaderboard.
- Filter analytics across all groups or inspect an individual group.

### 8. Super Admin Command Center (Krunal Admin ID)
- Specific Admin ID login (`ADMIN-KRUNAL-007` with passcode `admin@krunal2026`).
- Dual identity for Krunal: regular student user + platform Super Admin.
- Real-time campus spending volume, live WebSocket connections counter, and server diagnostics.
- Student user directory with promote/demote and account management.
- Group oversight with ability to inspect or remove groups.
- Streaming live audit trail of platform events.

### 9. Real-Time WebSocket Synchronization (Socket.io)
- Automatic live synchronization across all connected clients.
- When an expense or settlement is added in a group, all other active members see balances and lists update instantly without page reload.
- Personal real-time notifications when receiving money.
- Visual `🟢 Live Sync Active` status badge in the navbar.

### 10. Premium Fintech UI/UX
- Violet, Indigo, and Slate modern color palette.
- Desktop sidebar navigation + Mobile fixed bottom navigation bar with quick floating action button.
- Responsive modals with keyboard support and toast notification alerts.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Recharts, Canvas Confetti.
- **Backend**: Node.js, Express.js, JWT, bcryptjs, CORS.
- **Database**: PostgreSQL support via `pg` pool, with zero-config persistent SQLite fallback for out-of-the-box local testing.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- npm

### 1. Launch CampusSplit
From the root directory:
```bash
npm start
```
*(Or run `node start.js`)*

This starts:
- **API Server** on `http://localhost:5000`
- **Vite React App** on `http://localhost:5173`

---

## 👥 Demo Accounts (Pre-seeded)

Use any of these demo student accounts (Password for all: `password123`):

| Name | Email | Default UPI ID | Sample Groups |
| :--- | :--- | :--- | :--- |
| **Krunal** | `krunal@campus.edu` | `krunal@okaxis` | Hostel Room 302, Goa Trip 2026, Foodies Squad |
| **Aarav Sharma** | `aarav@campus.edu` | `aaravsharma@okhdfcbank` | Hostel Room 302, Goa Trip, Birthday Party |
| **Priya Patel** | `priya@campus.edu` | `priyapatel@oksbi` | Goa Trip, Foodies Squad, Birthday Party |
| **Rohan Verma** | `rohan@campus.edu` | `rohanv@paytm` | Hostel Room 302, Goa Trip, Birthday Party |
| **Sneha Kulkarni**| `sneha@campus.edu` | `snehak@icici` | Goa Trip, Foodies Squad |

*(You can also click any of the 1-click demo buttons on the Login page!)*

### 👑 Super Admin Portal Credentials

- **Admin Login URL**: `http://localhost:5173/admin/login`
- **Specific Admin ID**: `ADMIN-KRUNAL-007`
- **Admin Passcode**: `admin@krunal2026`
- **Dual Role**: When logged in as Krunal (`krunal@campus.edu`), you can also click the **"Admin Portal"** button directly in the navbar or sidebar!

---

## 🧮 Debt Simplification Algorithm

The algorithm operates on the net balance vector $\vec{b}$ where:
$$b_i = \sum \text{Paid}_i - \sum \text{Owed}_i$$

1. Filter users into Creditors ($b_c > 0$) and Debtors ($b_d < 0$).
2. Sort creditors and debtors by absolute balance descending.
3. Greedily match the largest debtor with the largest creditor:
   $$T = \min(|b_d|, b_c)$$
   Transfer $T$ from debtor to creditor.
4. Decrement balances and repeat until all balances are within $\pm 0.01$.
5. Reduces graph edges from $O(V^2)$ to at most $V-1$ transactions.
