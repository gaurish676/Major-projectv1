import React from 'react';

interface NitteLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  subtitle?: string;
}

export const NitteLogo: React.FC<NitteLogoProps> = ({
  size = 'md',
  className = '',
  onClick,
  subtitle,
}) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${
        onClick ? 'cursor-pointer hover:opacity-95 transition' : ''
      } ${className}`}
      title="Creditz – An Intelligent Co-Curricular Activity Portal"
    >
      {/* Creditz Geometric Emblem with Activity Spark */}
      <div
        className={`relative shrink-0 rounded-xl bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#047857] flex items-center justify-center text-white shadow-md border border-white/20 overflow-hidden ${
          isSm ? 'w-8 h-8' : isLg ? 'w-12 h-12' : 'w-10 h-10'
        }`}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={isSm ? 'w-5 h-5' : isLg ? 'w-7 h-7' : 'w-6 h-6'}
        >
          <defs>
            <linearGradient id="creditzLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
          {/* Modern Geometric 'C' stroke */}
          <path
            d="M23 10.5C21.4 8.3 18.9 7 16 7C11.03 7 7 11.03 7 16C7 20.97 11.03 25 16 25C19.1 25 21.8 23.4 23.3 21"
            stroke="url(#creditzLogoGrad)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* 4-point Activity Credit Spark */}
          <path
            d="M22 13L23.2 15.5L25.7 16.7L23.2 17.9L22 20.4L20.8 17.9L18.3 16.7L20.8 15.5L22 13Z"
            fill="#34d399"
          />
        </svg>
        {/* Subtle glass reflection ring */}
        <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20 pointer-events-none" />
      </div>

      {/* Typography: Project Title & Subtitle */}
      <div className="flex flex-col text-left leading-tight">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span
            className={`font-black tracking-tight text-[#162d6e] ${
              isSm ? 'text-sm' : isLg ? 'text-2xl' : 'text-base sm:text-lg'
            }`}
          >
            Creditz
          </span>
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#8eb86e]/15 text-[#5c873f] border border-[#8eb86e]/30">
            NMAMIT
          </span>
        </div>
        <span
          data-description="an intelligent co-ciricular activity portal"
          className={`text-[#475569] font-medium tracking-tight ${
            isSm ? 'text-[8px]' : isLg ? 'text-xs' : 'text-[9px] sm:text-[10.5px]'
          }`}
        >
          {subtitle || 'an intelligent co-curricular activity portal'}
        </span>
      </div>
    </div>
  );
};

export const CreditzLogo = NitteLogo;
