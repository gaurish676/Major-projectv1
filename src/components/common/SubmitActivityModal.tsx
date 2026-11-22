import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Upload,
  Camera,
  Calendar,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  FileText,
  Bot,
  RotateCw,
  ShieldCheck,
  ArrowRight,
  Edit3,
  Award,
  ChevronDown,
  Tag,
  Folder,
  Layers,
  Info,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Submission, AIAuditResult, DuplicateInfo } from '../../types';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES, getCategoryPlainName, getCategoryEmoji } from '../../lib/categories';

interface SubmitActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newSubmission: Submission) => void;
}

export const SubmitActivityModal: React.FC<SubmitActivityModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();

  // Form State
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('cat_cert');
  const [hoursSpent, setHoursSpent] = useState<number>(40);
  const [expectedPoints, setExpectedPoints] = useState(25);
  const [semester, setSemester] = useState<number>(user?.semester || 6);
  const [isDetailsEditable, setIsDetailsEditable] = useState(false);

  useEffect(() => {
    if (user?.semester) {
      setSemester(user.semester);
    }
  }, [user]);

  // File & AI Vision State
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiAuditPreview, setAiAuditPreview] = useState<AIAuditResult | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<number | null>(null);
  const [uploadedFileHash, setUploadedFileHash] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Annual Certificate Policy State (Strict AICTE / VTU 1-per-year limitation for any certificate kind)
  const [annualPolicyNotice, setAnnualPolicyNotice] = useState<{
    hasPolicyRestriction: boolean;
    eligible: boolean;
    message: string;
    targetYear: number;
  } | null>(null);

  // Check Annual Certificate Policy whenever eventName, categoryId, semester, or eventDate changes
  useEffect(() => {
    if (!eventName.trim() || eventName.trim().length < 3) {
      setAnnualPolicyNotice(null);
      return;
    }

    const checkPolicy = async () => {
      try {
        const res = await apiRequest<{
          eligible: boolean;
          target_year: number;
          message: string;
          existing_submission?: any;
        }>(`/api/submissions/check-annual-eligibility?activity_title=${encodeURIComponent(eventName.trim())}&semester=${semester}&date=${eventDate}`);

        if (!res.eligible) {
          setAnnualPolicyNotice({
            hasPolicyRestriction: true,
            eligible: false,
            message: res.message,
            targetYear: res.target_year,
          });
        } else {
          setAnnualPolicyNotice({
            hasPolicyRestriction: false,
            eligible: true,
            message: `Eligible for Year ${res.target_year} (1 claim permitted per academic year).`,
            targetYear: res.target_year,
          });
        }
      } catch {
        setAnnualPolicyNotice(null);
      }
    };

    const timer = setTimeout(checkPolicy, 300);
    return () => clearTimeout(timer);
  }, [eventName, categoryId, semester, eventDate]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Trigger automated AI upload & scan immediately when a file is chosen/dropped/snapped
  const processSelectedFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMessage(null);
    setAiAuditPreview(null);
    setUploadedFileUrl(null);
    setUploadedFileHash(null);
    setDuplicateWarning(null);

    // Create local image preview if image
    if (selectedFile.type.startsWith('image/') || selectedFile.name.endsWith('.svg')) {
      setFilePreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setFilePreviewUrl(null);
    }

    // Automatically trigger upload & Gemini Vision parsing
    setIsAiScanning(true);
    try {
      // 1. Upload file and compute SHA-256 binary hash
      const formData = new FormData();
      formData.append('file', selectedFile);
      const uploadRes = await apiRequest<{
        file_url: string;
        file_name: string;
        file_size: number;
        file_hash?: string;
        is_duplicate?: boolean;
        duplicate_info?: DuplicateInfo | null;
      }>(
        '/api/submissions/upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      setUploadedFileUrl(uploadRes.file_url);
      setUploadedFileName(uploadRes.file_name);
      setUploadedFileSize(uploadRes.file_size);
      if (uploadRes.file_hash) {
        setUploadedFileHash(uploadRes.file_hash);
      }

      // If binary hash matches an existing submission, immediately flag duplicate
      if (uploadRes.is_duplicate && uploadRes.duplicate_info) {
        setDuplicateWarning(uploadRes.duplicate_info);
      }

      // 2. Call Gemini AI Multimodal Vision for semantic parsing
      const audit = await apiRequest<AIAuditResult>('/api/submissions/ai-audit-file', {
        method: 'POST',
        body: JSON.stringify({ file_url: uploadRes.file_url }),
      });

      setAiAuditPreview(audit);

      // Check if semantic audit uncovered credential reuse
      if (audit.duplicate_credential_info) {
        setDuplicateWarning(audit.duplicate_credential_info);
      }

      // Auto-fill form fields
      if (audit.certificate_title) {
        setEventName(audit.certificate_title);
      }
      if (audit.issue_date && /^\d{4}-\d{2}-\d{2}$/.test(audit.issue_date)) {
        setEventDate(audit.issue_date);
      }
      if (audit.category_id && CATEGORIES[audit.category_id]) {
        setCategoryId(audit.category_id);
      }
      if (audit.recommended_points) {
        setExpectedPoints(audit.recommended_points);
      }
    } catch (err: any) {
      console.warn('AI Vision scan note:', err);
      // Fallback: auto-fill from filename
      const plainTitle = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setEventName(plainTitle.toUpperCase());
    } finally {
      setIsAiScanning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (duplicateWarning) {
      setErrorMessage(duplicateWarning.message);
      return;
    }

    if (annualPolicyNotice && !annualPolicyNotice.eligible) {
      setErrorMessage(annualPolicyNotice.message);
      return;
    }

    if (!file && !uploadedFileUrl) {
      setErrorMessage('Please snap a photo or drop your certificate first.');
      return;
    }
    if (!eventName.trim()) {
      setErrorMessage('Please provide the certificate / event name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalFileUrl = uploadedFileUrl || '/uploads/nptel_cloud_computing_elite.svg';
      const finalFileName = uploadedFileName || file?.name || 'certificate.svg';
      const finalFileSize = uploadedFileSize || file?.size || 1048576;

      const newSubmission = await apiRequest<Submission>('/api/submissions', {
        method: 'POST',
        body: JSON.stringify({
          activity_title: eventName.trim(),
          category_id: categoryId,
          hours_spent: Number(hoursSpent),
          file_url: finalFileUrl,
          file_name: finalFileName,
          file_size: finalFileSize,
          file_hash: uploadedFileHash,
          completion_date: eventDate,
          semester: Number(semester) || (user?.semester || 1),
          ai_audit_results: aiAuditPreview,
        }),
      });

      // Confetti celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Dispatch global submission event for live dashboard synchronization
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('submission-created', { detail: newSubmission }));
      }

      onSuccess(newSubmission);
      onClose();

      // Reset
      setEventName('');
      setFile(null);
      setFilePreviewUrl(null);
      setAiAuditPreview(null);
      setUploadedFileUrl(null);
      setUploadedFileHash(null);
      setDuplicateWarning(null);
      setIsDetailsEditable(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit activity certificate');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCategory = CATEGORIES[categoryId] || CATEGORIES.cat_cert;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[90vh]"
          >
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-[#0B1329] via-[#0F1E4A] to-[#0B1329] text-white flex items-center justify-between border-b border-slate-800/80 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-sky-300">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <span>Smart AI Certificate Upload</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    Drop & Done
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Drop certificate or snap photo — Gemini AI reads & fills everything in 1 second
                </p>
                <div className="flex items-center gap-1.5 pt-1 text-[11px] text-emerald-300 font-medium">
                  <span>Reviewing Mentor:</span>
                  <span className="font-bold text-white bg-emerald-800/60 px-2 py-0.2 rounded border border-emerald-500/40">
                    {user?.mentor_name ? `Prof. ${user.mentor_name}` : 'Assigned Faculty Mentor'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Hidden Input Handles */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.svg"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* STEP 1: DROP / SNAP ZONE (When no file or before scan) */}
            {!file && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/80 scale-[1.01]'
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-slate-50'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <Upload className="w-6 h-6" />
                </div>

                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  Upload or Drop Certificate File
                </h4>
                <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                  Works with PDF certificates, screenshots, or physical certificates taken with your phone camera.
                </p>

                {/* 2 Big Friendly Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-md mx-auto">
                  {/* Camera Snap Button */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Photo with Phone</span>
                  </button>

                  {/* Browse File Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Choose PDF or Image</span>
                  </button>
                </div>
              </div>
            )}

            {/* SCANNING ACTIVE INDICATOR */}
            {isAiScanning && (
              <div className="bg-indigo-900 text-white rounded-2xl p-5 border border-indigo-700 text-center space-y-3 relative overflow-hidden shadow-lg">
                <div className="w-10 h-10 rounded-full bg-indigo-500/30 text-amber-300 flex items-center justify-center mx-auto animate-spin">
                  <RotateCw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                    <span>Gemini AI is reading your certificate...</span>
                  </h4>
                  <p className="text-xs text-indigo-200 mt-1">
                    Extracting Event Name, Date, Category, and matching Degree Credits in 1 second.
                  </p>
                </div>
                <div className="w-full bg-indigo-950/80 rounded-full h-1.5 overflow-hidden border border-indigo-700">
                  <div className="h-full bg-gradient-to-r from-indigo-400 via-amber-300 to-emerald-400 w-full animate-pulse" />
                </div>
              </div>
            )}

            {/* STEP 2: AI AUTO-FILLED DETAILS CARD (Looks correct?) */}
            {file && !isAiScanning && (
              <div className="space-y-3">
                {/* Real-time Duplicate Certificate Alert Banner */}
                {duplicateWarning && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border-2 border-rose-400 text-rose-950 space-y-2 shadow-xs animate-in fade-in slide-in-from-top duration-300">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-rose-600 text-white shrink-0 mt-0.5 shadow-sm">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-rose-900 text-sm">
                            {duplicateWarning.type === 'collusion'
                              ? 'Academic Integrity Alert: Duplicate Document'
                              : duplicateWarning.type === 'credential_id'
                              ? 'Duplicate Credential ID Detected'
                              : 'Duplicate Certificate Already Submitted'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 font-mono text-[10px] font-bold uppercase shrink-0">
                            BLOCKED
                          </span>
                        </div>
                        <p className="mt-1 text-rose-800 leading-relaxed font-medium">
                          {duplicateWarning.message}
                        </p>
                        {duplicateWarning.activity_title && (
                          <div className="mt-2 pt-2 border-t border-rose-200/80 text-[11px] text-rose-700 flex flex-wrap gap-x-4 gap-y-1">
                            <span><strong>Activity:</strong> {duplicateWarning.activity_title}</span>
                            {duplicateWarning.submitted_at && (
                              <span><strong>Submitted On:</strong> {new Date(duplicateWarning.submitted_at).toLocaleDateString()}</span>
                            )}
                            {duplicateWarning.status && (
                              <span><strong>Status:</strong> {duplicateWarning.status.toUpperCase()}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Visual AI Banner */}
                <div className="bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-emerald-500/10 border border-emerald-300 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs text-emerald-950">
                        AI Auto-Detected Details:
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsDetailsEditable(!isDetailsEditable)}
                      className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isDetailsEditable ? 'Lock Fields' : 'Edit Details'}</span>
                    </button>
                  </div>

                  {/* Auto-filled Summary Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs bg-white rounded-xl p-3 border border-emerald-200/80 shadow-2xs">
                    {/* Event Name */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        <span>Event / Certification Name</span>
                      </label>
                      {isDetailsEditable ? (
                        <input
                          type="text"
                          value={eventName}
                          onChange={(e) => setEventName(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                          placeholder="e.g. NPTEL Cloud Computing (Elite)"
                        />
                      ) : (
                        <div className="font-bold text-slate-900 text-xs sm:text-sm bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                          {eventName || 'Recognized Activity'}
                        </div>
                      )}
                    </div>

                    {/* Category Domain */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Folder className="w-3 h-3 text-slate-400" />
                        <span>Auto-Detected Category</span>
                      </label>
                      {isDetailsEditable ? (
                        <select
                          value={categoryId}
                          onChange={(e) => setCategoryId(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-hidden bg-white"
                        >
                          {Object.values(CATEGORIES).map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className={`px-2.5 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 ${currentCategory.bgColor} ${currentCategory.borderColor} ${currentCategory.textColor}`}>
                          <Folder className="w-3.5 h-3.5" />
                          <span className="truncate">{currentCategory.name}</span>
                        </div>
                      )}
                    </div>

                    {/* Date */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Completion Date</span>
                      </label>
                      {isDetailsEditable ? (
                        <input
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                        />
                      ) : (
                        <div className="font-mono text-xs text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 font-semibold">
                          {eventDate}
                        </div>
                      )}
                    </div>

                    {/* Activity Hours / Duration (Aishu - Activity points per hour requirement) */}
                    <div className="space-y-1 sm:col-span-2 bg-blue-50/70 p-3 rounded-xl border border-blue-200/80">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>Activity Duration / Hours Spent</span>
                        </label>
                        <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full border border-blue-300/60">
                          {hoursSpent} Hours = {expectedPoints} Points (~{(expectedPoints / Math.max(1, hoursSpent)).toFixed(2)} pts/hr)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="number"
                          min={1}
                          max={500}
                          value={hoursSpent}
                          onChange={(e) => {
                            const val = Math.max(1, Number(e.target.value));
                            setHoursSpent(val);
                            // Standard institutional formula: ~0.50 pts per hour (40 hrs = 20 pts, 80 hrs = 40 pts)
                            const calculated = Math.min(50, Math.max(5, Math.round(val * 0.5)));
                            setExpectedPoints(calculated);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-blue-300 bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-hidden"
                          placeholder="e.g. 40 hours for NSS / 80 hours for Internship"
                        />
                        <div className="shrink-0 flex gap-1">
                          {[20, 40, 80].map((quickHr) => (
                            <button
                              key={quickHr}
                              type="button"
                              onClick={() => {
                                setHoursSpent(quickHr);
                                setExpectedPoints(Math.round(quickHr * 0.5));
                              }}
                              className={`px-2 py-1 text-[10px] font-semibold rounded-md border transition cursor-pointer ${
                                hoursSpent === quickHr
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                              }`}
                            >
                              {quickHr}h
                            </button>
                          ))}
                        </div>
                      </div>
                      <p className="text-[10px] text-blue-800 leading-tight">
                        ⚡ AICTE / VTU Regulation: NSS/Social=40h (20 pts), Internship=80h (40 pts), Workshops=20h (10 pts).
                      </p>
                    </div>

                    {/* Semester Attribution */}
                    <div className="space-y-1 sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3 text-slate-400" />
                          <span>Applicable Semester</span>
                        </span>
                        <span className="text-[10px] text-indigo-600 font-medium lowercase">
                          (Max 30 credits / semester limit)
                        </span>
                      </label>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                          <button
                            key={sem}
                            type="button"
                            onClick={() => setSemester(sem)}
                            className={`py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer text-center ${
                              semester === sem
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                            }`}
                          >
                            Sem {sem}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Annual Certificate Limit Policy Notice (Enforced for all certificate kinds) */}
                    {annualPolicyNotice && !annualPolicyNotice.eligible && (
                      <div className="sm:col-span-2 p-3 rounded-xl border text-xs flex items-start gap-2.5 transition bg-rose-50 border-rose-300 text-rose-900">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <div className="font-bold flex items-center gap-1.5">
                            <span>Annual Certificate Policy (Max 1 per Academic Year)</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-rose-600 text-white uppercase tracking-wider">
                              Limit Reached for Year {annualPolicyNotice.targetYear}
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed">
                            {annualPolicyNotice.message}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Expected Points Preview */}
                    <div className="sm:col-span-2 flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950">
                      <div className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-600" />
                        <div>
                          <span className="font-semibold text-xs block">Expected Activity Credit:</span>
                          <span className="text-[10px] text-emerald-800">
                            Counted towards Semester {semester} (Semester cap: 30 pts)
                          </span>
                        </div>
                      </div>
                      <span className="font-extrabold font-mono text-sm text-emerald-700 bg-white px-2.5 py-0.5 rounded-md border border-emerald-300 shadow-2xs">
                        +{expectedPoints} Points
                      </span>
                    </div>
                  </div>

                  {/* Uploaded Proof Preview Strip */}
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                        PROOF
                      </span>
                      <span className="truncate text-slate-800 font-medium">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setFilePreviewUrl(null);
                        setAiAuditPreview(null);
                        setUploadedFileUrl(null);
                        setUploadedFileHash(null);
                        setDuplicateWarning(null);
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 shrink-0 cursor-pointer"
                    >
                      Change Photo
                    </button>
                  </div>
                </div>

                {/* Submit / Blocked Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !!duplicateWarning || (annualPolicyNotice !== null && !annualPolicyNotice.eligible)}
                  className={`w-full py-3.5 px-4 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition transform active:scale-[0.99] cursor-pointer ${
                    duplicateWarning || (annualPolicyNotice && !annualPolicyNotice.eligible)
                      ? 'bg-rose-600/90 text-white cursor-not-allowed hover:bg-rose-600 shadow-md shadow-rose-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Submitting to Mentor...</span>
                    </>
                  ) : duplicateWarning ? (
                    <>
                      <ShieldAlert className="w-5 h-5" />
                      <span>
                        {duplicateWarning.type === 'collusion'
                          ? 'Submission Blocked (Collusion Detected)'
                          : 'Submission Blocked (Duplicate Certificate)'}
                      </span>
                    </>
                  ) : (annualPolicyNotice && !annualPolicyNotice.eligible) ? (
                    <>
                      <ShieldAlert className="w-5 h-5" />
                      <span>Submission Blocked: Certificate Kind Already Claimed for Year {annualPolicyNotice.targetYear}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Submit to Mentor for Verification</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);
};
