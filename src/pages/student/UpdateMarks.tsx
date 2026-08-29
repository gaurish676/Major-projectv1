import React, { useState, useEffect, useMemo } from 'react';
import { SubjectMark, MarksSummary, MarksResponse } from '../../types';
import { apiRequest } from '../../lib/api';
import {
  GraduationCap,
  Plus,
  Trash2,
  Edit3,
  BookOpen,
  FlaskConical,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  BarChart3,
  Percent,
  Award,
  RefreshCw,
  Save,
  Check,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';

interface BatchSubjectRow {
  tempId: string;
  subject_code: string;
  subject_name: string;
  credits: number;
  theory_marks: number;
  theory_max: number;
  task_marks: number;
  task_max: number;
  has_lab: boolean;
  lab_marks: number;
  lab_max: number;
}

export const UpdateMarks: React.FC = () => {
  const [semester, setSemester] = useState<number>(6);
  const [marks, setMarks] = useState<SubjectMark[]>([]);
  const [summary, setSummary] = useState<MarksSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit-All Mode state (allows editing all subjects on the screen at once)
  const [isEditAllMode, setIsEditAllMode] = useState<boolean>(false);
  const [editAllDrafts, setEditAllDrafts] = useState<Record<string, SubjectMark>>({});

  // Batch Add Modal State (allows entering multiple subjects once and submitting together)
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [batchRows, setBatchRows] = useState<BatchSubjectRow[]>([]);

  // Delete All Confirmation Modal State
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState<boolean>(false);

  // Single Delete confirmation
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null);
  const [singleDeleteName, setSingleDeleteName] = useState<string>('');

  const fetchMarks = async (sem: number = semester) => {
    try {
      setIsLoading(true);
      const res = await apiRequest<MarksResponse>(`/api/student/marks?semester=${sem}`);
      const fetchedMarks = res.marks || [];
      setMarks(fetchedMarks);
      setSummary(res.summary || null);

      // Initialize editAllDrafts
      const draftMap: Record<string, SubjectMark> = {};
      fetchedMarks.forEach((m) => {
        draftMap[m.id] = { ...m };
      });
      setEditAllDrafts(draftMap);

      // If no marks for this semester yet, auto seed standard defaults for demo student
      if (fetchedMarks.length === 0) {
        try {
          await apiRequest('/api/student/marks/seed-defaults', {
            method: 'POST',
            body: JSON.stringify({ semester: sem }),
          });
          const reRes = await apiRequest<MarksResponse>(`/api/student/marks?semester=${sem}`);
          setMarks(reRes.marks || []);
          setSummary(reRes.summary || null);
          const newDraftMap: Record<string, SubjectMark> = {};
          (reRes.marks || []).forEach((m) => {
            newDraftMap[m.id] = { ...m };
          });
          setEditAllDrafts(newDraftMap);
        } catch {
          // ignore if manual empty entry desired
        }
      }
    } catch (err: any) {
      console.error('Failed to load marks:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to load marks' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsEditAllMode(false);
    fetchMarks(semester);
  }, [semester]);

  // Handle opening Batch Add Modal with default empty rows
  const handleOpenBatchAdd = () => {
    const initialRows: BatchSubjectRow[] = [
      {
        tempId: `row_${Date.now()}_1`,
        subject_code: '',
        subject_name: '',
        credits: 4,
        theory_marks: 75,
        theory_max: 100,
        task_marks: 20,
        task_max: 25,
        has_lab: false,
        lab_marks: 0,
        lab_max: 50,
      },
      {
        tempId: `row_${Date.now()}_2`,
        subject_code: '',
        subject_name: '',
        credits: 4,
        theory_marks: 80,
        theory_max: 100,
        task_marks: 22,
        task_max: 25,
        has_lab: true,
        lab_marks: 45,
        lab_max: 50,
      },
    ];
    setBatchRows(initialRows);
    setIsBatchModalOpen(true);
  };

  const handleAddBatchRow = () => {
    setBatchRows((prev) => [
      ...prev,
      {
        tempId: `row_${Date.now()}_${prev.length + 1}`,
        subject_code: '',
        subject_name: '',
        credits: 4,
        theory_marks: 75,
        theory_max: 100,
        task_marks: 20,
        task_max: 25,
        has_lab: false,
        lab_marks: 0,
        lab_max: 50,
      },
    ]);
  };

  const handleRemoveBatchRow = (tempId: string) => {
    if (batchRows.length <= 1) {
      setMessage({ type: 'error', text: 'At least one subject row is required.' });
      return;
    }
    setBatchRows((prev) => prev.filter((r) => r.tempId !== tempId));
  };

  const handleUpdateBatchRow = (tempId: string, field: keyof BatchSubjectRow, value: any) => {
    setBatchRows((prev) =>
      prev.map((r) => (r.tempId === tempId ? { ...r, [field]: value } : r))
    );
  };

  // Submit all batch rows in ONE single click
  const handleSaveAllBatch = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter valid rows that have subject name
    const validRows = batchRows.filter((r) => r.subject_name.trim().length > 0);

    if (validRows.length === 0) {
      setMessage({ type: 'error', text: 'Please enter at least one subject name before submitting.' });
      return;
    }

    try {
      setIsSaving(true);
      await apiRequest('/api/student/marks/batch', {
        method: 'POST',
        body: JSON.stringify({
          semester,
          subjects: validRows,
        }),
      });

      setMessage({
        type: 'success',
        text: `Successfully added ${validRows.length} subject(s) in a single submission!`,
      });
      setIsBatchModalOpen(false);
      fetchMarks(semester);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to batch save subjects' });
    } finally {
      setIsSaving(false);
    }
  };

  // Turn ON Edit-All Mode
  const handleEnableEditAll = () => {
    const draftMap: Record<string, SubjectMark> = {};
    marks.forEach((m) => {
      draftMap[m.id] = { ...m };
    });
    setEditAllDrafts(draftMap);
    setIsEditAllMode(true);
  };

  // Cancel Edit-All Mode
  const handleCancelEditAll = () => {
    const draftMap: Record<string, SubjectMark> = {};
    marks.forEach((m) => {
      draftMap[m.id] = { ...m };
    });
    setEditAllDrafts(draftMap);
    setIsEditAllMode(false);
  };

  // Update a single field inside Edit-All draft state
  const handleEditAllDraftChange = (id: string, field: keyof SubjectMark, value: any) => {
    setEditAllDrafts((prev) => {
      const existing = prev[id] || marks.find((m) => m.id === id);
      if (!existing) return prev;

      const updated = { ...existing, [field]: value };

      // Recalculate preview totals and % live
      const theory = Number(updated.theory_marks) || 0;
      const theoryM = Number(updated.theory_max) || 100;
      const task = Number(updated.task_marks) || 0;
      const taskM = Number(updated.task_max) || 25;
      const hasLab = Boolean(updated.has_lab);
      const lab = hasLab ? Number(updated.lab_marks) || 0 : 0;
      const labM = hasLab ? Number(updated.lab_max) || 50 : 0;

      const totalScored = theory + task + lab;
      const totalMax = theoryM + taskM + labM;
      const pct = totalMax > 0 ? Math.round((totalScored / totalMax) * 1000) / 10 : 0;

      let grade = 'F';
      let gp = 0;
      if (pct >= 90) { grade = 'O'; gp = 10; }
      else if (pct >= 80) { grade = 'A+'; gp = 9; }
      else if (pct >= 70) { grade = 'A'; gp = 8; }
      else if (pct >= 60) { grade = 'B+'; gp = 7; }
      else if (pct >= 50) { grade = 'B'; gp = 6; }
      else if (pct >= 40) { grade = 'C'; gp = 5; }

      return {
        ...prev,
        [id]: {
          ...updated,
          total_scored: totalScored,
          total_max: totalMax,
          percentage: pct,
          grade,
          grade_points: gp,
        },
      };
    });
  };

  // Save ALL edited subjects in ONE single click
  const handleSaveAllEditedMarks = async () => {
    try {
      setIsSaving(true);
      const subjectArray = Object.values(editAllDrafts);

      await apiRequest('/api/student/marks/batch-update', {
        method: 'PUT',
        body: JSON.stringify({
          subjects: subjectArray,
        }),
      });

      setMessage({
        type: 'success',
        text: `All ${subjectArray.length} subject marks updated simultaneously!`,
      });
      setIsEditAllMode(false);
      fetchMarks(semester);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update all marks' });
    } finally {
      setIsSaving(false);
    }
  };

  // Single Subject Delete
  const handleConfirmSingleDelete = async () => {
    if (!singleDeleteId) return;
    try {
      await apiRequest(`/api/student/marks/${singleDeleteId}`, { method: 'DELETE' });
      setMessage({ type: 'success', text: `Subject "${singleDeleteName}" deleted.` });
      setSingleDeleteId(null);
      fetchMarks(semester);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete subject' });
    }
  };

  // Delete ALL subjects for semester in ONE single click
  const handleConfirmDeleteAllSemester = async () => {
    try {
      setIsSaving(true);
      await apiRequest(`/api/student/marks/semester/${semester}`, { method: 'DELETE' });
      setMessage({
        type: 'success',
        text: `All subjects for Semester ${semester} have been deleted.`,
      });
      setIsDeleteAllModalOpen(false);
      setIsEditAllMode(false);
      fetchMarks(semester);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete all subjects' });
    } finally {
      setIsSaving(false);
    }
  };

  // Preload syllabus defaults
  const handlePreloadDefaults = async () => {
    try {
      setIsLoading(true);
      await apiRequest('/api/student/marks/seed-defaults', {
        method: 'POST',
        body: JSON.stringify({ semester }),
      });
      setMessage({ type: 'success', text: `Loaded standard Semester ${semester} syllabus subjects.` });
      fetchMarks(semester);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to preload subjects' });
      setIsLoading(false);
    }
  };

  // Compute live preview summary during Edit-All Mode
  const displayedSummary = useMemo(() => {
    if (!isEditAllMode) return summary;

    const subjectList: SubjectMark[] = Object.values(editAllDrafts);
    let totalCredits = 0;
    let weightedGP = 0;
    let totalScored = 0;
    let totalMax = 0;

    subjectList.forEach((s: SubjectMark) => {
      const cr = Number(s.credits) || 0;
      totalCredits += cr;
      weightedGP += (s.grade_points || 0) * cr;
      totalScored += s.total_scored || 0;
      totalMax += s.total_max || 0;
    });

    const sgpa = totalCredits > 0 ? Math.round((weightedGP / totalCredits) * 100) / 100 : 0;
    const overallPct = totalMax > 0 ? Math.round((totalScored / totalMax) * 1000) / 10 : 0;

    return {
      total_subjects: subjectList.length,
      total_credits: totalCredits,
      total_scored: Math.round(totalScored * 10) / 10,
      total_max: Math.round(totalMax * 10) / 10,
      overall_percentage: overallPct,
      sgpa,
    };
  }, [isEditAllMode, editAllDrafts, summary]);

  return (
    <div id="student-marks-main-container" className="space-y-3.5 max-w-7xl mx-auto pb-10">
      {/* Toast Notification */}
      {message && (
        <div
          id="marks-status-toast"
          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-xs transition ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Compact Top Header & Primary Action Controls (Requirement 1, 2, 7) */}
      <div className="bg-[#0B1329] rounded-xl px-4 py-3 sm:py-3.5 text-white border border-slate-800/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white leading-tight">
              Update Subject Marks
            </h1>
            <p className="text-xs text-slate-400">
              Semester marks ledger, CIE task scores, and SGPA calculation
            </p>
          </div>
        </div>

        {/* Primary Controls in Header Only (Requirement 1 & 7) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Semester Selector */}
          <div className="flex items-center bg-slate-900/90 rounded-lg border border-slate-700/80 px-2 py-1">
            <span className="text-xs text-slate-400 mr-1.5 font-medium">Semester:</span>
            <select
              id="select-semester-dropdown"
              value={semester}
              disabled={isEditAllMode}
              onChange={(e) => setSemester(Number(e.target.value))}
              className="bg-slate-800 text-white text-xs font-bold rounded px-2 py-1 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer disabled:opacity-60"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Sem {s}
                </option>
              ))}
            </select>
          </div>

          {/* If NOT in edit-all mode, show Add Subjects (Blue) & Edit Marks (Orange/Amber) */}
          {!isEditAllMode ? (
            <>
              {/* Blue = Primary Action: Add Subjects */}
              <button
                id="btn-add-all-details-once"
                onClick={handleOpenBatchAdd}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 active:scale-95"
                title="Add multiple subjects in one submission"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subjects</span>
              </button>

              {/* Orange/Amber = Edit Action: Edit Marks */}
              {marks.length > 0 && (
                <button
                  id="btn-toggle-edit-all-marks"
                  onClick={handleEnableEditAll}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 active:scale-95"
                  title="Batch edit marks directly on the ledger"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Marks</span>
                </button>
              )}
            </>
          ) : (
            /* In Edit-All Mode: Show Cancel & Save All Changes */
            <div className="flex items-center gap-2">
              <button
                id="btn-cancel-edit-all"
                onClick={handleCancelEditAll}
                disabled={isSaving}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                Cancel
              </button>
              {/* Green = Save/Confirm Action */}
              <button
                id="btn-save-all-changes"
                onClick={handleSaveAllEditedMarks}
                disabled={isSaving}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-white" />
                )}
                <span>Save All Changes</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit All Mode Active Notice Banner (Amber / Orange theme) */}
      {isEditAllMode && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Batch Edit Mode Active:</span> Modify subject details and marks directly in the ledger below. Totals, percentages, grades, and SGPA update in real-time.
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCancelEditAll}
              className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-800 font-semibold text-xs hover:bg-amber-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAllEditedMarks}
              disabled={isSaving}
              className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save All Changes</span>
            </button>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      {displayedSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* SGPA */}
          <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">Projected SGPA</span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-slate-900">
                {displayedSummary.sgpa.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400">/ 10.0</span>
            </div>
            <div className="text-[10px] font-semibold text-emerald-700">
              {displayedSummary.sgpa >= 9
                ? 'Outstanding (O)'
                : displayedSummary.sgpa >= 8
                ? 'Excellent (A+)'
                : displayedSummary.sgpa >= 7
                ? 'Very Good (A)'
                : displayedSummary.sgpa >= 6
                ? 'Good (B+)'
                : 'Passing'}
            </div>
          </div>

          {/* Overall Percentage */}
          <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">Semester Average</span>
              <Percent className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-blue-600">
                {displayedSummary.overall_percentage}%
              </span>
            </div>
            <div className="text-[10px] text-slate-400">Weighted aggregate</div>
          </div>

          {/* Total Marks */}
          <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">Total Scored</span>
              <BarChart3 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-slate-900">
                {displayedSummary.total_scored}
              </span>
              <span className="text-xs text-slate-400">/ {displayedSummary.total_max}</span>
            </div>
            <div className="text-[10px] text-slate-400">Marks accumulated</div>
          </div>

          {/* Total Credits */}
          <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">Curriculum Credits</span>
              <GraduationCap className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-slate-900">
                {displayedSummary.total_credits}
              </span>
              <span className="text-xs text-slate-400">({displayedSummary.total_subjects} subjects)</span>
            </div>
            <div className="text-[10px] text-slate-400">Sem {semester} syllabus</div>
          </div>
        </div>
      )}

      {/* Main Subjects Table & Ledger Section */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Table / Ledger Bar: Contains ONLY Title, Reset, and Delete All (Requirement 1 & 7) */}
        <div className="px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Semester {semester} Subjects Ledger
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              ({marks.length} {marks.length === 1 ? 'subject' : 'subjects'})
            </span>
          </div>

          {/* Ledger secondary controls: ONLY Reset and Delete All (No duplicate Add/Edit buttons) */}
          <div className="flex items-center gap-2">
            {/* Reset / Preload Syllabus */}
            <button
              onClick={handlePreloadDefaults}
              disabled={isEditAllMode}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Reset subjects to standard university syllabus"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset to Syllabus</span>
            </button>

            {/* Red = Delete All Subjects for Semester */}
            {marks.length > 0 && !isEditAllMode && (
              <button
                id="table-btn-delete-all"
                onClick={() => setIsDeleteAllModalOpen(true)}
                className="text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                title="Delete all subjects for this semester"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete All</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Table */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Loading semester subject marks...</span>
          </div>
        ) : marks.length === 0 ? (
          /* Empty State */
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-sm font-bold text-slate-800">No subjects recorded for Semester {semester}</h3>
              <p className="text-xs text-slate-500">
                You can add all subject details or pre-fill standard curriculum subjects with a single click.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={handleOpenBatchAdd}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Subjects</span>
              </button>
              <button
                onClick={handlePreloadDefaults}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Pre-fill Standard Subjects</span>
              </button>
            </div>
          </div>
        ) : isEditAllMode ? (
          /* ========================================================================= */
          /* PROPER BATCH EDIT MODE: Cleanly aligned input fields (Requirement 5)      */
          /* ========================================================================= */
          <div className="p-3 sm:p-4 space-y-3 bg-slate-50/50">
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 min-w-[280px]">Subject & Code *</th>
                    <th className="py-2.5 px-2 w-20 text-center">Credits</th>
                    <th className="py-2.5 px-2 min-w-[140px] text-center">Theory (Score / Max)</th>
                    <th className="py-2.5 px-2 min-w-[140px] text-center">Task / CIE (Score / Max)</th>
                    <th className="py-2.5 px-2 min-w-[180px] text-center">Lab Assessment</th>
                    <th className="py-2.5 px-2 w-24 text-center">Total</th>
                    <th className="py-2.5 px-2 w-20 text-center">%</th>
                    <th className="py-2.5 px-2 w-24 text-center">Grade (GP)</th>
                    <th className="py-2.5 px-2 w-14 text-center">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {marks.map((m, idx) => {
                    const draft = editAllDrafts[m.id] || m;
                    const hasLab = Boolean(draft.has_lab);

                    return (
                      <tr key={m.id} className="hover:bg-amber-50/30 transition">
                        {/* Subject Name & Code Inputs */}
                        <td className="py-2 px-3 align-middle">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <input
                                type="text"
                                required
                                placeholder="Subject Name"
                                value={draft.subject_name}
                                onChange={(e) => handleEditAllDraftChange(m.id, 'subject_name', e.target.value)}
                                className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-semibold text-slate-900 bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            <div className="flex items-center gap-1 pl-6.5">
                              <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">Code:</span>
                              <input
                                type="text"
                                placeholder="e.g. 21CS61"
                                value={draft.subject_code || ''}
                                onChange={(e) => handleEditAllDraftChange(m.id, 'subject_code', e.target.value)}
                                className="w-32 px-1.5 py-0.5 border border-slate-300 rounded text-[11px] font-mono text-slate-700 bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                              />
                            </div>
                          </div>
                        </td>

                        {/* Credits */}
                        <td className="py-2 px-2 text-center align-middle">
                          <select
                            value={draft.credits || 4}
                            onChange={(e) => handleEditAllDraftChange(m.id, 'credits', Number(e.target.value))}
                            className="w-16 px-1 py-1 border border-slate-300 rounded text-xs text-center font-bold bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                          >
                            {[1, 2, 3, 4, 5, 6].map((c) => (
                              <option key={c} value={c}>
                                {c} Cr
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Theory Marks */}
                        <td className="py-2 px-2 text-center align-middle">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={draft.theory_marks}
                              onChange={(e) => handleEditAllDraftChange(m.id, 'theory_marks', Number(e.target.value))}
                              className="w-14 px-1.5 py-1 border border-slate-300 rounded text-xs text-center font-mono font-bold text-slate-900 bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                            <span className="text-slate-400">/</span>
                            <input
                              type="number"
                              min="0"
                              value={draft.theory_max || 100}
                              onChange={(e) => handleEditAllDraftChange(m.id, 'theory_max', Number(e.target.value))}
                              className="w-12 px-1 py-1 border border-slate-200 rounded text-xs text-center font-mono text-slate-500 bg-slate-50 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        </td>

                        {/* Task Marks */}
                        <td className="py-2 px-2 text-center align-middle">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={draft.task_marks}
                              onChange={(e) => handleEditAllDraftChange(m.id, 'task_marks', Number(e.target.value))}
                              className="w-14 px-1.5 py-1 border border-slate-300 rounded text-xs text-center font-mono font-bold text-slate-900 bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                            <span className="text-slate-400">/</span>
                            <input
                              type="number"
                              min="1"
                              value={draft.task_max || 25}
                              onChange={(e) => handleEditAllDraftChange(m.id, 'task_max', Number(e.target.value))}
                              className="w-12 px-1 py-1 border border-slate-200 rounded text-xs text-center font-mono text-slate-500 bg-slate-50 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        </td>

                        {/* Lab Option & Marks */}
                        <td className="py-2 px-2 align-middle">
                          <div className="space-y-1">
                            <label className="flex items-center justify-center gap-1.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={hasLab}
                                onChange={(e) => handleEditAllDraftChange(m.id, 'has_lab', e.target.checked)}
                                className="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer"
                              />
                              <span className="text-[11px] font-semibold text-slate-700">Practical Lab</span>
                            </label>

                            {hasLab ? (
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={draft.lab_marks || 0}
                                  onChange={(e) => handleEditAllDraftChange(m.id, 'lab_marks', Number(e.target.value))}
                                  className="w-14 px-1.5 py-0.5 border border-indigo-300 rounded text-xs text-center font-mono font-bold text-indigo-900 bg-indigo-50/40 focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                                <span className="text-slate-400">/</span>
                                <input
                                  type="number"
                                  min="1"
                                  value={draft.lab_max || 50}
                                  onChange={(e) => handleEditAllDraftChange(m.id, 'lab_max', Number(e.target.value))}
                                  className="w-12 px-1 py-0.5 border border-slate-200 rounded text-xs text-center font-mono text-slate-500 bg-slate-50 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                              </div>
                            ) : (
                              <div className="text-center text-[10px] text-slate-400 italic">None</div>
                            )}
                          </div>
                        </td>

                        {/* Total Live */}
                        <td className="py-2 px-2 text-center align-middle font-mono font-bold text-slate-900 whitespace-nowrap">
                          {draft.total_scored} <span className="text-slate-400 font-normal">/ {draft.total_max}</span>
                        </td>

                        {/* Percentage Live */}
                        <td className="py-2 px-2 text-center align-middle font-mono font-bold whitespace-nowrap">
                          <span
                            className={
                              draft.percentage >= 75
                                ? 'text-emerald-700'
                                : draft.percentage >= 50
                                ? 'text-blue-700'
                                : 'text-amber-700'
                            }
                          >
                            {draft.percentage}%
                          </span>
                        </td>

                        {/* Grade Live */}
                        <td className="py-2 px-2 text-center align-middle whitespace-nowrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold font-mono ${
                              draft.grade === 'O'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                                : draft.grade === 'A+' || draft.grade === 'A'
                                ? 'bg-blue-50 text-blue-800 border border-blue-300'
                                : draft.grade === 'B+' || draft.grade === 'B'
                                ? 'bg-amber-50 text-amber-800 border border-amber-300'
                                : 'bg-slate-100 text-slate-800 border border-slate-300'
                            }`}
                          >
                            {draft.grade} ({draft.grade_points} GP)
                          </span>
                        </td>

                        {/* Single Row Delete Action */}
                        <td className="py-2 px-2 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => {
                              setSingleDeleteId(m.id);
                              setSingleDeleteName(m.subject_name);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete this subject"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Batch Edit Save & Cancel Bar (Requirement 5 & 7) */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="text-xs text-slate-600">
                All {marks.length} subject marks are staged for update. Click <strong>Save All Changes</strong> to commit.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelEditAll}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                {/* Green = Save Action */}
                <button
                  type="button"
                  onClick={handleSaveAllEditedMarks}
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save All Changes</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* STANDARD VIEW MODE: Wider Subject Column, No Cramping (Requirement 3 & 4) */
          /* ========================================================================= */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                  {/* Wide Subject Column */}
                  <th className="py-2.5 px-4 min-w-[260px] text-left">Subject & Code</th>
                  <th className="py-2.5 px-3 w-20 min-w-[75px] text-center">Credits</th>
                  <th className="py-2.5 px-3 w-32 min-w-[110px] text-center">Theory Exam</th>
                  <th className="py-2.5 px-3 w-32 min-w-[110px] text-center">Task / CIE</th>
                  <th className="py-2.5 px-3 w-32 min-w-[110px] text-center">Lab Practical</th>
                  <th className="py-2.5 px-3 w-24 min-w-[90px] text-center">Total Scored</th>
                  <th className="py-2.5 px-3 w-20 min-w-[75px] text-center">Percentage</th>
                  <th className="py-2.5 px-3 w-24 min-w-[90px] text-center">Grade (GP)</th>
                  <th className="py-2.5 px-3 w-20 min-w-[80px] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {marks.map((m) => {
                  const hasLab = Boolean(m.has_lab);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition group">
                      {/* Subject Name - Generous space */}
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 group-hover:text-blue-700 transition leading-snug">
                            {m.subject_name}
                          </span>
                          {m.subject_code && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-600 w-fit">
                              {m.subject_code}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Credits */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[11px]">
                          {m.credits} Cr
                        </span>
                      </td>

                      {/* Theory Marks */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {m.theory_max > 0 ? (
                          <div className="space-y-1 inline-block text-left">
                            <div className="font-mono font-bold text-slate-800 text-center">
                              {m.theory_marks} <span className="text-slate-400 font-normal">/ {m.theory_max}</span>
                            </div>
                            <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden mx-auto">
                              <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{ width: `${Math.min(100, (m.theory_marks / m.theory_max) * 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* Task Marks */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="space-y-1 inline-block text-left">
                          <div className="font-mono font-bold text-slate-800 text-center">
                            {m.task_marks} <span className="text-slate-400 font-normal">/ {m.task_max}</span>
                          </div>
                          <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden mx-auto">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, (m.task_marks / m.task_max) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Lab Marks */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {hasLab ? (
                          <div className="space-y-1 inline-block text-left">
                            <div className="font-mono font-bold text-indigo-700 flex items-center justify-center gap-1">
                              <FlaskConical className="w-3 h-3 text-indigo-500" />
                              <span>{m.lab_marks}</span>
                              <span className="text-slate-400 font-normal">/ {m.lab_max}</span>
                            </div>
                            <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden mx-auto">
                              <div
                                className="h-full bg-indigo-500 rounded-full"
                                style={{ width: `${Math.min(100, (m.lab_marks / m.lab_max) * 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            No Lab
                          </span>
                        )}
                      </td>

                      {/* Total Scored */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900 whitespace-nowrap">
                        {m.total_scored} <span className="text-slate-400 font-normal">/ {m.total_max}</span>
                      </td>

                      {/* Percentage */}
                      <td className="py-3 px-3 text-center font-bold font-mono whitespace-nowrap">
                        <span
                          className={
                            m.percentage >= 75
                              ? 'text-emerald-700'
                              : m.percentage >= 50
                              ? 'text-blue-700'
                              : 'text-amber-700'
                          }
                        >
                          {m.percentage}%
                        </span>
                      </td>

                      {/* Grade (GP) - Guaranteed no clipping */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold font-mono inline-block ${
                            m.grade === 'O'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                              : m.grade === 'A+' || m.grade === 'A'
                              ? 'bg-blue-50 text-blue-800 border border-blue-300'
                              : m.grade === 'B+' || m.grade === 'B'
                              ? 'bg-amber-50 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-800 border border-slate-300'
                          }`}
                        >
                          {m.grade} ({m.grade_points} GP)
                        </span>
                      </td>

                      {/* Actions (Delete single row) */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSingleDeleteId(m.id);
                            setSingleDeleteName(m.subject_name);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete subject"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* BATCH ADD MODAL: Fill All Subject Details Once and Submit Together        */}
      {/* ========================================================================= */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-3.5 bg-[#0B1329] text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Add Multiple Subjects (Semester {semester})
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Fill in subject details in this sheet and submit all together.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveAllBatch} className="p-4 sm:p-5 space-y-3.5 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <span className="font-bold text-slate-800">
                  Subject Entries ({batchRows.length} {batchRows.length === 1 ? 'row' : 'rows'})
                </span>
                <button
                  type="button"
                  onClick={handleAddBatchRow}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1 border border-blue-200 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Another Row</span>
                </button>
              </div>

              {/* Rows List */}
              <div className="space-y-3">
                {batchRows.map((row, index) => {
                  const theory = Number(row.theory_marks) || 0;
                  const theoryMax = Number(row.theory_max) || 100;
                  const task = Number(row.task_marks) || 0;
                  const taskMax = Number(row.task_max) || 25;
                  const lab = row.has_lab ? Number(row.lab_marks) || 0 : 0;
                  const labMax = row.has_lab ? Number(row.lab_max) || 50 : 0;
                  const total = theory + task + lab;
                  const max = theoryMax + taskMax + labMax;
                  const pct = max > 0 ? Math.round((total / max) * 1000) / 10 : 0;

                  return (
                    <div
                      key={row.tempId}
                      className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">
                            Subject #{index + 1}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-slate-500">
                            Total: <strong className="text-slate-800">{total}</strong>/{max} ({pct}%)
                          </span>
                          {batchRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveBatchRow(row.tempId)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              title="Remove row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Main Fields Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                        {/* Code */}
                        <div className="md:col-span-2 space-y-1">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase">Code</label>
                          <input
                            type="text"
                            placeholder="e.g. 21CS61"
                            value={row.subject_code}
                            onChange={(e) => handleUpdateBatchRow(row.tempId, 'subject_code', e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        </div>

                        {/* Name */}
                        <div className="md:col-span-4 space-y-1">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase">Subject Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Software Engineering"
                            value={row.subject_name}
                            onChange={(e) => handleUpdateBatchRow(row.tempId, 'subject_name', e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        </div>

                        {/* Credits */}
                        <div className="md:col-span-1 space-y-1">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase">Credits</label>
                          <select
                            value={row.credits}
                            onChange={(e) => handleUpdateBatchRow(row.tempId, 'credits', Number(e.target.value))}
                            className="w-full px-1.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-blue-500 outline-none font-bold"
                          >
                            {[1, 2, 3, 4, 5, 6].map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Theory Scored / Max */}
                        <div className="md:col-span-2 space-y-1">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase">Theory (Score/Max)</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={row.theory_marks}
                              onChange={(e) => handleUpdateBatchRow(row.tempId, 'theory_marks', Number(e.target.value))}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold bg-white text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                            <span className="text-slate-400">/</span>
                            <input
                              type="number"
                              min="0"
                              value={row.theory_max}
                              onChange={(e) => handleUpdateBatchRow(row.tempId, 'theory_max', Number(e.target.value))}
                              className="w-14 px-1.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white text-slate-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        </div>

                        {/* Task / CIE Scored / Max */}
                        <div className="md:col-span-3 space-y-1">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase">Task/CIE (Score/Max)</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={row.task_marks}
                              onChange={(e) => handleUpdateBatchRow(row.tempId, 'task_marks', Number(e.target.value))}
                              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold bg-white text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                            <span className="text-slate-400">/</span>
                            <input
                              type="number"
                              min="1"
                              value={row.task_max}
                              onChange={(e) => handleUpdateBatchRow(row.tempId, 'task_max', Number(e.target.value))}
                              className="w-14 px-1.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white text-slate-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Lab Option for this row */}
                      <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={row.has_lab}
                            onChange={(e) => handleUpdateBatchRow(row.tempId, 'has_lab', e.target.checked)}
                            className="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer"
                          />
                          <span className="font-semibold text-slate-700 flex items-center gap-1 text-[11px]">
                            <FlaskConical className="w-3.5 h-3.5 text-indigo-600" />
                            <span>This subject has a practical Lab exam</span>
                          </span>
                        </label>

                        {row.has_lab && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-indigo-700 font-semibold">Lab Marks:</span>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              placeholder="Score"
                              value={row.lab_marks}
                              onChange={(e) => handleUpdateBatchRow(row.tempId, 'lab_marks', Number(e.target.value))}
                              className="w-20 px-2 py-1 border border-indigo-300 rounded-lg text-xs font-mono font-bold text-indigo-900 bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                            <span className="text-slate-400">/</span>
                            <input
                              type="number"
                              min="1"
                              placeholder="Max"
                              value={row.lab_max}
                              onChange={(e) => handleUpdateBatchRow(row.tempId, 'lab_max', Number(e.target.value))}
                              className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-xs font-mono bg-white text-slate-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add row CTA */}
              <button
                type="button"
                onClick={handleAddBatchRow}
                className="w-full py-2 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30 text-slate-600 hover:text-blue-700 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Add Another Subject Row</span>
              </button>

              {/* Modal Footer (Blue primary) */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <span className="text-xs text-slate-500">
                  Ready to submit <strong>{batchRows.filter((r) => r.subject_name.trim().length > 0).length}</strong> subject(s) to Semester {semester}.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBatchModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSaving ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    )}
                    <span>Save All Subjects</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE ALL CONFIRMATION MODAL (Red theme)                                 */}
      {/* ========================================================================= */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-900">
                  Delete All Subjects for Semester {semester}?
                </h3>
                <p className="text-xs text-slate-500">
                  This action will delete all <strong>{marks.length} registered subject marks</strong> for Semester {semester}. You can re-populate or enter marks again later.
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-[11px] text-rose-800 space-y-1 max-h-40 overflow-y-auto">
              <div className="font-bold">Summary of items to be deleted:</div>
              <ul className="list-disc list-inside text-rose-700 font-mono text-[10px] space-y-0.5">
                {marks.map((m) => (
                  <li key={m.id}>
                    {m.subject_name} {m.subject_code ? `(${m.subject_code})` : ''} - {m.total_scored}/{m.total_max} marks
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleConfirmDeleteAllSemester}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Yes, Delete All</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SINGLE DELETE CONFIRMATION MODAL                                          */}
      {/* ========================================================================= */}
      {singleDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-900">Delete Subject?</h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to delete <strong>"{singleDeleteName}"</strong> from Semester {semester}?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSingleDeleteId(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
