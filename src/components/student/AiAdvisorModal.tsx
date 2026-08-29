import React, { useState, useEffect } from 'react';
import { GraphRAGAdvisorResponse } from '../../types';
import { apiRequest } from '../../lib/api';
import {
  Sparkles,
  X,
  Send,
  Target,
  CheckCircle2,
  AlertTriangle,
  Award,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Network,
  Cpu,
  ShieldCheck,
  Zap,
  Layers,
  Info,
} from 'lucide-react';

interface AiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSubmitModal?: () => void;
}

export const AiAdvisorModal: React.FC<AiAdvisorModalProps> = ({
  isOpen,
  onClose,
  onOpenSubmitModal,
}) => {
  const [query, setQuery] = useState('');
  const [advisorData, setAdvisorData] = useState<GraphRAGAdvisorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'advice' | 'evidence' | 'graph'>('advice');

  const presetQueries = [
    'What should I do to reach 200 points?',
    'Which categories have remaining headroom?',
    'What activities can I complete this semester?',
    'Show my developed skills & recommended activities',
  ];

  const fetchAdvisorRecommendation = async (customQuery?: string) => {
    try {
      setIsLoading(true);
      const res = await apiRequest<GraphRAGAdvisorResponse>('/api/student/ai-advisor', {
        method: 'POST',
        body: JSON.stringify({ query: customQuery || query }),
      });
      setAdvisorData(res);
    } catch (err) {
      console.error('Failed to load GraphRAG AI Advisor response:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !advisorData) {
      fetchAdvisorRecommendation();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const evidence = advisorData?.graph_evidence;
  const advice = advisorData?.advice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#091124] border border-indigo-900/60 rounded-2xl shadow-2xl text-slate-100 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-[#0C1733] border-b border-indigo-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-5 h-5 text-sky-100 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">GraphRAG Student AI Advisor</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                  <Network className="w-3 h-3 text-sky-400" />
                  Knowledge Graph Derived
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Deterministic degree target calculations grounded in university schema caps
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-5 bg-[#070D1E] border-b border-indigo-950 text-xs shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('advice')}
              className={`py-3 px-4 font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'advice'
                  ? 'border-indigo-500 text-indigo-300 bg-indigo-950/30'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>AI Guidance & Action Plan</span>
            </button>
            <button
              onClick={() => setActiveTab('evidence')}
              className={`py-3 px-4 font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'evidence'
                  ? 'border-indigo-500 text-indigo-300 bg-indigo-950/30'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Graph Evidence ({evidence?.current_points || 0}/200 Pts)</span>
            </button>
            <button
              onClick={() => setActiveTab('graph')}
              className={`py-3 px-4 font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'graph'
                  ? 'border-indigo-500 text-indigo-300 bg-indigo-950/30'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Graph Node Inspector</span>
            </button>
          </div>

          {advisorData?.model_used && (
            <span className="text-[10px] text-slate-500 font-mono hidden sm:block">
              Engine: {advisorData.model_used}
            </span>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-[#091124]">
          {/* Query Input Section */}
          <div className="space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (query.trim()) fetchAdvisorRecommendation(query);
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask GraphRAG Advisor (e.g., 'What activities can I do to get 30 points?')"
                  className="w-full pl-4 pr-10 py-2.5 bg-[#060C1B] border border-indigo-900/60 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
                <button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="absolute right-2 top-2 p-1 text-indigo-400 hover:text-white disabled:opacity-40 transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask GraphRAG</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Preset Prompt Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mr-1">
                Suggested:
              </span>
              {presetQueries.map((pq, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(pq);
                    fetchAdvisorRecommendation(pq);
                  }}
                  className="px-2.5 py-1 bg-[#0D1836] hover:bg-indigo-950 border border-indigo-900/40 hover:border-indigo-500 text-slate-300 hover:text-white rounded-lg text-[11px] transition cursor-pointer"
                >
                  {pq}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-xs font-bold text-indigo-300">Retrieving Knowledge Graph Entities...</p>
                <p className="text-[11px] text-slate-500">
                  Extracting student points, category caps, semester limits & eligible catalog items
                </p>
              </div>
            </div>
          ) : activeTab === 'advice' && advice ? (
            <div className="space-y-5">
              {/* Executive Summary Card */}
              <div className="p-4 rounded-xl bg-[#0d1733] border border-indigo-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-sky-400" />
                    <h3 className="text-sm font-bold text-white">Graph-Grounded Assessment</h3>
                  </div>
                  {evidence && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Remaining Needed: {evidence.remaining_points} Pts
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{advice.summary}</p>
                <div className="pt-2 border-t border-indigo-900/40 text-xs text-sky-300 font-medium flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>{advice.target_plan}</span>
                </div>
              </div>

              {/* Recommended Activities from Graph */}
              {advice.recommended_activities && advice.recommended_activities.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      <span>Recommended Eligible Activities (From Graph Catalog)</span>
                    </h3>
                    {onOpenSubmitModal && (
                      <button
                        onClick={onOpenSubmitModal}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Submit Activity Proof</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {advice.recommended_activities.map((act, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl bg-[#060C1B] border border-slate-800 hover:border-indigo-500/60 transition flex flex-col justify-between space-y-2 group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                              {act.category_name}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              +{act.base_points} Pts
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-100 group-hover:text-indigo-300 transition">
                            {act.title}
                          </h4>
                          {act.venue_or_criteria && (
                            <p className="text-[11px] text-slate-400 line-clamp-2">
                              {act.venue_or_criteria}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                          <span className="uppercase font-semibold tracking-wider text-slate-400">
                            Source: {act.source}
                          </span>
                          {onOpenSubmitModal && (
                            <button
                              onClick={onOpenSubmitModal}
                              className="text-indigo-400 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <span>Claim Credit</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Headroom Strategy */}
              {advice.category_strategy && advice.category_strategy.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Category Headroom Strategy</span>
                  </h3>
                  <div className="space-y-1.5">
                    {advice.category_strategy.map((strat, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-[#070D1E] border border-slate-800/80 text-xs text-slate-300 flex items-center gap-2"
                      >
                        <span>{strat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Semester Cap Guidance */}
              {advice.semester_guidance && (
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{advice.semester_guidance}</span>
                </div>
              )}
            </div>
          ) : activeTab === 'evidence' && evidence ? (
            <div className="space-y-5">
              {/* Numerical Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#070D1E] border border-slate-800 text-center space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Effective Points</div>
                  <div className="text-xl font-extrabold text-sky-400">{evidence.current_points}</div>
                  <div className="text-[10px] text-slate-500">Out of {evidence.target_points} Goal</div>
                </div>
                <div className="p-3 rounded-xl bg-[#070D1E] border border-slate-800 text-center space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Remaining Needed</div>
                  <div className="text-xl font-extrabold text-amber-400">{evidence.remaining_points}</div>
                  <div className="text-[10px] text-slate-500">To Reach 200 Pts</div>
                </div>
                <div className="p-3 rounded-xl bg-[#070D1E] border border-slate-800 text-center space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Current Sem Cap</div>
                  <div className="text-xl font-extrabold text-indigo-400">{evidence.semester_headroom}</div>
                  <div className="text-[10px] text-slate-500">Pts Headroom Left</div>
                </div>
                <div className="p-3 rounded-xl bg-[#070D1E] border border-slate-800 text-center space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Milestone Tier</div>
                  <div className="text-base font-extrabold text-emerald-400 mt-1">{evidence.milestone_tier}</div>
                  <div className="text-[10px] text-slate-500">Sem {evidence.current_semester}</div>
                </div>
              </div>

              {/* Category Headroom Breakdown Table */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Category Headroom Audit
                </h3>
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#060C1B]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0D1836] text-slate-400 font-semibold text-[11px]">
                      <tr>
                        <th className="p-3">Category Domain</th>
                        <th className="p-3 text-center">Earned</th>
                        <th className="p-3 text-center">Category Cap</th>
                        <th className="p-3 text-center">Headroom</th>
                        <th className="p-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {evidence.category_headroom.map((ch) => (
                        <tr key={ch.category_id} className="hover:bg-slate-900/40">
                          <td className="p-3 font-semibold text-slate-200">{ch.category_name}</td>
                          <td className="p-3 text-center font-bold text-sky-400">{ch.earned} pts</td>
                          <td className="p-3 text-center text-slate-400">{ch.cap} pts</td>
                          <td className="p-3 text-center font-bold text-amber-400">{ch.headroom} pts</td>
                          <td className="p-3 text-right">
                            {ch.status === 'CAPPED' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                Capped
                              </span>
                            ) : ch.status === 'IN_PROGRESS' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                In Progress
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                Not Started
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Completed Proof List in Graph */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Approved Proof & Certificates in Knowledge Graph ({evidence.completed_activities_list.length})
                </h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {evidence.completed_activities_list.map((ca) => (
                    <div
                      key={ca.id}
                      className="p-2.5 rounded-lg bg-[#070D1E] border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <span className="font-semibold text-slate-200">{ca.title}</span>
                          <span className="text-[10px] text-slate-500 ml-2">
                            ({ca.category_name} • Sem {ca.semester})
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-400">+{ca.points} Pts</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'graph' ? (
            /* Graph Node & Edge Inspector */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#060C1B] border border-indigo-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-sky-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Derived Knowledge Graph Topology
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Idempotent Graph Synchronization
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Below is the structural entity-relationship model generated from Creditz database records.
                  Gemini GraphRAG consumes these exact graph nodes and typed relationships as ground truth.
                </p>

                {/* Simulated Visual Graph Structure Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-lg bg-[#0D1836] border border-indigo-900/60">
                    <div className="text-[10px] text-slate-400 font-semibold">Student Entity</div>
                    <div className="font-bold text-indigo-300 mt-0.5">{evidence?.student_name}</div>
                    <div className="text-[10px] text-slate-500">Sem {evidence?.current_semester}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0D1836] border border-indigo-900/60">
                    <div className="text-[10px] text-slate-400 font-semibold">Department Node</div>
                    <div className="font-bold text-indigo-300 mt-0.5">{evidence?.department_name}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0D1836] border border-indigo-900/60">
                    <div className="text-[10px] text-slate-400 font-semibold">Faculty Mentor</div>
                    <div className="font-bold text-indigo-300 mt-0.5">{evidence?.mentor_name}</div>
                  </div>
                </div>

                {/* Graph Relationships Schema Tree */}
                <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs text-slate-300 font-mono">
                  <div className="text-[11px] font-bold text-sky-400 font-sans mb-2">
                    Graph Relationship Edges Active for Student:
                  </div>
                  <div className="p-2 bg-[#080E21] rounded border border-slate-800">
                    Student ({evidence?.student_name}) → <span className="text-amber-400 font-bold">BELONGS_TO</span> → Department ({evidence?.department_name})
                  </div>
                  <div className="p-2 bg-[#080E21] rounded border border-slate-800">
                    Student ({evidence?.student_name}) → <span className="text-amber-400 font-bold">MENTORED_BY</span> → Faculty ({evidence?.mentor_name})
                  </div>
                  <div className="p-2 bg-[#080E21] rounded border border-slate-800">
                    Student ({evidence?.student_name}) → <span className="text-emerald-400 font-bold">COMPLETED</span> → {evidence?.completed_activities_count} Approved Activities
                  </div>
                  <div className="p-2 bg-[#080E21] rounded border border-slate-800">
                    Activity → <span className="text-sky-400 font-bold">HAS_CATEGORY</span> → 6 Schema Categories (with domain caps)
                  </div>
                  <div className="p-2 bg-[#080E21] rounded border border-slate-800">
                    Certificate → <span className="text-purple-400 font-bold">PROVES</span> → Activity Verification Proofs
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0C1733] border-t border-indigo-900/50 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Deterministic GraphRAG Layer Grounded in University Rules</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
