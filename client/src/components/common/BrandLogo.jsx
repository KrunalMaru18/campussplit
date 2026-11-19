import React from 'react';

/**
 * Original CampusSplit Brand Logo & Monogram
 * A custom geometric glyph featuring interlocking split nodes (C + S)
 * symbolizing smart group expense sharing for students.
 */
export default function BrandLogo({ size = 'md', showText = true, className = '' }) {
  const iconSizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14',
  };

  const textSizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Original Monogram SVG Glyph */}
      <div
        className={`${iconSizes[size] || iconSizes.md} rounded-xl bg-gradient-to-tr from-[#6654D9] via-[#7B69E8] to-[#917FF2] p-1.5 flex items-center justify-center shadow-md shadow-[#6654D9]/25 shrink-0 relative overflow-hidden transition-transform duration-200 hover:scale-105`}
      >
        {/* Subtle inner highlight */}
        <div className="absolute inset-0 bg-white/10 rounded-xl pointer-events-none" />
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-white"
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

      {/* Brand Wordmark */}
      {showText && (
        <div className="flex items-baseline leading-none select-none">
          <span
            className={`${textSizes[size] || textSizes.md} font-black tracking-tight text-[#17172B] dark:text-white`}
          >
            Campus
          </span>
          <span
            className={`${textSizes[size] || textSizes.md} font-black tracking-tight text-[#6654D9] dark:text-[#917FF2] ml-0.5`}
          >
            Split
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#917FF2] ml-1 self-end mb-1"></span>
        </div>
      )}
    </div>
  );
}
