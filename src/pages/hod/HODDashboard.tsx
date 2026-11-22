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
  ChevronDown,
  FileSpreadsheet,
  BookOpen,
  Building2,
  Clock,
  ClipboardList,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

interface HODDashboardProps {
  onNavigateTab: (tab: string) => void;
}

const HOD_COURSES = [
  'Department Administrative Council (CSE)',
  'Board of Studies (BOS) Academic Curriculum 2026-27',
  'NAAC / NBA Accreditation & Program Outcome Review',
  'Autonomous Examination Oversight Committee',
];

export const HODDashboard: React.FC<HODDashboardProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<HODDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchMentorQuery, setSearchMentorQuery] = useState('');
  const [isRulebookModalOpen, setIsRulebookModalOpen] = useState(false);

  // Timeline Filters
  const [timelineFilter, setTimelineFilter] = useState<'7days' | '30days' | 'all'>('7days');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 antialiased">
      {/* 1. Moodle Greeting Header */}
      <div className="pt-1 pb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#ea580c] tracking-tight flex items-center gap-2">
          <span>Welcome back, {stats.hod?.name || user?.name || 'Department Head'}!</span>
          <span>👋</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {departmentName} &bull; Department Code: <span className="font-mono font-bold text-slate-700">{departmentCode}</span>
        </p>
      </div>

      {/* 2. Moodle Card 1: Timeline (Department Action Items) */}
      <section className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#ea580c]">
          Timeline{' '}
          <span className="text-xs font-normal text-slate-500">
            (Department Academic Oversight)
          </span>
        </h2>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs text-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 flex items-center gap-1.5 font-medium transition cursor-pointer"
              >
                <span>
                  {timelineFilter === '7days'
                    ? 'Next 7 days'
                    : timelineFilter === '30days'
                    ? 'Next 30 days'
                    : 'All events'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isFilterDropdownOpen && (
                <div className="absolute left-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 text-xs">
                  <button
                    onClick={() => {
                      setTimelineFilter('7days');
                      setIsFilterDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 transition"
                  >
                    Next 7 days
                  </button>
                  <button
                    onClick={() => {
                      setTimelineFilter('30days');
                      setIsFilterDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 transition"
                  >
                    Next 30 days
                  </button>
                  <button
                    onClick={() => {
                      setTimelineFilter('all');
                      setIsFilterDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 transition"
                  >
                    All events
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="relative sm:w-72">
            <input
              type="text"
              placeholder="Search faculty mentor or department task"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#8eb86e] focus:ring-1 focus:ring-[#8eb86e] transition"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="pt-2">
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 stroke-1" />
            </div>
            <p className="text-sm font-medium text-slate-700">Department activities in good standing</p>
            <p className="text-xs text-slate-400">
              No pending faculty allocation or regulatory approval requests requiring urgent sign-off.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Moodle Card 2: Department Courses & Executive Module */}
      <section className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
        <h2 className="text-lg font-bold text-[#ea580c]">
          Department Portals & Academic Management
        </h2>

        <div className="space-y-2 text-xs sm:text-sm text-slate-800">
          {HOD_COURSES.map((courseName) => (
            <div
              key={courseName}
              className="py-1.5 flex items-center gap-2.5 hover:text-[#5c873f] transition cursor-pointer group"
            >
              <GraduationCap className="w-4 h-4 text-[#5c873f] shrink-0 group-hover:scale-110 transition" />
              <span className="font-normal group-hover:underline text-slate-700">
                {courseName}
              </span>
            </div>
          ))}

          {/* Integrated AICTE Department Module inside My courses */}
          <div className="mt-4 pt-4 border-t border-slate-200/90">
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50/70 via-slate-50 to-white border border-[#8eb86e]/40 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#8eb86e]/20 text-[#5c873f] flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 className="w-6 h-6 text-[#5c873f]" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        AICTE Activity Points Cohort & Accreditation System
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8eb86e]/25 text-[#426b27]">
                        Accreditation Ready
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Department Cohort:{' '}
                      <span className="font-bold text-slate-900 font-mono">
                        {stats.total_students} Students
                      </span>{' '}
                      &bull; Mentors:{' '}
                      <span className="font-bold text-slate-900 font-mono">
                        {stats.total_mentors} Faculty
                      </span>{' '}
                      &bull; Clearance Rate:{' '}
                      <span className="font-bold text-emerald-700 font-mono">
                        {stats.clearance_rate || 88}%
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => onNavigateTab('coordinator-master-sheet')}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                    title="Export Logisys ERP & Google Sheet"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Coordinator Master Sheet</span>
                  </button>

                  <button
                    onClick={() => setIsRulebookModalOpen(true)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs transition cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-slate-500 inline mr-1" />
                    <span>Rulebook</span>
                  </button>

                  <button
                    onClick={() => onNavigateTab('student-mentor-allocation')}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs transition cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-slate-500 inline mr-1" />
                    <span>Allocations</span>
                  </button>

                  <button
                    onClick={() => onNavigateTab('schema-manager')}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-[#426b27] border border-emerald-200 transition cursor-pointer"
                  >
                    Schema ➔
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            className="text-xs font-semibold text-[#5c873f] hover:underline cursor-pointer"
          >
            All department courses & committees ...
          </button>
        </div>
      </section>

      {/* 4. Moodle Card 3: Faculty Mentors Performance Roster */}
      <section className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#ea580c]">
              Faculty Mentors Oversight
            </h2>
            <p className="text-xs text-slate-500">
              Department mentorship workload and student certificate verification status.
            </p>
          </div>

          <div className="relative sm:w-64">
            <input
              type="text"
              value={searchMentorQuery}
              onChange={(e) => setSearchMentorQuery(e.target.value)}
              placeholder="Search mentor name..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#8eb86e] focus:ring-1 focus:ring-[#8eb86e] transition"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Faculty Mentor</th>
                <th className="py-2.5 px-3">Assigned Students</th>
                <th className="py-2.5 px-3">Pending Reviews</th>
                <th className="py-2.5 px-3">Avg Mentee Points</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMentors.map((m) => (
                <tr key={m.mentor_id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    Prof. {m.mentor_name}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold">{m.mentee_count}</td>
                  <td className="py-2.5 px-3">
                    {m.pending_reviews > 0 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        {m.pending_reviews} Awaiting
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        All Cleared
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                    {m.avg_points || 0} / 200
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onNavigateTab('mentor-requests-queue')}
                      className="text-xs text-[#5c873f] font-semibold hover:underline cursor-pointer"
                    >
                      Audit ➔
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Rulebook Modal */}
      {isRulebookModalOpen && (
        <RulebookManagerModal
          isOpen={isRulebookModalOpen}
          onClose={() => setIsRulebookModalOpen(false)}
        />
      )}
    </div>
  );
};
