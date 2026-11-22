import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  X,
  CheckCircle2,
  AlertCircle,
  Award,
  BookOpen,
  TrendingUp,
  Layers,
  Zap,
  ChevronRight,
  ShieldCheck,
  User,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { GraphRAGAdvisorResponse, GraphEvidence } from '../../types';

interface AIAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string;
  studentName?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text?: string;
  advisorResponse?: GraphRAGAdvisorResponse;
  timestamp: string;
}

export const AIAdvisorModal: React.FC<AIAdvisorModalProps> = ({
  isOpen,
  onClose,
  studentId,
  studentName,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [evidence, setEvidence] = useState<GraphEvidence | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'What activities should I prioritize this semester?',
    'How do I reach the 200-point degree clearance threshold?',
    'Which of my activity categories still have headroom?',
    'Recommend technical activities to build AI & Cloud skills',
  ];

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Initial consult on modal open if messages empty
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      handleSendQuery('What activities should I prioritize this semester to meet degree clearance requirements?');
    }
  }, [isOpen]);

  const handleSendQuery = async (queryText: string) => {
    const cleanQuery = queryText.trim();
    if (!cleanQuery || isLoading) return;

    setError(null);
    const userMsgId = `msg_user_${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: cleanQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await apiRequest<GraphRAGAdvisorResponse>('/api/student/ai-advisor', {
        method: 'POST',
        body: JSON.stringify({
          query: cleanQuery,
          student_id: studentId,
        }),
      });

      if (response && response.graph_evidence) {
        setEvidence(response.graph_evidence);
      }

      const botMessage: ChatMessage = {
        id: `msg_bot_${Date.now()}`,
        sender: 'assistant',
        advisorResponse: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Failed to get AI advisor response:', err);
      setError(err.message || 'Unable to consult AI Advisor. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Creditz AI Academic Advisor</h3>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> GraphRAG Grounded
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">
                Institutional Knowledge Graph reasoning with AICTE 30-pts/semester cap enforcement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Knowledge Graph Evidence Bar */}
        {evidence && (
          <div className="px-5 py-2.5 bg-indigo-50/70 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                {evidence.student_name} (Sem {evidence.current_semester})
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <strong>{evidence.current_points}</strong> / {evidence.target_points} pts ({evidence.milestone_tier})
              </span>
              <span className="text-slate-400">•</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-medium">
                Sem Headroom: <strong>{evidence.semester_headroom} pts</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-slate-400 text-[11px]">Uncapped:</span>
              {evidence.category_headroom
                .filter((c) => c.headroom > 0)
                .slice(0, 3)
                .map((c) => (
                  <span
                    key={c.category_id}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-slate-700 shadow-2xs"
                  >
                    {c.category_name.split(' ')[0]}: +{c.headroom}
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Chat History & Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              {msg.sender === 'user' ? (
                <div className="max-w-[85%] bg-indigo-600 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 shadow-sm">
                  <p className="text-sm">{msg.text}</p>
                  <span className="block text-[10px] text-indigo-200 mt-1 text-right">
                    {msg.timestamp}
                  </span>
                </div>
              ) : (
                <div className="w-full max-w-3xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <span>Creditz Advisor</span>
                    {msg.advisorResponse?.model_used && (
                      <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-100">
                        {msg.advisorResponse.model_used}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-normal ml-auto">
                      {msg.timestamp}
                    </span>
                  </div>

                  {msg.advisorResponse?.advice && (
                    <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl rounded-tl-xs border border-slate-200 shadow-sm text-slate-800">
                      {/* Summary */}
                      <p className="text-sm leading-relaxed text-slate-700">
                        {msg.advisorResponse.advice.summary}
                      </p>

                      {/* Semester Guidance Alert Box */}
                      {msg.advisorResponse.advice.semester_guidance && (
                        <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                          <TrendingUp className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-semibold block mb-0.5">Semester Cap & Velocity Strategy:</strong>
                            {msg.advisorResponse.advice.semester_guidance}
                          </div>
                        </div>
                      )}

                      {/* Category Strategy Breakdown */}
                      {msg.advisorResponse.advice.category_strategy?.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-indigo-600" />
                            Category Headroom Strategies
                          </h4>
                          <div className="grid gap-1.5">
                            {msg.advisorResponse.advice.category_strategy.map((strat, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{strat}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommended Activities Cards */}
                      {msg.advisorResponse.advice.recommended_activities?.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                            Recommended High-Yield Activities
                          </h4>
                          <div className="grid sm:grid-cols-2 gap-2">
                            {msg.advisorResponse.advice.recommended_activities.map((act) => (
                              <div
                                key={act.id}
                                className="p-3 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-indigo-50/30 hover:border-indigo-300 transition-all flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                      {act.category_name}
                                    </span>
                                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                                      +{act.base_points} pts
                                    </span>
                                  </div>
                                  <h5 className="font-semibold text-xs text-slate-900 leading-snug">
                                    {act.title}
                                  </h5>
                                  {act.venue_or_criteria && (
                                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                                      {act.venue_or_criteria}
                                    </p>
                                  )}
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                                  <span className="capitalize">Source: {act.source}</span>
                                  <span className="text-indigo-600 font-medium flex items-center">
                                    Eligible <ChevronRight className="w-3 h-3" />
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-2.5 text-xs text-slate-600">
              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold animate-pulse">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-white p-3.5 rounded-2xl rounded-tl-xs border border-slate-200 shadow-xs flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-600 animate-spin" />
                <span className="text-slate-600">
                  Retrieving institutional knowledge graph context & calculating headroom...
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2 bg-slate-100/70 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap mr-1">
            Suggested:
          </span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuery(p)}
              disabled={isLoading}
              className="text-xs px-2.5 py-1 rounded-full bg-white border border-slate-300 text-slate-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors whitespace-nowrap disabled:opacity-50 shrink-0 shadow-2xs"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuery(inputValue);
          }}
          className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask AI Advisor about your activity points, caps, or rules..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-50 text-slate-900"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-sm"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
