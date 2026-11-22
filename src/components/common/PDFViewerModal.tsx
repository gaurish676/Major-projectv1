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
  Tag,
  Download,
  AlertCircle,
  CheckCircle2,
  RotateCw,
  Maximize2,
  Minimize2,
  Copy,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
  Layers,
} from 'lucide-react';
import { Submission } from '../../types';
import { StatusBadge } from './Badge';
import { getAuthenticatedFileUrl } from '../../lib/api';

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission | null;
  submissionsList?: Submission[];
  initialIndex?: number;
  onReview?: (action: 'approve' | 'reject', feedback?: string, customPoints?: number, checklist?: any) => Promise<void>;
  onBatchApproveAll?: (submissionIds: string[]) => Promise<void>;
  canReview?: boolean;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  isOpen,
  onClose,
  submission,
  submissionsList,
  initialIndex = 0,
  onReview,
  onBatchApproveAll,
  canReview = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Certificate Display Controls (Rotate, Fullscreen)
  const [rotation, setRotation] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Verification Checklist
  const [checklist, setChecklist] = useState({
    nameMatches: true,
    issuerVerified: true,
    durationValid: true,
    noTampering: true,
  });
  const [customPointsInput, setCustomPointsInput] = useState<number>(20);
  const [isReEvaluating, setIsReEvaluating] = useState(false);

  // Synchronize current index when list or submission changes
  useEffect(() => {
    if (submissionsList && submissionsList.length > 0) {
      if (submission) {
        const found = submissionsList.findIndex((s) => s.id === submission.id);
        setCurrentIndex(found >= 0 ? found : initialIndex || 0);
      } else {
        setCurrentIndex(initialIndex || 0);
      }
    } else {
      setCurrentIndex(0);
    }
  }, [submission, submissionsList, initialIndex]);

  const activeSubmission =
    submissionsList && submissionsList.length > 0
      ? submissionsList[currentIndex] || submission
      : submission;

  // Reset form inputs whenever active document flips
  useEffect(() => {
    if (activeSubmission) {
      setIsReEvaluating(false);
      setShowRejectBox(false);
      setCustomPointsInput(
        activeSubmission.status === 'approved'
          ? activeSubmission.points_awarded
          : (activeSubmission.base_points || 20)
      );
      setFeedbackText(activeSubmission.mentor_feedback || '');
      setActionError(null);
      setRotation(0);
    }
  }, [activeSubmission]);

  // Keyboard navigation for multi-document deck and escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (!submissionsList || submissionsList.length <= 1) return;
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => Math.min(submissionsList.length - 1, prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submissionsList, onClose]);

  const cleanUrl = (activeSubmission?.file_url || '').split('?')[0].toLowerCase();
  const isSvgOrImage =
    cleanUrl.endsWith('.svg') ||
    cleanUrl.endsWith('.png') ||
    cleanUrl.endsWith('.jpg') ||
    cleanUrl.endsWith('.jpeg') ||
    cleanUrl.endsWith('.webp');

  const hasMultipleDocs = Boolean(submissionsList && submissionsList.length > 1);

  const handleApprove = async () => {
    if (!onReview || !activeSubmission) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      await onReview(
        'approve',
        feedbackText || 'Verified against institutional criteria.',
        customPointsInput,
        checklist
      );
      // Auto-advance to next document in deck if available
      if (submissionsList && currentIndex < submissionsList.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onClose();
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
      setActionError('Feedback remarks are required when returning a submission.');
      return;
    }
    setIsSubmitting(true);
    setActionError(null);
    try {
      await onReview('reject', feedbackText, 0, checklist);
      if (submissionsList && currentIndex < submissionsList.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onClose();
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingInDeck = submissionsList
    ? submissionsList.filter((s) => s.status === 'pending')
    : [];

  const modalContent = (
    <AnimatePresence>
      {isOpen && activeSubmission && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
          className={`relative w-full ${
            isFullScreen ? 'max-w-7xl h-[96vh]' : 'max-w-5xl max-h-[92vh]'
          } bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all`}
        >
          {/* 1. Header Bar */}
          <div className="px-4 py-2.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-white text-xs sm:text-sm flex items-center gap-2">
                  <span className="truncate max-w-xs sm:max-w-md">
                    {activeSubmission.activity_title}
                  </span>
                  <StatusBadge status={activeSubmission.status} />
                </h3>
                <p className="text-[11px] text-slate-400 truncate">
                  {activeSubmission.student_name} • {activeSubmission.category_name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {canReview && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const fullUrl = `${window.location.origin}/verify/${
                        activeSubmission.credential_hash || activeSubmission.id
                      }`;
                      navigator.clipboard.writeText(fullUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                    title="Copy Public Verification Link"
                  >
                    {copiedLink ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedLink ? 'Copied' : 'Copy Verify Link'}</span>
                  </button>

                  <a
                    href={`/verify/${
                      activeSubmission.credential_hash || activeSubmission.id
                    }`}
                    target="_blank"
                    rel="noreferrer"
                    className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                    title="Open Public Autonomous Verification Ledger"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Verify Page</span>
                  </a>
                </>
              )}

              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
                title={`Rotate Document (${rotation}°)`}
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Rotate</span>
              </button>

              <a
                href={getAuthenticatedFileUrl(activeSubmission.file_url)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                title="Open Raw File in New Tab"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Raw File</span>
              </a>

              <button
                type="button"
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
              >
                {isFullScreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
                aria-label="Close modal"
                title="Close"
              >
                <X className="w-4 h-4" />
                <span className="text-xs font-semibold hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          {/* 2. Multi-Document Deck Carousel Strip (When inspecting multiple docs as mentor) */}
          {canReview && hasMultipleDocs && submissionsList && (
            <div className="px-3 sm:px-4 py-2 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 gap-2 shrink-0">
              {/* Prev / Next controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((idx) => Math.max(0, idx - 1))}
                  disabled={currentIndex === 0}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 text-[11px] font-semibold transition cursor-pointer"
                  title="Previous Document (Left Arrow)"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Prev</span>
                </button>

                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                  <strong className="text-white">{currentIndex + 1}</strong> of{' '}
                  {submissionsList.length}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((idx) =>
                      Math.min(submissionsList.length - 1, idx + 1)
                    )
                  }
                  disabled={currentIndex === submissionsList.length - 1}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 text-[11px] font-semibold transition cursor-pointer"
                  title="Next Document (Right Arrow)"
                >
                  <span className="hidden xs:inline">Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Horizontal Document Switcher Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-lg min-w-0">
                {submissionsList.map((sub, idx) => {
                  const isActive = idx === currentIndex;
                  const isApproved = sub.status === 'approved';
                  const isPending = sub.status === 'pending';

                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-indigo-600 text-white font-bold ring-1 ring-indigo-400 shadow-xs'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                      }`}
                      title={sub.activity_title}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: isApproved
                            ? '#10b981'
                            : isPending
                            ? '#f59e0b'
                            : '#f43f5e',
                        }}
                      />
                      <span className="truncate max-w-[130px]">
                        {idx + 1}. {sub.activity_title}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Batch Approve All from within Modal */}
              {onBatchApproveAll && pendingInDeck.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    onBatchApproveAll(pendingInDeck.map((s) => s.id))
                  }
                  className="px-2.5 sm:px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1.5 shrink-0 transition cursor-pointer shadow-xs"
                  title="Approve all pending certificates in this deck in 1 click"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Approve All ({pendingInDeck.length})</span>
                </button>
              )}
            </div>
          )}

          {/* 3. Main Body */}
          {!canReview ? (
            /* Student Proof View: Clean, full-width certificate presentation without any evaluation panels or zoom clutter */
            <div className="flex-1 w-full p-2 sm:p-4 bg-slate-900/5 flex items-center justify-center overflow-hidden min-h-[320px]">
              {/* Centered Full-Width Certificate Canvas */}
              <div className="w-full h-full bg-white rounded-xl shadow-inner border border-slate-200 overflow-auto relative p-3 sm:p-4 flex items-center justify-center min-h-[280px]">
                <div
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.15s ease-out',
                  }}
                  className="max-w-full max-h-full flex items-center justify-center"
                >
                  {isSvgOrImage ? (
                    <img
                      src={getAuthenticatedFileUrl(activeSubmission.file_url)}
                      alt={activeSubmission.activity_title}
                      className="max-h-[76vh] max-w-full object-contain rounded-lg shadow-sm"
                    />
                  ) : (
                    <object
                      data={`${getAuthenticatedFileUrl(activeSubmission.file_url)}#toolbar=0&navpanes=0`}
                      type="application/pdf"
                      className="w-[960px] h-[76vh] max-w-full border-0 rounded-lg bg-white shadow-xs"
                    >
                      <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 bg-slate-50 border border-slate-200 rounded-xl max-w-md">
                        <FileText className="w-12 h-12 text-indigo-500" />
                        <div>
                          <p className="text-sm font-bold text-slate-800">PDF Certificate Document</p>
                          <p className="text-xs text-slate-500 mt-1">This browser environment requires direct document streaming.</p>
                        </div>
                        <a
                          href={getAuthenticatedFileUrl(activeSubmission.file_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-xs transition cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Open PDF In Dedicated Viewer</span>
                        </a>
                      </div>
                    </object>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Mentor Evaluation View: 2-Column Side-by-Side Review Grid */
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* Left: Unobstructed Certificate Canvas with Controls */}
            <div className="lg:col-span-7 p-3 sm:p-4 bg-slate-900/5 flex flex-col items-center justify-between min-h-[460px]">
              {/* Orientation Toolbar */}
              <div className="w-full flex items-center justify-between bg-slate-900 text-white px-3 py-1.5 rounded-xl mb-3 text-xs shadow-xs">
                <span className="text-[11px] font-semibold text-slate-300">Certificate Document Proof</span>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-md text-[11px] font-medium transition cursor-pointer"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Rotate ({rotation}°)</span>
                </button>
              </div>

              {/* Viewport Canvas */}
              <div className="w-full flex-1 bg-white rounded-xl shadow-inner border border-slate-200 overflow-hidden relative p-3 min-h-[400px] flex items-center justify-center">
                <div
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.15s ease-out',
                  }}
                  className="max-w-full max-h-[520px] flex items-center justify-center overflow-auto"
                >
                  {isSvgOrImage ? (
                    <img
                      src={getAuthenticatedFileUrl(activeSubmission.file_url)}
                      alt={activeSubmission.activity_title}
                      className="max-h-[480px] w-auto object-contain rounded shadow-xs"
                    />
                  ) : (
                    <object
                      data={`${getAuthenticatedFileUrl(activeSubmission.file_url)}#toolbar=0&navpanes=0`}
                      type="application/pdf"
                      className="w-[640px] h-[480px] max-w-full border-0 rounded-lg bg-white shadow-xs"
                    >
                      <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-50 border border-slate-200 rounded-xl max-w-md">
                        <FileText className="w-12 h-12 text-indigo-500" />
                        <div>
                          <p className="text-sm font-bold text-slate-800">PDF Inline Preview Blocked</p>
                          <p className="text-xs text-slate-500 mt-1">This browser environment requires direct document streaming.</p>
                        </div>
                        <a
                          href={getAuthenticatedFileUrl(activeSubmission.file_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-xs transition cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Open PDF In Dedicated Viewer</span>
                        </a>
                      </div>
                    </object>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Focused Review & Action Panel */}
            <div className="lg:col-span-5 p-3.5 sm:p-4 flex flex-col justify-between space-y-3 bg-white overflow-y-auto">
              <div className="space-y-3">
                {/* 1. Student & Activity Overview Card */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {activeSubmission.student_name || 'Enrolled Student'}
                        </span>
                        {activeSubmission.student_roll_no && (
                          <span className="text-[11px] font-mono text-slate-500 font-normal shrink-0">
                            ({activeSubmission.student_roll_no})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {activeSubmission.category_name}
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded shrink-0">
                      +
                      {activeSubmission.status === 'approved'
                        ? activeSubmission.points_awarded
                        : activeSubmission.base_points || 20}{' '}
                      pts
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{activeSubmission.hours_spent || 40} Hours</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{activeSubmission.completion_date}</span>
                    </span>
                  </div>

                  {activeSubmission.submitted_at && (
                    <div className="text-[10px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                      <span className="font-medium text-slate-700">Submitted at:</span>
                      <span className="font-mono">
                        {new Date(activeSubmission.submitted_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}

                  {activeSubmission.description && (
                    <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200 mt-1">
                      <strong className="text-slate-800">Student Note:</strong>{' '}
                      {activeSubmission.description}
                    </div>
                  )}
                </div>

                {/* 2. Action Error Banner */}
                {actionError && (
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 mt-0.5" />
                    <span>{actionError}</span>
                  </div>
                )}

                {/* 3. Faculty Evaluation / Sign-off Box */}
                {canReview && (activeSubmission.status === 'pending' || isReEvaluating) ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        Points Awarded
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={customPointsInput}
                          onChange={(e) =>
                            setCustomPointsInput(Number(e.target.value))
                          }
                          className="w-16 px-2 py-1 text-xs text-right font-mono font-bold bg-white border border-slate-300 rounded-md focus:border-indigo-500 outline-hidden"
                        />
                        <span className="text-xs text-slate-500 font-medium">pts</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">
                        Mentor Feedback / Remarks{' '}
                        {showRejectBox ? (
                          <span className="text-rose-600 font-bold">*</span>
                        ) : (
                          '(Optional)'
                        )}
                      </label>
                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder={
                          showRejectBox
                            ? 'Specify reason for return/rejection...'
                            : 'Enter commendation or verification remarks...'
                        }
                        rows={2}
                        className="w-full text-xs p-2 rounded-lg bg-white border border-slate-300 focus:border-indigo-500 outline-hidden resize-none"
                      />
                    </div>
                  </div>
                ) : (
                  activeSubmission.mentor_feedback && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <span className="font-semibold text-slate-800 block mb-0.5 text-[11px]">
                        Mentor Feedback / Remarks:
                      </span>
                      <p className="text-slate-600 text-xs italic">
                        "{activeSubmission.mentor_feedback}"
                      </p>
                    </div>
                  )
                )}
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-end gap-2">
                {canReview && activeSubmission.status === 'pending' ? (
                  <>
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
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                        >
                          Back
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
                  </>
                ) : canReview && isReEvaluating ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsReEvaluating(false)}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    {!showRejectBox ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowRejectBox(true)}
                          disabled={isSubmitting}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                        >
                          Revoke / Reject
                        </button>
                        <button
                          type="button"
                          onClick={handleApprove}
                          disabled={isSubmitting}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Update Evaluation (+{customPointsInput} pts)</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowRejectBox(false)}
                          disabled={isSubmitting}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={handleReject}
                          disabled={isSubmitting}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Confirm Revoke / Reject</span>
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {canReview && onReview && (
                      <button
                        type="button"
                        onClick={() => setIsReEvaluating(true)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-amber-700" />
                        <span>Re-evaluate / Modify</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                    >
                      Close
                    </button>
                  </>
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
