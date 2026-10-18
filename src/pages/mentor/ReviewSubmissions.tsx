import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Submission } from '../../types';
import { apiRequest } from '../../lib/api';
import { StatusBadge } from '../../components/common/Badge';
import { PDFViewerModal } from '../../components/common/PDFViewerModal';
import {
  FileCheck2,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  Sparkles,
} from 'lucide-react';

export const ReviewSubmissions: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeFilter, setActiveFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Evidence Modal state
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const loadSubmissions = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest<Submission[]>('/api/submissions/assigned');
      setSubmissions(data);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [user]);

  const handleReview = async (action: 'approve' | 'reject', feedback?: string) => {
    if (!selectedSubmission) return;
    await apiRequest(`/api/submissions/${selectedSubmission.id}/review`, {
      method: 'POST',
      body: JSON.stringify({
        action,
        mentor_feedback: feedback,
      }),
    });
    await loadSubmissions();
  };

  const filteredSubmissions = submissions.filter((s) => {
    const matchesFilter = activeFilter === 'all' || s.status === activeFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      (s.student_name && s.student_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.student_roll_no && s.student_roll_no.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.activity_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.category_name && s.category_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const approvedCount = submissions.filter((s) => s.status === 'approved').length;
  const rejectedCount = submissions.filter((s) => s.status === 'rejected').length;

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-indigo-600" />
            <span>Certificate Verification Queue</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review and verify student activity certificates for degree activity credits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
            {pendingCount} Pending Reviews
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 w-full sm:w-auto">
          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'pending'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({pendingCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('approved')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'approved'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Approved ({approvedCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('rejected')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'rejected'
                ? 'bg-white text-rose-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected ({rejectedCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({submissions.length})
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search student, roll no, activity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
          />
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Loading student submissions...
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="py-12 text-center space-y-1.5">
            <CheckCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-xs text-slate-700">No submissions found</p>
            <p className="text-xs text-slate-400">All submissions in this category have been processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3.5">Student Details</th>
                  <th className="py-2.5 px-3.5">Activity Title</th>
                  <th className="py-2.5 px-3.5">Category</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5 text-right">Points</th>
                  <th className="py-2.5 px-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900 text-xs">
                        {sub.student_name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {sub.student_roll_no} • Sem {sub.student_semester || 6}
                      </div>
                    </td>

                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900 text-xs">{sub.activity_title}</div>
                      <div className="text-[11px] text-slate-500">
                        {sub.schema_activity_name || sub.category_name}
                      </div>
                      {sub.mentor_feedback && (
                        <div className="mt-1 text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                          Remark: {sub.mentor_feedback}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3.5">
                      <span className="font-medium text-slate-700 text-xs">{sub.category_name}</span>
                    </td>

                    <td className="py-3 px-3.5">
                      <div className="space-y-1">
                        <StatusBadge status={sub.status} />
                        {sub.ai_audit_results && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <Sparkles className="w-2.5 h-2.5 text-indigo-600" />
                              AI Verified ✓
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3.5 text-right font-mono font-bold text-xs">
                      <span
                        className={
                          sub.status === 'approved'
                            ? 'text-emerald-700'
                            : sub.status === 'rejected'
                            ? 'text-slate-400 line-through'
                            : 'text-indigo-700'
                        }
                      >
                        {sub.status === 'approved' ? `+${sub.points_awarded}` : `+${sub.base_points || 20}`} pts
                      </span>
                    </td>

                    <td className="py-3 px-3.5 text-center">
                      <button
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setIsViewerOpen(true);
                        }}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          sub.status === 'pending'
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-white'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{sub.status === 'pending' ? 'Review' : 'View'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Evidence Viewer & Evaluation Modal */}
      <PDFViewerModal
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setSelectedSubmission(null);
        }}
        submission={selectedSubmission}
        canReview={true}
        onReview={handleReview}
      />
    </div>
  );
};
