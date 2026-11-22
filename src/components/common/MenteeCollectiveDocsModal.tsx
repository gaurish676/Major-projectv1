import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  FileText,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Calendar,
  User as UserIcon,
  Download,
  AlertCircle,
  CheckCircle2,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Copy,
  Clock,
  ExternalLink,
  CheckCheck,
  Sparkles,
  Award,
  Layers,
  GraduationCap,
  ChevronRight,
  Check,
} from 'lucide-react';
import { Submission } from '../../types';
import { StatusBadge } from './Badge';
import { getAuthenticatedFileUrl } from '../../lib/api';

interface MenteeCollectiveDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    student_id: string;
    student_name: string;
    student_roll_no: string;
    student_semester: number;
    student_cgpa?: number;
    avatar?: string;
  } | null;
  submissions: Submission[];
  onReview?: (submissionId: string, action: 'approve' | 'reject', feedback?: string, customPoints?: number) => Promise<void>;
  onBatchReview?: (submissionIds: string[], action: 'approve' | 'reject', feedback?: string) => Promise<void>;
  canReview?: boolean;
}

export const MenteeCollectiveDocsModal: React.FC<MenteeCollectiveDocsModalProps> = ({
  isOpen,
  onClose,
  student,
  submissions,
  onReview,
  onBatchReview,
  canReview = true,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [customPointsInput, setCustomPointsInput] = useState<number>(20);
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Certificate Controls
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // On open or submissions change, default to first pending submission if exists
  useEffect(() => {
    if (submissions && submissions.length > 0) {
      const pendingIdx = submissions.findIndex((s) => s.status === 'pending');
      setSelectedIndex(pendingIdx >= 0 ? pendingIdx : 0);
    } else {
      setSelectedIndex(0);
    }
  }, [submissions, student]);

  const activeSubmission = submissions && submissions.length > 0 ? submissions[selectedIndex] : null;

  // Sync inputs when active submission flips
  useEffect(() => {
    if (activeSubmission) {
      setShowRejectBox(false);
      setCustomPointsInput(
        activeSubmission.status === 'approved'
          ? activeSubmission.points_awarded
          : activeSubmission.base_points || 20
      );
      setFeedbackText(activeSubmission.mentor_feedback || '');
      setActionError(null);
      setZoom(1);
      setRotation(0);
    }
  }, [activeSubmission]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || !submissions || submissions.length <= 1) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        setSelectedIndex((prev) => Math.min(submissions.length - 1, prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submissions]);

  const pendingSubmissions = submissions ? submissions.filter((s) => s.status === 'pending') : [];
  const approvedSubmissions = submissions ? submissions.filter((s) => s.status === 'approved') : [];
  const totalApprovedPoints = approvedSubmissions.reduce((acc, s) => acc + (s.points_awarded || 0), 0);
  const totalPendingPoints = pendingSubmissions.reduce((acc, s) => acc + (s.base_points || 20), 0);
  const SEMESTER_LIMIT = 30;

  const cleanUrl = (activeSubmission?.file_url || '').split('?')[0].toLowerCase();
  const isSvgOrImage =
    cleanUrl.endsWith('.svg') ||
    cleanUrl.endsWith('.png') ||
    cleanUrl.endsWith('.jpg') ||
    cleanUrl.endsWith('.jpeg') ||
    cleanUrl.endsWith('.webp');

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handleApprove = async () => {
    if (!onReview || !activeSubmission) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      await onReview(
        activeSubmission.id,
        'approve',
        feedbackText || 'Verified against institutional criteria.',
        customPointsInput
      );
      // Advance to next pending submission if available
      const nextPendingIdx = submissions.findIndex(
        (s, idx) => idx > selectedIndex && s.status === 'pending'
      );
      if (nextPendingIdx >= 0) {
        setSelectedIndex(nextPendingIdx);
      } else if (selectedIndex < submissions.length - 1) {
        setSelectedIndex(selectedIndex + 1);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!onReview || !activeSubmission) return;
    if (!feedbackText.trim()) {
      setActionError('Feedback remarks are required when returning or rejecting a submission.');
      return;
    }
    setIsSubmitting(true);
    setActionError(null);
    try {
      await onReview(activeSubmission.id, 'reject', feedbackText, 0);
      if (selectedIndex < submissions.length - 1) {
        setSelectedIndex(selectedIndex + 1);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && student && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ duration: 0.2 }}
            className={`relative w-full ${
              isFullScreen ? 'max-w-7xl h-[97vh]' : 'max-w-6xl max-h-[94vh]'
            } bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all`}
          >
          {/* Top Bar: Student Identity & Points Progress */}
          <div className="px-4 py-3 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 shrink-0">
            {/* Student info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0 ring-2 ring-indigo-400/30">
                {student.student_name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-white text-sm sm:text-base truncate">
                    {student.student_name}
                  </h2>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-semibold border border-slate-700">
                    {student.student_roll_no}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                    Sem {student.student_semester}
                  </span>
                  {student.student_cgpa && (
                    <span className="text-[11px] text-slate-400">
                      CGPA: {student.student_cgpa}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>Viewing all <strong>{submissions.length} submitted certificates</strong> collectively in a single window</span>
                  <span>•</span>
                  <span className="text-amber-400 font-medium">{pendingSubmissions.length} pending review</span>
                </p>
              </div>
            </div>

            {/* Right: Semester Points Meter & Global Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Semester Cap Badge */}
              <div className="hidden md:flex flex-col items-end px-3 py-1 bg-slate-800/80 rounded-lg border border-slate-700 text-xs">
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-emerald-400 font-bold">{totalApprovedPoints} approved</span>
                  {totalPendingPoints > 0 && (
                    <span className="text-amber-300 font-bold"> +{totalPendingPoints} pending</span>
                  )}
                  <span className="text-slate-400"> / {SEMESTER_LIMIT} sem cap</span>
                </div>
              </div>

              {/* Batch Approve All Button */}
              {canReview && onBatchReview && pendingSubmissions.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Batch approve all ${pendingSubmissions.length} pending certificates for ${student.student_name}?`
                      )
                    ) {
                      onBatchReview(
                        pendingSubmissions.map((s) => s.id),
                        'approve'
                      );
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  title="Approve all pending certificates for this student in 1 click"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Approve All Pending ({pendingSubmissions.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Single Window Split Body: Left List + Right Canvas or Empty State */}
          {submissions.length === 0 || !activeSubmission ? (
            <div className="flex-1 p-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">No Certificates Submitted</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  {student.student_name} has not submitted any activity certificates for review yet.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* LEFT PANE: All n Submitted Certificates Navigator (38%) */}
            <div className="lg:col-span-5 bg-slate-50 flex flex-col overflow-hidden max-h-[50vh] lg:max-h-none">
              <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Submitted Certificates ({submissions.length})</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  Use ↑ ↓ arrow keys to flip
                </span>
              </div>

              {/* Scrollable Certificates Playlist */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                {submissions.map((sub, idx) => {
                  const isSelected = idx === selectedIndex;
                  const isPending = sub.status === 'pending';
                  const isApproved = sub.status === 'approved';

                  return (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedIndex(idx)}
                      className={`p-3 rounded-xl border transition cursor-pointer relative ${
                        isSelected
                          ? 'bg-indigo-50/80 border-indigo-400 shadow-xs ring-1 ring-indigo-400'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                              #{idx + 1}
                            </span>
                            <span
                              className={`text-xs font-bold truncate ${
                                isSelected ? 'text-indigo-900' : 'text-slate-900'
                              }`}
                            >
                              {sub.activity_title}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                              {sub.category_name}
                            </span>
                            {sub.hours_spent ? (
                              <span className="text-indigo-600 font-medium bg-indigo-50 px-1 py-0.2 rounded">
                                {sub.hours_spent} hrs
                              </span>
                            ) : null}
                          </div>

                          {/* Submission Timestamp */}
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1 font-mono">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Submitted: {formatTimestamp(sub.submitted_at)}</span>
                          </div>
                        </div>

                        {/* Status & Points */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span
                            className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                              isApproved
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            +{isApproved ? sub.points_awarded : sub.base_points || 20} pts
                          </span>
                          <StatusBadge status={sub.status} />
                        </div>
                      </div>

                      {/* Mentor feedback snippet if available */}
                      {sub.mentor_feedback && (
                        <div className="mt-1.5 text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 line-clamp-1">
                          Remark: {sub.mentor_feedback}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT PANE: Focused Document Preview & Direct Review Canvas (62%) */}
            <div className="lg:col-span-7 bg-white flex flex-col overflow-y-auto">
              {/* Document Canvas Header Controls */}
              <div className="p-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-xs truncate max-w-xs text-white">
                    {selectedIndex + 1}. {activeSubmission.activity_title}
                  </span>
                  <StatusBadge status={activeSubmission.status} />
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Zoom controls */}
                  <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-md text-[11px]">
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                      className="hover:text-indigo-300 cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-[10px] px-1 font-bold">{Math.round(zoom * 100)}%</span>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.25).toFixed(2))))}
                      className="hover:text-indigo-300 cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="p-1 bg-slate-800 hover:bg-slate-700 rounded-md cursor-pointer"
                    title="Rotate 90°"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={getAuthenticatedFileUrl(activeSubmission.file_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-md text-[11px] font-medium flex items-center gap-1 transition"
                    title="Open original document in new tab"
                  >
                    <Download className="w-3 h-3" />
                    <span>Raw</span>
                  </a>

                  {activeSubmission.credential_hash && (
                    <a
                      href={`/verify/${activeSubmission.credential_hash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-1 bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 rounded-md text-[11px] font-medium flex items-center gap-1 transition"
                      title="Open Public Autonomous Verification Page"
                    >
                      <ExternalLink className="w-3 h-3 text-indigo-400" />
                      <span>Verify Page</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Viewport Certificate Display Canvas */}
              <div className="p-3 bg-slate-100/60 border-b border-slate-200 flex items-center justify-center min-h-[380px] overflow-hidden relative">
                <div
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.15s ease-out',
                  }}
                  className="max-w-full max-h-[460px] flex items-center justify-center overflow-auto"
                >
                  {isSvgOrImage ? (
                    <img
                      src={getAuthenticatedFileUrl(activeSubmission.file_url)}
                      alt={activeSubmission.activity_title}
                      className="max-h-[420px] w-auto object-contain rounded-lg shadow-md border border-slate-200 bg-white"
                    />
                  ) : (
                    <iframe
                      src={`${getAuthenticatedFileUrl(activeSubmission.file_url)}#toolbar=0&navpanes=0`}
                      title="Certificate Proof Document"
                      className="w-[580px] h-[420px] max-w-full border-0 rounded-lg shadow-md bg-white"
                    />
                  )}
                </div>
              </div>

              {/* Certificate Metadata & Review Sign-off */}
              <div className="p-4 space-y-3 bg-white">
                {/* Authenticity & Details Card */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{activeSubmission.activity_title}</span>
                      {activeSubmission.ai_audit_results && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          <span>AI Pre-Verified ✓</span>
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                      +{activeSubmission.status === 'approved' ? activeSubmission.points_awarded : activeSubmission.base_points || 20} pts
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600 pt-1 border-t border-slate-200/80">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Submitted: {formatTimestamp(activeSubmission.submitted_at)}</span>
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Completed: {activeSubmission.completion_date}</span>
                    </span>
                    {activeSubmission.hours_spent ? (
                      <span className="font-medium text-slate-700">
                        Duration: {activeSubmission.hours_spent} hours
                      </span>
                    ) : null}
                  </div>

                  {activeSubmission.description && (
                    <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
                      <strong className="text-slate-800">Student Submission Note:</strong> {activeSubmission.description}
                    </div>
                  )}

                  {activeSubmission.credential_hash && (
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono bg-white p-2 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-1.5 truncate">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">SHA-256 Hash: {activeSubmission.credential_hash}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const fullUrl = `${window.location.origin}/verify/${activeSubmission.credential_hash}`;
                          navigator.clipboard.writeText(fullUrl);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                        className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-sans shrink-0 cursor-pointer ml-2"
                      >
                        {copiedLink ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Error Banner */}
                {actionError && (
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 mt-0.5" />
                    <span>{actionError}</span>
                  </div>
                )}

                {/* Evaluation Box */}
                {canReview && activeSubmission.status === 'pending' ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">Points Awarded</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={customPointsInput}
                          onChange={(e) => setCustomPointsInput(Number(e.target.value))}
                          className="w-16 px-2 py-1 text-xs text-right font-mono font-bold bg-white border border-slate-300 rounded-md focus:border-indigo-500 outline-hidden"
                        />
                        <span className="text-xs text-slate-500 font-medium">pts</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Mentor Feedback / Remarks {showRejectBox ? <span className="text-rose-600 font-bold">*</span> : '(Optional)'}
                      </label>
                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder={showRejectBox ? 'Specify reason for rejection...' : 'Enter commendation or verification remarks...'}
                        rows={2}
                        className="w-full text-xs p-2 rounded-lg bg-white border border-slate-300 focus:border-indigo-500 outline-hidden resize-none"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                      {!showRejectBox ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowRejectBox(true)}
                            disabled={isSubmitting}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={handleApprove}
                            disabled={isSubmitting}
                            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Approve (+{customPointsInput} pts)</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowRejectBox(false)}
                            disabled={isSubmitting}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleReject}
                            disabled={isSubmitting}
                            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Confirm Reject</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-700">Review Status:</span>
                      <span className="ml-1.5 font-bold text-emerald-700">
                        {activeSubmission.status.toUpperCase()} (+{activeSubmission.points_awarded} pts)
                      </span>
                      {activeSubmission.mentor_feedback && (
                        <p className="text-slate-500 text-[11px] mt-0.5 italic">"{activeSubmission.mentor_feedback}"</p>
                      )}
                    </div>
                    {canReview && onReview && (
                      <button
                        type="button"
                        onClick={() => handleApprove()}
                        className="px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition cursor-pointer"
                      >
                        Re-evaluate
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )}
</AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
};
