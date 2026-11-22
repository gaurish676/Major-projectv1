import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { HODDashboardStats } from '../../types';
import { apiRequest } from '../../lib/api';
import { DashboardSkeleton } from '../../components/common/SkeletonLoaders';
import { RulebookManagerModal } from './RulebookManagerModal';
import {
  Users,
  GraduationCap,
  TrendingUp,
  CheckCircle2,
  Search,
  ChevronRight,
  FileSpreadsheet,
  BookOpen,
} from 'lucide-react';

interface HODDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const HODDashboard: React.FC<HODDashboardProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<HODDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchMentorQuery, setSearchMentorQuery] = useState('');
  const [isRulebookModalOpen, setIsRulebookModalOpen] = useState(false);

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
    return <DashboardSkeleton />;
  }

  const departmentCode = stats.hod?.department_code || stats.hod?.department_id || 'CSE';
  const departmentName = stats.hod?.department_name || 'Computer Science & Engineering';
  const mentorsPerformance = stats.mentors_performance || [];

  const filteredMentors = mentorsPerformance.filter((m) => {
    if (!searchMentorQuery.trim()) return true;
    return m.mentor_name.toLowerCase().includes(searchMentorQuery.toLowerCase());
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 1. Calm, Focused Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#8eb86e]/15 text-[#426b27] border border-[#8eb86e]/30">
              Department Executive Hub
            </span>
            <span className="text-xs text-slate-500 font-medium">Department Code: {departmentCode}</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Welcome, {stats.hod?.name || user?.name || 'Department Head'}!
          </h1>

          <p className="text-xs text-slate-600">
            {departmentName} • Oversee faculty mentorship, track student activity points, and assess graduation clearance.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigateTab('hod-coordinator-export')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-2 transition cursor-pointer"
            title="Open Master Assessment Sheet & ERP Export"
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            <span>Coordinator Master Sheet</span>
          </button>

          <button
            onClick={() => setIsRulebookModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs flex items-center gap-2 transition cursor-pointer"
            title="Upload circular or configure guidelines"
          >
            <BookOpen className="w-4 h-4 text-slate-500" />
            <span>Rulebook Guidelines</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Clean KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Enrolled Students
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {stats.total_students}
          </div>
          <p className="text-xs text-slate-400">Total department cohort</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Faculty Mentors
          </div>
          <div className="text-2xl font-bold text-purple-600 font-mono">
            {stats.total_mentors}
          </div>
          <p className="text-xs text-slate-400">Active student advisors</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Department Average
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">
            {stats.avg_department_points} <span className="text-xs text-slate-400 font-normal">/ 200 pts</span>
          </div>
          <p className="text-xs text-slate-400">Average points per student</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Clearance Rate
          </div>
          <div className="text-2xl font-bold text-indigo-600 font-mono">
            {stats.target_completion_rate}%
          </div>
          <p className="text-xs text-slate-400">Achieved 200 graduation goal</p>
        </div>
      </div>

      {/* 3. Faculty Mentors & Student Workload Table */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Department Faculty Mentors & Workload</span>
            </h2>
            <p className="text-xs text-slate-500">
              Click any mentor to assess all of their assigned students in the Coordinator Master Sheet.
            </p>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search mentor by name..."
              value={searchMentorQuery}
              onChange={(e) => setSearchMentorQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 bg-slate-50 focus:bg-white transition"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Faculty Mentor</th>
                <th className="py-2.5 px-3 text-center">Assigned Students</th>
                <th className="py-2.5 px-3 text-center">Pending Reviews</th>
                <th className="py-2.5 px-3 text-right">Avg Mentee Points</th>
                <th className="py-2.5 px-3 text-center">Assessment Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMentors.map((m) => (
                <tr
                  key={m.mentor_id}
                  onClick={() => {
                    sessionStorage.setItem('selected_coordinator_mentor', m.mentor_name);
                    onNavigateTab('hod-coordinator-export');
                  }}
                  className="hover:bg-indigo-50/30 transition cursor-pointer group"
                  title={`Assess all students of ${m.mentor_name}`}
                >
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-indigo-600 transition">
                      {m.mentor_name}
                    </div>
                    <div className="text-[11px] text-slate-400">Faculty Advisor</div>
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span className="font-bold font-mono text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg text-xs">
                      {m.mentee_count} students
                    </span>
                  </td>

                  <td className="py-3 px-3 text-center">
                    {m.pending_reviews > 0 ? (
                      <span className="font-bold font-mono text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-xs">
                        {m.pending_reviews} pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg font-semibold text-xs border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>All Reviewed</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-right">
                    <span className="font-bold font-mono text-indigo-600 text-xs sm:text-sm">
                      {m.avg_mentee_points} pts
                    </span>
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 group-hover:text-emerald-900 group-hover:underline">
                      <span>Assess Students</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* University Rulebook Modal */}
      <RulebookManagerModal
        isOpen={isRulebookModalOpen}
        onClose={() => setIsRulebookModalOpen(false)}
        onRulebookUpdated={loadDashboard}
      />
    </div>
  );
};
