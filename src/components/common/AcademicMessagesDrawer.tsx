import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import {
  MessageSquare,
  X,
  Send,
  UserCheck,
  UserX,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCheck,
  Info,
  ChevronDown,
  User,
  GraduationCap,
} from 'lucide-react';

interface AcademicMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  recipient_id: string;
  recipient_name: string;
  recipient_role: string;
  subject?: string;
  message: string;
  category: string;
  is_read: number;
  created_at: string;
}

interface MentorData {
  id: string;
  name: string;
  email: string;
  designation?: string | null;
  office_location?: string | null;
}

interface MenteeData {
  id: string;
  name: string;
  roll_no: string;
  email: string;
  semester: number;
}

interface AcademicMessagesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AcademicMessagesDrawer: React.FC<AcademicMessagesDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();

  // State
  const [messages, setMessages] = useState<AcademicMessage[]>([]);
  const [isAllocated, setIsAllocated] = useState<boolean>(true);
  const [mentor, setMentor] = useState<MentorData | null>(null);
  const [activeMentees, setActiveMentees] = useState<MenteeData[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<MenteeData | null>(null);

  const [inputMessage, setInputMessage] = useState<string>('');
  const [inputCategory, setInputCategory] = useState<string>('certificate_query');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch status & conversation
  const loadConversation = async (silent = false) => {
    if (!user) return;
    if (!silent) setIsLoading(true);
    setErrorMsg(null);

    try {
      if (user.role === 'student') {
        const res = await apiRequest<{
          isAllocated: boolean;
          mentor: MentorData | null;
          messages: AcademicMessage[];
          notice?: string;
        }>('/api/academic-messages/thread');

        setIsAllocated(res.isAllocated);
        setMentor(res.mentor);
        setMessages(res.messages || []);
      } else if (user.role === 'mentor') {
        // First get active mentees status
        const statusRes = await apiRequest<{
          isAllocated: boolean;
          activeMentees?: MenteeData[];
        }>('/api/academic-messages/status');

        const mentees = statusRes.activeMentees || [];
        setActiveMentees(mentees);

        if (mentees.length === 0) {
          setIsAllocated(false);
          setMessages([]);
          return;
        }

        setIsAllocated(true);
        // Default to first mentee if none selected
        const currentTargetId = selectedStudentId || mentees[0]?.id;
        if (!selectedStudentId && mentees[0]?.id) {
          setSelectedStudentId(mentees[0].id);
          setSelectedStudent(mentees[0]);
        }

        if (currentTargetId) {
          const threadRes = await apiRequest<{
            isAllocated: boolean;
            student: MenteeData;
            messages: AcademicMessage[];
          }>(`/api/academic-messages/thread?student_id=${encodeURIComponent(currentTargetId)}`);

          setSelectedStudent(threadRes.student);
          setMessages(threadRes.messages || []);
        }
      }
    } catch (err: any) {
      console.error('Error fetching academic messages:', err);
      setErrorMsg(err.message || 'Failed to load conversation');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Poll for new messages every 4 seconds when drawer is open
  useEffect(() => {
    if (isOpen) {
      loadConversation();
      const interval = setInterval(() => {
        loadConversation(true);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen, selectedStudentId, user]);

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      scrollToBottom();
      // Mark read
      apiRequest('/api/academic-messages/mark-read', {
        method: 'POST',
        body: JSON.stringify({ partner_id: user?.role === 'student' ? mentor?.id : selectedStudentId }),
      }).catch(() => {});
    }
  }, [messages.length, isOpen]);

  // Send message handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    setIsSending(true);
    setErrorMsg(null);

    try {
      const payload: any = {
        message: inputMessage.trim(),
        category: inputCategory,
        subject:
          inputCategory === 'certificate_query'
            ? 'Certificate Submission Inquiry'
            : inputCategory === 'counseling'
            ? 'Mentorship Counseling Request'
            : 'Academic Guidance Note',
      };

      if (user?.role === 'mentor') {
        payload.recipient_id = selectedStudentId;
      }

      const newMsg = await apiRequest<AcademicMessage>('/api/academic-messages', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setMessages((prev) => [...prev, newMsg]);
      setInputMessage('');
      scrollToBottom();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to deliver message');
    } finally {
      setIsSending(false);
    }
  };

  // Quick suggestion chips
  const studentSuggestions = [
    'Uploaded new Hackathon certificate for verification',
    'Clarification on category point cap for NSS/Sports',
    'Request for counseling slot regarding semester credits',
  ];

  const mentorSuggestions = [
    'Please re-upload a clear scan with authorized college seal.',
    'Verified! Points have been cleared on your activity meter.',
    'Please visit my cabin tomorrow at 11:30 AM for verification.',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col border-l border-slate-200">
        {/* Drawer Header */}
        <div className="p-3.5 bg-gradient-to-r from-[#5c873f] via-[#7aa759] to-[#8eb86e] text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight">Academic Messages</span>
                <span className="text-[10px] font-bold bg-white/20 text-white px-1.5 py-0.2 rounded">
                  Official
                </span>
              </div>
              <p className="text-[10.5px] text-white/85">
                Direct Mentee &harr; Faculty Mentor Communication
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white transition cursor-pointer"
            title="Close Drawer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Allocation Info Bar / Mentee Selector */}
        {user?.role === 'student' && (
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            {isAllocated && mentor ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#8eb86e]/20 border border-[#8eb86e]/40 flex items-center justify-center text-[#426b27] font-bold text-xs">
                    {mentor.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-800">{mentor.name}</span>
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        <UserCheck className="w-2.5 h-2.5" />
                        Allocated Mentor
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-500">
                      {mentor.designation || 'Faculty Mentor'} &bull; {mentor.office_location || 'Academic Block'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 p-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                <UserX className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="text-[11px] leading-tight">
                  <span className="font-bold">No Faculty Mentor Currently Allocated</span>
                  <p className="text-[10px] text-amber-800 mt-0.5">
                    Academic messaging is locked until the HOD allocates your department mentor.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {user?.role === 'mentor' && (
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
                Active Assigned Mentees ({activeMentees.length})
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Live Allocation
              </span>
            </div>

            {activeMentees.length > 0 ? (
              <div className="relative">
                <select
                  value={selectedStudentId}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    const found = activeMentees.find((m) => m.id === e.target.value);
                    setSelectedStudent(found || null);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-[#8eb86e] focus:outline-none cursor-pointer"
                >
                  {activeMentees.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.roll_no}) &bull; Sem {m.semester}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-center gap-2 text-xs">
                <UserX className="w-4 h-4 text-amber-600 shrink-0" />
                <span>No mentees are currently allocated to you.</span>
              </div>
            )}
          </div>
        )}

        {/* Message Thread Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100/60 text-xs">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-48 text-slate-400">
              <span className="text-xs">Loading academic conversation...</span>
            </div>
          ) : !isAllocated ? (
            <div className="p-6 text-center space-y-3 bg-white rounded-2xl border border-dashed border-slate-300 my-8">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <UserX className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-800">Messaging Inactive</h4>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  {user?.role === 'student'
                    ? 'You have been deallocated or are awaiting mentor assignment. Once an HOD assigns your mentor, this thread will automatically unlock.'
                    : 'You currently have no mentees assigned. Academic messaging activates as soon as students are allocated to you.'}
                </p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="p-6 text-center space-y-2 bg-white rounded-2xl border border-slate-200 my-8">
              <div className="w-10 h-10 mx-auto rounded-full bg-[#8eb86e]/15 text-[#5c873f] flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-800">No Messages Yet</h4>
              <p className="text-[11px] text-slate-500">
                Start the conversation with your {user?.role === 'student' ? 'mentor' : 'mentee'} below.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center gap-1.5 px-1 text-[10px] text-slate-400">
                    <span className="font-bold text-slate-600">{msg.sender_name}</span>
                    <span>&bull;</span>
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs leading-relaxed ${
                      isMe
                        ? 'bg-[#8eb86e] text-white rounded-tr-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                    }`}
                  >
                    {msg.subject && (
                      <div
                        className={`text-[10px] font-bold mb-1 pb-1 border-b uppercase tracking-wider ${
                          isMe ? 'border-white/20 text-white/90' : 'border-slate-100 text-[#5c873f]'
                        }`}
                      >
                        {msg.subject}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        {isAllocated && (
          <div className="p-2.5 bg-slate-50 border-t border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#8eb86e]" />
              <span>Quick Inquiry Templates</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
              {(user?.role === 'student' ? studentSuggestions : mentorSuggestions).map(
                (text, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInputMessage(text)}
                    className="shrink-0 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-[#8eb86e] hover:text-[#5c873f] hover:bg-[#8eb86e]/5 transition text-[10.5px] cursor-pointer"
                  >
                    {text}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Message Input Form */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 bg-white border-t border-slate-200 flex flex-col gap-2"
        >
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold">Category:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setInputCategory('certificate_query')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                  inputCategory === 'certificate_query'
                    ? 'bg-[#8eb86e] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Certificate Query
              </button>
              <button
                type="button"
                onClick={() => setInputCategory('counseling')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                  inputCategory === 'counseling'
                    ? 'bg-[#8eb86e] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Counseling
              </button>
              <button
                type="button"
                onClick={() => setInputCategory('general')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                  inputCategory === 'general'
                    ? 'bg-[#8eb86e] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                General
              </button>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={!isAllocated || isSending}
              placeholder={
                !isAllocated
                  ? 'Messaging disabled: no active mentor/mentee allocation'
                  : user?.role === 'student'
                  ? `Message Prof. ${mentor?.name || 'Mentor'}...`
                  : `Reply to ${selectedStudent?.name || 'mentee'}...`
              }
              rows={2}
              className="flex-1 p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#8eb86e] focus:bg-white focus:outline-none resize-none disabled:bg-slate-100 disabled:cursor-not-allowed text-slate-800 placeholder:text-slate-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />

            <button
              type="submit"
              disabled={!isAllocated || !inputMessage.trim() || isSending}
              className="h-10 px-3.5 rounded-xl bg-[#8eb86e] hover:bg-[#7eb462] text-white font-bold flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
              title="Send Message"
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>Press Enter to send &bull; Shift + Enter for new line</span>
            <span className="text-[#5c873f] font-semibold">AICTE Autonomous Audit Tracked</span>
          </div>
        </form>
      </div>
    </div>
  );
};
