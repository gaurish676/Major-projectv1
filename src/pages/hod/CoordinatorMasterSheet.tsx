import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { JoylinMasterSheetRow, LogisysExportRow } from '../../types';
import {
  FileSpreadsheet,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Database,
  Building,
  GraduationCap,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface JoylinSummary {
  total_students: number;
  fully_cleared: number;
  in_progress: number;
  action_required: number;
  coordinator_name: string;
  coordinator_email: string;
  department_code: string;
  last_updated: string;
}

interface LogisysStats {
  total_students: number;
  cleared_count: number;
  pending_count: number;
  at_risk_count: number;
  college_code: string;
  academic_year: string;
}

export const CoordinatorMasterSheet: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'joylin' | 'logisys'>('joylin');
  const [isLoading, setIsLoading] = useState(true);

  // Joylin State
  const [joylinRows, setJoylinRows] = useState<JoylinMasterSheetRow[]>([]);
  const [joylinSummary, setJoylinSummary] = useState<JoylinSummary | null>(null);

  // Logisys State
  const [logisysRows, setLogisysRows] = useState<LogisysExportRow[]>([]);
  const [logisysStats, setLogisysStats] = useState<LogisysStats | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMentorFilter, setSelectedMentorFilter] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('selected_coordinator_mentor');
      if (saved) {
        sessionStorage.removeItem('selected_coordinator_mentor');
        return saved;
      }
    }
    return 'all';
  });

  const mentorOptions = React.useMemo(() => {
    const names = Array.from(new Set(joylinRows.map((r) => r.mentor_name).filter(Boolean)));
    return names.sort();
  }, [joylinRows]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [joylinRes, logisysRes] = await Promise.all([
        apiRequest<{ rows: JoylinMasterSheetRow[]; summary: JoylinSummary }>('/api/joylin/master-sheet'),
        apiRequest<{ rows: LogisysExportRow[]; stats: LogisysStats }>('/api/logisys/dataset'),
      ]);

      setJoylinRows(joylinRes.rows);
      setJoylinSummary(joylinRes.summary);
      setLogisysRows(logisysRes.rows);
      setLogisysStats(logisysRes.stats);
    } catch (err) {
      console.error('Failed to load coordinator export datasets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const downloadJoylinCsv = async () => {
    try {
      const token = localStorage.getItem('activity_portal_token') || localStorage.getItem('token');
      const res = await fetch('/api/joylin/export-csv', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to generate Joylin Master Sheet CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Joylin_Coordinator_Master_Activity_Points_Sheet_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Download error:', err);
      const token = localStorage.getItem('activity_portal_token') || localStorage.getItem('token');
      if (token) {
        window.open(`/api/joylin/export-csv?token=${encodeURIComponent(token)}`, '_blank');
      }
    }
  };

  const downloadLogisysCsv = async () => {
    try {
      const token = localStorage.getItem('activity_portal_token') || localStorage.getItem('token');
      const res = await fetch('/api/logisys/export-csv', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to generate Logisys ERP CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Logisys_ERP_Upload_Dataset_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Download error:', err);
      const token = localStorage.getItem('activity_portal_token') || localStorage.getItem('token');
      if (token) {
        window.open(`/api/logisys/export-csv?token=${encodeURIComponent(token)}`, '_blank');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Loading coordinator master sheets & ERP tables...</p>
        </div>
      </div>
    );
  }

  const filteredJoylinRows = joylinRows.filter((r) => {
    const matchesSearch =
      r.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.roll_no.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedMentorFilter !== 'all' && r.mentor_name !== selectedMentorFilter) return false;
    if (statusFilter === 'cleared') return r.clearance_status === 'Degree Clearance Eligible';
    if (statusFilter === 'pending') return r.clearance_status === 'In Progress';
    if (statusFilter === 'action') return r.clearance_status === 'Action Required';
    return true;
  });

  const filteredLogisysRows = logisysRows.filter((r) => {
    const matchesSearch =
      r.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.student_usn.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'cleared') return r.clearance_status === 'CLEARED';
    if (statusFilter === 'pending') return r.clearance_status === 'PENDING';
    if (statusFilter === 'action') return r.clearance_status === 'AT_RISK';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* 1. Header Banner */}
      <div className="bg-[#0B1329] rounded-2xl p-4 sm:p-5 text-white border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/20 text-sky-300 border border-blue-500/30">
              Department Coordination & ERP Office
            </span>
            <span className="text-xs text-slate-400">Activity Coordinator: Prof. Joylin & HOD</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            <span>Coordinator Master Sheet & Logisys ERP Integration</span>
          </h1>

          <p className="text-xs text-slate-300">
            Export tabulated department-wide activity credit records for official AICTE/NAAC reporting, Google Sheets consolidation, and direct Logisys University ERP uploading.
          </p>
        </div>

        {/* Primary Download Button */}
        <div className="flex items-center gap-2 shrink-0">
          {activeTab === 'joylin' ? (
            <button
              onClick={downloadJoylinCsv}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-2 transition transform active:scale-95 cursor-pointer border border-emerald-400/30"
              title="Download consolidated sheet for Google Sheets / Excel"
            >
              <Download className="w-4 h-4" />
              <span>Export Google Sheet (CSV)</span>
            </button>
          ) : (
            <button
              onClick={downloadLogisysCsv}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm flex items-center gap-2 transition transform active:scale-95 cursor-pointer border border-indigo-400/30"
              title="Download uploadable file for Logisys Autonomous Examination ERP"
            >
              <Download className="w-4 h-4" />
              <span>Export Logisys ERP File (CSV)</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Focused Tab Switcher */}
      <div className="bg-white rounded-xl p-1.5 border border-slate-200 shadow-2xs flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('joylin')}
          className={`flex-1 min-w-[200px] py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'joylin'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Joylin Mam Coordinator Master Sheet ({joylinRows.length} Students)</span>
        </button>

        <button
          onClick={() => setActiveTab('logisys')}
          className={`flex-1 min-w-[200px] py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'logisys'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Logisys University ERP Format ({logisysRows.length} Records)</span>
        </button>
      </div>

      {/* 3. TAB 1: JOYLIN MAM COORDINATOR MASTER SHEET */}
      {activeTab === 'joylin' && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
          {/* Summary KPIs */}
          {joylinSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Cohort</span>
                <span className="text-xl font-bold font-mono text-slate-900">{joylinSummary.total_students} Students</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Degree Cleared (200 pts)</span>
                <span className="text-xl font-bold font-mono text-emerald-800">{joylinSummary.fully_cleared} Eligible</span>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">In Progress</span>
                <span className="text-xl font-bold font-mono text-blue-800">{joylinSummary.in_progress} En Route</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Action Required</span>
                <span className="text-xl font-bold font-mono text-amber-800">{joylinSummary.action_required} At Risk</span>
              </div>
            </div>
          )}

          {/* Controls Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student or USN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white"
                />
              </div>

              {/* Mentor Filter Dropdown */}
              <select
                value={selectedMentorFilter}
                onChange={(e) => setSelectedMentorFilter(e.target.value)}
                aria-label="Filter students by faculty mentor"
                className="bg-white border border-slate-200 text-xs text-slate-700 font-medium rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
              >
                <option value="all">All Faculty Mentors ({mentorOptions.length})</option>
                {mentorOptions.map((mentor) => (
                  <option key={mentor} value={mentor}>
                    Prof. {mentor}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${
                    statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('cleared')}
                  className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${
                    statusFilter === 'cleared' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Cleared
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${
                    statusFilter === 'pending' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setStatusFilter('action')}
                  className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${
                    statusFilter === 'action' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  Action
                </button>
              </div>

              {selectedMentorFilter !== 'all' && (
                <button
                  onClick={() => setSelectedMentorFilter('all')}
                  className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 cursor-pointer"
                  title="Clear mentor filter"
                >
                  <span>Filtering: {selectedMentorFilter}</span>
                  <span className="font-bold">×</span>
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing {filteredJoylinRows.length} of {joylinRows.length} entries
            </div>
          </div>

          {/* Master Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-2 text-center">#</th>
                  <th className="py-2.5 px-3">USN & Student</th>
                  <th className="py-2.5 px-2 text-center">Sem</th>
                  <th className="py-2.5 px-2 text-center">CGPA</th>
                  <th className="py-2.5 px-3">Mentor</th>
                  <th className="py-2.5 px-2 text-center" title="Technical Certifications (Cap 60)">Cert (60)</th>
                  <th className="py-2.5 px-2 text-center" title="Hackathons & Competitions (Cap 60)">Hack (60)</th>
                  <th className="py-2.5 px-2 text-center" title="Internships (Cap 50)">Intern (50)</th>
                  <th className="py-2.5 px-2 text-center" title="Workshops (Cap 40)">Work (40)</th>
                  <th className="py-2.5 px-2 text-center" title="NSS & Volunteering (Cap 40)">NSS (40)</th>
                  <th className="py-2.5 px-2 text-center" title="Sports & Cultural (Cap 40)">Sports (40)</th>
                  <th className="py-2.5 px-3 text-right">Effective Pts</th>
                  <th className="py-2.5 px-3 text-center">Clearance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredJoylinRows.map((r) => {
                  const isCleared = r.clearance_status === 'Degree Clearance Eligible';
                  const isAction = r.clearance_status === 'Action Required';

                  return (
                    <tr key={r.roll_no} className="hover:bg-slate-50 transition">
                      <td className="py-2 px-2 text-center text-slate-400">{r.sl_no}</td>
                      <td className="py-2 px-3 font-sans">
                        <div className="font-bold text-slate-900 text-xs">{r.student_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{r.roll_no}</div>
                      </td>
                      <td className="py-2 px-2 text-center text-slate-700">{r.semester}</td>
                      <td className="py-2 px-2 text-center text-slate-800 font-semibold">{r.cgpa.toFixed(2)}</td>
                      <td className="py-2 px-3 font-sans text-slate-700 text-[11px] truncate max-w-[120px]">
                        {r.mentor_name}
                      </td>
                      <td className="py-2 px-2 text-center text-slate-600">{r.cat_cert}</td>
                      <td className="py-2 px-2 text-center text-slate-600">{r.cat_comp}</td>
                      <td className="py-2 px-2 text-center text-slate-600">{r.cat_intern}</td>
                      <td className="py-2 px-2 text-center text-slate-600">{r.cat_work}</td>
                      <td className="py-2 px-2 text-center text-slate-600">{r.cat_vol}</td>
                      <td className="py-2 px-2 text-center text-slate-600">{r.cat_sports}</td>
                      <td className="py-2 px-3 text-right">
                        <span className="font-extrabold text-xs text-slate-900">{r.capped_total}</span>
                        <span className="text-[10px] text-slate-400">/200</span>
                      </td>
                      <td className="py-2 px-3 text-center font-sans">
                        {isCleared ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Cleared ✓
                          </span>
                        ) : isAction ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            At Risk ⚠️
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            In Progress
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TAB 2: LOGISYS UNIVERSITY ERP FORMAT */}
      {activeTab === 'logisys' && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
          {/* ERP Notice */}
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <strong className="block">Logisys Autonomous Examination ERP Specification</strong>
                <span className="text-[11px] text-blue-800">
                  Course Code: <code className="bg-blue-100 px-1 py-0.2 rounded font-mono">22CSACT01</code> • Grading Scale: O (200+), A+ (160+), A (120+), B+ (80+), B (50+), F (&lt;50).
                </span>
              </div>
            </div>

            <button
              onClick={downloadLogisysCsv}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Logisys Format</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">College & Degree</th>
                  <th className="py-2.5 px-3">Student USN</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3 text-center">Course Code</th>
                  <th className="py-2.5 px-3 text-right">Points Earned</th>
                  <th className="py-2.5 px-3 text-center">University Grade</th>
                  <th className="py-2.5 px-3 text-center">ERP Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredLogisysRows.map((r) => (
                  <tr key={r.student_usn} className="hover:bg-slate-50 transition">
                    <td className="py-2 px-3 text-slate-600">
                      {r.college_code} • {r.degree_code}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900">{r.student_usn}</td>
                    <td className="py-2 px-3 font-sans text-slate-900 text-xs font-medium">{r.student_name}</td>
                    <td className="py-2 px-3 text-center text-blue-700 font-semibold">{r.activity_subject_code}</td>
                    <td className="py-2 px-3 text-right font-extrabold text-slate-900">
                      {r.activity_points_earned} <span className="text-slate-400 text-[10px]">/ {r.max_points}</span>
                    </td>
                    <td className="py-2 px-3 text-center font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.grade === 'O' ? 'bg-purple-100 text-purple-800' :
                        r.grade === 'A+' ? 'bg-emerald-100 text-emerald-800' :
                        r.grade === 'A' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        Grade {r.grade}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-sans">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[10px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Ready for ERP Upload</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
