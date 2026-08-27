import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Submission } from '../../types';
import { apiRequest } from '../../lib/api';
import { StatusBadge, MilestoneBadge } from '../../components/common/Badge';
import { PDFViewerModal } from '../../components/common/PDFViewerModal';
import {
  Users,
  Search,
  Award,
  Eye,
  GraduationCap,
  Sparkles,
  TrendingUp,
  X,
  FileCheck2,
  Calendar,
  Layers,
} from 'lucide-react';

export const MenteeList: React.FC = () => {
  const { user } = useAuth();
  const [mentees, setMentees] = useState<any[]>([]);
  const [filteredMentees, setFilteredMentees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Dossier Modal state for a selected student
  const [selectedStudentDossier, setSelectedStudentDossier] = useState<{
    student: User;
    total_points: number;
    category_breakdown: any[];
    submissions: Submission[];
  } | null>(null);
  const [isDossierLoading, setIsDossierLoading] = useState(false);

  // Evidence PDF preview state
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const loadMentees = async () => {
    try {
      setIsLoading(true);
      const data = await apiRequest<{ mentees: any[] }>('/api/mentor/dashboard');
      setMentees(data.mentees || []);
      setFilteredMentees(data.mentees || []);
    } catch (err) {
      console.error('Failed to load mentees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMentees();
  }, [user]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMentees(mentees);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredMentees(
      mentees.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.roll_no.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q)
      )
    );
  }, [searchQuery, mentees]);

  const openStudentDossier = async (studentId: string) => {
    try {
      setIsDossierLoading(true);
      const data = await apiRequest(`/api/mentor/mentee/${studentId}`);
      setSelectedStudentDossier(data);
    } catch (err) {
      console.error('Failed to load student dossier:', err);
    } finally {
      setIsDossierLoading(false);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            <span>Assigned Faculty Mentorship Roster</span>
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Official department list of mentees under your supervision. View individual progress and activity dossiers.
          </p>
        </div>

        <div className="text-xs font-semibold px-2.5 py-1 rounded bg-purple-50 border border-purple-100 text-purple-900">
          {mentees.length} Assigned Students
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search student name, roll number, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 text-xs rounded border border-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-hidden"
          />
        </div>
      </div>

      {/* Mentees Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-2 px-3">Student Profile</th>
                <th className="py-2 px-3">Roll Number</th>
                <th className="py-2 px-3">Semester & CGPA</th>
                <th className="py-2 px-3">200-Pt Progress</th>
                <th className="py-2 px-3">Pending Reviews</th>
                <th className="py-2 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMentees.map((m) => {
                const pct = m.completed_percentage;
                return (
                  <tr key={m.id} className="hover:bg-purple-50/30 transition">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                          alt={m.name}
                          className="w-7 h-7 rounded object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{m.name}</div>
                          <div className="text-[10px] text-slate-400">{m.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 text-xs">
                      {m.roll_no}
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-800 text-xs">Sem {m.semester || 6}</div>
                      <div className="text-[10px] text-amber-700 font-bold font-mono">
                        CGPA: {m.cgpa || 8.0}
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="w-32 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold font-mono text-slate-900">
                            {m.approved_points} <span className="text-slate-400">/ 200</span>
                          </span>
                          <span className="font-bold text-purple-600 font-mono">{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-600 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      {m.pending_submissions_count > 0 ? (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 font-mono">
                          {m.pending_submissions_count} Pending
                        </span>
                      ) : (
                        <span className="text-emerald-700 text-[11px] font-semibold">
                          All Evaluated
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => openStudentDossier(m.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-purple-300" />
                        <span>Dossier</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Dossier Modal */}
      {selectedStudentDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <img
                  src={selectedStudentDossier.student.avatar}
                  alt=""
                  className="w-8 h-8 rounded object-cover ring-1 ring-purple-400"
                />
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                    <span>{selectedStudentDossier.student.name}</span>
                    <span className="text-xs font-normal text-slate-400 font-mono">
                      ({selectedStudentDossier.student.roll_no})
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Sem {selectedStudentDossier.student.semester} • CGPA: {selectedStudentDossier.student.cgpa} • Total Points: <strong className="text-purple-400 font-mono">{selectedStudentDossier.total_points}/200p</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentDossier(null)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dossier Body */}
            <div className="p-4 overflow-y-auto space-y-4">
              {/* Category Breakdown */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Category Point Caps Distribution
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedStudentDossier.category_breakdown.map((cat: any) => (
                    <div key={cat.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="text-xs font-bold text-slate-800 truncate">{cat.name}</div>
                      <div className="text-xs font-mono font-bold text-purple-700 mt-0.5">
                        {cat.capped_points}/{cat.max_cap_points}p
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submissions List */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  All Activity Submissions ({selectedStudentDossier.submissions.length})
                </h4>

                <div className="space-y-2">
                  {selectedStudentDossier.submissions.map((sub: Submission) => (
                    <div
                      key={sub.id}
                      className="p-2.5 rounded-lg border border-slate-200 hover:border-purple-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{sub.activity_title}</span>
                          <StatusBadge status={sub.status} />
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {sub.category_name} • Rule: {sub.schema_activity_name} (v{sub.schema_version_snapshot})
                        </div>
                        {sub.mentor_feedback && (
                          <div className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block">
                            <strong>Remarks:</strong> {sub.mentor_feedback}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold font-mono text-xs text-purple-700">
                          {sub.status === 'approved' ? `+${sub.points_awarded}` : `+${sub.base_points || 20}`}p
                        </span>
                        <button
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setIsViewerOpen(true);
                          }}
                          className="px-2.5 py-1 rounded text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition cursor-pointer"
                        >
                          Evidence
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Evidence Preview Modal */}
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
