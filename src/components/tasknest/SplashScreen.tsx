import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { M3_TOKENS } from '../../theme/tokens';

interface SplashScreenProps {
  onLoaded: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onLoaded }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onLoaded();
    }, 1400);
    return () => clearTimeout(timer);
  }, [onLoaded]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-8 select-none transition-opacity duration-300"
      style={{ backgroundColor: M3_TOKENS.colors.colorSurface }}
    >
      {/* Centered content at approx 40% height */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-16">
        {/* App Logo - 96dp x 96dp */}
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-lg transition-transform duration-500 scale-100 hover:scale-105"
          style={{
            backgroundColor: M3_TOKENS.colors.colorPrimary,
            boxShadow: '0 8px 24px rgba(103, 80, 164, 0.25)',
          }}
        >
          <CheckCircle2 className="w-14 h-14 text-white stroke-[2.2]" />
        </div>

        {/* App Name - 28sp SemiBold, tracking -0.5px */}
        <h1
          className="mt-6 text-[28px] font-semibold tracking-[-0.5px]"
          style={{ color: M3_TOKENS.colors.colorPrimary }}
        >
          TaskNest
        </h1>

        {/* Tagline */}
        <p className="mt-2 text-sm text-slate-500 font-medium">
          Plan it. Nest it. Get it done.
        </p>
      </div>

      {/* Bottom Loader & Hint - 32dp above bottom */}
      <div className="flex flex-col items-center pb-8 gap-3">
        <div
          className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin"
          style={{
            borderColor: `${M3_TOKENS.colors.colorPrimary} transparent transparent transparent`,
          }}
        />
        <p className="text-xs text-slate-500 font-medium tracking-wide">
          Loading your tasks...
        </p>
      </div>
    </div>
  );
};
