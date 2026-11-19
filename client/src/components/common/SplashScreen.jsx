import React, { useState, useEffect } from 'react';

/**
 * Premium CampusSplit Splash Screen
 * Features brand monogram, glowing ambient halo, dynamic progress bar,
 * and a 60fps hardware-accelerated fade-out transition.
 */
export default function SplashScreen({ isReady = true, minDuration = 1000, onFinished }) {
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Starting CampusSplit...');
  const [isFading, setIsFading] = useState(false);
  const [canExit, setCanExit] = useState(false);

  // Minimum display timer so users get a clean, reassuring brand launch experience
  useEffect(() => {
    const minTimer = setTimeout(() => {
      setCanExit(true);
    }, minDuration);

    // Progress bar animation steps
    const step1 = setTimeout(() => {
      setProgress(55);
      setStatusText('Syncing campus groups & balances...');
    }, 350);

    const step2 = setTimeout(() => {
      setProgress(88);
      setStatusText('Preparing debt simplification...');
    }, 700);

    return () => {
      clearTimeout(minTimer);
      clearTimeout(step1);
      clearTimeout(step2);
    };
  }, [minDuration]);

  // When both isReady and canExit are fulfilled, trigger smooth exit
  useEffect(() => {
    if (isReady && canExit) {
      setProgress(100);
      setStatusText('Ready!');
      
      const fadeTimer = setTimeout(() => {
        setIsFading(true);
      }, 150);

      const finishTimer = setTimeout(() => {
        if (onFinished) onFinished();
      }, 600);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(finishTimer);
      };
    }
  }, [isReady, canExit, onFinished]);

  return (
    <div
      aria-label="CampusSplit Loading Screen"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between p-6 sm:p-10 select-none bg-[#F7F7FC] dark:bg-[#17172B] text-[#17172B] dark:text-white transition-all duration-500 ease-out ${
        isFading ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#6654D9]/15 dark:bg-[#6654D9]/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-72 h-72 bg-[#917FF2]/10 dark:bg-[#917FF2]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top spacing / Brand security indicator */}
      <div className="w-full flex items-center justify-between max-w-sm pt-2">
        <span className="text-[11px] font-bold tracking-wider uppercase text-[#7E7D9C] dark:text-[#A5A4BF]/80 bg-white/60 dark:bg-[#21213E]/80 backdrop-blur-md px-3 py-1 rounded-full border border-purple-500/10">
          Campus Network
        </span>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Live Sync</span>
        </div>
      </div>

      {/* Center Brand Monogram & Motion Content */}
      <div className="flex flex-col items-center text-center my-auto">
        {/* Monogram Box with Radial Glowing Pulse */}
        <div className="relative mb-6">
          {/* Pulsing Outer Halo */}
          <div className="absolute -inset-2.5 rounded-3xl bg-gradient-to-r from-[#6654D9] to-[#917FF2] opacity-40 blur-lg animate-pulse" />
          
          {/* Main Monogram Icon */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-[#6654D9] via-[#7B69E8] to-[#917FF2] p-3.5 sm:p-4 flex items-center justify-center shadow-2xl shadow-[#6654D9]/50 border border-white/20 transform transition-transform duration-300 hover:scale-105">
            {/* Subtle inner highlight */}
            <div className="absolute inset-0 bg-white/10 rounded-3xl pointer-events-none" />
            
            {/* CampusSplit Monogram SVG */}
            <svg
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full text-white drop-shadow-md"
            >
              {/* Top Arc (Campus Node C) */}
              <path
                d="M23 10.5C21.6 7.8 18.5 6 15 6C9.5 6 5 10.5 5 16C5 18.2 5.7 20.2 6.9 21.8"
                stroke="currentColor"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              {/* Bottom Arc (Split Node S) */}
              <path
                d="M9 21.5C10.4 24.2 13.5 26 17 26C22.5 26 27 21.5 27 16C27 13.8 26.3 11.8 25.1 10.2"
                stroke="currentColor"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              {/* Center Dividing Split Prism */}
              <circle cx="16" cy="16" r="3.2" fill="#DCD6FF" />
              <path
                d="M11 21L21 11"
                stroke="#DCD6FF"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Wordmark Title */}
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-baseline justify-center mb-1.5">
          <span className="text-[#17172B] dark:text-white">Campus</span>
          <span className="bg-gradient-to-r from-[#6654D9] to-[#917FF2] bg-clip-text text-transparent">Split</span>
          <span className="w-2 h-2 rounded-full bg-[#6654D9] ml-1 self-end mb-1" />
        </h1>

        {/* Brand Tagline */}
        <p className="text-sm sm:text-base font-semibold text-[#7E7D9C] dark:text-[#A5A4BF] mb-7">
          Spend Together, Split Smartly
        </p>

        {/* Sleek Animated Progress Bar */}
        <div className="w-48 sm:w-56 h-1.5 bg-[#EAE9F5] dark:bg-[#21213E] rounded-full overflow-hidden shadow-inner mb-3">
          <div
            className="h-full bg-gradient-to-r from-[#6654D9] via-[#917FF2] to-[#DCD6FF] rounded-full transition-all duration-300 ease-out shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status Text */}
        <p className="text-xs font-medium text-[#7E7D9C] dark:text-[#A5A4BF] transition-all duration-200">
          {statusText}
        </p>
      </div>

      {/* Footer Branding & Trust Badge */}
      <div className="flex flex-col items-center gap-1 pb-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#7E7D9C] dark:text-[#A5A4BF]">
          <span>🎓 Fast & Fair College Splits</span>
          <span>•</span>
          <span>Instant UPI Settle</span>
        </div>
        <p className="text-[11px] text-[#7E7D9C]/70 dark:text-[#A5A4BF]/60">
          v1.0 • Built for College Students
        </p>
      </div>
    </div>
  );
}
