import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export interface LoadingEventData {
  activeRequests: number;
  isLoading: boolean;
  lastEndpoint?: string;
  lastLatencyMs?: number;
  lastSyncedAt?: Date;
}

interface LoadingContextType {
  isLoading: boolean;
  activeRequests: number;
  elapsedSeconds: number;
  lastLatencyMs: number | null;
  lastSyncedAt: Date | null;
  startManualLoading: (label?: string) => void;
  stopManualLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  activeRequests: 0,
  elapsedSeconds: 0,
  lastLatencyMs: null,
  lastSyncedAt: null,
  startManualLoading: () => {},
  stopManualLoading: () => {},
});

// Global subscriber bus for non-React network calls (e.g. apiRequest in api.ts)
type Listener = (data: LoadingEventData) => void;
const listeners = new Set<Listener>();

export const notifyLoadingListeners = (data: LoadingEventData) => {
  listeners.forEach((listener) => {
    try {
      listener(data);
    } catch (err) {
      console.error('Error in loading listener:', err);
    }
  });
};

export const subscribeToLoading = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRequests, setActiveRequests] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(48); // default seed latency
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(new Date());
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    startTimeRef.current = performance.now();
    setElapsedSeconds(0);
    timerRef.current = window.setInterval(() => {
      if (startTimeRef.current) {
        const diff = (performance.now() - startTimeRef.current) / 1000;
        setElapsedSeconds(Number(diff.toFixed(1)));
      }
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    startTimeRef.current = null;
  }, []);

  // Listen for global apiRequest events
  useEffect(() => {
    const unsubscribe = subscribeToLoading((data) => {
      setActiveRequests(data.activeRequests);
      if (data.lastLatencyMs !== undefined) {
        setLastLatencyMs(data.lastLatencyMs);
      }
      if (data.lastSyncedAt) {
        setLastSyncedAt(data.lastSyncedAt);
      }

      if (data.activeRequests > 0) {
        startTimer();
      } else {
        stopTimer();
      }
    });

    return () => {
      unsubscribe();
      stopTimer();
    };
  }, [startTimer, stopTimer]);

  const startManualLoading = useCallback(() => {
    setActiveRequests((prev) => {
      const next = prev + 1;
      if (next === 1) startTimer();
      return next;
    });
  }, [startTimer]);

  const stopManualLoading = useCallback(() => {
    setActiveRequests((prev) => {
      const next = Math.max(0, prev - 1);
      if (next === 0) {
        stopTimer();
        setLastSyncedAt(new Date());
      }
      return next;
    });
  }, [stopTimer]);

  const isLoading = activeRequests > 0;

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        activeRequests,
        elapsedSeconds,
        lastLatencyMs,
        lastSyncedAt,
        startManualLoading,
        stopManualLoading,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);
