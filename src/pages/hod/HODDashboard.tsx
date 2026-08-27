import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { HODDashboardStats } from '../../types';
import { apiRequest } from '../../lib/api';
import {
  Users,
  GraduationCap,
  TrendingUp,
  Sliders,
  CheckCircle2,
  Layers,
  User as UserIcon,
  ChevronRight,
} from 'lucide-react';

interface HODDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const HODDashboard: React.FC<HODDashboardProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<HODDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest<HODDashboardStats>('/api/hod/dashboard');
      setStats(data);
    } catch (err) {
      console.error('Failed to load HOD dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [user]);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-2.5">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading HOD dashboard...</p>
        </div>
      </div>
    );
  }

  const departmentCode = stats.hod?.department_code || stats.hod?.department_id || 'CSE';
  const departmentName = stats.hod?.department_name || 'Computer Science & Engineering';
  const mentorsPerformance = stats.mentors_performance || [];
  const categoryDistribution = stats.category_distribution || [];

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-xl p-4 sm:p-5 text-white border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Head of Department (HOD)
            </span>
            <span className="text-xs text-slate-400">Department Code: {departmentCode}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('profile')}
              title="Click to view & edit your HOD profile"
              className="text-left group cursor-pointer"
            >
              <h1 className="text-xl sm:text-2xl font-bold text-white group-hover:text-amber-300 transition flex items-center gap-2">
                <span>Welcome, {stats.hod?.name || user?.name || 'Dr. Rajesh Sharma'}</span>
                <span className="text-xs font-normal text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-700/60 group-hover:bg-amber-900 flex items-center gap-1">
                  <UserIcon className="w-3 h-3" />
                  <span>View Profile</span>
                  <ChevronRight className="w-3 h-3 opacity-70" />
                </span>
              </h1>
            </button>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            {departmentName} Overview • Central 200 Activity Points tracking & schema management.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('hod-schema')}
          className="px-4 py-2.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
        >
          <Sliders className="w-4 h-4" />
          <span>Activity Schema Rules</span>
        </button>
      </div>

      {/* 4 Core Department KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Enrolled Students
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {stats.total_students}
          </div>
          <p className="text-[11px] text-slate-500">Total CSE students</p>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Faculty Mentors
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-600 font-mono">
            {stats.total_mentors}
          </div>
          <p className="text-[11px] text-slate-500">Mentoring faculty</p>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Average Points
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">
            {stats.avg_department_points} <span className="text-xs text-slate-400 font-normal">/ 200</span>
          </div>
          <p className="text-[11px] text-slate-500">Student average score</p>
        </div>

        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Completion Rate
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-600 font-mono">
            {stats.target_completion_rate}%
          </div>
          <p className="text-[11px] text-slate-500">Graduation milestone reached</p>
        </div>
      </div>

      {/* Two Column Layout: Faculty Mentors Table & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Faculty Mentors Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Faculty Mentors Summary</span>
              </h2>
              <p className="text-xs text-slate-500">
                Assigned students and pending review status.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Faculty Mentor</th>
                  <th className="py-2.5 px-3 text-center">Assigned Students</th>
                  <th className="py-2.5 px-3 text-center">Pending Reviews</th>
                  <th className="py-2.5 px-3 text-right">Avg Mentee Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mentorsPerformance.map((m) => (
                  <tr key={m.mentor_id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 text-xs">{m.mentor_name}</div>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className="font-bold font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                        {m.mentee_count}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {m.pending_reviews > 0 ? (
                        <span className="font-bold font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                          {m.pending_reviews} pending
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold text-xs">0</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <span className="font-bold font-mono text-indigo-600 text-xs">
                        {m.avg_mentee_points} pts
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Category Distribution (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Category Point Distribution</span>
            </h2>
          </div>

          <div className="space-y-2.5">
            {categoryDistribution.map((cat) => (
              <div key={cat.category_id} className="p-3 rounded-lg border border-slate-200 space-y-1.5 bg-slate-50/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{cat.category_name}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{cat.submissions_count} verified certificates</span>
                  <span className="font-bold font-mono text-indigo-600">
                    {cat.total_points_awarded} pts awarded
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
