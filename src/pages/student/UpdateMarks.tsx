import React, { useState, useEffect } from 'react';
import { SubjectMark, MarksSummary, MarksResponse } from '../../types';
import { apiRequest } from '../../lib/api';
import {
  GraduationCap,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  BookOpen,
  FlaskConical,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  BarChart3,
  Percent,
  Award,
  RefreshCw,
} from 'lucide-react';

export const UpdateMarks: React.FC = () => {
  const [semester, setSemester] = useState<number>(6);
  const [marks, setMarks] = useState<SubjectMark[]>([]);
  const [summary, setSummary] = useState<MarksSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    subject_code: '',
    subject_name: '',
    credits: 4,
    theory_marks: 75,
    theory_max: 100,
    task_marks: 20,
    task_max: 25,
    has_lab: false,
    lab_marks: 40,
    lab_max: 50,
  });

  const fetchMarks = async (sem: number = semester) => {
    try {
      setIsLoading(true);
      const res = await apiRequest<MarksResponse>(`/api/student/marks?semester=${sem}`);
      setMarks(res.marks || []);
      setSummary(res.summary || null);

      // If no marks for this semester yet, automatically offer default seed
      if (!res.marks || res.marks.length === 0) {
        // Attempt to auto seed default subjects for demo student
        try {
          await apiRequest('/api/student/marks/seed-defaults', {
            method: 'POST',
            body: JSON.stringify({ semester: sem }),
          });
          const reRes = await apiRequest<MarksResponse>(`/api/student/marks?semester=${sem}`);
          setMarks(reRes.marks || []);
          setSummary(reRes.summary || null);
        } catch {
          // ignore if manual entry desired
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
    fetchMarks(semester);
  }, [semester]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      subject_code: '',
      subject_name: '',
      credits: 4,
      theory_marks: 75,
      theory_max: 100,
      task_marks: 20,
      task_max: 25,
      has_lab: false,
      lab_marks: 40,
      lab_max: 50,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: SubjectMark) => {
    setEditingId(m.id);
    setFormData({
      subject_code: m.subject_code || '',
      subject_name: m.subject_name,
      credits: m.credits || 4,
      theory_marks: m.theory_marks,
      theory_max: m.theory_max || 100,
      task_marks: m.task_marks,
      task_max: m.task_max || 25,
      has_lab: Boolean(m.has_lab),
      lab_marks: m.lab_marks || 0,
      lab_max: m.lab_max || 50,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await apiRequest(`/api/student/marks/${id}`, { method: 'DELETE' });
      setMessage({ type: 'success', text: `Subject "${name}" deleted.` });
      fetchMarks(semester);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete subject' });
    }
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject_name.trim()) {
      setMessage({ type: 'error', text: 'Please enter a valid subject name' });
      return;
    }

    try {
      setIsSaving(true);
      if (editingId) {
        await apiRequest(`/api/student/marks/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            ...formData,
            semester,
          }),
        });
        setMessage({ type: 'success', text: 'Subject marks updated successfully!' });
      } else {
        await apiRequest('/api/student/marks', {
          method: 'POST',
          body: JSON.stringify({
            ...formData,
            semester,
          }),
        });
        setMessage({ type: 'success', text: 'New subject marks added successfully!' });
      }
      setIsModalOpen(false);
      fetchMarks(semester);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save subject marks' });
    } finally {
      setIsSaving(false);
    }
  };

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

  // Real-time calculation for modal preview
  const currentTheory = Number(formData.theory_marks) || 0;
  const currentTheoryMax = Number(formData.theory_max) || 0;
  const currentTask = Number(formData.task_marks) || 0;
  const currentTaskMax = Number(formData.task_max) || 0;
  const currentLab = formData.has_lab ? Number(formData.lab_marks) || 0 : 0;
  const currentLabMax = formData.has_lab ? Number(formData.lab_max) || 0 : 0;

  const currentTotal = currentTheory + currentTask + currentLab;
  const currentMax = currentTheoryMax + currentTaskMax + currentLabMax;
  const currentPct = currentMax > 0 ? Math.round((currentTotal / currentMax) * 1000) / 10 : 0;

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {message && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-xs ${
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

      {/* Top Banner & Header */}
      <div className="bg-[#0B1329] rounded-2xl p-4 sm:p-5 text-white border border-slate-800/80 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-sky-300 border border-blue-500/30">
              Academic Marks Ledger
            </span>
            <span className="text-xs text-slate-400">Continuous Assessment & SGPA Calculator</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-sky-400" />
            <span>Update Subject Marks</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Record theory exam marks, internal task/assignment scores, and lab practical marks for each subject.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Semester Selector */}
          <div className="flex items-center bg-slate-900/90 rounded-xl border border-slate-700/80 p-1">
            <span className="text-xs text-slate-400 px-2 font-medium">Semester:</span>
            <select
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value))}
              className="bg-slate-800 text-white text-xs font-bold rounded-lg px-2.5 py-1.5 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Sem {s}
                </option>
              ))}
            </select>
          </div>

          {/* Add Subject CTA */}
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* SGPA */}
          <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">Projected SGPA</span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-slate-900">
                {summary.sgpa.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400">/ 10.0</span>
            </div>
            <div className="text-[10px] font-semibold text-emerald-600">
              {summary.sgpa >= 9
                ? 'Outstanding (O)'
                : summary.sgpa >= 8
                ? 'Excellent (A+)'
                : summary.sgpa >= 7
                ? 'Very Good (A)'
                : summary.sgpa >= 6
                ? 'Good (B+)'
                : 'Passing'}
            </div>
          </div>

          {/* Overall Percentage */}
          <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">Semester Average</span>
              <Percent className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-blue-600">
                {summary.overall_percentage}%
              </span>
            </div>
            <div className="text-[10px] text-slate-400">Weighted aggregate</div>
          </div>

          {/* Total Marks */}
          <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">Total Scored</span>
              <BarChart3 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-slate-900">
                {summary.total_scored}
              </span>
              <span className="text-xs text-slate-400">/ {summary.total_max}</span>
            </div>
            <div className="text-[10px] text-slate-400">Marks accumulated</div>
          </div>

          {/* Total Credits */}
          <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">Subjects / Credits</span>
              <GraduationCap className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-slate-900">
                {summary.total_subjects}
              </span>
              <span className="text-xs text-slate-400">({summary.total_credits} Credits)</span>
            </div>
            <div className="text-[10px] text-slate-400">Sem {semester} curriculum</div>
          </div>
        </div>
      )}

      {/* Main Subjects Table & Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Semester {semester} Subjects Breakdown
            </h2>
            <span className="text-xs text-slate-500">({marks.length} registered)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePreloadDefaults}
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-300 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
              title="Preload syllabus subjects"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Pre-fill Syllabus</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subject</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading semester subject marks...</span>
          </div>
        ) : marks.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-sm font-bold text-slate-800">No subjects added for Semester {semester}</h3>
              <p className="text-xs text-slate-500">
                You can add individual subjects manually or pre-fill standard curriculum subjects with 1 click.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={handlePreloadDefaults}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition cursor-pointer"
              >
                Pre-fill Semester {semester} Subjects
              </button>
              <button
                onClick={handleOpenAdd}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                Add Custom Subject
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Subject & Code</th>
                  <th className="py-3 px-3">Credits</th>
                  <th className="py-3 px-3">Theory Exam</th>
                  <th className="py-3 px-3">Task / CIE</th>
                  <th className="py-3 px-3">Lab / Practical</th>
                  <th className="py-3 px-3">Total Scored</th>
                  <th className="py-3 px-3">Percentage</th>
                  <th className="py-3 px-3">Grade</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {marks.map((m) => {
                  const hasLab = Boolean(m.has_lab);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition group">
                      {/* Subject Name */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-start gap-2">
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-blue-700 transition">
                              {m.subject_name}
                            </div>
                            {m.subject_code && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-600">
                                {m.subject_code}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Credits */}
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[11px]">
                          {m.credits} Cr
                        </span>
                      </td>

                      {/* Theory Marks */}
                      <td className="py-3.5 px-3">
                        {m.theory_max > 0 ? (
                          <div className="space-y-1">
                            <span className="font-mono font-bold text-slate-800">
                              {m.theory_marks} <span className="text-slate-400 font-normal">/ {m.theory_max}</span>
                            </span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <span className="font-mono font-bold text-slate-800">
                            {m.task_marks} <span className="text-slate-400 font-normal">/ {m.task_max}</span>
                          </span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, (m.task_marks / m.task_max) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Lab Marks */}
                      <td className="py-3.5 px-3">
                        {hasLab ? (
                          <div className="space-y-1">
                            <span className="font-mono font-bold text-indigo-700 flex items-center gap-1">
                              <FlaskConical className="w-3 h-3 text-indigo-500" />
                              {m.lab_marks} <span className="text-slate-400 font-normal">/ {m.lab_max}</span>
                            </span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full"
                                style={{ width: `${Math.min(100, (m.lab_marks / m.lab_max) * 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            No Lab
                          </span>
                        )}
                      </td>

                      {/* Total Scored */}
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                        {m.total_scored} <span className="text-slate-400 font-normal">/ {m.total_max}</span>
                      </td>

                      {/* Percentage */}
                      <td className="py-3.5 px-3 font-bold font-mono">
                        <span
                          className={
                            m.percentage >= 75
                              ? 'text-emerald-600'
                              : m.percentage >= 50
                              ? 'text-blue-600'
                              : 'text-amber-600'
                          }
                        >
                          {m.percentage}%
                        </span>
                      </td>

                      {/* Grade */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-extrabold font-mono ${
                            m.grade === 'O'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : m.grade === 'A+' || m.grade === 'A'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : m.grade === 'B+' || m.grade === 'B'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-800 border border-slate-300'
                          }`}
                        >
                          {m.grade} ({m.grade_points} GP)
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title="Edit marks"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(m.id, m.subject_name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete subject"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add or Edit Subject Marks */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#0B1329] text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-sm">
                  {editingId ? 'Edit Subject Marks' : `Add Subject (Semester ${semester})`}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveSubject} className="p-5 space-y-4 text-xs text-slate-700">
              {/* Subject Name & Code */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="block font-bold text-slate-800">Subject Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Distributed Systems & Cloud"
                    value={formData.subject_name}
                    onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-800">Subject Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 21CS62"
                    value={formData.subject_code}
                    onChange={(e) => setFormData({ ...formData, subject_code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Credits & Semester */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-800">Credits</label>
                  <select
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map((c) => (
                      <option key={c} value={c}>
                        {c} Credit{c > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block font-bold text-slate-800">Semester</label>
                  <input
                    type="text"
                    disabled
                    value={`Semester ${semester}`}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-100 text-slate-600 font-semibold"
                  />
                </div>
              </div>

              {/* 1. Theory Exam Marks */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>1. Theory / End-Sem Exam</span>
                  <span className="text-[11px] text-slate-500">Scored vs Maximum</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Marks Scored</label>
                    <input
                      type="number"
                      min="0"
                      max={formData.theory_max || 100}
                      step="0.5"
                      value={formData.theory_marks}
                      onChange={(e) => setFormData({ ...formData, theory_marks: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Out of (Max)</label>
                    <input
                      type="number"
                      min="0"
                      max="200"
                      value={formData.theory_max}
                      onChange={(e) => setFormData({ ...formData, theory_max: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Task / CIE Assignment Marks */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>2. Task / Assignment / CIE Marks</span>
                  <span className="text-[11px] text-slate-500">Internal Continuous Evaluation</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Task Marks Scored</label>
                    <input
                      type="number"
                      min="0"
                      max={formData.task_max || 50}
                      step="0.5"
                      value={formData.task_marks}
                      onChange={(e) => setFormData({ ...formData, task_marks: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Out of (Max)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.task_max}
                      onChange={(e) => setFormData({ ...formData, task_max: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Lab / Practical Option */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_lab}
                      onChange={(e) => setFormData({ ...formData, has_lab: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <FlaskConical className="w-3.5 h-3.5 text-indigo-600" />
                      <span>This Subject Has Lab / Practical Exam</span>
                    </span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    {formData.has_lab ? 'Enabled' : 'None'}
                  </span>
                </div>

                {formData.has_lab && (
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">Lab Marks Scored</label>
                      <input
                        type="number"
                        min="0"
                        max={formData.lab_max || 100}
                        step="0.5"
                        value={formData.lab_marks}
                        onChange={(e) => setFormData({ ...formData, lab_marks: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-0.5">Lab Out of (Max)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.lab_max}
                        onChange={(e) => setFormData({ ...formData, lab_max: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Real-time Calculation Summary Box */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-blue-900 font-semibold">Total Cumulative Score</div>
                  <div className="text-sm font-bold font-mono text-blue-950">
                    {currentTotal} / {currentMax}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-blue-900 font-semibold">Calculated Percentage</div>
                  <div className="text-sm font-bold font-mono text-blue-700">
                    {currentPct}%
                  </div>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{editingId ? 'Update Marks' : 'Save Subject'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
