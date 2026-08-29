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

  const presetQueries = [
    'How do I reach my 200 points goal?',
    'Which categories can I still get points in?',
    'What activities can I complete this semester?',
    'Show my developed skills & recommended tasks',
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
                <h2 className="text-lg font-bold text-white tracking-tight">AI Credit & Clearance Advisor</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Verified Rules
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Your personal guide for credit point clearance, activity recommendations, and university caps
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
                  placeholder="Ask a question (e.g. 'How do I get 30 points this semester?')"
                  className="w-full pl-4 pr-10 py-2.5 bg-[#060C1B] border border-indigo-900/60 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
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
                    <span>Ask Advisor</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Preset Prompt Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mr-1">
                Quick Questions:
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
                <p className="text-xs font-bold text-indigo-300">Checking your credit rules & status...</p>
                <p className="text-[11px] text-slate-400">
                  Calculating points earned, available caps, and eligible activities for you
                </p>
              </div>
            </div>
          ) : advice ? (
            <div className="space-y-5">
              {/* Executive Summary Card */}
              <div className="p-4 rounded-xl bg-[#0d1733] border border-indigo-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-sky-400" />
                    <h3 className="text-sm font-bold text-white">Your Progress Assessment</h3>
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

              {/* Recommended Activities */}
              {advice.recommended_activities && advice.recommended_activities.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      <span>Recommended Activities to Earn Points</span>
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
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0C1733] border-t border-indigo-900/50 flex items-center justify-between text-xs text-slate-300 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Grounded in Official University Credit Regulations</span>
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
