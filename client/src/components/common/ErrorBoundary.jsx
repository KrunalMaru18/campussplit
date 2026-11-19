import React from 'react';
import { AlertCircle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CampusSplit ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHardReset = () => {
    try {
      localStorage.removeItem('campussplit_user');
      localStorage.removeItem('campussplit_token');
      sessionStorage.clear();
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
    } catch (e) {
      console.warn('Storage reset warning:', e);
    }
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-black text-slate-900 dark:text-white font-sans">
          <div className="max-w-md w-full bg-white dark:bg-neutral-950 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center shadow-md">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Oops! Something went wrong
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400">
                CampusSplit encountered an unexpected display issue. Don't worry, your data and group balances are safe.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-neutral-900 text-slate-600 dark:text-neutral-400 text-xs text-left overflow-x-auto font-mono max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-2.5 rounded-xl gradient-brand text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:opacity-95 active:scale-95 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
              <button
                onClick={this.handleHardReset}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 font-semibold text-xs sm:text-sm hover:bg-slate-200 dark:hover:bg-neutral-800 active:scale-95 transition-all"
              >
                Reset & Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
