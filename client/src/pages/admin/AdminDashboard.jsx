import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  Shield,
  Users,
  Users2,
  Wallet,
  Activity,
  Radio,
  Server,
  Trash2,
  Crown,
  Search,
  ArrowRight,
  LogOut,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  KeyRound,
  Copy,
  Check,
  X,
  Lock,
  Sparkles,
  Edit2,
  Mail,
  Smartphone
} from 'lucide-react';
import { adminApi } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const { socket, isConnected, joinAdmin } = useSocket();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview | users | groups | system
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState('');
  const [searchGroup, setSearchGroup] = useState('');

  // Password visibility map (userId -> boolean)
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Update Password Modal State
  const [editingPasswordUser, setEditingPasswordUser] = useState(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Full Student Edit Modal State (Name, Email ID, UPI ID, Password)
  const [editingStudent, setEditingStudent] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editUpiId, setEditUpiId] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [savingStudent, setSavingStudent] = useState(false);

  // Lock Admin Command Center to Dark Mode permanently
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const previousTheme = localStorage.getItem('campussplit_theme') || 'light';

    root.classList.add('dark');
    if (body) body.classList.add('dark');
    root.style.colorScheme = 'dark';

    return () => {
      if (previousTheme === 'light') {
        root.classList.remove('dark');
        if (body) body.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };
  }, []);

  const adminUser = JSON.parse(localStorage.getItem('campussplit_admin_user') || '{}');

  const loadAllAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, groupsRes, activityRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers(),
        adminApi.getGroups(),
        adminApi.getActivity(),
      ]);

      setStats(statsRes);
      setUsers(usersRes.users || []);
      setGroups(groupsRes.groups || []);
      setAuditLog(activityRes.auditTrail || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      if (err.status === 401 || err.status === 403) {
        toast.error('Admin session expired or access denied.');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
    joinAdmin();

    if (socket) {
      const handleAdminAudit = (event) => {
        setAuditLog((prev) => [
          {
            id: Date.now().toString(),
            type: event.type || 'SYSTEM',
            title: event.title || event.description,
            detail: event.detail || '',
            timestamp: event.timestamp || new Date().toISOString(),
          },
          ...prev.slice(0, 49),
        ]);

        if (event.type === 'EXPENSE' || event.type === 'SETTLEMENT') {
          adminApi.getStats().then((s) => setStats(s)).catch(() => {});
        }
      };

      const handleLiveStats = (data) => {
        setStats((prev) => (prev ? { ...prev, activeConnections: data.activeConnections } : prev));
      };

      socket.on('ADMIN_AUDIT', handleAdminAudit);
      socket.on('ADMIN_LIVE_STATS', handleLiveStats);

      return () => {
        socket.off('ADMIN_AUDIT', handleAdminAudit);
        socket.off('ADMIN_LIVE_STATS', handleLiveStats);
      };
    }
  }, [socket]);

  const handleAdminLogout = () => {
    localStorage.removeItem('campussplit_admin_token');
    localStorage.removeItem('campussplit_admin_user');
    toast.info('Logged out of Admin Portal.');
    navigate('/login');
  };

  const handleToggleAdminRole = async (userId, currentRole) => {
    const newStatus = !currentRole;
    try {
      await adminApi.toggleAdminRole(userId, newStatus);
      toast.success('Admin role updated.');
      loadAllAdminData();
    } catch (err) {
      toast.error(err.message || 'Failed to update role.');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"?`)) return;
    try {
      await adminApi.deleteUser(userId);
      toast.success(`User "${userName}" deleted.`);
      loadAllAdminData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete user.');
    }
  };

  const handleDeleteGroup = async (groupId, groupName) => {
    if (!window.confirm(`Are you sure you want to permanently delete group "${groupName}"?`)) return;
    try {
      await adminApi.deleteGroup(groupId);
      toast.success(`Group "${groupName}" deleted.`);
      loadAllAdminData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete group.');
    }
  };

  const handleClearAllTransactions = async () => {
    if (!window.confirm('⚠️ Are you sure you want to clear ALL expenses and settlements across campus? All balances and transaction feeds will reset cleanly to ₹0.00 so you can start recording 100% real data.')) {
      return;
    }
    try {
      const res = await adminApi.clearAllTransactions();
      toast.success(res.message || 'Transactions cleared! Starting from clean ₹0.00.');
      loadAllAdminData();
    } catch (err) {
      toast.error(err.message || 'Failed to clear transactions.');
    }
  };

  // Toggle Password visibility for student
  const togglePasswordVisibility = (userId) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  // Copy password to clipboard
  const handleCopyPassword = (pwd, name) => {
    navigator.clipboard.writeText(pwd);
    setCopiedId(name);
    toast.success(`Password for ${name} copied!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Update Password Modal
  const openPasswordModal = (user) => {
    setEditingPasswordUser(user);
    setNewPasswordVal('');
    setShowNewPassword(false);
  };

  // Save New Password for Student
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!newPasswordVal || newPasswordVal.trim().length < 4) {
      toast.error('Password must be at least 4 characters long.');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await adminApi.updateUserPassword(editingPasswordUser.id, newPasswordVal.trim());
      toast.success(res.message || 'Password updated successfully!');
      setEditingPasswordUser(null);
      loadAllAdminData();
    } catch (err) {
      toast.error(err.message || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  // Open Full Student Edit Modal (Name, Email ID, UPI ID, Password)
  const openEditStudentModal = (u) => {
    setEditingStudent(u);
    setEditName(u.name || '');
    setEditEmail(u.email || '');
    setEditUpiId(u.upi_id || '');
    setEditPassword(u.raw_password || '');
    setShowEditPassword(false);
  };

  // Save Updated Student Details
  const handleSaveStudentDetails = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim()) {
      toast.error('Student Name and Email are required.');
      return;
    }

    setSavingStudent(true);
    try {
      const res = await adminApi.updateUserDetails(editingStudent.id, {
        name: editName.trim(),
        email: editEmail.trim(),
        upi_id: editUpiId.trim(),
        password: editPassword.trim(),
      });
      toast.success(res.message || 'Student updated successfully!');
      setEditingStudent(null);
      loadAllAdminData();
    } catch (err) {
      toast.error(err.message || 'Failed to update student.');
    } finally {
      setSavingStudent(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchUser.toLowerCase())
  );

  const filteredGroups = groups.filter((g) =>
    g.name?.toLowerCase().includes(searchGroup.toLowerCase()) ||
    g.category?.toLowerCase().includes(searchGroup.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-16">
      {/* Admin Top Navbar */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-neutral-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                CampusSplit Super Admin
              </h1>
              <span className="font-mono text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                {adminUser.admin_id || 'ADMIN-KRUNAL-007'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-neutral-400">
              <span>Commander: {adminUser.name || 'Krunal'}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                <span className={isConnected ? 'text-emerald-400 font-medium' : 'text-rose-500'}>
                  {isConnected ? 'Real-Time Live' : 'Connecting'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">

          <NavLink
            to="/dashboard"
            onClick={() => {
              const admTok = localStorage.getItem('campussplit_admin_token');
              if (admTok && !localStorage.getItem('campussplit_token')) {
                localStorage.setItem('campussplit_token', admTok);
              }
            }}
            className="px-3.5 py-2 rounded-xl gradient-brand text-white font-black text-xs shadow-md shadow-[#6654D9]/30 transition-all flex items-center gap-2 active:scale-95"
            title="Open Student Site"
          >
            <Users className="w-4 h-4" />
            <span>Student Site</span>
          </NavLink>

          <button
            onClick={loadAllAdminData}
            title="Refresh Data"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleAdminLogout}
            title="Log out of Admin"
            className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Students
            </span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats?.totalUsers || 0}</span>
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Active Groups
            </span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{stats?.totalGroups || 0}</span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Users2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Campus Volume
            </span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                {formatCurrency(stats?.totalPlatformVolume || 0)}
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {stats?.totalExpensesCount || 0} shared bills recorded
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl relative overflow-hidden shadow-sm">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Live Sockets & Engine
            </span>
            <div className="flex items-center justify-between mt-2">
              <div>
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {stats?.activeConnections || 1} Live
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  DB: {stats?.dbType || 'SQLite'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto pb-1">
          {[
            { id: 'overview', label: 'Live Audit Stream', icon: Activity, count: auditLog.length },
            { id: 'users', label: 'Student Directory', icon: Users, count: users.length },
            { id: 'groups', label: 'Group Oversight', icon: Users2, count: groups.length },
            { id: 'system', label: 'System Health', icon: Server },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: LIVE AUDIT LOG */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span>Real-Time Activity & Audit Feed</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Streaming every bill, settlement, and registration across campus in real time
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden shadow-sm">
              {auditLog.map((log, idx) => (
                <div
                  key={log.id || idx}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors animate-fade-in"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-1 rounded-md shrink-0 ${
                        log.type === 'EXPENSE'
                          ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30'
                          : log.type === 'SETTLEMENT'
                          ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                          : log.type === 'PASSWORD_RESET'
                          ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                          : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30'
                      }`}
                    >
                      {log.type}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{log.title}</p>
                      {log.detail && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{log.detail}</p>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                    {formatDate(log.timestamp || log.date)}
                  </span>
                </div>
              ))}

              {auditLog.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                  <Activity className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-semibold">No audit events recorded yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: USER DIRECTORY WITH PASSWORD MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span>Registered Students & Password Management</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Super Admin can see student passwords, reveal plain text, or update/reset credentials
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student by name or email..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold text-[11px]">
                    <tr>
                      <th className="p-4">Student</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Student Password</th>
                      <th className="p-4">UPI Handle</th>
                      <th className="p-4">Groups</th>
                      <th className="p-4">Role</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredUsers.map((u) => {
                      const isPwdVisible = visiblePasswords[u.id];
                      const pwdText = u.raw_password || 'password123';

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 flex items-center gap-3">
                            <img
                              src={u.avatar_url || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${u.name}`}
                              className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-purple-500/20"
                            />
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">{u.name}</span>
                              <span className="text-[10px] text-slate-400">ID: {u.id.slice(0, 8)}...</span>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-slate-600 dark:text-slate-300">{u.email}</td>

                          {/* Password Column with Reveal, Copy & Update */}
                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-semibold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 min-w-[70px] text-center select-all">
                                {isPwdVisible ? pwdText : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(u.id)}
                                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                                title={isPwdVisible ? 'Hide password' : 'Show student password'}
                              >
                                {isPwdVisible ? <EyeOff className="w-3.5 h-3.5 text-purple-600" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyPassword(pwdText, u.name)}
                                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                                title="Copy password"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openPasswordModal(u)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 font-semibold text-[11px] transition-colors shadow-sm ml-1"
                                title="Update student password"
                              >
                                <KeyRound className="w-3 h-3 text-amber-500" />
                                <span>Update</span>
                              </button>
                            </div>
                          </td>

                          <td className="p-4 font-mono text-purple-700 dark:text-amber-300 font-semibold">{u.upi_id || '—'}</td>
                          <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{u.groups_count || 0}</td>
                          <td className="p-4">
                            {u.is_admin ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 font-bold text-[10px]">
                                <Crown className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                <span>Super Admin</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-semibold">
                                Student
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => openEditStudentModal(u)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 font-bold text-[11px] transition-colors"
                              title="Edit Student Profile (Email, UPI, Name, Password)"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-purple-400" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleAdminRole(u.id, u.is_admin)}
                              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-[11px] transition-colors"
                            >
                              {u.is_admin ? 'Demote' : 'Make Admin'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="p-1 rounded-lg hover:bg-rose-950/60 text-neutral-400 hover:text-rose-400 transition-colors inline-block align-middle"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GROUP OVERSIGHT */}
        {activeTab === 'groups' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span>Campus Groups Oversight</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">All active groups and shared spending totals</p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={searchGroup}
                  onChange={(e) => setSearchGroup(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold text-[11px]">
                    <tr>
                      <th className="p-4">Group Name</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Invite Code</th>
                      <th className="p-4">Members</th>
                      <th className="p-4">Total Spending</th>
                      <th className="p-4">Creator</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredGroups.map((g) => (
                      <tr key={g.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-bold text-slate-900 dark:text-white">{g.name}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">{g.category}</td>
                        <td className="p-4 font-mono font-bold text-purple-600 dark:text-purple-400">{g.invite_code}</td>
                        <td className="p-4 font-semibold text-slate-600 dark:text-slate-300">{g.member_count}</td>
                        <td className="p-4 font-extrabold text-amber-600 dark:text-amber-300">
                          {formatCurrency(g.total_spending || 0)}
                        </td>
                        <td className="p-4 text-slate-500 dark:text-slate-400">{g.creator_name || g.creator_email}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteGroup(g.id, g.name)}
                            className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                            title="Delete Group"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SYSTEM HEALTH */}
        {activeTab === 'system' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>Platform Health & Runtime Diagnostics</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 font-bold uppercase block">Database Engine</span>
                <span className="text-base font-bold text-slate-900 dark:text-white mt-1 block">
                  {stats?.dbType === 'postgres' ? 'PostgreSQL 16' : 'Persistent SQLite Adapter'}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 font-bold uppercase block">Server Uptime</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {Math.floor((stats?.uptimeSeconds || 0) / 60)} minutes (Healthy)
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 font-bold uppercase block">Memory Usage</span>
                <span className="text-base font-bold text-amber-600 dark:text-amber-300 mt-1 block">
                  {stats?.memoryUsageMB || 0} MB
                </span>
              </div>
            </div>

            {/* Clean State Reset Danger Zone */}
            <div className="p-5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/20 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Clean Data & Reset Controls</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Wipe all expenses, splits, and settlements across all groups. Useful when you want all balances, statistics, and transaction feeds to start fresh at ₹0.00 with purely real expenses.
              </p>
              <button
                type="button"
                onClick={handleClearAllTransactions}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset All Transactions to ₹0.00 (Start Fresh)</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* UPDATE STUDENT PASSWORD MODAL */}
      {editingPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="gradient-brand p-5 text-white flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <KeyRound className="w-5 h-5" />
                  <span>Update Student Password</span>
                </h2>
                <p className="text-xs text-purple-200 mt-0.5">
                  Set a new password for {editingPasswordUser.name}
                </p>
              </div>
              <button
                onClick={() => setEditingPasswordUser(null)}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="p-6 space-y-4">
              {/* Student Info Card */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-3">
                <img
                  src={editingPasswordUser.avatar_url || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${editingPasswordUser.name}`}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/20"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{editingPasswordUser.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">{editingPasswordUser.email}</p>
                </div>
              </div>

              {/* Current Password Display */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Current Password on Record
                </label>
                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 font-semibold select-all">
                  {editingPasswordUser.raw_password || 'password123'}
                </div>
              </div>

              {/* New Password Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    New Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const rand = 'pass' + Math.floor(1000 + Math.random() * 9000);
                      setNewPasswordVal(rand);
                      setShowNewPassword(true);
                    }}
                    className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    ⚡ Generate Random
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter new password (min 4 chars)"
                    value={newPasswordVal}
                    onChange={(e) => setNewPasswordVal(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingPasswordUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-700 text-neutral-300 font-semibold text-xs hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-5 py-2.5 rounded-xl gradient-brand text-white font-bold text-xs shadow-md shadow-purple-600/30 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{savingPassword ? 'Saving Password...' : 'Save New Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL STUDENT EDIT MODAL (Name, Email ID, UPI ID, Password) */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Edit Student Account</h3>
                  <p className="text-xs text-neutral-400">Update student email, UPI handle, name or credentials</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Preview Header */}
            <div className="flex items-center gap-3 p-3 bg-neutral-950 rounded-2xl border border-neutral-800">
              <img
                src={editingStudent.avatar_url || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${editingStudent.name}`}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500/30 shrink-0"
                alt="Avatar"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">{editingStudent.name}</p>
                <p className="text-xs text-neutral-400 font-mono truncate">{editingStudent.email}</p>
                <span className="font-mono text-[10px] text-amber-400">ID: {editingStudent.id}</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveStudentDetails} className="space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Student Name
                </label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-2.5 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-black border border-neutral-800 rounded-xl text-sm font-semibold text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Student Email ID
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-2.5 w-4 h-4 text-neutral-500" />
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-black border border-neutral-800 rounded-xl text-sm font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* UPI ID Field */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                  UPI ID (Handle for Settlements)
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3.5 top-2.5 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="e.g. name@okhdfcbank"
                    value={editUpiId}
                    onChange={(e) => setEditUpiId(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-black border border-neutral-800 rounded-xl text-sm font-mono text-amber-300 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    Student Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const rand = 'pass' + Math.floor(1000 + Math.random() * 9000);
                      setEditPassword(rand);
                      setShowEditPassword(true);
                    }}
                    className="text-[11px] font-bold text-purple-400 hover:underline"
                  >
                    ⚡ Generate Random
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-2.5 w-4 h-4 text-neutral-500" />
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-2.5 bg-black border border-neutral-800 rounded-xl text-sm font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3.5 top-2.5 text-neutral-400 hover:text-white"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-800 text-neutral-300 font-semibold text-xs hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStudent}
                  className="px-5 py-2.5 rounded-xl gradient-brand text-white font-bold text-xs shadow-md shadow-purple-600/30 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{savingStudent ? 'Saving Student...' : 'Save Student Details'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
