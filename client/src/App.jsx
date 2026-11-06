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

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Groups from './pages/Groups';
import GroupDetails from './pages/GroupDetails';
import Analytics from './pages/Analytics';
import Activity from './pages/Activity';
import Profile from './pages/Profile';
import JoinGroupDirect from './pages/JoinGroupDirect';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

// Route Guard
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
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
  const adminToken = localStorage.getItem('campussplit_admin_token');
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Allow if adminToken exists OR if logged-in user is Krunal / is_admin
  const isKrunalOrAdmin = user?.email === 'krunal@campus.edu' || user?.is_admin;
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
            </SocketProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
