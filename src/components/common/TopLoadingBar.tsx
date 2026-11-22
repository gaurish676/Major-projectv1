import React, { useEffect, useState, useRef } from 'react';
import { useLoading } from '../../context/LoadingContext';

export const TopLoadingBar: React.FC = () => {
  const { isLoading, activeRequests, elapsedSeconds } = useLoading();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const fadeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = null;
      }
      setIsVisible(true);
      setProgress((prev) => (prev > 0 && prev < 80 ? prev : 15));

      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 70) return prev + Math.random() * 12 + 5;
          if (prev < 88) return prev + Math.random() * 3 + 1;
          return prev;
        });
      }, 200);

      return () => clearInterval(interval);
    } else {
      // Finished
      setProgress(100);
      fadeTimeoutRef.current = window.setTimeout(() => {
        setIsVisible(false);
        fadeTimeoutRef.current = window.setTimeout(() => {
          setProgress(0);
        }, 200);
      }, 220);
    }
  }, [isLoading]);

  if (!isVisible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[3px] pointer-events-none overflow-hidden transition-opacity duration-300"
      style={{ opacity: isVisible ? 1 : 0 }}
      aria-hidden="true"
    >
      {/* Background Track */}
      <div className="w-full h-full bg-blue-900/10" />

      {/* Synchronized Gradient Bar */}
      <div
        className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 shadow-[0_0_12px_rgba(99,102,241,0.8)] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
        }}
      />

      {/* Subtle pulse flare on leading edge */}
      {isVisible && progress < 100 && (
        <div
          className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-white/50 to-transparent blur-xs -translate-y-0.5 transition-all duration-200"
          style={{ left: `calc(${progress}% - 96px)` }}
        />
      )}
    </div>
  );
};
