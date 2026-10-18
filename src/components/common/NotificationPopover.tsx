import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { RoleBadge } from './Badge';
import {
  Bell,
  Calendar,
  MapPin,
  Clock,
  CheckCheck,
  Send,
  Plus,
  X,
  Users,
  MessageSquare,
  Sparkles,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export interface AppNotification {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'hod' | 'mentor' | 'student';
  recipient_id?: string | null;
  recipient_role?: string | null;
  category: string;
  title: string;
  message: string;
  meeting_time?: string | null;
  meeting_venue?: string | null;
  is_read: number;
  created_at: string;
}

export const NotificationPopover: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [recipientsList, setRecipientsList] = useState<any[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingVenue, setMeetingVenue] = useState('');
  const [targetId, setTargetId] = useState<string>(''); // empty string = all in target role

  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await apiRequest<{ notifications: AppNotification[]; unread_count: number }>(
        '/api/notifications'
      );
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const fetchRecipients = async () => {
    try {
      const res = await apiRequest<any[]>('/api/notifications/recipients');
      setRecipientsList(res || []);
    } catch (err) {
      console.error('Failed to fetch recipients:', err);
    }
  };

  // Poll in background for real-time notifications
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    fetchRecipients();

    // Fast polling (every 4s) when popover is open, background polling (every 12s) when closed
    const intervalTime = isOpen ? 4000 : 12000;
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, intervalTime);

    return () => clearInterval(interval);
  }, [user, isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await apiRequest('/api/notifications/mark-read', { method: 'POST' });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setIsSending(true);
    try {
      await apiRequest('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          category: 'meeting',
          meeting_time: meetingTime.trim() || undefined,
          meeting_venue: meetingVenue.trim() || undefined,
          recipient_id: targetId ? targetId : undefined,
        }),
      });

      // Reset form
      setTitle('');
      setMessage('');
      setMeetingTime('');
      setMeetingVenue('');
      setTargetId('');
      setShowCompose(false);

      // Instantly refresh list
      await fetchNotifications(true);
    } catch (err) {
      console.error('Failed to send notification:', err);
    } finally {
      setIsSending(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) {
            handleMarkAllRead();
          }
        }}
        className="p-2 rounded-xl text-blue-200 hover:text-white hover:bg-blue-900/60 transition relative cursor-pointer"
        aria-label="Notifications"
        title="Notifications & Meeting Updates"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 ? (
          <span className="absolute top-1 right-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-rose-500 text-white ring-2 ring-[#172554] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-[#172554]" />
        )}
      </button>

      {/* Popover Message Space */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 text-slate-800 z-50 overflow-hidden flex flex-col max-h-[85vh]">
          {/* Popover Header */}
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-sky-400" />
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-white">
                  Meeting & Notice Board
                </h3>
                <p className="text-[10px] text-slate-400">Real-time faculty & student updates</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowCompose(!showCompose)}
                className="px-2 py-1 rounded-lg text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 transition cursor-pointer"
                title={user?.role === 'student' ? 'Send Meeting Request' : 'Post Meeting Announcement'}
              >
                {showCompose ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                <span>{showCompose ? 'Close' : user?.role === 'student' ? 'Request' : 'Post Alert'}</span>
              </button>
            </div>
          </div>

          {/* Quick Compose Area (HOD to Mentor, Mentor to Mentee, Student to Mentor) */}
          {showCompose && (
            <form onSubmit={handleSendNotification} className="p-3 bg-indigo-50/70 border-b border-indigo-100 space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-950 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-indigo-600" />
                  <span>
                    {user?.role === 'hod'
                      ? 'New Meeting Alert for Mentors'
                      : user?.role === 'mentor'
                      ? 'New Meeting Alert for Mentees'
                      : 'Send Meeting Request to Mentor'}
                  </span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Real-time update</span>
              </div>

              {/* Target Recipient Selector */}
              {user?.role !== 'student' && recipientsList.length > 0 && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Send To:</label>
                  <select
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full text-xs p-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 outline-hidden"
                  >
                    <option value="">
                      {user?.role === 'hod' ? '📢 All Faculty Mentors (Broadcast)' : '📢 All Assigned Mentees (Broadcast)'}
                    </option>
                    {recipientsList.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.roll_no ? `(${r.roll_no})` : r.designation ? `(${r.designation})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Meeting Title */}
              <div>
                <input
                  type="text"
                  placeholder={
                    user?.role === 'hod'
                      ? 'Meeting Title (e.g., Department Review Meeting)'
                      : user?.role === 'mentor'
                      ? 'Meeting Title (e.g., Physical Certificate Verification)'
                      : 'Meeting Subject (e.g., AWS Certificate Verification)'
                  }
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Date/Time and Venue Row */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Time (e.g., Tomorrow, 11 AM)"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full text-xs pl-6 pr-2 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 outline-hidden"
                  />
                  <Clock className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Venue (e.g., Room 204)"
                    value={meetingVenue}
                    onChange={(e) => setMeetingVenue(e.target.value)}
                    className="w-full text-xs pl-6 pr-2 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 outline-hidden"
                  />
                  <MapPin className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                </div>
              </div>

              {/* Message Details */}
              <div>
                <textarea
                  placeholder="Enter message details, instructions, or agenda..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={2}
                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowCompose(false)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200/80 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending || !title.trim() || !message.trim()}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isSending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                  <span>{isSending ? 'Sending...' : 'Send Alert'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Notifications Message List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1.5 space-y-1">
            {isLoading && notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center space-y-1.5">
                <Bell className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="font-bold text-xs text-slate-700">No meeting notifications yet</p>
                <p className="text-[11px] text-slate-400">Meeting announcements will appear here live.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-2.5 rounded-xl transition ${
                    n.is_read === 0 && n.sender_id !== user?.id
                      ? 'bg-blue-50/70 border border-blue-200/80 shadow-2xs'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  {/* Item Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <RoleBadge role={n.sender_role} />
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {n.sender_name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {formatTimeAgo(n.created_at)}
                    </span>
                  </div>

                  {/* Title & Message */}
                  <div className="mt-1">
                    <h4 className="font-bold text-xs text-slate-900 leading-snug">
                      {n.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed break-words">
                      {n.message}
                    </p>
                  </div>

                  {/* Meeting Time & Venue Badges */}
                  {(n.meeting_time || n.meeting_venue) && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                      {n.meeting_time && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span>{n.meeting_time}</span>
                        </span>
                      )}
                      {n.meeting_venue && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span className="truncate max-w-[140px]">{n.meeting_venue}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0 px-3">
            <span>Real-time meeting sync</span>
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
