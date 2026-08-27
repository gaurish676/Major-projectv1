import React, { useState, useEffect } from 'react';
import { SchemaRequest } from '../../types';
import { apiRequest } from '../../lib/api';
import { StatusBadge } from '../../components/common/Badge';
import {
  GitPullRequest,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Users,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';

export const MentorRequestsQueue: React.FC = () => {
  const [requests, setRequests] = useState<SchemaRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'reviewed'>('pending');
  const [isLoading, setIsLoading] = useState(true);

  // Review Action Modal
  const [selectedRequest, setSelectedRequest] = useState<SchemaRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [approvedPoints, setApprovedPoints] = useState<number>(20);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest<SchemaRequest[]>('/api/schema/requests');
      setRequests(data);
    } catch (err) {
      console.error('Failed to load schema requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const openReviewModal = (req: SchemaRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(req);
    setActionType(action);
    setApprovedPoints(req.requested_points);
    setRemarks(
      action === 'approve'
        ? 'Approved and incorporated into official department schema.'
        : 'Does not meet current academic criteria.'
    );
  };

  const handleConfirmDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setIsSubmitting(true);
    try {
      await apiRequest(`/api/schema/requests/${selectedRequest.id}/review`, {
        method: 'POST',
        body: JSON.stringify({
          action: actionType,
          approved_points: actionType === 'approve' ? Number(approvedPoints) : undefined,
          hod_remarks: remarks,
        }),
      });

      setToastMessage(
        actionType === 'approve'
          ? `Request for "${selectedRequest.activity_name}" approved! New rule added to schema catalog (+${approvedPoints} pts).`
          : `Request for "${selectedRequest.activity_name}" rejected.`
      );
      setSelectedRequest(null);
      await loadRequests();
    } catch (err) {
      console.error('Failed to review request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const reviewedRequests = requests.filter((r) => r.status !== 'pending');
  const displayedRequests = activeTab === 'pending' ? pendingRequests : reviewedRequests;

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <GitPullRequest className="w-4 h-4 text-indigo-600" />
            <span>Mentor Schema Change Pipeline</span>
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Faculty proposals for new activity types and point adjustments. Approving automatically injects the rule into the active schema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900">
            {pendingRequests.length} Pending Review
          </span>
        </div>
      </div>

      {toastMessage && (
        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded border border-slate-200 w-fit">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-3 py-1 rounded text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-white text-indigo-600 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3 h-3" />
          <span>Pending ({pendingRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reviewed')}
          className={`px-3 py-1 rounded text-xs font-semibold transition flex items-center gap-1 cursor-pointer ${
            activeTab === 'reviewed'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle className="w-3 h-3" />
          <span>Past Decisions ({reviewedRequests.length})</span>
        </button>
      </div>

      {/* Requests Stream */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Loading schema requests...
          </div>
        ) : displayedRequests.length === 0 ? (
          <div className="bg-white p-8 rounded-lg border border-slate-200 text-center space-y-1.5">
            <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto" />
            <p className="font-bold text-xs sm:text-sm text-slate-800">
              {activeTab === 'pending' ? 'No pending mentor requests!' : 'No past reviewed requests.'}
            </p>
            <p className="text-[11px] text-slate-400">
              Faculty mentors can submit proposals from their dashboard.
            </p>
          </div>
        ) : (
          displayedRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-lg p-3.5 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-start justify-between gap-4 hover:border-indigo-200 transition"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {req.category_name}
                  </span>
                  <StatusBadge status={req.status} />
                  <span className="text-[11px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                    Proposed: +{req.requested_points}p
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                    {req.activity_name}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                    <Users className="w-3 h-3 text-purple-500" />
                    <span>Proposed by: <strong>{req.mentor_name}</strong></span>
                    <span>• {new Date(req.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-md bg-slate-50 border border-slate-100 text-[11px] text-slate-700 leading-relaxed">
                  <strong className="text-slate-900 block mb-0.5">Mentor Justification:</strong>
                  {req.reason}
                </div>

                {req.hod_remarks && (
                  <div className="p-2.5 rounded-md bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-950">
                    <strong className="text-indigo-900 block mb-0.5">HOD Response Remarks:</strong>
                    {req.hod_remarks}
                  </div>
                )}
              </div>

              {/* Action Buttons for Pending */}
              {req.status === 'pending' && (
                <div className="flex md:flex-col items-center gap-1.5 shrink-0 pt-2 md:pt-0">
                  <button
                    onClick={() => openReviewModal(req, 'approve')}
                    className="w-full px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve & Publish</span>
                  </button>

                  <button
                    onClick={() => openReviewModal(req, 'reject')}
                    className="w-full px-3 py-1.5 rounded-md text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* HOD Review Decision Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <h3 className="font-bold text-white text-sm sm:text-base">
                {actionType === 'approve' ? 'Approve & Incorporate Schema Rule' : 'Reject Mentor Request'}
              </h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmDecision} className="p-4 space-y-3">
              <div className="p-2.5 rounded bg-slate-50 border border-slate-100 text-xs">
                <div className="font-bold text-slate-900 text-xs sm:text-sm">{selectedRequest.activity_name}</div>
                <div className="text-slate-500 text-[10px] mt-0.5">
                  Mentor: {selectedRequest.mentor_name} • Domain: {selectedRequest.category_name}
                </div>
              </div>

              {actionType === 'approve' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Final Approved Point Weightage (pts)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    step="5"
                    value={approvedPoints}
                    onChange={(e) => setApprovedPoints(Number(e.target.value))}
                    required
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 font-mono font-bold focus:ring-1 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    You can adjust the mentor's requested points before publishing to the schema.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  HOD Feedback Remarks {actionType === 'reject' && <span className="text-rose-500">*</span>}
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={2}
                  required={actionType === 'reject'}
                  placeholder="Enter remarks for the proposing faculty mentor..."
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-3.5 py-1.5 text-xs font-semibold text-white rounded shadow-2xs cursor-pointer ${
                    actionType === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isSubmitting
                    ? 'Processing...'
                    : actionType === 'approve'
                    ? 'Publish to Schema'
                    : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
