import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';

// Layout
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import MobileNav from './components/layout/MobileNav';

// Modals & PWA
import AddExpenseModal from './components/expenses/AddExpenseModal';
import CreateGroupModal from './components/groups/CreateGroupModal';
import JoinGroupModal from './components/groups/JoinGroupModal';
import InstallPrompt from './components/common/InstallPrompt';

// Primary Pages (Eager loaded for instant first paint)
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';

// Secondary & Admin Pages (Lazy loaded for fast mobile loading speed)
const GroupDetails = React.lazy(() => import('./pages/GroupDetails'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Activity = React.lazy(() => import('./pages/Activity'));
const Profile = React.lazy(() => import('./pages/Profile'));
const JoinGroupDirect = React.lazy(() => import('./pages/JoinGroupDirect'));
const AdminLogin = React.lazy(() => import('./pages/admin/AdminLogin'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));

// Smooth Suspense Page Loader
function PageLoadingFallback() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-3">
      <div className="w-9 h-9 border-3 border-[#6654D9]/30 border-t-[#6654D9] rounded-full animate-spin"></div>
      <p className="text-xs font-semibold text-[#7E7D9C] dark:text-[#A5A4BF]">Loading view...</p>
    </div>
  );
}

// Route Guard
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7FC] dark:bg-[#17172B]">
        <div className="w-10 h-10 border-4 border-[#6654D9] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Admin Route Guard
function AdminRoute({ children }) {
  const adminToken = localStorage.getItem('campussplit_admin_token') || localStorage.getItem('campussplit_token');
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Allow if adminToken exists OR if logged-in user is Krunal / is_admin
  const isKrunalOrAdmin =
    user?.is_admin ||
    ['krunal@campus.edu', 'krunal@gmail.com', 'marukrunal.study@gmail.com', 'krunalmaru@gmail.com'].includes(
      user?.email?.toLowerCase()
    ) ||
    user?.email?.toLowerCase().startsWith('krunal');

  if (isKrunalOrAdmin && !localStorage.getItem('campussplit_admin_user')) {
    localStorage.setItem(
      'campussplit_admin_user',
      JSON.stringify({
        id: user.id,
        name: user.name || 'Krunal',
        email: user.email,
        admin_id: user.admin_id || 'ADMIN-KRUNAL-007',
        role: 'admin',
      })
    );
  }

  if (!adminToken && !isKrunalOrAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

// Main App Layout
function AppLayout() {
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isJoinGroupOpen, setIsJoinGroupOpen] = useState(false);
  const location = useLocation();

  // Get active page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/groups/')) return 'Group Details';
    if (path === '/groups') return 'My Groups';
    if (path === '/activity') return 'Recent Activity';
    if (path === '/analytics') return 'Analytics & Reports';
    if (path === '/profile') return 'Profile Settings';
    return 'Dashboard';
  };

  const handleExpenseSuccess = () => {
    window.dispatchEvent(new Event('expense-updated'));
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white font-sans transition-colors duration-200">
      {/* Desktop Sidebar */}
      <Sidebar onOpenAddExpense={() => setIsAddExpenseOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          title={getPageTitle()}
          onOpenAddExpense={() => setIsAddExpenseOpen(true)}
        />

        <main className="flex-1 overflow-x-hidden">
          <React.Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              <Route
                path="/dashboard"
                element={
                  <Dashboard
                    onOpenAddExpense={() => setIsAddExpenseOpen(true)}
                    onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
                    onOpenJoinGroup={() => setIsJoinGroupOpen(true)}
                  />
                }
              />
              <Route path="/groups" element={<Groups />} />
              <Route path="/groups/:groupId" element={<GroupDetails />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </React.Suspense>
        </main>

        {/* Mobile Bottom Nav */}
        <MobileNav onOpenAddExpense={() => setIsAddExpenseOpen(true)} />
      </div>

      {/* Global Modals */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSuccess={handleExpenseSuccess}
      />

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      <JoinGroupModal
        isOpen={isJoinGroupOpen}
        onClose={() => setIsJoinGroupOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      {/* PWA 1-Tap Mobile Install Prompt */}
      <InstallPrompt />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <SocketProvider>
              <React.Suspense fallback={<PageLoadingFallback />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/join/:inviteCode" element={<JoinGroupDirect />} />
                  <Route path="/admin/login" element={<AdminLogin />} />

                  {/* Dedicated Super Admin Portal */}
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    }
                  />

                  {/* Standard Student App */}
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <AppLayout />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </React.Suspense>
            </SocketProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
