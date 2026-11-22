import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Submission } from '../../types';
import { apiRequest } from '../../lib/api';
import { StatusBadge } from '../../components/common/Badge';
import { PDFViewerModal } from '../../components/common/PDFViewerModal';
import { MenteeCollectiveDocsModal } from '../../components/common/MenteeCollectiveDocsModal';
import {
  FileCheck2,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  Sparkles,
  Users,
  Layers,
  ChevronDown,
  ChevronUp,
  CheckCheck,
  Check,
  X,
  Calendar,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  ListFilter,
  GraduationCap,
  Award,
} from 'lucide-react';

interface StudentGroup {
  student_id: string;
  student_name: string;
  student_roll_no: string;
  student_semester: number;
  student_cgpa?: number;
  submissions: Submission[];
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  pendingPoints: number;
  approvedPoints: number;
  totalSemesterPointsClaimed: number;
}

export const ReviewSubmissions: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeFilter, setActiveFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');
  const [isLoading, setIsLoading] = useState(true);

  // Expanded student cards in grouped view (default: true for all)
  const [expandedStudents, setExpandedStudents] = useState<Record<string, boolean>>({});

  // Single-window collective modal state (When clicking mentee name)
  const [collectiveModalStudent, setCollectiveModalStudent] = useState<StudentGroup | null>(null);
  const [isCollectiveModalOpen, setIsCollectiveModalOpen] = useState(false);

  // Evidence Modal state
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [selectedSubmissionsList, setSelectedSubmissionsList] = useState<Submission[]>([]);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Batch action processing & notification states
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Quick reject inline prompt state
  const [rejectPromptSubId, setRejectPromptSubId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadSubmissions = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest<Submission[]>('/api/submissions/assigned');
      setSubmissions(data);

      // Initialize all student cards as expanded by default
      const initialExpanded: Record<string, boolean> = {};
      data.forEach((sub) => {
        if (sub.student_id) {
          initialExpanded[sub.student_id] = true;
        }
      });
      setExpandedStudents((prev) => ({ ...initialExpanded, ...prev }));
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [user]);

  // Standard modal review handler
  const handleReview = async (
    action: 'approve' | 'reject',
    feedback?: string,
    customPoints?: number,
    checklist?: any
  ) => {
    if (!selectedSubmission) return;
    try {
      await apiRequest(`/api/submissions/${selectedSubmission.id}/review`, {
        method: 'POST',
        body: JSON.stringify({
          action,
          mentor_feedback: feedback,
          custom_points: customPoints,
          verification_checklist: checklist,
        }),
      });
      setActionMessage({
        type: 'success',
        text: `Submission "${selectedSubmission.activity_title}" marked as ${action.toUpperCase()}.`,
      });
      await loadSubmissions();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to submit review.',
      });
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // Quick 1-click inline review (No modal required)
  const handleQuickReview = async (submissionId: string, action: 'approve' | 'reject', feedback?: string) => {
    try {
      await apiRequest(`/api/submissions/${submissionId}/review`, {
        method: 'POST',
        body: JSON.stringify({
          action,
          mentor_feedback: feedback || (action === 'approve' ? 'Verified by mentor' : 'Certificate does not meet requirement criteria'),
        }),
      });
      setActionMessage({
        type: 'success',
        text: `Certificate marked as ${action.toUpperCase()} successfully.`,
      });
      setRejectPromptSubId(null);
      setRejectReason('');
      await loadSubmissions();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      console.error('Review failed:', err);
      setActionMessage({
        type: 'error',
        text: err.message || 'Review failed. Please try again.',
      });
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // Batch review handler for a student's pending submissions
  const handleBatchReview = async (submissionIds: string[], action: 'approve' | 'reject', feedback?: string) => {
    if (!submissionIds.length) return;
    try {
      setIsBatchProcessing(true);
      const defaultRemark = action === 'approve' ? 'Batch verified & approved by mentor' : 'Batch rejected';
      try {
        await apiRequest('/api/submissions/batch-review', {
          method: 'POST',
          body: JSON.stringify({
            submission_ids: submissionIds,
            action,
            mentor_feedback: feedback || defaultRemark,
          }),
        });
      } catch {
        // Resilient fallback to concurrent individual reviews
        await Promise.all(
          submissionIds.map((id) =>
            apiRequest(`/api/submissions/${id}/review`, {
              method: 'POST',
              body: JSON.stringify({
                action,
                mentor_feedback: feedback || defaultRemark,
              }),
            })
          )
        );
      }

      setActionMessage({
        type: 'success',
        text: `Successfully ${action === 'approve' ? 'approved' : 'rejected'} ${submissionIds.length} certificate(s)!`,
      });
      await loadSubmissions();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      console.error('Batch review failed:', err);
      setActionMessage({
        type: 'error',
        text: err.message || 'Batch review failed. Please try again.',
      });
      setTimeout(() => setActionMessage(null), 5000);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Format timestamp helper
  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return { date: 'N/A', time: '', relative: '' };
    try {
      const d = new Date(dateStr);
      const dateFormatted = d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const timeFormatted = d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const diffMs = Date.now() - d.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      let relative = '';
      if (diffHours < 1) relative = 'Just now';
      else if (diffHours < 24) relative = `${diffHours}h ago`;
      else if (diffDays === 1) relative = 'Yesterday';
      else if (diffDays < 7) relative = `${diffDays}d ago`;
      else relative = dateFormatted;

      return { date: dateFormatted, time: timeFormatted, relative };
    } catch {
      return { date: dateStr, time: '', relative: '' };
    }
  };

  // Filter submissions by status, search, and semester
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const matchesFilter = activeFilter === 'all' || s.status === activeFilter;
      const matchesSemester =
        selectedSemester === 'all' ||
        String(s.student_semester || s.semester) === selectedSemester;
      const matchesSearch =
        !searchQuery.trim() ||
        (s.student_name && s.student_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.student_roll_no && s.student_roll_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.activity_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.category_name && s.category_name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSemester && matchesSearch;
    });
  }, [submissions, activeFilter, selectedSemester, searchQuery]);

  // Group submissions by student
  const studentGroups: StudentGroup[] = useMemo(() => {
    const groupsMap = new Map<string, StudentGroup>();

    filteredSubmissions.forEach((sub) => {
      const sid = sub.student_id || 'unknown';
      if (!groupsMap.has(sid)) {
        groupsMap.set(sid, {
          student_id: sid,
          student_name: sub.student_name || 'Student',
          student_roll_no: sub.student_roll_no || 'N/A',
          student_semester: sub.student_semester || sub.semester || 6,
          student_cgpa: sub.student_cgpa,
          submissions: [],
          pendingCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
          pendingPoints: 0,
          approvedPoints: 0,
          totalSemesterPointsClaimed: 0,
        });
      }

      const grp = groupsMap.get(sid)!;
      grp.submissions.push(sub);

      if (sub.status === 'pending') {
        grp.pendingCount++;
        grp.pendingPoints += sub.base_points || 20;
      } else if (sub.status === 'approved') {
        grp.approvedCount++;
        grp.approvedPoints += sub.points_awarded || 0;
      } else if (sub.status === 'rejected') {
        grp.rejectedCount++;
      }

      grp.totalSemesterPointsClaimed = grp.approvedPoints + grp.pendingPoints;
    });

    // Sort submissions within each student group: pending first, then newest submitted_at
    groupsMap.forEach((grp) => {
      grp.submissions.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
      });
    });

    // Sort student groups: groups with pending reviews appear first
    return Array.from(groupsMap.values()).sort((a, b) => {
      if (a.pendingCount > 0 && b.pendingCount === 0) return -1;
      if (a.pendingCount === 0 && b.pendingCount > 0) return 1;
      return a.student_name.localeCompare(b.student_name);
    });
  }, [filteredSubmissions]);

  // Overall counters
  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const approvedCount = submissions.filter((s) => s.status === 'approved').length;
  const rejectedCount = submissions.filter((s) => s.status === 'rejected').length;

  const toggleStudentExpanded = (studentId: string) => {
    setExpandedStudents((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const toggleAllExpanded = (expand: boolean) => {
    const updated: Record<string, boolean> = {};
    studentGroups.forEach((grp) => {
      updated[grp.student_id] = expand;
    });
    setExpandedStudents(updated);
  };

  const SEMESTER_LIMIT = 30; // AICTE max points per semester cap

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 antialiased">
      {/* Toast Notification */}
      {actionMessage && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between shadow-sm animate-fade-in ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            {actionMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs hover:opacity-75 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-indigo-600" />
              <span>Mentor Certificate Verification Hub</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700">
              AICTE Degree Rules
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review student-submitted certificates collectively per semester with submission timestamps, authenticity proofs, and 1-click batch approvals.
          </p>
        </div>

        {/* View Mode Switcher & Stats */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'grouped'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Group submitted certificates by student for batch review"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Group by Student</span>
            </button>

            <button
              onClick={() => setViewMode('flat')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'flat'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="View all submissions in a single linear table"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Flat Table</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (filteredSubmissions.length > 0) {
                  setSelectedSubmissionsList(filteredSubmissions);
                  setSelectedSubmission(filteredSubmissions[0]);
                  setIsViewerOpen(true);
                }
              }}
              disabled={filteredSubmissions.length === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Inspect all submitted documents across all mentees collectively in a single click"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Inspect All Docs ({filteredSubmissions.length})</span>
            </button>

            <span className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{pendingCount} Pending</span>
            </span>
            <span className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
              {approvedCount} Approved
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs, Semester Filter, Search & Global Controls */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-2.5 items-center justify-between">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveFilter('pending')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeFilter === 'pending'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending ({pendingCount})</span>
            </button>

            <button
              onClick={() => setActiveFilter('approved')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeFilter === 'approved'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Approved ({approvedCount})</span>
            </button>

            <button
              onClick={() => setActiveFilter('rejected')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeFilter === 'rejected'
                  ? 'bg-white text-rose-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Rejected ({rejectedCount})</span>
            </button>

            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({submissions.length})
            </button>
          </div>

          {/* Semester Selector */}
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden cursor-pointer"
          >
            <option value="all">All Semesters</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
            <option value="3">Semester 3</option>
            <option value="4">Semester 4</option>
            <option value="5">Semester 5</option>
            <option value="6">Semester 6</option>
            <option value="7">Semester 7</option>
            <option value="8">Semester 8</option>
          </select>

          {/* Expand/Collapse All (for Grouped View) */}
          {viewMode === 'grouped' && studentGroups.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-slate-500 ml-1">
              <button
                onClick={() => toggleAllExpanded(true)}
                className="hover:text-indigo-600 underline cursor-pointer"
              >
                Expand all
              </button>
              <span>•</span>
              <button
                onClick={() => toggleAllExpanded(false)}
                className="hover:text-indigo-600 underline cursor-pointer"
              >
                Collapse all
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search student, USN, activity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
          />
        </div>
      </div>

      {/* Main View Area */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center text-slate-400 text-xs">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-semibold text-slate-600">Loading student submissions and verification data...</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center space-y-2">
          <CheckCircle className="w-10 h-10 text-emerald-500/50 mx-auto" />
          <p className="font-bold text-sm text-slate-800">No submissions matching criteria</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            All student submissions in this view have been processed, or no records matched your search filters.
          </p>
        </div>
      ) : viewMode === 'grouped' ? (
        /* ========================================================================= */
        /* VIEW 1: STUDENT BATCH REVIEW (COLLECTIVE VIEW)                             */
        /* ========================================================================= */
        <div className="space-y-3.5">
          {studentGroups.map((group) => {
            const isExpanded = expandedStudents[group.student_id] ?? true;
            const pendingSubs = group.submissions.filter((s) => s.status === 'pending');
            const hasPending = pendingSubs.length > 0;
            const isCapExceeded = group.totalSemesterPointsClaimed > SEMESTER_LIMIT;

            return (
              <div
                key={group.student_id}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition hover:border-slate-300"
              >
                {/* Student Group Header Bar */}
                <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Left: Student Identity */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setCollectiveModalStudent(group);
                        setIsCollectiveModalOpen(true);
                      }}
                      className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer hover:ring-2 hover:ring-indigo-400 transition"
                      title="Click student to view all submitted certificates in a single window"
                    >
                      {group.student_name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setCollectiveModalStudent(group);
                            setIsCollectiveModalOpen(true);
                          }}
                          className="font-bold text-sm sm:text-base text-slate-900 hover:text-indigo-600 transition flex items-center gap-1.5 group cursor-pointer text-left"
                          title="Click name to view all submitted certificates in a single window"
                        >
                          <span className="group-hover:underline">{group.student_name}</span>
                          <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white transition flex items-center gap-1">
                            <Eye className="w-2.5 h-2.5" />
                            <span>View all {group.submissions.length} certs</span>
                          </span>
                        </button>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 font-semibold">
                          {group.student_roll_no}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                          Sem {group.student_semester}
                        </span>
                        {group.student_cgpa && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            CGPA: {group.student_cgpa}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="font-medium text-slate-700">
                          {group.submissions.length} certificate{group.submissions.length > 1 ? 's' : ''} submitted
                        </span>
                        <span>•</span>
                        {group.pendingCount > 0 && (
                          <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                            {group.pendingCount} Pending Review
                          </span>
                        )}
                        {group.approvedCount > 0 && (
                          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                            {group.approvedCount} Approved
                          </span>
                        )}
                        {group.rejectedCount > 0 && (
                          <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[10px]">
                            {group.rejectedCount} Rejected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Center/Right: Semester Credit Cap Meter & Batch Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Semester Cap Visual Meter */}
                    <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs text-xs">
                      <div className="flex items-center justify-between gap-3 text-[11px]">
                        <span className="text-slate-500 font-medium flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Semester Points:</span>
                        </span>
                        <div className="font-mono font-bold">
                          <span className="text-emerald-700">{group.approvedPoints} approved</span>
                          {group.pendingPoints > 0 && (
                            <span className="text-indigo-600"> +{group.pendingPoints} pending</span>
                          )}
                          <span className="text-slate-400"> / {SEMESTER_LIMIT} cap</span>
                        </div>
                      </div>

                      {/* Warning or Status chip */}
                      {isCapExceeded ? (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-700 font-medium">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Exceeds {SEMESTER_LIMIT}-pt cap by {group.totalSemesterPointsClaimed - SEMESTER_LIMIT} pts (points capped automatically)</span>
                        </div>
                      ) : (
                        <div className="mt-0.5 text-[10px] text-slate-400">
                          AICTE guideline: max {SEMESTER_LIMIT} activity credits awarded per semester
                        </div>
                      )}
                    </div>

                    {/* Batch Actions for this Student */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setCollectiveModalStudent(group);
                          setIsCollectiveModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition shadow-2xs cursor-pointer"
                        title={`Inspect all ${group.submissions.length} documents for ${group.student_name} collectively in a single window`}
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Inspect All Docs ({group.submissions.length})</span>
                      </button>

                      {hasPending && (
                        <button
                          disabled={isBatchProcessing}
                          onClick={() => {
                            if (window.confirm(`Approve all ${pendingSubs.length} pending certificates for ${group.student_name}?`)) {
                              handleBatchReview(
                                pendingSubs.map((s) => s.id),
                                'approve'
                              );
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-2xs disabled:opacity-50 cursor-pointer"
                          title="1-click approve all pending certificates for this student"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Approve All Pending ({pendingSubs.length})</span>
                        </button>
                      )}
                    </div>

                    {/* Expand/Collapse Chevron Button */}
                    <button
                      onClick={() => toggleStudentExpanded(group.student_id)}
                      className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-500 transition cursor-pointer"
                      title={isExpanded ? 'Collapse certificate list' : 'Expand certificate list'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Certificates Collective Table */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3.5">Activity & Certificate</th>
                          <th className="py-2.5 px-3.5">Submission Timestamp</th>
                          <th className="py-2.5 px-3.5">Authenticity & Verification</th>
                          <th className="py-2.5 px-3.5 text-right">Points</th>
                          <th className="py-2.5 px-3.5">Status</th>
                          <th className="py-2.5 px-3.5 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {group.submissions.map((sub) => {
                          const timeInfo = formatTimestamp(sub.submitted_at);
                          const isPending = sub.status === 'pending';
                          const hasAiAudit = Boolean(sub.ai_audit_results);

                          return (
                            <tr
                              key={sub.id}
                              className={`transition ${
                                isPending ? 'hover:bg-amber-50/20 bg-amber-50/5' : 'hover:bg-slate-50/70'
                              }`}
                            >
                              {/* 1. Activity Title & Category */}
                              <td className="py-3 px-3.5 max-w-xs">
                                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                  <span>{sub.activity_title}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                    {sub.category_name}
                                  </span>
                                  {sub.schema_activity_name && (
                                    <span className="text-slate-500 text-[10px]">
                                      • {sub.schema_activity_name}
                                    </span>
                                  )}
                                  {sub.hours_spent ? (
                                    <span className="text-indigo-600 font-medium text-[10px] bg-indigo-50 px-1.5 py-0.2 rounded">
                                      {sub.hours_spent} hrs
                                    </span>
                                  ) : null}
                                </div>
                                {sub.mentor_feedback && (
                                  <div className="mt-1.5 text-[10px] text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                                    Remark: {sub.mentor_feedback}
                                  </div>
                                )}
                              </td>

                              {/* 2. Submission Timestamp */}
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <div className="flex items-center gap-1.5 text-slate-900 font-semibold text-xs">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{timeInfo.date}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                  <span className="font-mono">{timeInfo.time}</span>
                                  <span className="text-slate-400">•</span>
                                  <span className="text-indigo-600 font-medium">{timeInfo.relative}</span>
                                </div>
                                {sub.completion_date && (
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    Completed: {new Date(sub.completion_date).toLocaleDateString()}
                                  </div>
                                )}
                              </td>

                              {/* 3. Authenticity & Verification Link */}
                              <td className="py-3 px-3.5">
                                <div className="space-y-1">
                                  {hasAiAudit && (
                                    <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded w-fit">
                                      <Sparkles className="w-3 h-3 text-indigo-600" />
                                      <span>AI Pre-Verified ✓</span>
                                    </div>
                                  )}

                                  {sub.credential_hash && (
                                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                      <span>Hash: {sub.credential_hash.substring(0, 10)}...</span>
                                      <a
                                        href={`/verify/${sub.credential_hash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-600 hover:text-indigo-800 ml-1 inline-flex items-center"
                                        title="Public Verification Link"
                                      >
                                        <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* 4. Points */}
                              <td className="py-3 px-3.5 text-right font-mono font-bold text-xs whitespace-nowrap">
                                <span
                                  className={
                                    sub.status === 'approved'
                                      ? 'text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200'
                                      : sub.status === 'rejected'
                                      ? 'text-slate-400 line-through'
                                      : 'text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200'
                                  }
                                >
                                  {sub.status === 'approved'
                                    ? `+${sub.points_awarded}`
                                    : `+${sub.base_points || 20}`}{' '}
                                  pts
                                </span>
                              </td>

                              {/* 5. Status */}
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <StatusBadge status={sub.status} />
                                {sub.reviewer_name && sub.reviewed_at && (
                                  <div className="text-[10px] text-slate-400 mt-1">
                                    By {sub.reviewer_name}
                                  </div>
                                )}
                              </td>

                              {/* 6. Inline Quick Actions & Deep Modal View */}
                              <td className="py-3 px-3.5 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  {/* Deep Evidence Inspection Modal */}
                                  <button
                                    onClick={() => {
                                      setSelectedSubmissionsList(group.submissions);
                                      setSelectedSubmission(sub);
                                      setIsViewerOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
                                    title="View full certificate PDF and multi-doc deck"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Proof</span>
                                  </button>

                                  {/* Inline 1-Click Approve (No modal necessary!) */}
                                  {isPending && (
                                    <>
                                      <button
                                        onClick={() => handleQuickReview(sub.id, 'approve')}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-2xs"
                                        title="Quick Approve certificate"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Approve</span>
                                      </button>

                                      <button
                                        onClick={() => {
                                          if (rejectPromptSubId === sub.id) {
                                            setRejectPromptSubId(null);
                                          } else {
                                            setRejectPromptSubId(sub.id);
                                            setRejectReason('');
                                          }
                                        }}
                                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                                        title="Reject certificate"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>

                                {/* Quick Reject Reason Prompt Inline */}
                                {rejectPromptSubId === sub.id && (
                                  <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded-lg text-left space-y-1.5 animate-fade-in">
                                    <p className="text-[10px] font-semibold text-rose-800">
                                      Specify reason for rejection:
                                    </p>
                                    <input
                                      type="text"
                                      placeholder="e.g. Incomplete proof, wrong semester..."
                                      value={rejectReason}
                                      onChange={(e) => setRejectReason(e.target.value)}
                                      className="w-full text-xs p-1.5 rounded border border-rose-300 bg-white focus:outline-hidden"
                                    />
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        onClick={() => setRejectPromptSubId(null)}
                                        className="px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleQuickReview(sub.id, 'reject', rejectReason || 'Certificate does not meet required criteria')
                                        }
                                        className="px-2.5 py-1 text-[10px] font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded cursor-pointer"
                                      >
                                        Confirm Reject
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 2: FLAT TABLE (CLASSIC SUBMISSIONS LIST)                             */
        /* ========================================================================= */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3.5">Student Details</th>
                  <th className="py-2.5 px-3.5">Activity & Category</th>
                  <th className="py-2.5 px-3.5">Submission Timestamp</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5 text-right">Points</th>
                  <th className="py-2.5 px-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map((sub) => {
                  const timeInfo = formatTimestamp(sub.submitted_at);
                  const isPending = sub.status === 'pending';

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3.5">
                        <button
                          type="button"
                          onClick={() => {
                            const grp = studentGroups.find((g) => g.student_id === sub.student_id);
                            if (grp) {
                              setCollectiveModalStudent(grp);
                              setIsCollectiveModalOpen(true);
                            }
                          }}
                          className="font-bold text-slate-900 text-xs hover:text-indigo-600 hover:underline cursor-pointer text-left flex items-center gap-1 group"
                          title="Click to view all certificates of this mentee in a single window"
                        >
                          <span>{sub.student_name}</span>
                          <Eye className="w-2.5 h-2.5 text-indigo-600 opacity-60 group-hover:opacity-100" />
                        </button>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {sub.student_roll_no} • Sem {sub.student_semester || 6}
                        </div>
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 text-xs">{sub.activity_title}</div>
                        <div className="text-[11px] text-slate-500">
                          {sub.schema_activity_name || sub.category_name}
                        </div>
                        {sub.mentor_feedback && (
                          <div className="mt-1 text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                            Remark: {sub.mentor_feedback}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{timeInfo.date}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {timeInfo.time} ({timeInfo.relative})
                        </div>
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="space-y-1">
                          <StatusBadge status={sub.status} />
                          {sub.ai_audit_results && (
                            <div>
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                <Sparkles className="w-2.5 h-2.5 text-indigo-600" />
                                AI Verified ✓
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3.5 text-right font-mono font-bold text-xs">
                        <span
                          className={
                            sub.status === 'approved'
                              ? 'text-emerald-700'
                              : sub.status === 'rejected'
                              ? 'text-slate-400 line-through'
                              : 'text-indigo-700'
                          }
                        >
                          {sub.status === 'approved' ? `+${sub.points_awarded}` : `+${sub.base_points || 20}`} pts
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedSubmissionsList(filteredSubmissions);
                              setSelectedSubmission(sub);
                              setIsViewerOpen(true);
                            }}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                              isPending
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                : 'bg-slate-800 hover:bg-slate-700 text-white'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isPending ? 'Review' : 'View'}</span>
                          </button>

                          {isPending && (
                            <button
                              onClick={() => handleQuickReview(sub.id, 'approve')}
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-2xs"
                              title="Quick Approve"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Evidence Viewer & Evaluation Modal */}
      <PDFViewerModal
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setSelectedSubmission(null);
          setSelectedSubmissionsList([]);
        }}
        submission={selectedSubmission}
        submissionsList={selectedSubmissionsList}
        canReview={true}
        onReview={handleReview}
        onBatchApproveAll={(ids) => handleBatchReview(ids, 'approve')}
      />

      {/* Single Window Mentee Collective Certificates Modal (Opens on clicking student name) */}
      <MenteeCollectiveDocsModal
        isOpen={isCollectiveModalOpen}
        onClose={() => {
          setIsCollectiveModalOpen(false);
          setCollectiveModalStudent(null);
        }}
        student={collectiveModalStudent}
        submissions={collectiveModalStudent ? collectiveModalStudent.submissions : []}
        onReview={async (subId, action, feedback, customPoints) => {
          await apiRequest(`/api/submissions/${subId}/review`, {
            method: 'POST',
            body: JSON.stringify({
              action,
              mentor_feedback: feedback,
              custom_points: customPoints,
            }),
          });
          await loadSubmissions();
          if (collectiveModalStudent) {
            const updated = await apiRequest<Submission[]>('/api/submissions/assigned');
            const studentSubs = updated.filter((s) => s.student_id === collectiveModalStudent.student_id);
            setCollectiveModalStudent((prev) => (prev ? { ...prev, submissions: studentSubs } : null));
          }
        }}
        onBatchReview={async (subIds, action, feedback) => {
          await handleBatchReview(subIds, action, feedback);
          if (collectiveModalStudent) {
            const updated = await apiRequest<Submission[]>('/api/submissions/assigned');
            const studentSubs = updated.filter((s) => s.student_id === collectiveModalStudent.student_id);
            setCollectiveModalStudent((prev) => (prev ? { ...prev, submissions: studentSubs } : null));
          }
        }}
        canReview={true}
      />
    </div>
  );
};
