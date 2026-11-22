import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import {
  Briefcase,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Send,
  Building,
  TrendingUp,
  Award,
  Filter,
  Sparkles,
  ChevronRight,
  Clock,
  GraduationCap,
} from 'lucide-react';

interface PlacementDrive {
  id: string;
  company_name: string;
  role_title: string;
  package_lpa: number;
  min_cgpa: number;
  min_activity_points: number;
  min_tenth_percentage?: number;
  min_twelfth_percentage?: number;
  drive_date: string;
  is_active: number;
}

interface CompanyStatus {
  company_id: string;
  company_name: string;
  role_title: string;
  package_lpa: number;
  min_cgpa?: number;
  min_activity_points?: number;
  min_tenth_percentage?: number;
  min_twelfth_percentage?: number;
  is_eligible: boolean;
  cgpa_eligible: boolean;
  points_eligible: boolean;
  tenth_eligible?: boolean;
  twelfth_eligible?: boolean;
  has_prior_marks?: boolean;
  backlogs_eligible?: boolean;
  active_backlogs?: number;
  missing_points: number;
  missing_cgpa: number;
  missing_tenth?: number;
  missing_twelfth?: number;
  status_label: 'Eligible' | 'Short of Points' | 'Short of CGPA' | 'Short of 10th/12th' | 'Critical Deficit' | 'Backlog Ineligible' | 'Missing 10th/12th Marks';
}

interface MenteeEligibility {
  student_id: string;
  student_name: string;
  student_roll_no: string;
  cgpa: number;
  approved_points: number;
  semester: number;
  tenth_percentage?: number | null;
  tenth_board?: string | null;
  tenth_year?: number | null;
  twelfth_percentage?: number | null;
  twelfth_board?: string | null;
  twelfth_year?: number | null;
  diploma_or_pu?: string | null;
  company_status: CompanyStatus[];
}

interface PlacementEligibilityResponse {
  drives: PlacementDrive[];
  mentees_eligibility: MenteeEligibility[];
  total_mentees: number;
}

export const MentorPlacementEligibility: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<PlacementEligibilityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState<'all' | '1' | '2' | '3' | '4'>('all');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'eligible' | 'deficit' | 'missing-marks'>('all');
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const fetchPlacementData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiRequest<PlacementEligibilityResponse>('/api/placement/mentor-eligibility');
      setData(res);
    } catch (err: any) {
      console.error('Failed to load mentor placement matrix:', err);
      setError(err.message || 'Failed to load placement matrix');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlacementData();
  }, [user]);

  const handleSendReminder = async (
    studentId: string,
    companyName: string,
    missingPoints: number,
    packageLpa: number,
    reminderType: 'points' | 'prior_marks' = 'points'
  ) => {
    try {
      setSendingReminderId(`${studentId}_${companyName}_${reminderType}`);
      await apiRequest('/api/placement/remind-mentee', {
        method: 'POST',
        body: JSON.stringify({
          student_id: studentId,
          company_name: companyName,
          missing_points: missingPoints,
          package_lpa: packageLpa,
          reminder_type: reminderType,
        }),
      });

      setNotificationMsg(
        reminderType === 'prior_marks'
          ? `Dispatched urgent reminder to mentee to submit 10th & 12th marks!`
          : `Placement reminder sent to student for ${companyName}!`
      );
      setTimeout(() => setNotificationMsg(null), 3500);
    } catch (err: any) {
      setNotificationMsg(err.message || 'Failed to send reminder notification');
      setTimeout(() => setNotificationMsg(null), 3500);
    } finally {
      setSendingReminderId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Loading campus placement eligibility matrix...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-bold text-lg">
          !
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">Failed to Load Placement Matrix</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">{error || 'Unknown error occurred while connecting to server.'}</p>
        </div>
        <button
          type="button"
          onClick={fetchPlacementData}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { drives, mentees_eligibility } = data;

  const yearCounts = {
    all: mentees_eligibility.length,
    1: mentees_eligibility.filter((m) => Math.ceil((m.semester || 6) / 2) === 1).length,
    2: mentees_eligibility.filter((m) => Math.ceil((m.semester || 6) / 2) === 2).length,
    3: mentees_eligibility.filter((m) => Math.ceil((m.semester || 6) / 2) === 3).length,
    4: mentees_eligibility.filter((m) => Math.ceil((m.semester || 6) / 2) === 4).length,
  };

  const filteredMentees = mentees_eligibility.filter((m) => {
    const studentYear = Math.ceil((m.semester || 6) / 2);
    if (selectedYearFilter !== 'all' && studentYear !== Number(selectedYearFilter)) {
      return false;
    }

    const q = searchQuery.toLowerCase().trim();
    const matchesYear =
      (q === '1' || q === 'y1' || q === 'year 1' || q === '1st year' || q === '1st yr') && studentYear === 1 ||
      (q === '2' || q === 'y2' || q === 'year 2' || q === '2nd year' || q === '2nd yr') && studentYear === 2 ||
      (q === '3' || q === 'y3' || q === 'year 3' || q === '3rd year' || q === '3rd yr') && studentYear === 3 ||
      (q === '4' || q === 'y4' || q === 'year 4' || q === '4th year' || q === '4th yr') && studentYear === 4 ||
      (q.includes('sem') && String(m.semester || '').includes(q.replace(/[^0-9]/g, ''))) ||
      `year ${studentYear}`.includes(q) ||
      `${studentYear}st year`.includes(q) ||
      `${studentYear}nd year`.includes(q) ||
      `${studentYear}rd year`.includes(q) ||
      `${studentYear}th year`.includes(q);

    const matchesSearch =
      !q ||
      (m.student_name || '').toLowerCase().includes(q) ||
      (m.student_roll_no || '').toLowerCase().includes(q) ||
      matchesYear;

    if (!matchesSearch) return false;

    if (statusFilter === 'missing-marks') {
      const hasMissing = m.tenth_percentage == null || m.twelfth_percentage == null;
      if (!hasMissing) return false;
    }

    if (selectedCompanyFilter !== 'all') {
      const compStatus = m.company_status.find((c) => c.company_id === selectedCompanyFilter);
      if (statusFilter === 'eligible' && !compStatus?.is_eligible) return false;
      if (statusFilter === 'deficit' && compStatus?.is_eligible) return false;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* 1. Header Banner */}
      <div className="bg-[#0B1329] rounded-2xl p-4 sm:p-5 text-white border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Training & Placement Advisory
            </span>
            <span className="text-xs text-slate-400">Department of Computer Science & Engineering</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-emerald-400" />
            <span>Placement Cutoffs & Mentee Eligibility Matrix</span>
          </h1>

          <p className="text-xs text-slate-300">
            Advisory tool for faculty mentors: Monitor which students meet corporate cutoffs (CGPA + AICTE Activity Points) and dispatch point deficit reminders.
          </p>
        </div>

        {/* Quick summary pill */}
        <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700 text-xs flex items-center gap-3 shrink-0">
          <div className="text-center">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Active Drives</span>
            <span className="text-base font-extrabold text-white font-mono">{drives.length}</span>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div className="text-center">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Mentees Tracked</span>
            <span className="text-base font-extrabold text-emerald-400 font-mono">{mentees_eligibility.length}</span>
          </div>
        </div>
      </div>

      {notificationMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* 2. Active Campus Placement Drives Carousel / Cards */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" />
            <span>Corporate Cutoff Criteria (CGPA & Activity Points)</span>
          </h2>
          <span className="text-xs text-slate-500">Autonomous Tier-1 Campus Hiring</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {drives.map((drv) => {
            const isSelected = selectedCompanyFilter === drv.id;
            return (
              <div
                key={drv.id}
                onClick={() => setSelectedCompanyFilter(isSelected ? 'all' : drv.id)}
                className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? 'ring-2 ring-emerald-500 bg-emerald-50/60 border-emerald-300'
                    : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate">{drv.company_name}</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                      {drv.package_lpa} LPA
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate">{drv.role_title}</p>
                </div>

                <div className="pt-1 border-t border-slate-200/80 space-y-0.5 text-[10px] font-medium text-slate-600">
                  <div className="flex justify-between">
                    <span>Min CGPA:</span>
                    <strong className="text-slate-900 font-mono">{drv.min_cgpa}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Activity Pts:</span>
                    <strong className="text-indigo-700 font-mono">{drv.min_activity_points} pts</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>10th / 12th:</span>
                    <strong className="text-purple-700 font-mono">{drv.min_tenth_percentage || 60}% / {drv.min_twelfth_percentage || 60}%</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Mentees Eligibility Table */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span>Mentee Placement Eligibility Matrix</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                {filteredMentees.length} Students
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Students falling short of activity points or CGPA require proactive counseling before company registration closes.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search student, USN, or 'Year 3'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-purple-500 bg-slate-50 focus:bg-white"
              />
            </div>

            {/* Academic Year Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <span className="text-[10px] font-bold text-slate-500 uppercase px-1 flex items-center gap-0.5">
                <GraduationCap className="w-3 h-3 text-purple-600" />
                <span>Yr:</span>
              </span>
              {[
                { id: 'all', label: 'All' },
                { id: '1', label: 'Y1' },
                { id: '2', label: 'Y2' },
                { id: '3', label: 'Y3' },
                { id: '4', label: 'Y4' },
              ].map((yr) => (
                <button
                  key={yr.id}
                  onClick={() => setSelectedYearFilter(yr.id as any)}
                  className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer ${
                    selectedYearFilter === yr.id ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {yr.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('eligible')}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                  statusFilter === 'eligible' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600'
                }`}
              >
                Eligible
              </button>
              <button
                onClick={() => setStatusFilter('deficit')}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                  statusFilter === 'deficit' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600'
                }`}
              >
                Deficit Alert
              </button>
              <button
                onClick={() => setStatusFilter('missing-marks')}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                  statusFilter === 'missing-marks' ? 'bg-purple-600 text-white shadow-2xs' : 'text-slate-600'
                }`}
                title="Filter students who have not yet submitted 10th & 12th marks"
              >
                Missing 10th/12th
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {filteredMentees.map((mentee) => {
            const hasMissingMarks = mentee.tenth_percentage == null || mentee.twelfth_percentage == null;

            return (
              <div
                key={mentee.student_id}
                className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs hover:border-purple-300 transition"
              >
                {/* Mentee Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {mentee.student_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                        <span>{mentee.student_name}</span>
                        {hasMissingMarks && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            10th/12th Pending
                          </span>
                        )}
                      </h3>
                      <div className="text-[11px] text-slate-500 font-mono">
                        USN: {mentee.student_roll_no} • Sem {mentee.semester}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    <div className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold font-mono">
                      CGPA: {mentee.cgpa.toFixed(2)}
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold font-mono">
                      Activity Points: {mentee.approved_points} / 200
                    </div>
                    <div
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${
                        mentee.tenth_percentage != null
                          ? 'bg-purple-50 border-purple-200 text-purple-900'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}
                    >
                      10th: {mentee.tenth_percentage != null ? `${mentee.tenth_percentage}%` : 'Not Set'}
                    </div>
                    <div
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${
                        mentee.twelfth_percentage != null
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}
                    >
                      {mentee.diploma_or_pu === 'diploma' ? 'Diploma' : '12th'}: {mentee.twelfth_percentage != null ? `${mentee.twelfth_percentage}%` : 'Not Set'}
                    </div>
                  </div>
                </div>

                {/* Company Badges Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                  {mentee.company_status.map((comp) => {
                    const isEligible = comp.is_eligible;
                    const missingPts = comp.missing_points;
                    const isMissingMarks = comp.status_label === 'Missing 10th/12th Marks';
                    const isShortOfPointsOnly = !comp.points_eligible && comp.cgpa_eligible && !isMissingMarks && (comp.tenth_eligible !== false) && (comp.twelfth_eligible !== false);

                    return (
                      <div
                        key={comp.company_id}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                          isEligible
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                            : isMissingMarks
                            ? 'bg-purple-50/80 border-purple-200 text-purple-950'
                            : isShortOfPointsOnly
                            ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                            : 'bg-rose-50/60 border-rose-200 text-rose-950'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="font-bold flex items-center gap-1.5 truncate">
                            <span className="truncate">{comp.company_name}</span>
                            <span className="font-mono text-[10px] opacity-75 font-normal shrink-0">({comp.package_lpa} LPA)</span>
                          </div>
                          <div className="text-[10px]">
                            {isEligible ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Eligible for Drive</span>
                              </span>
                            ) : isMissingMarks ? (
                              <span className="text-purple-800 font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-purple-600" />
                                <span>10th/12th marks pending</span>
                              </span>
                            ) : isShortOfPointsOnly ? (
                              <span className="text-amber-800 font-semibold flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Needs +{missingPts} activity pts</span>
                              </span>
                            ) : (
                              <span className="text-rose-700 font-semibold flex items-center gap-1 truncate" title={comp.status_label}>
                                <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                <span className="truncate">{comp.status_label}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Prompt Marks Action if missing prior marks */}
                        {isMissingMarks && (
                          <button
                            onClick={() =>
                              handleSendReminder(
                                mentee.student_id,
                                comp.company_name,
                                0,
                                comp.package_lpa,
                                'prior_marks'
                              )
                            }
                            disabled={sendingReminderId === `${mentee.student_id}_${comp.company_name}_prior_marks`}
                            className="px-2 py-1 rounded text-[10px] font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-2xs transition cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50"
                            title="Prompt student to upload 10th & 12th marks for this drive"
                          >
                            <Send className="w-2.5 h-2.5" />
                            <span>Prompt Marks</span>
                          </button>
                        )}

                        {/* Reminder Action Button if short of points */}
                        {!isEligible && isShortOfPointsOnly && (
                          <button
                            onClick={() =>
                              handleSendReminder(
                                mentee.student_id,
                                comp.company_name,
                                missingPts,
                                comp.package_lpa,
                                'points'
                              )
                            }
                            disabled={sendingReminderId === `${mentee.student_id}_${comp.company_name}_points`}
                            className="px-2 py-1 rounded text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs transition cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50"
                            title="Send notification urging student to submit pending certificates"
                          >
                            <Send className="w-2.5 h-2.5" />
                            <span>Remind</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
