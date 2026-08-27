import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Submission } from '../../types';
import { apiRequest } from '../../lib/api';
import { StatusBadge } from '../../components/common/Badge';
import { PDFViewerModal } from '../../components/common/PDFViewerModal';
import {
  FileCheck2,
  Search,
  Filter,
  Eye,
  Calendar,
  Award,
  Sparkles,
  Download,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';

interface SubmissionHistoryProps {
  onOpenSubmitModal: () => void;
}

export const SubmissionHistory: React.FC<SubmissionHistoryProps> = ({ onOpenSubmitModal }) => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const loadSubmissions = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest<Submission[]>('/api/submissions/my');
      setSubmissions(data);
      setFilteredSubmissions(data);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [user]);

  useEffect(() => {
    let result = submissions;
    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.activity_title.toLowerCase().includes(term) ||
          (s.category_name && s.category_name.toLowerCase().includes(term)) ||
          (s.schema_activity_name && s.schema_activity_name.toLowerCase().includes(term))
      );
    }
    setFilteredSubmissions(result);
  }, [searchTerm, statusFilter, submissions]);

  const totalEarnedPoints = submissions
    .filter((s) => s.status === 'approved')
    .reduce((acc, curr) => acc + (curr.points_awarded || 0), 0);

  return (
    <div className="space-y-3.5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-indigo-600" />
            <span>Activity Submissions & Audit Dossier</span>
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Cryptographic audit trail of all certificates submitted for faculty mentor verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded bg-indigo-50 border border-indigo-100 text-indigo-900 text-xs font-semibold">
            Awarded: <span className="text-indigo-600 font-bold font-mono">+{totalEarnedPoints} pts</span>
          </div>
          <button
            onClick={onOpenSubmitModal}
            className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Submission</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search activity, category, rule..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 text-xs rounded border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3 h-3 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2 py-1 rounded border border-slate-200 focus:border-indigo-500 bg-white"
          >
            <option value="all">All ({submissions.length})</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Submissions Table / Dossier Cards */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Loading submission records...
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="py-12 text-center space-y-1.5">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-700">No submissions found</p>
            <p className="text-[11px] text-slate-400">
              Try adjusting your search filters or submit a new certificate.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-2 px-3">Activity Title & Criteria</th>
                  <th className="py-2 px-3">Category Domain</th>
                  <th className="py-2 px-3">Submission Date</th>
                  <th className="py-2 px-3">Status & Reviewer</th>
                  <th className="py-2 px-3 text-right">Points</th>
                  <th className="py-2 px-3 text-center">Evidence File</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 text-xs">
                        {sub.activity_title}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Matched Rule: <span className="font-medium text-slate-700">{sub.schema_activity_name}</span>
                        <span className="ml-1.5 inline-block px-1 py-0.2 rounded bg-indigo-50 text-indigo-700 text-[9px] font-mono border border-indigo-100">
                          v{sub.schema_version_snapshot}
                        </span>
                      </div>
                      {sub.mentor_feedback && (
                        <div className="mt-1 text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block">
                          <strong>Remarks:</strong> {sub.mentor_feedback}
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="font-medium text-slate-700 text-xs">{sub.category_name}</span>
                    </td>

                    <td className="py-2.5 px-3 text-slate-500 text-xs">
                      <div>{new Date(sub.submitted_at).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">Done: {sub.completion_date}</div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="space-y-0.5">
                        <StatusBadge status={sub.status} />
                        {sub.reviewer_name && (
                          <div className="text-[9px] text-slate-400">
                            By {sub.reviewer_name}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <div
                        className={`font-bold font-mono text-xs ${
                          sub.status === 'approved'
                            ? 'text-emerald-700'
                            : sub.status === 'rejected'
                            ? 'text-slate-400 line-through'
                            : 'text-amber-700'
                        }`}
                      >
                        {sub.status === 'approved' ? `+${sub.points_awarded}` : `+${sub.base_points || 20}`}p
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setIsViewerOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-indigo-300" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
