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
  Filter,
  ShieldCheck,
  Award,
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
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-purple-600" />
            <span>Faculty Evidence Verification Desk</span>
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Review certificate evidence against official HOD marking criteria and schema version snapshots.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-900">
            {pendingCount} Pending Reviews
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded border border-slate-200 w-full sm:w-auto">
          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
              activeFilter === 'pending'
                ? 'bg-white text-purple-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Pending ({pendingCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('approved')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
              activeFilter === 'approved'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckCircle className="w-3 h-3" />
            <span>Approved ({approvedCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('rejected')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
              activeFilter === 'rejected'
                ? 'bg-white text-rose-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <XCircle className="w-3 h-3" />
            <span>Rejected ({rejectedCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({submissions.length})
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search student, roll no, course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 text-xs rounded border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-hidden"
          />
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Loading student submissions...
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="py-12 text-center space-y-1.5">
            <CheckCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-xs text-slate-700">No submissions matching this view</p>
            <p className="text-[11px] text-slate-400">All submissions in this category have been processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-2 px-3">Student & Roll No</th>
                  <th className="py-2 px-3">Activity Title</th>
                  <th className="py-2 px-3">Category Domain</th>
                  <th className="py-2 px-3">Status & Version</th>
                  <th className="py-2 px-3 text-right">Points</th>
                  <th className="py-2 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-purple-50/20 transition">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 text-xs">
                        {sub.student_name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {sub.student_roll_no} • Sem {sub.student_semester || 6}
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 text-xs">{sub.activity_title}</div>
                      <div className="text-[10px] text-slate-500">
                        Rule: {sub.schema_activity_name}
                      </div>
                      {sub.mentor_feedback && (
                        <div className="mt-1 text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block">
                          {sub.mentor_feedback}
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="font-medium text-slate-700 text-xs">{sub.category_name}</span>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="space-y-0.5">
                        <StatusBadge status={sub.status} />
                        <div className="text-[9px] text-slate-400 font-mono">
                          v{sub.schema_version_snapshot}
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-xs">
                      <span
                        className={
                          sub.status === 'approved'
                            ? 'text-emerald-700'
                            : sub.status === 'rejected'
                            ? 'text-slate-400 line-through'
                            : 'text-purple-700'
                        }
                      >
                        {sub.status === 'approved' ? `+${sub.points_awarded}` : `+${sub.base_points || 20}`}p
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setIsViewerOpen(true);
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                          sub.status === 'pending'
                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        <Eye className="w-3 h-3" />
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
