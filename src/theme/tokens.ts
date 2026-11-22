/**
 * Material Design 3 (M3) Semantic Tokens for TaskNest
 * Extracted and strictly aligned with UI.md Specification
 */

export const M3_TOKENS = {
  colors: {
    colorPrimary: '#6750A4',
    colorPrimaryDark: '#D0BCFF',
    colorSurface: '#FEF7FF',
    colorSurfaceDark: '#141218',
    colorSurfaceContainer: '#F3EDF7',
    colorSurfaceContainerDark: '#211F26',
    stroke: '#CAC4D0',
    colorError: '#BA1A1A',
    colorErrorLight: '#FFB4AB',
    
    // Priority Badges
    priority: {
      HIGH: {
        bg: '#FFDAD6',
        text: '#410002',
        border: '#F9B9B3',
        label: 'HIGH',
      },
      MEDIUM: {
        bg: '#FFDCC2',
        text: '#2E1500',
        border: '#F5BE98',
        label: 'MEDIUM',
      },
      LOW: {
        bg: '#C8E6C9',
        text: '#00390F',
        border: '#A5D6A7',
        label: 'LOW',
      },
    },

    // Category Pill Tag
    category: {
      bg: '#E7E0EC',
      text: '#49454F',
    },

    // Completed State
    completed: {
      bg: '#E0E0E0',
      text: '#757575',
      strikeAlpha: 0.6,
    },
  },

  geometry: {
    cardRadius: '16px',
    chipRadius: '8px',
    fabRadius: '16px',
    buttonRadius: '12px',
    fabSize: '56px',
    chipHeight: '32px',
    buttonHeight: '48px',
  },
} as const;

export type TaskCategory = 'Work' | 'Personal' | 'Study';
export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  due_at: string;
  category: TaskCategory;
  priority: TaskPriority;
  reminder_on: number | boolean;
  reminder_offset: number;
  is_completed: number | boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskMetrics {
  total: number;
  pending: number;
  completed: number;
  completion_rate: number;
}
