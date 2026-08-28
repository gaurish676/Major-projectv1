import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, StudentMark, SemesterMarksSummary, MentorStudentMarksData } from '../../types';
import { apiRequest } from '../../lib/api';
import {
  FileSpreadsheet,
  Users,
  Search,
  GraduationCap,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Filter,
  RefreshCw,
  ChevronRight,
  Printer,
  Sparkles,
  BarChart3,
  Layers,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';

export const MentorStudentMarks: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<MentorStudentMarksData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedSemesterTab, setSelectedSemesterTab] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  const fetchStudentMarks = async (studentId?: string) => {
    try {
      setIsLoading(true);
      const url = studentId
        ? `/api/mentor/student-marks?student_id=${studentId}`
        : '/api/mentor/student-marks';
      const res = await apiRequest<MentorStudentMarksData>(url);
      setData(res);

      if (!studentId && res.selected_student) {
        setSelectedStudentId(res.selected_student.id);
      } else if (studentId) {
        setSelectedStudentId(studentId);
      }
    } catch (err) {
      console.error('Failed to load student marks for mentor:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentMarks();
  }, [user]);

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    fetchStudentMarks(studentId);
  };

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'O':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'A+':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'A':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'B+':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'B':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'C':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'F':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const mentees = data?.mentees || [];
  const filteredMentees = mentees.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      (m.roll_no && m.roll_no.toLowerCase().includes(q)) ||
      m.email.toLowerCase().includes(q)
    );
  });

  const selectedStudent = data?.selected_student || mentees.find((m) => m.id === selectedStudentId);
  const semesterSummaries = data?.semester_summaries || [];

  const visibleSummaries =
    selectedSemesterTab === 'all'
      ? semesterSummaries
      : semesterSummaries.filter((s) => s.semester === selectedSemesterTab);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Student Marks Ledger</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Semester-Wise
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Track and review internal assessment, theory exams, tasks, and lab marks updated by your assigned mentees.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => fetchStudentMarks(selectedStudentId)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            title="Refresh Marks"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            title="Print / Save PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Ledger</span>
          </button>
        </div>
      </div>

      {/* Mentee Selector Carousel / Grid */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-slate-800">Select Mentee to Review</span>
            <span className="text-[10px] text-slate-500 font-medium">({mentees.length} assigned students)</span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or USN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Mentees Horizontal Scroll List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {filteredMentees.map((m) => {
            const isSelected = m.id === selectedStudentId;
            const hasData = m.has_marks_data;

            return (
              <button
                key={m.id}
                onClick={() => handleSelectStudent(m.id)}
                className={`text-left p-3 rounded-xl border transition cursor-pointer flex items-start justify-between gap-2.5 ${
                  isSelected
                    ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-200 shadow-xs'
                    : 'bg-slate-50/50 hover:bg-slate-100/80 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                    {m.avatar ? (
                      <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{m.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                      <span>{m.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">{m.roll_no || 'No USN'}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] font-semibold text-purple-700 bg-purple-100/80 px-1.5 py-0.2 rounded">
                        Sem {m.semester || 1}
                      </span>
                      {hasData ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                          {m.semesters_recorded?.length || 1} Sem Recorded
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">CGPA</div>
                  <div className="text-xs font-black text-slate-800 font-mono">
                    {m.cgpa ? Number(m.cgpa).toFixed(2) : '—'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-600">Loading student semester marks ledger...</p>
        </div>
      ) : !selectedStudent ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600">No mentee selected or found.</p>
        </div>
      ) : (
        <>
          {/* Selected Student Profile Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full border-2 border-indigo-400/50 bg-indigo-700 text-white text-base font-bold flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                  {selectedStudent.avatar ? (
                    <img src={selectedStudent.avatar} alt={selectedStudent.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{selectedStudent.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">{selectedStudent.name}</h2>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/10 text-indigo-200 border border-white/10">
                      {selectedStudent.roll_no || '1RV21CS000'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {selectedStudent.email} • Current Semester: <span className="font-semibold text-white">Sem {selectedStudent.semester || 1}</span>
                  </p>
                </div>
              </div>

              {/* High-Level Score Badges */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-white/10 backdrop-blur-xs border border-white/15 px-3.5 py-2 rounded-xl text-center min-w-[90px]">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-200">Overall CGPA</div>
                  <div className="text-base font-black text-white font-mono">
                    {data?.overall_cgpa ? Number(data.overall_cgpa).toFixed(2) : '—'}
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-xs border border-white/15 px-3.5 py-2 rounded-xl text-center min-w-[90px]">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-200">Semesters Recorded</div>
                  <div className="text-base font-black text-emerald-400 font-mono">
                    {semesterSummaries.length} / 8
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-xs border border-white/15 px-3.5 py-2 rounded-xl text-center min-w-[90px]">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-200">Total Subjects</div>
                  <div className="text-base font-black text-white font-mono">
                    {data?.all_marks?.length || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Semester Selector Tabs */}
          <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5 min-w-max">
              <button
                onClick={() => setSelectedSemesterTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedSemesterTab === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Semesters ({semesterSummaries.length})</span>
              </button>

              {[1, 2, 3, 4, 5, 6, 7, 8].map((semNum) => {
                const semData = semesterSummaries.find((s) => s.semester === semNum);
                const isSelected = selectedSemesterTab === semNum;
                const hasMarks = Boolean(semData && semData.total_subjects > 0);

                return (
                  <button
                    key={semNum}
                    onClick={() => setSelectedSemesterTab(semNum)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : hasMarks
                        ? 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
                        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                    }`}
                  >
                    <span>Sem {semNum}</span>
                    {semData && semData.sgpa > 0 && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-blue-200/70 text-blue-900'
                        }`}
                      >
                        {semData.sgpa.toFixed(2)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick search inside subjects */}
            <div className="relative w-48 shrink-0 hidden sm:block">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter subjects..."
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* If no marks found for selected filter */}
          {visibleSummaries.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Marks Recorded Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {selectedStudent.name} has not entered subject marks for{' '}
                {selectedSemesterTab === 'all' ? 'any semester' : `Semester ${selectedSemesterTab}`} yet. Marks entered by the student in their portal will immediately appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleSummaries.map((summary) => {
                const subjects = summary.subjects.filter((s) => {
                  if (!subjectFilter.trim()) return true;
                  const q = subjectFilter.toLowerCase();
                  return (
                    s.subject_name.toLowerCase().includes(q) ||
                    s.subject_code.toLowerCase().includes(q)
                  );
                });

                return (
                  <div
                    key={summary.semester}
                    className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden"
                  >
                    {/* Semester Header Card */}
                    <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                          S{summary.semester}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span>Semester {summary.semester} Assessment Ledger</span>
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-slate-200 text-slate-700">
                              {summary.total_subjects} Subjects
                            </span>
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            Total Scored: <span className="font-semibold text-slate-700">{summary.total_scored} / {summary.total_max}</span> ({summary.percentage}%) • Total Credits: <span className="font-semibold text-slate-700">{summary.total_credits}</span>
                          </p>
                        </div>
                      </div>

                      {/* SGPA Highlights */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-emerald-700 block leading-none">SGPA</span>
                            <span className="text-xs font-black font-mono leading-none">{summary.sgpa.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900">
                          <Award className="w-3.5 h-3.5 text-blue-600" />
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-blue-700 block leading-none">Status</span>
                            <span className="text-xs font-bold leading-none">
                              {summary.sgpa >= 7.75 ? 'Distinction' : summary.sgpa >= 6.75 ? 'First Class' : 'Pass'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Subjects Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                            <th className="py-2.5 px-3">Subject Code & Name</th>
                            <th className="py-2.5 px-2.5 text-center">Credits</th>
                            <th className="py-2.5 px-3 text-center">Theory Exam</th>
                            <th className="py-2.5 px-3 text-center">Task / CIE</th>
                            <th className="py-2.5 px-3 text-center">Lab Marks</th>
                            <th className="py-2.5 px-3 text-center">Total Scored</th>
                            <th className="py-2.5 px-2.5 text-center">Percentage</th>
                            <th className="py-2.5 px-3 text-center">Grade / Points</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {subjects.map((s) => (
                            <tr key={s.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900">{s.subject_name}</div>
                                <div className="text-[11px] font-mono text-blue-700 font-semibold">{s.subject_code}</div>
                              </td>

                              <td className="py-2.5 px-2.5 text-center font-bold text-slate-700 font-mono">
                                {s.credits}
                              </td>

                              <td className="py-2.5 px-3 text-center">
                                <span className="font-semibold text-slate-900 font-mono">
                                  {s.theory_marks}
                                </span>
                                <span className="text-slate-400 font-mono text-[10px]"> / {s.theory_max}</span>
                              </td>

                              <td className="py-2.5 px-3 text-center">
                                <span className="font-semibold text-slate-900 font-mono">
                                  {s.task_marks}
                                </span>
                                <span className="text-slate-400 font-mono text-[10px]"> / {s.task_max}</span>
                              </td>

                              <td className="py-2.5 px-3 text-center">
                                {s.has_lab ? (
                                  <>
                                    <span className="font-semibold text-emerald-800 font-mono">
                                      {s.lab_marks}
                                    </span>
                                    <span className="text-slate-400 font-mono text-[10px]"> / {s.lab_max}</span>
                                  </>
                                ) : (
                                  <span className="text-slate-300 font-mono">—</span>
                                )}
                              </td>

                              <td className="py-2.5 px-3 text-center">
                                <span className="font-bold text-slate-900 font-mono">
                                  {s.total_scored}
                                </span>
                                <span className="text-slate-400 font-mono text-[10px]"> / {s.total_max}</span>
                              </td>

                              <td className="py-2.5 px-2.5 text-center font-bold font-mono text-slate-800">
                                {s.percentage}%
                              </td>

                              <td className="py-2.5 px-3 text-center">
                                <div className="inline-flex items-center gap-1">
                                  <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold border ${getGradeBadge(s.grade)}`}>
                                    {s.grade}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono font-bold">
                                    ({s.grade_points} pts)
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>

                        {/* Footer Totals */}
                        <tfoot>
                          <tr className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                            <td className="py-2 px-3 text-right">Semester Total:</td>
                            <td className="py-2 px-2.5 text-center font-mono">{summary.total_credits}</td>
                            <td colSpan={3} className="py-2 px-3 text-center text-slate-500 font-normal text-[11px]">
                              Weighted SGPA Calculation
                            </td>
                            <td className="py-2 px-3 text-center font-mono">
                              {summary.total_scored} / {summary.total_max}
                            </td>
                            <td className="py-2 px-2.5 text-center font-mono text-blue-700">
                              {summary.percentage}%
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black font-mono">
                                {summary.sgpa.toFixed(2)} SGPA
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
