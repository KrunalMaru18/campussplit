import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  UserPlus,
  LogIn,
  Mail,
  Lock,
  User,
  CreditCard,
  ShieldCheck,
  Sun,
  Moon,
} from 'lucide-react';
import { groupsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { CategoryBadge } from '../utils/categoryIcons';
import { getInitials } from '../utils/formatters';

export default function JoinGroupDirect() {
  const { inviteCode } = useParams();
  const { user, setAuthSession } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [group, setGroup] = useState(null);
  const [error, setError] = useState('');

  // Form states for unauthenticated friends
  const [authMode, setAuthMode] = useState('signup'); // 'signup' | 'login'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [upiId, setUpiId] = useState('');
  const [formError, setFormError] = useState('');

  // 1. Fetch group preview on mount
  useEffect(() => {
    async function fetchPreview() {
      if (!inviteCode) {
        setError('No invite code specified in link.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await groupsApi.getGroupPreview(inviteCode);
        setGroup(res.group);
      } catch (err) {
        setError(err.message || 'Invalid or expired invitation link.');
      } finally {
        setLoading(false);
      }
    }

    fetchPreview();
  }, [inviteCode]);

  // 2. Action for ALREADY logged-in user
  const handleJoinAsLoggedInUser = async () => {
    setSubmitting(true);
    setFormError('');

    try {
      const res = await groupsApi.joinByCode(inviteCode);
      toast.success(res.message || `Welcome to ${group.name}!`);
      if (res.group?.id) {
        navigate(`/groups/${res.group.id}`);
      } else {
        navigate('/groups');
      }
    } catch (err) {
      setFormError(err.message || 'Failed to join group.');
      toast.error(err.message || 'Failed to join group.');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Action for friend signing up or logging in to join
  const handleAuthAndJoin = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email || !password) {
      setFormError('Email and password are required.');
      return;
    }

    if (authMode === 'signup' && !name.trim()) {
      setFormError('Please enter your full name.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await groupsApi.joinWithAuth({
        inviteCode,
        isNewUser: authMode === 'signup',
        name: name.trim(),
        email: email.trim(),
        password,
        upi_id: upiId.trim(),
      });

      // Update auth session in React context & localStorage
      if (res.user && res.token && setAuthSession) {
        setAuthSession(res.user, res.token);
      }

      toast.success(res.message || `Welcome to ${group?.name || 'group'}!`);
      navigate(`/groups/${res.group.id}`);
    } catch (err) {
      setFormError(err.message || 'Failed to join group. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white flex items-center justify-center p-4 py-12 relative overflow-hidden transition-colors duration-200">
      {/* Top right theme toggle */}
      <div className="absolute top-6 right-6 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-neutral-800 shadow-sm transition-all"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-purple-600" />}
        </button>
      </div>

      {/* Decorative ambient gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-lg bg-white dark:bg-black backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-neutral-800 p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CampusSplit Invitation</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Spend Together, Split Smartly
          </h1>
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            Join your friends to split bills, track shared expenses, and settle balances easily.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
            <p className="text-sm font-medium text-slate-600">Retrieving group invitation details...</p>
          </div>
        )}

        {/* Error / Group Not Found State */}
        {!loading && error && (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center mx-auto text-rose-500">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-800">Invalid Invitation Link</h2>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                {error}
              </p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 rounded-xl gradient-brand text-white font-semibold text-xs shadow-md shadow-purple-600/20 hover:brightness-110 active:scale-95 transition-all"
              >
                Go to Sign In
              </button>
            </div>
          </div>
        )}

        {/* Valid Group Invitation Card */}
        {!loading && group && (
          <div className="space-y-6">
            {/* Group Banner */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-200/60 px-2 py-0.5 rounded-md">
                      Group Invite
                    </span>
                    <CategoryBadge category={group.category || 'General'} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{group.name}</h2>
                  {group.description && (
                    <p className="text-xs text-slate-600">{group.description}</p>
                  )}
                </div>

                <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center text-white font-black text-lg shadow-md shadow-purple-600/20 shrink-0">
                  {getInitials(group.name)}
                </div>
              </div>

              {/* Creator & Member Count Info */}
              <div className="pt-2 border-t border-purple-100/80 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="text-slate-400">Created by:</span>
                  <strong className="text-slate-800">{group.creator_name || 'Group Admin'}</strong>
                </span>

                <span className="flex items-center gap-1 font-semibold text-purple-700 bg-white px-2.5 py-1 rounded-lg border border-purple-100 shadow-sm">
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  <span>{group.member_count || group.members?.length || 1} members</span>
                </span>
              </div>

              {/* Members Avatars preview */}
              {group.members && group.members.length > 0 && (
                <div className="flex items-center gap-1.5 pt-1">
                  <div className="flex -space-x-2 overflow-hidden">
                    {group.members.slice(0, 5).map((m, idx) => (
                      <div
                        key={m.id || idx}
                        className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-purple-200 text-purple-900 text-[10px] font-bold flex items-center justify-center overflow-hidden"
                        title={m.name}
                      >
                        {m.avatar_url ? (
                          <img src={m.avatar_url} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          getInitials(m.name)
                        )}
                      </div>
                    ))}
                  </div>
                  {group.member_count > 5 && (
                    <span className="text-[10px] text-slate-500 font-medium">
                      +{group.member_count - 5} others
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Error in form submission */}
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            {/* CASE 1: USER IS ALREADY LOGGED IN */}
            {user ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-8 h-8 rounded-full gradient-brand text-white flex items-center justify-center text-xs font-bold">
                    {getInitials(user.name)}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800">{user.name}</p>
                    <p className="text-[11px] text-slate-500">{user.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleJoinAsLoggedInUser}
                  className="w-full py-3 rounded-xl gradient-brand text-white font-bold text-sm shadow-lg shadow-purple-600/30 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Joining Group...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept & Join Group</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* CASE 2: FRIEND IS NOT LOGGED IN YET (MOBILE / LAPTOP) */
              <div className="space-y-4">
                {/* Auth Mode Tabs */}
                <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setFormError('');
                    }}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      authMode === 'signup'
                        ? 'bg-white text-purple-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Quick Sign Up & Join</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setFormError('');
                    }}
                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      authMode === 'login'
                        ? 'bg-white text-purple-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Log In & Join</span>
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleAuthAndJoin} className="space-y-3.5">
                  {authMode === 'signup' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Your Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rahul Sharma"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      College Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. rahul@campus.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {authMode === 'signup' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          UPI ID
                        </label>
                        <span className="text-[10px] text-slate-400">Optional for fast settlements</span>
                      </div>
                      <div className="relative">
                        <CreditCard className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="e.g. rahul@okhdfcbank"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-xl gradient-brand text-white font-bold text-sm shadow-lg shadow-purple-600/30 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Connecting you to group...</span>
                      </>
                    ) : (
                      <>
                        <span>{authMode === 'signup' ? 'Create Account & Join Group' : 'Sign In & Join Group'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>You will be added immediately and can add expenses right away!</span>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
