import React from 'react';

interface BadgeProps {
  variant?: 'emerald' | 'amber' | 'red' | 'rose' | 'indigo' | 'blue' | 'navy' | 'purple' | 'slate' | 'bronze' | 'gold';
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'slate',
  children,
  className = '',
  dot = false,
}) => {
  const styles: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    rose: 'bg-red-50 text-red-700 border-red-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    navy: 'bg-blue-950/10 text-blue-900 border-blue-900/20',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    bronze: 'bg-amber-100 text-amber-900 border-amber-300',
    gold: 'bg-amber-50 text-amber-800 border-amber-300',
  };

  const dotColors: Record<string, string> = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    rose: 'bg-red-500',
    indigo: 'bg-indigo-500',
    navy: 'bg-blue-900',
    blue: 'bg-blue-500',
    purple: 'bg-indigo-500',
    slate: 'bg-slate-500',
    bronze: 'bg-amber-700',
    gold: 'bg-amber-500',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border whitespace-nowrap tracking-tight ${
        styles[variant] || styles.slate
      } ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || 'bg-slate-400'}`} />}
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: 'approved' | 'pending' | 'rejected' | string; className?: string }> = ({
  status,
  className = '',
}) => {
  const norm = status?.toLowerCase();
  if (norm === 'approved') {
    return <Badge variant="emerald" dot className={className}>Approved</Badge>;
  }
  if (norm === 'pending') {
    return <Badge variant="amber" dot className={className}>Pending Review</Badge>;
  }
  if (norm === 'rejected') {
    return <Badge variant="red" dot className={className}>Rejected</Badge>;
  }
  return <Badge variant="slate" className={className}>{status}</Badge>;
};

export const RoleBadge: React.FC<{ role: string; className?: string }> = ({ role, className = '' }) => {
  const norm = role?.toLowerCase();
  if (norm === 'hod') {
    return <Badge variant="indigo" className={className}>HOD Oversight</Badge>;
  }
  if (norm === 'mentor') {
    return <Badge variant="indigo" className={className}>Faculty Mentor</Badge>;
  }
  return <Badge variant="blue" className={className}>Student Portal</Badge>;
};

export const MilestoneBadge: React.FC<{ tier: string; className?: string }> = ({ tier, className = '' }) => {
  switch (tier?.toLowerCase()) {
    case 'diamond':
      return <Badge variant="indigo" className={className}>Diamond Tier (200 pts)</Badge>;
    case 'gold':
      return <Badge variant="gold" className={className}>Gold Tier (150 pts)</Badge>;
    case 'silver':
      return <Badge variant="slate" className={className}>Silver Tier (100 pts)</Badge>;
    case 'bronze':
      return <Badge variant="bronze" className={className}>Bronze Tier (50 pts)</Badge>;
    default:
      return <Badge variant="slate" className={className}>Getting Started</Badge>;
  }
};
