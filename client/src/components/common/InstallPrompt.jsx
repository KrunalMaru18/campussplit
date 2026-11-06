import React, { useState, useEffect } from 'react';
import { Download, Share2, PlusSquare, X, Sparkles, Smartphone, Check } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if app is already installed and running in standalone mode
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    
    setIsStandalone(isStandaloneMode);
    if (isStandaloneMode) return;

    // Check if dismissed recently in this session
    const isDismissed = sessionStorage.getItem('campussplit_pwa_dismissed');
    if (isDismissed) return;

    // Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt on Android / Chrome / Edge
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // For iOS users who aren't in standalone mode, show after a short delay
    if (isIOSDevice && !isStandaloneMode) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSInstructions(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSInstructions(false);
    sessionStorage.setItem('campussplit_pwa_dismissed', 'true');
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <>
      {/* Floating Installation Banner for Mobile & Desktop */}
      <aside aria-label="Install CampusSplit App" className="fixed bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="bg-gradient-to-r from-slate-900 to-purple-950 border border-purple-500/40 rounded-2xl p-4 shadow-2xl text-white backdrop-blur-xl relative overflow-hidden">
          {/* Decorative Glow */}
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-purple-500/20 rounded-full blur-xl pointer-events-none"></div>

          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-white shadow-lg shadow-purple-600/30 shrink-0">
                <Smartphone className="w-5 h-5 text-amber-300" />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  <span>Install CampusSplit App</span>
                  <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full uppercase">PWA</span>
                </h3>
                <p className="text-xs text-purple-200/90 line-clamp-1 mt-0.5">
                  1-Tap access directly from your phone home screen!
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3.5 flex items-center gap-2 pt-2 border-t border-white/10 relative z-10">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2 px-3.5 rounded-xl gradient-brand text-white font-bold text-xs shadow-md shadow-purple-600/40 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>{isIOS ? 'How to Install on iPhone' : 'Install App Now'}</span>
            </button>
            <button
              onClick={handleDismiss}
              className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 font-semibold text-xs transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </aside>

      {/* iOS Safari 2-Step Installation Guide Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-white space-y-4 relative">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center text-white">
                  <Smartphone className="w-4 h-4 text-amber-300" />
                </div>
                <h4 className="font-extrabold text-sm text-white">Install on iPhone / iPad</h4>
              </div>
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-purple-200">
              Apple Safari allows you to install CampusSplit directly to your iPhone Home Screen without the App Store:
            </p>

            <div className="space-y-3 text-xs bg-slate-950 p-3.5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                  1
                </div>
                <div>
                  Tap the <strong className="text-white">Share button</strong> (
                  <Share2 className="w-3.5 h-3.5 inline text-blue-400 mx-0.5" />
                  ) at the bottom bar of Safari.
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold shrink-0">
                  2
                </div>
                <div>
                  Scroll down and tap <strong className="text-white">Add to Home Screen</strong> (
                  <PlusSquare className="w-3.5 h-3.5 inline text-purple-400 mx-0.5" />
                  ).
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-2.5 rounded-xl gradient-brand text-white font-bold text-xs shadow-md"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
