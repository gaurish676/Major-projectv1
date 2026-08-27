import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SchemaRequest } from '../../types';
import { apiRequest } from '../../lib/api';
import { StatusBadge } from '../../components/common/Badge';
import { SchemaRequestModal } from '../../components/common/SchemaRequestModal';
import {
  GitPullRequest,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface MentorRequestsProps {
  onOpenModal: () => void;
  isModalOpen: boolean;
  onCloseModal: () => void;
}

export const MentorRequests: React.FC<MentorRequestsProps> = ({
  onOpenModal,
  isModalOpen,
  onCloseModal,
}) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SchemaRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest<SchemaRequest[]>('/api/schema/requests/my');
      setRequests(data);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [user]);

  const handleCreated = (newReq: SchemaRequest) => {
    setRequests([newReq, ...requests]);
  };

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <GitPullRequest className="w-4 h-4 text-purple-600" />
            <span>Schema Change Request Pipeline</span>
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Propose new industry certifications or point weightage adjustments directly to the Head of Department (HOD).
          </p>
        </div>

        <button
          onClick={onOpenModal}
          className="px-3 py-1.5 rounded-md text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Propose Rule</span>
        </button>
      </div>

      {/* Requests List */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Loading schema change requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white p-8 rounded-lg border border-slate-200 text-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
              <GitPullRequest className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-800">No schema requests submitted yet</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Have you identified a new industry certification or hackathon category? Submit a proposal to the HOD for official point inclusion.
            </p>
            <button
              onClick={onOpenModal}
              className="px-3 py-1.5 rounded text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition cursor-pointer"
            >
              Submit First Request
            </button>
          </div>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-lg p-3.5 border border-slate-200 shadow-2xs space-y-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {req.category_name}
                  </span>
                  <StatusBadge status={req.status} />
                </div>
                <div className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Proposed: +{req.requested_points}p
                </div>
              </div>

              <div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                  {req.activity_name}
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  <strong>Academic Justification:</strong> {req.reason}
                </p>
              </div>

              {req.hod_remarks && (
                <div className="p-2.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
                  <div className="font-semibold text-slate-900 mb-0.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    <span>HOD Decision Remarks:</span>
                  </div>
                  <p>{req.hod_remarks}</p>
                </div>
              )}

              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>Submitted: {new Date(req.created_at).toLocaleDateString()}</span>
                {req.status === 'approved' && (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[10px]">
                    <CheckCircle2 className="w-3 h-3" /> Incorporated into Official Schema
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <SchemaRequestModal
        isOpen={isModalOpen}
        onClose={onCloseModal}
        onSuccess={handleCreated}
      />
    </div>
  );
};
