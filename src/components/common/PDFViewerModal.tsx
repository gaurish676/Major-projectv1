import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Bot,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { Submission, AIAuditResult } from '../../types';
import { StatusBadge } from './Badge';
import { apiRequest } from '../../lib/api';

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission | null;
  onReview?: (action: 'approve' | 'reject', feedback?: string) => Promise<void>;
  canReview?: boolean;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  isOpen,
  onClose,
  submission,
  onReview,
  canReview = false,
}) => {
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // AI Audit State
  const [auditResult, setAuditResult] = useState<AIAuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  useEffect(() => {
    if (submission) {
      if (submission.ai_audit_results) {
        try {
          const parsed = typeof submission.ai_audit_results === 'string'
            ? JSON.parse(submission.ai_audit_results)
            : submission.ai_audit_results;
          setAuditResult(parsed);
        } catch {
          setAuditResult(null);
        }
      } else {
        setAuditResult(null);
      }
      setFeedbackText('');
      setActionError(null);
      setAuditError(null);
    }
  }, [submission]);

  if (!isOpen || !submission) return null;

  const isSvgOrImage =
    submission.file_url.endsWith('.svg') ||
    submission.file_url.endsWith('.png') ||
    submission.file_url.endsWith('.jpg') ||
    submission.file_url.endsWith('.jpeg') ||
    submission.file_url.endsWith('.webp');

  const handleRunAiAudit = async () => {
    setIsAuditing(true);
    setAuditError(null);
    try {
      const res = await apiRequest<{ success: boolean; audit: AIAuditResult }>(
        `/api/submissions/${submission.id}/ai-audit`,
        { method: 'POST' }
      );
      if (res.audit) {
        setAuditResult(res.audit);
      }
    } catch (err: any) {
      setAuditError(err.message || 'Failed to complete AI verification');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleApplyAiPoints = () => {
    if (auditResult?.recommended_points) {
      setFeedbackText(
        `Verified with AI Check (${auditResult.authenticity_status || 'VERIFIED'}). Credential: ${auditResult.certificate_title || submission.activity_title} issued by ${auditResult.issuing_organization || 'Issuer'}.`
      );
    }
  };

  const handleApprove = async () => {
    if (!onReview) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      await onReview('approve', feedbackText || 'Verified against institutional criteria.');
      onClose();
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!onReview) return;
    if (!feedbackText.trim()) {
      setActionError('Feedback remarks are required when returning a submission.');
      return;
    }
    setIsSubmitting(true);
    setActionError(null);
    try {
      await onReview('reject', feedbackText);
      onClose();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm sm:text-base flex items-center gap-2">
                  <span>Certificate & Evidence Viewer</span>
                  <StatusBadge status={submission.status} />
                </h3>
                <p className="text-xs text-slate-400 truncate max-w-md">
                  {submission.activity_title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <a
                href={submission.file_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Open File</span>
              </a>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Body */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* Left: Certificate Preview */}
            <div className="lg:col-span-7 p-3 sm:p-4 bg-slate-50/70 flex flex-col items-center justify-center min-h-[320px]">
              <div className="w-full bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden relative group">
                {isSvgOrImage ? (
                  <img
                    src={submission.file_url}
                    alt={submission.activity_title}
                    className="w-full h-auto object-contain max-h-[460px]"
                  />
                ) : (
                  <iframe
                    src={submission.file_url}
                    title="PDF Certificate"
                    className="w-full h-[400px] border-0"
                  />
                )}

                {/* Verification Badge */}
                <div className="absolute bottom-2.5 right-2.5 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-emerald-700 shadow-2xs flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Digitally Verified ✓</span>
                </div>
              </div>
            </div>

            {/* Right: Details & Verification Panel */}
            <div className="lg:col-span-5 p-3.5 sm:p-4 flex flex-col justify-between space-y-3 bg-white overflow-y-auto">
              <div className="space-y-3">
                {/* Meta details */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Activity Information
                  </h4>

                  <div className="space-y-1.5 text-xs">
                    {submission.student_name && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-slate-500 flex items-center gap-1.5 text-xs font-medium">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" /> Student:
                        </span>
                        <span className="font-semibold text-slate-800 text-xs">
                          {submission.student_name} {submission.student_roll_no ? `(${submission.student_roll_no})` : ''}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 flex items-center gap-1.5 text-xs font-medium">
                        <Tag className="w-3.5 h-3.5 text-slate-400" /> Domain:
                      </span>
                      <span className="font-semibold text-slate-800 text-xs">
                        {submission.category_name || 'Academic Activity'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100">
                      <div className="text-[10px] text-indigo-700 font-semibold mb-0.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-500" /> Activity Category:
                      </div>
                      <div className="font-semibold text-xs text-slate-900">
                        {submission.schema_activity_name || submission.activity_title}
                      </div>
                      <div className="text-[11px] text-indigo-600 font-medium mt-1 flex items-center justify-between">
                        <span>Credit Value: <strong>{submission.base_points ?? submission.points_awarded} points</strong></span>
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                          Eligible
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3.5 h-3.5" /> Date of Completion:
                      </span>
                      <span className="font-medium text-slate-800">{submission.completion_date}</span>
                    </div>

                    {submission.description && (
                      <div className="text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
                        <span className="font-semibold text-slate-900 block mb-0.5">Student Remarks:</span>
                        {submission.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Certificate Verification Card */}
                <div className="p-3 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/60 via-purple-50/30 to-white space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          AI Certificate Check
                        </h4>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRunAiAudit}
                      disabled={isAuditing}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition disabled:opacity-50 cursor-pointer"
                    >
                      <RotateCw className={`w-3 h-3 ${isAuditing ? 'animate-spin' : ''}`} />
                      <span>{isAuditing ? 'Checking...' : auditResult ? 'Re-Check' : 'Verify with AI'}</span>
                    </button>
                  </div>

                  {auditError && (
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{auditError}</span>
                    </div>
                  )}

                  {auditResult ? (
                    <div className="space-y-2 text-xs pt-1">
                      {/* Authenticity status */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-indigo-100 shadow-2xs">
                        <div className="flex items-center gap-1.5">
                          {auditResult.authenticity_status === 'VERIFIED' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              VERIFIED AUTHENTIC
                            </span>
                          ) : auditResult.authenticity_status === 'SUSPICIOUS' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              REQUIRES VERIFICATION
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                              INCONCLUSIVE
                            </span>
                          )}
                        </div>
                        {auditResult.confidence_score !== undefined && (
                          <div className="text-[11px] text-slate-500 font-medium">
                            Match Score: <strong className="text-slate-800">{auditResult.confidence_score}%</strong>
                          </div>
                        )}
                      </div>

                      {/* Details Breakdown */}
                      <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1 text-slate-700 text-[11px]">
                        {auditResult.student_name && (
                          <div className="flex items-start justify-between">
                            <span className="text-slate-500">Name on Document:</span>
                            <span className="font-semibold text-slate-900 text-right">{auditResult.student_name}</span>
                          </div>
                        )}
                        {auditResult.issuing_organization && (
                          <div className="flex items-start justify-between">
                            <span className="text-slate-500">Issued By:</span>
                            <span className="font-semibold text-slate-800 text-right">{auditResult.issuing_organization}</span>
                          </div>
                        )}
                        {auditResult.certificate_title && (
                          <div className="flex items-start justify-between">
                            <span className="text-slate-500">Recognized Title:</span>
                            <span className="font-medium text-slate-800 text-right max-w-[200px] truncate">{auditResult.certificate_title}</span>
                          </div>
                        )}
                        {auditResult.recommended_points !== undefined && (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                            <span className="text-slate-500">Calculated Points:</span>
                            <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              +{auditResult.recommended_points} pts
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Quick Apply Button */}
                      {canReview && submission.status === 'pending' && (
                        <button
                          type="button"
                          onClick={handleApplyAiPoints}
                          className="w-full py-1.5 px-2 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Insert AI Findings into Feedback</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      Click <strong>Verify with AI</strong> to automatically inspect this document for authenticity, student name match, and credit eligibility.
                    </p>
                  )}
                </div>

                {/* Error Banner */}
                {actionError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 mt-0.5" />
                    <span>{actionError}</span>
                  </div>
                )}

                {/* Faculty Evaluation Review Box */}
                {canReview && submission.status === 'pending' && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      Faculty Review & Decision
                    </h4>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Mentor Feedback {showRejectBox ? <span className="text-rose-600">*</span> : '(Optional)'}
                      </label>
                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder={
                          showRejectBox
                            ? 'Specify reasons for return/rejection...'
                            : 'Enter comments or commendations...'
                        }
                        rows={2}
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-end gap-2">
                {canReview && submission.status === 'pending' ? (
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
                          <span>Approve (+{submission.base_points || 20} pts)</span>
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
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer"
                  >
                    Close Preview
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
