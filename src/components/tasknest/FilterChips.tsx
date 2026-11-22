import React from 'react';
import { M3_TOKENS } from '../../theme/tokens';

export type FilterType = 'all' | 'today' | 'upcoming' | 'completed';

interface FilterChipsProps {
  activeFilter: FilterType;
  onSelectFilter: (filter: FilterType) => void;
  counts?: {
    all: number;
    today: number;
    upcoming: number;
    completed: number;
  };
}

const CHIPS: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
];

export const FilterChips: React.FC<FilterChipsProps> = ({
  activeFilter,
  onSelectFilter,
  counts,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none no-scrollbar">
      {CHIPS.map((chip) => {
        const isActive = activeFilter === chip.id;
        const count = counts ? counts[chip.id] : undefined;

        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onSelectFilter(chip.id)}
            className="shrink-0 h-[32px] px-3.5 rounded-[8px] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            style={{
              backgroundColor: isActive
                ? M3_TOKENS.colors.colorPrimary
                : M3_TOKENS.colors.category.bg,
              color: isActive ? '#FFFFFF' : M3_TOKENS.colors.category.text,
              boxShadow: isActive ? '0 2px 6px rgba(103, 80, 164, 0.25)' : 'none',
            }}
          >
            <span>{chip.label}</span>
            {count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-300/60 text-slate-700'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
