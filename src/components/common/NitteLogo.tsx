import React from 'react';

interface NitteLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export const NitteLogo: React.FC<NitteLogoProps> = ({ size = 'md', className = '', onClick }) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 sm:gap-3.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* NITTE Shield Emblem */}
      <div
        className={`relative shrink-0 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#1d4ed8] via-[#1e40af] to-[#172554] flex items-center justify-center text-white font-extrabold shadow-sm border border-blue-400/40 ${
          isSm ? 'w-7 h-7 text-sm' : isLg ? 'w-12 h-12 text-2xl' : 'w-9 h-9 sm:w-10 sm:h-10 text-base sm:text-lg'
        }`}
      >
        <span className="tracking-tighter font-serif italic text-white drop-shadow-xs">N</span>
        {/* Subtle accent ring */}
        <span className="absolute inset-0 rounded-lg sm:rounded-xl ring-1 ring-inset ring-white/20 pointer-events-none" />
      </div>

      {/* Institutional Typography */}
      <div className="flex items-center gap-2 sm:gap-3 leading-none">
        <div className="flex flex-col">
          <span
            className={`font-black tracking-tight text-[#162d6e] ${
              isSm ? 'text-xs' : isLg ? 'text-xl' : 'text-sm sm:text-base'
            }`}
          >
            NITTE
          </span>
          <span
            className={`text-[#475569] font-medium tracking-tight ${
              isSm ? 'text-[8px]' : isLg ? 'text-xs' : 'text-[9px] sm:text-[10px]'
            }`}
          >
            (Deemed to be University)
          </span>
        </div>

        {/* Vertical Divider Line */}
        <div
          className={`bg-slate-300 shrink-0 ${
            isSm ? 'h-5 w-[1px]' : isLg ? 'h-10 w-[1.5px]' : 'h-7 sm:h-8 w-[1.5px]'
          }`}
        />

        {/* NMAM Institute of Technology */}
        <div className="flex flex-col">
          <span
            className={`font-extrabold tracking-tight text-[#162d6e] uppercase ${
              isSm ? 'text-[10px]' : isLg ? 'text-base' : 'text-xs sm:text-sm'
            }`}
          >
            NMAM INSTITUTE
          </span>
          <span
            className={`font-extrabold tracking-widest text-[#162d6e] uppercase ${
              isSm ? 'text-[8px]' : isLg ? 'text-xs' : 'text-[9px] sm:text-[10px]'
            }`}
          >
            OF TECHNOLOGY
          </span>
        </div>
      </div>
    </div>
  );
};
