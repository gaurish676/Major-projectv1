import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Submission } from '../../types';
import { apiRequest } from '../../lib/api';
import { StatusBadge } from '../../components/common/Badge';
import { PDFViewerModal } from '../../components/common/PDFViewerModal';
import { DeliveryStatusTracker } from '../../components/common/DeliveryStatusTracker';
import { getCategoryPlainName, getCategoryEmoji, CATEGORIES } from '../../lib/categories';
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
  Camera,
  ChevronDown,
  ChevronUp,
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
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [expandedTrackerId, setExpandedTrackerId] = useState<string | null>(null);

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
    if (categoryFilter !== 'all') {
      result = result.filter((s) => s.category_id === categoryFilter);
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
  }, [searchTerm, statusFilter, categoryFilter, submissions]);

  const totalEarnedPoints = submissions
    .filter((s) => s.status === 'approved')
    .reduce((acc, curr) => acc + (curr.points_awarded || 0), 0);

  const pendingPoints = submissions
    .filter((s) => s.status === 'pending')
    .reduce((acc, curr) => acc + (curr.base_points || 20), 0);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-blue-600" />
            <span>My Submitted Certificates & Progress Tracker</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track live faculty review status, degree points awarded, and certificate audit dossiers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
            Awarded: <span className="text-emerald-700 font-bold font-mono">+{totalEarnedPoints} pts</span>
          </div>
          {pendingPoints > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
              Pending: <span className="text-amber-700 font-bold font-mono">+{pendingPoints} pts</span>
            </div>
          )}
          <button
            onClick={onOpenSubmitModal}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Camera className="w-3.5 h-3.5 text-amber-300" />
            <span>Add Certificate</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search certificate title, issuer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-500 bg-white"
            >
              <option value="all">All Status ({submissions.length})</option>
              <option value="approved">Approved</option>
              <option value="pending">Under Review</option>
              <option value="rejected">Action Required</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:border-indigo-500 bg-white"
            >
              <option value="all">All Categories</option>
              {Object.values(CATEGORIES).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Submissions List / Tracker Cards */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-xl p-12 text-center text-slate-400 text-xs border border-slate-200">
            Loading submission records...
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center space-y-2 border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No submissions found</p>
            <p className="text-xs text-slate-400">
              Try adjusting your search filters or snap a new certificate.
            </p>
          </div>
        ) : (
          filteredSubmissions.map((sub) => {
            const isExpanded = expandedTrackerId === sub.id;
            return (
              <div
                key={sub.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition hover:border-indigo-200"
              >
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base">{getCategoryEmoji(sub.category_id)}</span>
                      <h3 className="font-bold text-slate-900 text-sm">
                        {sub.activity_title}
                      </h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200">
                        {getCategoryPlainName(sub.category_id, sub.category_name)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>Submitted: {new Date(sub.submitted_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Event Date: <strong className="text-slate-600">{sub.completion_date}</strong></span>
                      {sub.mentor_feedback && (
                        <>
                          <span>•</span>
                          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                            Remarks: {sub.mentor_feedback}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
                    <div className="text-right">
                      <div
                        className={`font-bold font-mono text-sm ${
                          sub.status === 'approved'
                            ? 'text-emerald-700'
                            : sub.status === 'rejected'
                            ? 'text-rose-600 line-through'
                            : 'text-amber-700'
                        }`}
                      >
                        {sub.status === 'approved' ? `+${sub.points_awarded}` : `+${sub.base_points || 20}`} pts
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {sub.status === 'approved' ? 'Credited' : 'Pending'}
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedTrackerId(isExpanded ? null : sub.id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Tracker</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    <button
                      onClick={() => {
                        setSelectedSubmission(sub);
                        setIsViewerOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-300" />
                      <span>View Proof</span>
                    </button>
                  </div>
                </div>

                {/* Compact tracker strip when not expanded */}
                {!isExpanded && (
                  <div className="px-4 pb-3 pt-1 border-t border-slate-50 flex items-center justify-between">
                    <DeliveryStatusTracker submission={sub} compact={true} />
                    <button
                      onClick={() => setExpandedTrackerId(sub.id)}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      Expand delivery steps ↓
                    </button>
                  </div>
                )}

                {/* Full 3-Step Visual Delivery Tracker when expanded */}
                {isExpanded && (
                  <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                    <DeliveryStatusTracker submission={sub} />
                  </div>
                )}
              </div>
            );
          })
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
