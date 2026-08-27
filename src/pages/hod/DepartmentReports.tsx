import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api';
import { StatusBadge } from '../../components/common/Badge';
import { PDFViewerModal } from '../../components/common/PDFViewerModal';
import { Submission } from '../../types';
import {
  FileSpreadsheet,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Search,
  Filter,
  Eye,
  Sparkles,
} from 'lucide-react';

export const DepartmentReports: React.FC = () => {
  const [reportData, setReportData] = useState<{
    students: any[];
    submissions: Submission[];
    clearance_summary: {
      cleared: number;
      near_completion: number;
      in_progress: number;
      at_risk: number;
    };
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Evidence Preview
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest<any>('/api/hod/reports');
      setReportData(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleExportCSV = () => {
    if (!reportData) return;
    const headers = [
      'Roll Number',
      'Student Name',
      'Semester',
      'CGPA',
      'Faculty Mentor',
      'Total Approved Points',
      'Degree Clearance Status',
    ];

    const rows = reportData.students.map((s) => [
      s.roll_no,
      `"${s.name}"`,
      s.semester || 6,
      s.cgpa || 8.0,
      `"${s.mentor_name || 'Unassigned'}"`,
      s.approved_points || 0,
      (s.approved_points || 0) >= 200 ? 'CLEARED' : 'PENDING',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CSE_200_Activity_Points_Audit_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || !reportData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Compiling department compliance dossier...</p>
        </div>
      </div>
    );
  }

  const students = reportData?.students || [];
  const submissions = reportData?.submissions || [];
  const clearance_summary = reportData?.clearance_summary || {
    cleared: 0,
    near_completion: 0,
    in_progress: 0,
    at_risk: 0,
  };

  const filteredSubmissions = submissions.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      (s.student_name && s.student_name.toLowerCase().includes(q)) ||
      (s.student_roll_no && s.student_roll_no.toLowerCase().includes(q)) ||
      s.activity_title.toLowerCase().includes(q) ||
      (s.category_name && s.category_name.toLowerCase().includes(q));

    const matchesCategory =
      selectedCategoryFilter === 'all' || s.category_name === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              <span>Department Accreditation & Compliance Reports</span>
            </h1>
            <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              NAAC / NBA Audit Ready
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Official immutable audit reports for B.Tech CSE 200 Activity Points Degree Mandatory Requirement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Degree Clearance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Degree Cleared (200p)
            </span>
            <div className="w-6 h-6 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-600 font-mono">
            {clearance_summary.cleared} Students
          </div>
          <div className="text-[10px] text-slate-500">
            100% Activity requirement met
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Near Completion (150-199)
            </span>
            <div className="w-6 h-6 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold text-indigo-600 font-mono">
            {clearance_summary.near_completion} Students
          </div>
          <div className="text-[10px] text-slate-500">
            Gold tier milestone reached
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              On Track (100-149)
            </span>
            <div className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold text-blue-600 font-mono">
            {clearance_summary.in_progress} Students
          </div>
          <div className="text-[10px] text-slate-500">
            Silver tier milestone reached
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Action Required (&lt;100)
            </span>
            <div className="w-6 h-6 rounded bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold text-amber-600 font-mono">
            {clearance_summary.at_risk} Students
          </div>
          <div className="text-[10px] text-slate-500">
            Assigned mentors notified
          </div>
        </div>
      </div>

      {/* Full Department Submission Audit Trail */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden space-y-3 p-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Department-Wide Submission Audit Ledger
            </h2>
            <p className="text-[11px] text-slate-500">
              Every verified certificate stamped with cryptographic integrity SHA256 and schema version.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search ledger..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 text-xs rounded border border-slate-200 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-2 px-2.5">Student & Roll No</th>
                <th className="py-2 px-2.5">Activity & Evidence Name</th>
                <th className="py-2 px-2.5">Category Domain</th>
                <th className="py-2 px-2.5">Snapshot</th>
                <th className="py-2 px-2.5">Reviewer & Status</th>
                <th className="py-2 px-2.5 text-right">Points</th>
                <th className="py-2 px-2.5 text-center">Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubmissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-2 px-2.5">
                    <div className="font-bold text-slate-900 text-xs">{sub.student_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{sub.student_roll_no}</div>
                  </td>

                  <td className="py-2 px-2.5">
                    <div className="font-bold text-slate-900 text-xs">{sub.activity_title}</div>
                    <div className="text-[10px] text-slate-500">{sub.schema_activity_name}</div>
                  </td>

                  <td className="py-2 px-2.5 font-medium text-slate-700 text-xs">
                    {sub.category_name}
                  </td>

                  <td className="py-2 px-2.5">
                    <span className="font-mono text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-bold">
                      v{sub.schema_version_snapshot}
                    </span>
                  </td>

                  <td className="py-2 px-2.5">
                    <div className="space-y-0.5">
                      <StatusBadge status={sub.status} />
                      {sub.reviewer_name && (
                        <div className="text-[10px] text-slate-400 font-medium">
                          {sub.reviewer_name}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="py-2 px-2.5 text-right font-mono font-bold text-xs">
                    <span className={sub.status === 'approved' ? 'text-emerald-600' : 'text-slate-400'}>
                      {sub.status === 'approved' ? `+${sub.points_awarded}` : `+${sub.base_points || 20}`}p
                    </span>
                  </td>

                  <td className="py-2 px-2.5 text-center">
                    <button
                      onClick={() => {
                        setSelectedSubmission(sub);
                        setIsViewerOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition cursor-pointer"
                    >
                      <Eye className="w-3 h-3 text-slate-600" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF / Evidence Viewer Modal */}
      <PDFViewerModal
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setSelectedSubmission(null);
        }}
        submission={selectedSubmission}
      />
    </div>
  );
};
